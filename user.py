# backend/app/models/user.py
import json
from sqlalchemy import Column, Integer, String, DateTime, Text, func
from app.core.config import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(120), nullable=True)
    last_name = Column(String(120), nullable=True)
    email = Column(String(320), unique=True, index=True, nullable=False)
    password_hash = Column(String(256), nullable=False)
    role = Column(String(50), nullable=True, default="client")   # client / farmer / skilled
    location = Column(String(200), nullable=True)               # searchable location
    skills = Column(Text, nullable=True)                        # JSON list of skills
    portfolio = Column(Text, nullable=True)                     # JSON list: {type:'image'|'url', value:...}
    created_at = Column(DateTime, server_default=func.now())

    def as_dict(self):
        """Return safe dict for API responses."""
        out = {
            "id": self.id,
            "firstName": self.first_name,
            "lastName": self.last_name,
            "email": self.email,
            "role": self.role,
            "location": self.location,
            "skills": [],
            "portfolio": [],
            "createdAt": self.created_at.isoformat() if self.created_at else None
        }
        try:
            if self.skills:
                out["skills"] = json.loads(self.skills)
        except Exception:
            out["skills"] = []

        try:
            if self.portfolio:
                out["portfolio"] = json.loads(self.portfolio)
        except Exception:
            out["portfolio"] = []

        return out

    def update_from_dict(self, payload: dict):
        """Safely update fields from a dictionary (used in PUT /api/me)."""
        allowed = {"first_name", "last_name", "role", "location"}
        # skills & portfolio are handled specially (must be JSON serializable)
        for k, v in payload.items():
            if k in allowed:
                setattr(self, k, v)

        if isinstance(payload.get("skills"), (list, tuple)):
            self.skills = json.dumps(list(payload["skills"]))
        if isinstance(payload.get("portfolio"), (list, tuple)):
            self.portfolio = json.dumps(list(payload["portfolio"]))