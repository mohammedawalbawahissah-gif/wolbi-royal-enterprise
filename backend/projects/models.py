from django.db import models
from leads.models import Lead
from accounts.models import User


class Project(models.Model):

    class BusinessUnit(models.TextChoices):
        TECHNOLOGIES = "TECHNOLOGIES", "Wolbi Technologies"
        MEDICAL = "MEDICAL", "Wolbi Medical Services"
        FOUNDATION = "FOUNDATION", "Wolbi Foundation"

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        COMPLETED = "COMPLETED", "Completed"
        CANCELLED = "CANCELLED", "Cancelled"

    class ProjectType(models.TextChoices):
        PRODUCT = "PRODUCT", "Product"
        CASE_STUDY = "CASE_STUDY", "Case Study"
        INTERNAL = "INTERNAL", "Internal Project"

    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)

    business_unit = models.CharField(
        max_length=20,
        choices=BusinessUnit.choices
    )

    summary = models.CharField(max_length=300)
    description = models.TextField()

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )

    project_type = models.CharField(
        max_length=20,
        choices=ProjectType.choices,
        default=ProjectType.CASE_STUDY
    )

    featured = models.BooleanField(default=False)

    project_url = models.URLField(blank=True, null=True)

    image = models.ImageField(
        upload_to="projects/",
        blank=True,
        null=True
    )

    # 🔥 CRM LINK: Lead → Project
    lead = models.ForeignKey(
        Lead,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="projects"
    )

    # 🔥 OPTIONAL: Assignment system
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_projects"
    )

    # AI-drafted marketing copy, generated on demand from the fields above.
    # Stored so staff can review/edit before publishing rather than the AI
    # writing straight to the public site.
    ai_case_study_draft = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title