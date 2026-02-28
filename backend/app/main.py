"""
SevaSetu – FastAPI application entry point.

Start with:
    uvicorn app.main:app --reload --port 8000
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import settings
from app.core.database import close_db, init_db
from app.core.logging import get_logger, setup_logging

# Logging must be set up before anything else logs
setup_logging()
logger = get_logger(__name__)


# ── Lifespan (replaces deprecated on_event) ───────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Run startup tasks before yielding, then teardown tasks on shutdown."""
    logger.info("Starting SevaSetu backend", extra={"version": settings.APP_VERSION})
    await init_db()
    yield
    logger.info("Shutting down SevaSetu backend")
    await close_db()


# ── Application factory ───────────────────────────────────────────────────────
def create_app() -> FastAPI:
    application = FastAPI(
        title=settings.APP_NAME,
        description=settings.APP_DESCRIPTION,
        version=settings.APP_VERSION,
        docs_url="/docs",          # Swagger UI
        redoc_url="/redoc",        # ReDoc
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # ── CORS ──────────────────────────────────────────────────────────────────
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Routers ───────────────────────────────────────────────────────────────
    application.include_router(api_router, prefix=settings.API_PREFIX)

    return application


app = create_app()
