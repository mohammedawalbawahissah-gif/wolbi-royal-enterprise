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
        read_only_fields = (
            "ai_summary", "ai_priority", "ai_suggested_type",
            "ai_possible_duplicate", "ai_processed_at",
        )
