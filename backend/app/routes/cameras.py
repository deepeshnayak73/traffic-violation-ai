from datetime import datetime

from bson import ObjectId
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from app import mongo
from app.middleware import require_jwt, require_officer, require_admin

cameras_bp = Blueprint("cameras", __name__)


def _serialize_camera(doc):
    if not doc:
        return None
    return {
        "id": str(doc["_id"]),
        "name": doc.get("name"),
        "location": doc.get("location"),
        "source": doc.get("source", "0"),
        "status": doc.get("status", "idle"),
        "created_at": doc.get("created_at").isoformat() if doc.get("created_at") else None,
        "updated_at": doc.get("updated_at").isoformat() if doc.get("updated_at") else None,
    }


@cameras_bp.route("/", methods=["GET"])
@jwt_required()
def list_cameras():
    cameras = list(mongo.db.cameras.find().sort("created_at", -1))
    return jsonify({
        "cameras": [_serialize_camera(c) for c in cameras],
        "total": len(cameras),
    }), 200


@cameras_bp.route("/", methods=["POST"])
@require_jwt
@require_admin
def create_camera():
    data = request.get_json() or {}
    name = data.get("name")
    location = data.get("location")
    source = data.get("source", "0")

    if not name:
        return jsonify({"error": "Camera name is required"}), 400

    now = datetime.utcnow()
    doc = {
        "name": name,
        "location": location,
        "source": str(source),
        "status": "idle",
        "created_at": now,
        "updated_at": now,
    }
    result = mongo.db.cameras.insert_one(doc)
    doc["_id"] = result.inserted_id

    return jsonify({"camera": _serialize_camera(doc)}), 201


@cameras_bp.route("/<id>", methods=["PUT"])
@require_jwt
@require_officer
def update_camera(id):
    try:
        camera_id = ObjectId(id)
    except Exception:
        return jsonify({"error": "Invalid camera id"}), 400

    camera = mongo.db.cameras.find_one({"_id": camera_id})
    if not camera:
        return jsonify({"error": "Camera not found"}), 404

    data = request.get_json() or {}
    updates = {}

    if "name" in data:
        updates["name"] = data["name"]
    if "location" in data:
        updates["location"] = data["location"]
    if "source" in data:
        updates["source"] = str(data["source"])

    if not updates:
        return jsonify({"error": "No fields to update"}), 400

    updates["updated_at"] = datetime.utcnow()
    mongo.db.cameras.update_one({"_id": camera_id}, {"$set": updates})

    updated = mongo.db.cameras.find_one({"_id": camera_id})
    return jsonify({"camera": _serialize_camera(updated)}), 200


@cameras_bp.route("/<id>", methods=["DELETE"])
@require_jwt
@require_admin
def delete_camera(id):
    try:
        camera_id = ObjectId(id)
    except Exception:
        return jsonify({"error": "Invalid camera id"}), 400

    result = mongo.db.cameras.delete_one({"_id": camera_id})
    if result.deleted_count == 0:
        return jsonify({"error": "Camera not found"}), 404

    return jsonify({"message": "Camera deleted"}), 200


@cameras_bp.route("/<id>/start", methods=["POST"])
@require_jwt
@require_officer
def start_camera(id):
    try:
        camera_id = ObjectId(id)
    except Exception:
        return jsonify({"error": "Invalid camera id"}), 400

    camera = mongo.db.cameras.find_one({"_id": camera_id})
    if not camera:
        return jsonify({"error": "Camera not found"}), 404

    if camera.get("status") == "running":
        return jsonify({"error": "Camera is already running"}), 400

    now = datetime.utcnow()
    mongo.db.cameras.update_one(
        {"_id": camera_id},
        {"$set": {"status": "running", "updated_at": now, "started_at": now}},
    )

    updated = mongo.db.cameras.find_one({"_id": camera_id})
    return jsonify({
        "message": "Camera started",
        "camera": _serialize_camera(updated),
    }), 200


@cameras_bp.route("/<id>/stop", methods=["POST"])
@require_jwt
@require_officer
def stop_camera(id):
    try:
        camera_id = ObjectId(id)
    except Exception:
        return jsonify({"error": "Invalid camera id"}), 400

    camera = mongo.db.cameras.find_one({"_id": camera_id})
    if not camera:
        return jsonify({"error": "Camera not found"}), 404

    if camera.get("status") != "running":
        return jsonify({"error": "Camera is not running"}), 400

    now = datetime.utcnow()
    mongo.db.cameras.update_one(
        {"_id": camera_id},
        {"$set": {"status": "stopped", "updated_at": now, "stopped_at": now}},
    )

    updated = mongo.db.cameras.find_one({"_id": camera_id})
    return jsonify({
        "message": "Camera stopped",
        "camera": _serialize_camera(updated),
    }), 200
