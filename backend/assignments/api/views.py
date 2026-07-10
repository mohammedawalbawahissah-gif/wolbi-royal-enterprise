from rest_framework import viewsets, generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response

from ..models import Assignment, AssignmentComment
from .serializers import (
    AssignmentSerializer,
    AssignmentWriteSerializer,
    AssignmentCommentSerializer,
)
from accounts.permissions import IsStaff
from notifications.models import Notification
from core.services.ai import ask_ai, ask_ai_json, AIServiceUnavailable


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

    @action(detail=False, methods=["post"], permission_classes=[IsStaff])
    def suggest_assignee(self, request):
        """
        Given a draft task title/description, suggests which staff member to
        assign it to based on their role + specialty. Used on the "create
        assignment" form before a human picks assigned_to.
        """
        from accounts.models import User

        title = request.data.get("title", "")
        description = request.data.get("description", "")
        if not title and not description:
            return Response({"error": "title or description is required"}, status=400)

        staff = User.objects.exclude(role="CLIENT").exclude(specialty="")
        roster = "\n".join(
            f"- id={u.id}, name={u.get_full_name() or u.username}, role={u.role}, specialty={u.get_specialty_display()}"
            for u in staff
        )
        if not roster:
            return Response({"suggestions": []})

        try:
            data = ask_ai_json(
                system_prompt=(
                    "You match an internal task to the best 1-2 staff members from a roster, based on "
                    "role and specialty. Return JSON: {\"suggestions\": [{\"user_id\": int, \"reason\": "
                    "\"short reason\"}]}. Only suggest people whose specialty genuinely fits."
                ),
                user_prompt=f"Task: {title}\n{description}\n\nStaff roster:\n{roster}",
                max_tokens=250,
            )
        except AIServiceUnavailable as e:
            return Response({"error": str(e)}, status=503)
        return Response(data or {"suggestions": []})
        """
        Rolls up an assignment's comments + activity log into a short,
        readable 'what's happened so far' summary for anyone catching up
        (an admin checking progress, a new assignee, etc).
        """
        assignment = self.get_object()
        comments = "\n".join(
            f"- {c.author.username}: {c.comment}" for c in assignment.comments.all()
        ) or "No comments."
        activity = "\n".join(
            f"- {a.created_at.strftime('%Y-%m-%d')} {a.created_by.username}: {a.message}"
            for a in assignment.activities.all()
        ) or "No activity logged."

        try:
            summary = ask_ai(
                system_prompt=(
                    "You summarize the current state of an internal work assignment at Wolbi Royal "
                    "Enterprise for someone catching up on it. Write 2-4 sentences: what's been done, "
                    "what's still open, and anything that looks stuck or blocked. Plain prose, no "
                    "headers or bullet points."
                ),
                user_prompt=(
                    f"Title: {assignment.title}\nStatus: {assignment.get_status_display()}\n"
                    f"Description: {assignment.description}\nDue: {assignment.due_date or 'no due date'}\n\n"
                    f"Comments:\n{comments}\n\nActivity log:\n{activity}"
                ),
                max_tokens=250,
            )
        except AIServiceUnavailable as e:
            return Response({"error": str(e)}, status=503)
        return Response({"summary": summary})


class AssignmentCommentCreateView(generics.CreateAPIView):
    serializer_class = AssignmentCommentSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
