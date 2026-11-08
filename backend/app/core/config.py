import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
STORAGE_DIR = BASE_DIR / "storage"
VIDEOS_DIR = STORAGE_DIR / "videos"
FRAMES_DIR = STORAGE_DIR / "frames"
THUMBNAILS_DIR = STORAGE_DIR / "thumbnails"
REPORTS_DIR = STORAGE_DIR / "reports"

for d in [STORAGE_DIR, VIDEOS_DIR, FRAMES_DIR, THUMBNAILS_DIR, REPORTS_DIR]:
    d.mkdir(parents=True, exist_ok=True)

class Settings:
    PROJECT_NAME: str = "RallyVision Pro"
    VERSION: str = "2.4.0"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "rallyvision-secret-key-super-secure-production-ready-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # SQLite default for instant zero-dependency execution, overrideable with PostgreSQL
    _raw_db_url: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'rallyvision.db'}")
    if _raw_db_url.startswith("postgres://"):
        _raw_db_url = _raw_db_url.replace("postgres://", "postgresql://", 1)
    DATABASE_URL: str = _raw_db_url
    
    # Upload limits
    MAX_UPLOAD_SIZE_MB: int = 250
    ALLOWED_EXTENSIONS: set = {".mp4", ".mov", ".avi", ".mkv", ".webm"}
    
    # Court dimensions in meters (BWF Standard)
    COURT_LENGTH_M: float = 13.40
    COURT_WIDTH_DOUBLES_M: float = 6.10
    COURT_WIDTH_SINGLES_M: float = 5.18
    SHORT_SERVICE_DISTANCE_M: float = 1.98
    DOUBLES_SERVICE_LINE_M: float = 0.76

settings = Settings()
