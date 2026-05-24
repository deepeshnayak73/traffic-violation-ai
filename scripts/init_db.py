#!/usr/bin/env python3
"""Initialize MongoDB with indexes, default admin user, and sample data."""

import os
import sys
from datetime import datetime, timedelta

import bcrypt
from dotenv import load_dotenv
from pymongo import MongoClient

# Project root on path
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT)

ENV_PATH = os.path.join(ROOT, "backend", ".env")
load_dotenv(ENV_PATH)

MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    raise ValueError("MONGO_URI is not set. Define it in backend/.env")
ADMIN_EMAIL = os.getenv("INIT_ADMIN_EMAIL", "admin@traffic.ai")
ADMIN_PASSWORD = os.getenv("INIT_ADMIN_PASSWORD", "admin123")
ADMIN_USERNAME = os.getenv("INIT_ADMIN_USERNAME", "admin")


def ensure_indexes(db):
    db.users.create_index("email", unique=True)
    db.users.create_index("username", unique=True)
    db.violations.create_index("detected_at")
    db.violations.create_index("violation_type")
    db.violations.create_index("status")
    db.cameras.create_index("name")
    db.revoked_tokens.create_index("jti", unique=True)
    print("Indexes created.")


def seed_admin(db):
    existing = db.users.find_one({"email": ADMIN_EMAIL})
    if existing:
        print(f"Admin user already exists: {ADMIN_EMAIL}")
        return existing

    password_hash = bcrypt.hashpw(ADMIN_PASSWORD.encode("utf-8"), bcrypt.gensalt())
    now = datetime.utcnow()
    doc = {
        "username": ADMIN_USERNAME,
        "email": ADMIN_EMAIL,
        "password_hash": password_hash,
        "role": "admin",
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }
    db.users.insert_one(doc)
    print(f"Admin user created: {ADMIN_EMAIL} / {ADMIN_PASSWORD}")
    return doc


def seed_sample_violations(db):
    if db.violations.count_documents({}) > 0:
        print("Violations collection already has data — skipping sample violations.")
        return

    now = datetime.utcnow()
    samples = [
        {
            "violation_type": "no_helmet",
            "status": "pending",
            "location": "Main Road Junction",
            "confidence": 0.89,
            "fine": 1000,
            "severity": "HIGH",
            "description": "Rider without helmet on motorcycle",
            "frame_path": "sample_no_helmet.jpg",
            "detected_at": now - timedelta(hours=2),
            "updated_at": now,
        },
        {
            "violation_type": "no_seatbelt",
            "status": "reviewed",
            "location": "Highway Exit 4",
            "confidence": 0.82,
            "fine": 500,
            "severity": "MEDIUM",
            "description": "Driver without seatbelt",
            "frame_path": "sample_no_seatbelt.jpg",
            "detected_at": now - timedelta(days=1),
            "reviewed_by": "system",
            "updated_at": now,
        },
        {
            "violation_type": "no_helmet",
            "status": "challan_issued",
            "location": "City Center",
            "confidence": 0.91,
            "fine": 1000,
            "severity": "HIGH",
            "description": "Helmet violation detected",
            "frame_path": "sample_no_helmet_2.jpg",
            "detected_at": now - timedelta(days=3),
            "reviewed_by": "system",
            "updated_at": now,
        },
    ]
    db.violations.insert_many(samples)
    print(f"Inserted {len(samples)} sample violations.")


def seed_sample_cameras(db):
    if db.cameras.count_documents({}) > 0:
        print("Cameras collection already has data — skipping sample cameras.")
        return

    now = datetime.utcnow()
    cameras = [
        {
            "name": "Gate 1 Cam",
            "location": "Main Road Junction",
            "source": "0",
            "status": "idle",
            "created_at": now,
            "updated_at": now,
        },
        {
            "name": "Highway Cam",
            "location": "Highway Exit 4",
            "source": "1",
            "status": "idle",
            "created_at": now,
            "updated_at": now,
        },
    ]
    db.cameras.insert_many(cameras)
    print(f"Inserted {len(cameras)} sample cameras.")


def ensure_frame_storage():
    frames_dir = os.path.join(ROOT, "data", "frames")
    os.makedirs(frames_dir, exist_ok=True)

    # Minimal placeholder JPEG headers for sample violations
    placeholder = (
        b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00"
        b"\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c"
        b"\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c"
        b"\x1c $.\x27 ,#\x1c\x1c(7),01444\x1f\x27=9=82<.342\xff\xc0\x00\x0b\x08"
        b"\x00\x01\x00\x01\x01\x01\x11\x00\xff\xc4\x00\x14\x00\x01\x00\x00\x00"
        b"\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x08\xff\xc4\x00\x14\x10"
        b"\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\xff\xda"
        b"\x00\x08\x01\x01\x00\x00?\x00\xaa\xff\xd9"
    )
    for name in ["sample_no_helmet.jpg", "sample_no_seatbelt.jpg", "sample_no_helmet_2.jpg"]:
        path = os.path.join(frames_dir, name)
        if not os.path.exists(path):
            with open(path, "wb") as f:
                f.write(placeholder)

    print(f"Frame storage ready: {frames_dir}")


def get_database(client):
    db_name = MONGO_URI.rsplit("/", 1)[-1].split("?")[0]
    if db_name:
        return client[db_name]
    return client.get_database()


def main():
    print(f"Connecting to {MONGO_URI} ...")
    client = MongoClient(MONGO_URI)
    db = get_database(client)

    ensure_frame_storage()
    ensure_indexes(db)
    seed_admin(db)
    seed_sample_violations(db)
    seed_sample_cameras(db)

    print("Database initialization complete.")


if __name__ == "__main__":
    main()
