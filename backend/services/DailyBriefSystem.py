"""
DailyBriefSystem.py
===================
Automated daily brief system with 3x daily summaries and outreach opportunities.

Delivers:
- Morning Brief (7am): Day ahead, priorities, top 3 outreach opportunities
- Afternoon Check-in (1pm): Progress update, blockers, quick wins
- Evening Digest (5pm): Day summary, time saved, wins, tomorrow prep

Features:
- Top 3 Outreach Opportunities (ranked by revenue potential)
- Time-saved metrics
- Task completion tracking
- Calendar analysis
- Deal pipeline updates
- Proactive suggestions

This keeps Allan informed and focused on what matters most.
"""

import os
import json
import logging
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class BriefType(Enum):
    """Types of briefs"""
    MORNING = "morning"
    AFTERNOON = "afternoon"
    EVENING = "evening"


@dataclass
class OutreachOpportunity:
    """A potential outreach opportunity"""
    contact_name: str
    company: str
    reason: str
    priority: int  # 1-10
    revenue_potential: float
    action: str
    context: Optional[str] = None
    last_interaction: Optional[datetime] = None
    
    def to_dict(self) -> Dict:
        """Convert to dictionary"""
        data = asdict(self)
        data['last_interaction'] = self.last_interaction.isoformat() if self.last_interaction else None
        return data


@dataclass
class TaskSummary:
    """Summary of tasks"""
    total: int = 0
    completed: int = 0
    in_progress: int = 0
    blocked: int = 0
    high_priority: int = 0
    
    @property
    def completion_rate(self) -> float:
        """Calculate completion rate"""
        return (self.completed / self.total * 100) if self.total > 0 else 0


@dataclass
class DailyBrief:
    """A daily brief"""
    brief_type: BriefType
    timestamp: datetime
    summary: str
    priorities: List[str]
    outreach_opportunities: List[OutreachOpportunity]
    task_summary: TaskSummary
    calendar_events: List[Dict]
    wins: List[str]
    blockers: List[str]
    time_saved_minutes: int
    suggestions: List[str]
    
    def to_dict(self) -> Dict:
        """Convert to dictionary"""
        data = {
            'brief_type': self.brief_type.value,
            'timestamp': self.timestamp.isoformat(),
            'summary': self.summary,
            'priorities': self.priorities,
            'outreach_opportunities': [opp.to_dict() for opp in self.outreach_opportunities],
            'task_summary': asdict(self.task_summary),
            'calendar_events': self.calendar_events,
            'wins': self.wins,
            'blockers': self.blockers,
            'time_saved_minutes': self.time_saved_minutes,
            'suggestions': self.suggestions
        }
        return data


class DailyBriefSystem:
    """
    Automated daily brief generation system
    """
    
    def __init__(self, data_dir: str = "/home/allan/aurora-ai-robbiverse/data/briefs"):
        self.data_dir = data_dir
        os.makedirs(data_dir, exist_ok=True)
        
        self.briefs_file = os.path.join(data_dir, "briefs.jsonl")
        
    async def _analyze_calendar(self) -> tuple[List[Dict], List[str]]:
        """
        Analyze calendar for upcoming events
        
        Returns:
            (events, priorities)
        """
        # TODO: Integrate with actual calendar API
        # For now, return mock data
        events = [
            {
                'time': '10:00 AM',
                'title': 'Sales call with Quest Nutrition',
                'duration': '30 min',
                'type': 'meeting'
            },
            {
                'time': '2:00 PM',
                'title': 'Product demo prep',
                'duration': '1 hour',
                'type': 'focus'
            }
        ]
        
        priorities = [
            "Close Quest Nutrition deal (potential $25k/year)",
            "Follow up with Cholula on pilot results",
            "Prepare Q4 revenue forecast"
        ]
        
        return events, priorities
    
    async def _get_task_summary(self) -> TaskSummary:
        """Get summary of tasks"""
        # TODO: Integrate with actual task system
        # For now, return mock data
        return TaskSummary(
            total=12,
            completed=5,
            in_progress=4,
            blocked=1,
            high_priority=3
        )
    
    async def _find_outreach_opportunities(self) -> List[OutreachOpportunity]:
        """
        Find top 3 outreach opportunities based on:
        - Last interaction date
        - Deal value
        - Engagement level
        - Strategic importance
        """
        # TODO: Integrate with CRM and AI analysis
        # For now, return mock opportunities
        opportunities = [
            OutreachOpportunity(
                contact_name="Sarah Chen",
                company="Quest Nutrition",
                reason="Silent for 5 days after positive demo",
                priority=10,
                revenue_potential=25000.0,
                action="Send pricing proposal + case study",
                context="Showed strong interest in real-time analytics",
                last_interaction=datetime.now() - timedelta(days=5)
            ),
            OutreachOpportunity(
                contact_name="Mike Rodriguez",
                company="Cholula Hot Sauce",
                reason="Pilot ending in 3 days, time to close",
                priority=9,
                revenue_potential=18000.0,
                action="Schedule expansion discussion",
                context="94% satisfaction score on pilot",
                last_interaction=datetime.now() - timedelta(days=2)
            ),
            OutreachOpportunity(
                contact_name="Jennifer Park",
                company="Simply Good Foods",
                reason="Warm intro from Quest contact",
                priority=8,
                revenue_potential=30000.0,
                action="Send personalized intro video",
                context="Also works with Quest, perfect reference",
                last_interaction=None
            )
        ]
        
        # Sort by priority and take top 3
        opportunities.sort(key=lambda x: x.priority, reverse=True)
        return opportunities[:3]
    
    async def _get_recent_wins(self) -> List[str]:
        """Get recent wins"""
        # TODO: Integrate with actual activity tracking
        return [
            "Closed $15k deal with Vital Proteins",
            "Positive testimonial from Cholula pilot",
            "2 warm intros from existing customers"
        ]
    
    async def _get_blockers(self) -> List[str]:
        """Get current blockers"""
        # TODO: Integrate with actual task/project system
        return [
            "Waiting on Quest legal review (5 days)",
            "Dashboard slow load times need optimization"
        ]
    
    async def _calculate_time_saved(self) -> int:
        """Calculate time saved by automation today"""
        # TODO: Track actual automation usage
        # For now, estimate based on common tasks
        return 127  # minutes
    
    async def _generate_suggestions(self, brief_type: BriefType) -> List[str]:
        """Generate proactive suggestions"""
        suggestions = []
        
        if brief_type == BriefType.MORNING:
            suggestions = [
                "Block 2-4pm for focused demo prep (no meetings)",
                "Send Quest follow-up before 11am while top of mind",
                "Review Cholula metrics before their check-in call"
            ]
        
        elif brief_type == BriefType.AFTERNOON:
            suggestions = [
                "Quick win: Send thank you to Vital Proteins decision maker",
                "Unblock: Ping Quest legal via champion contact",
                "Prep: Tomorrow's pitch needs pricing scenarios"
            ]
        
        elif brief_type == BriefType.EVENING:
            suggestions = [
                "Tomorrow's top priority: Close Cholula expansion",
                "Schedule: Block morning for Quest proposal",
                "Follow-up: 3 contacts need responses (flagged in CRM)"
            ]
        
        return suggestions
    
    async def generate_morning_brief(self) -> DailyBrief:
        """
        Generate morning brief (7am)
        - Day ahead preview
        - Top priorities
        - Top 3 outreach opportunities
        """
        logger.info("📅 Generating morning brief...")
        
        events, priorities = await self._analyze_calendar()
        task_summary = await self._get_task_summary()
        opportunities = await self._find_outreach_opportunities()
        suggestions = await self._generate_suggestions(BriefType.MORNING)
        
        summary = f"""Good morning! You have {len(events)} events today and {task_summary.high_priority} high-priority tasks.
Focus areas: Close deals, follow up on pilots, prep for demos."""
        
        brief = DailyBrief(
            brief_type=BriefType.MORNING,
            timestamp=datetime.now(),
            summary=summary,
            priorities=priorities,
            outreach_opportunities=opportunities,
            task_summary=task_summary,
            calendar_events=events,
            wins=[],
            blockers=await self._get_blockers(),
            time_saved_minutes=0,
            suggestions=suggestions
        )
        
        self._save_brief(brief)
        return brief
    
    async def generate_afternoon_brief(self) -> DailyBrief:
        """
        Generate afternoon check-in (1pm)
        - Progress update
        - Quick wins
        - Course corrections needed
        """
        logger.info("📊 Generating afternoon brief...")
        
        events, priorities = await self._analyze_calendar()
        task_summary = await self._get_task_summary()
        opportunities = await self._find_outreach_opportunities()
        wins = await self._get_recent_wins()
        blockers = await self._get_blockers()
        time_saved = await self._calculate_time_saved()
        suggestions = await self._generate_suggestions(BriefType.AFTERNOON)
        
        summary = f"""Afternoon check-in: {task_summary.completed}/{task_summary.total} tasks done ({task_summary.completion_rate:.0f}%).
{len(wins)} wins today. {len(blockers)} blockers need attention."""
        
        brief = DailyBrief(
            brief_type=BriefType.AFTERNOON,
            timestamp=datetime.now(),
            summary=summary,
            priorities=priorities,
            outreach_opportunities=opportunities,
            task_summary=task_summary,
            calendar_events=events,
            wins=wins,
            blockers=blockers,
            time_saved_minutes=time_saved,
            suggestions=suggestions
        )
        
        self._save_brief(brief)
        return brief
    
    async def generate_evening_brief(self) -> DailyBrief:
        """
        Generate evening digest (5pm)
        - Day summary
        - Wins and accomplishments
        - Time saved
        - Tomorrow prep
        """
        logger.info("🌙 Generating evening brief...")
        
        events, _ = await self._analyze_calendar()
        task_summary = await self._get_task_summary()
        opportunities = await self._find_outreach_opportunities()
        wins = await self._get_recent_wins()
        time_saved = await self._calculate_time_saved()
        suggestions = await self._generate_suggestions(BriefType.EVENING)
        
        # Tomorrow's priorities
        tomorrow_priorities = [
            "Close Cholula expansion (decision day)",
            "Send Quest pricing proposal",
            "Demo for Simply Good Foods"
        ]
        
        summary = f"""Day complete! {task_summary.completed} tasks done, {len(wins)} wins.
Robbie saved you {time_saved} minutes today ({time_saved/60:.1f} hours).
Tomorrow: {len(tomorrow_priorities)} high-impact priorities."""
        
        brief = DailyBrief(
            brief_type=BriefType.EVENING,
            timestamp=datetime.now(),
            summary=summary,
            priorities=tomorrow_priorities,
            outreach_opportunities=opportunities,
            task_summary=task_summary,
            calendar_events=events,
            wins=wins,
            blockers=[],
            time_saved_minutes=time_saved,
            suggestions=suggestions
        )
        
        self._save_brief(brief)
        return brief
    
    def _save_brief(self, brief: DailyBrief):
        """Save brief to file"""
        try:
            with open(self.briefs_file, 'a') as f:
                f.write(json.dumps(brief.to_dict()) + '\n')
            logger.info(f"✅ Saved {brief.brief_type.value} brief")
        except Exception as e:
            logger.error(f"Error saving brief: {e}")
    
    def format_brief_text(self, brief: DailyBrief) -> str:
        """Format brief as readable text"""
        lines = []
        
        # Header
        if brief.brief_type == BriefType.MORNING:
            lines.append("☀️ MORNING BRIEF")
        elif brief.brief_type == BriefType.AFTERNOON:
            lines.append("📊 AFTERNOON CHECK-IN")
        else:
            lines.append("🌙 EVENING DIGEST")
        
        lines.append(f"{brief.timestamp.strftime('%I:%M %p')}")
        lines.append("")
        
        # Summary
        lines.append(brief.summary)
        lines.append("")
        
        # Top 3 Outreach Opportunities
        lines.append("🎯 TOP 3 OUTREACH OPPORTUNITIES:")
        for i, opp in enumerate(brief.outreach_opportunities, 1):
            lines.append(f"{i}. {opp.contact_name} @ {opp.company}")
            lines.append(f"   💰 ${opp.revenue_potential:,.0f} potential")
            lines.append(f"   📍 {opp.reason}")
            lines.append(f"   ✅ {opp.action}")
            lines.append("")
        
        # Priorities
        if brief.priorities:
            lines.append("🔥 PRIORITIES:")
            for priority in brief.priorities:
                lines.append(f"• {priority}")
            lines.append("")
        
        # Task Summary
        lines.append("✅ TASKS:")
        lines.append(f"• Completed: {brief.task_summary.completed}/{brief.task_summary.total} ({brief.task_summary.completion_rate:.0f}%)")
        lines.append(f"• In Progress: {brief.task_summary.in_progress}")
        if brief.task_summary.blocked > 0:
            lines.append(f"• Blocked: {brief.task_summary.blocked}")
        lines.append("")
        
        # Wins
        if brief.wins:
            lines.append("🏆 WINS:")
            for win in brief.wins:
                lines.append(f"• {win}")
            lines.append("")
        
        # Blockers
        if brief.blockers:
            lines.append("⚠️ BLOCKERS:")
            for blocker in brief.blockers:
                lines.append(f"• {blocker}")
            lines.append("")
        
        # Time Saved
        if brief.time_saved_minutes > 0:
            hours = brief.time_saved_minutes / 60
            lines.append(f"⏱️ TIME SAVED: {brief.time_saved_minutes} min ({hours:.1f} hours)")
            lines.append("")
        
        # Suggestions
        if brief.suggestions:
            lines.append("💡 SUGGESTIONS:")
            for suggestion in brief.suggestions:
                lines.append(f"• {suggestion}")
            lines.append("")
        
        return "\n".join(lines)


# Singleton instance
_brief_system = None

def get_brief_system() -> DailyBriefSystem:
    """Get or create the daily brief system singleton"""
    global _brief_system
    if _brief_system is None:
        _brief_system = DailyBriefSystem()
    return _brief_system


# Example usage
if __name__ == "__main__":
    import asyncio
    
    async def test_briefs():
        system = get_brief_system()
        
        # Generate all three briefs
        print("\n" + "="*60)
        morning = await system.generate_morning_brief()
        print(system.format_brief_text(morning))
        
        print("\n" + "="*60)
        afternoon = await system.generate_afternoon_brief()
        print(system.format_brief_text(afternoon))
        
        print("\n" + "="*60)
        evening = await system.generate_evening_brief()
        print(system.format_brief_text(evening))
    
    asyncio.run(test_briefs())


