import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.db.session import check_db_connection, engine
from app.db.base import Base
# Import models to ensure they are registered with Base.metadata
import app.models  # noqa: F401
from app.routes import books_router, stats_router

logger = logging.getLogger("book_buddy")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Application startup: check database connection and ensure tables exist
    logger.info("Initializing Book Buddy API...")
    db_status = check_db_connection()
    if db_status["connected"]:
        logger.info(f"Database connection verified: {db_status['url']}")
        try:
            Base.metadata.create_all(bind=engine)
            logger.info("Database tables initialized successfully.")
        except Exception as e:
            logger.error(f"Error initializing database tables: {e}")
    else:
        logger.warning(
            f"Database not reachable at startup ({db_status['url']}): {db_status['error']}. "
            "Application will run, but database-dependent endpoints will report errors until PostgreSQL is reachable."
        )
    yield
    # Application shutdown
    logger.info("Shutting down Book Buddy API...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="""
# Book Buddy API - Reading Progress Tracker

Book Buddy is an autonomous full-stack reading progress and personal library tracking application.

### Important Architectural & Security Notice:
- **Authentication**: Authentication is **not yet enforced** in this initial foundation milestone. Endpoints operate in open development mode without user isolation or authentication headers. A future-ready `User` model is implemented in the schema to support JWT / OAuth2 authentication in the next milestone.
- **ORM Choice**: SQLAlchemy 2.x with `psycopg 3` is used natively for the Python backend. Prisma is intentionally not used in Python as Prisma's official ORM is designed for Node.js / TypeScript.
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["Health"])
def health_check():
    """
    Application health and database connectivity diagnostics.
    """
    db_check = check_db_connection()
    status_code = status.HTTP_200_OK if db_check["connected"] else status.HTTP_503_SERVICE_UNAVAILABLE

    content = {
        "status": "healthy" if db_check["connected"] else "degraded",
        "service": "book-buddy-api",
        "database": {
            "connected": db_check["connected"],
            "target": db_check["url"],
            "error": db_check["error"],
        },
        "authentication": {
            "status": "unauthenticated_development_mode",
            "message": "User isolation is not yet active. Endpoints are currently open for local development.",
        },
    }
    return JSONResponse(status_code=status_code, content=content)


# Register Routers
app.include_router(books_router)
app.include_router(stats_router)
