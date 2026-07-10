from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny

from ..models import Subscriber
from .serializers import SubscriberSerializer
from accounts.permissions import IsAdmin
from core.services.ai import ask_ai, AIServiceUnavailable


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


class NewsletterAIDraftView(APIView):
    """
    Drafts newsletter copy for a given division/topic. There's no Campaign
    model in this schema yet, so this returns text for staff to review and
    paste into whatever send tool is used — it doesn't send anything itself.
    """
    permission_classes = [IsAdmin]

    def post(self, request):
        topic = (request.data.get("topic") or "").strip()
        business_unit = request.data.get("business_unit", "GENERAL")
        if not topic:
            return Response({"error": "topic is required"}, status=400)

        try:
            draft = ask_ai(
                system_prompt=(
                    "You write short email newsletters for Wolbi Royal Enterprise's subscriber list. "
                    "Write a subject line and a 3-4 paragraph body, friendly and concrete, for the "
                    f"'{business_unit}' division/audience. Format as:\nSubject: ...\n\n<body>"
                ),
                user_prompt=f"Topic/update to cover: {topic}",
                max_tokens=500,
            )
        except AIServiceUnavailable as e:
            return Response({"error": str(e)}, status=503)
        return Response({"draft": draft})
