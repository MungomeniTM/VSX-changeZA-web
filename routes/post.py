# app/routers/posts.py
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.post import Post
from app.schemas.post import PostOut
from app.auth.dependencies import get_current_user
from typing import List
import os, shutil
from uuid import uuid4

router = APIRouter(prefix="/posts", tags=["Posts"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/", response_model=PostOut)
async def create_post(
    text: str = Form(""),
    media: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    media_url, media_type = None, None
    if media:
        ext = os.path.splitext(media.filename)[1]
        file_id = f"{uuid4().hex}{ext}"
        file_path = os.path.join(UPLOAD_DIR, file_id)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(media.file, buffer)
        media_url = f"/{UPLOAD_DIR}/{file_id}"
        media_type = "video" if media.content_type.startswith("video/") else "image"

    new_post = Post(
        text=text,
        media=media_url,
        media_type=media_type,
        user_id=current_user.id
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    return new_post


@router.get("/", response_model=List[PostOut])
async def get_posts(db: Session = Depends(get_db)):
    posts = db.query(Post).order_by(Post.created_at.desc()).limit(20).all()
    return posts


@router.post("/{post_id}/approve", response_model=PostOut)
async def approve_post(post_id: int, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    post.approvals += 1
    db.commit()
    db.refresh(post)
    return post