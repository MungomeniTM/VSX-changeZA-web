    # app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.routes import posts  # add this
from app.models import post    # ensures table creation
import os

Base.metadata.create_all(bind=engine)

app = FastAPI(title="VSXchangeZA API")

# Allow your frontend to access the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(posts.router)

@app.get("/")
def root():
    return {"message": "VSXchangeZA backend running"}

# Serve uploaded files
from fastapi.staticfiles import StaticFiles
if not os.path.exists("uploads"):
    os.makedirs("uploads")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")