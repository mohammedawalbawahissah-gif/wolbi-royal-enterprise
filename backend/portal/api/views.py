from rest_framework.generics import ListAPIView
from rest_framework.permissions import AllowAny

from portal.models import PortalApp
from .serializers import PortalAppSerializer


class PortalAppListView(ListAPIView):
    """
    GET /api/v1/portal/apps/
    Anonymous visitors get PUBLIC apps. Signed-in users also get MEMBERS apps
    their role is allowed to see (admins see all). Hidden apps never appear.
    """
    permission_classes = [AllowAny]
    serializer_class = PortalAppSerializer
    pagination_class = None
    filter_backends = []

    def get_queryset(self):
        return PortalApp.objects.filter(is_active=True)

    def filter_queryset(self, queryset):
        user = self.request.user
        return [a for a in queryset if a.visible_to(user)]
