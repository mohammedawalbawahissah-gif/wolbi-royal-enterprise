from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import SiteConfigurationViewSet, DashboardAnalyticsView

router = DefaultRouter()
router.register(r"config", SiteConfigurationViewSet, basename="core-config")

urlpatterns = router.urls + [
    path("analytics/", DashboardAnalyticsView.as_view(), name="dashboard-analytics"),
]
