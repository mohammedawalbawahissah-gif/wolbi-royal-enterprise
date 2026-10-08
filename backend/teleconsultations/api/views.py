import logging
import secrets
import threading

from django.utils import timezone
from rest_framework import generics, mixins, viewsets
from rest_framework import serializers as drf
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from accounts.permissions import IsStaff
from notifications import events
from teleconsultations import scheduling
from teleconsultations.models import ConsultationSession
from teleconsultations.services import (
    DailyServiceUnavailable, create_meeting_token, delete_room, ensure_room,
)
from .serializers import (
    ConsultationRequestSerializer,
    ConsultationSessionSerializer,
    ConsultationStatusSerializer,
    validate_future_time,
)

logger = logging.getLogger(__name__)
S = ConsultationSession.Status

# Which staff role handles which division — mirrors accounts.User.Role.
_DIVISION_ROLE = {
    ConsultationSession.Division.MEDICAL: "MEDICAL",
    ConsultationSession.Division.VIRTUAL: "VA",
}


def _staff_for_session(session):
    """Who should hear about a new request. Instant calls go to staff who've
    marked themselves available (falling back to the whole division plus
    admins so nothing is silently dropped). Scheduled bookings go to the whole
    division, since nobody needs to be online at booking time."""
    role = _DIVISION_ROLE.get(session.division)
    everyone = list(User.objects.filter(role__in=[role, "ADMIN"], is_active=True))
    if session.mode == ConsultationSession.Mode.SCHEDULED:
        return everyone
    available = list(User.objects.filter(role=role, is_active=True, is_available_for_calls=True))
    return available or everyone


def _client_session(request, pk):
    """The session identified by pk + the secret token from the client's link, or None.
    A wrong token looks exactly like a missing session, so ids can't be probed."""
    token = (request.data.get("token") or request.query_params.get("token") or "").strip()
    try:
        session = ConsultationSession.objects.get(pk=pk)
    except ConsultationSession.DoesNotExist:
        return None
    if not token or not secrets.compare_digest(token, session.access_token):
        return None
    return session


def _not_found():
    return Response({"error": "Session not found"}, status=404)


def _join_error(session, state, staff=False):
    """Friendly, specific reason someone can't enter the room yet."""
    if state == "too_early":
        opens = session.join_window(staff)[0]
        return Response({"error": "It's not time to join yet.", "code": "too_early",
                         "join_opens_at": opens}, status=409)
    if state == "ended":
        return Response({"error": "This session has ended.", "code": "ended"}, status=409)
    return Response({"error": "This session isn't ready to join yet.", "code": "waiting"}, status=409)


def _issue_call(session, name, *, is_owner):
    """Create/reuse the room and mint a personal meeting token."""
    room_url, room_name, expires_at = ensure_room(session)
    token = create_meeting_token(room_name, name, is_owner=is_owner, expires_at=expires_at)
    if not session.started_at:
        session.started_at = timezone.now()
        session.save(update_fields=["started_at", "updated_at"])
    return {"room_url": room_url, "token": token}


class ConsultationRequestView(generics.CreateAPIView):
    """Public: start an instant request or book a scheduled session."""
    queryset = ConsultationSession.objects.all()
    serializer_class = ConsultationRequestSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        session = serializer.save()
        # Client confirmation + staff alerts; emails go out in the background
        events.consultation_requested(session, _staff_for_session(session))


class ConsultationStatusView(APIView):
    """Public (token required): what the booking page polls — whether staff has
    claimed/confirmed the session, and whether the client can join yet."""
    permission_classes = [AllowAny]

    def get(self, request, pk=None):
        scheduling.run_housekeeping_throttled()
        session = _client_session(request, pk)
        if not session:
            return _not_found()
        return Response(ConsultationStatusSerializer(session).data)


class ConsultationJoinView(APIView):
    """Public (token required): get this client's own Daily token and room URL
    once the session is live (instant) or inside its join window (scheduled)."""
    permission_classes = [AllowAny]

    def post(self, request, pk=None):
        session = _client_session(request, pk)
        if not session:
            return _not_found()
        state = session.join_state()
        if state != "ok":
            return _join_error(session, state)
        try:
            return Response(_issue_call(session, session.name, is_owner=False))
        except DailyServiceUnavailable as e:
            return Response({"error": str(e), "code": "unavailable"}, status=503)


class ConsultationClientCancelView(APIView):
    """Public (token required): the client cancels their own session."""
    permission_classes = [AllowAny]

    def post(self, request, pk=None):
        session = _client_session(request, pk)
        if not session:
            return _not_found()
        if session.status not in (S.REQUESTED, S.CONFIRMED):
            return Response({"error": "This session can no longer be cancelled online. "
                                      "Please reply to your email."}, status=409)
        scheduling.cancel_session(session, by="client")
        return Response(ConsultationStatusSerializer(session).data)


class ConsultationClientRescheduleView(APIView):
    """Public (token required): the client proposes a new time. Staff must
    confirm it again. Also turns an instant request nobody picked up into a
    scheduled one ("schedule for later instead")."""
    permission_classes = [AllowAny]

    def post(self, request, pk=None):
        session = _client_session(request, pk)
        if not session:
            return _not_found()
        if session.status not in (S.REQUESTED, S.CONFIRMED):
            return Response({"error": "This session can no longer be changed online."}, status=409)

        try:
            raw = drf.DateTimeField().to_internal_value(request.data.get("scheduled_time"))
            new_time = validate_future_time(raw)
        except drf.ValidationError as e:
            return Response({"scheduled_time": e.detail}, status=400)

        scheduling.reschedule_session(session, new_time, by="client")
        return Response(ConsultationStatusSerializer(session).data)


class StaffConsultationViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """
    Staff dashboard: list sessions and act on them. MEDICAL/VA staff see only
    their own division's sessions; ADMIN sees everything. Sessions are created
    by visitors through the public endpoints, never edited in place here —
    every change goes through one of the actions below.
    """
    serializer_class = ConsultationSessionSerializer
    permission_classes = [IsStaff]

    def get_queryset(self):
        qs = ConsultationSession.objects.select_related("assigned_staff")
        role = self.request.user.role
        if role in _DIVISION_ROLE.values():
            matching_division = [d for d, r in _DIVISION_ROLE.items() if r == role]
            qs = qs.filter(division__in=matching_division)
        return qs

    def list(self, request, *args, **kwargs):
        scheduling.run_housekeeping_throttled()
        return super().list(request, *args, **kwargs)

    def _respond(self, session):
        session.refresh_from_db()
        return Response(ConsultationSessionSerializer(session).data)

    @action(detail=True, methods=["post"])
    def claim(self, request, pk=None):
        """Instant request: accept it and open the room right now."""
        session = self.get_object()
        if session.status != S.REQUESTED:
            return Response({"error": "This session has already been claimed or closed"}, status=409)
        if session.is_scheduled:
            return Response({"error": "This is a scheduled booking — confirm it instead."}, status=409)
        try:
            ensure_room(session)
        except DailyServiceUnavailable as e:
            return Response({"error": str(e)}, status=503)
        session.assigned_staff = request.user
        session.status = S.CLAIMED
        session.confirmed_at = timezone.now()
        session.save(update_fields=["assigned_staff", "status", "confirmed_at", "updated_at"])
        events.consultation_claimed(session)
        return self._respond(session)

    @action(detail=True, methods=["post"])
    def confirm(self, request, pk=None):
        """Scheduled booking: accept it (optionally moving it to a different
        time). No video room is created yet — it opens shortly before the start."""
        session = self.get_object()
        if not session.is_scheduled or session.status != S.REQUESTED:
            return Response({"error": "Only a requested, scheduled booking can be confirmed."}, status=409)

        new_time = None
        if request.data.get("scheduled_time"):
            try:
                new_time = validate_future_time(
                    drf.DateTimeField().to_internal_value(request.data["scheduled_time"]), min_lead=0)
            except drf.ValidationError as e:
                return Response({"scheduled_time": e.detail}, status=400)
        scheduling.confirm_session(session, request.user, new_time)
        return self._respond(session)

    @action(detail=True, methods=["post"])
    def reschedule(self, request, pk=None):
        """Staff moves a scheduled booking to a new time; the client is emailed."""
        session = self.get_object()
        if not session.is_scheduled or session.status not in (S.REQUESTED, S.CONFIRMED):
            return Response({"error": "Only a requested or confirmed booking can be rescheduled."}, status=409)
        try:
            new_time = validate_future_time(
                drf.DateTimeField().to_internal_value(request.data.get("scheduled_time")), min_lead=0)
        except drf.ValidationError as e:
            return Response({"scheduled_time": e.detail}, status=400)
        scheduling.reschedule_session(session, new_time, by="staff", staff=request.user)
        return self._respond(session)

    @action(detail=True, methods=["post"])
    def join(self, request, pk=None):
        """Staff enters the room with owner privileges: any time an instant
        session is live, or from 30 minutes before a scheduled start."""
        session = self.get_object()
        state = session.join_state(staff=True)
        if state != "ok":
            return _join_error(session, state, staff=True)
        try:
            data = _issue_call(session, request.user.get_full_name() or request.user.username, is_owner=True)
        except DailyServiceUnavailable as e:
            return Response({"error": str(e), "code": "unavailable"}, status=503)
        if session.status == S.CONFIRMED:
            session.status = S.CLAIMED
            if not session.assigned_staff_id:
                session.assigned_staff = request.user
            session.save(update_fields=["status", "assigned_staff", "updated_at"])
        return Response(data)

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        session = self.get_object()
        if session.status in (S.COMPLETED, S.CANCELLED, S.MISSED):
            return Response({"error": "This session is already closed."}, status=409)
        session.status = S.COMPLETED
        session.ended_at = timezone.now()
        session.save(update_fields=["status", "ended_at", "updated_at"])
        if session.room_name:
            threading.Thread(target=delete_room, args=(session.room_name,), daemon=True).start()
        events.consultation_completed(session)
        return self._respond(session)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        session = self.get_object()
        if session.status in (S.COMPLETED, S.CANCELLED, S.MISSED):
            return Response({"error": "This session is already closed."}, status=409)
        scheduling.cancel_session(session, by="staff")
        return self._respond(session)
