from rest_framework.routers import DefaultRouter
from .views import IndustryViewSet

router = DefaultRouter()
router.register(r"", IndustryViewSet, basename="industries")

urlpatterns = router.urls
