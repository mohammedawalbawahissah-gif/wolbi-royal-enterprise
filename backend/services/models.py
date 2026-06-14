from django.db import models


class Service(models.Model):

    class BusinessUnit(models.TextChoices):
        TECHNOLOGIES      = "TECHNOLOGIES",      "Wolbi Technologies"
        MEDICAL           = "MEDICAL",            "Wolbi Medical Services"
        VIRTUAL_SOLUTIONS = "VIRTUAL_SOLUTIONS",  "Wolbi Virtual Solutions"
        FOUNDATION        = "FOUNDATION",          "Wolbi Foundation"

    name             = models.CharField(max_length=200)
    slug             = models.SlugField(unique=True)
    business_unit    = models.CharField(max_length=20, choices=BusinessUnit.choices)
    short_description = models.CharField(max_length=300)
    description      = models.TextField()
    icon             = models.CharField(max_length=100, blank=True)
    service_image    = models.ImageField(upload_to="services/", blank=True, null=True)
    featured         = models.BooleanField(default=False)
    created_at       = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["business_unit", "name"]

    def __str__(self):
        return f"{self.name} ({self.get_business_unit_display()})"
