from django.contrib import admin
from .models import Subscriber


@admin.register(Subscriber)
class SubscriberAdmin(admin.ModelAdmin):
    list_display  = ("email", "first_name", "is_active", "created_at")
    list_filter   = ("is_active",)
    search_fields = ("email", "first_name")
    readonly_fields = ("created_at",)
