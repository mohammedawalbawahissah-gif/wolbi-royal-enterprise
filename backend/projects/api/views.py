from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from projects.models import Project
from .serializers import ProjectSerializer
from accounts.permissions import IsStaff
from core.services.ai import ask_ai, AIServiceUnavailable


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
        if self.action in ["create", "update", "partial_update", "destroy", "generate_case_study"]:
            return [IsStaff()]
        return []

    @action(detail=True, methods=["post"])
    def generate_case_study(self, request, slug=None):
        """
        Drafts a client-facing case study / blog-ready write-up from the
        project's existing fields. Saved to ai_case_study_draft for staff to
        review and edit — never auto-published.
        """
        project = self.get_object()
        try:
            draft = ask_ai(
                system_prompt=(
                    "You write short, credible case studies for Wolbi Royal Enterprise's website, "
                    "based on internal project records. Write 3-4 paragraphs in plain, confident "
                    "prose (no headers, no bullet points): what the problem was, what Wolbi built or "
                    "did, and the outcome. If outcome details aren't in the record, describe the "
                    "solution rather than inventing metrics or results."
                ),
                user_prompt=(
                    f"Title: {project.title}\nBusiness unit: {project.get_business_unit_display()}\n"
                    f"Type: {project.get_project_type_display()}\nStatus: {project.get_status_display()}\n"
                    f"Summary: {project.summary}\nDescription: {project.description}"
                ),
                max_tokens=600,
            )
        except AIServiceUnavailable as e:
            return Response({"error": str(e)}, status=503)
        project.ai_case_study_draft = draft
        project.save(update_fields=["ai_case_study_draft"])
        return Response({"ai_case_study_draft": draft})
