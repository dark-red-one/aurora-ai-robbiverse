"""
Meeting Health API - Meeting Quality Scoring
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel, Field

from ..core.database import get_db
from ..services.meeting_health_service import MeetingHealthService


router = APIRouter(prefix="/api/meeting-health", tags=["meeting-health"])


# Request/Response Models
class ScoreMeetingRequest(BaseModel):
    calendar_event_id: str
    has_agenda: bool = False
    duration_minutes: int = Field(..., gt=0, le=480)
    attendee_count: int = Field(..., gt=0, le=100)


class BulkScoreRequest(BaseModel):
    meetings: List[dict]


class HealthResponse(BaseModel):
    id: str
    org_id: str
    calendar_event_id: str
    has_agenda: bool
    duration_minutes: int
    attendee_count: int
    health_score: int
    health_status: str
    issues: List[str]
    recommendations: List[str]
    created_at: str
    updated_at: str


# Endpoints
@router.post("/score", response_model=HealthResponse)
def score_meeting(
    request: ScoreMeetingRequest,
    db: Session = Depends(get_db)
):
    """Score a meeting's health"""
    
    # TODO: Get org_id from auth token
    org_id = "default-org-id"
    
    service = MeetingHealthService(db)
    health = service.score_meeting(
        org_id=org_id,
        calendar_event_id=request.calendar_event_id,
        has_agenda=request.has_agenda,
        duration_minutes=request.duration_minutes,
        attendee_count=request.attendee_count
    )
    
    return health.to_dict()


@router.post("/bulk-score", response_model=List[HealthResponse])
def bulk_score_meetings(
    request: BulkScoreRequest,
    db: Session = Depends(get_db)
):
    """Score multiple meetings at once"""
    
    # TODO: Get org_id from auth token
    org_id = "default-org-id"
    
    service = MeetingHealthService(db)
    health_records = service.bulk_score_meetings(org_id, request.meetings)
    
    return [h.to_dict() for h in health_records]


@router.get("/event/{calendar_event_id}", response_model=HealthResponse)
def get_health_by_event(
    calendar_event_id: str,
    db: Session = Depends(get_db)
):
    """Get health score for a specific meeting"""
    
    service = MeetingHealthService(db)
    health = service.get_health_by_event(calendar_event_id)
    
    if not health:
        raise HTTPException(status_code=404, detail=f"Health record for event {calendar_event_id} not found")
    
    return health.to_dict()


@router.get("/problematic", response_model=List[HealthResponse])
def get_problematic_meetings(
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """Get meetings with health issues"""
    
    # TODO: Get org_id from auth token
    org_id = "default-org-id"
    
    service = MeetingHealthService(db)
    meetings = service.get_problematic_meetings(org_id, limit)
    
    return [m.to_dict() for m in meetings]


@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    """Get meeting health statistics"""
    
    # TODO: Get org_id from auth token
    org_id = "default-org-id"
    
    service = MeetingHealthService(db)
    return service.get_stats(org_id)
