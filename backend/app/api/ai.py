"""
AI Assistant endpoints.

POST /api/v1/ai/chat/{session_id}        – query the AI assistant
POST /api/v1/ai/speech-to-text           – convert audio to text (STT)
POST /api/v1/ai/text-to-speech           – convert text to audio (TTS)
"""

import os
import tempfile

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.auth import get_current_user_dep
from app.models.user import UserProfile
from app.services.ai_service import AIService

router = APIRouter(prefix="/ai", tags=["AI Assistant"])


@router.post("/chat/{session_id}")
async def assistant_chat(
    session_id: str,
    query: str = Form(...),
    simulate_confidence: float = Form(0.85),
    db: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user_dep),
):
    """
    Endpoint for asking the AI assistant a question regarding the form session.
    Fetches context from ChromaDB (or simulated) and evaluates confidence threshold.
    """
    return await AIService.process_user_query(
        db, session_id, str(current_user.id), query, simulate_confidence
    )


@router.post("/speech-to-text")
async def speech_to_text(file: UploadFile = File(...)):
    """Convert an uploaded audio file to text using speech recognition."""
    suffix = os.path.splitext(file.filename or "audio")[1] or ".wav"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        temp_path = tmp.name
    try:
        text = AIService.process_speech(temp_path)
        return {"text": text}
    finally:
        os.unlink(temp_path)


@router.post("/text-to-speech")
async def text_to_speech(text: str = Form(...), lang: str = Form("en")):
    """Convert text to speech and return the output audio file path."""
    out_path = AIService.synthesize_speech(text, lang)
    return {"audio_path": out_path}
