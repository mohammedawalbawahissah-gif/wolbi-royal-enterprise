from django.db import models
from django.core.mail import send_mail
from django.conf import settings


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

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} — {self.get_inquiry_type_display()}"

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        super().save(*args, **kwargs)
        if is_new:
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
            except Exception:
                pass
