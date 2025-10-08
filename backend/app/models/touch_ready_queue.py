"""
Touch Ready Queue Model - AI-Drafted Follow-ups
"""
from sqlalchemy import Column, String, Text, TIMESTAMP, CheckConstraint, DECIMAL
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
import uuid

from ..core.database import Base


class TouchReadyQueue(Base):
    """AI-drafted follow-up messages ready to send"""
    __tablename__ = "touch_ready_queue"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id = Column(UUID(as_uuid=True), nullable=False)
    contact_id = Column(UUID(as_uuid=True), nullable=False)
    user_id = Column(UUID(as_uuid=True))
    
    # Touch details
    touch_type = Column(String, default='follow_up', CheckConstraint(
        "touch_type IN ('follow_up', 'check_in', 'thank_you', 'congratulations', 'introduction', 'reconnect')"
    ))
    priority = Column(String, default='medium', CheckConstraint(
        "priority IN ('low', 'medium', 'high', 'urgent')"
    ))
    
    # AI-generated content
    suggested_message = Column(Text)
    ai_confidence = Column(DECIMAL(3, 2), CheckConstraint("ai_confidence BETWEEN 0 AND 1"))
    reason = Column(Text)  # Why this touch is suggested
    context = Column(JSONB, default={})
    
    # Status tracking
    status = Column(String, default='pending', CheckConstraint(
        "status IN ('pending', 'approved', 'sent', 'dismissed')"
    ))
    scheduled_for = Column(TIMESTAMP(timezone=True))
    sent_at = Column(TIMESTAMP(timezone=True))
    dismissed_at = Column(TIMESTAMP(timezone=True))
    
    # Timestamps
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': str(self.id),
            'org_id': str(self.org_id),
            'contact_id': str(self.contact_id),
            'user_id': str(self.user_id) if self.user_id else None,
            'touch_type': self.touch_type,
            'priority': self.priority,
            'suggested_message': self.suggested_message,
            'ai_confidence': float(self.ai_confidence) if self.ai_confidence else None,
            'reason': self.reason,
            'context': self.context,
            'status': self.status,
            'scheduled_for': self.scheduled_for.isoformat() if self.scheduled_for else None,
            'sent_at': self.sent_at.isoformat() if self.sent_at else None,
            'dismissed_at': self.dismissed_at.isoformat() if self.dismissed_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

