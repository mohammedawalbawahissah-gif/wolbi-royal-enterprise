from rest_framework import serializers
from ..models import Lead, LeadReply


class LeadReplySerializer(serializers.ModelSerializer):
    staff_name = serializers.CharField(source="staff.get_full_name", read_only=True, default="")

    class Meta:
        model = LeadReply
        fields = ("id", "lead", "staff", "staff_name", "message", "email_sent", "sent_at")
        read_only_fields = ("staff", "email_sent", "sent_at")


class LeadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lead
        fields = "__all__"
        read_only_fields = ("is_contacted", "notes", "created_at")


class LeadAdminSerializer(serializers.ModelSerializer):
    replies = LeadReplySerializer(many=True, read_only=True)

    class Meta:
        model = Lead
        fields = "__all__"
        read_only_fields = (
            "ai_summary", "ai_priority", "ai_suggested_type",
            "ai_possible_duplicate", "ai_processed_at",
        )
