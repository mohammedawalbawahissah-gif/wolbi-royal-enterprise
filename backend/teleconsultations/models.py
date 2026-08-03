from django.db import models


class ConsultationSession(models.Model):
    """
    A single teleconsultation request/session — either INSTANT (visitor
    wants to talk to someone right now, matched against staff who've
    toggled is_available_for_calls) or SCHEDULED (booked for a future time,
    same as the existing Service Booking flow's pattern).

    Deliberately holds only what's needed to run the call and route it to
    the right staff — no clinical/case data. If this ever needs to carry
    medical notes, that should live in a separate, access-controlled model,
    not here.
    """

    class Division(models.TextChoices):
        MEDICAL = "MEDICAL", "Wolbi Medical Services"
        VIRTUAL = "VIRTUAL", "Wolbi Virtual Solutions"

    class Mode(models.TextChoices):
        INSTANT = "INSTANT", "Instant"
        SCHEDULED = "SCHEDULED", "Scheduled"

    class Status(models.TextChoices):
        REQUESTED = "REQUESTED", "Requested"     # awaiting a staff member to claim it
        CLAIMED = "CLAIMED", "Claimed"            # staff assigned, room is live
        COMPLETED = "COMPLETED", "Completed"
        CANCELLED = "CANCELLED", "Cancelled"

    name = models.CharField(max_length=200)
    email = models.EmailField()
    phone = models.CharField(max_length=30, blank=True)

    division = models.CharField(max_length=10, choices=Division.choices)
    mode = models.CharField(max_length=10, choices=Mode.choices)
    reason = models.TextField(help_text="What the visitor needs help with")

    status = models.CharField(max_length=10, choices=Status.choices, default=Status.REQUESTED)
    scheduled_time = models.DateTimeField(null=True, blank=True)

    assigned_staff = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="teleconsultations",
    )

    room_name = models.CharField(max_length=200, blank=True)
    room_url = models.URLField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} — {self.get_division_display()} ({self.get_mode_display()}, {self.status})"
