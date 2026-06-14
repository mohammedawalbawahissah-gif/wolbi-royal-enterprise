from rest_framework.routers import DefaultRouter
from .views import UploadedFileViewSet

router = DefaultRouter()
router.register(r"", UploadedFileViewSet, basename="files")

urlpatterns = router.urls