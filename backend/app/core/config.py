import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = os.getenv("SECRET_KEY", "emplytic-super-secret-key-change-in-production-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

# Database Configuration (supports PostgreSQL and SQLite fallback)
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR}/emplytic.db")
# Fix for cloud providers (Render, Heroku, Railway) supplying postgres:// instead of postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Demo Mode
DEMO_MODE = os.getenv("DEMO_MODE", "true").lower() in ("true", "1", "yes")

# CORS Configuration
allowed_origins_raw = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000,*"
)
if allowed_origins_raw.strip() == "*":
    ALLOWED_ORIGINS = ["*"]
else:
    ALLOWED_ORIGINS = [origin.strip() for origin in allowed_origins_raw.split(",") if origin.strip()]


# Storage Directories
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
MODELS_DIR = os.path.join(BASE_DIR, "models")
REPORTS_DIR = os.path.join(BASE_DIR, "reports")
DATA_DIR = os.path.join(BASE_DIR, "data")
DATA_RAW = os.path.join(DATA_DIR, "raw")
DATA_CLEANED = os.path.join(DATA_DIR, "cleaned")
DATA_PROCESSED = os.path.join(DATA_DIR, "processed")

for directory in [UPLOAD_DIR, MODELS_DIR, REPORTS_DIR, DATA_DIR, DATA_RAW, DATA_CLEANED, DATA_PROCESSED]:
    os.makedirs(directory, exist_ok=True)

