"""
Shared enumerations for SevaSetu.

All enums inherit from ``str`` so they serialise cleanly in JSON responses
and can be stored as VARCHAR in SQLite without a custom TypeDecorator.
"""

import enum


class DocumentType(str, enum.Enum):
    AADHAAR = "aadhaar"
    PAN_CARD = "pan_card"
    PASSPORT = "passport"
    VOTER_ID = "voter_id"
    DRIVING_LICENSE = "driving_license"
    BIRTH_CERTIFICATE = "birth_certificate"
    INCOME_CERTIFICATE = "income_certificate"
    CASTE_CERTIFICATE = "caste_certificate"
    RESIDENCE_PROOF = "residence_proof"
    OTHER = "other"


class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"


class ActionType(str, enum.Enum):
    VIEW = "view"
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    LOGIN = "login"
    LOGOUT = "logout"
    DOWNLOAD = "download"


class ValidationIssueType(str, enum.Enum):
    MISSING_FIELD = "missing_field"
    FORMAT_ERROR = "format_error"
    DATE_EXPIRED = "date_expired"
    NAME_MISMATCH = "name_mismatch"
    ADDRESS_MISMATCH = "address_mismatch"
    DOCUMENT_UNCLEAR = "document_unclear"
    AUTHENTICITY_FAILED = "authenticity_failed"


class IssueSeverity(str, enum.Enum):
    ERROR = "error"
    WARNING = "warning"


class RiskLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class SessionStatus(str, enum.Enum):
    IN_PROGRESS = "in_progress"
    READY = "ready"
    ESCALATED = "escalated"
    COMPLETED = "completed"


class ReceiptStatus(str, enum.Enum):
    PENDING = "pending"
    IN_REVIEW = "in_review"
    RESOLVED = "resolved"


class SupportedLanguage(str, enum.Enum):
    """ISO 639-1 language codes supported by SevaSetu."""
    ENGLISH = "en"
    HINDI = "hi"
    TAMIL = "ta"
    TELUGU = "te"
    KANNADA = "kn"
    MALAYALAM = "ml"
    BENGALI = "bn"
    MARATHI = "mr"
    GUJARATI = "gu"
    PUNJABI = "pa"
    ODIA = "or"


class FieldType(str, enum.Enum):
    TEXT = "text"
    NUMBER = "number"
    DATE = "date"
    SELECT = "select"
    CHECKBOX = "checkbox"
    FILE = "file"
