from django.contrib import admin
from .models import Lead


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "email",
        "inquiry_type",
        "ai_priority",
        "is_contacted",
        "created_at",
    )

    list_filter = (
        "inquiry_type",
        "ai_priority",
        "ai_possible_duplicate",
        "is_contacted",
    )

    search_fields = (
        "name",
        "email",
        "subject",
    )

    readonly_fields = (
        "created_at",
        "ai_summary",
        "ai_priority",
        "ai_suggested_type",
        "ai_possible_duplicate",
        "ai_processed_at",
    )