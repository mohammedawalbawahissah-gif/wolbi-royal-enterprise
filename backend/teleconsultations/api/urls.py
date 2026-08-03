from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    ConsultationRequestView,
    ConsultationStatusView,
    ConsultationJoinView,
    StaffConsultationViewSet,
)

router = DefaultRouter()
router.register(r"sessions", StaffConsultationViewSet, basename="teleconsultation-sessions")

urlpatterns = [
    path("request/", ConsultationRequestView.as_view(), name="teleconsult-request"),
    path("<int:pk>/status/", ConsultationStatusView.as_view(), name="teleconsult-status"),
    path("<int:pk>/join/", ConsultationJoinView.as_view(), name="teleconsult-join"),
] + router.urls
