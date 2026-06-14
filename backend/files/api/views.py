from rest_framework import viewsets
from ..models import UploadedFile
from .serializers import UploadedFileSerializer
from accounts.permissions import IsStaff


class UploadedFileViewSet(viewsets.ModelViewSet):
    queryset = UploadedFile.objects.all()
    serializer_class = UploadedFileSerializer

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsStaff()]
        return []

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)

    def get_queryset(self):
        queryset = UploadedFile.objects.all()

        project = self.request.query_params.get("project")
        assignment = self.request.query_params.get("assignment")

        if project:
            queryset = queryset.filter(project_id=project)

        if assignment:
            queryset = queryset.filter(assignment_id=assignment)

        return queryset