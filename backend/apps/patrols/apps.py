from django.apps import AppConfig


class PatrolsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.patrols"

    def ready(self):
        from . import signals  # noqa: F401
