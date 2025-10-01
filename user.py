from sqlalchemy import Column, Integer, String
from app.core.config import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, default="client")  # client, farmer, skilled
    from fastapi.staticfiles import StaticFiles
from app.routes import auth, users, uploads
from app.core.config import API_PREFIX, UPLOAD_DIR

app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(users.router, prefix=API_PREFIX)
app.include_router(uploads.router, prefix=API_PREFIX)

# serve static uploads at /uploads
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")