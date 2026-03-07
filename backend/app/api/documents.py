from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.database import get_db
from app.api.auth import get_current_user_dep
from app.models.user import UserProfile
from app.schemas.document import DocumentResponse
from app.services.document_service import DocumentService
from app.models.enums import DocumentType

router = APIRouter(prefix="/documents", tags=["Documents"])

@router.post("/upload/{session_id}", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    session_id: str,
    file: UploadFile = File(...),
    document_type: DocumentType = Form(DocumentType.OTHER),
    db: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user_dep)
):
    """
    Upload a document, validate size/format, extract OCR text, and checking against session data.
    """
    try:
        doc = await DocumentService.upload_document(db, session_id, file, document_type)
        return doc
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
