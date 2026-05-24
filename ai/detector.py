import cv2
import numpy as np
from ultralytics import YOLO
import os

class ViolationDetector:
    def __init__(self, model_path=None):
        # YOLOv8 nano model use karenge — lightweight hai
        if model_path and os.path.exists(model_path):
            self.model = YOLO(model_path)
        else:
            # Pretrained model automatically download hoga
            self.model = YOLO("yolov8n.pt")
        
        self.confidence_threshold = 0.75
        
        # COCO dataset class IDs
        self.PERSON = 0
        self.MOTORCYCLE = 3
        self.CAR = 2
        self.BUS = 5
        self.TRUCK = 7

    def detect_frame(self, frame):
        results = self.model(frame, verbose=False)
        detections = []
        
        for result in results:
            for box in result.boxes:
                class_id = int(box.cls[0])
                confidence = float(box.conf[0])
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                
                detections.append({
                    "class_id": class_id,
                    "class_name": self.model.names[class_id],
                    "confidence": confidence,
                    "bbox": [x1, y1, x2, y2]
                })
        
        return detections

    def check_violations(self, detections):
        violations = []
        persons = [d for d in detections if d["class_id"] == self.PERSON]
        vehicles = [d for d in detections if d["class_id"] in 
                   [self.MOTORCYCLE, self.CAR, self.BUS, self.TRUCK]]
        
        for person in persons:
            for vehicle in vehicles:
                if self._is_overlapping(person["bbox"], vehicle["bbox"]):
                    if vehicle["class_id"] == self.MOTORCYCLE:
                        violations.append({
                            "type": "no_helmet",
                            "confidence": person["confidence"],
                            "bbox": person["bbox"],
                            "message": "Helmet violation detected!"
                        })
                    elif vehicle["class_id"] in [self.CAR, self.BUS, self.TRUCK]:
                        violations.append({
                            "type": "no_seatbelt",
                            "confidence": person["confidence"],
                            "bbox": person["bbox"],
                            "message": "Seatbelt violation detected!"
                        })
        
        return violations

    def _is_overlapping(self, bbox1, bbox2):
        x1 = max(bbox1[0], bbox2[0])
        y1 = max(bbox1[1], bbox2[1])
        x2 = min(bbox1[2], bbox2[2])
        y2 = min(bbox1[3], bbox2[3])
        return x1 < x2 and y1 < y2

    def annotate_frame(self, frame, detections, violations):
        for det in detections:
            x1, y1, x2, y2 = det["bbox"]
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(frame, det["class_name"], (x1, y1-10),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
        
        for v in violations:
            x1, y1, x2, y2 = v["bbox"]
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 3)
            cv2.putText(frame, v["message"], (x1, y1-10),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
        
        return frame

    def process_video(self, source=0):
        cap = cv2.VideoCapture(source)
        print(f"Camera started: {source}")
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            detections = self.detect_frame(frame)
            violations = self.check_violations(detections)
            annotated = self.annotate_frame(frame, detections, violations)
            
            cv2.imshow("Traffic Violation Detection", annotated)
            
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
        
        cap.release()
        cv2.destroyAllWindows()
        return violations