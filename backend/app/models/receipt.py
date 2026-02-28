"""
SQLAlchemy ORM model for human-escalation assistance receipts.

Table: assistance_receipts

Generated when the AI confidence score falls below the office threshold.
Both the citizen and the responsible officer receive a copy of this receipt.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.core.database import Base
from app.models.enums import ReceiptStatus


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _uuid() -> str:
    return str(uuid.uuid4())


class AssistanceReceipt(Base):
    """
    Created when the AI cannot confidently guide a citizen and human
    intervention is required (Requirements 5.1–5.6).

    Captures the exact point of confusion, preserves all session data,
    and tracks resolution progress.
    """

    __tablename__ = "assistance_receipts"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=_uuid, index=True
    )
    session_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("form_sessions.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,   # one receipt per session
        index=True,
    )
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("user_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    office_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    form_type: Mapped[str] = mapped_column(String(100), nullable=False)

    # Free-text description of what triggered escalation
    escalation_reason: Mapped[str] = mapped_column(Text, nullable=False)

    # AI confidence score that was below the threshold
    confidence_score: Mapped[float] = mapped_column(nullable=False, default=0.0)

    # Snapshot of the session state at time of escalation (JSON)
    session_snapshot: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)

    # Assigned government officer details (set when in-review)
    assigned_officer: Mapped[str | None] = mapped_column(String(255), nullable=True)
    officer_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default=ReceiptStatus.PENDING.value, index=True
    )

    generated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now
    )
    resolved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # ── Relationships ────────────────────────────────────────────────────────
    session: Mapped["FormSession"] = relationship(  # type: ignore[name-defined]
        "FormSession", back_populates="assistance_receipt"
    )

    def __repr__(self) -> str:
        return f"<AssistanceReceipt id={self.id} status={self.status}>"
