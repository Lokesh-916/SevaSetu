"""
SQLAlchemy ORM model for uploaded documents and their validation results.

Table: documents

   ValidationResult is embedded as JSON columns on the Document row,
   avoiding a separate table while still being fully queryable via JSON
   path expressions in SQLite ≥ 3.38.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.core.database import Base
from app.models.enums import DocumentType, RiskLevel


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _uuid() -> str:
    return str(uuid.uuid4())


class Document(Base):
    """
    Represents a file uploaded by the citizen during a form session.

    Validation result fields are stored directly on this row:
      - ``is_valid``       overall pass/fail
      - ``confidence``     0.0–1.0 OCR/AI confidence score
      - ``validation_issues``  JSON list of ValidationIssue dicts
      - ``suggestions``    JSON list of plain-text correction hints
      - ``risk_level``     low | medium | high rejection risk
    """

    __tablename__ = "documents"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=_uuid, index=True
    )
    session_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("form_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ── File metadata ────────────────────────────────────────────────────────
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(Text, nullable=False)   # local storage path
    content_type: Mapped[str] = mapped_column(String(100), nullable=False)
    file_size_bytes: Mapped[int] = mapped_column(nullable=False, default=0)
    document_type: Mapped[str] = mapped_column(
        String(50), nullable=False, default=DocumentType.OTHER.value
    )

    # ── OCR output ───────────────────────────────────────────────────────────
    extracted_text: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ── Embedded ValidationResult fields ─────────────────────────────────────
    is_valid: Mapped[bool | None] = mapped_column(nullable=True)
    confidence: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    risk_level: Mapped[str] = mapped_column(
        String(10), nullable=False, default=RiskLevel.LOW.value
    )
    # JSON list: [{issue_type, field_name, description, severity, suggested_fix}]
    validation_issues: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    # JSON list of plain-text hints like "Please provide a clearer scan."
    suggestions: Mapped[list] = mapped_column(JSON, nullable=False, default=list)

    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now
    )
    validated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # ── Relationships ────────────────────────────────────────────────────────
    session: Mapped["FormSession"] = relationship(  # type: ignore[name-defined]
        "FormSession", back_populates="documents"
    )

    def __repr__(self) -> str:
        return f"<Document id={self.id} type={self.document_type} valid={self.is_valid}>"
