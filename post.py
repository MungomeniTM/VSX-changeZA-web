# backend/app/routes/posts.py
from fastapi import APIRouter, Request, UploadFile, File, HTTPException, Depends
from app.models import posts, comments, users, engine
import databases, json
from app.core.security import decode_token
from sqlalchemy import select, insert, update

db = databases.Database(engine.url)
router = APIRouter(tags=["posts"])

@router.on_event("startup")
async def startup():
    await db.connect()

@router.on_event("shutdown")
async def shutdown():
    await db.disconnect()

def get_user_id_from_request(request: Request):
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        return None
    token = auth.split(" ", 1)[1]
    data = decode_token(token)
    if not data or "sub" not in data:
        return None
    return int(data["sub"])

@router.get("/posts")
async def list_posts(page: int = 1, limit: int = 12):
    offset = (page - 1) * limit
    q = posts.select().order_by(posts.c.created_at.desc()).limit(limit).offset(offset)
    rows = await db.fetch_all(q)
    result = []
    for r in rows:
        # simple user lookup
        u = await db.fetch_one(users.select().where(users.c.id == r["user_id"]))
        result.append({
            "id": r["id"],
            "text": r["text"],
            "media": r["media_url"],
            "mediaType": r["media_type"],
            "approvals": r["approvals"],
            "shares": r["shares"],
            "createdAt": r["created_at"].isoformat() if r["created_at"] else None,
            "user": { "id": u["id"], "firstName": u["first_name"], "lastName": u["last_name"], "avatarUrl": u.get("avatar_url") }
        })
    return {"posts": result, "hasMore": len(result) == limit}

@router.post("/posts")
async def create_post(request: Request, text: str = None, media: UploadFile = File(None)):
    uid = get_user_id_from_request(request)
    if not uid:
        raise HTTPException(status_code=401, detail="Not authenticated")
    media_url = None
    media_type = None
    # if media file provided, save using same uploads logic or a simple save
    if media:
        from pathlib import Path
        import uuid, os
        from app.core.config import UPLOAD_DIR
        Path(UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
        ext = media.filename.rsplit(".", 1)[-1]
        fname = f"{uuid.uuid4().hex}.{ext}"
        dest = os.path.join(UPLOAD_DIR, fname)
        content = await media.read()
        with open(dest, "wb") as f:
            f.write(content)
        media_url = f"/uploads/{fname}"
        media_type = "video" if media.content_type.startswith("video") else "image"

    values = { "user_id": uid, "text": text, "media_url": media_url, "media_type": media_type }
    ins = posts.insert().values(**values)
    pid = await db.execute(ins)
    row = await db.fetch_one(posts.select().where(posts.c.id == pid))
    # include user
    u = await db.fetch_one(users.select().where(users.c.id == uid))
    return {
        "id": row["id"],
        "text": row["text"],
        "media": row["media_url"],
        "mediaType": row["media_type"],
        "approvals": row["approvals"],
        "shares": row["shares"],
        "createdAt": row["created_at"].isoformat() if row["created_at"] else None,
        "user": {"id": u["id"], "firstName": u["first_name"], "lastName": u["last_name"]}
    }

@router.post("/posts/{post_id}/approve")
async def approve_post(post_id: int, request: Request):
    uid = get_user_id_from_request(request)
    if not uid:
        raise HTTPException(status_code=401, detail="Not authenticated")
    # increment approvals
    await db.execute(posts.update().where(posts.c.id == post_id).values(approvals = posts.c.approvals + 1))
    row = await db.fetch_one(posts.select().where(posts.c.id == post_id))
    return {"approvals": row["approvals"]}

@router.get("/posts/{post_id}/comments")
async def get_comments(post_id: int):
    rows = await db.fetch_all(comments.select().where(comments.c.post_id == post_id).order_by(comments.c.created_at))
    out = []
    for r in rows:
        u = await db.fetch_one(users.select().where(users.c.id == r["user_id"]))
        out.append({"id": r["id"], "text": r["text"], "user": {"id": u["id"], "name": f"{u['first_name']} {u['last_name']}"}})
    return out

@router.post("/posts/{post_id}/comments")
async def create_comment(post_id: int, payload: dict, request: Request):
    uid = get_user_id_from_request(request)
    if not uid:
        raise HTTPException(status_code=401, detail="Not authenticated")
    text = payload.get("text")
    if not text:
        raise HTTPException(status_code=400, detail="Missing text")
    ins = comments.insert().values(post_id=post_id, user_id=uid, text=text)
    cid = await db.execute(ins)
    row = await db.fetch_one(comments.select().where(comments.c.id == cid))
    u = await db.fetch_one(users.select().where(users.c.id == uid))
    return {"id": row["id"], "text": row["text"], "user": {"id": u["id"], "name": f"{u['first_name']} {u['last_name']}" }}