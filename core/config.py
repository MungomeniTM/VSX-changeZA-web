import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./vsx.db")
SECRET_KEY = os.getenv("SECRET_KEY", "supersecret")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60