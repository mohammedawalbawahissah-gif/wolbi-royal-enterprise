from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = (
        "username",
        "email",
        "first_name",
        "last_name",
        "role",
        "is_staff",
        "is_active",
    )

    list_filter = (
        "role",
        "is_staff",
        "is_active",
    )

    fieldsets = UserAdmin.fieldsets + (
        (
            "Wolbi Information",
            {
                "fields": (
                    "role",
                    "phone",
                    "profile_image",
                )
            },
        ),
    )

    add_fieldsets = UserAdmin.add_fieldsets + (
        (
            "Wolbi Information",
            {
                "fields": (
                    "role",
                    "phone",
                )
            },
        ),
    )