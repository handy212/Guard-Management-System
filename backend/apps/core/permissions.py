from rest_framework.permissions import BasePermission, SAFE_METHODS


class HasRolePermission(BasePermission):
    required_permission = ""
    read_permission = ""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True

        required_permission = self.read_permission if request.method in SAFE_METHODS and self.read_permission else self.required_permission
        if not required_permission:
            return True
        role = getattr(request.user, "role", None)
        if not role:
            return False
        return role.permissions.filter(code=required_permission).exists()


class InternalOnlyPermission(BasePermission):
    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        return not getattr(user, "client_id", None)


def permission_class(required_permission: str, read_permission: str = ""):
    class ModulePermission(HasRolePermission):
        pass

    ModulePermission.required_permission = required_permission
    ModulePermission.read_permission = read_permission
    return ModulePermission
