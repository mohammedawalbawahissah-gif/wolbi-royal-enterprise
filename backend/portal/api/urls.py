from django.urls import path

from .views import PortalAppListView

urlpatterns = [
    path("apps/", PortalAppListView.as_view(), name="portal-apps"),
]
