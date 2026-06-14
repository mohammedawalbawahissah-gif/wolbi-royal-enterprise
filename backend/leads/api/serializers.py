from rest_framework import serializers
from ..models import Lead


class LeadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lead
        fields = "__all__"
        read_only_fields = ("is_contacted", "notes", "created_at")


class LeadAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lead
        fields = "__all__"
