from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, BackgroundTasks, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
import asyncio

from app.core.database import get_db
from app.services.rule_service import rule_notifier, RuleEngineService

router = APIRouter(prefix="/rules", tags=["Rules Engine"])

manager = rule_notifier

@router.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    """
    WebSocket endpoint for real-time notification of rule updates.
    """
    await manager.connect(websocket)
    try:
        while True:
            # Keep-alive loop
            data = await websocket.receive_text()
            await websocket.send_text(f"Ping received: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@router.post("/update")
async def trigger_rule_update(background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    """
    Manually trigger an external API fetch for rule updates.
    """
    background_tasks.add_task(RuleEngineService.fetch_and_update_rules, db)
    return {"message": "Rule update triggered in background."}

@router.get("/validate/{session_id}")
async def validate_form(session_id: str, db: AsyncSession = Depends(get_db)):
    """
    Validates form using cross-field Pydantic logic and mock ML Risk model.
    """
    try:
        errors = await RuleEngineService.validate_form_data(db, session_id)
        if errors:
            return {"valid": False, "errors": errors}
        return {"valid": True, "message": "Form passes all rules."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
