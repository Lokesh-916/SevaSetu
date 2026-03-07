"""
Application configuration using Pydantic Settings.
Loads values from environment variables or .env file with sensible defaults.
"""

from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """SevaSetu application settings."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Application ─────────────────────────────────────────────────────────
    APP_NAME: str = "SevaSetu"
    APP_VERSION: str = "0.1.0"
    APP_DESCRIPTION: str = (
        "AI-powered Government Form Assistant – "
        "preventing form rejections before submission."
    )
    DEBUG: bool = True
    ENVIRONMENT: str = "development"  # development | staging | production

    # ── API ──────────────────────────────────────────────────────────────────
    API_PREFIX: str = "/api/v1"
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",   # React dev server
        "http://127.0.0.1:3000",
    ]

    # ── Database (SQLite for local dev) ──────────────────────────────────────
    DATABASE_URL: str = "sqlite+aiosqlite:///./sevasetu.db"
    # Set to True to echo raw SQL to the console (useful during dev)
    DB_ECHO: bool = False

    # ── Security ─────────────────────────────────────────────────────────────
    SECRET_KEY: str = "change-me-in-production-use-a-long-random-string"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # ── Logging ──────────────────────────────────────────────────────────────
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"  # json | text

    # ── AI / LLM (Groq) ──────────────────────────────────────────────────────
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings singleton."""
    return Settings()


# Convenience export used throughout the app
settings = get_settings()
