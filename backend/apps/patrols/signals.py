from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver

from .live_monitoring import publish_live_monitoring_update, update_guard_live_state
from .models import PatrolRecord


@receiver(post_save, sender=PatrolRecord)
def sync_guard_live_state(sender, instance, created, **kwargs):
    if not created:
        return
    update_guard_live_state(instance)
    record_id = instance.pk
    transaction.on_commit(lambda: publish_live_monitoring_update(record_id))
