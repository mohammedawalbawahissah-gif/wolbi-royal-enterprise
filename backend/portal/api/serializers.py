from rest_framework import serializers

from portal.models import PortalApp


class PortalAppSerializer(serializers.ModelSerializer):
    class Meta:
        model = PortalApp
        fields = (
            "id", "name", "slug", "tagline", "description", "url", "category",
            "icon", "color", "status", "visibility", "open_in_new_tab", "order",
        )
