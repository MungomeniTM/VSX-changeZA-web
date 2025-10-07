# backend/app/routes/posts.py
import os, uuid, shutil
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.post import Post
from app.models.user import User
from app.core.config import UPLOAD_DIR
from typing import Optional

router = APIRouter()

os.makedirs(UPLOAD_DIR, exist_ok=True)

def _get_user_from_token(request: Request, db: Session):
    # attempt JWT in Authorization header; if missing, return first user for dev convenience
    auth = request.headers.get("Authorization")
    if auth and auth.startswith("Bearer "):
        token = auth.split(" ",1)[1]
        try:
            from jose import jwt
            from app.core.config import SECRET_KEY, ALGORITHM
            data = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            uid = int(data.get("sub"))
            u = db.query(User).filter(User.id == uid).first()
            return u
        except Exception:
            return None
    # fallback: first user
    return db.query(User).first()

@router.get("/posts")
def list_posts(db: Session = Depends(get_db), page: int = 1, limit: int = 12):
    offset = (page-1)*limit
    rows = db.query(Post).order_by(Post.created_at.desc()).offset(offset).limit(limit).all()
    out = []
    for r in rows:
        out.append({
            "id": r.id,
            "text": r.text,
            "media": r.media,
            "mediaType": r.media_type,
            "approvals": r.approvals,
            "shares": r.shares,
            "createdAt": r.created_at.isoformat() if r.created_at else None,
            "user": {"id": r.user.id, "firstName": r.user.first_name, "lastName": r.user.last_name}
        })
    return {"posts": out, "hasMore": len(rows) == limit}

@router.post("/posts")
def create_post(request: Request, text: Optional[str] = Form(None), media: Optional[UploadFile] = File(None), db: Session = Depends(get_db)):
    user = _get_user_from_token(request, db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    media_url = None
    media_type = None
    if media:
        ext = os.path.splitext(media.filename)[1]
        fname = f"{uuid.uuid4().hex}{ext}"
        dest = os.path.join(UPLOAD_DIR, fname)
        with open(dest, "wb") as f:
            shutil.copyfileobj(media.file, f)
        media_url = f"/uploads/{fname}"
        media_type = "video" if media.content_type and media.content_type.startswith("video") else "image"
    p = Post(user_id=user.id, text=text, media=media_url, media_type=media_type)
    db.add(p); db.commit(); db.refresh(p)
    return {
        "id": p.id,
        "text": p.text,
        "media": p.media,
        "mediaType": p.media_type,
        "approvals": p.approvals,
        "shares": p.shares,
        "createdAt": p.created_at.isoformat() if p.created_at else None,
        "user": {"id": user.id, "firstName": user.first_name, "lastName": user.last_name}
    }

@router.post("/posts/{post_id}/approve")
def approve_post(post_id: int, request: Request, db: Session = Depends(get_db)):
    user = _get_user_from_token(request, db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    p = db.query(Post).filter(Post.id == post_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Post not found")
    p.approvals = (p.approvals or 0) + 1
    db.commit()
    return {"approvals": p.approvals}

@router.get("/posts/{post_id}/comments")
def get_comments(post_id: int, db: Session = Depends(get_db)):
    # simple placeholder: returns empty list (you can implement comment model later)
    return []

@router.post("/posts/{post_id}/comments")
def create_comment(post_id: int, request: Request, text: str = Form(...), db: Session = Depends(get_db)):
    user = _get_user_from_token(request, db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    # for now we return a minimal comment shape
    return {"id": 0, "text": text, "user": {"id": user.id, "name": f"{user.first_name} {user.last_name}"}}