"""
Touch Ready Queue Service - AI-Drafted Follow-ups
"""
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_
import openai
import os

from ..models.touch_ready_queue import TouchReadyQueue


class TouchReadyService:
    """Service for managing AI-drafted follow-up touches"""
    
    def __init__(self, db: Session):
        self.db = db
        self.openai_key = os.getenv('OPENAI_API_KEY')
    
    async def generate_touch(
        self,
        org_id: str,
        user_id: str,
        contact_id: str,
        contact_name: str,
        contact_context: Dict,
        touch_type: str = 'follow_up'
    ) -> TouchReadyQueue:
        """Generate an AI-drafted touch for a contact"""
        
        # Generate AI message
        ai_result = await self._generate_message(
            contact_name=contact_name,
            contact_context=contact_context,
            touch_type=touch_type
        )
        
        # Create touch entry
        touch = TouchReadyQueue(
            org_id=org_id,
            user_id=user_id,
            contact_id=contact_id,
            touch_type=touch_type,
            priority=ai_result.get('priority', 'medium'),
            suggested_message=ai_result.get('message'),
            ai_confidence=ai_result.get('confidence', 0.8),
            reason=ai_result.get('reason'),
            context=contact_context,
            status='pending'
        )
        
        self.db.add(touch)
        self.db.commit()
        self.db.refresh(touch)
        
        return touch
    
    async def _generate_message(
        self,
        contact_name: str,
        contact_context: Dict,
        touch_type: str
    ) -> Dict:
        """Use AI to generate a personalized follow-up message"""
        
        if not self.openai_key:
            return {
                'message': f"Hi {contact_name}, just wanted to check in!",
                'confidence': 0.3,
                'reason': "No AI available - generic message",
                'priority': 'medium'
            }
        
        try:
            # Build context string
            context_str = "\n".join([
                f"- {k}: {v}" for k, v in contact_context.items()
            ])
            
            response = openai.chat.completions.create(
                model="gpt-4",
                messages=[
                    {
                        "role": "system",
                        "content": """You are Allan's AI copilot helping draft follow-up messages.
                        
Allan is the founder of TestPilot CPG, helping CPG brands optimize retail execution.
His personality: Direct, authentic, revenue-focused, builds trust fast.

Generate a personalized follow-up message and return JSON with:
- message: The actual message to send (2-4 sentences, warm but professional)
- confidence: 0.0-1.0 (how confident are you this is the right message?)
- reason: Why this follow-up makes sense now (1 sentence)
- priority: low|medium|high|urgent

Touch types:
- follow_up: After a meeting or conversation
- check_in: Periodic relationship maintenance
- thank_you: After they did something helpful
- congratulations: They achieved something
- introduction: Connecting them with someone
- reconnect: Haven't talked in a while

Make it sound like Allan - warm, direct, value-focused. No corporate speak."""
                    },
                    {
                        "role": "user",
                        "content": f"""Contact: {contact_name}
Touch type: {touch_type}

Context:
{context_str}

Draft a {touch_type} message."""
                    }
                ],
                temperature=0.7,
                response_format={"type": "json_object"}
            )
            
            import json
            return json.loads(response.choices[0].message.content)
            
        except Exception as e:
            print(f"AI message generation failed: {e}")
            return {
                'message': f"Hi {contact_name}, wanted to reach out!",
                'confidence': 0.3,
                'reason': f"AI generation failed: {e}",
                'priority': 'medium'
            }
    
    def get_pending_touches(
        self,
        org_id: str,
        user_id: Optional[str] = None,
        priority: Optional[str] = None,
        limit: int = 20
    ) -> List[TouchReadyQueue]:
        """Get pending touches ready to review"""
        
        query = self.db.query(TouchReadyQueue).filter(
            and_(
                TouchReadyQueue.org_id == org_id,
                TouchReadyQueue.status == 'pending'
            )
        )
        
        if user_id:
            query = query.filter(TouchReadyQueue.user_id == user_id)
        
        if priority:
            query = query.filter(TouchReadyQueue.priority == priority)
        
        return query.order_by(desc(TouchReadyQueue.created_at)).limit(limit).all()
    
    def approve_touch(self, touch_id: str, scheduled_for: Optional[datetime] = None) -> TouchReadyQueue:
        """Approve a touch for sending"""
        
        touch = self.db.query(TouchReadyQueue).filter(TouchReadyQueue.id == touch_id).first()
        if not touch:
            raise ValueError(f"Touch {touch_id} not found")
        
        touch.status = 'approved'
        touch.scheduled_for = scheduled_for or datetime.utcnow()
        self.db.commit()
        self.db.refresh(touch)
        
        return touch
    
    def mark_sent(self, touch_id: str) -> TouchReadyQueue:
        """Mark a touch as sent"""
        
        touch = self.db.query(TouchReadyQueue).filter(TouchReadyQueue.id == touch_id).first()
        if not touch:
            raise ValueError(f"Touch {touch_id} not found")
        
        touch.status = 'sent'
        touch.sent_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(touch)
        
        return touch
    
    def dismiss_touch(self, touch_id: str) -> TouchReadyQueue:
        """Dismiss a touch (not sending)"""
        
        touch = self.db.query(TouchReadyQueue).filter(TouchReadyQueue.id == touch_id).first()
        if not touch:
            raise ValueError(f"Touch {touch_id} not found")
        
        touch.status = 'dismissed'
        touch.dismissed_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(touch)
        
        return touch
    
    def update_message(self, touch_id: str, new_message: str) -> TouchReadyQueue:
        """Update the message (Allan can edit before sending)"""
        
        touch = self.db.query(TouchReadyQueue).filter(TouchReadyQueue.id == touch_id).first()
        if not touch:
            raise ValueError(f"Touch {touch_id} not found")
        
        touch.suggested_message = new_message
        self.db.commit()
        self.db.refresh(touch)
        
        return touch
    
    def get_stats(self, org_id: str, days: int = 30) -> Dict:
        """Get touch queue statistics"""
        
        since = datetime.utcnow() - timedelta(days=days)
        
        all_touches = self.db.query(TouchReadyQueue).filter(
            and_(
                TouchReadyQueue.org_id == org_id,
                TouchReadyQueue.created_at >= since
            )
        ).all()
        
        return {
            'total_generated': len(all_touches),
            'pending': len([t for t in all_touches if t.status == 'pending']),
            'approved': len([t for t in all_touches if t.status == 'approved']),
            'sent': len([t for t in all_touches if t.status == 'sent']),
            'dismissed': len([t for t in all_touches if t.status == 'dismissed']),
            'avg_confidence': sum([float(t.ai_confidence or 0) for t in all_touches]) / len(all_touches) if all_touches else 0,
            'by_type': {
                'follow_up': len([t for t in all_touches if t.touch_type == 'follow_up']),
                'check_in': len([t for t in all_touches if t.touch_type == 'check_in']),
                'thank_you': len([t for t in all_touches if t.touch_type == 'thank_you']),
                'congratulations': len([t for t in all_touches if t.touch_type == 'congratulations']),
                'introduction': len([t for t in all_touches if t.touch_type == 'introduction']),
                'reconnect': len([t for t in all_touches if t.touch_type == 'reconnect']),
            },
            'by_priority': {
                'low': len([t for t in all_touches if t.priority == 'low']),
                'medium': len([t for t in all_touches if t.priority == 'medium']),
                'high': len([t for t in all_touches if t.priority == 'high']),
                'urgent': len([t for t in all_touches if t.priority == 'urgent']),
            }
        }

