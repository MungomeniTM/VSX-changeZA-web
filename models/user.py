from sqlalchemy import Column, Integer, String, Text
from app.core.config import Base

class User(Base):
    __tablename__ = "users"

    # ---------------------------
    # Core identity
    # ---------------------------
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)        # Full name
    email = Column(String(120), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)

    # ---------------------------
    # Vocational + Profile Details
    # ---------------------------
    skill = Column(String(100), index=True)           # e.g. Electrician, Farmer, Builder
    location = Column(String(150), index=True)        # City / Province / Country
    bio = Column(Text, nullable=True)                 # Short description, principles, mission
    experience_years = Column(Integer, default=0)     # Years of experience
    rating = Column(String(10), default="0")          # Future rating system
    customers = Column(Integer, default=0)            # Count of served clients/projects

    # ---------------------------
    # Portfolio & Social Media
    # ---------------------------
    portfolio_url = Column(String(255), nullable=True) # Website/LinkedIn/Farm/Company
    photo = Column(String(255), nullable=True)         # Profile photo filename
    gallery = Column(Text, nullable=True)              # JSON string for uploaded work photos

    # ---------------------------
    # Metadata
    # ---------------------------
    created_at = Column(String(50), default="2025")    # Placeholder, can swap for datetime
    updated_at = Column(String(50), default="2025")