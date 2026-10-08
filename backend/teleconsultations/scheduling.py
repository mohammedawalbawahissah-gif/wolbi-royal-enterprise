"""
State changes and background housekeeping for teleconsultations.

Views call confirm/reschedule/cancel here so the status, timestamps and emails
always change together. `run_housekeeping()` sends reminders and closes out
sessions that nobody picked up; run it every ~10 minutes with

    python manage.py send_consultation_reminders

(a Railway scheduled task). It also runs, throttled, whenever a client's
booking page or the staff list is loaded, so the site keeps itself tidy while
anyone is using it.
"""
import logging
import threading
import time
from datetime import timedelta

from django.utils import timezone

from notifications import events
from .models import ConsultationSession

logger = logging.getLogger(__name__)
S = ConsultationSession.Status

REMINDER_WINDOW = timedelta(minutes=35)     # remind when the start is this close
INSTANT_PATIENCE = timedelta(minutes=30)    # an unclaimed instant request is closed after this
CLAIMED_GRACE = timedelta(minutes=30)       # forgotten in-progress sessions close after room expiry + this


def confirm_session(session, staff, new_time=None):
    """Staff accepts a scheduled booking, optionally at a different time."""
    moved = bool(new_time and new_time != session.scheduled_time)
    if new_time:
        session.scheduled_time = new_time
    session.assigned_staff = staff
    session.status = S.CONFIRMED
    session.confirmed_at = timezone.now()
    session.reminder_sent_at = None
    session.save(update_fields=["scheduled_time", "assigned_staff", "status", "confirmed_at",
                                "reminder_sent_at", "updated_at"])
    events.consultation_confirmed(session, time_changed=moved)


def reschedule_session(session, new_time, *, by, staff=None):
    """
    A new time for a scheduled session.
      by="staff":  the time is confirmed straight away and the client is told.
      by="client": it goes back to REQUESTED so staff confirm the new time.
    An instant request nobody picked up becomes a scheduled booking.
    """
    was_instant = session.mode == ConsultationSession.Mode.INSTANT
    session.mode = ConsultationSession.Mode.SCHEDULED
    session.scheduled_time = new_time
    session.reminder_sent_at = None
    if by == "staff":
        session.assigned_staff = staff or session.assigned_staff
        session.status = S.CONFIRMED
        session.confirmed_at = timezone.now()
    else:
        session.status = S.REQUESTED
        session.confirmed_at = None
    session.save(update_fields=["mode", "scheduled_time", "reminder_sent_at", "assigned_staff", "status",
                                "confirmed_at", "updated_at"])
    events.consultation_rescheduled(session, by=by, was_instant=was_instant)


def cancel_session(session, *, by):
    """Cancel from any open state; `by` is "client", "staff" or "system"."""
    from .services import delete_room
    session.status = S.CANCELLED
    session.cancelled_by = by
    session.ended_at = timezone.now()
    session.save(update_fields=["status", "cancelled_by", "ended_at", "updated_at"])
    if session.room_name:
        threading.Thread(target=delete_room, args=(session.room_name,), daemon=True).start()
    events.consultation_cancelled(session, by=by)


def _claim(qs, **updates):
    """Atomically move the given queryset's rows and return the ones THIS
    process changed — so two workers never both email the same person."""
    changed = []
    for session in qs:
        if ConsultationSession.objects.filter(pk=session.pk, status=session.status).update(**updates):
            session.refresh_from_db()
            changed.append(session)
    return changed


def run_housekeeping(now=None):
    """Returns a dict of counts, handy for the management command and tests."""
    now = now or timezone.now()
    done = {"reminders": 0, "missed": 0, "expired_unconfirmed": 0, "expired_instant": 0, "closed": 0}

    # 1. Reminders for confirmed sessions starting soon
    soon = ConsultationSession.objects.filter(
        status=S.CONFIRMED, reminder_sent_at__isnull=True,
        scheduled_time__gt=now, scheduled_time__lte=now + REMINDER_WINDOW,
    )
    for session in soon:
        if ConsultationSession.objects.filter(pk=session.pk, reminder_sent_at__isnull=True) \
                .update(reminder_sent_at=now):
            session.refresh_from_db()
            events.consultation_reminder(session)
            done["reminders"] += 1

    # 2. Confirmed, but nobody ever joined and the window has closed
    for session in ConsultationSession.objects.filter(
            status=S.CONFIRMED, started_at__isnull=True, scheduled_time__isnull=False):
        if session.join_state(staff=True, now=now) == "ended":
            for s in _claim([session], status=S.MISSED, ended_at=now):
                events.consultation_missed(s)
                done["missed"] += 1

    # 3. A booking nobody confirmed before its time passed
    stale = ConsultationSession.objects.filter(
        status=S.REQUESTED, mode=ConsultationSession.Mode.SCHEDULED, scheduled_time__lt=now)
    for s in _claim(stale, status=S.CANCELLED, cancelled_by="system", ended_at=now):
        events.consultation_expired(s, kind="unconfirmed")
        done["expired_unconfirmed"] += 1

    # 4. An instant request nobody picked up
    waiting = ConsultationSession.objects.filter(
        status=S.REQUESTED, mode=ConsultationSession.Mode.INSTANT, created_at__lt=now - INSTANT_PATIENCE)
    for s in _claim(waiting, status=S.CANCELLED, cancelled_by="system", ended_at=now):
        events.consultation_expired(s, kind="instant")
        done["expired_instant"] += 1

    # 5. In-progress sessions staff forgot to mark completed
    forgotten = ConsultationSession.objects.filter(
        status=S.CLAIMED, room_expires_at__isnull=False, room_expires_at__lt=now - CLAIMED_GRACE)
    for s in _claim(forgotten, status=S.COMPLETED, ended_at=now):
        done["closed"] += 1

    if any(done.values()):
        logger.info(f"Consultation housekeeping: {done}")
    return done


_last_run = 0.0
_lock = threading.Lock()


def run_housekeeping_throttled(min_interval=60):
    """Opportunistic version: at most once a minute per process, never raises."""
    global _last_run
    now = time.monotonic()
    with _lock:
        if now - _last_run < min_interval:
            return None
        _last_run = now
    try:
        return run_housekeeping()
    except Exception as e:
        logger.exception(f"Consultation housekeeping failed: {e}")
        return None
