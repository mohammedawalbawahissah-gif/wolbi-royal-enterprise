from django.db import models


class Program(models.Model):
    class FocusArea(models.TextChoices):
        HEALTH       = "HEALTH",       "Health"
        EDUCATION    = "EDUCATION",    "Education"
        YOUTH        = "YOUTH",        "Youth Empowerment"
        TECHNOLOGY   = "TECHNOLOGY",   "Technology Access"
        COMMUNITY    = "COMMUNITY",    "Community Development"

    name        = models.CharField(max_length=200)
    slug        = models.SlugField(unique=True)
    focus_area  = models.CharField(max_length=20, choices=FocusArea.choices)
    description = models.TextField()
    image       = models.ImageField(upload_to="foundation/programs/", blank=True, null=True)
    is_active   = models.BooleanField(default=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["focus_area", "name"]

    def __str__(self):
        return self.name


class FoundationEvent(models.Model):
    title       = models.CharField(max_length=200)
    description = models.TextField()
    program     = models.ForeignKey(Program, on_delete=models.SET_NULL, null=True, blank=True, related_name="events")
    event_date  = models.DateField()
    location    = models.CharField(max_length=200, blank=True)
    image       = models.ImageField(upload_to="foundation/events/", blank=True, null=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-event_date"]

    def __str__(self):
        return self.title


class Volunteer(models.Model):
    name       = models.CharField(max_length=200)
    email      = models.EmailField()
    phone      = models.CharField(max_length=30, blank=True)
    interest   = models.TextField(help_text="Why they want to volunteer")
    program    = models.ForeignKey(Program, on_delete=models.SET_NULL, null=True, blank=True, related_name="volunteers")
    is_approved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} — {self.email}"
