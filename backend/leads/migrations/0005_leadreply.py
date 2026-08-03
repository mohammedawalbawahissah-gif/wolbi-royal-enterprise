from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("leads", "0004_lead_ai_triage_fields"),
    ]

    operations = [
        migrations.CreateModel(
            name="LeadReply",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("message", models.TextField()),
                ("email_sent", models.BooleanField(default=False)),
                ("sent_at", models.DateTimeField(auto_now_add=True)),
                ("lead", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="replies", to="leads.lead")),
                ("staff", models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="lead_replies", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "ordering": ["sent_at"],
            },
        ),
    ]
