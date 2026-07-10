# Generated for AI lead-triage feature

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("leads", "0003_alter_lead_options_lead_notes_lead_organization_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="lead",
            name="ai_summary",
            field=models.TextField(blank=True, help_text="AI-generated one-line triage summary"),
        ),
        migrations.AddField(
            model_name="lead",
            name="ai_priority",
            field=models.CharField(
                blank=True,
                choices=[("LOW", "Low"), ("MEDIUM", "Medium"), ("HIGH", "High")],
                max_length=10,
            ),
        ),
        migrations.AddField(
            model_name="lead",
            name="ai_suggested_type",
            field=models.CharField(
                blank=True,
                choices=[
                    ("GENERAL", "General Inquiry"),
                    ("TECHNOLOGY", "Wolbi Technologies"),
                    ("MEDICAL", "Wolbi Medical Services"),
                    ("VIRTUAL", "Wolbi Virtual Solutions"),
                    ("FOUNDATION", "Wolbi Foundation"),
                    ("AGRICULTURE", "FarmaSyst / Agriculture"),
                    ("PARTNERSHIP", "Partnership"),
                    ("DEMO", "Product Demo Request"),
                ],
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="lead",
            name="ai_possible_duplicate",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="lead",
            name="ai_processed_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
