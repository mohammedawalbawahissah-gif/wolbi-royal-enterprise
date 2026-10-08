from django.contrib import admin

from .models import PortalApp


@admin.register(PortalApp)
class PortalAppAdmin(admin.ModelAdmin):
    list_display = ("icon_preview", "name", "url", "status", "visibility", "allowed_roles", "order", "is_active")
    list_display_links = ("icon_preview", "name")
    list_editable = ("order", "is_active", "status")
    list_filter = ("visibility", "status", "is_active", "category")
    search_fields = ("name", "tagline", "url")
    readonly_fields = ("icon_preview",)
    prepopulated_fields = {"slug": ("name",)}
