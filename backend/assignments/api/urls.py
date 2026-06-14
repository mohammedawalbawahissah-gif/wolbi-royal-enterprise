from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import AssignmentViewSet, AssignmentCommentCreateView

router = DefaultRouter()
router.register(r"", AssignmentViewSet, basename="assignments")

urlpatterns = router.urls + [
    path("comments/", AssignmentCommentCreateView.as_view(), name="assignment-comment"),
]
