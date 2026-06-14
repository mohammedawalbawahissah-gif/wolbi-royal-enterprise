from rest_framework import viewsets, generics
from rest_framework.permissions import AllowAny

from ..models import Program, FoundationEvent, Volunteer
from .serializers import ProgramSerializer, FoundationEventSerializer, VolunteerSerializer
from accounts.permissions import IsAdmin, IsFoundation, IsStaff


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
