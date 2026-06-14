from django.contrib import admin
from .models import Industry


@admin.register(Industry)
class IndustryAdmin(admin.ModelAdmin):
    list_display  = ("name", "featured", "sort_order")
    list_filter   = ("featured",)
    search_fields = ("name", "short_description")
    prepopulated_fields = {"slug": ("name",)}
