from datetime import datetime, timedelta

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from app import mongo

analytics_bp = Blueprint("analytics", __name__)


@analytics_bp.route("/summary", methods=["GET"])
@jwt_required()
def analytics_summary():
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

    total = mongo.db.violations.count_documents({})
    today_count = mongo.db.violations.count_documents({"detected_at": {"$gte": today}})
    pending = mongo.db.violations.count_documents({"status": "pending"})
    reviewed = mongo.db.violations.count_documents({"status": "reviewed"})
    challan_issued = mongo.db.violations.count_documents({"status": "challan_issued"})

    return jsonify({
        "total_violations": total,
        "today_violations": today_count,
        "pending_review": pending,
        "reviewed": reviewed,
        "challan_issued": challan_issued,
    }), 200


@analytics_bp.route("/by-type", methods=["GET"])
@jwt_required()
def analytics_by_type():
    pipeline = [
        {"$group": {"_id": "$violation_type", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    results = list(mongo.db.violations.aggregate(pipeline))

    return jsonify({
        "by_type": [
            {"violation_type": r["_id"] or "unknown", "count": r["count"]}
            for r in results
        ]
    }), 200


@analytics_bp.route("/by-location", methods=["GET"])
@jwt_required()
def analytics_by_location():
    pipeline = [
        {
            "$group": {
                "_id": {"$ifNull": ["$location", "Unknown"]},
                "count": {"$sum": 1},
            }
        },
        {"$sort": {"count": -1}},
    ]
    results = list(mongo.db.violations.aggregate(pipeline))

    return jsonify({
        "by_location": [
            {"location": r["_id"], "count": r["count"]}
            for r in results
        ]
    }), 200


@analytics_bp.route("/trend", methods=["GET"])
@jwt_required()
def analytics_trend():
    days = int(request.args.get("days", 7))
    days = max(1, min(days, 90))

    start_date = datetime.utcnow().replace(
        hour=0, minute=0, second=0, microsecond=0
    ) - timedelta(days=days - 1)

    pipeline = [
        {"$match": {"detected_at": {"$gte": start_date}}},
        {
            "$group": {
                "_id": {
                    "$dateToString": {"format": "%Y-%m-%d", "date": "$detected_at"}
                },
                "count": {"$sum": 1},
            }
        },
        {"$sort": {"_id": 1}},
    ]
    results = list(mongo.db.violations.aggregate(pipeline))

    return jsonify({
        "days": days,
        "trend": [{"date": r["_id"], "count": r["count"]} for r in results],
    }), 200
