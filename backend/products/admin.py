from django.contrib import admin
from .models import Product, ProductFeature, ProductRoadmapItem, ProductTargetUser


class ProductFeatureInline(admin.TabularInline):
    model = ProductFeature
    extra = 1


class ProductRoadmapInline(admin.TabularInline):
    model = ProductRoadmapItem
    extra = 1


class ProductTargetUserInline(admin.TabularInline):
    model = ProductTargetUser
    extra = 1


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display  = ("name", "product_key", "industry", "featured", "active", "sort_order")
    list_filter   = ("product_key", "industry", "featured", "active")
    search_fields = ("name", "short_description", "tagline")
    prepopulated_fields = {"slug": ("name",)}
    readonly_fields = ("created_at", "updated_at")
    inlines = [ProductFeatureInline, ProductRoadmapInline, ProductTargetUserInline]
