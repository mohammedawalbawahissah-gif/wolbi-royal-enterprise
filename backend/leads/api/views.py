from rest_framework import viewsets, generics
from rest_framework.permissions import AllowAny
from rest_framework.decorators import action
from rest_framework.response import Response

from ..models import Lead
from .serializers import LeadSerializer, LeadAdminSerializer
from accounts.permissions import IsAdmin, IsStaff
from core.services.ai import AIServiceUnavailable


class LeadViewSet(viewsets.ModelViewSet):
    queryset = Lead.objects.all().order_by("-created_at")

    def get_serializer_class(self):
        if self.request.user.is_authenticated and self.request.user.role in ["ADMIN", "MEDICAL", "VA", "FOUNDATION"]:
            return LeadAdminSerializer
        return LeadSerializer

    def get_permissions(self):
        if self.action == "create":
            return [AllowAny()]
        if self.action in ["update", "partial_update", "destroy"]:
            return [IsAdmin()]
        if self.action == "list":
            return [IsStaff()]
        return [IsStaff()]

    @action(detail=True, methods=["post"], permission_classes=[IsStaff])
    def mark_contacted(self, request, pk=None):
        lead = self.get_object()
        lead.is_contacted = True
        lead.save()
        return Response({"status": "marked as contacted"})

    @action(detail=True, methods=["post"], permission_classes=[IsStaff])
    def ai_retriage(self, request, pk=None):
        """Manually re-run AI triage (e.g. after notes were added, or if it
        failed the first time). Runs synchronously so the UI can show the
        result immediately instead of polling."""
        lead = self.get_object()
        try:
            lead._run_ai_triage()
        except AIServiceUnavailable as e:
            return Response({"error": str(e)}, status=503)
        lead.refresh_from_db()
        return Response(LeadAdminSerializer(lead).data)
