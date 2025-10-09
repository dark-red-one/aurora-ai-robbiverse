"""
Meeting Health Service - Meeting Quality Scoring
"""
from typing import List, Dict, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_
from datetime import datetime

from ..models.meeting_health import MeetingHealth


class MeetingHealthService:
    """Service for scoring meeting health and providing recommendations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def score_meeting(
        self,
        org_id: str,
        calendar_event_id: str,
        has_agenda: bool,
        duration_minutes: int,
        attendee_count: int
    ) -> MeetingHealth:
        """Score a meeting's health"""
        
        # Calculate health score and identify issues
        score, issues, recommendations = self._calculate_health(
            has_agenda=has_agenda,
            duration_minutes=duration_minutes,
            attendee_count=attendee_count
        )
        
        # Determine status
        if score >= 80:
            status = 'healthy'
        elif score >= 60:
            status = 'warning'
        else:
            status = 'problematic'
        
        # Create or update health record
        health = MeetingHealth(
            org_id=org_id,
            calendar_event_id=calendar_event_id,
            has_agenda=has_agenda,
            duration_minutes=duration_minutes,
            attendee_count=attendee_count,
            health_score=score,
            health_status=status,
            issues=issues,
            recommendations=recommendations
        )
        
        self.db.add(health)
        self.db.commit()
        self.db.refresh(health)
        
        return health
    
    def _calculate_health(
        self,
        has_agenda: bool,
        duration_minutes: int,
        attendee_count: int
    ) -> Tuple[int, List[str], List[str]]:
        """Calculate meeting health score and generate recommendations"""
        
        score = 100
        issues = []
        recommendations = []
        
        # Check for agenda (critical!)
        if not has_agenda:
            score -= 30
            issues.append('no_agenda')
            recommendations.append('📋 Add an agenda before the meeting')
        
        # Check duration
        if duration_minutes > 60:
            score -= 20
            issues.append('too_long')
            recommendations.append(f'⏰ Meeting is {duration_minutes} mins - consider breaking into smaller sessions')
        elif duration_minutes > 45:
            score -= 10
            issues.append('long_duration')
            recommendations.append('⏰ Consider shortening to 30-45 mins')
        
        # Check attendee count
        if attendee_count > 8:
            score -= 25
            issues.append('too_many_attendees')
            recommendations.append(f'👥 {attendee_count} attendees - consider if everyone needs to be there')
        elif attendee_count > 5:
            score -= 10
            issues.append('many_attendees')
            recommendations.append('👥 Large group - ensure everyone has a reason to attend')
        
        # Check for "double whammy" - long meeting with many people
        if duration_minutes > 45 and attendee_count > 5:
            score -= 15
            issues.append('long_and_crowded')
            recommendations.append('🚨 Long meeting + many attendees = expensive! Consider alternatives')
        
        # Positive reinforcement
        if has_agenda and duration_minutes <= 30 and attendee_count <= 5:
            recommendations.append('✅ Great meeting setup! Keep it tight.')
        
        # Ensure score stays in bounds
        score = max(0, min(100, score))
        
        return score, issues, recommendations
    
    def get_health_by_event(self, calendar_event_id: str) -> MeetingHealth:
        """Get health score for a specific meeting"""
        
        return self.db.query(MeetingHealth).filter(
            MeetingHealth.calendar_event_id == calendar_event_id
        ).first()
    
    def get_problematic_meetings(
        self,
        org_id: str,
        limit: int = 20
    ) -> List[MeetingHealth]:
        """Get meetings with health issues"""
        
        return self.db.query(MeetingHealth).filter(
            and_(
                MeetingHealth.org_id == org_id,
                MeetingHealth.health_status.in_(['warning', 'problematic'])
            )
        ).order_by(MeetingHealth.health_score).limit(limit).all()
    
    def get_stats(self, org_id: str) -> Dict:
        """Get meeting health statistics"""
        
        all_meetings = self.db.query(MeetingHealth).filter(
            MeetingHealth.org_id == org_id
        ).all()
        
        if not all_meetings:
            return {
                'total_meetings': 0,
                'avg_health_score': 0,
                'healthy': 0,
                'warning': 0,
                'problematic': 0,
                'common_issues': {},
                'meetings_with_agenda': 0,
                'avg_duration': 0,
                'avg_attendees': 0
            }
        
        # Calculate common issues
        issue_counts = {}
        for meeting in all_meetings:
            for issue in meeting.issues:
                issue_counts[issue] = issue_counts.get(issue, 0) + 1
        
        return {
            'total_meetings': len(all_meetings),
            'avg_health_score': sum([m.health_score for m in all_meetings]) / len(all_meetings),
            'healthy': len([m for m in all_meetings if m.health_status == 'healthy']),
            'warning': len([m for m in all_meetings if m.health_status == 'warning']),
            'problematic': len([m for m in all_meetings if m.health_status == 'problematic']),
            'common_issues': issue_counts,
            'meetings_with_agenda': len([m for m in all_meetings if m.has_agenda]),
            'avg_duration': sum([m.duration_minutes for m in all_meetings]) / len(all_meetings),
            'avg_attendees': sum([m.attendee_count for m in all_meetings]) / len(all_meetings),
            'percentage_healthy': (len([m for m in all_meetings if m.health_status == 'healthy']) / len(all_meetings)) * 100
        }
    
    def bulk_score_meetings(
        self,
        org_id: str,
        meetings: List[Dict]
    ) -> List[MeetingHealth]:
        """Score multiple meetings at once"""
        
        results = []
        for meeting in meetings:
            health = self.score_meeting(
                org_id=org_id,
                calendar_event_id=meeting.get('calendar_event_id'),
                has_agenda=meeting.get('has_agenda', False),
                duration_minutes=meeting.get('duration_minutes', 60),
                attendee_count=meeting.get('attendee_count', 1)
            )
            results.append(health)
        
        return results
