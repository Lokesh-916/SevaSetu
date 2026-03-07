"""
AI Assistant endpoints.

POST /api/v1/ai/public-chat                – public Groq chat (no auth, for kiosk)
POST /api/v1/ai/chat/{session_id}          – query the AI assistant (authenticated)
POST /api/v1/ai/speech-to-text             – convert audio to text (STT)
POST /api/v1/ai/text-to-speech             – convert text to audio (TTS)
"""

import os
import tempfile

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.config import settings
from app.api.auth import get_current_user_dep
from app.models.user import UserProfile
from app.services.ai_service import AIService, _ensure_models_loaded, _retrieve, _call_groq

router = APIRouter(prefix="/ai", tags=["AI Assistant"])


# ── Public (no-auth) chat ─────────────────────────────────────────────────────

class PublicChatRequest(BaseModel):
    form_id: str
    query: str
    language: str = "en"
    kb_context: str = ""   # frontend sends its serialised KB so backend doesn't duplicate it


@router.post("/public-chat")
async def public_chat(req: PublicChatRequest):
    """
    Open endpoint for the kiosk / frontend chat panel.
    No authentication required.
    The frontend passes its structured KB context; the backend calls Groq
    with that context and returns the LLM answer.
    """
    _ensure_models_loaded()

    # Use RAG retrieval from the backend KB file if available,
    # otherwise fall back to the frontend-supplied context.
    rag_context = _retrieve(req.query, top_k=2)
    context = rag_context or req.kb_context

    try:
        answer = _call_groq(req.query, context, req.language)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"AI service error: {exc}")

    return {"answer": answer, "query": req.query}


# ── Authenticated chat (existing) ─────────────────────────────────────────────

@router.post("/chat/{session_id}")
async def assistant_chat(
    session_id: str,
    query: str = Form(...),
    simulate_confidence: float = Form(0.85),
    db: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user_dep),
):
    """
    Authenticated endpoint for asking the AI assistant a question
    regarding a specific form session.
    """
    return await AIService.process_user_query(
        db, session_id, str(current_user.id), query, simulate_confidence
    )


# ── Speech-to-Text ────────────────────────────────────────────────────────────

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


# ── Text-to-Speech ────────────────────────────────────────────────────────────

@router.post("/text-to-speech")
async def text_to_speech(text: str = Form(...), lang: str = Form("en")):
    """Convert text to speech and return the output audio file path."""
    out_path = AIService.synthesize_speech(text, lang)
    return {"audio_path": out_path}
