"""
Sticky Notes API - Memory & Celebration Tracking
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, Field

from ..core.database import get_db
from ..services.sticky_notes_service import StickyNotesService


router = APIRouter(prefix="/api/sticky-notes", tags=["sticky-notes"])


# Request/Response Models
class CreateNoteRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)
    source_type: str = Field(default="manual")
    source_metadata: dict = Field(default_factory=dict)
    auto_analyze: bool = Field(default=True)


class UpdateNoteRequest(BaseModel):
    content: Optional[str] = None
    category: Optional[str] = None
    color: Optional[str] = None
    tags: Optional[List[str]] = None
    is_private: Optional[bool] = None


class NoteResponse(BaseModel):
    id: str
    org_id: str
    user_id: Optional[str]
    content: str
    category: Optional[str]
    importance_score: Optional[float]
    celebration_potential: Optional[float]
    sharing_potential: Optional[float]
    emotional_tone: Optional[str]
    people_mentioned: List[str]
    companies_mentioned: List[str]
    projects_mentioned: List[str]
    context: Optional[str]
    source_type: Optional[str]
    source_metadata: dict
    is_private: bool
    permission_requested: bool
    permission_granted: bool
    color: str
    tags: List[str]
    created_at: str
    updated_at: str


# Endpoints
@router.post("/create", response_model=NoteResponse)
async def create_note(
    request: CreateNoteRequest,
    db: Session = Depends(get_db)
):
    """Create a new sticky note with AI analysis"""
    
    # TODO: Get org_id and user_id from auth token
    org_id = "default-org-id"  # Replace with actual org from auth
    user_id = "allan-user-id"  # Replace with actual user from auth
    
    service = StickyNotesService(db)
    note = await service.create_note(
        org_id=org_id,
        user_id=user_id,
        content=request.content,
        source_type=request.source_type,
        source_metadata=request.source_metadata,
        auto_analyze=request.auto_analyze
    )
    
    return note.to_dict()


@router.get("/list", response_model=List[NoteResponse])
def get_notes(
    category: Optional[str] = None,
    min_celebration: Optional[float] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get sticky notes with filters"""
    
    # TODO: Get org_id from auth token
    org_id = "default-org-id"
    
    service = StickyNotesService(db)
    notes = service.get_notes(
        org_id=org_id,
        category=category,
        min_celebration_potential=min_celebration,
        limit=limit
    )
    
    return [note.to_dict() for note in notes]


@router.get("/celebrations", response_model=List[NoteResponse])
def get_celebrations(
    min_score: float = 0.7,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Get notes worth celebrating! 🎉"""
    
    # TODO: Get org_id from auth token
    org_id = "default-org-id"
    
    service = StickyNotesService(db)
    notes = service.get_celebrations(
        org_id=org_id,
        min_score=min_score,
        limit=limit
    )
    
    return [note.to_dict() for note in notes]


@router.post("/{note_id}/request-permission")
def request_sharing_permission(
    note_id: str,
    db: Session = Depends(get_db)
):
    """Request permission to share a note publicly"""
    
    service = StickyNotesService(db)
    try:
        note = service.request_sharing_permission(note_id)
        return {
            "success": True,
            "message": "Permission requested! Allan will review.",
            "note": note.to_dict()
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{note_id}/grant-permission")
def grant_sharing_permission(
    note_id: str,
    db: Session = Depends(get_db)
):
    """Grant permission to share a note (Allan only!)"""
    
    # TODO: Check if user is Allan
    
    service = StickyNotesService(db)
    try:
        note = service.grant_sharing_permission(note_id)
        return {
            "success": True,
            "message": "Permission granted! This note can now be shared. 🎉",
            "note": note.to_dict()
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{note_id}/deny-permission")
def deny_sharing_permission(
    note_id: str,
    db: Session = Depends(get_db)
):
    """Deny permission to share a note (Allan only!)"""
    
    # TODO: Check if user is Allan
    
    service = StickyNotesService(db)
    try:
        note = service.deny_sharing_permission(note_id)
        return {
            "success": True,
            "message": "Permission denied. This note stays private.",
            "note": note.to_dict()
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.patch("/{note_id}", response_model=NoteResponse)
def update_note(
    note_id: str,
    request: UpdateNoteRequest,
    db: Session = Depends(get_db)
):
    """Update a sticky note"""
    
    service = StickyNotesService(db)
    
    update_data = request.dict(exclude_unset=True)
    try:
        note = service.update_note(note_id, **update_data)
        return note.to_dict()
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{note_id}")
def delete_note(
    note_id: str,
    db: Session = Depends(get_db)
):
    """Delete a sticky note"""
    
    service = StickyNotesService(db)
    success = service.delete_note(note_id)
    
    if not success:
        raise HTTPException(status_code=404, detail=f"Note {note_id} not found")
    
    return {"success": True, "message": "Note deleted"}


@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    """Get sticky notes statistics"""
    
    # TODO: Get org_id from auth token
    org_id = "default-org-id"
    
    service = StickyNotesService(db)
    
    all_notes = service.get_notes(org_id=org_id, limit=1000)
    celebrations = service.get_celebrations(org_id=org_id, min_score=0.7, limit=1000)
    
    return {
        "total_notes": len(all_notes),
        "celebrations": len(celebrations),
        "by_category": {
            "achievement": len([n for n in all_notes if n.category == 'achievement']),
            "feedback": len([n for n in all_notes if n.category == 'feedback']),
            "decision": len([n for n in all_notes if n.category == 'decision']),
            "insight": len([n for n in all_notes if n.category == 'insight']),
            "personal": len([n for n in all_notes if n.category == 'personal']),
            "business": len([n for n in all_notes if n.category == 'business']),
            "celebration": len([n for n in all_notes if n.category == 'celebration']),
        },
        "pending_permissions": len([n for n in all_notes if n.permission_requested and not n.permission_granted]),
        "shareable": len([n for n in all_notes if n.permission_granted]),
    }

