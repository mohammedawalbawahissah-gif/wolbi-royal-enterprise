from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0005_user_specialty_alter_user_role"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="is_available_for_calls",
            field=models.BooleanField(
                default=False,
                help_text="Staff toggle — when on, this user can be matched to instant teleconsultation requests.",
            ),
        ),
    ]
