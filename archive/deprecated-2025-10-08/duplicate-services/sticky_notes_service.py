"""
Sticky Notes Service - AI-Powered Memory & Celebration Tracking
"""
from typing import List, Dict, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_
import openai
import os

from ..models.sticky_note import StickyNote


class StickyNotesService:
    """Service for managing sticky notes with AI analysis"""
    
    def __init__(self, db: Session):
        self.db = db
        self.openai_key = os.getenv('OPENAI_API_KEY')
    
    async def create_note(
        self,
        org_id: str,
        user_id: str,
        content: str,
        source_type: str = 'manual',
        source_metadata: Dict = None,
        auto_analyze: bool = True
    ) -> StickyNote:
        """Create a new sticky note with optional AI analysis"""
        
        # Create base note
        note = StickyNote(
            org_id=org_id,
            user_id=user_id,
            content=content,
            source_type=source_type,
            source_metadata=source_metadata or {}
        )
        
        # AI analysis if enabled
        if auto_analyze and self.openai_key:
            analysis = await self._analyze_note(content)
            note.category = analysis.get('category')
            note.importance_score = analysis.get('importance_score')
            note.celebration_potential = analysis.get('celebration_potential')
            note.sharing_potential = analysis.get('sharing_potential')
            note.emotional_tone = analysis.get('emotional_tone')
            note.people_mentioned = analysis.get('people_mentioned', [])
            note.companies_mentioned = analysis.get('companies_mentioned', [])
            note.projects_mentioned = analysis.get('projects_mentioned', [])
            note.color = analysis.get('suggested_color', 'yellow')
            note.tags = analysis.get('suggested_tags', [])
        
        self.db.add(note)
        self.db.commit()
        self.db.refresh(note)
        
        return note
    
    async def _analyze_note(self, content: str) -> Dict:
        """Use AI to analyze note content"""
        
        try:
            response = openai.chat.completions.create(
                model="gpt-4",
                messages=[
                    {
                        "role": "system",
                        "content": """You are an AI that analyzes sticky notes for a business owner.
                        
Analyze the note and return JSON with:
- category: achievement|feedback|decision|insight|personal|business|celebration
- importance_score: 0.0-1.0 (how important is this?)
- celebration_potential: 0.0-1.0 (should we celebrate this?)
- sharing_potential: 0.0-1.0 (could this be shared publicly?)
- emotional_tone: positive|neutral|concerned|excited
- people_mentioned: array of names mentioned
- companies_mentioned: array of companies mentioned
- projects_mentioned: array of projects mentioned
- suggested_color: yellow|green|pink|blue|orange|purple
- suggested_tags: array of relevant tags

Examples:
- "Closed Simply Good Foods for $12,740!" → achievement, 0.9 importance, 0.95 celebration, 0.7 sharing
- "Need to follow up with Quest Nutrition" → business, 0.6 importance, 0.0 celebration, 0.0 sharing
- "Steve Jobs said to focus on quality over quantity" → insight, 0.8 importance, 0.0 celebration, 0.3 sharing"""
                    },
                    {
                        "role": "user",
                        "content": content
                    }
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            
            import json
            return json.loads(response.choices[0].message.content)
            
        except Exception as e:
            print(f"AI analysis failed: {e}")
            return {
                'category': 'insight',
                'importance_score': 0.5,
                'celebration_potential': 0.0,
                'sharing_potential': 0.0,
                'emotional_tone': 'neutral',
                'people_mentioned': [],
                'companies_mentioned': [],
                'projects_mentioned': [],
                'suggested_color': 'yellow',
                'suggested_tags': []
            }
    
    def get_notes(
        self,
        org_id: str,
        user_id: Optional[str] = None,
        category: Optional[str] = None,
        min_celebration_potential: Optional[float] = None,
        limit: int = 50
    ) -> List[StickyNote]:
        """Get sticky notes with filters"""
        
        query = self.db.query(StickyNote).filter(StickyNote.org_id == org_id)
        
        if user_id:
            query = query.filter(StickyNote.user_id == user_id)
        
        if category:
            query = query.filter(StickyNote.category == category)
        
        if min_celebration_potential is not None:
            query = query.filter(StickyNote.celebration_potential >= min_celebration_potential)
        
        return query.order_by(desc(StickyNote.created_at)).limit(limit).all()
    
    def get_celebrations(
        self,
        org_id: str,
        user_id: Optional[str] = None,
        min_score: float = 0.7,
        limit: int = 10
    ) -> List[StickyNote]:
        """Get notes worth celebrating"""
        
        query = self.db.query(StickyNote).filter(
            and_(
                StickyNote.org_id == org_id,
                StickyNote.celebration_potential >= min_score
            )
        )
        
        if user_id:
            query = query.filter(StickyNote.user_id == user_id)
        
        return query.order_by(desc(StickyNote.celebration_potential)).limit(limit).all()
    
    def request_sharing_permission(self, note_id: str) -> StickyNote:
        """Request permission to share a note publicly"""
        
        note = self.db.query(StickyNote).filter(StickyNote.id == note_id).first()
        if not note:
            raise ValueError(f"Note {note_id} not found")
        
        note.permission_requested = True
        self.db.commit()
        self.db.refresh(note)
        
        return note
    
    def grant_sharing_permission(self, note_id: str) -> StickyNote:
        """Grant permission to share a note"""
        
        note = self.db.query(StickyNote).filter(StickyNote.id == note_id).first()
        if not note:
            raise ValueError(f"Note {note_id} not found")
        
        note.permission_granted = True
        note.permission_granted_at = datetime.utcnow()
        note.is_private = False
        self.db.commit()
        self.db.refresh(note)
        
        return note
    
    def deny_sharing_permission(self, note_id: str) -> StickyNote:
        """Deny permission to share a note"""
        
        note = self.db.query(StickyNote).filter(StickyNote.id == note_id).first()
        if not note:
            raise ValueError(f"Note {note_id} not found")
        
        note.permission_granted = False
        note.permission_denied_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(note)
        
        return note
    
    def update_note(self, note_id: str, **kwargs) -> StickyNote:
        """Update a sticky note"""
        
        note = self.db.query(StickyNote).filter(StickyNote.id == note_id).first()
        if not note:
            raise ValueError(f"Note {note_id} not found")
        
        for key, value in kwargs.items():
            if hasattr(note, key):
                setattr(note, key, value)
        
        self.db.commit()
        self.db.refresh(note)
        
        return note
    
    def delete_note(self, note_id: str) -> bool:
        """Delete a sticky note"""
        
        note = self.db.query(StickyNote).filter(StickyNote.id == note_id).first()
        if not note:
            return False
        
        self.db.delete(note)
        self.db.commit()
        
        return True

