from django.db import models
from accounts.models import User


class Notification(models.Model):
    """In-app notification shown in the dashboard bell for one staff user."""

    class Kind(models.TextChoices):
        LEAD             = "LEAD",             "New request"
        LEAD_ESCALATION  = "LEAD_ESCALATION",  "AI concierge hand-off"
        TELECONSULTATION = "TELECONSULTATION", "Teleconsultation"
        VOLUNTEER        = "VOLUNTEER",        "Volunteer application"
        ASSIGNMENT       = "ASSIGNMENT",       "Assignment"
        COMMENT          = "COMMENT",          "Comment"
        SYSTEM           = "SYSTEM",           "System"

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="notifications"
    )

    kind = models.CharField(max_length=20, choices=Kind.choices, default=Kind.SYSTEM)

    title = models.CharField(max_length=255)

    message = models.TextField()

    # Dashboard path to open when the notification is clicked, e.g. "/dashboard/leads"
    link = models.CharField(max_length=300, blank=True)

    is_read = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["user", "is_read"])]

    def __str__(self):
        return self.title


class EmailLog(models.Model):
    """
    One row per outgoing email (client confirmations, staff alerts, replies).
    Lets staff see in /admin/ whether a given email actually went out, and
    why not if it failed — instead of failures vanishing into the logs.
    """

    class Status(models.TextChoices):
        QUEUED = "QUEUED", "Queued"
        SENT   = "SENT",   "Sent"
        FAILED = "FAILED", "Failed"

    class Audience(models.TextChoices):
        CLIENT = "CLIENT", "Client"
        STAFF  = "STAFF",  "Staff"

    to          = models.CharField(max_length=500)
    subject     = models.CharField(max_length=300)
    audience    = models.CharField(max_length=10, choices=Audience.choices)
    kind        = models.CharField(max_length=40, blank=True, help_text="Which event sent it, e.g. lead_confirmation")
    status      = models.CharField(max_length=10, choices=Status.choices, default=Status.QUEUED)
    error       = models.TextField(blank=True)
    provider_id = models.CharField(max_length=100, blank=True, help_text="Resend message id")
    attempts    = models.PositiveSmallIntegerField(default=0)

    # Rendered content kept so a failed email can be re-sent from the admin
    text_body = models.TextField(blank=True)
    html_body = models.TextField(blank=True)
    reply_to  = models.CharField(max_length=300, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    sent_at    = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["status", "created_at"])]

    def __str__(self):
        return f"{self.get_status_display()}: {self.subject} → {self.to}"
