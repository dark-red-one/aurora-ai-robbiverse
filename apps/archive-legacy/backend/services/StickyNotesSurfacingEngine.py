"""
Sticky Notes Surfacing Engine - Robbie's Intelligence Brain! 🧠✨
Knows exactly what Allan needs to see, when he needs to see it!
"""

import psycopg2
import psycopg2.extras
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import os
import re

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://allan@localhost/aurora")

class StickyNotesSurfacingEngine:
    """
    Surface/Submerge intelligence engine for sticky notes
    This is how Robbie remembers EVERYTHING and knows what to show!
    """
    
    def __init__(self):
        self.db = psycopg2.connect(DATABASE_URL)
        
    def surface_for_context(self, context: Dict) -> List[Dict]:
        """
        Main intelligence function - what should Allan see RIGHT NOW?
        
        Context can include:
        - current_time: datetime
        - calendar_events: List of upcoming events
        - mentioned_contacts: List of contact names/emails
        - mentioned_companies: List of company names
        - mentioned_deals: List of deal titles
        - open_files: List of file paths
        - current_location: String (e.g., "cursor", "gmail", "slack")
        """
        cursor = self.db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        notes_to_surface = []
        
        # Check for upcoming meetings
        if context.get("calendar_events"):
            notes_to_surface.extend(self._surface_for_meetings(context["calendar_events"], cursor))
        
        # Check for mentioned contacts
        if context.get("mentioned_contacts"):
            notes_to_surface.extend(self._surface_for_contacts(context["mentioned_contacts"], cursor))
        
        # Check for mentioned companies
        if context.get("mentioned_companies"):
            notes_to_surface.extend(self._surface_for_companies(context["mentioned_companies"], cursor))
        
        # Check for mentioned deals
        if context.get("mentioned_deals"):
            notes_to_surface.extend(self._surface_for_deals(context["mentioned_deals"], cursor))
        
        # Check for open files (code context)
        if context.get("open_files"):
            notes_to_surface.extend(self._surface_for_files(context["open_files"], cursor))
        
        # Check time-based triggers
        current_time = context.get("current_time", datetime.now())
        notes_to_surface.extend(self._surface_for_time(current_time, cursor))
        
        cursor.close()
        
        # Remove duplicates and sort by priority
        unique_notes = {n["id"]: n for n in notes_to_surface}.values()
        sorted_notes = sorted(unique_notes, key=lambda x: x.get("surface_priority", 0), reverse=True)
        
        # Actually surface them in the database
        self._mark_as_surfaced(sorted_notes)
        
        return sorted_notes[:10]  # Top 10 most relevant
    
    def _surface_for_meetings(self, events: List[Dict], cursor) -> List[Dict]:
        """Surface notes for upcoming meetings"""
        notes = []
        
        for event in events:
            attendees = event.get("attendees", [])
            title = event.get("title", "")
            start_time = event.get("start_time")
            
            # Find notes tagged with attendee names or meeting title
            for attendee in attendees:
                cursor.execute("""
                    SELECT *, 15 as surface_priority,
                           'Meeting with ' || %s || ' in ' || EXTRACT(MINUTE FROM (%s - NOW())) || ' minutes' as surface_reason
                    FROM sticky_notes
                    WHERE surface_status = 'submerged'
                    AND (
                        %s = ANY(context_tags)
                        OR content ILIKE %s
                        OR title ILIKE %s
                    )
                """, (attendee, start_time, attendee, f"%{attendee}%", f"%{attendee}%"))
                
                notes.extend([dict(row) for row in cursor.fetchall()])
        
        return notes
    
    def _surface_for_contacts(self, contacts: List[str], cursor) -> List[Dict]:
        """Surface notes when contacts are mentioned"""
        notes = []
        
        for contact in contacts:
            cursor.execute("""
                SELECT *, 12 as surface_priority,
                       'You mentioned ' || %s as surface_reason
                FROM sticky_notes
                WHERE surface_status = 'submerged'
                AND (
                    %s = ANY(context_tags)
                    OR %s = ANY(linked_contacts)
                    OR content ILIKE %s
                    OR title ILIKE %s
                )
            """, (contact, contact, contact, f"%{contact}%", f"%{contact}%"))
            
            notes.extend([dict(row) for row in cursor.fetchall()])
        
        return notes
    
    def _surface_for_companies(self, companies: List[str], cursor) -> List[Dict]:
        """Surface notes when companies are mentioned"""
        notes = []
        
        for company in companies:
            cursor.execute("""
                SELECT sn.*, 13 as surface_priority,
                       'You mentioned ' || c.name || ' ($' || d.value || ' deal)' as surface_reason
                FROM sticky_notes sn
                LEFT JOIN companies c ON c.name ILIKE %s
                LEFT JOIN deals d ON d.company_id = c.id AND d.id = ANY(sn.linked_deals)
                WHERE sn.surface_status = 'submerged'
                AND (
                    %s = ANY(sn.context_tags)
                    OR sn.content ILIKE %s
                    OR sn.title ILIKE %s
                )
            """, (f"%{company}%", company, f"%{company}%", f"%{company}%"))
            
            notes.extend([dict(row) for row in cursor.fetchall()])
        
        return notes
    
    def _surface_for_deals(self, deals: List[str], cursor) -> List[Dict]:
        """Surface notes when deals are mentioned"""
        notes = []
        
        for deal in deals:
            cursor.execute("""
                SELECT sn.*, 14 as surface_priority,
                       'Deal: ' || d.title || ' - $' || d.value || ' (' || d.close_probability || '% probability)' as surface_reason
                FROM sticky_notes sn
                JOIN deals d ON d.id = ANY(sn.linked_deals)
                WHERE sn.surface_status = 'submerged'
                AND d.title ILIKE %s
            """, (f"%{deal}%",))
            
            notes.extend([dict(row) for row in cursor.fetchall()])
        
        return notes
    
    def _surface_for_files(self, files: List[str], cursor) -> List[Dict]:
        """Surface notes when working in specific files"""
        notes = []
        
        for file_path in files:
            # Extract project/component from path
            tags = self._extract_tags_from_path(file_path)
            
            for tag in tags:
                cursor.execute("""
                    SELECT *, 8 as surface_priority,
                           'Working on ' || %s as surface_reason
                    FROM sticky_notes
                    WHERE surface_status = 'submerged'
                    AND %s = ANY(context_tags)
                """, (tag, tag))
                
                notes.extend([dict(row) for row in cursor.fetchall()])
        
        return notes
    
    def _surface_for_time(self, current_time: datetime, cursor) -> List[Dict]:
        """Surface notes based on time of day"""
        hour = current_time.hour
        notes = []
        
        # Morning startup (6am - 10am)
        if 6 <= hour < 10:
            cursor.execute("""
                SELECT *, 10 as surface_priority,
                       'Morning brief' as surface_reason
                FROM sticky_notes
                WHERE surface_status = 'submerged'
                AND 'morning_brief' = ANY(context_tags)
            """)
            notes.extend([dict(row) for row in cursor.fetchall()])
        
        # Afternoon check-in (2pm - 4pm)
        elif 14 <= hour < 16:
            cursor.execute("""
                SELECT *, 7 as surface_priority,
                       'Afternoon check-in' as surface_reason
                FROM sticky_notes
                WHERE surface_status = 'submerged'
                AND 'afternoon_checkin' = ANY(context_tags)
            """)
            notes.extend([dict(row) for row in cursor.fetchall()])
        
        # Evening wrap (5pm - 7pm)
        elif 17 <= hour < 19:
            cursor.execute("""
                SELECT *, 9 as surface_priority,
                       'Evening wrap-up' as surface_reason
                FROM sticky_notes
                WHERE surface_status = 'submerged'
                AND 'evening_wrap' = ANY(context_tags)
            """)
            notes.extend([dict(row) for row in cursor.fetchall()])
        
        return notes
    
    def _extract_tags_from_path(self, file_path: str) -> List[str]:
        """Extract relevant tags from file path"""
        tags = []
        
        # Project name
        if "aurora-ai-robbiverse" in file_path:
            tags.append("aurora")
        
        # Component/feature
        parts = file_path.split("/")
        for part in parts:
            if part in ["backend", "frontend", "services", "database", "robbie-app"]:
                tags.append(part)
            elif part.endswith(".py"):
                tags.append(part.replace(".py", ""))
            elif part.endswith(".tsx") or part.endswith(".ts"):
                tags.append(part.replace(".tsx", "").replace(".ts", ""))
        
        return tags
    
    def _mark_as_surfaced(self, notes: List[Dict]):
        """Mark notes as surfaced in database"""
        if not notes:
            return
        
        cursor = self.db.cursor()
        note_ids = [n["id"] for n in notes]
        
        cursor.execute("""
            UPDATE sticky_notes
            SET surface_status = 'surfaced',
                last_surfaced_at = NOW(),
                surface_count = surface_count + 1
            WHERE id = ANY(%s)
        """, (note_ids,))
        
        self.db.commit()
        cursor.close()
    
    def submerge_note(self, note_id: str, reason: str = "dismissed"):
        """Submerge a note (hide it)"""
        cursor = self.db.cursor()
        
        cursor.execute("""
            UPDATE sticky_notes
            SET surface_status = 'submerged',
                dismissed_count = dismissed_count + 1
            WHERE id = %s
        """, (note_id,))
        
        # Track the dismissal
        cursor.execute("""
            INSERT INTO sticky_note_surfaces (note_id, user_action, was_helpful)
            VALUES (%s, 'dismissed', false)
        """, (note_id,))
        
        self.db.commit()
        cursor.close()
    
    def mark_helpful(self, note_id: str, action: str = "clicked_link", time_to_action: int = None):
        """Mark a note as helpful"""
        cursor = self.db.cursor()
        
        cursor.execute("""
            INSERT INTO sticky_note_surfaces (note_id, user_action, was_helpful, time_to_action_seconds)
            VALUES (%s, %s, true, %s)
        """, (note_id, action, time_to_action))
        
        self.db.commit()
        cursor.close()
    
    def auto_surface_all_contexts(self):
        """
        Run this periodically to auto-surface notes based on current context
        This is the main intelligence loop!
        """
        context = {
            "current_time": datetime.now(),
            "calendar_events": self._get_upcoming_meetings(),
            # Add more context sources here
        }
        
        return self.surface_for_context(context)
    
    def _get_upcoming_meetings(self) -> List[Dict]:
        """Get meetings in next 2 hours"""
        cursor = self.db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        cursor.execute("""
            SELECT title, start_time, attendees
            FROM calendar_events
            WHERE start_time BETWEEN NOW() AND NOW() + INTERVAL '2 hours'
            ORDER BY start_time
        """)
        
        meetings = cursor.fetchall()
        cursor.close()
        
        return [dict(m) for m in meetings]
    
    def get_surfaced_notes(self) -> List[Dict]:
        """Get all currently surfaced notes"""
        cursor = self.db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        cursor.execute("""
            SELECT * FROM surfaced_notes_view
        """)
        
        notes = cursor.fetchall()
        cursor.close()
        
        return [dict(n) for n in notes]
    
    def learn_from_interactions(self):
        """
        Analyze past surfacing interactions to improve future decisions
        Machine learning loop!
        """
        cursor = self.db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Find patterns of helpful surfacing
        cursor.execute("""
            SELECT 
                sn.category,
                COUNT(*) as surface_count,
                SUM(CASE WHEN sns.was_helpful THEN 1 ELSE 0 END) as helpful_count,
                AVG(sns.time_to_action_seconds) as avg_time_to_action
            FROM sticky_notes sn
            JOIN sticky_note_surfaces sns ON sns.note_id = sn.id
            WHERE sns.surfaced_at >= NOW() - INTERVAL '30 days'
            GROUP BY sn.category
            HAVING COUNT(*) >= 3
        """)
        
        patterns = cursor.fetchall()
        
        for pattern in patterns:
            confidence = pattern["helpful_count"] / pattern["surface_count"] if pattern["surface_count"] > 0 else 0
            
            cursor.execute("""
                INSERT INTO sticky_note_learning (pattern_type, pattern_data, confidence_score, usage_count, success_count)
                VALUES ('helpful_factor', %s, %s, %s, %s)
                ON CONFLICT DO NOTHING
            """, (
                {
                    "category": pattern["category"],
                    "avg_time_to_action": pattern["avg_time_to_action"]
                },
                confidence,
                pattern["surface_count"],
                pattern["helpful_count"]
            ))
        
        self.db.commit()
        cursor.close()


# Convenience functions
def surface_now(context: Dict = None) -> List[Dict]:
    """Quick function to surface notes for current context"""
    engine = StickyNotesSurfacingEngine()
    if context is None:
        context = {"current_time": datetime.now()}
    return engine.surface_for_context(context)

def submerge(note_id: str):
    """Quick function to submerge (dismiss) a note"""
    engine = StickyNotesSurfacingEngine()
    engine.submerge_note(note_id)

def mark_as_helpful(note_id: str, action: str = "clicked_link"):
    """Quick function to mark note as helpful"""
    engine = StickyNotesSurfacingEngine()
    engine.mark_helpful(note_id, action)




