import logging
import threading

from django.conf import settings
from django.core.mail import send_mail
from rest_framework import viewsets, generics
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.decorators import action
from rest_framework.response import Response

from ..models import ConsultationSession
from .serializers import (
    ConsultationRequestSerializer,
    ConsultationStatusSerializer,
    ConsultationSessionSerializer,
)
from accounts.permissions import IsStaff
from accounts.models import User
from notifications.models import Notification
from teleconsultations.services import (
    create_room, create_meeting_token, delete_room, DailyServiceUnavailable,
)

logger = logging.getLogger(__name__)

# Which staff role handles which division — mirrors accounts.User.Role.
_DIVISION_ROLE = {
    ConsultationSession.Division.MEDICAL: "MEDICAL",
    ConsultationSession.Division.VIRTUAL: "VA",
}


def _notify_available_staff(session):
    """Runs in a background thread (same pattern as Lead's own notification
    email) so the visitor's request never waits on email/notification
    delivery. Notifies staff in the matching division who've marked
    themselves available for calls; falls back to all staff in that
    division plus admins if nobody's currently marked available, so
    instant requests are never silently dropped."""
    try:
        role = _DIVISION_ROLE.get(session.division)
        available = User.objects.filter(role=role, is_available_for_calls=True)
        targets = list(available) or list(User.objects.filter(role__in=[role, "ADMIN"]))

        Notification.objects.bulk_create([
            Notification(
                user=u,
                title=f"New {session.get_mode_display().lower()} teleconsultation request",
                message=f"{session.name} needs a {session.get_division_display()} consultation: {session.reason[:120]}",
            )
            for u in targets
        ])

        send_mail(
            subject=f"[Wolbi] Teleconsultation request — {session.get_division_display()}",
            message=(
                f"Name: {session.name}\nEmail: {session.email}\nPhone: {session.phone or 'N/A'}\n"
                f"Mode: {session.get_mode_display()}\n"
                f"Scheduled: {session.scheduled_time or 'N/A'}\n\nReason:\n{session.reason}"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[settings.DEFAULT_FROM_EMAIL],
            fail_silently=True,
        )
    except Exception as e:
        logger.warning(f"Teleconsultation notification failed for session {session.pk}: {e}")


class ConsultationRequestView(generics.CreateAPIView):
    """Public: start an instant request or book a scheduled session."""
    queryset = ConsultationSession.objects.all()
    serializer_class = ConsultationRequestSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        session = serializer.save()
        threading.Thread(target=_notify_available_staff, args=(session,), daemon=True).start()


class ConsultationStatusView(generics.RetrieveAPIView):
    """Public: the booking page polls this to see if staff has claimed the
    session yet (instant) or as a reminder of scheduled details."""
    queryset = ConsultationSession.objects.all()
    serializer_class = ConsultationStatusSerializer
    permission_classes = [AllowAny]


class ConsultationJoinView(APIView):
    """
    Public: once claimed, the visitor calls this (with their email, as a
    lightweight check against the session record) to get their own Daily
    meeting token and room URL.
    """
    permission_classes = [AllowAny]

    def post(self, request, pk=None):
        try:
            session = ConsultationSession.objects.get(pk=pk)
        except ConsultationSession.DoesNotExist:
            return Response({"error": "Session not found"}, status=404)

        if (request.data.get("email") or "").strip().lower() != session.email.lower():
            return Response({"error": "Email does not match this session"}, status=403)

        if session.status != ConsultationSession.Status.CLAIMED or not session.room_name:
            return Response({"error": "This session isn't ready to join yet"}, status=409)

        try:
            token = create_meeting_token(session.room_name, session.name, is_owner=False)
        except DailyServiceUnavailable as e:
            return Response({"error": str(e)}, status=503)

        return Response({"room_url": session.room_url, "token": token})


class StaffConsultationViewSet(viewsets.ModelViewSet):
    """
    Staff dashboard: list/manage sessions. MEDICAL/VA staff see only their
    own division's sessions; ADMIN sees everything.
    """
    serializer_class = ConsultationSessionSerializer
    permission_classes = [IsStaff]

    def get_queryset(self):
        qs = ConsultationSession.objects.all()
        role = self.request.user.role
        if role in _DIVISION_ROLE.values():
            matching_division = [d for d, r in _DIVISION_ROLE.items() if r == role]
            qs = qs.filter(division__in=matching_division)
        return qs

    @action(detail=True, methods=["post"])
    def claim(self, request, pk=None):
        session = self.get_object()
        if session.status not in (ConsultationSession.Status.REQUESTED,):
            return Response({"error": "This session has already been claimed or closed"}, status=409)

        try:
            room = create_room(session.pk)
        except DailyServiceUnavailable as e:
            return Response({"error": str(e)}, status=503)

        session.assigned_staff = request.user
        session.room_name = room["name"]
        session.room_url = room["url"]
        session.status = ConsultationSession.Status.CLAIMED
        session.save(update_fields=["assigned_staff", "room_name", "room_url", "status", "updated_at"])
        return Response(ConsultationSessionSerializer(session).data)

    @action(detail=True, methods=["post"])
    def join(self, request, pk=None):
        """Staff joins their claimed session with owner privileges."""
        session = self.get_object()
        if session.status != ConsultationSession.Status.CLAIMED or not session.room_name:
            return Response({"error": "Session isn't active"}, status=409)
        try:
            token = create_meeting_token(session.room_name, request.user.get_full_name() or request.user.username, is_owner=True)
        except DailyServiceUnavailable as e:
            return Response({"error": str(e)}, status=503)
        return Response({"room_url": session.room_url, "token": token})

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        session = self.get_object()
        session.status = ConsultationSession.Status.COMPLETED
        session.save(update_fields=["status", "updated_at"])
        if session.room_name:
            threading.Thread(target=delete_room, args=(session.room_name,), daemon=True).start()
        return Response(ConsultationSessionSerializer(session).data)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        session = self.get_object()
        session.status = ConsultationSession.Status.CANCELLED
        session.save(update_fields=["status", "updated_at"])
        if session.room_name:
            threading.Thread(target=delete_room, args=(session.room_name,), daemon=True).start()
        return Response(ConsultationSessionSerializer(session).data)
