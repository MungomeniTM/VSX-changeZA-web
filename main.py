from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth
from app.core.config import Base, engine

# ---------------------------
# Create DB tables
# ---------------------------
Base.metadata.create_all(bind=engine)

# ---------------------------
# Create FastAPI app
# ---------------------------
app = FastAPI(
    title="VSXchangeZA API",
    description="Backend API for VSXchangeZA",
    version="1.0.0"
)

# ---------------------------
# CORS (allow frontend)
# ---------------------------
origins = [
    "http://127.0.0.1:5500",  # frontend server
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
    return {"message": "VSXchangeZA API is running!"}