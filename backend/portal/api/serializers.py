from rest_framework import serializers

from portal.models import PortalApp


class PortalAppSerializer(serializers.ModelSerializer):
    icon_image = serializers.SerializerMethodField()

    class Meta:
        model = PortalApp
        fields = (
            "id", "name", "slug", "tagline", "description", "url", "category",
            "icon", "icon_image", "color", "status", "visibility", "open_in_new_tab", "order",
        )

    def get_icon_image(self, obj):
        """Absolute URL of the uploaded logo, or null."""
        if not obj.icon_image:
            return None
        url = obj.icon_image.url
        request = self.context.get("request")
        return request.build_absolute_uri(url) if request and url.startswith("/") else url
