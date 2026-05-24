from datetime import datetime

import bcrypt
from bson import ObjectId

ADMIN = "admin"
OFFICER = "officer"
VIEWER = "viewer"

ROLES = frozenset({ADMIN, OFFICER, VIEWER})

# Higher value = more privileges
ROLE_LEVEL = {
    ADMIN: 3,
    OFFICER: 2,
    VIEWER: 1,
}


class User:
    COLLECTION = "users"

    def __init__(
        self,
        username,
        email,
        password_hash=None,
        role=VIEWER,
        is_active=True,
        _id=None,
        created_at=None,
        updated_at=None,
    ):
        if role not in ROLES:
            raise ValueError(f"Invalid role: {role}. Must be one of {sorted(ROLES)}")

        self._id = ObjectId(_id) if _id and not isinstance(_id, ObjectId) else _id
        self.username = username
        self.email = email
        self.password_hash = password_hash
        self.role = role
        self.is_active = is_active
        self.created_at = created_at or datetime.utcnow()
        self.updated_at = updated_at or datetime.utcnow()

    @staticmethod
    def is_valid_role(role):
        return role in ROLES

    @property
    def role_level(self):
        return ROLE_LEVEL[self.role]

    def has_role(self, *roles):
        return self.role in roles

    def has_role_or_higher(self, minimum_role):
        return self.role_level >= ROLE_LEVEL[minimum_role]

    def is_admin(self):
        return self.role == ADMIN

    def is_officer(self):
        return self.role == OFFICER

    def is_viewer(self):
        return self.role == VIEWER

    def can_manage_users(self):
        return self.is_admin()

    def can_review_violations(self):
        return self.has_role(ADMIN, OFFICER)

    def can_update_violation_status(self):
        return self.can_review_violations()

    def can_view_violations(self):
        return self.role in ROLES

    def check_password(self, password):
        if not self.password_hash:
            return False
        return bcrypt.checkpw(password.encode("utf-8"), self.password_hash)

    @staticmethod
    def hash_password(password):
        return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())

    def to_document(self):
        doc = {
            "username": self.username,
            "email": self.email,
            "role": self.role,
            "is_active": self.is_active,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }
        if self.password_hash is not None:
            doc["password_hash"] = self.password_hash
        if self._id:
            doc["_id"] = self._id
        return doc

    def to_json(self):
        return {
            "id": str(self._id) if self._id else None,
            "username": self.username,
            "email": self.email,
            "role": self.role,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    @classmethod
    def from_document(cls, doc):
        if not doc:
            return None
        return cls(
            _id=doc.get("_id"),
            username=doc["username"],
            email=doc["email"],
            password_hash=doc.get("password_hash"),
            role=doc.get("role", VIEWER),
            is_active=doc.get("is_active", True),
            created_at=doc.get("created_at"),
            updated_at=doc.get("updated_at"),
        )

    @classmethod
    def find_by_id(cls, db, user_id):
        doc = db.users.find_one({"_id": ObjectId(user_id)})
        return cls.from_document(doc)

    @classmethod
    def find_by_email(cls, db, email):
        doc = db.users.find_one({"email": email})
        return cls.from_document(doc)

    def save(self, db):
        self.updated_at = datetime.utcnow()
        doc = self.to_document()
        doc.pop("_id", None)

        if self._id:
            db.users.update_one({"_id": self._id}, {"$set": doc})
        else:
            result = db.users.insert_one(doc)
            self._id = result.inserted_id

        return self
