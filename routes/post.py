from fastapi import APIRouter, Depends, UploadFile, Form
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.post import Post
from app.models.user import User
from app.models.comment import Comment
from app.schemas.post import PostOut
import shutil, os

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/posts")
def list_posts(db: Session = Depends(get_db), page: int = 1, limit: int = 10):
    posts = db.query(Post).offset((page-1)*limit).limit(limit).all()
    return {"posts": posts, "hasMore": len(posts) == limit}

@router.post("/posts", response_model=PostOut)
def create_post(
    db: Session = Depends(get_db),
    text: str = Form(None),
    media: UploadFile = None
):
    user = db.query(User).first()  # mock auth user
    media_path = None
    media_type = None
    if media:
        ext = os.path.splitext(media.filename)[1]
        media_path = os.path.join(UPLOAD_DIR, media.filename)
        with open(media_path, "wb") as f:
            shutil.copyfileobj(media.file, f)
        media_type = "video" if ext.lower() in [".mp4", ".mov"] else "image"
    post = Post(user_id=user.id, text=text, media=media_path, media_type=media_type)
    db.add(post)
    db.commit()
    db.refresh(post)
    return post

@router.post("/posts/{id}/approve")
def approve_post(id: int, db: Session = Depends(get_db)):
    post = db.query(Post).get(id)
    post.approvals += 1
    db.commit()
    return post

@router.get("/posts/{id}/comments")
def list_comments(id: int, db: Session = Depends(get_db)):
    return db.query(Comment).filter(Comment.post_id == id).all()

@router.post("/posts/{id}/comments")
def add_comment(id: int, text: str = Form(...), db: Session = Depends(get_db)):
    user = db.query(User).first()
    comment = Comment(post_id=id, user_id=user.id, text=text)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment