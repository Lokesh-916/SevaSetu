"""
Structured logging configuration for SevaSetu.
Outputs JSON lines in production and coloured text in development.
"""

import logging
import sys
from typing import Any

from app.core.config import settings


class _JsonFormatter(logging.Formatter):
    """Minimal JSON-lines formatter (avoids extra deps in early phases)."""

    def format(self, record: logging.LogRecord) -> str:
        import json
        import traceback

        payload: dict[str, Any] = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        if record.exc_info:
            payload["exception"] = traceback.format_exception(*record.exc_info)

        # Attach any extra keys passed via logger.info("msg", extra={...})
        standard_keys = {
            "args", "asctime", "created", "exc_info", "exc_text", "filename",
            "funcName", "levelname", "levelno", "lineno", "message", "module",
            "msecs", "msg", "name", "pathname", "process", "processName",
            "relativeCreated", "stack_info", "thread", "threadName",
        }
        for key, value in record.__dict__.items():
            if key not in standard_keys:
                payload[key] = value

        return json.dumps(payload, default=str, ensure_ascii=False)


class _TextFormatter(logging.Formatter):
    """Human-readable coloured formatter for local development."""

    COLOURS = {
        "DEBUG": "\033[36m",     # cyan
        "INFO": "\033[32m",      # green
        "WARNING": "\033[33m",   # yellow
        "ERROR": "\033[31m",     # red
        "CRITICAL": "\033[35m",  # magenta
    }
    RESET = "\033[0m"

    def format(self, record: logging.LogRecord) -> str:
        colour = self.COLOURS.get(record.levelname, "")
        formatted = super().format(record)
        return f"{colour}{formatted}{self.RESET}"


def setup_logging() -> None:
    """
    Configure the root logger once at application startup.
    Call this from main.py before anything else.
    """
    level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

    handler = logging.StreamHandler(sys.stdout)

    if settings.LOG_FORMAT == "json":
        handler.setFormatter(_JsonFormatter())
    else:
        handler.setFormatter(
            _TextFormatter(
                fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
                datefmt="%Y-%m-%d %H:%M:%S",
            )
        )

    # Replace any existing handlers on the root logger
    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(level)

    # Suppress noisy third-party loggers
    for noisy in ("uvicorn.access", "sqlalchemy.engine"):
        logging.getLogger(noisy).setLevel(logging.WARNING)

    logging.getLogger(__name__).info(
        "Logging initialised",
        extra={"level": settings.LOG_LEVEL, "format": settings.LOG_FORMAT},
    )


def get_logger(name: str) -> logging.Logger:
    """Return a named logger – thin wrapper kept for convenience."""
    return logging.getLogger(name)
