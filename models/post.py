# app/models/post.py
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from app.database import Base

class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    text = Column(String, nullable=True)
    media = Column(String, nullable=True)
    media_type = Column(String, nullable=True)
    approvals = Column(Integer, default=0)
    shares = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user = relationship("User", back_populates="posts")