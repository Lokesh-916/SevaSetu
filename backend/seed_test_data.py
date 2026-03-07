import asyncio
import uuid
import sys
import os

# Add the backend directory to sys.path so we can import 'app'
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import AsyncSessionLocal, init_db
from app.models.office import OfficeConfig
from app.models.form import FormTemplate
from app.models.user import UserProfile
from app.core.security import hash_password
from sqlalchemy import select

async def seed_data():
    print("Initializing Database...")
    await init_db()
    
    async with AsyncSessionLocal() as db:
        # Check if already seeded
        existing_office = await db.scalar(select(OfficeConfig).where(OfficeConfig.office_code == "TEST_OFFICE"))
        if existing_office:
            print("Database already seeded with TEST_OFFICE. Exiting.")
            return

        office_id = str(uuid.uuid4())
        office = OfficeConfig(
            id=office_id,
            office_name="Test Citizen Office",
            office_code="TEST_OFFICE",
            state="Maharashtra",
            escalation_threshold=0.8,
            supported_languages=["en", "hi", "te"],
        )
        db.add(office)

        template_id = str(uuid.uuid4())
        template = FormTemplate(
            id=template_id,
            office_id=office_id,
            form_name="Demo Auto-Fill Form",
            form_code="DEMO_FORM_01",
            version="1.0",
            description="A form for testing auto-fill and critical fields.",
            fields=[
                {
                    "field_id": "f_name",
                    "field_name": "Full Name",
                    "field_label": "Applicant Full Name",
                    "field_type": "text",
                    "is_required": True,
                    "auto_fill_source": "extracted_name"
                },
                {
                    "field_id": "f_address",
                    "field_name": "Home Address",
                    "field_label": "Permanent Address",
                    "field_type": "text",
                    "is_required": True,
                    "auto_fill_source": "extracted_address"
                },
                {
                    "field_id": "f_purpose",
                    "field_name": "Purpose of Visit",
                    "field_label": "Purpose",
                    "field_type": "text",
                    "is_required": True,
                    "auto_fill_source": "extracted_purpose"
                },
                {
                    "field_id": "f_age",
                    "field_name": "Age",
                    "field_label": "Age of Applicant",
                    "field_type": "number",
                    "is_required": False,
                    "auto_fill_source": "extracted_age"
                }
            ],
            required_documents=[],
            validation_rules=[]
        )
        db.add(template)

        # Ensure a test user exists
        user = await db.scalar(select(UserProfile).where(UserProfile.email == "testuser@example.com"))
        if not user:
            user_id = str(uuid.uuid4())
            user = UserProfile(
                id=user_id,
                email="testuser@example.com",
                hashed_password=hash_password("password123"),
                full_name="Test User",
                preferred_language="en",
                accessibility_needs={},
            )
            db.add(user)
        else:
            user_id = user.id

        await db.commit()
        print("Successfully seeded Database with demo data:")
        print(f"Office ID: {office_id}")
        print(f"Template ID: {template_id}")
        print(f"User ID: {user_id} (email: testuser@example.com, password: password123)")

if __name__ == "__main__":
    asyncio.run(seed_data())
