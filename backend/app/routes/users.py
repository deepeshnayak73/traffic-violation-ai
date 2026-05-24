from datetime import datetime

import bcrypt
from bson import ObjectId
from flask import Blueprint, jsonify, request

from app import mongo
from app.middleware import require_admin, require_jwt
from app.models.user import ROLES, User

users_bp = Blueprint("users", __name__)


def _serialize_user(doc):
    return {
        "id": str(doc["_id"]),
        "username": doc.get("username"),
        "email": doc.get("email"),
        "role": doc.get("role"),
        "is_active": doc.get("is_active", True),
        "created_at": doc.get("created_at").isoformat() if doc.get("created_at") else None,
        "updated_at": doc.get("updated_at").isoformat() if doc.get("updated_at") else None,
    }


@users_bp.route("/", methods=["GET"])
@require_jwt
@require_admin
def list_users():
    users = list(mongo.db.users.find().sort("created_at", -1))
    return jsonify({
        "users": [_serialize_user(u) for u in users],
        "total": len(users),
    }), 200


@users_bp.route("/", methods=["POST"])
@require_jwt
@require_admin
def create_user():
    data = request.get_json() or {}
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")
    role = data.get("role", "viewer")

    if not username or not email or not password:
        return jsonify({"error": "Username, email, and password are required"}), 400

    if role not in ROLES:
        return jsonify({"error": f"Invalid role. Must be one of: {sorted(ROLES)}"}), 400

    if mongo.db.users.find_one({"email": email}):
        return jsonify({"error": "Email already registered"}), 409

    if mongo.db.users.find_one({"username": username}):
        return jsonify({"error": "Username already taken"}), 409

    now = datetime.utcnow()
    doc = {
        "username": username,
        "email": email,
        "password_hash": bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()),
        "role": role,
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }
    result = mongo.db.users.insert_one(doc)
    doc["_id"] = result.inserted_id

    return jsonify({"user": _serialize_user(doc)}), 201


@users_bp.route("/<id>", methods=["PUT"])
@require_jwt
@require_admin
def update_user(id):
    try:
        user_id = ObjectId(id)
    except Exception:
        return jsonify({"error": "Invalid user id"}), 400

    user = mongo.db.users.find_one({"_id": user_id})
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json() or {}
    updates = {}

    if "username" in data:
        existing = mongo.db.users.find_one({
            "username": data["username"],
            "_id": {"$ne": user_id},
        })
        if existing:
            return jsonify({"error": "Username already taken"}), 409
        updates["username"] = data["username"]

    if "email" in data:
        existing = mongo.db.users.find_one({
            "email": data["email"],
            "_id": {"$ne": user_id},
        })
        if existing:
            return jsonify({"error": "Email already registered"}), 409
        updates["email"] = data["email"]

    if "role" in data:
        if data["role"] not in ROLES:
            return jsonify({"error": f"Invalid role. Must be one of: {sorted(ROLES)}"}), 400
        updates["role"] = data["role"]

    if "password" in data and data["password"]:
        updates["password_hash"] = User.hash_password(data["password"])

    if "is_active" in data:
        updates["is_active"] = bool(data["is_active"])

    if not updates:
        return jsonify({"error": "No fields to update"}), 400

    updates["updated_at"] = datetime.utcnow()
    mongo.db.users.update_one({"_id": user_id}, {"$set": updates})

    updated = mongo.db.users.find_one({"_id": user_id})
    return jsonify({"user": _serialize_user(updated)}), 200


@users_bp.route("/<id>/deactivate", methods=["PATCH"])
@require_jwt
@require_admin
def deactivate_user(id):
    try:
        user_id = ObjectId(id)
    except Exception:
        return jsonify({"error": "Invalid user id"}), 400

    user = mongo.db.users.find_one({"_id": user_id})
    if not user:
        return jsonify({"error": "User not found"}), 404

    mongo.db.users.update_one(
        {"_id": user_id},
        {"$set": {"is_active": False, "updated_at": datetime.utcnow()}},
    )

    updated = mongo.db.users.find_one({"_id": user_id})
    return jsonify({
        "message": "User deactivated",
        "user": _serialize_user(updated),
    }), 200
