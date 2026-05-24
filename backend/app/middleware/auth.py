from functools import wraps

from bson import ObjectId
from flask import g, jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from flask_jwt_extended.exceptions import NoAuthorizationError, JWTDecodeError

from app import mongo


def require_jwt(fn):
    """Validate JWT and attach the current user to flask.g."""

    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request()
        except NoAuthorizationError:
            return jsonify({"error": "Authorization token missing"}), 401
        except JWTDecodeError:
            return jsonify({"error": "Invalid authorization token"}), 401

        user_id = get_jwt_identity()
        user = mongo.db.users.find_one({"_id": ObjectId(user_id)})

        if not user:
            return jsonify({"error": "User not found"}), 404

        if not user.get("is_active", True):
            return jsonify({"error": "Account is disabled"}), 403

        g.current_user = user
        return fn(*args, **kwargs)

    return wrapper
