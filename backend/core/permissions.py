from rest_framework import permissions
from django.contrib.auth import get_user_model

User = get_user_model()


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Allow safe methods for any authenticated user, but require admin for write operations.
    Uses Django's is_staff flag; you can extend to Role-based checks later.
    """

    def has_permission(self, request, view):
        # If not authenticated, deny
        if not request.user or not request.user.is_authenticated:
            return False

        # Allow read-only methods
        if request.method in permissions.SAFE_METHODS:
            return True

        # For write methods, require staff
        return request.user.is_staff


class RoleBasedPermission(permissions.BasePermission):
    """
    Permission that allows:
      - Safe methods for any authenticated user.
      - Unsafe methods only for users that have at least one of the required roles
        (case-insensitive match against User.roles.name), or for superusers.
    Views may declare either:
      - `action_roles` : dict mapping action name -> list of allowed role names
      - `required_roles`: list of allowed role names for all unsafe actions
    Fallback: if neither attribute is present, require is_staff.
    """

    def _user_has_role(self, user, role_name: str) -> bool:
        # defensive: handle missing roles relation
        if not user or not hasattr(user, "roles"):
            return False
        try:
            return user.roles.filter(name__iexact=str(role_name)).exists()
        except Exception:
            # In case roles is not a queryset/relationship on the user
            return False

    def _check_roles_list(self, user, roles_list) -> bool:
        if not roles_list:
            return False
        # normalize and check any match
        for r in roles_list:
            if self._user_has_role(user, r):
                return True
        return False

    def has_permission(self, request, view) -> bool:
        user = getattr(request, "user", None)
        if not user or not getattr(user, "is_authenticated", False):
            return False

        # allow safe (read-only) methods for authenticated users
        if request.method in permissions.SAFE_METHODS:
            return True

        # superuser bypass
        if getattr(user, "is_superuser", False):
            return True

        # determine role list to use
        roles_list = None
        action = getattr(view, "action", None)

        if hasattr(view, "action_roles") and isinstance(getattr(view, "action_roles"), dict) and action in view.action_roles:
            roles_list = view.action_roles.get(action)
        elif hasattr(view, "required_roles"):
            roles_list = getattr(view, "required_roles")

        # If no explicit role requirements provided, fall back to staff requirement
        if not roles_list:
            return user.is_staff

        # Finally check membership
        return self._check_roles_list(user, roles_list)

    def has_object_permission(self, request, view, obj) -> bool:
        # Mirror has_permission behaviour for object-level checks
        user = getattr(request, "user", None)
        if not user or not getattr(user, "is_authenticated", False):
            return False

        if request.method in permissions.SAFE_METHODS:
            return True

        if getattr(user, "is_superuser", False):
            return True

        roles_list = None
        action = getattr(view, "action", None)

        if hasattr(view, "action_roles") and isinstance(getattr(view, "action_roles"), dict) and action in view.action_roles:
            roles_list = view.action_roles.get(action)
        elif hasattr(view, "required_roles"):
            roles_list = getattr(view, "required_roles")

        if not roles_list:
            return user.is_staff

        return self._check_roles_list(user, roles_list)
