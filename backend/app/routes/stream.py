from flask import Blueprint, Response
import cv2
import sys
import os

# Correct ai folder path
sys.path.insert(0, r'D:\traffic-violation-ai\ai')

from detector import ViolationDetector
from violation_rules import ViolationRules

stream_bp = Blueprint('stream', __name__)
detector = ViolationDetector()
rules = ViolationRules()

def generate_frames():
    cap = cv2.VideoCapture(0)
    while True:
        ret, frame = cap.read()
        if not ret:
            break

        detections = detector.detect_frame(frame)
        violations = detector.check_violations(detections)
        formatted = [rules.format_violation(v) for v in violations]
        annotated = detector.annotate_frame(frame, detections, violations)

        _, buffer = cv2.imencode('.jpg', annotated)
        frame_bytes = buffer.tobytes()

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

@stream_bp.route('/stream')
def video_stream():
    return Response(generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')