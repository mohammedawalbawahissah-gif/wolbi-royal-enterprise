"""
Every client email and staff notification the site sends, in one place.

Each function is called from the view/model where the event happens and must
never raise — a failed email or notification should not break the client's
request. Wording lives here so it can be edited without touching the views.
"""
import logging
from functools import wraps

from django.conf import settings
from django.utils import timezone

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

    send_email(
        lead.email,
        EmailContent(
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
        ),
        audience=CLIENT,
        kind=f"lead_{variant}_confirmation",
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

    send_email(
        lead.email,
        EmailContent(
            subject=f"Re: {lead.subject}",
            heading=f"Hi {_first_name(lead.name)},",
            paragraphs=[reply.message],
            closing=["You can reply directly to this email."],
            signoff=f"{staff_name}\nWolbi Royal Enterprise",
            details=[],
        ),
        audience=CLIENT,
        kind="lead_reply",
        # Client replies go straight to the staff member, or the shared inbox
        reply_to=(staff.email if staff and staff.email else settings.REPLY_TO_EMAIL),
        on_sent=_mark_sent,
    )


# ── Teleconsultations ─────────────────────────────────────────────────────────

def _session_link(session):
    return f"{settings.SITE_URL}/teleconsultation?session={session.pk}&token={session.access_token}"


@_safe
def consultation_requested(session, staff_targets):
    first = _first_name(session.name)
    instant = session.mode == "INSTANT"
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
            closing=["We'll also email you the moment a specialist joins."],
        )
    else:
        content = EmailContent(
            subject="Your teleconsultation is booked — Wolbi Royal Enterprise",
            eyebrow="Booking confirmed",
            heading=f"Hi {first}, your teleconsultation is booked",
            paragraphs=["Thanks for booking a teleconsultation with Wolbi Royal Enterprise. Here are your details:"],
            details=[
                ("Reference", f"TC-{session.pk:05d}"),
                ("Service", session.get_division_display()),
                ("Requested time", _fmt_dt(session.scheduled_time)),
            ],
            cta_label="View my booking",
            cta_url=_session_link(session),
            closing=[
                "We'll email you a join link when your specialist opens the room at the scheduled time.",
                "Need to change the time? Just reply to this email.",
            ],
        )
    send_email(session.email, content, audience=CLIENT,
               kind="teleconsult_instant_confirmation" if instant else "teleconsult_booking_confirmation")

    title = f"New {session.get_mode_display().lower()} teleconsultation: {session.name}"
    notify_staff(
        staff_targets,
        title=title,
        message=f"{session.get_division_display()}"
                f"{' · ' + _fmt_dt(session.scheduled_time) if session.scheduled_time else ' · waiting now'}"
                f" — {session.reason[:120]}",
        kind=Notification.Kind.TELECONSULTATION,
        link="/dashboard/teleconsultations",
        email_kind="staff_teleconsult_request",
        email=EmailContent(
            subject=f"[Wolbi] {title}",
            eyebrow="Waiting now" if instant else "New booking",
            heading=title,
            paragraphs=["The client is waiting on the website — claim it in the dashboard to open the video room."
                        if instant else "A scheduled teleconsultation was just booked."],
            details=[
                ("Reference", f"TC-{session.pk:05d}"),
                ("Name", session.name),
                ("Email", session.email),
                ("Phone", session.phone),
                ("Service", session.get_division_display()),
                ("Time", _fmt_dt(session.scheduled_time) or "Now"),
            ],
            quote=session.reason,
            cta_label="Open teleconsultations",
            cta_url=dashboard_url("/dashboard/teleconsultations"),
            signoff="",
        ),
    )


@_safe
def consultation_claimed(session):
    staff = session.assigned_staff
    who = (staff.get_full_name() or "A specialist") if staff else "A specialist"
    send_email(
        session.email,
        EmailContent(
            subject="Your specialist is ready — join your teleconsultation",
            eyebrow="Ready to join",
            heading=f"Hi {_first_name(session.name)}, {who} is ready for you",
            paragraphs=["Your video room is open. Click below to join from your phone or computer — no app needed."],
            details=[("Reference", f"TC-{session.pk:05d}"), ("Service", session.get_division_display())],
            cta_label="Join my teleconsultation",
            cta_url=_session_link(session),
            closing=["Please allow your browser to use your camera and microphone when asked."],
        ),
        audience=CLIENT,
        kind="teleconsult_ready",
    )


@_safe
def consultation_completed(session):
    send_email(
        session.email,
        EmailContent(
            subject="Thank you for your teleconsultation — Wolbi Royal Enterprise",
            heading=f"Thank you, {_first_name(session.name)}",
            paragraphs=[
                "Your teleconsultation with Wolbi Royal Enterprise has ended. We hope it was helpful.",
                "If you have follow-up questions, reply to this email and our team will get back to you.",
            ],
            details=[("Reference", f"TC-{session.pk:05d}")],
        ),
        audience=CLIENT,
        kind="teleconsult_completed",
    )


@_safe
def consultation_cancelled(session):
    send_email(
        session.email,
        EmailContent(
            subject="Your teleconsultation was cancelled — Wolbi Royal Enterprise",
            heading=f"Hi {_first_name(session.name)}, your session was cancelled",
            paragraphs=[
                "We're sorry — your teleconsultation request couldn't go ahead this time.",
                "You can book a new session at a time that suits you, or reply to this email and we'll help arrange one.",
            ],
            details=[("Reference", f"TC-{session.pk:05d}")],
            cta_label="Book a new session",
            cta_url=f"{settings.SITE_URL}/teleconsultation",
        ),
        audience=CLIENT,
        kind="teleconsult_cancelled",
    )


# ── Foundation volunteers ────────────────────────────────────────────────────

@_safe
def volunteer_applied(volunteer):
    program = volunteer.program.name if volunteer.program_id else ""
    send_email(
        volunteer.email,
        EmailContent(
            subject="Thank you for volunteering — Wolbi Foundation",
            eyebrow="Wolbi Foundation",
            heading=f"Thank you, {_first_name(volunteer.name)}!",
            paragraphs=[
                "We've received your application to volunteer with the Wolbi Foundation. "
                "A member of the Foundation team will review it and be in touch about next steps.",
            ],
            details=[("Programme", program)],
        ),
        audience=CLIENT,
        kind="volunteer_confirmation",
    )
    title = f"New volunteer application: {volunteer.name}"
    notify_staff(
        staff_users(["FOUNDATION"]),
        title=title,
        message=f"{volunteer.email}{' · ' + program if program else ''} — {volunteer.interest[:120]}",
        kind=Notification.Kind.VOLUNTEER,
        link="/dashboard/foundation",
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
