"""
Pydantic schemas for FormTemplate, FormSession, and their nested types.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import FieldType, SessionStatus, SupportedLanguage


# ── Nested types (stored as JSON arrays in the DB) ───────────────────────────

class FormField(BaseModel):
    """Schema for a single field within a FormTemplate."""
    field_id: str
    field_name: str
    field_label: str                        # display label (may be localised later)
    field_type: FieldType = FieldType.TEXT
    is_required: bool = True
    validation_pattern: str | None = None   # regex pattern for client-side hint
    auto_fill_source: str | None = None     # e.g. "aadhaar.full_name"
    confirmation_required: bool = False
    help_text: str | None = None


class DocumentRequirement(BaseModel):
    doc_type: str
    description: str
    is_mandatory: bool = True
    alternatives: list[str] = Field(default_factory=list)


class ValidationRule(BaseModel):
    rule_id: str
    rule_type: str                          # e.g. "cross_field", "format", "date_range"
    fields_involved: list[str] = Field(default_factory=list)
    condition: str                          # plain-English or structured expression
    error_message: str


# ── FormFieldData (session answer) ───────────────────────────────────────────

class FormFieldData(BaseModel):
    """
    A citizen's answer to one FormField inside a FormSession.
    ``language`` records which language the UI was set to when the
    value was entered — used by Property 26 tests.
    """
    field_id: str
    field_name: str
    value: str = ""
    confirmed: bool = False
    language: SupportedLanguage = SupportedLanguage.ENGLISH


# ── FormTemplate schemas ──────────────────────────────────────────────────────

class FormTemplateBase(BaseModel):
    form_name: str
    form_code: str
    version: str = "1.0"
    description: str | None = None
    fields: list[FormField] = Field(default_factory=list)
    required_documents: list[DocumentRequirement] = Field(default_factory=list)
    validation_rules: list[ValidationRule] = Field(default_factory=list)


class FormTemplateCreate(FormTemplateBase):
    office_id: str


class FormTemplateResponse(FormTemplateBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    office_id: str
    is_active: bool
    last_updated: datetime
    created_at: datetime


# ── FormSession schemas ───────────────────────────────────────────────────────

class FormSessionCreate(BaseModel):
    template_id: str
    language: SupportedLanguage = SupportedLanguage.ENGLISH


class FormSessionUpdate(BaseModel):
    """PATCH – update answers or advance the step counter."""
    current_step: int | None = None
    status: SessionStatus | None = None
    form_data: list[FormFieldData] | None = None
    language: SupportedLanguage | None = None


class FormSessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    template_id: str
    office_type: str
    form_type: str
    language: str
    current_step: int
    status: str
    form_data: list[dict]
    created_at: datetime
    updated_at: datetime
