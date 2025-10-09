"""
Meeting Health Model - Meeting Quality Scoring
"""
from sqlalchemy import Column, String, Integer, TIMESTAMP, CheckConstraint, ARRAY, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from ..core.database import Base


class MeetingHealth(Base):
    """Meeting health scores and recommendations"""
    __tablename__ = "meeting_health"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id = Column(UUID(as_uuid=True), nullable=False)
    calendar_event_id = Column(UUID(as_uuid=True))
    
    # Health metrics
    has_agenda = Column(Boolean, default=False)
    duration_minutes = Column(Integer)
    attendee_count = Column(Integer)
    health_score = Column(Integer, CheckConstraint("health_score BETWEEN 0 AND 100"))
    health_status = Column(String, CheckConstraint(
        "health_status IN ('healthy', 'warning', 'problematic')"
    ))
    
    # Issues and recommendations
    issues = Column(ARRAY(Text), default=[])
    recommendations = Column(ARRAY(Text), default=[])
    
    # Timestamps
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': str(self.id),
            'org_id': str(self.org_id),
            'calendar_event_id': str(self.calendar_event_id) if self.calendar_event_id else None,
            'has_agenda': self.has_agenda,
            'duration_minutes': self.duration_minutes,
            'attendee_count': self.attendee_count,
            'health_score': self.health_score,
            'health_status': self.health_status,
            'issues': self.issues,
            'recommendations': self.recommendations,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

