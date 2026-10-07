import re

from django.core.exceptions import ValidationError
from django.core.validators import URLValidator
from django.db import models

HEX_COLOR = re.compile(r"^#[0-9a-fA-F]{6}$")


def valid_roles():
    from accounts.models import User
    return {value for value, _ in User.Role.choices}


class PortalApp(models.Model):
    """
    An app that lives outside wolbiroyal.com (usually on its own subdomain) and
    is linked from the website. Add, reorder or hide apps in Django admin —
    no code change or redeploy needed.
    """

    class Visibility(models.TextChoices):
        PUBLIC  = "PUBLIC",  "Public — shown on the public Apps page"
        MEMBERS = "MEMBERS", "Members — only after signing in to the dashboard"

    class Status(models.TextChoices):
        LIVE        = "LIVE",        "Live"
        BETA        = "BETA",        "Beta"
        COMING_SOON = "COMING_SOON", "Coming soon"

    name        = models.CharField(max_length=80)
    slug        = models.SlugField(unique=True)
    tagline     = models.CharField(max_length=140, help_text="One line shown on the card.")
    description = models.TextField(blank=True)
    url         = models.CharField(
        max_length=300,
        validators=[URLValidator(schemes=["http", "https"])],
        help_text="Full address, e.g. https://farmasyst.wolbiroyal.com",
    )
    category    = models.CharField(max_length=40, blank=True, help_text="e.g. Health, Agriculture, Finance")
    icon        = models.CharField(max_length=8, blank=True, help_text="One emoji, e.g. 🌾")
    color       = models.CharField(max_length=7, default="#1e3a5f", help_text="Accent colour, e.g. #16a34a")
    status      = models.CharField(max_length=12, choices=Status.choices, default=Status.LIVE)
    visibility  = models.CharField(max_length=10, choices=Visibility.choices, default=Visibility.PUBLIC)
    allowed_roles = models.CharField(
        max_length=120, blank=True,
        help_text="Members apps only. Comma-separated roles that can see it "
                  "(ADMIN, MEDICAL, TECH, VA, CLIENT, FOUNDATION). Leave blank for every signed-in user. "
                  "Admins always see everything.",
    )
    open_in_new_tab = models.BooleanField(default=True)
    order       = models.PositiveIntegerField(default=100, help_text="Lower numbers appear first.")
    is_active   = models.BooleanField(default=True, help_text="Untick to hide without deleting.")
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order", "name"]
        verbose_name = "app"

    def __str__(self):
        return self.name

    def role_list(self):
        return [r.strip().upper() for r in self.allowed_roles.split(",") if r.strip()]

    def clean(self):
        if not HEX_COLOR.match(self.color or ""):
            raise ValidationError({"color": "Use a 6-digit hex colour like #1e3a5f."})
        unknown = set(self.role_list()) - valid_roles()
        if unknown:
            raise ValidationError({"allowed_roles": f"Unknown role(s): {', '.join(sorted(unknown))}."})

    def visible_to(self, user):
        """Whether this app should be listed for `user` (None/anonymous allowed)."""
        if not self.is_active:
            return False
        if self.visibility == self.Visibility.PUBLIC:
            return True
        if not (user and user.is_authenticated):
            return False
        if user.role == "ADMIN" or user.is_superuser:
            return True
        roles = self.role_list()
        return not roles or user.role in roles
