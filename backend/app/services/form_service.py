"""
Service for managing form templates and form sessions.
Handles auto-filling, validation, and confirmation workflows.
"""

from typing import Any, Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status

from app.models.form import FormTemplate, FormSession
from app.models.office import OfficeConfig
from app.schemas.form import (
    FormTemplateCreate,
    FormSessionCreate,
    FormSessionUpdate,
    FormFieldData
)
from app.models.enums import SessionStatus

class FormService:
    @staticmethod
    async def create_template(db: AsyncSession, template_in: FormTemplateCreate) -> FormTemplate:
        # Check if office exists
        stmt = select(OfficeConfig).where(OfficeConfig.id == template_in.office_id)
        result = await db.execute(stmt)
        office = result.scalar_one_or_none()
        if not office:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Office with ID {template_in.office_id} not found"
            )

        # Convert fields/docs/rules to dicts for JSON storage
        fields = [f.model_dump() for f in template_in.fields]
        required_documents = [d.model_dump() for d in template_in.required_documents]
        validation_rules = [r.model_dump() for r in template_in.validation_rules]

        template = FormTemplate(
            office_id=template_in.office_id,
            form_name=template_in.form_name,
            form_code=template_in.form_code,
            version=template_in.version,
            description=template_in.description,
            fields=fields,
            required_documents=required_documents,
            validation_rules=validation_rules
        )
        db.add(template)
        await db.commit()
        await db.refresh(template)
        return template

    @staticmethod
    async def get_template(db: AsyncSession, template_id: str) -> Optional[FormTemplate]:
        stmt = select(FormTemplate).where(FormTemplate.id == template_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def list_templates(db: AsyncSession, office_id: Optional[str] = None) -> List[FormTemplate]:
        stmt = select(FormTemplate)
        if office_id:
            stmt = stmt.where(FormTemplate.office_id == office_id)
        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def create_session(db: AsyncSession, user_id: str, session_in: FormSessionCreate) -> FormSession:
        template = await FormService.get_template(db, session_in.template_id)
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Template with ID {session_in.template_id} not found"
            )

        # Initialize form data from template fields
        form_data = []
        for field in template.fields:
            form_data.append({
                "field_id": field["field_id"],
                "field_name": field["field_name"],
                "value": "",
                "confirmed": False,
                "language": session_in.language.value
            })

        # Get office type and form type from template
        # Need to ensure office is loaded or use office_id
        # The relationship might need loading if not joined
        office_stmt = select(OfficeConfig).where(OfficeConfig.id == template.office_id)
        office_result = await db.execute(office_stmt)
        office = office_result.scalar_one_or_none()
        
        office_type = office.office_code if office else "UNKNOWN"
        form_type = template.form_code

        session = FormSession(
            user_id=user_id,
            template_id=template.id,
            office_type=office_type,
            form_type=form_type,
            language=session_in.language.value,
            form_data=form_data,
            status=SessionStatus.IN_PROGRESS.value
        )
        db.add(session)
        await db.commit()
        await db.refresh(session)
        return session

    @staticmethod
    async def get_session(db: AsyncSession, session_id: str) -> Optional[FormSession]:
        stmt = select(FormSession).where(FormSession.id == session_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def auto_fill_session(db: AsyncSession, session_id: str, extracted_data: Dict[str, Any]) -> FormSession:
        """
        Maps extracted data to form fields.
        Identifies critical fields and requires confirmation.
        """
        stmt = select(FormSession).where(FormSession.id == session_id)
        result = await db.execute(stmt)
        session = result.scalar_one_or_none()
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Session with ID {session_id} not found"
            )

        # Fetch template to get auto_fill_source and fields config
        template = await FormService.get_template(db, session.template_id)
        current_data = session.form_data

        # Define critical field identifiers (substring match)
        CRITICAL_KEYWORDS = ["name", "address", "purpose"]

        new_data = []
        # requires_pause = False # UI logic flag (implicitly handled by confirmed=False)

        for field_state in current_data:
            field_id = field_state["field_id"]
            field_name = field_state["field_name"].lower()
            
            # Find template field config
            template_field = next((f for f in template.fields if f["field_id"] == field_id), None)
            source_key = template_field.get("auto_fill_source") if template_field else None
            
            # 1. Direct mapping if auto_fill_source matches extracted_data keys
            # 2. Heuristic mapping if field_name or field_id matches keys
            value = (extracted_data.get(source_key) 
                     if source_key else None) or extracted_data.get(field_id) or extracted_data.get(field_state["field_name"])
            
            if value is not None:
                field_state["value"] = str(value)
                
                # Check if this is a critical field
                is_critical = any(keyword in field_name for keyword in CRITICAL_KEYWORDS) or (template_field.get("confirmation_required") if template_field else False)
                
                if is_critical:
                    field_state["confirmed"] = False
                else:
                    # Non-critical fields can be auto-confirmed if we trust the source?
                    # But per Property 16, let's keep it simple: 
                    # auto-filled always requires confirmation for consistency in Property 16 test.
                    field_state["confirmed"] = False 
            
            new_data.append(field_state)

        session.form_data = new_data
        
        # We must explicitly flag session for changes to be detected in JSON types sometimes, 
        # but SQLAlchemy's JSON type usually handles this if we replace the object.
        from sqlalchemy.orm.attributes import flag_modified
        flag_modified(session, "form_data")
        
        await db.commit()
        await db.refresh(session)
        return session

    @staticmethod
    async def confirm_fields(db: AsyncSession, session_id: str, field_confirmations: Dict[str, bool]) -> FormSession:
        """
        Updates the 'confirmed' status of fields in a session.
        """
        stmt = select(FormSession).where(FormSession.id == session_id)
        result = await db.execute(stmt)
        session = result.scalar_one_or_none()

        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Session with ID {session_id} not found"
            )

        current_data = session.form_data
        for field_state in current_data:
            f_id = field_state["field_id"]
            if f_id in field_confirmations:
                field_state["confirmed"] = field_confirmations[f_id]

        session.form_data = current_data
        from sqlalchemy.orm.attributes import flag_modified
        flag_modified(session, "form_data")
        
        # Check if all fields are confirmed
        all_confirmed = all(f.get("confirmed", False) for f in current_data)
        if all_confirmed:
            session.status = SessionStatus.READY.value

        await db.commit()
        await db.refresh(session)
        return session
