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

if payload.photos is not None: update_values['photos'] = json.dumps(payload.photos)
if payload.companies is not None: update_values['companies'] = json.dumps(payload.companies)