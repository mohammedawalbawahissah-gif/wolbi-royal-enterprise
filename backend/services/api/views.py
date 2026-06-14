from rest_framework import viewsets
from services.models import Service
from .serializers import ServiceSerializer
from accounts.permissions import IsStaff


class ServiceViewSet(viewsets.ModelViewSet):
    serializer_class = ServiceSerializer
    lookup_field = "slug"

    def get_queryset(self):
        qs = Service.objects.all().order_by("business_unit", "name")
        unit = self.request.query_params.get("business_unit")
        featured = self.request.query_params.get("featured")
        if unit:
            qs = qs.filter(business_unit=unit)
        if featured:
            qs = qs.filter(featured=True)
        return qs

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsStaff()]
        return []
