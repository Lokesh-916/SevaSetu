"""
Pydantic schemas for UserProfile and UserAuthSession.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.enums import SupportedLanguage


class AccessibilityNeeds(BaseModel):
    screen_reader: bool = False
    large_text: bool = False
    high_contrast: bool = False
    audio_descriptions: bool = False


class UserProfileBase(BaseModel):
    email: EmailStr
    full_name: str | None = None
    preferred_language: SupportedLanguage = SupportedLanguage.ENGLISH
    accessibility_needs: AccessibilityNeeds = Field(default_factory=AccessibilityNeeds)


class UserProfileCreate(UserProfileBase):
    """Used when creating a new user (password comes from the auth schema)."""
    pass


class UserProfileUpdate(BaseModel):
    """All fields optional — PATCH semantics."""
    full_name: str | None = None
    preferred_language: SupportedLanguage | None = None
    accessibility_needs: AccessibilityNeeds | None = None


class UserProfileResponse(UserProfileBase):
    """Returned to the API caller — never includes password hash."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    is_active: bool
    created_at: datetime
    last_accessed: datetime


class UserAuthSessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    is_active: bool
    expires_at: datetime
    created_at: datetime
