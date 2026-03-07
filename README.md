<div align="center">

<h1>🪄 SevaSetu</h1>
<p><strong>AI-powered form assistant that stops government application rejections before they happen.</strong></p>

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Python](https://img.shields.io/badge/Python-3.14-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![Groq](https://img.shields.io/badge/LLM-Groq%20LLaMA%203.3-FF6B35?style=flat-square)](https://groq.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

</div>

---

## The Problem

Every day, thousands of Indian citizens walk to government offices — and walk back home empty-handed.

Forms rejected for a wrong date format. Income certificates returned because a single document was missing. Death certificates delayed because nobody told the applicant they needed a burial ground receipt *and* a VRO report. The citizen makes another trip. The queue grows longer. The officer stamps "Rejected" again.

**SevaSetu stops this from happening.**

---

## What It Does

SevaSetu is an AI assistant that sits *between the citizen and the counter* — validating documents, answering questions in the citizen's language, auto-filling forms, and predicting rejection risks **before** anyone waits in a queue.

| Feature | What It Means for a Citizen |
|--------|---------------------------|
| 🤖 **AI Chat Assistant** | Ask anything about a certificate in your language — documents needed, rejection reasons, tips from real grievances, government rules |
| 📄 **Document Validation** | Upload your Aadhaar / income proof — AI checks it is legible, complete, and matches form requirements |
| ✍️ **Auto-Fill from Docs** | Upload an ID document; AI extracts your name, DOB, address and fills the form fields automatically |
| 🧠 **Rejection Risk Engine** | Flags likely rejection reasons *before submission* using office-specific rules and past rejection patterns |
| 📋 **Blank Form Preview** | Download the official blank form PDF for any certificate directly |
| 🌐 **9 Indian Languages** | Chat in English, Telugu, Hindi, Tamil, Kannada, Malayalam, Marathi, Bengali, or Gujarati |
| 🎙️ **Voice Input** | Speak your question — browser Speech-to-Text transcribes it in the selected language |
| 📈 **Human Escalation** | When the AI isn't sure, it creates an Assistance Receipt and flags it for a human officer |

---

## How It Works

```
Citizen opens SevaSetu
        │
        ▼
Selects a certificate (Income, Caste, Land Record, etc.)
        │
        ├── Ask AI → question sent to Groq LLaMA 3.3 70B
        │            with form-specific knowledge base as context
        │            → natural, accurate, multilingual answer
        │
        ├── Upload Doc → EasyOCR extracts text
        │               → validation rules checked
        │               → risk score generated
        │
        ├── Auto-Fill → OCR data mapped to form fields
        │              → citizen reviews & confirms
        │
        └── Preview → official blank PDF served
```

### The AI Chat Pipeline (RAG + LLM)

1. **Knowledge Base** — 10 Andhra Pradesh government certificates encoded with: required documents, step-by-step procedures, common rejection reasons, critical fields, real citizen grievances, and G.O. (Government Order) references
2. **Retrieval** — sentence-transformers (`all-MiniLM-L6-v2`) embeds the query on the backend and retrieves the most relevant KB passages
3. **Generation** — Groq's LLaMA 3.3 70B receives `[system: KB context] + [user: question]` on the **server** and returns a grounded, conversational answer
4. **Language** — the model responds in the citizen's detected language while keeping all numbers in English digits
5. **Security** — the `GROQ_API_KEY` never leaves the backend; the frontend calls `POST /api/v1/ai/public-chat` with no auth token required (open kiosk model)

---

## Supported Certificates

| Certificate | Department | Typical Time |
|------------|------------|-------------|
| Income Certificate | Revenue | 7–15 days |
| Integrated Certificate (Caste-Nativity-DOB) | Revenue | 15–30 days |
| Residence Certificate | Revenue | 7 days |
| Family Member Certificate | Revenue | 15–30 days |
| Birth Certificate | Municipal / Panchayat Raj | 15–20 days |
| Death Certificate | Municipal / Panchayat Raj | 15–20 days |
| Adangal / Pahani (Land Records) | Revenue | Immediate–7 days |
| Possession Certificate | Revenue | 15 days |
| Mutation (Property Transfer) | Revenue | 30–45 days |
| EWS Certificate | Revenue | 15–30 days |

---

## Tech Stack

### Frontend
- **React 18** + TypeScript with Vite
- Vanilla CSS — dark/light dual theme, glassmorphism, micro-animations
- Browser Web Speech API for voice input
- All AI calls go through the backend — **no secrets in the browser**

### Backend
- **FastAPI** (Python 3.14) + Uvicorn with async throughout
- **SQLite** (dev) / PostgreSQL-ready via SQLAlchemy async
- JWT authentication (python-jose + bcrypt)
- Background task scheduler for data retention cleanup

### AI & ML
- **Groq** — LLaMA 3.3 70B Versatile for natural language answers
- **sentence-transformers** — local RAG embeddings (`all-MiniLM-L6-v2`, no API cost)
- **EasyOCR** — document text extraction (CPU, no cloud)
- **scikit-learn** — rejection risk scoring model
- **langdetect** — automatic language detection for routing

### Security
- Fernet symmetric encryption for stored documents
- JWT with configurable expiry
- PII masked in structured logs
- CORS scoped to configured origins

---

## Running Locally

### Prerequisites
- Python 3.11+ and Node.js 18+
- A free Groq API key → [console.groq.com](https://console.groq.com)

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
python seed_test_data.py       # one-time: seeds demo data
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

The frontend has **no secrets**. It calls the backend for all AI responses.

Open **http://localhost:3000** — the backend Swagger UI is at **http://localhost:8000/docs**

### Docker (production)

```bash
# 1. Copy the env template and fill in your secrets
cp .env.docker .env
# Edit .env: set SECRET_KEY and GROQ_API_KEY

# 2. Build and start both services
docker compose up --build
```

> The Groq API key is set **only in `backend/.env`** — it never reaches the browser.

---

## Project Structure

```
SevaSetu/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI route handlers
│   │   ├── core/         # config, database, security, logging
│   │   ├── models/       # SQLAlchemy ORM models
│   │   ├── services/     # AI, document, PDF, rules logic
│   │   └── tasks/        # background retention cleanup
│   ├── SevaSetu_knowledge_base.txt   # structured KB for RAG
│   └── seed_test_data.py
└── frontend/
    └── src/
        ├── components/   # ChatPanel, CustomSelect, AutoFillForm …
        ├── data/         # local knowledge base (TypeScript)
        ├── pages/        # AppPage, LandingPage
        └── utils/
```

---

## Why the RAG + LLM Approach

Generic AI chatbots hallucinate government rules. SevaSetu grounds every answer in a curated knowledge base built from actual Andhra Pradesh Government Orders (G.O. Ms.), revenue department procedures, and documented citizen grievances. The LLM's job is to *explain* the facts naturally — not to *invent* them.

> Example: A query about income certificate documents retrieves the exact G.O. Ms. No. 186 (2018) clause about Standard Acre yield rates, and the LLM explains it plainly in the citizen's language.

---

## Impact

- ✅ Eliminates the most common reason citizens waste a trip: not knowing the complete document list
- ✅ Explains rejection reasons in plain language *before* the officer has to say it
- ✅ Accessible to users with low literacy through voice input in 9 languages
- ✅ Reduces officer workload by handling repetitive document queries at scale
- ✅ Fully auditable — human escalation path preserved for edge cases

---

<div align="center">
<sub>Built for public-sector pilots, civic hackathons, and scalable government deployments across Indian states.</sub>
</div>
