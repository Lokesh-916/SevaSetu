from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.form import FormSession
from app.services.pdf_service import PDFService
from app.models.audit import AuditLog
import os

from app.core.database import get_db
from app.schemas.form import (
    FormTemplateCreate,
    FormTemplateResponse,
    FormSessionCreate,
    FormSessionResponse,
    FormFieldData
)
from app.services.form_service import FormService
from app.api.auth import get_current_user_dep
from app.models.user import UserProfile

router = APIRouter(prefix="/forms", tags=["Forms"])

# ── Templates ─────────────────────────────────────────────────────────────────

@router.post("/templates", response_model=FormTemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_template(template_in: FormTemplateCreate, db: AsyncSession = Depends(get_db)):
    """Create a new form template (Office Admin only)."""
    return await FormService.create_template(db, template_in)

@router.get("/templates", response_model=List[FormTemplateResponse])
async def list_templates(office_id: str = None, db: AsyncSession = Depends(get_db)):
    """List all active form templates."""
    return await FormService.list_templates(db, office_id)

@router.get("/templates/{template_id}", response_model=FormTemplateResponse)
async def get_template(template_id: str, db: AsyncSession = Depends(get_db)):
    """Get details of a specific form template."""
    template = await FormService.get_template(db, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template

# ── Sessions ──────────────────────────────────────────────────────────────────

@router.post("/sessions", response_model=FormSessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    session_in: FormSessionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user_dep)
):
    """Start a new form completion session for the current user."""
    return await FormService.create_session(db, str(current_user.id), session_in)

@router.get("/sessions/active", response_model=FormSessionResponse)
async def get_active_session(
    db: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user_dep)
):
    """Fetch the most recent active session for restoration."""
    session = await db.scalar(
        select(FormSession)
        .where(FormSession.user_id == current_user.id)
        .order_by(FormSession.created_at.desc())
        .limit(1)
    )
    if not session:
        raise HTTPException(status_code=404, detail="No active session found")
    return session

@router.get("/sessions/{session_id}", response_model=FormSessionResponse)
async def get_session(session_id: str, db: AsyncSession = Depends(get_db)):
    """Get the current state of a form session."""
    session = await FormService.get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@router.post("/sessions/{session_id}/auto-fill", response_model=FormSessionResponse)
async def auto_fill_session(
    session_id: str,
    extracted_data: Dict[str, Any],
    db: AsyncSession = Depends(get_db)
):
    """
    Submit data extracted via OCR/Aadhaar to auto-fill the form.
    Returns session with updated form_data and confirmation flags.
    """
    return await FormService.auto_fill_session(db, session_id, extracted_data)

@router.post("/sessions/{session_id}/confirm", response_model=FormSessionResponse)
async def confirm_fields(
    session_id: str,
    field_confirmations: Dict[str, bool],
    db: AsyncSession = Depends(get_db)
):
    """
    Confirm or reject auto-filled fields.
    If all required/critical fields are confirmed, session status moves to 'READY'.
    """
    return await FormService.confirm_fields(db, session_id, field_confirmations)

@router.get("/sessions/{session_id}/submission")
async def get_submission_materials(session_id: str, db: AsyncSession = Depends(get_db)):
    """Get submission instructions and checklist."""
    session = await db.scalar(select(FormSession).where(FormSession.id == session_id))
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {
        "instructions": {
            "location": "Room 204, Municipal Corporation Building",
            "timing": "Monday to Friday, 10:00 AM - 4:00 PM",
            "contact": "support@sevasetu.gov.in"
        },
        "checklist": [
            "Signed printout of the application form",
            "Original Aadhaar Card for verification",
            "Two recent passport size photographs"
        ],
        "pdf_url": f"/api/v1/forms/sessions/{session_id}/pdf"
    }

@router.get("/sessions/{session_id}/pdf")
async def download_form_pdf(session_id: str, db: AsyncSession = Depends(get_db), current_user: UserProfile = Depends(get_current_user_dep)):
    """Generate and download the populated PDF form."""
    session = await db.scalar(select(FormSession).where(FormSession.id == session_id))
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    form_data = {
        "title": "Municipal Service Application",
        "fields": [{"label": k, "value": v} for k, v in session.form_data.items() if isinstance(v, str)]
    }
    instructions = {
        "location": "Room 204, Municipal Corporation Building",
        "timing": "Monday to Friday, 10:00 AM - 4:00 PM",
        "contact": "support@sevasetu.gov.in"
    }
    checklist = [
        "Signed printout of the application form",
        "Original Aadhaar Card for verification",
        "Two recent passport size photographs"
    ]
    
    pdf_path = PDFService.generate_form_pdf(form_data, instructions, checklist)
    
    # Audit logging for download
    audit = AuditLog(
        user_id=current_user.id,
        action="DOWNLOAD_PDF",
        resource="FormSession",
        resource_id=session_id,
        details={"pdf_path": pdf_path}
    )
    db.add(audit)
    await db.commit()
    
    return FileResponse(
        path=pdf_path,
        filename=f"sevasetu_application_{session_id}.pdf",
        media_type="application/pdf"
    )
