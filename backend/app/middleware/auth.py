from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from app import mongo
from bson import ObjectId

def require_role(*roles):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            user = mongo.db.users.find_one({"_id": ObjectId(user_id)})
            
            if not user:
                return jsonify({"error": "User not found"}), 404
            
            if user["role"] not in roles:
                return jsonify({"error": "Access denied"}), 403
            
            return fn(*args, **kwargs)
        return wrapper
    return decorator