from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from projects.models import Project
from .serializers import ProjectSerializer
from accounts.permissions import IsStaff


class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    lookup_field = "slug"

    def get_queryset(self):
        qs = Project.objects.all().order_by("-created_at")
        unit = self.request.query_params.get("business_unit")
        featured = self.request.query_params.get("featured")
        public = self.request.query_params.get("public")
        project_type = self.request.query_params.get("project_type")

        if public:
            qs = qs.filter(status="COMPLETED")
        if unit:
            qs = qs.filter(business_unit=unit)
        if featured:
            qs = qs.filter(featured=True)
        if project_type:
            qs = qs.filter(project_type=project_type)
        return qs

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsStaff()]
        return []
