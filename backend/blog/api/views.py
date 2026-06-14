from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from ..models import BlogPost
from .serializers import BlogPostSerializer, BlogPostListSerializer
from accounts.permissions import IsStaff


class BlogPostViewSet(viewsets.ModelViewSet):
    lookup_field = "slug"

    def get_queryset(self):
        qs = BlogPost.objects.all().order_by("-created_at")
        category = self.request.query_params.get("category")
        featured = self.request.query_params.get("featured")
        public = self.request.query_params.get("public")

        if public:
            qs = qs.filter(status="PUBLISHED")
        if category:
            qs = qs.filter(category=category)
        if featured:
            qs = qs.filter(featured=True, status="PUBLISHED")
        return qs

    def get_serializer_class(self):
        if self.action == "list":
            return BlogPostListSerializer
        return BlogPostSerializer

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsStaff()]
        return []

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
