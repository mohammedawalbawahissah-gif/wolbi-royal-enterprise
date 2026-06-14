from rest_framework import serializers
from ..models import Subscriber


class SubscriberSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subscriber
        fields = ("id", "email", "first_name", "created_at")
        read_only_fields = ("created_at",)
