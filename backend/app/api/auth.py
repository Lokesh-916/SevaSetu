"""
Authentication endpoints.

POST /api/v1/auth/register  – create account
POST /api/v1/auth/login     – get JWT
POST /api/v1/auth/logout    – revoke current session
GET  /api/v1/auth/me        – get current user profile
PATCH /api/v1/auth/me       – update preferences
GET  /api/v1/auth/sessions  – list active sessions
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.logging import get_logger
from app.schemas.auth import TokenResponse, UserLoginRequest, UserRegisterRequest
from app.schemas.user import UserAuthSessionResponse, UserProfileResponse, UserProfileUpdate
from app.services import user_service
from app.services.user_service import (
    AuthenticationError,
    DuplicateEmailError,
    UserNotFoundError,
)

logger = get_logger(__name__)
router = APIRouter(prefix="/auth", tags=["Authentication"])
_bearer = HTTPBearer()


# ── Dependency: extract + validate Bearer token ───────────────────────────────

async def get_current_user_dep(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await user_service.get_current_user(db, credentials.credentials)
    except AuthenticationError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.post(
    "/register",
    response_model=UserProfileResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new citizen account",
)
async def register(body: UserRegisterRequest, db: AsyncSession = Depends(get_db)):
    try:
        user = await user_service.register_user(
            db,
            email=body.email,
            plain_password=body.password,
            full_name=body.full_name,
            preferred_language=body.preferred_language,
        )
        return UserProfileResponse.model_validate(user)
    except DuplicateEmailError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login and receive a JWT access token",
)
async def login(body: UserLoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    try:
        token_resp = await user_service.authenticate_user(
            db,
            email=body.email,
            plain_password=body.password,
            user_agent=request.headers.get("User-Agent"),
            ip_address=request.client.host if request.client else None,
        )
        return token_resp
    except AuthenticationError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Revoke the current session (logout)",
)
async def logout(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    db: AsyncSession = Depends(get_db),
):
    await user_service.revoke_session(db, credentials.credentials)


@router.get(
    "/me",
    response_model=UserProfileResponse,
    summary="Get the currently authenticated user",
)
async def get_me(current_user=Depends(get_current_user_dep)):
    return UserProfileResponse.model_validate(current_user)


@router.patch(
    "/me",
    response_model=UserProfileResponse,
    summary="Update language preference or accessibility settings",
)
async def update_me(
    body: UserProfileUpdate,
    current_user=Depends(get_current_user_dep),
    db: AsyncSession = Depends(get_db),
):
    updated = await user_service.update_user_preferences(db, current_user.id, body)
    return UserProfileResponse.model_validate(updated)


@router.get(
    "/sessions",
    response_model=list[UserAuthSessionResponse],
    summary="List all active sessions for the current user",
)
async def list_sessions(
    current_user=Depends(get_current_user_dep),
    db: AsyncSession = Depends(get_db),
):
    sessions = await user_service.list_active_sessions(db, current_user.id)
    return [UserAuthSessionResponse.model_validate(s) for s in sessions]
