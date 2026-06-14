from django.db import models
from accounts.models import User
from projects.models import Project
from assignments.models import Assignment


class UploadedFile(models.Model):

    class FileType(models.TextChoices):
        IMAGE = "IMAGE", "Image"
        DOCUMENT = "DOCUMENT", "Document"
        OTHER = "OTHER", "Other"

    file = models.FileField(upload_to="uploads/")

    name = models.CharField(max_length=255)

    file_type = models.CharField(
        max_length=20,
        choices=FileType.choices,
        default=FileType.OTHER
    )

    uploaded_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="uploaded_files"
    )

    # 🔥 Optional links (flexible system)
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="files"
    )

    assignment = models.ForeignKey(
        Assignment,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="files"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name