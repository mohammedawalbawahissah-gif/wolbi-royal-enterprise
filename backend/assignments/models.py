from django.db import models
from accounts.models import User
from leads.models import Lead
from projects.models import Project


class Assignment(models.Model):

    class Status(models.TextChoices):
        PENDING     = "PENDING",     "Pending"
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        REVIEW      = "REVIEW",      "Under Review"
        COMPLETED   = "COMPLETED",   "Completed"

    title       = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    assigned_to = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="assignments"
    )
    assigned_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name="created_assignments"
    )

    lead = models.ForeignKey(
        Lead, on_delete=models.SET_NULL, null=True, blank=True, related_name="assignments"
    )
    project = models.ForeignKey(
        Project, on_delete=models.SET_NULL, null=True, blank=True, related_name="assignments"
    )

    status   = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    due_date = models.DateField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class AssignmentComment(models.Model):
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name="comments")
    author     = models.ForeignKey(User, on_delete=models.CASCADE)
    comment    = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"Comment by {self.author.username} on {self.assignment.title}"


class AssignmentActivity(models.Model):
    assignment  = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name="activities")
    message     = models.CharField(max_length=255)
    created_by  = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.assignment.title} — {self.message}"
