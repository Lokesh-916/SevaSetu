"""
Import all ORM models here so SQLAlchemy's metadata is fully populated
when Alembic calls ``Base.metadata.create_all()`` or ``autogenerate``.

Any new model file MUST be imported in this module.
"""

from app.models.document import Document  # noqa: F401
from app.models.enums import (  # noqa: F401
    DocumentType,
    FieldType,
    IssueSeverity,
    ReceiptStatus,
    RiskLevel,
    SessionStatus,
    SupportedLanguage,
    ValidationIssueType,
)
from app.models.form import FormSession, FormTemplate  # noqa: F401
from app.models.office import OfficeConfig  # noqa: F401
from app.models.receipt import AssistanceReceipt  # noqa: F401
from app.models.user import UserAuthSession, UserProfile  # noqa: F401

__all__ = [
    # Enums
    "DocumentType",
    "FieldType",
    "IssueSeverity",
    "ReceiptStatus",
    "RiskLevel",
    "SessionStatus",
    "SupportedLanguage",
    "ValidationIssueType",
    # ORM Models
    "UserProfile",
    "UserAuthSession",
    "OfficeConfig",
    "FormTemplate",
    "FormSession",
    "Document",
    "AssistanceReceipt",
]
