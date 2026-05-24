import os

from flask import Blueprint, jsonify, request, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import mongo
from bson import ObjectId
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

violations_bp = Blueprint("violations", __name__)

@violations_bp.route("/", methods=["GET"])
@jwt_required()
def get_violations():
    page = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 10))
    violation_type = request.args.get("type")
    status = request.args.get("status")
    from_date = request.args.get("from")
    to_date = request.args.get("to")

    query = {}
    if violation_type:
        query["violation_type"] = violation_type
    if status:
        query["status"] = status
    if from_date or to_date:
        date_filter = {}
        if from_date:
            date_filter["$gte"] = datetime.fromisoformat(from_date)
        if to_date:
            end = datetime.fromisoformat(to_date).replace(
                hour=23, minute=59, second=59, microsecond=999999
            )
            date_filter["$lte"] = end
        query["detected_at"] = date_filter

    skip = (page - 1) * limit
    violations = list(mongo.db.violations.find(query).skip(skip).limit(limit))

    for v in violations:
        v["_id"] = str(v["_id"])

    total = mongo.db.violations.count_documents(query)

    return jsonify({
        "violations": violations,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }), 200


@violations_bp.route("/<id>", methods=["GET"])
@jwt_required()
def get_violation(id):
    violation = mongo.db.violations.find_one({"_id": ObjectId(id)})
    if not violation:
        return jsonify({"error": "Violation not found"}), 404
    violation["_id"] = str(violation["_id"])
    return jsonify(violation), 200


@violations_bp.route("/<id>/frame", methods=["GET"])
@jwt_required()
def get_violation_frame(id):
    violation = mongo.db.violations.find_one({"_id": ObjectId(id)})
    if not violation:
        return jsonify({"error": "Violation not found"}), 404

    frame_path = violation.get("frame_path")
    if not frame_path:
        return jsonify({"error": "No frame snapshot for this violation"}), 404

    base_dir = os.getenv("FRAME_STORAGE_PATH", "../data/frames")
    if not os.path.isabs(base_dir):
        base_dir = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "..", base_dir)
        )

    full_path = frame_path if os.path.isabs(frame_path) else os.path.join(base_dir, frame_path)

    if not os.path.isfile(full_path):
        return jsonify({"error": "Frame file not found"}), 404

    return send_file(full_path, mimetype="image/jpeg")


@violations_bp.route("/<id>/status", methods=["PATCH"])
@jwt_required()
def update_status(id):
    data = request.get_json()
    new_status = data.get("status")

    if new_status not in ["pending", "reviewed", "challan_issued"]:
        return jsonify({"error": "Invalid status"}), 400

    mongo.db.violations.update_one(
        {"_id": ObjectId(id)},
        {"$set": {
            "status": new_status,
            "reviewed_by": get_jwt_identity(),
            "updated_at": datetime.utcnow()
        }}
    )
    return jsonify({"message": "Status updated"}), 200


@violations_bp.route("/summary", methods=["GET"])
@jwt_required()
def summary():
    total = mongo.db.violations.count_documents({})
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_count = mongo.db.violations.count_documents({"detected_at": {"$gte": today}})
    pending = mongo.db.violations.count_documents({"status": "pending"})

    return jsonify({
        "total_violations": total,
        "today_violations": today_count,
        "pending_review": pending
    }), 200