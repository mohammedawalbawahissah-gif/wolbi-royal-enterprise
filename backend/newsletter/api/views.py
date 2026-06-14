from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny

from ..models import Subscriber
from .serializers import SubscriberSerializer
from accounts.permissions import IsAdmin


class SubscribeView(generics.CreateAPIView):
    serializer_class = SubscriberSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        email = request.data.get("email", "").lower().strip()
        subscriber, created = Subscriber.objects.get_or_create(
            email=email,
            defaults={"first_name": request.data.get("first_name", ""), "is_active": True},
        )
        if not created:
            subscriber.is_active = True
            subscriber.save()
        return Response({"message": "Subscribed successfully."}, status=status.HTTP_200_OK)


class UnsubscribeView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", "").lower().strip()
        Subscriber.objects.filter(email=email).update(is_active=False)
        return Response({"message": "Unsubscribed successfully."})


class SubscriberListView(generics.ListAPIView):
    queryset = Subscriber.objects.filter(is_active=True).order_by("-created_at")
    serializer_class = SubscriberSerializer
    permission_classes = [IsAdmin]
