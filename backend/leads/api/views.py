from rest_framework import viewsets, generics
from rest_framework.permissions import AllowAny
from rest_framework.decorators import action
from rest_framework.response import Response

from ..models import Lead
from .serializers import LeadSerializer, LeadAdminSerializer
from accounts.permissions import IsAdmin, IsStaff


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
