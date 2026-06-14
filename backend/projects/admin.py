from django.contrib import admin
from .models import Project


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "business_unit",
        "status",
        "featured",
        "created_at",
    )

    list_filter = (
        "business_unit",
        "status",
        "featured",
    )

    search_fields = (
        "title",
        "summary",
    )

    prepopulated_fields = {
        "slug": ("title",)
    }

    readonly_fields = (
        "created_at",
        "updated_at",
    )