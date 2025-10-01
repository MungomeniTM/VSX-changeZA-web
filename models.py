# app/models.py (only showing users table)
from sqlalchemy import Table, Column, Integer, String, DateTime, MetaData, Boolean, Text, Float
from sqlalchemy.sql import func
from sqlalchemy import create_engine
from app.core.config import DATABASE_URL

metadata = MetaData()

users = Table(
    "users",
    metadata,
    Column("id", Integer, primary_key=True, index=True),
    Column("first_name", String(120)),
    Column("last_name", String(120)),
    Column("email", String(320), unique=True, index=True, nullable=False),
    Column("password_hash", String(256), nullable=False),
    Column("role", String(50), nullable=True),
    Column("location", String(200), nullable=True),
    Column("bio", Text, nullable=True),
    Column("skills", Text, nullable=True),
    Column("portfolio", Text, nullable=True),
    Column("photos", Text, nullable=True),      # new: JSON text array of photo URLs
    Column("companies", Text, nullable=True),   # new: JSON text array of company URLs
    Column("avatar_url", String(1024), nullable=True),
    Column("rate", Float, nullable=True),
    Column("availability", String(256), nullable=True),
    Column("discoverable", Boolean, server_default="1"),
    Column("created_at", DateTime, server_default=func.now()),
)

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
metadata.create_all(engine)