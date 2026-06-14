from rest_framework import viewsets
from rest_framework.permissions import AllowAny

from ..models import Testimonial
from .serializers import TestimonialSerializer
from accounts.permissions import IsAdmin


class TestimonialViewSet(viewsets.ModelViewSet):
    queryset = Testimonial.objects.filter(is_approved=True)
    serializer_class = TestimonialSerializer

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAdmin()]
        return [AllowAny()]
