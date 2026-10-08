import secrets
from datetime import timedelta

from django.db import models
from django.utils import timezone


def _new_access_token():
    return secrets.token_urlsafe(24)


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
        # INSTANT:   REQUESTED -> CLAIMED -> COMPLETED
        # SCHEDULED: REQUESTED -> CONFIRMED -> CLAIMED (in progress) -> COMPLETED
        # Either can end as CANCELLED, or MISSED if nobody ever joined.
        REQUESTED = "REQUESTED", "Requested"     # awaiting a staff member (to claim / confirm)
        CONFIRMED = "CONFIRMED", "Confirmed"      # scheduled and accepted; room opens near the start time
        CLAIMED = "CLAIMED", "In progress"        # staff assigned, room is live
        COMPLETED = "COMPLETED", "Completed"
        CANCELLED = "CANCELLED", "Cancelled"
        MISSED = "MISSED", "Missed"               # confirmed time passed and nobody joined

    # How early people may enter the room before the scheduled start
    CLIENT_EARLY_MINUTES = 15
    STAFF_EARLY_MINUTES = 30
    # How long after the scheduled end the room stays joinable
    LATE_GRACE_MINUTES = 60

    name = models.CharField(max_length=200)
    email = models.EmailField()
    phone = models.CharField(max_length=30, blank=True)

    division = models.CharField(max_length=10, choices=Division.choices)
    mode = models.CharField(max_length=10, choices=Mode.choices)
    reason = models.TextField(help_text="What the visitor needs help with")

    status = models.CharField(max_length=10, choices=Status.choices, default=Status.REQUESTED)
    scheduled_time = models.DateTimeField(null=True, blank=True)
    duration_minutes = models.PositiveSmallIntegerField(default=30)
    timezone = models.CharField(
        max_length=64, blank=True,
        help_text="Client's IANA timezone (e.g. Europe/London) so emails show their local time",
    )
    confirmed_at = models.DateTimeField(null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True, help_text="When the first person joined")
    ended_at = models.DateTimeField(null=True, blank=True)
    reminder_sent_at = models.DateTimeField(null=True, blank=True)
    cancelled_by = models.CharField(max_length=10, blank=True, help_text="client, staff or system")

    assigned_staff = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="teleconsultations",
    )

    # Secret included in the client's email links so they can return to the
    # booking page and join their call without retyping their email.
    access_token = models.CharField(max_length=64, default=_new_access_token, editable=False)

    room_name = models.CharField(max_length=200, blank=True)
    room_url = models.URLField(blank=True)
    room_expires_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} — {self.get_division_display()} ({self.get_mode_display()}, {self.status})"

    # ── Joining rules ─────────────────────────────────────────────────────

    @property
    def is_scheduled(self):
        return self.mode == self.Mode.SCHEDULED and self.scheduled_time is not None

    def join_window(self, staff=False):
        """(opens_at, closes_at) for a scheduled session; (None, None) for instant."""
        if not self.is_scheduled:
            return None, None
        early = self.STAFF_EARLY_MINUTES if staff else self.CLIENT_EARLY_MINUTES
        opens = self.scheduled_time - timedelta(minutes=early)
        closes = self.scheduled_time + timedelta(minutes=self.duration_minutes + self.LATE_GRACE_MINUTES)
        return opens, closes

    def join_state(self, staff=False, now=None):
        """
        Whether someone can join right now, and if not why:
          "ok" | "waiting" (not accepted yet) | "too_early" | "ended"
        """
        now = now or timezone.now()
        S = self.Status
        if self.status in (S.COMPLETED, S.CANCELLED, S.MISSED):
            return "ended"
        if self.status == S.REQUESTED:
            return "waiting"
        if not self.is_scheduled:               # instant, status CLAIMED
            return "ok" if self.status == S.CLAIMED else "waiting"
        opens, closes = self.join_window(staff)
        if now < opens:
            return "too_early"
        if now > closes:
            return "ended"
        return "ok"
