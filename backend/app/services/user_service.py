"""
User Management Service for SevaSetu.

Responsibilities:
  - Register new users (hash password, persist UserProfile)
  - Authenticate users (verify password, issue JWT, store session hash in SQLite)
  - Retrieve and validate active sessions (替替 Redis replacement via UserAuthSession)
  - Update user preferences (language, accessibility)
  - Revoke sessions (logout)

All database interactions are async (SQLAlchemy 2.0 async engine).
"""

from datetime import datetime, timezone
from typing import Optional

import jwt
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.logging import get_logger
from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    hash_token,
    verify_password,
)
from app.models.user import UserAuthSession, UserProfile
from app.schemas.auth import TokenResponse
from app.schemas.user import (
    AccessibilityNeeds,
    UserProfileCreate,
    UserProfileResponse,
    UserProfileUpdate,
)

logger = get_logger(__name__)


class AuthenticationError(Exception):
    """Raised when credentials are invalid or session is expired/revoked."""


class UserNotFoundError(Exception):
    """Raised when a user cannot be located by the given identifier."""


class DuplicateEmailError(Exception):
    """Raised when a registration is attempted with an already-used email."""


# ── Registration ──────────────────────────────────────────────────────────────

async def register_user(
    db: AsyncSession,
    email: str,
    plain_password: str,
    full_name: Optional[str] = None,
    preferred_language: str = "en",
) -> UserProfile:
    """
    Create a new UserProfile.  Raises DuplicateEmailError if email exists.
    """
    # Check uniqueness
    existing = await db.scalar(
        select(UserProfile).where(UserProfile.email == email.lower().strip())
    )
    if existing:
        raise DuplicateEmailError(f"Email '{email}' is already registered.")

    user = UserProfile(
        email=email.lower().strip(),
        hashed_password=hash_password(plain_password),
        full_name=full_name,
        preferred_language=preferred_language,
        accessibility_needs={},
    )
    db.add(user)
    await db.flush()   # get generated id without committing
    logger.info("New user registered", extra={"user_id": user.id, "email": user.email})
    return user


# ── Authentication (Login) ────────────────────────────────────────────────────

async def authenticate_user(
    db: AsyncSession,
    email: str,
    plain_password: str,
    user_agent: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> TokenResponse:
    """
    Verify credentials and issue a JWT access token.
    The token hash is persisted in UserAuthSession (SQLite replaces Redis).
    """
    user = await db.scalar(
        select(UserProfile).where(
            UserProfile.email == email.lower().strip(),
            UserProfile.is_active.is_(True),
        )
    )
    if not user or not verify_password(plain_password, user.hashed_password):
        raise AuthenticationError("Invalid email or password.")

    # Create JWT
    # We need a placeholder session_id; create the DB row first, then update
    # Actually: create the session row first with a dummy token_hash, then update.
    session_row = UserAuthSession(
        user_id=user.id,
        token_hash="__pending__",          # replaced below
        is_active=True,
        expires_at=datetime.now(timezone.utc),  # replaced below
        user_agent=user_agent,
        ip_address=ip_address,
    )
    db.add(session_row)
    await db.flush()   # get session_row.id

    token, expires_at = create_access_token(
        user_id=user.id,
        session_id=session_row.id,
    )

    # Update the session row with real values and flush again so the
    # SELECT in get_current_user (same transaction) sees the real hash.
    session_row.token_hash = hash_token(token)
    session_row.expires_at = expires_at
    await db.flush()

    # Update last_accessed on the user profile
    await db.execute(
        update(UserProfile)
        .where(UserProfile.id == user.id)
        .values(last_accessed=datetime.now(timezone.utc))
    )

    logger.info("User authenticated", extra={"user_id": user.id, "session_id": session_row.id})

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


# ── Session Validation ────────────────────────────────────────────────────────

async def get_current_user(
    db: AsyncSession,
    token: str,
) -> UserProfile:
    """
    Validate a JWT token and return the associated UserProfile.

    Checks (in order):
      1. JWT signature & expiry (handled by decode_access_token)
      2. Session exists in DB and is_active=True (not logged out)
      3. Session has not passed expires_at in the DB
      4. User is still active (not deactivated)
    """
    try:
        payload = decode_access_token(token)
    except jwt.ExpiredSignatureError as exc:
        raise AuthenticationError("Token has expired.") from exc
    except jwt.InvalidTokenError as exc:
        raise AuthenticationError("Invalid token.") from exc

    session_id: str = payload.get("session_id", "")
    user_id: str = payload.get("sub", "")
    token_hash = hash_token(token)

    session_row = await db.scalar(
        select(UserAuthSession).where(
            UserAuthSession.id == session_id,
            UserAuthSession.token_hash == token_hash,
            UserAuthSession.is_active.is_(True),
        )
    )
    if not session_row:
        raise AuthenticationError("Session not found or has been revoked.")

    # SQLite may return a naive datetime; normalise to UTC before comparing.
    exp = session_row.expires_at
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if exp < datetime.now(timezone.utc):
        raise AuthenticationError("Session has expired.")

    user = await db.scalar(
        select(UserProfile).where(
            UserProfile.id == user_id,
            UserProfile.is_active.is_(True),
        )
    )
    if not user:
        raise AuthenticationError("User account is inactive or deleted.")

    return user


# ── Session Revocation (Logout) ───────────────────────────────────────────────

async def revoke_session(db: AsyncSession, token: str) -> bool:
    """
    Invalidate a specific token (logout from current device).
    Returns True if a session was actually revoked.
    """
    token_hash = hash_token(token)
    result = await db.execute(
        update(UserAuthSession)
        .where(
            UserAuthSession.token_hash == token_hash,
            UserAuthSession.is_active.is_(True),
        )
        .values(is_active=False)
    )
    revoked = result.rowcount > 0
    if revoked:
        logger.info("Session revoked", extra={"token_hash": token_hash[:8] + "..."})
    return revoked


async def revoke_all_sessions(db: AsyncSession, user_id: str) -> int:
    """
    Invalidate ALL active sessions for a user (logout from all devices).
    Returns the number of sessions revoked.
    """
    result = await db.execute(
        update(UserAuthSession)
        .where(
            UserAuthSession.user_id == user_id,
            UserAuthSession.is_active.is_(True),
        )
        .values(is_active=False)
    )
    count = result.rowcount
    logger.info("All sessions revoked", extra={"user_id": user_id, "count": count})
    return count


# ── User retrieval ────────────────────────────────────────────────────────────

async def get_user_by_id(db: AsyncSession, user_id: str) -> UserProfile:
    """Fetch a UserProfile by primary key. Raises UserNotFoundError if missing."""
    user = await db.scalar(
        select(UserProfile).where(UserProfile.id == user_id)
    )
    if not user:
        raise UserNotFoundError(f"User '{user_id}' not found.")
    return user


async def get_user_by_email(db: AsyncSession, email: str) -> UserProfile:
    """Fetch a UserProfile by email. Raises UserNotFoundError if missing."""
    user = await db.scalar(
        select(UserProfile).where(UserProfile.email == email.lower().strip())
    )
    if not user:
        raise UserNotFoundError(f"No user with email '{email}'.")
    return user


# ── Preference management ─────────────────────────────────────────────────────

async def update_user_preferences(
    db: AsyncSession,
    user_id: str,
    updates: UserProfileUpdate,
) -> UserProfile:
    """
    Apply PATCH-style updates to a user's stored preferences.
    Returns the refreshed UserProfile.
    """
    user = await get_user_by_id(db, user_id)

    update_data = updates.model_dump(exclude_none=True)

    if "preferred_language" in update_data:
        lang = update_data["preferred_language"]
        user.preferred_language = lang.value if hasattr(lang, "value") else lang

    if "full_name" in update_data:
        user.full_name = update_data["full_name"]

    if "accessibility_needs" in update_data:
        needs = update_data["accessibility_needs"]
        if isinstance(needs, AccessibilityNeeds):
            user.accessibility_needs = needs.model_dump()
        else:
            user.accessibility_needs = needs   # already a dict

    await db.flush()
    logger.info("User preferences updated", extra={"user_id": user_id, "fields": list(update_data.keys())})
    return user


# ── Active session listing ────────────────────────────────────────────────────

async def list_active_sessions(
    db: AsyncSession, user_id: str
) -> list[UserAuthSession]:
    """Return all non-expired, active sessions for a user."""
    rows = await db.scalars(
        select(UserAuthSession).where(
            UserAuthSession.user_id == user_id,
            UserAuthSession.is_active.is_(True),
            UserAuthSession.expires_at > datetime.now(timezone.utc),
        )
    )
    return list(rows)
