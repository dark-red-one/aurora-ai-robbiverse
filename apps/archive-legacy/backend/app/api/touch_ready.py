"""
Touch Ready Queue API - AI-Drafted Follow-ups
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime

from ..core.database import get_db
from ..services.touch_ready_service import TouchReadyService


router = APIRouter(prefix="/api/touch-ready", tags=["touch-ready"])


# Request/Response Models
class GenerateTouchRequest(BaseModel):
    contact_id: str
    contact_name: str
    contact_context: dict = Field(default_factory=dict)
    touch_type: str = Field(default="follow_up")


class UpdateMessageRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=5000)


class TouchResponse(BaseModel):
    id: str
    org_id: str
    contact_id: str
    user_id: Optional[str]
    touch_type: str
    priority: str
    suggested_message: Optional[str]
    ai_confidence: Optional[float]
    reason: Optional[str]
    context: dict
    status: str
    scheduled_for: Optional[str]
    sent_at: Optional[str]
    dismissed_at: Optional[str]
    created_at: str
    updated_at: str


# Endpoints
@router.post("/generate", response_model=TouchResponse)
async def generate_touch(
    request: GenerateTouchRequest,
    db: Session = Depends(get_db)
):
    """Generate an AI-drafted follow-up touch"""
    
    # TODO: Get org_id and user_id from auth token
    org_id = "default-org-id"
    user_id = "allan-user-id"
    
    service = TouchReadyService(db)
    touch = await service.generate_touch(
        org_id=org_id,
        user_id=user_id,
        contact_id=request.contact_id,
        contact_name=request.contact_name,
        contact_context=request.contact_context,
        touch_type=request.touch_type
    )
    
    return touch.to_dict()


@router.get("/pending", response_model=List[TouchResponse])
def get_pending_touches(
    priority: Optional[str] = None,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """Get pending touches ready to review"""
    
    # TODO: Get org_id from auth token
    org_id = "default-org-id"
    
    service = TouchReadyService(db)
    touches = service.get_pending_touches(
        org_id=org_id,
        priority=priority,
        limit=limit
    )
    
    return [touch.to_dict() for touch in touches]


@router.post("/{touch_id}/approve")
def approve_touch(
    touch_id: str,
    scheduled_for: Optional[datetime] = None,
    db: Session = Depends(get_db)
):
    """Approve a touch for sending"""
    
    service = TouchReadyService(db)
    try:
        touch = service.approve_touch(touch_id, scheduled_for)
        return {
            "success": True,
            "message": "Touch approved! Ready to send. 🚀",
            "touch": touch.to_dict()
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{touch_id}/send")
def send_touch(
    touch_id: str,
    db: Session = Depends(get_db)
):
    """Mark a touch as sent (after actually sending via email/Slack/etc)"""
    
    service = TouchReadyService(db)
    try:
        touch = service.mark_sent(touch_id)
        return {
            "success": True,
            "message": "Touch marked as sent! ✅",
            "touch": touch.to_dict()
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{touch_id}/dismiss")
def dismiss_touch(
    touch_id: str,
    db: Session = Depends(get_db)
):
    """Dismiss a touch (not sending)"""
    
    service = TouchReadyService(db)
    try:
        touch = service.dismiss_touch(touch_id)
        return {
            "success": True,
            "message": "Touch dismissed.",
            "touch": touch.to_dict()
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.patch("/{touch_id}/message", response_model=TouchResponse)
def update_message(
    touch_id: str,
    request: UpdateMessageRequest,
    db: Session = Depends(get_db)
):
    """Update the message (Allan can edit before sending)"""
    
    service = TouchReadyService(db)
    try:
        touch = service.update_message(touch_id, request.message)
        return touch.to_dict()
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/stats")
def get_stats(
    days: int = 30,
    db: Session = Depends(get_db)
):
    """Get touch queue statistics"""
    
    # TODO: Get org_id from auth token
    org_id = "default-org-id"
    
    service = TouchReadyService(db)
    return service.get_stats(org_id, days)

