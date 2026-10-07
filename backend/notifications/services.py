"""
Delivery layer for every outgoing email and in-app notification.

    send_email(...)   one branded email (HTML + plain text) to a client or staff
                      inbox, logged in EmailLog, sent in a background thread.
    notify_staff(...) in-app Notification for each staff user + an email copy
                      to those who have email_notifications on, plus the
                      STAFF_ALERT_EMAILS inbox(es).

Event-specific wording lives in notifications/events.py; this module only
knows how to deliver.
"""
import logging
import threading
from dataclasses import dataclass, field

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.db import connection, transaction
from django.template.loader import render_to_string
from django.utils import timezone

from .models import EmailLog, Notification

logger = logging.getLogger(__name__)

STAFF_ROLES = ("ADMIN", "MEDICAL", "TECH", "VA", "FOUNDATION")


@dataclass
class EmailContent:
    """Structured content rendered into both the HTML template and plain text."""
    subject: str
    heading: str
    paragraphs: list = field(default_factory=list)
    details: list = field(default_factory=list)      # [(label, value), ...]
    quote: str = ""                                   # e.g. the client's own message
    cta_label: str = ""
    cta_url: str = ""
    closing: list = field(default_factory=list)
    signoff: str = "Warm regards,\nThe Wolbi Royal Enterprise team"
    eyebrow: str = ""
    preheader: str = ""
    footer_note: str = ""

    def __post_init__(self):
        # Drop empty lines/rows so callers can include optional bits inline
        self.paragraphs = [p for p in self.paragraphs if p]
        self.closing = [p for p in self.closing if p]
        self.details = [(k, str(v)) for k, v in self.details if v not in (None, "")]

    def render_html(self) -> str:
        return render_to_string("emails/base.html", {**self.__dict__, "site_url": settings.SITE_URL})

    def render_text(self) -> str:
        lines = [self.heading, ""]
        lines += [p + "\n" for p in self.paragraphs]
        details = self.details
        if details:
            width = max(len(k) for k, _ in details)
            lines += [f"{k.ljust(width)}  {v}" for k, v in details] + [""]
        if self.quote:
            lines += ["> " + l for l in str(self.quote).splitlines()] + [""]
        if self.cta_url:
            lines += [f"{self.cta_label}: {self.cta_url}", ""]
        lines += [p + "\n" for p in self.closing]
        if self.signoff:
            lines += [self.signoff, ""]
        lines += ["—", "Wolbi Royal Enterprise · Tamale, Ghana · wolbiroyal.com"]
        if self.footer_note:
            lines.append(self.footer_note)
        return "\n".join(lines)


def _deliver(log_id, on_sent=None, in_thread=False):
    """Send one logged email. Safe to run in a thread; never raises."""
    try:
        log = EmailLog.objects.get(pk=log_id)
        log.attempts += 1
        msg = EmailMultiAlternatives(
            subject=log.subject,
            body=log.text_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[a.strip() for a in log.to.split(",") if a.strip()],
            reply_to=[log.reply_to] if log.reply_to else None,
        )
        if log.html_body:
            msg.attach_alternative(log.html_body, "text/html")
        try:
            msg.send(fail_silently=False)
            log.status = EmailLog.Status.SENT
            log.sent_at = timezone.now()
            log.provider_id = getattr(msg, "provider_id", "") or ""
            log.error = ""
        except Exception as e:  # provider down, bad key, unverified domain…
            log.status = EmailLog.Status.FAILED
            log.error = str(e)[:2000]
            logger.warning(f"Email {log.pk} to {log.to} failed: {e}")
        log.save(update_fields=["status", "sent_at", "provider_id", "error", "attempts"])
        if log.status == EmailLog.Status.SENT and on_sent:
            on_sent()
    except Exception as e:
        logger.exception(f"Email delivery crashed for log {log_id}: {e}")
    finally:
        if in_thread:
            # Each thread opens its own DB connection; close it or it leaks.
            connection.close()


def send_email(to, content: EmailContent, *, audience, kind="", reply_to=None, on_sent=None):
    """
    Queue one email. `to` is an address or list of addresses (all visible to
    each other — use separate calls for separate people). Returns the EmailLog.
    """
    recipients = [to] if isinstance(to, str) else list(to)
    recipients = [r.strip() for r in recipients if r and r.strip()]
    if not recipients:
        return None

    log = EmailLog.objects.create(
        to=", ".join(recipients),
        subject=content.subject[:300],
        audience=audience,
        kind=kind,
        text_body=content.render_text(),
        html_body=content.render_html(),
        reply_to=reply_to if reply_to is not None else (settings.REPLY_TO_EMAIL or ""),
    )
    if getattr(settings, "EMAIL_ASYNC", True):
        # on_commit: if we're inside a transaction, wait until the EmailLog row
        # is committed so the background thread can see it.
        transaction.on_commit(
            lambda: threading.Thread(target=_deliver, args=(log.pk, on_sent, True), daemon=True).start()
        )
    else:
        _deliver(log.pk, on_sent)
    return log


def retry_email(log: EmailLog):
    """Re-send a failed email (used by the admin action)."""
    log.status = EmailLog.Status.QUEUED
    log.save(update_fields=["status"])
    _deliver(log.pk)
    log.refresh_from_db()
    return log


def staff_users(roles=()):
    """Active staff in the given roles, always including admins."""
    from accounts.models import User
    wanted = set(roles) | {"ADMIN"}
    return User.objects.filter(is_active=True, role__in=wanted)


def notify_staff(users, *, title, message, kind, link="", email: EmailContent | None = None,
                 email_kind="", alert_inboxes=True, exclude=None):
    """
    In-app notification for each user (deduplicated), plus one email per user
    who has an address and email_notifications on, plus a copy to the
    STAFF_ALERT_EMAILS inbox(es) when alert_inboxes is True.
    `exclude` = the user who triggered the event (they don't need to be told).
    """
    seen, targets = set(), []
    for u in users:
        if u is None or u.pk in seen or (exclude is not None and u.pk == exclude.pk):
            continue
        seen.add(u.pk)
        targets.append(u)

    Notification.objects.bulk_create([
        Notification(user=u, kind=kind, title=title[:255], message=message, link=link)
        for u in targets
    ])

    if email is None:
        return targets

    addresses = []
    for u in targets:
        if u.email and getattr(u, "email_notifications", True):
            addresses.append(u.email.lower())
    if alert_inboxes:
        addresses += [a.lower() for a in settings.STAFF_ALERT_EMAILS if a]

    for address in dict.fromkeys(addresses):  # dedupe, keep order
        send_email(address, email, audience=EmailLog.Audience.STAFF, kind=email_kind or kind.lower())
    return targets


def dashboard_url(path):
    return f"{settings.SITE_URL}{path}"
