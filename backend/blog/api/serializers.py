from rest_framework import serializers
from ..models import BlogPost


class BlogPostListSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = BlogPost
        fields = (
            "id", "title", "slug", "category", "excerpt",
            "featured_image", "status", "featured", "author_name", "created_at",
        )

    def get_author_name(self, obj):
        if obj.author:
            return f"{obj.author.first_name} {obj.author.last_name}".strip() or obj.author.username
        return "Wolbi Editorial"


class BlogPostSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = BlogPost
        fields = "__all__"
        read_only_fields = ("author",)

    def get_author_name(self, obj):
        if obj.author:
            return f"{obj.author.first_name} {obj.author.last_name}".strip() or obj.author.username
        return "Wolbi Editorial"
