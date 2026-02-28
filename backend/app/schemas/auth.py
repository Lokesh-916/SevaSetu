"""
Pydantic schemas for auth (register, login, token).
These are request/response bodies — not stored in the DB.
"""

from pydantic import BaseModel, EmailStr, Field


class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str | None = Field(default=None, max_length=255)
    preferred_language: str = Field(default="en", max_length=10)


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


class TokenPayload(BaseModel):
    """The decoded claims inside a JWT access token."""
    sub: str          # user_id
    session_id: str   # UserAuthSession.id
    exp: int          # unix timestamp
