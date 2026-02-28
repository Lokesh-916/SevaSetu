"""
Health-check endpoint.

GET /api/v1/health  →  basic liveness probe
GET /api/v1/health/db  →  liveness + database connectivity probe
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/health", tags=["Health"])


@router.get(
    "",
    summary="Application liveness",
    response_description="Service is alive and running",
)
async def health_check():
    """Returns the application version and current UTC timestamp."""
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get(
    "/db",
    summary="Database connectivity probe",
    response_description="Service and database are reachable",
)
async def health_check_db(db: AsyncSession = Depends(get_db)):
    """Executes a lightweight query to verify database connectivity."""
    try:
        await db.execute(text("SELECT 1"))
        db_status = "ok"
    except Exception as exc:
        logger.error("Database health check failed", extra={"error": str(exc)})
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database is unreachable",
        ) from exc

    return {
        "status": "ok",
        "database": db_status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
