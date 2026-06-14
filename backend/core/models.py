from django.db import models


class SiteConfiguration(models.Model):
    company_name = models.CharField(max_length=200)

    hero_title = models.CharField(max_length=300)
    hero_subtitle = models.TextField()

    about_text = models.TextField()

    contact_email = models.EmailField()
    contact_phone = models.CharField(max_length=30)

    address = models.TextField(blank=True)

    linkedin_url = models.URLField(blank=True)
    facebook_url = models.URLField(blank=True)
    x_url = models.URLField(blank=True)
    instagram_url = models.URLField(blank=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Site Configuration"
        verbose_name_plural = "Site Configuration"

    def __str__(self):
        return self.company_name