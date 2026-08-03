from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="ConsultationSession",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=200)),
                ("email", models.EmailField(max_length=254)),
                ("phone", models.CharField(blank=True, max_length=30)),
                ("division", models.CharField(choices=[("MEDICAL", "Wolbi Medical Services"), ("VIRTUAL", "Wolbi Virtual Solutions")], max_length=10)),
                ("mode", models.CharField(choices=[("INSTANT", "Instant"), ("SCHEDULED", "Scheduled")], max_length=10)),
                ("reason", models.TextField(help_text="What the visitor needs help with")),
                ("status", models.CharField(choices=[("REQUESTED", "Requested"), ("CLAIMED", "Claimed"), ("COMPLETED", "Completed"), ("CANCELLED", "Cancelled")], default="REQUESTED", max_length=10)),
                ("scheduled_time", models.DateTimeField(blank=True, null=True)),
                ("room_name", models.CharField(blank=True, max_length=200)),
                ("room_url", models.URLField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("assigned_staff", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="teleconsultations", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
    ]
