from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings
from app.core.logging import logger

Base = declarative_base()

IS_POSTGRES_AVAILABLE = False
engine = None
SessionLocal = None

try:
    if settings.DATABASE_URL and not settings.DATABASE_URL.startswith("sqlite"):
        test_engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True, connect_args={"connect_timeout": 2})
        with test_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        engine = test_engine
        IS_POSTGRES_AVAILABLE = True
        logger.info(f"[DB] Connected to PostgreSQL: {settings.DATABASE_URL}")
except Exception as e:
    logger.warning(f"[DB] PostgreSQL unavailable ({e}). Falling back to local SQLite database.")

if not engine:
    # SQLite fallback for reliable hackathon persistence
    sqlite_url = "sqlite:///./aaroh.db"
    engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})
    logger.info(f"[DB] Using local SQLite persistence engine: {sqlite_url}")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    try:
        import app.models.route_record  # Ensure models are registered on Base
        Base.metadata.create_all(bind=engine)
        logger.info("[DB] Database tables initialized.")
    except Exception as e:
        logger.error(f"[DB] Failed to initialize tables: {e}")

# Automatically initialize tables on import
init_db()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

