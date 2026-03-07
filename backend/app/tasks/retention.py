import asyncio
from datetime import datetime, timedelta, timezone
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import SessionLocal
from app.models.form import FormSession
from app.models.user import UserAuthSession
import logging

logger = logging.getLogger(__name__)

async def cleanup_expired_sessions():
    """
    Background loop that runs periodically to delete expired sessions and documents.
    Retention policy:
    1. Auth sessions expired > 24 hours ago
    2. Form sessions created > 7 days ago and not completed
    """
    while True:
        try:
            async with SessionLocal() as db:
                now = datetime.now(timezone.utc)
                
                # Delete old auth sessions
                auth_cutoff = now - timedelta(hours=24)
                await db.execute(delete(UserAuthSession).where(UserAuthSession.expires_at < auth_cutoff))
                
                # Delete old form sessions
                form_cutoff = now - timedelta(days=7)
                await db.execute(delete(FormSession).where(FormSession.created_at < form_cutoff))
                
                await db.commit()
                logger.info("Executed data retention cleanup.")
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Error in data retention cleanup: {e}")
        
        # Run every hour
        await asyncio.sleep(3600)

async def start_retention_task():
    asyncio.create_task(cleanup_expired_sessions())
