"""
Daily Brief Service - 5pm Digest with Time-Saved Metrics
"""
from typing import Dict, List
from datetime import datetime, timedelta, time
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
import openai
import os

from ..models.sticky_note import StickyNote
from ..models.touch_ready_queue import TouchReadyQueue
from ..models.meeting_health import MeetingHealth


class DailyBriefService:
    """Service for generating daily digest at 5pm"""
    
    def __init__(self, db: Session):
        self.db = db
        self.openai_key = os.getenv('OPENAI_API_KEY')
    
    async def generate_daily_brief(
        self,
        org_id: str,
        user_id: str,
        date: datetime = None
    ) -> Dict:
        """Generate comprehensive daily brief"""
        
        if date is None:
            date = datetime.now().date()
        
        # Get data for the day
        start_of_day = datetime.combine(date, time.min)
        end_of_day = datetime.combine(date, time.max)
        
        # Gather all the pieces
        celebrations = self._get_celebrations(org_id, start_of_day, end_of_day)
        touches = self._get_touch_stats(org_id, start_of_day, end_of_day)
        meetings = self._get_meeting_stats(org_id, start_of_day, end_of_day)
        time_saved = self._calculate_time_saved(touches, meetings)
        
        # Generate AI summary
        summary = await self._generate_summary(
            celebrations=celebrations,
            touches=touches,
            meetings=meetings,
            time_saved=time_saved
        )
        
        return {
            'date': date.isoformat(),
            'summary': summary,
            'celebrations': celebrations,
            'touches': touches,
            'meetings': meetings,
            'time_saved_minutes': time_saved,
            'time_saved_hours': round(time_saved / 60, 1),
            'generated_at': datetime.utcnow().isoformat()
        }
    
    def _get_celebrations(
        self,
        org_id: str,
        start_time: datetime,
        end_time: datetime
    ) -> List[Dict]:
        """Get celebration-worthy notes from today"""
        
        notes = self.db.query(StickyNote).filter(
            and_(
                StickyNote.org_id == org_id,
                StickyNote.created_at >= start_time,
                StickyNote.created_at <= end_time,
                StickyNote.celebration_potential >= 0.7
            )
        ).order_by(StickyNote.celebration_potential.desc()).limit(5).all()
        
        return [
            {
                'content': note.content,
                'celebration_potential': float(note.celebration_potential),
                'category': note.category,
                'created_at': note.created_at.isoformat()
            }
            for note in notes
        ]
    
    def _get_touch_stats(
        self,
        org_id: str,
        start_time: datetime,
        end_time: datetime
    ) -> Dict:
        """Get touch queue stats for today"""
        
        touches = self.db.query(TouchReadyQueue).filter(
            and_(
                TouchReadyQueue.org_id == org_id,
                TouchReadyQueue.created_at >= start_time,
                TouchReadyQueue.created_at <= end_time
            )
        ).all()
        
        sent_touches = [t for t in touches if t.status == 'sent']
        
        return {
            'generated': len(touches),
            'sent': len(sent_touches),
            'pending': len([t for t in touches if t.status == 'pending']),
            'avg_confidence': sum([float(t.ai_confidence or 0) for t in touches]) / len(touches) if touches else 0,
            'by_type': {
                'follow_up': len([t for t in sent_touches if t.touch_type == 'follow_up']),
                'check_in': len([t for t in sent_touches if t.touch_type == 'check_in']),
                'thank_you': len([t for t in sent_touches if t.touch_type == 'thank_you']),
            }
        }
    
    def _get_meeting_stats(
        self,
        org_id: str,
        start_time: datetime,
        end_time: datetime
    ) -> Dict:
        """Get meeting health stats for today"""
        
        meetings = self.db.query(MeetingHealth).filter(
            and_(
                MeetingHealth.org_id == org_id,
                MeetingHealth.created_at >= start_time,
                MeetingHealth.created_at <= end_time
            )
        ).all()
        
        if not meetings:
            return {
                'total': 0,
                'avg_health_score': 0,
                'healthy': 0,
                'problematic': 0,
                'total_duration_minutes': 0
            }
        
        return {
            'total': len(meetings),
            'avg_health_score': sum([m.health_score for m in meetings]) / len(meetings),
            'healthy': len([m for m in meetings if m.health_status == 'healthy']),
            'problematic': len([m for m in meetings if m.health_status == 'problematic']),
            'total_duration_minutes': sum([m.duration_minutes for m in meetings])
        }
    
    def _calculate_time_saved(
        self,
        touches: Dict,
        meetings: Dict
    ) -> int:
        """Calculate estimated time saved by AI assistance"""
        
        time_saved = 0
        
        # Time saved by AI-drafted touches (5 mins per touch)
        time_saved += touches['sent'] * 5
        
        # Time saved by meeting health recommendations
        # Assume we prevented 10 mins per problematic meeting caught
        time_saved += meetings.get('problematic', 0) * 10
        
        return time_saved
    
    async def _generate_summary(
        self,
        celebrations: List[Dict],
        touches: Dict,
        meetings: Dict,
        time_saved: int
    ) -> str:
        """Generate AI summary of the day"""
        
        if not self.openai_key:
            return self._generate_fallback_summary(celebrations, touches, meetings, time_saved)
        
        try:
            response = openai.chat.completions.create(
                model="gpt-4",
                messages=[
                    {
                        "role": "system",
                        "content": """You are Robbie, Allan's AI assistant. Generate a warm, celebratory daily brief summary.
                        
Style: Direct, warm, revenue-focused. Use emojis strategically (🎉 💪 🚀 ✅ 💰).
Tone: Celebrate wins, acknowledge progress, motivate for tomorrow.
Length: 2-3 sentences max.

Focus on:
- Biggest wins/celebrations
- Relationship touches sent
- Time saved by AI
- What to tackle tomorrow"""
                    },
                    {
                        "role": "user",
                        "content": f"""Generate daily brief summary:

Celebrations: {len(celebrations)} wins today
Touches: {touches['sent']} sent, {touches['pending']} pending
Meetings: {meetings['total']} meetings, avg health {meetings.get('avg_health_score', 0):.0f}/100
Time Saved: {time_saved} minutes

Top celebration: {celebrations[0]['content'] if celebrations else 'None'}"""
                    }
                ],
                temperature=0.7,
                max_tokens=150
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            print(f"AI summary generation failed: {e}")
            return self._generate_fallback_summary(celebrations, touches, meetings, time_saved)
    
    def _generate_fallback_summary(
        self,
        celebrations: List[Dict],
        touches: Dict,
        meetings: Dict,
        time_saved: int
    ) -> str:
        """Generate fallback summary without AI"""
        
        parts = []
        
        if celebrations:
            parts.append(f"🎉 {len(celebrations)} wins today!")
        
        if touches['sent'] > 0:
            parts.append(f"💪 Sent {touches['sent']} touches")
        
        if time_saved > 0:
            hours = time_saved / 60
            parts.append(f"⏰ Saved {hours:.1f} hours")
        
        if not parts:
            return "📊 Steady progress today. Keep building!"
        
        return " • ".join(parts) + " 🚀"
    
    def get_weekly_summary(
        self,
        org_id: str,
        user_id: str
    ) -> Dict:
        """Get weekly summary (last 7 days)"""
        
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=7)
        
        # Get all sticky notes from the week
        notes = self.db.query(StickyNote).filter(
            and_(
                StickyNote.org_id == org_id,
                StickyNote.created_at >= datetime.combine(start_date, time.min),
                StickyNote.created_at <= datetime.combine(end_date, time.max)
            )
        ).all()
        
        # Get all touches from the week
        touches = self.db.query(TouchReadyQueue).filter(
            and_(
                TouchReadyQueue.org_id == org_id,
                TouchReadyQueue.created_at >= datetime.combine(start_date, time.min),
                TouchReadyQueue.created_at <= datetime.combine(end_date, time.max)
            )
        ).all()
        
        # Get all meetings from the week
        meetings = self.db.query(MeetingHealth).filter(
            and_(
                MeetingHealth.org_id == org_id,
                MeetingHealth.created_at >= datetime.combine(start_date, time.min),
                MeetingHealth.created_at <= datetime.combine(end_date, time.max)
            )
        ).all()
        
        celebrations = [n for n in notes if n.celebration_potential and n.celebration_potential >= 0.7]
        sent_touches = [t for t in touches if t.status == 'sent']
        
        return {
            'period': f"{start_date.isoformat()} to {end_date.isoformat()}",
            'total_celebrations': len(celebrations),
            'total_touches_sent': len(sent_touches),
            'total_meetings': len(meetings),
            'avg_meeting_health': sum([m.health_score for m in meetings]) / len(meetings) if meetings else 0,
            'total_time_saved_hours': (len(sent_touches) * 5 + len([m for m in meetings if m.health_status == 'problematic']) * 10) / 60,
            'top_celebrations': [
                {'content': n.content, 'score': float(n.celebration_potential)}
                for n in sorted(celebrations, key=lambda x: x.celebration_potential, reverse=True)[:5]
            ]
        }
