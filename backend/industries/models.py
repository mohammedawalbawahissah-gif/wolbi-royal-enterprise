from django.db import models


class Industry(models.Model):
    name             = models.CharField(max_length=100)
    slug             = models.SlugField(unique=True)
    icon             = models.CharField(max_length=100, blank=True)
    short_description = models.CharField(max_length=300)
    description      = models.TextField()
    challenges       = models.TextField(blank=True, help_text="Key challenges in this industry")
    wolbi_solutions  = models.TextField(blank=True, help_text="How Wolbi addresses these challenges")
    image            = models.ImageField(upload_to="industries/", blank=True, null=True)
    featured         = models.BooleanField(default=False)
    sort_order       = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "name"]
        verbose_name_plural = "Industries"

    def __str__(self):
        return self.name
