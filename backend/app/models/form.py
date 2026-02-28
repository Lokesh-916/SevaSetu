"""
SQLAlchemy ORM models for form templates and active user form sessions.

Tables:
  - form_templates   – the "blank" official government forms
  - form_sessions    – a citizen's in-progress/completed instance of a form
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.core.database import Base
from app.models.enums import SessionStatus


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _uuid() -> str:
    return str(uuid.uuid4())


class FormTemplate(Base):
    """
    The master schema for an official government form.

    ``fields``             – JSON list of FormField dicts
    ``required_documents`` – JSON list of DocumentRequirement dicts
    ``validation_rules``   – JSON list of ValidationRule dicts
    """

    __tablename__ = "form_templates"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=_uuid, index=True
    )
    office_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("office_configs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    form_name: Mapped[str] = mapped_column(String(255), nullable=False)
    form_code: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    version: Mapped[str] = mapped_column(String(20), nullable=False, default="1.0")
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # JSON arrays/objects
    fields: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    required_documents: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    validation_rules: Mapped[list] = mapped_column(JSON, nullable=False, default=list)

    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    last_updated: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now, onupdate=_now
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now
    )

    # ── Relationships ────────────────────────────────────────────────────────
    office: Mapped["OfficeConfig"] = relationship(  # type: ignore[name-defined]
        "OfficeConfig", back_populates="form_templates"
    )
    sessions: Mapped[list["FormSession"]] = relationship(
        "FormSession", back_populates="template", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<FormTemplate code={self.form_code} v={self.version}>"


class FormSession(Base):
    """
    One citizen's attempt at completing a specific FormTemplate.

    ``form_data`` – JSON list of {field_id, field_name, value} dicts
                    representing the user's answers (auto-filled + confirmed).
    Tracks current step, language, and overall status.
    """

    __tablename__ = "form_sessions"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=_uuid, index=True
    )
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("user_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    template_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("form_templates.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    # Denormalized for quick access without joins
    office_type: Mapped[str] = mapped_column(String(100), nullable=False)
    form_type: Mapped[str] = mapped_column(String(100), nullable=False)

    language: Mapped[str] = mapped_column(String(10), nullable=False, default="en")
    current_step: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default=SessionStatus.IN_PROGRESS.value
    )

    # JSON list: [{field_id, field_name, value, confirmed}]
    form_data: Mapped[list] = mapped_column(JSON, nullable=False, default=list)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now, onupdate=_now
    )

    # ── Relationships ────────────────────────────────────────────────────────
    user: Mapped["UserProfile"] = relationship(  # type: ignore[name-defined]
        "UserProfile", back_populates="form_sessions"
    )
    template: Mapped["FormTemplate"] = relationship(
        "FormTemplate", back_populates="sessions"
    )
    documents: Mapped[list["Document"]] = relationship(  # type: ignore[name-defined]
        "Document", back_populates="session", cascade="all, delete-orphan"
    )
    assistance_receipt: Mapped["AssistanceReceipt | None"] = relationship(  # type: ignore[name-defined]
        "AssistanceReceipt", back_populates="session", uselist=False, cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<FormSession id={self.id} status={self.status}>"
