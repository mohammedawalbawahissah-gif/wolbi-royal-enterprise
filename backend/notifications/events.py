"""
Every client email and staff notification the site sends, in one place.

Each function is called from the view/model where the event happens and must
never raise — a failed email or notification should not break the client's
request. Wording lives here so it can be edited without touching the views.
"""
from datetime import timezone as dt_timezone
import logging
from functools import wraps

from django.conf import settings
from django.utils import timezone

from .divisions import general_sender, sender_for, sender_for_inquiry
from .models import EmailLog, Notification
from .services import EmailContent, dashboard_url, notify_staff, send_email, staff_users

logger = logging.getLogger(__name__)
CLIENT = EmailLog.Audience.CLIENT


def _safe(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            return fn(*args, **kwargs)
        except Exception as e:
            logger.exception(f"Notification event {fn.__name__} failed: {e}")
    return wrapper


def _first_name(name):
    return (name or "").strip().split(" ")[0] or "there"


def _brand(content, sender):
    """Sign the email as the division and show its mailbox in the footer."""
    if sender.division:
        if content.signoff == EmailContent.__dataclass_fields__["signoff"].default:
            content.signoff = f"Warm regards,\n{sender.team}"
        content.team, content.team_email = sender.name, sender.address
    return content


def _extra_inboxes(sender):
    """Division mailbox gets a copy of staff alerts about its own division."""
    return [sender.address] if sender.division else []


def _fmt_dt(dt):
    if not dt:
        return ""
    return timezone.localtime(dt).strftime("%A %d %B %Y, %I:%M %p (GMT)").replace(" 0", " ")


# ── Leads: contact form, call scheduling, bookings, demos, partnerships ──────

# Lead.subject prefixes set by the website forms → how to talk about the request
_LEAD_VARIANTS = [
    ("Schedule a Call", "call",        "We've received your call request"),
    ("Service Booking", "booking",     "We've received your booking"),
    ("Service Request", "service",     "We've received your service request"),
    ("Demo Request",    "demo",        "We've received your demo request"),
    ("Partnership",     "partnership", "Thank you for your partnership interest"),
    ("AI Concierge",    "handoff",     "A member of our team will follow up"),
]

_LEAD_ROLE = {"MEDICAL": "MEDICAL", "FOUNDATION": "FOUNDATION", "VIRTUAL": "VA"}


def _lead_variant(lead):
    for prefix, key, heading in _LEAD_VARIANTS:
        if lead.subject.startswith(prefix):
            return key, heading
    return "contact", "We've received your message"


@_safe
def lead_created(lead):
    variant, heading = _lead_variant(lead)
    first = _first_name(lead.name)
    is_medical = lead.inquiry_type == "MEDICAL"

    intro = {
        "call": "Thanks for scheduling a call with Wolbi Royal Enterprise. We'll confirm the exact time with you before the call.",
        "booking": "Thanks for booking with Wolbi Medical Services. A member of our team will contact you to confirm the date, time and any preparation needed.",
        "service": "Thanks for your interest in working with Wolbi Technologies. We'll review what you need and get back to you with next steps.",
        "demo": "Thanks for requesting a demo. We'll be in touch to find a time that suits you.",
        "partnership": "Thanks for reaching out about partnering with Wolbi Royal Enterprise. Our team will review your inquiry and contact you.",
        "handoff": "You asked to speak with a person while chatting with Ask Wolbi, our website assistant. We've passed your conversation to our team and someone will contact you.",
        "contact": "Thanks for contacting Wolbi Royal Enterprise. A member of our team will get back to you shortly.",
    }[variant]

    sender = sender_for_inquiry(lead.inquiry_type)
    send_email(
        lead.email,
        _brand(EmailContent(
            subject=f"{heading} — Wolbi Royal Enterprise",
            preheader=intro,
            eyebrow="Request received",
            heading=f"Hi {first}, {heading[0].lower() + heading[1:]}",
            paragraphs=[intro],
            details=[
                ("Reference", f"WR-{lead.pk:05d}"),
                ("Request", lead.subject),
                ("Division", lead.get_inquiry_type_display()),
                ("Phone", lead.phone),
            ],
            # Medical details stay out of email; the client already has them.
            quote="" if is_medical or variant == "handoff" else lead.message,
            closing=[
                "For your privacy, we haven't repeated your health details in this email." if is_medical else "",
                "If you need to add anything, just reply to this email and quote your reference.",
            ],
        ), sender),
        audience=CLIENT,
        kind=f"lead_{variant}_confirmation",
        sender=sender,
    )

    role = _LEAD_ROLE.get(lead.inquiry_type)
    kind = Notification.Kind.LEAD_ESCALATION if variant == "handoff" else Notification.Kind.LEAD
    title = (f"Ask Wolbi hand-off: {lead.name}" if variant == "handoff"
             else f"New request from {lead.name} · {lead.get_inquiry_type_display()}")
    notify_staff(
        staff_users([role] if role else []),
        title=title,
        message=f"{lead.subject} — {lead.email}{' · ' + lead.phone if lead.phone else ''}",
        kind=kind,
        link="/dashboard/leads",
        extra_inboxes=_extra_inboxes(sender),
        email_kind=f"staff_lead_{variant}",
        email=EmailContent(
            subject=f"[Wolbi] {title}",
            eyebrow="New request",
            heading=title,
            paragraphs=["A new request just came in through the website."],
            details=[
                ("Reference", f"WR-{lead.pk:05d}"),
                ("Name", lead.name),
                ("Email", lead.email),
                ("Phone", lead.phone),
                ("Organisation", lead.organization),
                ("Division", lead.get_inquiry_type_display()),
                ("Subject", lead.subject),
            ],
            quote=lead.message,
            cta_label="Open in dashboard",
            cta_url=dashboard_url("/dashboard/leads"),
            signoff="",
            footer_note="You're receiving this because you're on Wolbi Royal staff. Turn off email alerts in Dashboard → Notifications.",
        ),
    )


@_safe
def lead_reply_sent(reply):
    """Staff reply from the Leads dashboard, emailed to the client."""
    lead, staff = reply.lead, reply.staff
    staff_name = (staff.get_full_name() or staff.username) if staff else "The Wolbi Royal team"

    def _mark_sent():
        reply.email_sent = True
        reply.save(update_fields=["email_sent"])

    sender = sender_for_inquiry(lead.inquiry_type)
    send_email(
        lead.email,
        _brand(EmailContent(
            subject=f"Re: {lead.subject}",
            heading=f"Hi {_first_name(lead.name)},",
            paragraphs=[reply.message],
            closing=["You can reply directly to this email."],
            signoff=f"{staff_name}\n{sender.name}",
            details=[],
        ), sender),
        audience=CLIENT,
        kind="lead_reply",
        # Sent from the division mailbox; replies come back to it (shared inbox)
        sender=sender,
        on_sent=_mark_sent,
    )


# ── Teleconsultations ─────────────────────────────────────────────────────────

def _session_link(session):
    return f"{settings.SITE_URL}/teleconsultation?session={session.pk}&token={session.access_token}"


def _session_sender(session):
    return sender_for(session.division)


def _when(session):
    """The session time as the client will read it: in their own timezone when
    we know it, always with the Ghana time staff work to."""
    dt = session.scheduled_time
    if not dt:
        return ""
    ghana = timezone.localtime(dt).strftime("%A %d %B %Y, %I:%M %p").replace(" 0", " ")
    tz_name = (session.timezone or "").strip()
    if tz_name and tz_name not in ("Africa/Accra", "UTC", "GMT"):
        try:
            from zoneinfo import ZoneInfo
            local = dt.astimezone(ZoneInfo(tz_name))
            return f"{local.strftime('%A %d %B %Y, %I:%M %p').replace(' 0', ' ')} ({tz_name.replace('_', ' ')}) · {ghana.split(', ')[1]} Ghana time"
        except Exception:
            pass
    return f"{ghana} (Ghana time, GMT)"


def _calendar_url(session):
    """Google Calendar 'add event' link for a scheduled session."""
    from datetime import timedelta
    from urllib.parse import urlencode
    start = session.scheduled_time.astimezone(dt_timezone.utc)
    end = start + timedelta(minutes=session.duration_minutes)
    fmt = "%Y%m%dT%H%M%SZ"
    return "https://calendar.google.com/calendar/render?" + urlencode({
        "action": "TEMPLATE",
        "text": f"Teleconsultation — {session.get_division_display()}",
        "dates": f"{start.strftime(fmt)}/{end.strftime(fmt)}",
        "details": f"Join your video consultation here: {_session_link(session)}",
    })


def _staff_alert(session, title, message, *, eyebrow, paragraphs, cta="Open teleconsultations", targets=None):
    sender = _session_sender(session)
    notify_staff(
        targets if targets is not None else [session.assigned_staff] if session.assigned_staff_id else [],
        title=title,
        message=message,
        kind=Notification.Kind.TELECONSULTATION,
        link="/dashboard/teleconsultations",
        extra_inboxes=_extra_inboxes(sender),
        email_kind="staff_teleconsult_update",
        email=EmailContent(
            subject=f"[Wolbi] {title}",
            eyebrow=eyebrow,
            heading=title,
            paragraphs=paragraphs,
            details=[
                ("Reference", f"TC-{session.pk:05d}"),
                ("Name", session.name),
                ("Email", session.email),
                ("Phone", session.phone),
                ("Service", session.get_division_display()),
                ("Time", _when(session) or "Now"),
            ],
            cta_label=cta,
            cta_url=dashboard_url("/dashboard/teleconsultations"),
            signoff="",
        ),
    )


@_safe
def consultation_requested(session, staff_targets):
    first = _first_name(session.name)
    instant = session.mode == "INSTANT"
    sender = _session_sender(session)
    if instant:
        content = EmailContent(
            subject="We're connecting you with a specialist — Wolbi Royal Enterprise",
            eyebrow="Teleconsultation",
            heading=f"Hi {first}, we're finding someone for you now",
            paragraphs=[
                "We've alerted our available team members. Keep the teleconsultation page open and it will connect you as soon as someone is ready.",
                "If you closed the page, use the button below to get back to your session.",
            ],
            details=[("Reference", f"TC-{session.pk:05d}"), ("Service", session.get_division_display())],
            cta_label="Return to my session",
            cta_url=_session_link(session),
            closing=["We'll also email you the moment a specialist joins. If nobody is free, you can switch to a time that suits you from the same page."],
        )
    else:
        content = EmailContent(
            subject="We've received your teleconsultation request — Wolbi Royal Enterprise",
            eyebrow="Request received",
            heading=f"Hi {first}, we've received your booking request",
            paragraphs=[
                "Thanks for booking a teleconsultation. A team member will confirm your time shortly, and we'll email you as soon as they do.",
            ],
            details=[
                ("Reference", f"TC-{session.pk:05d}"),
                ("Service", session.get_division_display()),
                ("Requested time", _when(session)),
                ("Length", f"{session.duration_minutes} minutes"),
            ],
            cta_label="View my booking",
            cta_url=_session_link(session),
            closing=["Need a different time? Open your booking with the button above, or just reply to this email."],
        )
    send_email(session.email, _brand(content, sender), audience=CLIENT,
               kind="teleconsult_instant_confirmation" if instant else "teleconsult_booking_received",
               sender=sender)

    title = f"New {session.get_mode_display().lower()} teleconsultation: {session.name}"
    notify_staff(
        staff_targets,
        title=title,
        message=f"{session.get_division_display()}"
                f"{' · ' + _when(session) if session.scheduled_time else ' · waiting now'}"
                f" — {session.reason[:120]}",
        kind=Notification.Kind.TELECONSULTATION,
        link="/dashboard/teleconsultations",
        extra_inboxes=_extra_inboxes(sender),
        email_kind="staff_teleconsult_request",
        email=EmailContent(
            subject=f"[Wolbi] {title}",
            eyebrow="Waiting now" if instant else "Needs confirming",
            heading=title,
            paragraphs=["The client is waiting on the website — claim it in the dashboard to open the video room."
                        if instant else "A teleconsultation was booked for later. Open it in the dashboard to confirm the time (or suggest another)."],
            details=[
                ("Reference", f"TC-{session.pk:05d}"),
                ("Name", session.name),
                ("Email", session.email),
                ("Phone", session.phone),
                ("Service", session.get_division_display()),
                ("Time", _when(session) or "Now"),
                ("Length", f"{session.duration_minutes} minutes" if not instant else ""),
            ],
            quote=session.reason,
            cta_label="Open teleconsultations",
            cta_url=dashboard_url("/dashboard/teleconsultations"),
            signoff="",
        ),
    )


@_safe
def consultation_claimed(session):
    """Instant request accepted — the room is open now."""
    staff = session.assigned_staff
    who = (staff.get_full_name() or "A specialist") if staff else "A specialist"
    sender = _session_sender(session)
    send_email(
        session.email,
        _brand(EmailContent(
            subject="Your specialist is ready — join your teleconsultation",
            eyebrow="Ready to join",
            heading=f"Hi {_first_name(session.name)}, {who} is ready for you",
            paragraphs=["Your video room is open. Click below to join from your phone or computer — no app needed."],
            details=[("Reference", f"TC-{session.pk:05d}"), ("Service", session.get_division_display())],
            cta_label="Join my teleconsultation",
            cta_url=_session_link(session),
            closing=["Please allow your browser to use your camera and microphone when asked."],
        ), sender),
        audience=CLIENT,
        kind="teleconsult_ready",
        sender=sender,
    )


@_safe
def consultation_confirmed(session, time_changed=False):
    """A scheduled booking was accepted by staff."""
    staff = session.assigned_staff
    who = (staff.get_full_name() or "A specialist") if staff else "A specialist"
    sender = _session_sender(session)
    send_email(
        session.email,
        _brand(EmailContent(
            subject="Your teleconsultation is confirmed — Wolbi Royal Enterprise",
            eyebrow="Confirmed",
            heading=f"Hi {_first_name(session.name)}, your teleconsultation is confirmed",
            paragraphs=[
                f"{who} will see you at the time below."
                + (" Note: this is a different time from the one you requested." if time_changed else ""),
            ],
            details=[
                ("Reference", f"TC-{session.pk:05d}"),
                ("Service", session.get_division_display()),
                ("When", _when(session)),
                ("Length", f"{session.duration_minutes} minutes"),
            ],
            cta_label="Open my booking",
            cta_url=_session_link(session),
            cta2_label="Add to Google Calendar",
            cta2_url=_calendar_url(session),
            closing=[
                f"The video room opens {session.CLIENT_EARLY_MINUTES} minutes before your time. "
                "Open your booking from this email and press Join — no app or account needed.",
                "We'll send a reminder shortly before. Can't make it? You can reschedule or cancel from your booking page.",
            ],
        ), sender),
        audience=CLIENT,
        kind="teleconsult_confirmed",
        sender=sender,
    )


@_safe
def consultation_rescheduled(session, by, was_instant=False):
    sender = _session_sender(session)
    if by == "staff":
        send_email(
            session.email,
            _brand(EmailContent(
                subject="Your teleconsultation time has changed — Wolbi Royal Enterprise",
                eyebrow="New time",
                heading=f"Hi {_first_name(session.name)}, your teleconsultation has been rescheduled",
                paragraphs=["Our team has moved your teleconsultation to the time below."],
                details=[
                    ("Reference", f"TC-{session.pk:05d}"),
                    ("New time", _when(session)),
                    ("Length", f"{session.duration_minutes} minutes"),
                ],
                cta_label="Open my booking",
                cta_url=_session_link(session),
                cta2_label="Add to Google Calendar",
                cta2_url=_calendar_url(session),
                closing=["If this time doesn't work, open your booking and choose another, or reply to this email."],
            ), sender),
            audience=CLIENT,
            kind="teleconsult_rescheduled",
            sender=sender,
        )
        return

    # Changed by the client: acknowledge, and ask staff to confirm the new time
    send_email(
        session.email,
        _brand(EmailContent(
            subject="We've received your new time — Wolbi Royal Enterprise",
            eyebrow="Request received",
            heading=f"Hi {_first_name(session.name)}, we've got your new time",
            paragraphs=[
                "Thanks — we'll confirm this time with you shortly. Until then, your previous time is no longer held."
                if not was_instant else
                "Thanks for choosing a later time. A team member will confirm it shortly.",
            ],
            details=[("Reference", f"TC-{session.pk:05d}"), ("Requested time", _when(session))],
            cta_label="View my booking",
            cta_url=_session_link(session),
        ), sender),
        audience=CLIENT,
        kind="teleconsult_reschedule_received",
        sender=sender,
    )
    targets = [session.assigned_staff] if session.assigned_staff_id else []
    title = f"{session.name} asked for a new teleconsultation time"
    _staff_alert(
        session, title, f"{session.get_division_display()} · {_when(session)}",
        eyebrow="Needs confirming",
        paragraphs=["The client changed their requested time. Open it in the dashboard to confirm."],
        targets=targets or _division_staff(session),
    )


def _division_staff(session):
    from .services import staff_users
    role = {"MEDICAL": "MEDICAL", "VIRTUAL": "VA"}.get(session.division)
    return list(staff_users([role] if role else []))


@_safe
def consultation_reminder(session):
    """Sent roughly 30 minutes before a confirmed session."""
    sender = _session_sender(session)
    send_email(
        session.email,
        _brand(EmailContent(
            subject="Reminder: your teleconsultation is starting soon",
            eyebrow="Starting soon",
            heading=f"Hi {_first_name(session.name)}, your teleconsultation starts soon",
            paragraphs=["This is a reminder of your upcoming video consultation."],
            details=[
                ("Reference", f"TC-{session.pk:05d}"),
                ("When", _when(session)),
                ("Length", f"{session.duration_minutes} minutes"),
            ],
            cta_label="Join when it's time",
            cta_url=_session_link(session),
            closing=[
                f"The room opens {session.CLIENT_EARLY_MINUTES} minutes before your time. "
                "Find somewhere quiet with a good connection, and allow camera and microphone access when asked.",
            ],
        ), sender),
        audience=CLIENT,
        kind="teleconsult_reminder",
        sender=sender,
    )
    staff = session.assigned_staff
    if staff:
        title = f"Teleconsultation soon: {session.name}"
        _staff_alert(
            session, title, f"{_when(session)} · {session.get_division_display()}",
            eyebrow="Starting soon",
            paragraphs=[f"You're booked to see {session.name} shortly. You can enter the room "
                        f"{session.STAFF_EARLY_MINUTES} minutes before the start."],
            targets=[staff],
        )


@_safe
def consultation_missed(session):
    sender = _session_sender(session)
    send_email(
        session.email,
        _brand(EmailContent(
            subject="We missed you — rebook your teleconsultation",
            heading=f"Hi {_first_name(session.name)}, we couldn't connect this time",
            paragraphs=[
                "Your teleconsultation time came and went without anyone joining the video room. "
                "We're sorry we missed each other — let's find another time.",
            ],
            details=[("Reference", f"TC-{session.pk:05d}"), ("Booked time", _when(session))],
            cta_label="Book a new session",
            cta_url=f"{settings.SITE_URL}/teleconsultation",
        ), sender),
        audience=CLIENT,
        kind="teleconsult_missed",
        sender=sender,
    )


@_safe
def consultation_expired(session, kind):
    """The system closed a request nobody picked up."""
    sender = _session_sender(session)
    if kind == "instant":
        paragraphs = ["Everyone on our team was busy when you asked to talk, so we couldn't connect you.",
                      "You can book a time that suits you, and a team member will confirm it."]
    else:
        paragraphs = ["Your requested time passed before a team member could confirm it.",
                      "Please book a new time — we'll confirm it as quickly as we can."]
    send_email(
        session.email,
        _brand(EmailContent(
            subject="We couldn't connect your teleconsultation — Wolbi Royal Enterprise",
            heading=f"Hi {_first_name(session.name)}, we're sorry we couldn't reach you in time",
            paragraphs=paragraphs,
            details=[("Reference", f"TC-{session.pk:05d}")],
            cta_label="Book a time",
            cta_url=f"{settings.SITE_URL}/teleconsultation",
        ), sender),
        audience=CLIENT,
        kind="teleconsult_expired",
        sender=sender,
    )


@_safe
def consultation_completed(session):
    sender = _session_sender(session)
    send_email(
        session.email,
        _brand(EmailContent(
            subject="Thank you for your teleconsultation — Wolbi Royal Enterprise",
            heading=f"Thank you, {_first_name(session.name)}",
            paragraphs=[
                "Your teleconsultation with Wolbi Royal Enterprise has ended. We hope it was helpful.",
                "If you have follow-up questions, reply to this email and our team will get back to you.",
            ],
            details=[("Reference", f"TC-{session.pk:05d}")],
        ), sender),
        audience=CLIENT,
        kind="teleconsult_completed",
        sender=sender,
    )


@_safe
def consultation_cancelled(session, by="staff"):
    sender = _session_sender(session)
    if by == "client":
        # The client did it themselves — confirm to them, and tell staff
        send_email(
            session.email,
            _brand(EmailContent(
                subject="Your teleconsultation was cancelled — Wolbi Royal Enterprise",
                heading=f"Hi {_first_name(session.name)}, your booking is cancelled",
                paragraphs=["As you asked, we've cancelled your teleconsultation. You're welcome to book again any time."],
                details=[("Reference", f"TC-{session.pk:05d}")],
                cta_label="Book a new session",
                cta_url=f"{settings.SITE_URL}/teleconsultation",
            ), sender),
            audience=CLIENT,
            kind="teleconsult_cancelled",
            sender=sender,
        )
        title = f"{session.name} cancelled their teleconsultation"
        _staff_alert(
            session, title, f"{session.get_division_display()} · {_when(session) or 'instant'}",
            eyebrow="Cancelled by client",
            paragraphs=["The client cancelled this session themselves — no action needed."],
            targets=[session.assigned_staff] if session.assigned_staff_id else _division_staff(session),
        )
        return

    send_email(
        session.email,
        _brand(EmailContent(
            subject="Your teleconsultation was cancelled — Wolbi Royal Enterprise",
            heading=f"Hi {_first_name(session.name)}, your session was cancelled",
            paragraphs=[
                "We're sorry — your teleconsultation couldn't go ahead this time.",
                "You can book a new session at a time that suits you, or reply to this email and we'll help arrange one.",
            ],
            details=[("Reference", f"TC-{session.pk:05d}")],
            cta_label="Book a new session",
            cta_url=f"{settings.SITE_URL}/teleconsultation",
        ), sender),
        audience=CLIENT,
        kind="teleconsult_cancelled",
        sender=sender,
    )


# ── Foundation volunteers ────────────────────────────────────────────────────

@_safe
def volunteer_applied(volunteer):
    program = volunteer.program.name if volunteer.program_id else ""
    sender = sender_for("FOUNDATION")
    send_email(
        volunteer.email,
        _brand(EmailContent(
            subject="Thank you for volunteering — Wolbi Foundation",
            eyebrow="Wolbi Foundation",
            heading=f"Thank you, {_first_name(volunteer.name)}!",
            paragraphs=[
                "We've received your application to volunteer with the Wolbi Foundation. "
                "A member of the Foundation team will review it and be in touch about next steps.",
            ],
            details=[("Programme", program)],
        ), sender),
        audience=CLIENT,
        kind="volunteer_confirmation",
        sender=sender,
    )
    title = f"New volunteer application: {volunteer.name}"
    notify_staff(
        staff_users(["FOUNDATION"]),
        title=title,
        message=f"{volunteer.email}{' · ' + program if program else ''} — {volunteer.interest[:120]}",
        kind=Notification.Kind.VOLUNTEER,
        link="/dashboard/foundation",
        extra_inboxes=_extra_inboxes(sender),
        email_kind="staff_volunteer",
        email=EmailContent(
            subject=f"[Wolbi] {title}",
            eyebrow="Wolbi Foundation",
            heading=title,
            details=[("Name", volunteer.name), ("Email", volunteer.email),
                     ("Phone", volunteer.phone), ("Programme", program)],
            quote=volunteer.interest,
            cta_label="Open Foundation hub",
            cta_url=dashboard_url("/dashboard/foundation"),
            signoff="",
        ),
    )


# ── Newsletter ───────────────────────────────────────────────────────────────

@_safe
def newsletter_subscribed(subscriber):
    send_email(
        subscriber.email,
        EmailContent(
            subject="Welcome to the Wolbi Royal newsletter",
            heading=f"Welcome{', ' + subscriber.first_name if subscriber.first_name else ''}!",
            paragraphs=[
                "Thanks for subscribing. You'll receive occasional updates on our work across "
                "technology, health, virtual solutions and community impact in northern Ghana.",
            ],
            cta_label="Visit wolbiroyal.com",
            cta_url=settings.SITE_URL,
            footer_note="Don't want these emails? Reply with \"unsubscribe\" and we'll remove you.",
        ),
        audience=CLIENT,
        kind="newsletter_welcome",
    )


# ── Internal: assignments ────────────────────────────────────────────────────

def _assignment_email(assignment, heading, intro):
    return EmailContent(
        subject=f"[Wolbi] {heading}",
        eyebrow="Assignment",
        heading=heading,
        paragraphs=[intro],
        details=[
            ("Task", assignment.title),
            ("Status", assignment.get_status_display()),
            ("Due", assignment.due_date.strftime("%d %B %Y") if assignment.due_date else ""),
        ],
        quote=assignment.description[:1000],
        cta_label="Open assignment",
        cta_url=dashboard_url(f"/dashboard/assignments/{assignment.pk}"),
        signoff="",
    )


@_safe
def assignment_assigned(assignment, actor):
    by = (actor.get_full_name() or actor.username) if actor else "Someone"
    title = f"New assignment: {assignment.title}"
    notify_staff(
        [assignment.assigned_to], exclude=actor,
        title=title, message=f"Assigned to you by {by}",
        kind=Notification.Kind.ASSIGNMENT, link=f"/dashboard/assignments/{assignment.pk}",
        email=_assignment_email(assignment, title, f"{by} assigned you a task."),
        email_kind="staff_assignment", alert_inboxes=False,
    )


@_safe
def assignment_status_changed(assignment, actor):
    by = (actor.get_full_name() or actor.username) if actor else "Someone"
    title = f"{assignment.title} → {assignment.get_status_display()}"
    notify_staff(
        [assignment.assigned_to, assignment.assigned_by], exclude=actor,
        title=title, message=f"Status changed by {by}",
        kind=Notification.Kind.ASSIGNMENT, link=f"/dashboard/assignments/{assignment.pk}",
        email=_assignment_email(assignment, title, f"{by} moved this task to {assignment.get_status_display()}."),
        email_kind="staff_assignment_status", alert_inboxes=False,
    )


@_safe
def assignment_commented(comment):
    a = comment.assignment
    by = comment.author.get_full_name() or comment.author.username
    title = f"{by} commented on {a.title}"
    notify_staff(
        [a.assigned_to, a.assigned_by], exclude=comment.author,
        title=title, message=comment.comment[:200],
        kind=Notification.Kind.COMMENT, link=f"/dashboard/assignments/{a.pk}",
        email=None,  # comments are in-app only to avoid inbox noise
    )
