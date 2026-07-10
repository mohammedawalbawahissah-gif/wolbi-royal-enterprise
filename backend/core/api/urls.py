from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import SiteConfigurationViewSet, DashboardAnalyticsView, AIAnalyticsSummaryView, AIConciergeView

router = DefaultRouter()
router.register(r"config", SiteConfigurationViewSet, basename="core-config")

urlpatterns = router.urls + [
    path("analytics/", DashboardAnalyticsView.as_view(), name="dashboard-analytics"),
    path("analytics/ai-summary/", AIAnalyticsSummaryView.as_view(), name="dashboard-ai-summary"),
    path("ai-concierge/", AIConciergeView.as_view(), name="ai-concierge"),
]
