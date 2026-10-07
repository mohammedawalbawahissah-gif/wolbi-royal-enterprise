from rest_framework import generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..models import Notification
from .serializers import NotificationSerializer


class NotificationListView(generics.ListAPIView):
    """GET /notifications/?unread=1 — the user's own notifications, newest first."""
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Notification.objects.filter(user=self.request.user)
        if self.request.query_params.get("unread") in ("1", "true"):
            qs = qs.filter(is_read=False)
        return qs


class NotificationMarkReadView(generics.UpdateAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    def patch(self, request, *args, **kwargs):
        instance = self.get_object()
        if not instance.is_read:
            instance.is_read = True
            instance.save(update_fields=["is_read"])
        return Response({"status": "marked as read"})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def unread_count(request):
    """Cheap endpoint the dashboard bell polls."""
    return Response({"unread": Notification.objects.filter(user=request.user, is_read=False).count()})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def mark_all_read(request):
    Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
    return Response({"status": "all notifications marked as read"})


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def preferences(request):
    """GET/PATCH {"email_notifications": bool} for the logged-in user."""
    user = request.user
    if request.method == "PATCH" and "email_notifications" in request.data:
        value = request.data["email_notifications"]
        user.email_notifications = value in (True, "true", "1", 1)
        user.save(update_fields=["email_notifications"])
    return Response({"email_notifications": user.email_notifications, "email": user.email})
