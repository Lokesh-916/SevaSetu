"""
SQLAlchemy ORM models for user identity, authentication sessions,
and stored preferences.

Tables created:
  - user_profiles
  - user_auth_sessions   ← replaces Redis for JWT session persistence
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.core.database import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _uuid() -> str:
    return str(uuid.uuid4())


class UserProfile(Base):
    """
    Represents a registered citizen using SevaSetu.

    ``preferred_language`` holds a SupportedLanguage enum VALUE (e.g. "hi").
    ``accessibility_needs`` is stored as a JSON blob for forward-compatibility.
    """

    __tablename__ = "user_profiles"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=_uuid, index=True
    )
    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    preferred_language: Mapped[str] = mapped_column(
        String(10), nullable=False, default="en"
    )
    # JSON blob: {"screen_reader": bool, "large_text": bool, "high_contrast": bool}
    accessibility_needs: Mapped[dict] = mapped_column(
        JSON, nullable=False, default=dict
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now
    )
    last_accessed: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now, onupdate=_now
    )

    # ── Relationships ────────────────────────────────────────────────────────
    auth_sessions: Mapped[list["UserAuthSession"]] = relationship(
        "UserAuthSession", back_populates="user", cascade="all, delete-orphan"
    )
    form_sessions: Mapped[list["FormSession"]] = relationship(  # type: ignore[name-defined]
        "FormSession", back_populates="user", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<UserProfile id={self.id} email={self.email}>"


class UserAuthSession(Base):
    """
    Persists issued JWT tokens in SQLite so we can:
      - validate tokens are not revoked (logout support)
      - enforce single-device or multi-device policies later
      - replace Redis entirely for session management

    We store the *token hash* (SHA-256), not the raw token,
    to limit exposure if the database is ever read by an attacker.
    """

    __tablename__ = "user_auth_sessions"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=_uuid, index=True
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("user_profiles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    # SHA-256 hex digest of the raw JWT string
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now
    )
    # Optional: track user agent / IP for audit (Requirement 8.6)
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)

    # ── Relationships ────────────────────────────────────────────────────────
    user: Mapped["UserProfile"] = relationship(
        "UserProfile", back_populates="auth_sessions"
    )

    def __repr__(self) -> str:
        return f"<UserAuthSession id={self.id} user_id={self.user_id} active={self.is_active}>"
