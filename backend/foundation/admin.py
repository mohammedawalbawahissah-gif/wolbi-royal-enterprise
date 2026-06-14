from django.contrib import admin
from .models import Program, FoundationEvent, Volunteer


@admin.register(Program)
class ProgramAdmin(admin.ModelAdmin):
    list_display    = ("name", "focus_area", "is_active", "created_at")
    list_filter     = ("focus_area", "is_active")
    search_fields   = ("name", "description")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(FoundationEvent)
class FoundationEventAdmin(admin.ModelAdmin):
    list_display  = ("title", "program", "event_date", "location")
    list_filter   = ("program",)
    search_fields = ("title", "location")


@admin.register(Volunteer)
class VolunteerAdmin(admin.ModelAdmin):
    list_display  = ("name", "email", "program", "is_approved", "created_at")
    list_filter   = ("is_approved", "program")
    search_fields = ("name", "email")
