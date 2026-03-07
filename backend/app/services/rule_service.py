import json
import random
import logging
from typing import Dict, Any, List
from fastapi import WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.office import OfficeConfig
from app.models.form import FormTemplate, FormSession

logger = logging.getLogger(__name__)

# Dummy reject risk model using scikit-learn
try:
    from sklearn.linear_model import LogisticRegression
    import numpy as np
    
    # Train a dummy model
    _dummy_X = np.array([[0, 0], [1, 1], [0, 1], [1, 0]])
    _dummy_y = np.array([0, 1, 0, 1])
    risk_model = LogisticRegression()
    risk_model.fit(_dummy_X, _dummy_y)
    
except ImportError:
    logger.warning("scikit-learn not installed. Using mock risk model.")
    class DummyRiskModel:
        def predict_proba(self, X):
            # mock probability
            return [[0.2, 0.8]]
    risk_model = DummyRiskModel()

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error(f"WebSocket send error: {e}")

rule_notifier = ConnectionManager()

class RuleEngineService:

    @staticmethod
    def evaluate_risk(form_data: List[Dict[str, Any]]) -> float:
        """
        Evaluate rejection risk using a dummy ML model.
        Extracts basic numerical features from the form data.
        """
        # Feature extraction (dummy logic for example)
        num_fields_filled = sum(1 for f in form_data if f.get('value'))
        all_confirmed = sum(1 for f in form_data if f.get('confirmed'))
        
        # Predict
        try:
            import numpy as np
            features = np.array([[num_fields_filled, all_confirmed]])
            prob = risk_model.predict_proba(features)[0][1] # Probability of "risk" (class 1)
            return float(prob)
        except Exception:
            return 0.5 # Default

    @staticmethod
    async def validate_form_data(db: AsyncSession, session_id: str) -> List[str]:
        """
        Cross-field validation based on OfficeConfig processing_rules 
        and FormTemplate validation_rules.
        Returns a list of error messages.
        """
        from sqlalchemy.orm import selectinload
        session = await db.scalar(
            select(FormSession)
            .where(FormSession.id == session_id)
            .options(selectinload(FormSession.documents))
        )
        if not session:
            return ["Session not found."]

        template = await db.scalar(select(FormTemplate).where(FormTemplate.id == session.template_id))
        if not template:
            return ["Template not found."]
        
        office = await db.scalar(select(OfficeConfig).where(OfficeConfig.office_code == session.office_type))
        
        errors = []
        data_dict = {f["field_name"]: f.get("value") for f in session.form_data}

        # 1. Evaluate Template Rules (e.g., cross-field logic)
        for rule in template.validation_rules:
            # simple mock condition evaluator
            condition = str(rule.get("condition", ""))
            # e.g., "Age > 18" -> simple evaluation if fields match
            if "fields_involved" in rule:
                for field in rule["fields_involved"]:
                    if field in data_dict and data_dict[field]:
                        # Mock evaluation
                        if "Age" in field and "18" in condition:
                            try:
                                if int(data_dict[field]) < 18:
                                    errors.append(rule.get("error_message", f"Rule failed: {condition}"))
                            except ValueError:
                                pass

        # 2. Evaluate Office Processing Rules
        if office and office.processing_rules:
            for rule in office.processing_rules:
                if rule.get("type") == "mandatory_docs" and not session.documents:
                    errors.append("Mandatory documents are missing per office rules.")

        return errors

    @staticmethod
    async def fetch_and_update_rules(db: AsyncSession, mock_update: bool = False):
        """
        Simulate fetching rule updates from external government API using HTTPX.
        Updates SQLite and triggers websocket broadcast.
        """
        import httpx
        
        office_code = "TEST_OFFICE"
        
        if not mock_update:
            try:
                # Mocking an external call
                async with httpx.AsyncClient() as client:
                    # using a dummy endpoint, simulating external service
                    response = await client.get("https://jsonplaceholder.typicode.com/todos/1")
                    if response.status_code != 200:
                        logger.error("Failed to fetch external rules")
                        return
            except Exception as e:
                logger.error(f"HTTPX error: {e}")
                return
                
        # Update the SQLite DB
        office = await db.scalar(select(OfficeConfig).where(OfficeConfig.office_code == office_code))
        if office:
            # Create a backup of old rules (simple version management)
            new_rule = {
                "id": str(random.randint(100, 999)),
                "type": "new_mandate",
                "description": "Newly fetched government rule."
            }
            # Append or replace rules
            current_rules = list(office.processing_rules) if office.processing_rules else []
            current_rules.append(new_rule)
            
            # Note: SQLAlchemy requires assigning a new object to JSON fields or using flag_modified
            from sqlalchemy.orm.attributes import flag_modified
            office.processing_rules = current_rules
            flag_modified(office, "processing_rules")
            await db.commit()
            
            # Notify users
            await rule_notifier.broadcast(json.dumps({
                "type": "RULE_UPDATE",
                "office_code": office_code,
                "message": "Office procedures have been updated. Please review the new requirements.",
                "new_rule": new_rule
            }))
