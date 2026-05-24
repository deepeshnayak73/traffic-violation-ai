from datetime import datetime

from bson import ObjectId
from flask import Blueprint, jsonify, request
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    get_jwt,
    get_jwt_identity,
    jwt_required,
)
from app import mongo
import bcrypt

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")
    role = data.get("role", "viewer")

    if not username or not email or not password:
        return jsonify({"error": "All fields required"}), 400

    existing = mongo.db.users.find_one({"email": email})
    if existing:
        return jsonify({"error": "User already exists"}), 409

    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())

    mongo.db.users.insert_one({
        "username": username,
        "email": email,
        "password_hash": hashed,
        "role": role,
        "is_active": True
    })

    return jsonify({"message": "User registered successfully"}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    user = mongo.db.users.find_one({"email": email})
    if not user:
        return jsonify({"error": "Invalid credentials"}), 401

    if not bcrypt.checkpw(password.encode("utf-8"), user["password_hash"]):
        return jsonify({"error": "Invalid credentials"}), 401

    if not user.get("is_active", True):
        return jsonify({"error": "Account is deactivated"}), 403

    access_token = create_access_token(identity=str(user["_id"]))
    refresh_token = create_refresh_token(identity=str(user["_id"]))

    return jsonify({
        "access_token": access_token,
        "refresh_token": refresh_token,
        "role": user["role"],
        "username": user["username"]
    }), 200


@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    user_id = get_jwt_identity()
    user = mongo.db.users.find_one({"_id": ObjectId(user_id)})

    if not user:
        return jsonify({"error": "User not found"}), 404

    if not user.get("is_active", True):
        return jsonify({"error": "Account is deactivated"}), 403

    access_token = create_access_token(identity=user_id)
    return jsonify({"access_token": access_token}), 200


@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    claims = get_jwt()
    jti = claims.get("jti")
    exp = claims.get("exp")

    if jti:
        mongo.db.revoked_tokens.update_one(
            {"jti": jti},
            {
                "$set": {
                    "jti": jti,
                    "user_id": get_jwt_identity(),
                    "revoked_at": datetime.utcnow(),
                    "expires_at": datetime.utcfromtimestamp(exp) if exp else None,
                }
            },
            upsert=True,
        )

    return jsonify({"message": "Logged out successfully"}), 200


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user_id = get_jwt_identity()
    from bson import ObjectId
    user = mongo.db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({
        "username": user["username"],
        "email": user["email"],
        "role": user["role"]
    }), 200