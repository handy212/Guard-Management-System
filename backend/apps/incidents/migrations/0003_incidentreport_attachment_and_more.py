from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("incidents", "0002_clientcomplaint_supervisorinspection"),
    ]

    operations = [
        migrations.AddField(
            model_name="incidentreport",
            name="attachment",
            field=models.FileField(blank=True, null=True, upload_to="incident_attachments/"),
        ),
        migrations.AddField(
            model_name="supervisorinspection",
            name="attachment",
            field=models.FileField(blank=True, null=True, upload_to="inspection_attachments/"),
        ),
    ]
