from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import AssignmentViewSet, AssignmentCommentCreateView

router = DefaultRouter()
router.register(r"", AssignmentViewSet, basename="assignments")

# comments/ must come BEFORE the router: the router is registered at r"" so its
# detail route (<pk>/) would otherwise swallow "comments/" and return 405.
urlpatterns = [
    path("comments/", AssignmentCommentCreateView.as_view(), name="assignment-comment"),
] + router.urls
