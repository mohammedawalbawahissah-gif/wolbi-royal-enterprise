from django.urls import path
from .views import NotificationListView, NotificationMarkReadView, mark_all_read

urlpatterns = [
    path("",              NotificationListView.as_view(),     name="notifications"),
    path("<int:pk>/read/", NotificationMarkReadView.as_view(), name="notification-read"),
    path("read-all/",     mark_all_read,                      name="notifications-read-all"),
]
