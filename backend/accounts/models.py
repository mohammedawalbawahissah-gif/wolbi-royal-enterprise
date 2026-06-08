from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Admin"
        MEDICAL = "MEDICAL", "Medical Services"
        VA = "VA", "Virtual Assistant"
        CLIENT = "CLIENT", "Client"
        FOUNDATION = "FOUNDATION", "Foundation"

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.CLIENT
    )

    phone = models.CharField(max_length=20, blank=True, null=True)
    profile_image = models.ImageField(upload_to="profiles/", blank=True, null=True)

    def __str__(self):
        return f"{self.username} ({self.role})"