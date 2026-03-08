"""
Central API router.
All sub-routers are registered here and then mounted on the FastAPI app.
"""

from fastapi import APIRouter

from app.api import auth, health, forms, documents, ai, rules

api_router = APIRouter()

# ── Health ────────────────────────────────────────────────────────────────────
api_router.include_router(health.router)

# ── Authentication ────────────────────────────────────────────────────────────
api_router.include_router(auth.router)

# ── Form Management (Task 3) ──────────────────────────────────────────────────
api_router.include_router(forms.router)

# ── Document & AI (Tasks 5 & 6) ───────────────────────────────────────────────
api_router.include_router(documents.router)
api_router.include_router(ai.router)

# ── Validation & Rule Engine (Task 7) ─────────────────────────────────────────
api_router.include_router(rules.router)
