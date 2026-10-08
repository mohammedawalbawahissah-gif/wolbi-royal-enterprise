from django.contrib import admin

from .models import ConsultationSession


@admin.register(ConsultationSession)
class ConsultationSessionAdmin(admin.ModelAdmin):
    list_display = ("name", "division", "mode", "status", "scheduled_time", "assigned_staff", "created_at")
    list_filter = ("status", "mode", "division")
    search_fields = ("name", "email", "reason")
    readonly_fields = ("access_token", "room_name", "room_url", "room_expires_at", "created_at", "updated_at",
                       "confirmed_at", "started_at", "ended_at", "reminder_sent_at")
    date_hierarchy = "created_at"
