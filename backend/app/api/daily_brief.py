"""
Daily Brief API - 5pm Digest with Time-Saved Metrics
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, date
from pydantic import BaseModel

from ..core.database import get_db
from ..services.daily_brief_service import DailyBriefService


router = APIRouter(prefix="/api/daily-brief", tags=["daily-brief"])


# Response Models
class DailyBriefResponse(BaseModel):
    date: str
    summary: str
    celebrations: list
    touches: dict
    meetings: dict
    time_saved_minutes: int
    time_saved_hours: float
    generated_at: str


class WeeklySummaryResponse(BaseModel):
    period: str
    total_celebrations: int
    total_touches_sent: int
    total_meetings: int
    avg_meeting_health: float
    total_time_saved_hours: float
    top_celebrations: list


# Endpoints
@router.get("/today", response_model=DailyBriefResponse)
async def get_today_brief(db: Session = Depends(get_db)):
    """Get today's daily brief (5pm digest)"""
    
    # TODO: Get org_id and user_id from auth token
    org_id = "default-org-id"
    user_id = "allan-user-id"
    
    service = DailyBriefService(db)
    brief = await service.generate_daily_brief(org_id, user_id)
    
    return brief


@router.get("/date/{target_date}", response_model=DailyBriefResponse)
async def get_brief_for_date(
    target_date: date,
    db: Session = Depends(get_db)
):
    """Get daily brief for a specific date"""
    
    # TODO: Get org_id and user_id from auth token
    org_id = "default-org-id"
    user_id = "allan-user-id"
    
    service = DailyBriefService(db)
    brief = await service.generate_daily_brief(
        org_id,
        user_id,
        date=datetime.combine(target_date, datetime.min.time())
    )
    
    return brief


@router.get("/weekly", response_model=WeeklySummaryResponse)
def get_weekly_summary(db: Session = Depends(get_db)):
    """Get weekly summary (last 7 days)"""
    
    # TODO: Get org_id and user_id from auth token
    org_id = "default-org-id"
    user_id = "allan-user-id"
    
    service = DailyBriefService(db)
    summary = service.get_weekly_summary(org_id, user_id)
    
    return summary
