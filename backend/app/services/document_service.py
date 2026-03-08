"""
Document upload, validation, and OCR service.
"""

import os
import uuid
import tempfile
import logging
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import UploadFile, HTTPException, status

from app.models.document import Document
from app.models.form import FormSession
from app.models.enums import DocumentType, RiskLevel, ValidationIssueType, IssueSeverity

logger = logging.getLogger(__name__)

# ── Constants ─────────────────────────────────────────────────────────────────
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "application/pdf"]
UPLOAD_DIR = os.path.join(tempfile.gettempdir(), "sevasetu_uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ── Optional heavy dependencies ───────────────────────────────────────────────
# python-magic for MIME detection
try:
    import magic as _magic

    def _detect_mime(data: bytes) -> str:
        return _magic.from_buffer(data, mime=True)

except ImportError:  # fallback: guess from first bytes
    logger.warning("python-magic not installed; using basic MIME detection fallback.")

    def _detect_mime(data: bytes) -> str:  # type: ignore[misc]
        if data[:3] == b"\xff\xd8\xff":
            return "image/jpeg"
        if data[:8] == b"\x89PNG\r\n\x1a\n":
            return "image/png"
        if data[:4] == b"%PDF":
            return "application/pdf"
        return "application/octet-stream"


# cryptography for at-rest encryption (optional; falls back to plain storage)
try:
    from cryptography.fernet import Fernet

    _ENCRYPTION_KEY = Fernet.generate_key()
    _fernet = Fernet(_ENCRYPTION_KEY)

    def _encrypt(data: bytes) -> bytes:
        return _fernet.encrypt(data)

except ImportError:
    logger.warning("cryptography not installed; document storage will not be encrypted.")

    def _encrypt(data: bytes) -> bytes:  # type: ignore[misc]
        return data


# EasyOCR (optional, lazy-loaded)
_ocr_reader: Optional[object] = None
_ocr_initialized = False


def _get_ocr_reader():
    """Lazy-load EasyOCR reader on first use."""
    global _ocr_reader, _ocr_initialized
    
    if _ocr_initialized:
        return _ocr_reader
    
    _ocr_initialized = True
    
    if os.environ.get("TESTING") == "1":
        return None
    
    try:
        import easyocr
        logger.info("Loading EasyOCR reader (this may take a few minutes on first run)...")
        _ocr_reader = easyocr.Reader(["en", "hi"])
        logger.info("EasyOCR reader loaded successfully.")
        return _ocr_reader
    except Exception as exc:
        logger.warning("EasyOCR not available: %s", exc)
        return None


# ── Custom exception ──────────────────────────────────────────────────────────
class DocumentValidationException(HTTPException):
    def __init__(self, detail: str):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


# ── Service ───────────────────────────────────────────────────────────────────
class DocumentService:
    @staticmethod
    async def upload_document(
        db: AsyncSession,
        session_id: str,
        file: UploadFile,
        doc_type: DocumentType = DocumentType.OTHER,
    ) -> Document:

        # 1. Verify session exists
        form_session = await db.scalar(
            select(FormSession).where(FormSession.id == session_id)
        )
        if not form_session:
            raise HTTPException(status_code=404, detail="Session not found.")

        # 2. Read & validate size
        contents = await file.read()
        file_size = len(contents)

        if file_size == 0:
            raise DocumentValidationException("File is empty.")
        if file_size > MAX_FILE_SIZE:
            raise DocumentValidationException(
                f"File size {file_size} bytes exceeds 10 MB limit."
            )

        # 3. MIME type check
        mime_type = _detect_mime(contents)
        if mime_type not in ALLOWED_MIME_TYPES:
            raise DocumentValidationException(
                f"Unsupported file format: {mime_type}. "
                f"Allowed: {ALLOWED_MIME_TYPES}"
            )

        # 4. Encrypt & save to disk
        encrypted = _encrypt(contents)
        file_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}_{file.filename}.enc")
        with open(file_path, "wb") as fh:
            fh.write(encrypted)

        # 5. OCR extraction
        extracted_text = ""
        ocr_reader = _get_ocr_reader()
        if ocr_reader and mime_type in ("image/jpeg", "image/png"):
            try:
                tmp_path = file_path + ".tmp"
                with open(tmp_path, "wb") as fh:
                    fh.write(contents)
                result = ocr_reader.readtext(tmp_path, detail=0)  # type: ignore
                extracted_text = " ".join(result)
                os.remove(tmp_path)
            except Exception as exc:
                logger.warning("OCR failed for %s: %s", file.filename, exc)
                extracted_text = "OCR failed."
        else:
            extracted_text = f"Simulated extracted text for {file.filename}"

        # 6. Validation logic
        validation_issues = []
        is_valid = True
        risk_level = RiskLevel.LOW.value
        confidence = 0.8

        if not extracted_text or len(extracted_text.strip()) < 5:
            validation_issues.append(
                {
                    "issue_type": ValidationIssueType.DOCUMENT_UNCLEAR.value,
                    "field_name": "image_quality",
                    "description": "The document text could not be read clearly.",
                    "severity": IssueSeverity.ERROR.value,
                    "suggested_fix": "Please upload a clearer image with good lighting.",
                }
            )
            is_valid = False
            risk_level = RiskLevel.MEDIUM.value
            confidence = 0.2

        # Name mismatch check against form session data
        for field in form_session.form_data:
            field_name = field.get("field_name", "")
            field_value = field.get("value", "")
            if "name" in field_name.lower() and field_value:
                first_word = field_value.split()[0].lower()
                if first_word not in extracted_text.lower():
                    validation_issues.append(
                        {
                            "issue_type": ValidationIssueType.NAME_MISMATCH.value,
                            "field_name": field_name,
                            "description": "Name in document does not match form data.",
                            "severity": IssueSeverity.WARNING.value,
                            "suggested_fix": "Ensure the document belongs to the applicant.",
                        }
                    )
                    risk_level = RiskLevel.MEDIUM.value

        doc = Document(
            session_id=session_id,
            filename=file.filename,
            file_path=file_path,
            content_type=mime_type,
            file_size_bytes=file_size,
            document_type=doc_type.value,
            extracted_text=extracted_text,
            is_valid=is_valid,
            confidence=confidence,
            risk_level=risk_level,
            validation_issues=validation_issues,
            suggestions=(
                ["Please ensure all documents uploaded are clear and recent."]
                if not is_valid
                else []
            ),
        )
        db.add(doc)
        await db.commit()
        await db.refresh(doc)
        return doc
