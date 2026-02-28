"""
Security utilities: password hashing (bcrypt) and JWT creation/verification.

Design decisions:
  - We use PyJWT (actively maintained) instead of python-jose.
  - Tokens are NOT stored raw; the UserAuthSession stores only the SHA-256
    hash of the token for breach-containment (Requirement 8.1).
  - Expiry is enforced at both the JWT level (exp claim) and the DB level
    (UserAuthSession.expires_at + is_active flag).
"""

import hashlib
from datetime import datetime, timedelta, timezone

import jwt
from passlib.context import CryptContext

from app.core.config import settings

# ── Password hashing ──────────────────────────────────────────────────────────
_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain_password: str) -> str:
    """Return a bcrypt hash of the given password."""
    return _pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Return True if *plain_password* matches *hashed_password*."""
    return _pwd_context.verify(plain_password, hashed_password)


# ── JWT ───────────────────────────────────────────────────────────────────────
ALGORITHM = "HS256"


def create_access_token(
    user_id: str,
    session_id: str,
    expires_delta: timedelta | None = None,
) -> tuple[str, datetime]:
    """
    Create a signed JWT access token.

    Returns:
        (token_str, expires_at_datetime)
    """
    if expires_delta is None:
        expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    expires_at = datetime.now(timezone.utc) + expires_delta

    payload = {
        "sub": user_id,
        "session_id": session_id,
        "exp": int(expires_at.timestamp()),
        "iat": int(datetime.now(timezone.utc).timestamp()),
    }
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)
    return token, expires_at


def decode_access_token(token: str) -> dict:
    """
    Decode and validate a JWT access token.

    Raises:
        jwt.ExpiredSignatureError  – token has expired
        jwt.InvalidTokenError      – token is malformed or signature is wrong
    """
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])


# ── Token hashing (for DB storage) ───────────────────────────────────────────

def hash_token(token: str) -> str:
    """Return the SHA-256 hex digest of a raw JWT string."""
    return hashlib.sha256(token.encode()).hexdigest()
