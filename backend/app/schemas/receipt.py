"""
Pydantic schemas for AssistanceReceipt (human escalation).
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import ReceiptStatus


class AssistanceReceiptCreate(BaseModel):
    """Created automatically when AI confidence drops below threshold."""
    session_id: str
    user_id: str
    office_id: str
    form_type: str
    escalation_reason: str
    confidence_score: float = Field(ge=0.0, le=1.0)
    session_snapshot: dict = Field(default_factory=dict)


class AssistanceReceiptUpdate(BaseModel):
    """Officer fills these in when reviewing."""
    assigned_officer: str | None = None
    officer_notes: str | None = None
    status: ReceiptStatus | None = None


class AssistanceReceiptResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    session_id: str
    user_id: str
    office_id: str
    form_type: str
    escalation_reason: str
    confidence_score: float
    session_snapshot: dict
    assigned_officer: str | None
    officer_notes: str | None
    status: str
    generated_at: datetime
    resolved_at: datetime | None
