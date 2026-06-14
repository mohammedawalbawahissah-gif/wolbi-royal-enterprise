from rest_framework import serializers
from ..models import Product, ProductFeature, ProductRoadmapItem, ProductTargetUser


class ProductFeatureSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductFeature
        fields = ("id", "title", "description", "icon", "sort_order")


class ProductRoadmapItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductRoadmapItem
        fields = ("id", "title", "description", "is_complete", "sort_order")


class ProductTargetUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductTargetUser
        fields = ("id", "label")


class ProductSerializer(serializers.ModelSerializer):
    features     = ProductFeatureSerializer(many=True, read_only=True)
    roadmap_items = ProductRoadmapItemSerializer(many=True, read_only=True)
    target_users = ProductTargetUserSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = "__all__"


class ProductWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = "__all__"
