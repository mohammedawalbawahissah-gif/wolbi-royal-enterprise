from django.core.cache import cache
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import viewsets

from ..models import SiteConfiguration
from .serializers import SiteConfigurationSerializer
from accounts.permissions import IsAdmin
from accounts.models import User
from core.services.ai import ask_ai, ask_ai_json, AIServiceUnavailable

from leads.models import Lead
from projects.models import Project
from blog.models import BlogPost
from services.models import Service
from products.models import Product
from newsletter.models import Subscriber
from testimonials.models import Testimonial
from industries.models import Industry
from foundation.models import Program, FoundationEvent
from notifications.models import Notification


class SiteConfigurationViewSet(viewsets.ModelViewSet):
    serializer_class = SiteConfigurationSerializer

    def get_queryset(self):
        return SiteConfiguration.objects.all()[:1]

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAdmin()]
        return []


class DashboardAnalyticsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        return Response({
            "leads":       Lead.objects.count(),
            "projects":    Project.objects.count(),
            "blog_posts":  BlogPost.objects.count(),
            "services":    Service.objects.count(),
            "subscribers": Subscriber.objects.filter(is_active=True).count(),

            "projects_by_status": {
                "Pending":     Project.objects.filter(status="PENDING").count(),
                "In Progress": Project.objects.filter(status="IN_PROGRESS").count(),
                "Completed":   Project.objects.filter(status="COMPLETED").count(),
                "Cancelled":   Project.objects.filter(status="CANCELLED").count(),
            },

            "leads_by_type": {
                "Medical":    Lead.objects.filter(inquiry_type="MEDICAL").count(),
                "Technology": Lead.objects.filter(inquiry_type="TECHNOLOGY").count(),
                "Agriculture":Lead.objects.filter(inquiry_type="AGRICULTURE").count(),
                "General":    Lead.objects.filter(inquiry_type="GENERAL").count(),
                "Others":     Lead.objects.exclude(
                    inquiry_type__in=["MEDICAL", "TECHNOLOGY", "AGRICULTURE", "GENERAL"]
                ).count(),
            },

            "leads_new":       Lead.objects.filter(is_contacted=False).count(),
            "leads_contacted": Lead.objects.filter(is_contacted=True).count(),
        })


class AIAnalyticsSummaryView(APIView):
    """
    On-demand AI narrative over the same numbers DashboardAnalyticsView exposes.
    Kept as a separate, explicitly-triggered endpoint (rather than baked into
    the main analytics call) so the dashboard stays fast by default and only
    pays the AI-call cost/latency when someone actually wants the summary.
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        stats = {
            "leads": Lead.objects.count(),
            "leads_new": Lead.objects.filter(is_contacted=False).count(),
            "high_priority_leads": Lead.objects.filter(ai_priority="HIGH", is_contacted=False).count(),
            "projects_pending": Project.objects.filter(status="PENDING").count(),
            "projects_in_progress": Project.objects.filter(status="IN_PROGRESS").count(),
            "projects_completed": Project.objects.filter(status="COMPLETED").count(),
            "blog_posts": BlogPost.objects.count(),
            "services": Service.objects.count(),
            "subscribers": Subscriber.objects.filter(is_active=True).count(),
            "leads_by_type": {
                t: Lead.objects.filter(inquiry_type=t).count()
                for t in ["MEDICAL", "TECHNOLOGY", "AGRICULTURE", "GENERAL", "VIRTUAL", "FOUNDATION", "PARTNERSHIP", "DEMO"]
            },
        }
        try:
            narrative = ask_ai(
                system_prompt=(
                    "You write a short, plain-English operations briefing for the founder of Wolbi "
                    "Royal Enterprise, a Ghanaian group spanning Technology, Medical Services, Virtual "
                    "Solutions, and Foundation divisions. Given raw dashboard stats as JSON, write 3-5 "
                    "sentences: what stands out, what needs attention (e.g. unread high-priority leads, "
                    "stalled projects), and one concrete suggested next action. No headers, no bullet "
                    "points, just plain prose. Do not repeat every number verbatim — reference the ones "
                    "that matter."
                ),
                user_prompt=str(stats),
                max_tokens=300,
            )
        except AIServiceUnavailable as e:
            return Response({"error": str(e)}, status=503)
        return Response({"narrative": narrative, "stats": stats})


# ─── AI Concierge site-wide context ────────────────────────────────────────
#
# Deliberately built from *public, non-personal* content only. Everything
# below is safe to hand to the model because it's already meant to be public
# marketing/informational copy.
#
# Explicitly and intentionally EXCLUDED (never touched by this function):
#   - leads.Lead              -> raw customer name/email/phone/message
#   - accounts.User            -> staff phone/email/bio/photos
#   - newsletter.Subscriber    -> subscriber emails
#   - foundation.Volunteer     -> volunteer name/email/phone
#   - assignments.*            -> internal task/ops data
#   - files.UploadedFile       -> internal/uploaded files
#   - notifications.Notification (other than writing to it, never reading
#     other users' notifications into a prompt)
#
# If you add a new app/model, default to leaving it OUT of this function
# unless it's clearly public marketing content.
CONTEXT_CACHE_KEY = "ai_concierge_site_context"
CONTEXT_CACHE_TTL = 900  # 15 minutes


def _build_site_context():
    parts = []

    config = SiteConfiguration.objects.first()
    if config:
        parts.append(
            f"About {config.company_name}:\n{config.about_text}\n"
            f"Contact: {config.contact_email} | {config.contact_phone}"
        )

    industries = Industry.objects.all()[:20]
    if industries:
        parts.append("Industries served:\n" + "\n".join(
            f"- {i.name}: {i.short_description} | Challenges: {i.challenges} | "
            f"Our approach: {i.wolbi_solutions}"
            for i in industries
        ))

    projects = Project.objects.filter(featured=True)[:15]
    if projects:
        parts.append("Featured projects:\n" + "\n".join(
            f"- {p.title}: {p.summary}" for p in projects
        ))

    programs = Program.objects.filter(is_active=True)[:15]
    if programs:
        parts.append("Foundation programs:\n" + "\n".join(
            f"- {pr.name} ({pr.focus_area}): {pr.description}" for pr in programs
        ))

    events = FoundationEvent.objects.order_by("-event_date")[:5]
    if events:
        parts.append("Recent/upcoming foundation events:\n" + "\n".join(
            f"- {e.title} on {e.event_date} at {e.location}" for e in events
        ))

    testimonials = Testimonial.objects.filter(is_approved=True)[:15]
    if testimonials:
        parts.append("Client testimonials:\n" + "\n".join(
            f'- "{t.quote}" — {t.author_name}, {t.author_title} at {t.author_company}'
            for t in testimonials
        ))

    posts = BlogPost.objects.filter(status="PUBLISHED")[:10]
    if posts:
        parts.append("Recent blog posts:\n" + "\n".join(
            f"- {b.title}: {b.excerpt}" for b in posts
        ))

    products = Product.objects.filter(active=True).values_list("name", "tagline", "industry")
    if products:
        parts.append("Products:\n" + "\n".join(
            f"- {n} ({i or 'General'}): {t}" for n, t, i in products
        ))

    services = Service.objects.values_list("name", "business_unit", "short_description")[:20]
    if services:
        parts.append("Services:\n" + "\n".join(
            f"- {n} [{bu}]: {d}" for n, bu, d in services
        ))

    return "\n\n".join(parts)


def get_site_context():
    """Cached wrapper around _build_site_context(). This content changes
    rarely (admin edits), so we avoid rebuilding it — and paying the extra
    DB queries + prompt tokens — on every single chat message."""
    ctx = cache.get(CONTEXT_CACHE_KEY)
    if ctx is None:
        ctx = _build_site_context()
        cache.set(CONTEXT_CACHE_KEY, ctx, timeout=CONTEXT_CACHE_TTL)
    return ctx


def invalidate_site_context_cache():
    """Call this from admin save signals if you want changes to reflect
    immediately instead of waiting up to CONTEXT_CACHE_TTL seconds."""
    cache.delete(CONTEXT_CACHE_KEY)


def _notify_staff_of_escalation(lead):
    """Creates an in-app Notification for every ADMIN user pointing at the
    new escalated Lead. Email notification is already handled separately
    by Lead.save() itself."""
    admins = User.objects.filter(role="ADMIN")
    notifications = [
        Notification(
            user=admin,
            title="Ask Wolbi escalated a conversation",
            message=(
                f"{lead.name} ({lead.email}) needs follow-up — "
                f"{lead.get_inquiry_type_display()}: {lead.subject}"
            ),
        )
        for admin in admins
    ]
    if notifications:
        Notification.objects.bulk_create(notifications)


class AIConciergeView(APIView):
    """
    Public "Ask Wolbi" chat concierge.

    Grounds Claude in the full public-facing site context (about, industries,
    projects, foundation programs/events, testimonials, blog, products,
    services — see _build_site_context for the exact, deliberately-scoped
    list) so it can answer almost anything a visitor asks about the company,
    not just the product catalog.

    Also handles escalation: when the model decides a conversation needs a
    human (explicit request, complaint, pricing/contract question, or
    anything outside its grounded context) and has collected at least a name
    + email from the visitor, it creates a real Lead record. That reuses the
    existing Lead pipeline (staff email notification + AI triage), and this
    view additionally pushes an in-app Notification to every admin user.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        message = (request.data.get("message") or "").strip()
        history = request.data.get("history") or []  # [{role, content}, ...]
        already_escalated = bool(request.data.get("already_escalated"))

        if not message:
            return Response({"error": "message is required"}, status=400)
        if len(message) > 2000:
            return Response({"error": "message is too long"}, status=400)

        catalog = get_site_context()

        valid_inquiry_types = "|".join(dict(Lead.InquiryType.choices).keys())

        system_prompt = (
            "You are the 'Ask Wolbi' concierge on the Wolbi Royal Enterprise website — a Ghanaian "
            "group with four divisions: Wolbi Technologies (software, AI & digital transformation), "
            "Wolbi Medical Services (health consulting, lab services, telehealth), Wolbi Virtual "
            "Solutions (virtual assistance & business operations), and Wolbi Foundation (community "
            "health, education & youth impact). Here is everything you know about the company:\n\n"
            f"{catalog}\n\n"
            "Answer visitor questions helpfully and briefly (2-4 sentences), grounded only in the "
            "information above. Never invent pricing, timelines, guarantees, names, or facts you "
            "don't have information about.\n\n"
            "Escalate to a human when: the visitor explicitly asks for a person or a callback, has "
            "a complaint, needs pricing/contract terms, or their need falls outside what you're "
            "grounded in above. To escalate you need at minimum their name AND email — if you don't "
            "have both yet, ask for them in your reply instead of escalating (set escalate to "
            "false). Once you have both, set escalate to true.\n\n"
            "Respond with ONLY valid JSON in exactly this shape, no markdown fences, no preamble:\n"
            '{"reply": "<what to show the visitor>", "escalate": true or false, '
            '"name": "<visitor name if known, else empty string>", '
            '"email": "<visitor email if known, else empty string>", '
            '"phone": "<visitor phone if known, else empty string>", '
            '"organization": "<visitor org if known, else empty string>", '
            f'"inquiry_type": "<one of {valid_inquiry_types}>", '
            '"summary": "<one paragraph of what the visitor needs, written for staff>"}'
        )

        conversation = "\n".join(
            f"{h.get('role', 'user')}: {h.get('content', '')}" for h in history[-8:]
        )
        user_prompt = (f"{conversation}\n" if conversation else "") + f"user: {message}"

        try:
            data = ask_ai_json(system_prompt, user_prompt, max_tokens=400)
        except AIServiceUnavailable as e:
            return Response({"error": str(e)}, status=503)

        reply = data.get("reply") or (
            "Sorry, I'm having trouble processing that — please try the contact form instead."
        )
        escalated = False

        wants_escalation = bool(data.get("escalate"))
        has_contact_info = bool(data.get("name")) and bool(data.get("email"))

        if wants_escalation and has_contact_info and not already_escalated:
            inquiry_type = data.get("inquiry_type")
            if inquiry_type not in dict(Lead.InquiryType.choices):
                inquiry_type = Lead.InquiryType.GENERAL

            lead = Lead.objects.create(
                name=data["name"],
                email=data["email"],
                phone=data.get("phone", "") or "",
                organization=data.get("organization", "") or "",
                subject="AI Concierge escalation",
                message=data.get("summary") or message,
                inquiry_type=inquiry_type,
            )
            _notify_staff_of_escalation(lead)
            escalated = True

        return Response({"reply": reply, "escalated": escalated})
