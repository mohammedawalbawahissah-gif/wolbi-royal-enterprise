from django.contrib import admin, messages

from .models import EmailLog, Notification
from .services import retry_email


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display  = ("user", "kind", "title", "is_read", "created_at")
    list_filter   = ("kind", "is_read")
    search_fields = ("user__username", "title")
    readonly_fields = ("created_at",)


@admin.register(EmailLog)
class EmailLogAdmin(admin.ModelAdmin):
    list_display  = ("created_at", "status", "audience", "kind", "to", "subject", "attempts")
    list_filter   = ("status", "audience", "kind")
    search_fields = ("to", "subject", "provider_id")
    readonly_fields = [f.name for f in EmailLog._meta.fields]
    actions = ["resend"]

    def has_add_permission(self, request):
        return False

    @admin.action(description="Re-send selected emails")
    def resend(self, request, queryset):
        results = [retry_email(log).status for log in queryset]
        sent = results.count(EmailLog.Status.SENT)
        level = messages.SUCCESS if sent == len(results) else messages.WARNING
        self.message_user(request, f"Re-sent {sent} of {len(results)} email(s).", level)
