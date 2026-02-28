"""
Pydantic schemas for OfficeConfig.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import SupportedLanguage


class ProcessingRule(BaseModel):
    rule_id: str
    rule_type: str
    description: str
    condition: dict = Field(default_factory=dict)
    action: dict = Field(default_factory=dict)


class ContactInfo(BaseModel):
    phone: str | None = None
    email: str | None = None
    address: str | None = None
    website: str | None = None


class OperatingHours(BaseModel):
    days: list[str] = Field(default_factory=list)   # e.g. ["Mon","Tue","Wed","Thu","Fri"]
    open_time: str = "09:00"
    close_time: str = "17:00"
    timezone: str = "Asia/Kolkata"


class OfficeConfigBase(BaseModel):
    office_name: str
    office_code: str
    department: str | None = None
    state: str | None = None
    escalation_threshold: float = Field(default=0.75, ge=0.0, le=1.0)
    supported_languages: list[SupportedLanguage] = Field(
        default_factory=lambda: [SupportedLanguage.ENGLISH]
    )
    processing_rules: list[ProcessingRule] = Field(default_factory=list)
    contact_info: ContactInfo = Field(default_factory=ContactInfo)
    operating_hours: OperatingHours = Field(default_factory=OperatingHours)


class OfficeConfigCreate(OfficeConfigBase):
    pass


class OfficeConfigUpdate(BaseModel):
    """PATCH semantics — all fields optional."""
    office_name: str | None = None
    escalation_threshold: float | None = Field(default=None, ge=0.0, le=1.0)
    supported_languages: list[SupportedLanguage] | None = None
    processing_rules: list[ProcessingRule] | None = None
    contact_info: ContactInfo | None = None
    operating_hours: OperatingHours | None = None
    is_active: bool | None = None


class OfficeConfigResponse(OfficeConfigBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
