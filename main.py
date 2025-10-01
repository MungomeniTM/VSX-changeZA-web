from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles  # ✅ must be imported at the top

from app.routes import auth, uploads  # ✅ add users.py later once stable
from app.core.config import Base, engine, API_PREFIX, UPLOAD_DIR

# ---------------------------
# Create DB tables
# ---------------------------
Base.metadata.create_all(bind=engine)

# ---------------------------
# FastAPI app
# ---------------------------
app = FastAPI(
    title="VSXchangeZA API 🚀",
    description="Backend API for VSXchangeZA — Cosmic-level authentication",
    version="1.0.0"
)

# ---------------------------
# CORS setup for frontend
# ---------------------------
origins = [
    "http://127.0.0.1:5500",  # VSCode Live Server
    "http://localhost:5500"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------
# Include routes
# ---------------------------
app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(uploads.router, prefix=API_PREFIX)
# app.include_router(users.router, prefix=API_PREFIX)  # add when users route is ready

# ---------------------------
# Serve static uploads (profile photos, portfolios, etc.)
# ---------------------------
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# ---------------------------
# Root endpoint
# ---------------------------
@app.get("/")
def root():
    return {"message": "VSXchangeZA API is running smoothly 🚀"}