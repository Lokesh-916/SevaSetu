"""
Async SQLAlchemy engine + session factory for SevaSetu.

We use the async variant (aiosqlite) so every FastAPI route stays
fully non-blocking. Alembic uses a synchronous URL derived from the
same DATABASE_URL for its migrations (see alembic/env.py).
"""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

# ── Engine ────────────────────────────────────────────────────────────────────
# connect_args is required for SQLite to allow multi-threaded access.
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DB_ECHO,
    connect_args={"check_same_thread": False},
)

# ── Session factory ───────────────────────────────────────────────────────────
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


# ── Declarative base (shared by all ORM models) ───────────────────────────────
class Base(DeclarativeBase):
    """All ORM models inherit from this base."""


# ── FastAPI dependency ────────────────────────────────────────────────────────
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Yield a database session for a single request and close it afterwards.

    Usage in a route:
        async def my_route(db: AsyncSession = Depends(get_db)):
            ...
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# ── Startup / shutdown helpers ────────────────────────────────────────────────
async def init_db() -> None:
    """
    Create all tables that do not yet exist.
    In production you would use Alembic migrations instead; this is
    kept here as a convenience during early development.
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created / verified")


async def close_db() -> None:
    """Dispose the engine connection pool on application shutdown."""
    await engine.dispose()
    logger.info("Database connection pool disposed")
