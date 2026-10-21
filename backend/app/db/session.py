import logging
from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings

logger = logging.getLogger("book_buddy.db")

# Build engine arguments with connection pooling
engine_kwargs = {
    "pool_pre_ping": True,  # Test connections for liveness before using
}

# Only configure connection pooling arguments for non-SQLite databases
if not settings.DATABASE_URL.startswith("sqlite"):
    engine_kwargs.update(
        {
            "pool_size": settings.DB_POOL_SIZE,
            "max_overflow": settings.DB_MAX_OVERFLOW,
            "pool_timeout": settings.DB_POOL_TIMEOUT,
            "pool_recycle": settings.DB_POOL_RECYCLE,
        }
    )

# Engine created once per application process
engine = create_engine(
    settings.DATABASE_URL,
    **engine_kwargs,
)

# Central session factory created once
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency yielding a thread-local database session per request.
    Guarantees session cleanup upon request completion.
    """
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_db_connection() -> dict:
    """
    Diagnostic helper to test PostgreSQL database connectivity.
    Returns status and diagnostic details without crashing the app.
    """
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1")).scalar()
            return {
                "connected": result == 1,
                "url": str(engine.url).split("@")[-1] if "@" in str(engine.url) else str(engine.url),
                "error": None,
            }
    except Exception as exc:
        logger.warning(f"Database connection check failed: {exc}")
        return {
            "connected": False,
            "url": str(engine.url).split("@")[-1] if "@" in str(engine.url) else str(engine.url),
            "error": str(exc),
        }
