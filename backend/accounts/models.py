from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN      = "ADMIN",      "Admin"
        MEDICAL    = "MEDICAL",    "Medical Services"
        TECH       = "TECH",       "Tech Specialist"
        VA         = "VA",         "Virtual Assistant"
        CLIENT     = "CLIENT",     "Client"
        FOUNDATION = "FOUNDATION", "Foundation"

    class Specialty(models.TextChoices):
        # Tech specialties
        FULL_STACK        = "FULL_STACK",        "Full Stack Software Engineering"
        MOBILE_DEV        = "MOBILE_DEV",        "Mobile App Development"
        CYBER_SECURITY     = "CYBER_SECURITY",    "Cyber Security"
        DATA_ANALYSIS      = "DATA_ANALYSIS",     "Data Analysis"
        MACHINE_LEARNING   = "MACHINE_LEARNING",  "Machine Learning"
        RESEARCH           = "RESEARCH",          "Research Work"
        CREATIVE_AI        = "CREATIVE_AI",       "Creative Tech (AI)"
        VIRTUAL_ASSISTANCE = "VIRTUAL_ASSISTANCE","Virtual Assistance"
        CONTENT_CREATION   = "CONTENT_CREATION",  "Content Creation"
        # Medical specialties
        LAB_DIAGNOSTICS    = "LAB_DIAGNOSTICS",   "Laboratory Diagnostics"
        USG_SCANNING       = "USG_SCANNING",      "USG / Ultrasound Scanning"
        DNA_TESTING        = "DNA_TESTING",       "DNA Testing"
        HEALTH_ADVISORY    = "HEALTH_ADVISORY",   "Health Advisory & Consulting"
        TELEHEALTH         = "TELEHEALTH",        "Telehealth Support"
        # Foundation specialties
        PROGRAMS_HEALTH    = "PROGRAMS_HEALTH",   "Health Programs"
        PROGRAMS_EDUCATION = "PROGRAMS_EDUCATION","Education Programs"
        PROGRAMS_YOUTH     = "PROGRAMS_YOUTH",    "Youth Empowerment Programs"
        VOLUNTEER_COORD    = "VOLUNTEER_COORD",   "Volunteer Coordination"
        # Virtual Assistant specialties
        EXEC_ASSISTANCE    = "EXEC_ASSISTANCE",   "Executive Assistance"
        BUSINESS_OPS       = "BUSINESS_OPS",      "Business Operations"
        CRM_MANAGEMENT     = "CRM_MANAGEMENT",    "CRM Management"

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.CLIENT
    )

    specialty = models.CharField(
        max_length=30,
        choices=Specialty.choices,
        blank=True,
        null=True,
        help_text="Professional specialty — relevant for TECH, MEDICAL, FOUNDATION, and VA roles."
    )

    phone = models.CharField(max_length=20, blank=True, null=True)

    profile_image = models.ImageField(
        upload_to="profiles/",
        blank=True,
        null=True
    )

    job_title = models.CharField(
        max_length=100,
        blank=True
    )

    bio = models.TextField(
        blank=True
    )

    def __str__(self):
        return f"{self.username} ({self.role})"
