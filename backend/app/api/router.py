"""
Central API router.
All sub-routers are registered here and then mounted on the FastAPI app.
"""

from fastapi import APIRouter

from app.api import auth, health

api_router = APIRouter()

# ── Health ────────────────────────────────────────────────────────────────────
api_router.include_router(health.router)

# ── Authentication ────────────────────────────────────────────────────────────
api_router.include_router(auth.router)

# ── Future routers (Task 3+) will be registered here ─────────────────────────
# api_router.include_router(forms.router)
# api_router.include_router(sessions.router)
# api_router.include_router(documents.router)
# api_router.include_router(ai.router)
