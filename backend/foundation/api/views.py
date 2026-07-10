from rest_framework import viewsets, generics
from rest_framework.permissions import AllowAny
from rest_framework.decorators import action
from rest_framework.response import Response

from ..models import Program, FoundationEvent, Volunteer
from .serializers import ProgramSerializer, FoundationEventSerializer, VolunteerSerializer
from accounts.permissions import IsAdmin, IsFoundation, IsStaff
from core.services.ai import ask_ai_json, AIServiceUnavailable


class ProgramViewSet(viewsets.ModelViewSet):
    queryset = Program.objects.filter(is_active=True)
    serializer_class = ProgramSerializer

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsStaff()]
        return [AllowAny()]


class FoundationEventViewSet(viewsets.ModelViewSet):
    queryset = FoundationEvent.objects.all()
    serializer_class = FoundationEventSerializer

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsStaff()]
        return [AllowAny()]


class VolunteerCreateView(generics.CreateAPIView):
    queryset = Volunteer.objects.all()
    serializer_class = VolunteerSerializer
    permission_classes = [AllowAny]


class VolunteerListView(generics.ListAPIView):
    queryset = Volunteer.objects.all().order_by("-created_at")
    serializer_class = VolunteerSerializer
    permission_classes = [IsFoundation]


class VolunteerSuggestProgramView(generics.GenericAPIView):
    """
    Matches a volunteer's stated interest against active Programs and
    suggests the best fit(s), so the Foundation team doesn't have to
    manually read every application against every program description.
    """
    queryset = Volunteer.objects.all()
    permission_classes = [IsFoundation]

    def get(self, request, pk=None):
        volunteer = self.get_object()
        programs = Program.objects.filter(is_active=True)
        catalog = "\n".join(
            f"- id={p.id}, name={p.name}, focus_area={p.get_focus_area_display()}: {p.description}"
            for p in programs
        )
        if not catalog:
            return Response({"suggestions": []})

        try:
            data = ask_ai_json(
                system_prompt=(
                    "You match a volunteer application to the best-fit program(s) from a list, based "
                    "on their stated interest. Return JSON: {\"suggestions\": [{\"program_id\": int, "
                    "\"reason\": \"short reason\"}]}. Suggest at most 2, only if they genuinely fit."
                ),
                user_prompt=f"Volunteer interest: {volunteer.interest}\n\nActive programs:\n{catalog}",
                max_tokens=250,
            )
        except AIServiceUnavailable as e:
            return Response({"error": str(e)}, status=503)
        return Response(data or {"suggestions": []})
