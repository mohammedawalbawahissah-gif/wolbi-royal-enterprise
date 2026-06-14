from rest_framework import viewsets, generics
from rest_framework.permissions import IsAuthenticated

from ..models import Assignment, AssignmentComment
from .serializers import (
    AssignmentSerializer,
    AssignmentWriteSerializer,
    AssignmentCommentSerializer,
)
from accounts.permissions import IsStaff
from notifications.models import Notification


class AssignmentViewSet(viewsets.ModelViewSet):
    queryset = Assignment.objects.all().order_by("-created_at")

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return AssignmentWriteSerializer
        return AssignmentSerializer

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsStaff()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        assignment = serializer.save(assigned_by=self.request.user)
        Notification.objects.create(
            user=assignment.assigned_to,
            title="New Assignment",
            message=f"You have been assigned: {assignment.title}",
        )

    def perform_update(self, serializer):
        assignment = serializer.save()
        Notification.objects.create(
            user=assignment.assigned_to,
            title="Assignment Updated",
            message=f"Assignment updated: {assignment.title}",
        )


class AssignmentCommentCreateView(generics.CreateAPIView):
    serializer_class = AssignmentCommentSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
