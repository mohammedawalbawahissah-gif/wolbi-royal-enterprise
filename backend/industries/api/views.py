from rest_framework import viewsets
from ..models import Industry
from .serializers import IndustrySerializer
from accounts.permissions import IsAdmin


class IndustryViewSet(viewsets.ModelViewSet):
    queryset = Industry.objects.all()
    serializer_class = IndustrySerializer

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAdmin()]
        return []
