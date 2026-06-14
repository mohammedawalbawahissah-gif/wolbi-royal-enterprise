from django.contrib import admin
from .models import Lead


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "email",
        "inquiry_type",
        "is_contacted",
        "created_at",
    )

    list_filter = (
        "inquiry_type",
        "is_contacted",
    )

    search_fields = (
        "name",
        "email",
        "subject",
    )

    readonly_fields = (
        "created_at",
    )