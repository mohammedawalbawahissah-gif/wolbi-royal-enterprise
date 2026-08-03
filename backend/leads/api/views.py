import logging
import threading

from django.conf import settings
from django.core.mail import send_mail
from rest_framework import viewsets, generics
from rest_framework.permissions import AllowAny
from rest_framework.decorators import action
from rest_framework.response import Response

from ..models import Lead, LeadReply
from .serializers import LeadSerializer, LeadAdminSerializer, LeadReplySerializer
from accounts.permissions import IsAdmin, IsStaff
from core.services.ai import ask_ai, AIServiceUnavailable

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
    def suggest_reply(self, request, pk=None):
        """
        Drafts a reply for staff to review/edit before sending — never sent
        automatically. Runs synchronously (unlike the reply email itself)
        because the UI is actively waiting on this one to fill the textarea.
        """
        lead = self.get_object()
        system_prompt = (
            "You draft short, warm, professional email replies on behalf of Mohammed, "
            "founder of Wolbi Royal Enterprise (a Ghanaian group spanning Technology, "
            "Medical Services, Virtual Solutions, and Foundation divisions), replying to "
            "an inbound lead. Write 2-4 sentences: acknowledge their specific request, "
            "give one concrete next step (e.g. proposing a call, asking one clarifying "
            "question, or confirming next steps), and sign off as Mohammed. No subject "
            "line, no placeholders like [insert X] — if you don't have a specific detail, "
            "phrase around it naturally instead of leaving a gap. Plain text only, no "
            "markdown."
        )
        user_prompt = (
            f"Lead name: {lead.name}\nInquiry type: {lead.inquiry_type}\n"
            f"Subject: {lead.subject}\nMessage: {lead.message}\n"
            f"AI summary (if any): {lead.ai_summary or 'N/A'}"
        )
        try:
            draft = ask_ai(system_prompt, user_prompt, max_tokens=300)
        except AIServiceUnavailable as e:
            return Response({"error": str(e)}, status=503)
        return Response({"draft": draft})

    @action(detail=True, methods=["post"], permission_classes=[IsStaff])
    def reply(self, request, pk=None):
        """
        Sends an actual email reply to the lead and records it as a
        LeadReply. The email send itself runs in a background thread
        (matching the pattern Lead._send_notification_email already uses)
        so a slow/hanging SMTP connection can never block this request —
        that was the cause of the 502s: send_mail() was blocking the
        request/response cycle directly, and a hung SMTP connection dragged
        it past gunicorn's worker timeout, which Railway's edge then
        surfaced as a 502 with no CORS headers (since the response never
        actually came from Django).
        """
        lead = self.get_object()
        message = (request.data.get("message") or "").strip()
        if not message:
            return Response({"error": "message is required"}, status=400)
        if len(message) > 5000:
            return Response({"error": "message is too long"}, status=400)

        reply = LeadReply.objects.create(lead=lead, staff=request.user, message=message)

        def _send():
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

        threading.Thread(target=_send, daemon=True).start()

        if not lead.is_contacted:
            lead.is_contacted = True
            lead.save(update_fields=["is_contacted"])

        return Response(LeadReplySerializer(reply).data, status=201)
