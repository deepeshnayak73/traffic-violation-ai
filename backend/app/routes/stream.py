from datetime import datetime, timedelta
from flask import Blueprint, Response
import cv2
import sys
import os
from app import mongo

AI_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "ai"))
sys.path.insert(0, AI_DIR)

from detector import ViolationDetector
from violation_rules import ViolationRules

stream_bp = Blueprint("stream", __name__)
detector = ViolationDetector()
rules = ViolationRules()

STREAM_LOCATION = os.getenv("STREAM_LOCATION", "Live Camera")
SAVE_COOLDOWN = timedelta(seconds=int(os.getenv("VIOLATION_SAVE_COOLDOWN", "5")))
MOBILE_CAM_URL = os.getenv("MOBILE_CAM_URL", "http://192.168.29.78:8080/video")
_last_saved = {}


def save_violation(violation):
    violation_type = violation.get("type")
    if not violation_type:
        return

    now = datetime.utcnow()
    last = _last_saved.get(violation_type)
    if last and now - last < SAVE_COOLDOWN:
        return

    mongo.db.violations.insert_one({
        "violation_type": violation_type,
        "confidence_score": violation.get("confidence"),
        "location": STREAM_LOCATION,
        "detected_at": now.isoformat() + "Z",
        "status": "pending",
        "created_at": now.isoformat() + "Z",
    })
    _last_saved[violation_type] = now


def generate_frames():
    # Pehle mobile camera try karo, fail hone par laptop webcam use karo
    cap = cv2.VideoCapture(MOBILE_CAM_URL)
    if not cap.isOpened():
        print("Mobile camera not available, using laptop webcam...")
        cap = cv2.VideoCapture(0)

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        detections = detector.detect_frame(frame)
        violations = detector.check_violations(detections)
        formatted = [rules.format_violation(v) for v in violations]

        for violation in formatted:
            save_violation(violation)

        annotated = detector.annotate_frame(frame, detections, violations)

        _, buffer = cv2.imencode('.jpg', annotated)
        frame_bytes = buffer.tobytes()

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')


@stream_bp.route('/stream')
def video_stream():
    return Response(generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')