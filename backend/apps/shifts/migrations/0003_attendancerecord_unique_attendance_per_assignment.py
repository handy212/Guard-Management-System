from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("shifts", "0002_guardassignment_deployment_confirmed_at_and_more"),
    ]

    operations = [
        migrations.AddConstraint(
            model_name="attendancerecord",
            constraint=models.UniqueConstraint(fields=("assignment",), name="unique_attendance_per_assignment"),
        ),
    ]
