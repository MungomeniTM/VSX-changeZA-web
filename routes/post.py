from fastapi import APIRouter, Depends, UploadFile, Form, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.post import Post
from app.models.user import User
import os, shutil

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.get("/posts")
def list_posts(db: Session = Depends(get_db), page: int = 1, limit: int = 10):
    """Return paginated posts with user info."""
    offset = (page - 1) * limit
    posts = db.query(Post).order_by(Post.created_at.desc()).offset(offset).limit(limit).all()
    has_more = len(posts) == limit
    results = []
    for p in posts:
        results.append({
            "id": p.id,
            "text": p.text,
            "media": p.media,
            "mediaType": p.media_type,
            "approvals": p.approvals,
            "shares": p.shares,
            "createdAt": p.created_at,
            "user": {
                "id": p.user.id if p.user else None,
                "firstName": p.user.first_name if p.user else "User",
                "lastName": p.user.last_name if p.user else "",
                "role": p.user.role if p.user else "",
                "location": p.user.location if p.user else ""
            }
        })
    return {"posts": results, "hasMore": has_more}


@router.post("/posts")
def create_post(
    db: Session = Depends(get_db),
    text: str = Form(None),
    media: UploadFile | None = None
):
    """Create a new post (text + optional media)."""
    user = db.query(User).first()  # mock user for now
    if not user:
        raise HTTPException(status_code=400, detail="No user found to attach post")

    media_path = None
    media_type = None

    if media:
        ext = os.path.splitext(media.filename)[1].lower()
        media_path = os.path.join(UPLOAD_DIR, media.filename)
        with open(media_path, "wb") as f:
            shutil.copyfileobj(media.file, f)
        media_type = "video" if ext in [".mp4", ".mov", ".avi", ".mkv"] else "image"

    new_post = Post(
        user_id=user.id,
        text=text,
        media=media_path,
        media_type=media_type
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)

    return {
        "id": new_post.id,
        "text": new_post.text,
        "media": new_post.media,
        "mediaType": new_post.media_type,
        "approvals": new_post.approvals,
        "shares": new_post.shares,
        "createdAt": new_post.created_at,
        "user": {
            "id": user.id,
            "firstName": user.first_name,
            "lastName": user.last_name,
            "role": user.role,
            "location": user.location
        }
    }


@router.post("/posts/{id}/approve")
def approve_post(id: int, db: Session = Depends(get_db)):
    """Approve (❤️) a post."""
    post = db.query(Post).filter(Post.id == id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    post.approvals += 1
    db.commit()
    db.refresh(post)
    return {"id": post.id, "approvals": post.approvals}