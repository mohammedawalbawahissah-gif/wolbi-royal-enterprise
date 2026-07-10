from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("projects", "0004_alter_project_id"),
    ]

    operations = [
        migrations.AddField(
            model_name="project",
            name="ai_case_study_draft",
            field=models.TextField(blank=True),
        ),
    ]
