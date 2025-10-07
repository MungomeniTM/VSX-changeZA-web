# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.database import Base, engine
from app.core.config import API_PREFIX, UPLOAD_DIR
from app.routes import auth, uploads, posts

# create DB tables (if using ORM models)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="VSXchangeZA API 🚀")

app.add_middleware(CORSMiddleware, allow_origins=["http://127.0.0.1:5500","http://localhost:5500"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# mount routers with consistent prefix your frontend expects (/api/...)
app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(uploads.router, prefix=API_PREFIX)
app.include_router(posts.router, prefix=API_PREFIX)

# static uploads route
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.get("/")
def root():
    return {"message": "VSXchangeZA API is running 🚀"}