from datetime import timedelta
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from django.utils import timezone
from rest_framework import serializers

from ..models import ConsultationSession

# Keyword -> division routing, mirrors the pattern Lead already uses for
# inquiry_type. Kept intentionally simple; a mis-route just means a staff
# member reassigns it, not a hard failure.
_MEDICAL_KEYWORDS = (
    "health", "medical", "doctor", "clinic", "symptom", "diagnos", "lab",
    "test", "pregnan", "maternal", "telehealth", "prescription", "sick",
)

DURATIONS = (15, 30, 45, 60)
MIN_LEAD_MINUTES = 30        # a booking must be at least this far ahead
MAX_LEAD_DAYS = 90


def infer_division(reason: str) -> str:
    lowered = (reason or "").lower()
    if any(k in lowered for k in _MEDICAL_KEYWORDS):
        return ConsultationSession.Division.MEDICAL
    return ConsultationSession.Division.VIRTUAL


def validate_future_time(value, *, min_lead=MIN_LEAD_MINUTES):
    now = timezone.now()
    if value < now + timedelta(minutes=min_lead):
        raise serializers.ValidationError(
            f"Please choose a time at least {min_lead} minutes from now.")
    if value > now + timedelta(days=MAX_LEAD_DAYS):
        raise serializers.ValidationError(f"Bookings can be made up to {MAX_LEAD_DAYS} days ahead.")
    return value


def validate_timezone_name(value):
    if not value:
        return ""
    try:
        ZoneInfo(value)
    except (ZoneInfoNotFoundError, ValueError):
        return ""    # a bad zone name just means emails fall back to GMT
    return value


class ConsultationRequestSerializer(serializers.ModelSerializer):
    """Public-facing: what a visitor submits to start or book a session."""

    class Meta:
        model = ConsultationSession
        fields = ("id", "name", "email", "phone", "mode", "reason", "scheduled_time",
                  "duration_minutes", "timezone", "access_token")
        # The token is handed back once, on creation, so the page can poll and
        # join without the visitor retyping anything. It is never listed again.
        read_only_fields = ("access_token",)
        extra_kwargs = {"timezone": {"required": False}, "duration_minutes": {"required": False}}

    def validate_duration_minutes(self, value):
        if value not in DURATIONS:
            raise serializers.ValidationError(f"Choose one of {', '.join(map(str, DURATIONS))} minutes.")
        return value

    def validate_timezone(self, value):
        return validate_timezone_name(value)

    def validate(self, attrs):
        if attrs.get("mode") == ConsultationSession.Mode.SCHEDULED:
            if not attrs.get("scheduled_time"):
                raise serializers.ValidationError({"scheduled_time": "Required when booking a scheduled session."})
            try:
                validate_future_time(attrs["scheduled_time"])
            except serializers.ValidationError as e:
                raise serializers.ValidationError({"scheduled_time": e.detail})
        else:
            attrs["scheduled_time"] = None
        return attrs

    def create(self, validated_data):
        validated_data["division"] = infer_division(validated_data.get("reason", ""))
        return super().create(validated_data)


class ConsultationStatusSerializer(serializers.ModelSerializer):
    """What the public booking page polls. Deliberately excludes internal
    fields (no reason, phone, room details or staff identity)."""
    join_state = serializers.SerializerMethodField()
    join_opens_at = serializers.SerializerMethodField()
    join_closes_at = serializers.SerializerMethodField()
    server_time = serializers.SerializerMethodField()

    class Meta:
        model = ConsultationSession
        fields = ("id", "status", "mode", "scheduled_time", "duration_minutes", "timezone",
                  "division", "join_state", "join_opens_at", "join_closes_at", "server_time")

    def get_join_state(self, obj):
        return obj.join_state()

    def get_join_opens_at(self, obj):
        return obj.join_window()[0]

    def get_join_closes_at(self, obj):
        return obj.join_window()[1]

    def get_server_time(self, obj):
        return timezone.now()


class ConsultationSessionSerializer(serializers.ModelSerializer):
    """Full staff-facing view."""
    assigned_staff_name = serializers.CharField(source="assigned_staff.get_full_name", read_only=True, default="")
    join_state = serializers.SerializerMethodField()
    join_opens_at = serializers.SerializerMethodField()

    class Meta:
        model = ConsultationSession
        exclude = ("access_token",)
        read_only_fields = (
            "room_name", "room_url", "room_expires_at", "assigned_staff", "division", "created_at",
            "updated_at", "status", "confirmed_at", "started_at", "ended_at", "reminder_sent_at",
            "cancelled_by",
        )

    def get_join_state(self, obj):
        return obj.join_state(staff=True)

    def get_join_opens_at(self, obj):
        return obj.join_window(staff=True)[0]
