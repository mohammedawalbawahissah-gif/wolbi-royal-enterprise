from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import viewsets

from ..models import SiteConfiguration
from .serializers import SiteConfigurationSerializer
from accounts.permissions import IsAdmin
from core.services.ai import ask_ai, AIServiceUnavailable

from leads.models import Lead
from projects.models import Project
from blog.models import BlogPost
from services.models import Service
from products.models import Product
from newsletter.models import Subscriber


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


class AIConciergeView(APIView):
    """
    Public "Ask Wolbi" chat concierge. Grounds Claude in the current
    divisions/products/services pulled from the DB (not hardcoded) so it
    stays accurate as the catalog changes, and routes visitors toward the
    right division/product/contact form instead of leaving them to
    self-navigate the site.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        message = (request.data.get("message") or "").strip()
        history = request.data.get("history") or []  # [{role, content}, ...]
        if not message:
            return Response({"error": "message is required"}, status=400)
        if len(message) > 2000:
            return Response({"error": "message is too long"}, status=400)

        products = Product.objects.filter(active=True).values_list("name", "tagline", "industry")
        services = Service.objects.values_list("name", "business_unit", "short_description")[:20]

        catalog = "Products:\n" + "\n".join(
            f"- {n} ({i or 'General'}): {t}" for n, t, i in products
        ) + "\n\nServices:\n" + "\n".join(
            f"- {n} [{bu}]: {d}" for n, bu, d in services
        )

        system_prompt = (
            "You are the 'Ask Wolbi' concierge on the Wolbi Royal Enterprise website — a Ghanaian "
            "group with four divisions: Wolbi Technologies (software, AI & digital transformation), "
            "Wolbi Medical Services (health consulting, lab services, telehealth), Wolbi Virtual "
            "Solutions (virtual assistance & business operations), and Wolbi Foundation (community "
            "health, education & youth impact). Here is the current product/service catalog:\n\n"
            f"{catalog}\n\n"
            "Answer visitor questions helpfully and briefly (2-4 sentences), point them to the most "
            "relevant division or product, and suggest they use the contact/demo-request form for "
            "anything requiring a human. If asked something unrelated to Wolbi, politely redirect. "
            "Never invent pricing, timelines, or guarantees you don't have information about."
        )

        conversation = "\n".join(
            f"{h.get('role', 'user')}: {h.get('content', '')}" for h in history[-6:]
        )
        user_prompt = (f"{conversation}\n" if conversation else "") + f"user: {message}"

        try:
            reply = ask_ai(system_prompt, user_prompt, max_tokens=350)
        except AIServiceUnavailable as e:
            return Response({"error": str(e)}, status=503)
        return Response({"reply": reply})
