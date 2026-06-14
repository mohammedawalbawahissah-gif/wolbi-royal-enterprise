from django.contrib import admin
from .models import SiteConfiguration


@admin.register(SiteConfiguration)
class SiteConfigurationAdmin(admin.ModelAdmin):
    list_display = (
        "company_name",
        "contact_email",
        "contact_phone",
        "updated_at",
    )

    search_fields = (
        "company_name",
        "contact_email",
    )

    readonly_fields = (
        "updated_at",
    )