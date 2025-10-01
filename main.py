from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth
from app.core.config import Base, engine

# ---------------------------
# Create DB tables (cosmic precision)
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
# CORS setup for frontend (no mistakes)
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
app.include_router(auth.router)

# ---------------------------
# Root endpoint
# ---------------------------
@app.get("/")
def root():
    return {"message": "VSXchangeZA API is running smoothly 🚀"}
    from fastapi.staticfiles import StaticFiles
from app.routes import auth, users, uploads
from app.core.config import API_PREFIX, UPLOAD_DIR

app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(users.router, prefix=API_PREFIX)
app.include_router(uploads.router, prefix=API_PREFIX)

# serve static uploads at /uploads
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
    
    