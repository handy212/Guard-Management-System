from apps.audits.models import AuditLog


class AuditLogMixin:
    audit_create_action = "create"
    audit_update_action = "update"
    audit_delete_action = "delete"

    def perform_create(self, serializer):
        instance = serializer.save()
        self._write_audit_log(self.audit_create_action, instance)

    def perform_update(self, serializer):
        instance = serializer.save()
        self._write_audit_log(self.audit_update_action, instance)

    def perform_destroy(self, instance):
        self._write_audit_log(self.audit_delete_action, instance)
        instance.delete()

    def audit_action(self, action: str, instance, extra_metadata=None):
        self._write_audit_log(action, instance, extra_metadata=extra_metadata)

    def _write_audit_log(self, action: str, instance, extra_metadata=None):
        request = getattr(self, "request", None)
        actor = request.user if request and request.user.is_authenticated else None
        model = instance.__class__
        metadata = {"path": request.path if request else ""}
        if extra_metadata:
            metadata.update(extra_metadata)
        AuditLog.objects.create(
            actor=actor,
            action=action,
            entity_type=f"{model._meta.app_label}.{model.__name__}",
            entity_id=str(instance.pk),
            summary=f"{action} {model.__name__} {instance.pk}",
            metadata=metadata,
            ip_address=self._get_ip_address(request),
        )

    @staticmethod
    def _get_ip_address(request):
        if not request:
            return None
        forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        return request.META.get("REMOTE_ADDR")
