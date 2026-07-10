import logging
import threading

from django.db import models
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)


class Lead(models.Model):

    class InquiryType(models.TextChoices):
        GENERAL     = "GENERAL",     "General Inquiry"
        TECHNOLOGY  = "TECHNOLOGY",  "Wolbi Technologies"
        MEDICAL     = "MEDICAL",     "Wolbi Medical Services"
        VIRTUAL     = "VIRTUAL",     "Wolbi Virtual Solutions"
        FOUNDATION  = "FOUNDATION",  "Wolbi Foundation"
        AGRICULTURE = "AGRICULTURE", "FarmaSyst / Agriculture"
        PARTNERSHIP = "PARTNERSHIP", "Partnership"
        DEMO        = "DEMO",        "Product Demo Request"

    name         = models.CharField(max_length=200)
    email        = models.EmailField()
    phone        = models.CharField(max_length=30, blank=True)
    organization = models.CharField(max_length=200, blank=True)
    subject      = models.CharField(max_length=300)
    message      = models.TextField()
    inquiry_type = models.CharField(max_length=20, choices=InquiryType.choices, default=InquiryType.GENERAL)

    # Demo / product request extras
    product_interest = models.CharField(max_length=100, blank=True)

    is_contacted = models.BooleanField(default=False)
    notes        = models.TextField(blank=True, help_text="Internal notes")
    created_at   = models.DateTimeField(auto_now_add=True)

    class Priority(models.TextChoices):
        LOW    = "LOW",    "Low"
        MEDIUM = "MEDIUM", "Medium"
        HIGH   = "HIGH",   "High"

    # ── AI triage (populated asynchronously right after creation) ──────────
    ai_summary            = models.TextField(blank=True, help_text="AI-generated one-line triage summary")
    ai_priority           = models.CharField(max_length=10, choices=Priority.choices, blank=True)
    ai_suggested_type     = models.CharField(max_length=20, choices=InquiryType.choices, blank=True)
    ai_possible_duplicate = models.BooleanField(default=False)
    ai_processed_at       = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} — {self.get_inquiry_type_display()}"

    def _send_notification_email(self):
        """
        Runs in a background thread so a slow or failing email provider
        NEVER blocks or fails the lead-creation request itself.
        Any error here is logged, not raised.
        """
        try:
            send_mail(
                subject=f"[Wolbi] New Lead: {self.name} — {self.get_inquiry_type_display()}",
                message=(
                    f"Name: {self.name}\n"
                    f"Email: {self.email}\n"
                    f"Phone: {self.phone or 'N/A'}\n"
                    f"Organisation: {self.organization or 'N/A'}\n"
                    f"Type: {self.get_inquiry_type_display()}\n\n"
                    f"Subject: {self.subject}\n\n"
                    f"Message:\n{self.message}"
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[settings.DEFAULT_FROM_EMAIL],
                fail_silently=True,
            )
        except Exception as e:
            # Never let email failures affect the lead record itself.
            logger.warning(f"Lead notification email failed for lead {self.pk}: {e}")

    def _run_ai_triage(self):
        """
        Background AI pass: suggests a priority, a one-line summary for staff,
        a better inquiry_type if the form default looks wrong, and flags likely
        duplicates. Never raises — any failure just leaves the ai_* fields blank.
        """
        from django.utils import timezone
        from core.services.ai import ask_ai_json, AIServiceUnavailable

        try:
            recent_duplicates = list(
                Lead.objects.filter(email__iexact=self.email)
                .exclude(pk=self.pk)
                .order_by("-created_at")[:3]
                .values_list("subject", flat=True)
            )
            data = ask_ai_json(
                system_prompt=(
                    "You triage inbound leads for Wolbi Royal Enterprise, a Ghanaian group with "
                    "divisions in Technology, Medical Services, Virtual Solutions, and Foundation "
                    "(community programs), plus products NeoMatCare (maternal health), FarmaSyst "
                    "(agriculture), and MAGHAZ Assist (real estate/hospitality/construction ERP). "
                    "Given a lead's message, return JSON with keys: "
                    "'summary' (max 20 words, staff-facing, plain language), "
                    "'priority' (LOW, MEDIUM, or HIGH — HIGH only for urgent/high-value/time-sensitive asks), "
                    "'suggested_type' (one of GENERAL, TECHNOLOGY, MEDICAL, VIRTUAL, FOUNDATION, "
                    "AGRICULTURE, PARTNERSHIP, DEMO), "
                    "'possible_duplicate' (true/false, true only if this looks like a repeat of a "
                    "prior inquiry from the same person)."
                ),
                user_prompt=(
                    f"Name: {self.name}\nOrganization: {self.organization or 'N/A'}\n"
                    f"Form-selected inquiry type: {self.get_inquiry_type_display()}\n"
                    f"Subject: {self.subject}\nMessage: {self.message}\n"
                    f"Prior subjects from this email address: {recent_duplicates or 'none'}"
                ),
                max_tokens=300,
            )
            if not data:
                return

            valid_priorities = {c[0] for c in self.Priority.choices}
            valid_types = {c[0] for c in self.InquiryType.choices}

            self.ai_summary = str(data.get("summary", ""))[:500]
            if data.get("priority") in valid_priorities:
                self.ai_priority = data["priority"]
            if data.get("suggested_type") in valid_types:
                self.ai_suggested_type = data["suggested_type"]
            self.ai_possible_duplicate = bool(data.get("possible_duplicate", False))
            self.ai_processed_at = timezone.now()

            super(Lead, self).save(update_fields=[
                "ai_summary", "ai_priority", "ai_suggested_type",
                "ai_possible_duplicate", "ai_processed_at",
            ])
        except AIServiceUnavailable as e:
            logger.info(f"AI triage skipped for lead {self.pk}: {e}")
        except Exception as e:
            logger.warning(f"AI triage failed for lead {self.pk}: {e}")

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        super().save(*args, **kwargs)
        if is_new:
            # Fire-and-forget in daemon threads. The HTTP response returns
            # immediately regardless of how long (or whether) email/AI calls
            # take. This is what prevents the 502 Bad Gateway under load
            # or when a provider is slow/unreachable.
            threading.Thread(target=self._send_notification_email, daemon=True).start()
            threading.Thread(target=self._run_ai_triage, daemon=True).start()
