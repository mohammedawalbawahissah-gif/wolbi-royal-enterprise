from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import viewsets

from ..models import SiteConfiguration
from .serializers import SiteConfigurationSerializer
from accounts.permissions import IsAdmin

from leads.models import Lead
from projects.models import Project
from blog.models import BlogPost
from services.models import Service
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
