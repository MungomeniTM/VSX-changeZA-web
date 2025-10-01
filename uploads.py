# app/routes/uploads.py
import os
import uuid
from fastapi import APIRouter, File, UploadFile, HTTPException, Request
from fastapi.responses import JSONResponse
from app.core.config import UPLOAD_DIR  # we'll define UPLOAD_DIR in config.py
from pathlib import Path

router = APIRouter(tags=["upload"])

# ensure upload dir exists
Path(UPLOAD_DIR).mkdir(parents=True, exist_ok=True)

ALLOWED_EXT = {"png", "jpg", "jpeg", "gif", "webp", "mp4", "mov", "webm"}

def _secure_filename(name: str):
    # simple secure filename: uuid + ext
    ext = name.rsplit(".", 1)[-1].lower() if "." in name else ""
    if ext not in ALLOWED_EXT:
        raise ValueError("invalid file type")
    return f"{uuid.uuid4().hex}.{ext}"

@router.post("/upload")
async def upload_file(request: Request, file: UploadFile = File(...)):
    # optional auth
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        return JSONResponse(status_code=401, content={"detail":"Not authenticated"})
    try:
        filename = _secure_filename(file.filename)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    dest = os.path.join(UPLOAD_DIR, filename)
    try:
        with open(dest, "wb") as f:
            content = await file.read()
            f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to save file")
    # return URL accessible by frontend - mount /uploads to UPLOAD_DIR in main.py
    url = f"/uploads/{filename}"
    return {"url": url}