from rest_framework import serializers
from ..models import ConsultationSession


# Keyword -> division routing, mirrors the pattern Lead already uses for
# inquiry_type. Kept intentionally simple; a mis-route just means a staff
# member reassigns it, not a hard failure.
_MEDICAL_KEYWORDS = (
    "health", "medical", "doctor", "clinic", "symptom", "diagnos", "lab",
    "test", "pregnan", "maternal", "telehealth", "prescription", "sick",
)


def infer_division(reason: str) -> str:
    lowered = (reason or "").lower()
    if any(k in lowered for k in _MEDICAL_KEYWORDS):
        return ConsultationSession.Division.MEDICAL
    return ConsultationSession.Division.VIRTUAL


class ConsultationRequestSerializer(serializers.ModelSerializer):
    """Public-facing: what a visitor submits to start or book a session."""

    class Meta:
        model = ConsultationSession
        fields = ("id", "name", "email", "phone", "mode", "reason", "scheduled_time")

    def validate(self, attrs):
        if attrs.get("mode") == ConsultationSession.Mode.SCHEDULED and not attrs.get("scheduled_time"):
            raise serializers.ValidationError({"scheduled_time": "Required when booking a scheduled session."})
        return attrs

    def create(self, validated_data):
        validated_data["division"] = infer_division(validated_data.get("reason", ""))
        return super().create(validated_data)


class ConsultationStatusSerializer(serializers.ModelSerializer):
    """What the public booking page polls to see if a staff member has
    claimed the session yet. Deliberately excludes internal fields."""

    class Meta:
        model = ConsultationSession
        fields = ("id", "status", "mode", "scheduled_time", "division")


class ConsultationSessionSerializer(serializers.ModelSerializer):
    """Full staff-facing view."""
    assigned_staff_name = serializers.CharField(source="assigned_staff.get_full_name", read_only=True, default="")

    class Meta:
        model = ConsultationSession
        fields = "__all__"
        read_only_fields = ("room_name", "room_url", "assigned_staff", "division", "created_at", "updated_at")
