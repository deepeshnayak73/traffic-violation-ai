from functools import wraps

from flask import g, jsonify

from app.models.user import ADMIN, OFFICER, VIEWER, ROLES


def require_role(*roles):
    """Restrict access to users with one of the given roles."""

    allowed = frozenset(roles)
    unknown = allowed - ROLES
    if unknown:
        raise ValueError(f"Unknown roles: {', '.join(sorted(unknown))}")

    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            user = getattr(g, "current_user", None)
            if not user:
                return jsonify({"error": "Authentication required"}), 401

            if user.get("role") not in allowed:
                return jsonify({
                    "error": "Access denied",
                    "required_roles": sorted(allowed),
                }), 403

            return fn(*args, **kwargs)

        return wrapper

    return decorator


def require_admin(fn):
    return require_role(ADMIN)(fn)


def require_officer(fn):
    return require_role(ADMIN, OFFICER)(fn)


def require_viewer(fn):
    return require_role(ADMIN, OFFICER, VIEWER)(fn)
