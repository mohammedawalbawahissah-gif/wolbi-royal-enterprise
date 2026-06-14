from django.contrib import admin
from .models import Service


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "business_unit",
        "featured",
        "created_at",
    )

    list_filter = (
        "business_unit",
        "featured",
    )

    search_fields = (
        "name",
        "short_description",
    )

    prepopulated_fields = {
        "slug": ("name",)
    }

    readonly_fields = (
        "created_at",
    )