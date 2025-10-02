# backend/app/models.py
from sqlalchemy import Table, Column, Integer, String, Text, DateTime, MetaData, ForeignKey, Boolean
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
    # ... other columns (bio, skills, photos...) --
)

posts = Table(
    "posts",
    metadata,
    Column("id", Integer, primary_key=True, index=True),
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE")),
    Column("text", Text, nullable=True),
    Column("media_url", String(1024), nullable=True),
    Column("media_type", String(32), nullable=True),
    Column("approvals", Integer, default=0),
    Column("shares", Integer, default=0),
    Column("created_at", DateTime, server_default=func.now()),
)

comments = Table(
    "comments",
    metadata,
    Column("id", Integer, primary_key=True, index=True),
    Column("post_id", Integer, ForeignKey("posts.id", ondelete="CASCADE")),
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE")),
    Column("text", Text, nullable=False),
    Column("created_at", DateTime, server_default=func.now()),
)

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
metadata.create_all(engine)