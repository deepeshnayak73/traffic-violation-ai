from datetime import datetime

from bson import ObjectId

PENDING = "pending"
REVIEWED = "reviewed"
CHALLAN_ISSUED = "challan_issued"

STATUSES = frozenset({PENDING, REVIEWED, CHALLAN_ISSUED})

VIOLATION_TYPES = frozenset({"no_helmet", "no_seatbelt"})


class Violation:
    COLLECTION = "violations"

    def __init__(
        self,
        violation_type,
        status=PENDING,
        location=None,
        confidence=None,
        bbox=None,
        fine=None,
        severity=None,
        description=None,
        frame_path=None,
        detected_at=None,
        reviewed_by=None,
        updated_at=None,
        _id=None,
    ):
        if violation_type not in VIOLATION_TYPES:
            raise ValueError(
                f"Invalid violation_type: {violation_type}. "
                f"Must be one of {sorted(VIOLATION_TYPES)}"
            )
        if status not in STATUSES:
            raise ValueError(f"Invalid status: {status}. Must be one of {sorted(STATUSES)}")

        self._id = ObjectId(_id) if _id and not isinstance(_id, ObjectId) else _id
        self.violation_type = violation_type
        self.status = status
        self.location = location
        self.confidence = confidence
        self.bbox = bbox
        self.fine = fine
        self.severity = severity
        self.description = description
        self.frame_path = frame_path
        self.detected_at = detected_at or datetime.utcnow()
        self.reviewed_by = reviewed_by
        self.updated_at = updated_at or datetime.utcnow()

    @staticmethod
    def is_valid_status(status):
        return status in STATUSES

    @staticmethod
    def is_valid_type(violation_type):
        return violation_type in VIOLATION_TYPES

    def is_pending(self):
        return self.status == PENDING

    def mark_reviewed(self, reviewer_id):
        self.status = REVIEWED
        self.reviewed_by = str(reviewer_id)
        self.updated_at = datetime.utcnow()

    def mark_challan_issued(self, reviewer_id):
        self.status = CHALLAN_ISSUED
        self.reviewed_by = str(reviewer_id)
        self.updated_at = datetime.utcnow()

    def to_document(self):
        doc = {
            "violation_type": self.violation_type,
            "status": self.status,
            "location": self.location,
            "confidence": self.confidence,
            "bbox": self.bbox,
            "fine": self.fine,
            "severity": self.severity,
            "description": self.description,
            "frame_path": self.frame_path,
            "detected_at": self.detected_at,
            "reviewed_by": self.reviewed_by,
            "updated_at": self.updated_at,
        }
        if self._id:
            doc["_id"] = self._id
        return doc

    def to_json(self):
        return {
            "_id": str(self._id) if self._id else None,
            "violation_type": self.violation_type,
            "status": self.status,
            "location": self.location,
            "confidence": self.confidence,
            "bbox": self.bbox,
            "fine": self.fine,
            "severity": self.severity,
            "description": self.description,
            "frame_path": self.frame_path,
            "detected_at": self.detected_at.isoformat() if self.detected_at else None,
            "reviewed_by": self.reviewed_by,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    @classmethod
    def from_document(cls, doc):
        if not doc:
            return None
        return cls(
            _id=doc.get("_id"),
            violation_type=doc["violation_type"],
            status=doc.get("status", PENDING),
            location=doc.get("location"),
            confidence=doc.get("confidence"),
            bbox=doc.get("bbox"),
            fine=doc.get("fine"),
            severity=doc.get("severity"),
            description=doc.get("description"),
            frame_path=doc.get("frame_path"),
            detected_at=doc.get("detected_at"),
            reviewed_by=doc.get("reviewed_by"),
            updated_at=doc.get("updated_at"),
        )

    @classmethod
    def from_detection(cls, detection, location=None, frame_path=None):
        """Build a violation from AI detector output."""
        return cls(
            violation_type=detection.get("type") or detection.get("violation_type"),
            confidence=detection.get("confidence"),
            bbox=detection.get("bbox"),
            description=detection.get("message") or detection.get("description"),
            fine=detection.get("fine"),
            severity=detection.get("severity"),
            location=location,
            frame_path=frame_path,
        )

    @classmethod
    def find_by_id(cls, db, violation_id):
        doc = db.violations.find_one({"_id": ObjectId(violation_id)})
        return cls.from_document(doc)

    @classmethod
    def find_all(cls, db, query=None, skip=0, limit=10):
        query = query or {}
        docs = db.violations.find(query).skip(skip).limit(limit)
        return [cls.from_document(doc) for doc in docs]

    @classmethod
    def count(cls, db, query=None):
        return db.violations.count_documents(query or {})

    def save(self, db):
        self.updated_at = datetime.utcnow()
        doc = self.to_document()
        doc.pop("_id", None)

        if self._id:
            db.violations.update_one({"_id": self._id}, {"$set": doc})
        else:
            result = db.violations.insert_one(doc)
            self._id = result.inserted_id

        return self
