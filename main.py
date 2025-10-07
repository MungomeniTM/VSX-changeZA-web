# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.database import Base, engine
from app.core.config import UPLOAD_DIR
from app.routes import uploads  # if you already have uploads route
from app.routes import posts
# import users/auth routers as you have them

Base.metadata.create_all(bind=engine)

app = FastAPI(title="VSXchangeZA API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5500","http://localhost:5500", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# include routers
app.include_router(posts.router)       # provides /posts endpoints
# app.include_router(uploads.router, prefix="/api")  # if you have a separate uploads route

# serve uploads (so uploaded files are accessible at /uploads/<filename>)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.get("/")
def root():
    return {"message":"VSXchangeZA API running"}