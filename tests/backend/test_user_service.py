"""
Unit tests for the User Management Service.

Tests cover:
  - User registration (success + duplicate email)
  - Authentication (success + wrong password)
  - JWT session creation and persistence in SQLite
  - Session validation via get_current_user
  - Session revocation (single + all)
  - User preference updates (language, accessibility)
  - list_active_sessions behaviour
"""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import SupportedLanguage
from app.models.user import UserAuthSession, UserProfile
from app.schemas.user import AccessibilityNeeds, UserProfileUpdate
from app.services.user_service import (
    AuthenticationError,
    DuplicateEmailError,
    UserNotFoundError,
    authenticate_user,
    get_current_user,
    get_user_by_id,
    list_active_sessions,
    register_user,
    revoke_all_sessions,
    revoke_session,
    update_user_preferences,
)


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _register(db: AsyncSession, email: str = "citizen@example.com") -> UserProfile:
    """Convenience wrapper to register a test user."""
    return await register_user(
        db,
        email=email,
        plain_password="SecurePass123!",
        full_name="Test Citizen",
        preferred_language="en",
    )


# ── Registration ──────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_register_user_success(db_session: AsyncSession):
    user = await _register(db_session)
    assert user.id is not None
    assert user.email == "citizen@example.com"
    assert user.full_name == "Test Citizen"
    assert user.preferred_language == "en"
    assert user.is_active is True
    # Password must be hashed
    assert user.hashed_password != "SecurePass123!"


@pytest.mark.asyncio
async def test_register_duplicate_email_raises(db_session: AsyncSession):
    await _register(db_session, email="dup@example.com")
    with pytest.raises(DuplicateEmailError):
        await _register(db_session, email="dup@example.com")


@pytest.mark.asyncio
async def test_register_normalises_email(db_session: AsyncSession):
    """Email should be lowercased and stripped."""
    user = await register_user(
        db_session, email="  UPPER@Example.COM  ", plain_password="Pass1234!"
    )
    assert user.email == "upper@example.com"


# ── Authentication ────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_login_success(db_session: AsyncSession):
    await _register(db_session, email="login@example.com")
    token_resp = await authenticate_user(db_session, "login@example.com", "SecurePass123!")
    assert token_resp.access_token
    assert token_resp.token_type == "bearer"
    assert token_resp.expires_in > 0


@pytest.mark.asyncio
async def test_login_wrong_password_raises(db_session: AsyncSession):
    await _register(db_session, email="badpass@example.com")
    with pytest.raises(AuthenticationError):
        await authenticate_user(db_session, "badpass@example.com", "WrongPass!")


@pytest.mark.asyncio
async def test_login_nonexistent_user_raises(db_session: AsyncSession):
    with pytest.raises(AuthenticationError):
        await authenticate_user(db_session, "nobody@example.com", "AnyPass!")


# ── Session Persistence ───────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_session_stored_in_sqlite(db_session: AsyncSession):
    """After login, a UserAuthSession row must exist in the DB."""
    await _register(db_session, email="sess@example.com")
    await authenticate_user(db_session, "sess@example.com", "SecurePass123!")
    # Flush to ensure the row is queryable
    await db_session.flush()
    from sqlalchemy import select
    sessions = await db_session.scalars(select(UserAuthSession))
    assert any(True for _ in sessions)


@pytest.mark.asyncio
async def test_get_current_user_returns_correct_user(db_session: AsyncSession):
    await _register(db_session, email="curr@example.com")
    token_resp = await authenticate_user(db_session, "curr@example.com", "SecurePass123!")
    user = await get_current_user(db_session, token_resp.access_token)
    assert user.email == "curr@example.com"


@pytest.mark.asyncio
async def test_get_current_user_invalid_token_raises(db_session: AsyncSession):
    with pytest.raises(AuthenticationError):
        await get_current_user(db_session, "not.a.valid.token")


# ── Session Revocation ────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_revoke_session_prevents_reuse(db_session: AsyncSession):
    await _register(db_session, email="revoke@example.com")
    token_resp = await authenticate_user(db_session, "revoke@example.com", "SecurePass123!")
    token = token_resp.access_token

    revoked = await revoke_session(db_session, token)
    assert revoked is True

    # Token should now be rejected
    with pytest.raises(AuthenticationError):
        await get_current_user(db_session, token)


@pytest.mark.asyncio
async def test_revoke_all_sessions(db_session: AsyncSession):
    await _register(db_session, email="all_revoke@example.com")
    # Create two separate sessions
    r1 = await authenticate_user(db_session, "all_revoke@example.com", "SecurePass123!")
    r2 = await authenticate_user(db_session, "all_revoke@example.com", "SecurePass123!")

    from sqlalchemy import select
    user = await db_session.scalar(
        select(UserProfile).where(UserProfile.email == "all_revoke@example.com")
    )
    count = await revoke_all_sessions(db_session, user.id)
    assert count == 2

    with pytest.raises(AuthenticationError):
        await get_current_user(db_session, r1.access_token)
    with pytest.raises(AuthenticationError):
        await get_current_user(db_session, r2.access_token)


# ── User Preferences ──────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_update_language_preference(db_session: AsyncSession):
    user = await _register(db_session, email="lang@example.com")
    assert user.preferred_language == "en"

    updated = await update_user_preferences(
        db_session,
        user.id,
        UserProfileUpdate(preferred_language=SupportedLanguage.HINDI),
    )
    assert updated.preferred_language == "hi"


@pytest.mark.asyncio
async def test_update_accessibility_needs(db_session: AsyncSession):
    user = await _register(db_session, email="a11y@example.com")
    needs = AccessibilityNeeds(screen_reader=True, large_text=True)
    updated = await update_user_preferences(
        db_session,
        user.id,
        UserProfileUpdate(accessibility_needs=needs),
    )
    assert updated.accessibility_needs["screen_reader"] is True
    assert updated.accessibility_needs["large_text"] is True


@pytest.mark.asyncio
async def test_update_nonexistent_user_raises(db_session: AsyncSession):
    with pytest.raises(UserNotFoundError):
        await update_user_preferences(
            db_session,
            "00000000-0000-0000-0000-000000000000",
            UserProfileUpdate(full_name="Ghost"),
        )


# ── list_active_sessions ──────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_list_active_sessions(db_session: AsyncSession):
    await _register(db_session, email="listsess@example.com")
    await authenticate_user(db_session, "listsess@example.com", "SecurePass123!")
    await authenticate_user(db_session, "listsess@example.com", "SecurePass123!")

    from sqlalchemy import select
    user = await db_session.scalar(
        select(UserProfile).where(UserProfile.email == "listsess@example.com")
    )
    sessions = await list_active_sessions(db_session, user.id)
    assert len(sessions) == 2
    assert all(s.is_active for s in sessions)


@pytest.mark.asyncio
async def test_get_user_by_id_success(db_session: AsyncSession):
    created = await _register(db_session, email="byid@example.com")
    fetched = await get_user_by_id(db_session, created.id)
    assert fetched.id == created.id


@pytest.mark.asyncio
async def test_get_user_by_id_missing_raises(db_session: AsyncSession):
    with pytest.raises(UserNotFoundError):
        await get_user_by_id(db_session, "nonexistent-uuid")
