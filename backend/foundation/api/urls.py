from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import ProgramViewSet, FoundationEventViewSet, VolunteerCreateView, VolunteerListView

router = DefaultRouter()
router.register(r"programs", ProgramViewSet, basename="programs")
router.register(r"events",   FoundationEventViewSet, basename="foundation-events")

urlpatterns = router.urls + [
    path("volunteers/",      VolunteerCreateView.as_view(), name="volunteer-apply"),
    path("volunteers/list/", VolunteerListView.as_view(),   name="volunteer-list"),
]
