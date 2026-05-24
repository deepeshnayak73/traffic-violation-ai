from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import mongo
from bson import ObjectId
from datetime import datetime

violations_bp = Blueprint("violations", __name__)

@violations_bp.route("/", methods=["GET"])
@jwt_required()
def get_violations():
    page = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 10))
    violation_type = request.args.get("type")
    status = request.args.get("status")

    query = {}
    if violation_type:
        query["violation_type"] = violation_type
    if status:
        query["status"] = status

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