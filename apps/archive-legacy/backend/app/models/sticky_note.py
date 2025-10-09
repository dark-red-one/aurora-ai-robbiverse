"""
Sticky Notes Model - Memory & Celebration Tracking
"""
from sqlalchemy import Column, String, Text, Boolean, TIMESTAMP, ARRAY, Numeric, DECIMAL, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
import uuid

from ..core.database import Base


class StickyNote(Base):
    """Sticky note for capturing insights, achievements, and celebrations"""
    __tablename__ = "sticky_notes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id = Column(UUID(as_uuid=True), nullable=False)
    user_id = Column(UUID(as_uuid=True))
    
    # Content
    content = Column(Text, nullable=False)
    category = Column(String, CheckConstraint(
        "category IN ('achievement', 'feedback', 'decision', 'insight', 'personal', 'business', 'celebration')"
    ))
    
    # AI Scoring
    importance_score = Column(DECIMAL(3, 2), CheckConstraint("importance_score BETWEEN 0 AND 1"))
    celebration_potential = Column(DECIMAL(3, 2), CheckConstraint("celebration_potential BETWEEN 0 AND 1"))
    sharing_potential = Column(DECIMAL(3, 2), CheckConstraint("sharing_potential BETWEEN 0 AND 1"))
    emotional_tone = Column(String, CheckConstraint(
        "emotional_tone IN ('positive', 'neutral', 'concerned', 'excited')"
    ))
    
    # Mentions & Context
    people_mentioned = Column(ARRAY(Text), default=[])
    companies_mentioned = Column(ARRAY(Text), default=[])
    projects_mentioned = Column(ARRAY(Text), default=[])
    context = Column(Text)
    
    # Source tracking
    source_type = Column(String, CheckConstraint(
        "source_type IN ('chat', 'email', 'meeting', 'slack', 'manual')"
    ))
    source_metadata = Column(JSONB, default={})
    
    # Privacy & Permissions
    is_private = Column(Boolean, default=True)
    permission_requested = Column(Boolean, default=False)
    permission_granted = Column(Boolean, default=False)
    permission_granted_at = Column(TIMESTAMP(timezone=True))
    permission_denied_at = Column(TIMESTAMP(timezone=True))
    
    # Visual
    color = Column(String, default='yellow')
    tags = Column(ARRAY(Text), default=[])
    
    # Relations
    related_to_id = Column(UUID(as_uuid=True))
    related_to_type = Column(String)
    
    # Timestamps
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': str(self.id),
            'org_id': str(self.org_id),
            'user_id': str(self.user_id) if self.user_id else None,
            'content': self.content,
            'category': self.category,
            'importance_score': float(self.importance_score) if self.importance_score else None,
            'celebration_potential': float(self.celebration_potential) if self.celebration_potential else None,
            'sharing_potential': float(self.sharing_potential) if self.sharing_potential else None,
            'emotional_tone': self.emotional_tone,
            'people_mentioned': self.people_mentioned,
            'companies_mentioned': self.companies_mentioned,
            'projects_mentioned': self.projects_mentioned,
            'context': self.context,
            'source_type': self.source_type,
            'source_metadata': self.source_metadata,
            'is_private': self.is_private,
            'permission_requested': self.permission_requested,
            'permission_granted': self.permission_granted,
            'permission_granted_at': self.permission_granted_at.isoformat() if self.permission_granted_at else None,
            'permission_denied_at': self.permission_denied_at.isoformat() if self.permission_denied_at else None,
            'color': self.color,
            'tags': self.tags,
            'related_to_id': str(self.related_to_id) if self.related_to_id else None,
            'related_to_type': self.related_to_type,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

