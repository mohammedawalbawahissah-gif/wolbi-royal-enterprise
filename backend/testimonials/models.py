from django.db import models


class Testimonial(models.Model):
    class Division(models.TextChoices):
        TECHNOLOGIES      = "TECHNOLOGIES",      "Wolbi Technologies"
        MEDICAL           = "MEDICAL",            "Wolbi Medical Services"
        VIRTUAL_SOLUTIONS = "VIRTUAL_SOLUTIONS",  "Wolbi Virtual Solutions"
        FOUNDATION        = "FOUNDATION",          "Wolbi Foundation"
        GENERAL           = "GENERAL",             "General"

    author_name    = models.CharField(max_length=200)
    author_title   = models.CharField(max_length=200, blank=True)
    author_company = models.CharField(max_length=200, blank=True)
    author_image   = models.ImageField(upload_to="testimonials/", blank=True, null=True)
    quote          = models.TextField()
    division       = models.CharField(max_length=20, choices=Division.choices, default=Division.GENERAL)
    rating         = models.PositiveSmallIntegerField(default=5)
    featured       = models.BooleanField(default=False)
    is_approved    = models.BooleanField(default=False)
    created_at     = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-featured", "-created_at"]

    def __str__(self):
        return f"{self.author_name} — {self.get_division_display()}"
