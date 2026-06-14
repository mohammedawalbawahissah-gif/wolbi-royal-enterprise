from django.db import models
from accounts.models import User


class BlogPost(models.Model):

    class Category(models.TextChoices):
        MEDICAL = "MEDICAL", "Medical"
        TECHNOLOGY = "TECHNOLOGY", "Technology"
        BUSINESS = "BUSINESS", "Business"
        FOUNDATION = "FOUNDATION", "Foundation"
        AGRICULTURE = "AGRICULTURE", "Agriculture"

    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        PUBLISHED = "PUBLISHED", "Published"

    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)

    category = models.CharField(
        max_length=20,
        choices=Category.choices
    )

    excerpt = models.TextField()
    content = models.TextField()

    featured_image = models.ImageField(
        upload_to="blog/",
        blank=True,
        null=True
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT
    )

    featured = models.BooleanField(default=False)

    # 🔥 NEW: AUTHOR RELATION
    author = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="blog_posts",
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title