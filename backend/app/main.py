"""
SevaSetu – FastAPI application entry point.

Start with:
    uvicorn app.main:app --reload --port 8000
"""

import traceback
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
import time

from app.api.router import api_router
from app.core.config import settings
from app.core.database import close_db, init_db
from app.core.logging import get_logger, setup_logging
from app.tasks.retention import start_retention_task

# Logging must be set up before anything else logs
setup_logging()
logger = get_logger(__name__)


# ── Lifespan (replaces deprecated on_event) ───────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Run startup tasks before yielding, then teardown tasks on shutdown."""
    logger.info("Starting SevaSetu backend", extra={"version": settings.APP_VERSION})
    await init_db()
    
    # Start retention task
    await start_retention_task()
    
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

    @application.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        logger.error(f"Validation Error Handled: {exc}")
        errors = exc.errors()
        user_msg = "Invalid input detected. Please check the highlighted fields."
        return JSONResponse(
            status_code=422,
            content={"detail": user_msg, "errors": errors},
        )
    
    @application.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.error(f"Global Error Handled: {exc}\n{traceback.format_exc()}")
        return JSONResponse(
            status_code=500,
            content={"detail": "An internal server error occurred. Our team has been notified. Please try again later.", "message": str(exc)},
        )

    # ── Middleware for Performance Monitoring ─────────────────────────────────
    @application.middleware("http")
    async def add_process_time_header(request: Request, call_next):
        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = str(process_time)
        if process_time > 3.0:
            logger.warning(f"Performance target missed: {request.url.path} took {process_time:.2f}s")
        return response

    return application


app = create_app()
