"""
Pydantic schemas for uploaded Documents and embedded ValidationResults.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import (
    DocumentType,
    IssueSeverity,
    RiskLevel,
    ValidationIssueType,
)


class ValidationIssue(BaseModel):
    """A single problem detected in a document."""
    issue_type: ValidationIssueType
    field_name: str
    description: str
    severity: IssueSeverity = IssueSeverity.ERROR
    suggested_fix: str | None = None


class ValidationResultEmbed(BaseModel):
    """The validation outcome embedded within a DocumentResponse."""
    is_valid: bool | None = None
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    risk_level: RiskLevel = RiskLevel.LOW
    validation_issues: list[ValidationIssue] = Field(default_factory=list)
    suggestions: list[str] = Field(default_factory=list)


class DocumentUpload(BaseModel):
    """Body for uploading a document (metadata only; file comes via multipart)."""
    document_type: DocumentType = DocumentType.OTHER


class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    session_id: str
    filename: str
    content_type: str
    file_size_bytes: int
    document_type: str
    extracted_text: str | None
    is_valid: bool | None
    confidence: float
    risk_level: str
    validation_issues: list[dict]
    suggestions: list[str]
    uploaded_at: datetime
    validated_at: datetime | None
