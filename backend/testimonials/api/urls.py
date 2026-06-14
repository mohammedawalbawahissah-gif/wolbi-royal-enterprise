from rest_framework.routers import DefaultRouter
from .views import TestimonialViewSet

router = DefaultRouter()
router.register(r"", TestimonialViewSet, basename="testimonials")

urlpatterns = router.urls
