# app/schemas/post.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class PostBase(BaseModel):
    text: Optional[str] = None
    media: Optional[str] = None

class PostCreate(PostBase):
    pass

class PostOut(PostBase):
    id: int
    media_type: Optional[str]
    approvals: int
    shares: int
    created_at: datetime

    class Config:
        orm_mode = True