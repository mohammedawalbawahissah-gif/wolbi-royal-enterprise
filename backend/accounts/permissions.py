from rest_framework.permissions import BasePermission


class RolePermission(BasePermission):
    allowed_roles = []

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role in self.allowed_roles
        )


class IsAdmin(RolePermission):
    allowed_roles = ["ADMIN"]


class IsMedicalStaff(RolePermission):
    allowed_roles = ["MEDICAL"]


class IsVA(RolePermission):
    allowed_roles = ["VA"]


class IsFoundation(RolePermission):
    allowed_roles = ["FOUNDATION"]


class IsClient(RolePermission):
    allowed_roles = ["CLIENT"]


class IsAdminOrMedical(RolePermission):
    allowed_roles = ["ADMIN", "MEDICAL"]


class IsStaff(RolePermission):
    """All internal staff roles — can create/edit content."""
    allowed_roles = ["ADMIN", "MEDICAL", "VA", "FOUNDATION"]


class IsAdminOrStaff(RolePermission):
    """Admin or any staff member."""
    allowed_roles = ["ADMIN", "MEDICAL", "VA", "FOUNDATION"]
