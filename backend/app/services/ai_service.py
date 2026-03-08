"""
AI Service – RAG + AWS Bedrock LLM pipeline.

Flow for every /chat request:
  1. Receive user query
  2. Detect language (langdetect)
  3. Retrieve top-2 relevant KB chunks (sentence-transformers cosine similarity)
  4. Send [system prompt + KB context + user query] to AWS Bedrock LLM
  5. Return the LLM's answer, or escalate if confidence < threshold
"""

import logging
import os
import re
import tempfile
import uuid
from typing import Dict, Any, List

import numpy as np
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.enums import ReceiptStatus
from app.models.form import FormSession
from app.models.office import OfficeConfig
from app.models.receipt import AssistanceReceipt

logger = logging.getLogger(__name__)

# ── Knowledge base path ───────────────────────────────────────────────────────
_KB_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "SevaSetu_knowledge_base.txt")
)

# ── Module-level singletons (lazy-loaded on first query) ─────────────────────
_KB_DOCS: List[str] = []
_KB_EMBEDDINGS: "np.ndarray | None" = None
_EMBED_MODEL = None          # sentence_transformers.SentenceTransformer
_BEDROCK_CLIENT = None       # boto3 bedrock-runtime client


# ── Knowledge base helpers ────────────────────────────────────────────────────

def _chunk_kb(path: str) -> List[str]:
    """Split the flat KB text file into one chunk per form."""
    try:
        with open(path, encoding="utf-8") as f:
            text = f.read()
        chunks = re.split(r"=== FORM START ===", text)
        return [
            chunk.replace("=== FORM END ===", "").strip()
            for chunk in chunks
            if len(chunk.strip()) > 50
        ]
    except FileNotFoundError:
        logger.warning("Knowledge base not found at %s", path)
        return []


def _cosine_similarity(a: "np.ndarray", b: "np.ndarray") -> "np.ndarray":
    a_norm = a / (np.linalg.norm(a) + 1e-10)
    b_norms = b / (np.linalg.norm(b, axis=1, keepdims=True) + 1e-10)
    return b_norms @ a_norm


def _ensure_models_loaded() -> None:
    """Lazily load SentenceTransformer embedder and AWS Bedrock client."""
    global _KB_DOCS, _KB_EMBEDDINGS, _EMBED_MODEL, _BEDROCK_CLIENT

    if os.environ.get("TESTING") == "1":
        return

    # ── Embedder ──────────────────────────────────────────────────────────────
    if _EMBED_MODEL is None:
        try:
            from sentence_transformers import SentenceTransformer
            logger.info("Loading SentenceTransformer (all-MiniLM-L6-v2)…")
            _EMBED_MODEL = SentenceTransformer("all-MiniLM-L6-v2")
            _KB_DOCS = _chunk_kb(_KB_PATH)
            if _KB_DOCS:
                _KB_EMBEDDINGS = _EMBED_MODEL.encode(
                    _KB_DOCS, convert_to_numpy=True
                )
                logger.info(
                    "RAG ready: %d KB chunks embedded.", len(_KB_DOCS)
                )
            else:
                logger.warning("KB is empty — RAG disabled.")
        except Exception as exc:
            logger.error("SentenceTransformer load failed: %s", exc)

    # ── AWS Bedrock client ────────────────────────────────────────────────────
    if _BEDROCK_CLIENT is None:
        try:
            import boto3
            # No credentials passed - boto3 will automatically use IAM role
            # from EC2 instance metadata service
            _BEDROCK_CLIENT = boto3.client(
                service_name="bedrock-runtime",
                region_name=settings.AWS_REGION,
            )
            logger.info(
                "AWS Bedrock client ready (model: %s, region: %s). Using IAM role for authentication.",
                settings.BEDROCK_MODEL_ID,
                settings.AWS_REGION,
            )
        except Exception as exc:
            logger.error("AWS Bedrock client init failed: %s", exc)
            logger.warning(
                "AI will return raw KB context only. Ensure EC2 instance has proper IAM role attached."
            )


def _retrieve(query: str, top_k: int = 2) -> str:
    """Return the top-k most relevant KB passages for a query."""
    if _EMBED_MODEL is None or _KB_EMBEDDINGS is None or not _KB_DOCS:
        return ""
    q_vec = _EMBED_MODEL.encode([query], convert_to_numpy=True)[0]
    scores = _cosine_similarity(q_vec, _KB_EMBEDDINGS)
    top_indices = np.argsort(scores)[::-1][:top_k]
    return "\n\n---\n\n".join(_KB_DOCS[i] for i in top_indices)


def _call_bedrock(query: str, context: str, language: str) -> str:
    """Send query + KB context to AWS Bedrock and return the answer."""
    if _BEDROCK_CLIENT is None:
        # No credentials — fall back to returning the raw KB excerpt
        return (
            f"Based on our knowledge base:\n\n{context}"
            if context
            else "I'm sorry, I couldn't find relevant information for your query."
        )

    lang_note = (
        f" Please reply in {language}." if language != "en" else ""
    )

    system_prompt = (
        "You are SevaSetu, a helpful AI assistant specialised in Indian "
        "government services and document processing. "
        "You help citizens understand how to fill forms, what documents they need, "
        "and what common mistakes to avoid.\n\n"
        "Use ONLY the Knowledge Base context provided below to answer. "
        "If the answer is not in the context, say so honestly and suggest "
        "the user contact the relevant office.\n\n"
        f"KNOWLEDGE BASE CONTEXT:\n{context}"
        if context else
        "You are SevaSetu, a helpful AI assistant for Indian government services. "
        "Answer the citizen's question as helpfully as possible."
    )

    try:
        import json
        
        # Prepare the request body for Claude 3.5 Sonnet
        request_body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 1024,
            "temperature": 0.3,
            "system": system_prompt + lang_note,
            "messages": [
                {
                    "role": "user",
                    "content": query
                }
            ]
        }
        
        response = _BEDROCK_CLIENT.invoke_model(
            modelId=settings.BEDROCK_MODEL_ID,
            body=json.dumps(request_body)
        )
        
        response_body = json.loads(response['body'].read())
        return response_body['content'][0]['text'].strip()
        
    except Exception as exc:
        logger.error("AWS Bedrock API call failed: %s", exc)
        raise HTTPException(
            status_code=502,
            detail=f"AI service temporarily unavailable: {exc}",
        )


# ── Main Service ──────────────────────────────────────────────────────────────

class AIService:

    @staticmethod
    async def process_user_query(
        db: AsyncSession,
        session_id: str,
        user_id: str,
        query: str,
        simulate_confidence: float = 0.85,
    ) -> Dict[str, Any]:
        """
        Full RAG + AWS Bedrock LLM pipeline:
          retrieve → generate → escalate if needed
        """
        # Lazy-load models on first call
        _ensure_models_loaded()

        # 1. Fetch session
        form_session = await db.scalar(
            select(FormSession).where(
                FormSession.id == session_id,
                FormSession.user_id == user_id,
            )
        )
        if not form_session:
            raise HTTPException(status_code=404, detail="Form session not found.")

        # 2. Office escalation threshold
        office = await db.scalar(
            select(OfficeConfig).where(
                OfficeConfig.office_code == form_session.office_type
            )
        )
        threshold = office.escalation_threshold if office else 0.75

        # 3. Language detection
        detected_lang = "en"
        try:
            from langdetect import detect
            detected_lang = detect(query)
        except Exception:
            pass

        # 4. RAG retrieval
        context = _retrieve(query, top_k=2)

        # 5. Confidence gate
        confidence = simulate_confidence
        escalated = False
        receipt_id = None

        if confidence < threshold:
            receipt = await AIService.escalate_to_human(
                db, form_session, query, confidence
            )
            escalated = True
            receipt_id = str(receipt.id)
            answer = (
                "I'm not completely sure how to assist with that. "
                "I've preserved your progress and raised an Assistance Receipt. "
                "A human officer will review this shortly."
            )
        else:
            # 6. Call AWS Bedrock LLM with KB context
            answer = _call_bedrock(query, context, detected_lang)

        return {
            "query": query,
            "detected_language": detected_lang,
            "answer": answer,
            "confidence": confidence,
            "escalated": escalated,
            "receipt_id": receipt_id,
        }

    # ── Escalation ────────────────────────────────────────────────────────────
    @staticmethod
    async def escalate_to_human(
        db: AsyncSession,
        session: FormSession,
        reason: str,
        confidence: float,
    ) -> AssistanceReceipt:
        existing = await db.scalar(
            select(AssistanceReceipt).where(
                AssistanceReceipt.session_id == session.id
            )
        )
        if existing:
            return existing

        office = await db.scalar(
            select(OfficeConfig).where(
                OfficeConfig.office_code == session.office_type
            )
        )

        receipt = AssistanceReceipt(
            session_id=session.id,
            user_id=session.user_id,
            office_id=str(office.id) if office else "UNKNOWN",
            form_type=session.form_type,
            escalation_reason=reason,
            confidence_score=confidence,
            session_snapshot={
                "form_data": session.form_data,
                "current_step": session.current_step,
                "status": session.status,
            },
            status=ReceiptStatus.PENDING.value,
        )
        db.add(receipt)
        session.status = "escalated"
        await db.commit()
        await db.refresh(receipt)
        return receipt

    # ── Speech-to-Text ────────────────────────────────────────────────────────
    @staticmethod
    def process_speech(file_path: str) -> str:
        try:
            import speech_recognition as sr
        except ImportError:
            raise HTTPException(
                status_code=501,
                detail="speech_recognition library is not installed.",
            )
        try:
            recognizer = sr.Recognizer()
            with sr.AudioFile(file_path) as source:
                audio_data = recognizer.record(source)
            return recognizer.recognize_google(audio_data)
        except Exception as exc:
            raise HTTPException(
                status_code=400, detail=f"Speech recognition failed: {exc}"
            )

    # ── Text-to-Speech ────────────────────────────────────────────────────────
    @staticmethod
    def synthesize_speech(text: str, lang: str = "en") -> str:
        try:
            from gtts import gTTS
        except ImportError:
            raise HTTPException(
                status_code=501,
                detail="gTTS library is not installed.",
            )
        try:
            filename = f"{uuid.uuid4()}_tts.mp3"
            out_path = os.path.join(tempfile.gettempdir(), filename)
            tts = gTTS(text=text, lang=lang)
            tts.save(out_path)
            return out_path
        except Exception as exc:
            raise HTTPException(
                status_code=500, detail=f"TTS synthesis failed: {exc}"
            )
