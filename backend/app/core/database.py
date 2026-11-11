from sqlalchemy import create_engine, text, event
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

engine_kwargs = {"pool_pre_ping": True}
if settings.DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False, "timeout": 30}
else:
    # High-concurrency connection pool for global multi-tenant deployments (PostgreSQL)
    engine_kwargs["pool_size"] = 50
    engine_kwargs["max_overflow"] = 50
    engine_kwargs["pool_timeout"] = 30
    engine_kwargs["pool_recycle"] = 1800

engine = create_engine(settings.DATABASE_URL, **engine_kwargs)

if settings.DATABASE_URL.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        """Enable Write-Ahead Logging (WAL) and busy timeout for concurrent multi-client throughput."""
        cursor = dbapi_connection.cursor()
        try:
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA synchronous=NORMAL")
            cursor.execute("PRAGMA busy_timeout=15000")
        finally:
            cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def run_migrations():
    """Ensure database schema includes all enterprise columns across versions."""
    try:
        with engine.connect() as conn:
            if settings.DATABASE_URL.startswith("sqlite"):
                cursor = conn.execute(text("PRAGMA table_info(user_profiles)")).fetchall()
                existing_cols = {row[1] for row in cursor}
                if existing_cols:
                    if "two_factor_code" not in existing_cols:
                        conn.execute(text("ALTER TABLE user_profiles ADD COLUMN two_factor_code VARCHAR(10)"))
                    if "two_factor_code_expires_at" not in existing_cols:
                        conn.execute(text("ALTER TABLE user_profiles ADD COLUMN two_factor_code_expires_at DATETIME"))
                    if "two_factor_backup_code" not in existing_cols:
                        conn.execute(text("ALTER TABLE user_profiles ADD COLUMN two_factor_backup_code VARCHAR(32)"))
                    conn.commit()
    except Exception:
        pass

run_migrations()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

