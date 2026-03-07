from datetime import datetime, timezone
import uuid
from sqlalchemy import Boolean, DateTime, String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON

from app.core.database import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)

def _uuid() -> str:
    return str(uuid.uuid4())

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid, index=True)
    user_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    action: Mapped[str] = mapped_column(String(50), index=True)
    resource: Mapped[str] = mapped_column(String(100), index=True)
    resource_id: Mapped[str | None] = mapped_column(String(100), index=True, nullable=True)
    details: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_now)
