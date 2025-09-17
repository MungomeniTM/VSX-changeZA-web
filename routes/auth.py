from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.user import UserCreate, UserLogin
from app.models.user import User
from app.core.security import hash_password, verify_password, create_token
from app.core.config import get_db

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        name=user.name,
        email=user.email,
        hashed_password=hash_password(user.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_token({"sub": new_user.email})
    return {"token": token, "user": {"id": new_user.id, "name": new_user.name, "email": new_user.email}}

@router.post("/login")
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid email or password")

    token = create_token({"sub": user.email})
    return {"token": token, "user": {"id": user.id, "name": user.name, "email": user.email}}