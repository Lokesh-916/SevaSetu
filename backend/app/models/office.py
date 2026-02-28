"""
SQLAlchemy ORM model for government office configuration.

Table: office_configs
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.core.database import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _uuid() -> str:
    return str(uuid.uuid4())


class OfficeConfig(Base):
    """
    Stores per-office rules, supported languages, contact information,
    and the confidence threshold that triggers human escalation.

    ``supported_languages``  – JSON list of SupportedLanguage values, e.g. ["en","hi","ta"]
    ``processing_rules``     – JSON list of rule dicts (type, condition, action)
    ``contact_info``         – JSON dict (phone, email, address, website)
    ``operating_hours``      – JSON dict (days, open_time, close_time, timezone)
    """

    __tablename__ = "office_configs"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=_uuid, index=True
    )
    office_name: Mapped[str] = mapped_column(String(255), nullable=False)
    office_code: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False, index=True
    )
    department: Mapped[str | None] = mapped_column(String(255), nullable=True)
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Escalation threshold: if AI confidence < this value, human review is triggered
    escalation_threshold: Mapped[float] = mapped_column(
        Float, nullable=False, default=0.75
    )

    supported_languages: Mapped[list] = mapped_column(
        JSON, nullable=False, default=lambda: ["en"]
    )
    processing_rules: Mapped[list] = mapped_column(
        JSON, nullable=False, default=list
    )
    contact_info: Mapped[dict] = mapped_column(
        JSON, nullable=False, default=dict
    )
    operating_hours: Mapped[dict] = mapped_column(
        JSON, nullable=False, default=dict
    )

    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now, onupdate=_now
    )

    # ── Relationships ────────────────────────────────────────────────────────
    form_templates: Mapped[list["FormTemplate"]] = relationship(  # type: ignore[name-defined]
        "FormTemplate", back_populates="office", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<OfficeConfig code={self.office_code} name={self.office_name}>"
