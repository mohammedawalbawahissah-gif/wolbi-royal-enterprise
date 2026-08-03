import logging

from django.conf import settings
from django.core.mail import send_mail
from rest_framework import viewsets, generics
from rest_framework.permissions import AllowAny
from rest_framework.decorators import action
from rest_framework.response import Response

from ..models import Lead, LeadReply
from .serializers import LeadSerializer, LeadAdminSerializer, LeadReplySerializer
from accounts.permissions import IsAdmin, IsStaff
from core.services.ai import AIServiceUnavailable

logger = logging.getLogger(__name__)


class LeadViewSet(viewsets.ModelViewSet):
    queryset = Lead.objects.all().order_by("-created_at")

    def get_serializer_class(self):
        if self.request.user.is_authenticated and self.request.user.role in ["ADMIN", "MEDICAL", "VA", "FOUNDATION"]:
            return LeadAdminSerializer
        return LeadSerializer

    def get_permissions(self):
        if self.action == "create":
            return [AllowAny()]
        if self.action in ["update", "partial_update", "destroy"]:
            return [IsAdmin()]
        if self.action == "list":
            return [IsStaff()]
        return [IsStaff()]

    @action(detail=True, methods=["post"], permission_classes=[IsStaff])
    def mark_contacted(self, request, pk=None):
        lead = self.get_object()
        lead.is_contacted = True
        lead.save()
        return Response({"status": "marked as contacted"})

    @action(detail=True, methods=["post"], permission_classes=[IsStaff])
    def ai_retriage(self, request, pk=None):
        """Manually re-run AI triage (e.g. after notes were added, or if it
        failed the first time). Runs synchronously so the UI can show the
        result immediately instead of polling."""
        lead = self.get_object()
        try:
            lead._run_ai_triage()
        except AIServiceUnavailable as e:
            return Response({"error": str(e)}, status=503)
        lead.refresh_from_db()
        return Response(LeadAdminSerializer(lead).data)

    @action(detail=True, methods=["post"], permission_classes=[IsStaff])
    def reply(self, request, pk=None):
        """
        Sends an actual email reply to the lead (via the same Resend SMTP
        backend already configured for the rest of the site), records it as
        a LeadReply for the conversation thread, and auto-marks the lead as
        contacted. This is the actual "follow up" action the dashboard was
        missing — Mark Contacted and Re-run AI Triage never sent anything to
        the lead themselves.
        """
        lead = self.get_object()
        message = (request.data.get("message") or "").strip()
        if not message:
            return Response({"error": "message is required"}, status=400)
        if len(message) > 5000:
            return Response({"error": "message is too long"}, status=400)

        reply = LeadReply.objects.create(lead=lead, staff=request.user, message=message)

        try:
            send_mail(
                subject=f"Re: {lead.subject}",
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[lead.email],
                fail_silently=False,
            )
            reply.email_sent = True
            reply.save(update_fields=["email_sent"])
        except Exception as e:
            logger.warning(f"Lead reply email failed for lead {lead.pk}: {e}")

        if not lead.is_contacted:
            lead.is_contacted = True
            lead.save(update_fields=["is_contacted"])

        return Response(LeadReplySerializer(reply).data, status=201)
