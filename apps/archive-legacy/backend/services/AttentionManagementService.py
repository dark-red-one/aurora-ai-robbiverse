"""
Attention Management Service - 70% Important / 30% Urgent Quick Wins 🎯
Intelligently surfaces what Allan should focus on RIGHT NOW

Enhanced with:
- Directive Capture (AllanBot training!)
- Risk Scoring (Protect the President!)
- Data Sync integration
"""

import psycopg2
import psycopg2.extras
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import os
import sys

# Add backend/services to path for imports
sys.path.append(os.path.dirname(__file__))

try:
    from DirectiveCaptureService import DirectiveCaptureService
    from PrioritiesEngineService import PrioritiesEngine
except ImportError:
    # Graceful degradation if services not available
    DirectiveCaptureService = None
    PrioritiesEngine = None

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://allan@localhost/aurora")

class AttentionManagementService:
    """
    The 70/30 Rule:
    - 70% IMPORTANT (move the needle, strategic, high-value)
    - 30% URGENT (quick wins, time-sensitive, feel-good completions)
    
    Auto-task creation: Critical email responses become tasks
    Auto-task removal: Task removed when email is replied to
    """
    
    def __init__(self):
        self.db = psycopg2.connect(DATABASE_URL)
        
        # Initialize enhanced services
        self.directive_capture = DirectiveCaptureService() if DirectiveCaptureService else None
        self.priorities_engine = PrioritiesEngine() if PrioritiesEngine else None
    
    def get_attention_dashboard(self) -> Dict:
        """
        Get the complete attention dashboard
        Returns top 25 messages, top 10 tasks, top 25 stickies
        Balanced 70% important / 30% urgent
        
        Enhanced with:
        - Risk scoring on all items
        - Directive capture from recent conversations
        - Auto-priority adjustment based on risk
        """
        cursor = self.db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Get top 25 messages (emails, etc.)
        messages = self._get_top25_messages(cursor)
        
        # Add risk scoring to messages
        if self.priorities_engine:
            messages = self._add_risk_scores(messages)
        
        # Get top 10 tasks
        tasks = self._get_top10_tasks(cursor)
        
        # Get top 25 sticky notes
        stickies = self._get_top25_stickies(cursor)
        
        # Process recent conversations for directives
        directives = []
        if self.directive_capture:
            directives = self._extract_recent_directives(cursor)
        
        cursor.close()
        
        # Calculate attention balance
        important_count = sum(1 for m in messages if m.get('category') == 'important')
        urgent_count = sum(1 for m in messages if m.get('category') == 'urgent')
        
        return {
            "messages": messages,
            "tasks": tasks,
            "stickies": stickies,
            "directives": directives,  # NEW: Captured directives
            "attention_balance": {
                "important_percentage": round((important_count / len(messages) * 100) if messages else 0, 1),
                "urgent_percentage": round((urgent_count / len(messages) * 100) if messages else 0, 1),
                "target": "70% important / 30% urgent quick wins"
            },
            "generated_at": datetime.now().isoformat()
        }
    
    def _get_top25_messages(self, cursor) -> List[Dict]:
        """
        Get top 25 messages with 70/30 important-urgent balance
        Auto-creates tasks for critical emails needing response
        """
        cursor.execute("""
            WITH message_scores AS (
                SELECT 
                    m.*,
                    CASE 
                        -- IMPORTANT (70%) - Strategic, high-value
                        WHEN m.subject ILIKE '%deal%' OR m.subject ILIKE '%contract%' THEN 'important'
                        WHEN m.subject ILIKE '%revenue%' OR m.subject ILIKE '%$%' THEN 'important'
                        WHEN m.from_vip = true THEN 'important'
                        WHEN m.tags @> ARRAY['strategic', 'revenue', 'partnership'] THEN 'important'
                        
                        -- URGENT (30%) - Quick wins, time-sensitive
                        WHEN m.subject ILIKE '%urgent%' OR m.subject ILIKE '%asap%' THEN 'urgent'
                        WHEN m.needs_response = true AND m.received_at > NOW() - INTERVAL '24 hours' THEN 'urgent'
                        WHEN m.subject ILIKE '%meeting%' AND m.received_at > NOW() - INTERVAL '4 hours' THEN 'urgent'
                        WHEN m.tags @> ARRAY['quick', 'reply', 'confirm'] THEN 'urgent'
                        
                        ELSE 'normal'
                    END AS category,
                    
                    -- Priority scoring
                    CASE 
                        WHEN m.from_vip = true THEN 100
                        WHEN m.subject ILIKE '%deal%' OR m.subject ILIKE '%contract%' THEN 90
                        WHEN m.needs_response = true THEN 80
                        WHEN m.subject ILIKE '%urgent%' THEN 70
                        WHEN m.received_at > NOW() - INTERVAL '2 hours' THEN 60
                        ELSE 50
                    END AS priority_score,
                    
                    -- Quick win potential (for urgent category)
                    CASE 
                        WHEN LENGTH(m.body) < 500 THEN true  -- Short email = quick response
                        WHEN m.subject ILIKE '%confirm%' OR m.subject ILIKE '%yes/no%' THEN true
                        WHEN m.tags @> ARRAY['quick'] THEN true
                        ELSE false
                    END AS is_quick_win
                    
                FROM messages m
                WHERE m.archived = false
                AND m.replied_to = false
                ORDER BY priority_score DESC, received_at DESC
            ),
            balanced_messages AS (
                -- Take top 70% important
                (SELECT * FROM message_scores WHERE category = 'important' ORDER BY priority_score DESC LIMIT 18)
                UNION ALL
                -- Take top 30% urgent (prioritize quick wins)
                (SELECT * FROM message_scores WHERE category = 'urgent' ORDER BY is_quick_win DESC, priority_score DESC LIMIT 7)
            )
            SELECT * FROM balanced_messages
            ORDER BY priority_score DESC, received_at DESC
            LIMIT 25
        """)
        
        messages = [dict(row) for row in cursor.fetchall()]
        
        # Auto-create tasks for critical emails needing response
        for msg in messages:
            if msg.get('needs_response') and msg.get('priority_score', 0) >= 80:
                self._auto_create_email_task(cursor, msg)
        
        return messages
    
    def _get_top10_tasks(self, cursor) -> List[Dict]:
        """
        Get top 10 tasks prioritized by revenue impact and urgency
        Auto-removes tasks when corresponding email is replied to
        """
        cursor.execute("""
            SELECT 
                t.*,
                CASE 
                    WHEN t.tags @> ARRAY['revenue', 'deal'] THEN '💰 Revenue'
                    WHEN t.due_date < NOW() THEN '🔴 Overdue'
                    WHEN t.due_date < NOW() + INTERVAL '24 hours' THEN '🟡 Due Soon'
                    WHEN t.estimated_minutes <= 15 THEN '⚡ Quick Win'
                    ELSE '🎯 Important'
                END AS task_type,
                
                CASE 
                    WHEN t.tags @> ARRAY['revenue', 'deal'] THEN 100
                    WHEN t.due_date < NOW() THEN 95
                    WHEN t.due_date < NOW() + INTERVAL '4 hours' THEN 90
                    WHEN t.due_date < NOW() + INTERVAL '24 hours' THEN 80
                    WHEN t.estimated_minutes <= 15 THEN 70
                    ELSE 50
                END + COALESCE(t.priority, 0) AS computed_priority,
                
                t.estimated_minutes <= 15 AS is_quick_win
                
            FROM tasks t
            WHERE t.status != 'completed'
            AND t.status != 'cancelled'
            ORDER BY computed_priority DESC, due_date ASC NULLS LAST
            LIMIT 10
        """)
        
        tasks = [dict(row) for row in cursor.fetchall()]
        
        # Check for auto-removal (email replied to)
        for task in tasks:
            if task.get('linked_email_id'):
                self._check_email_replied_and_remove_task(cursor, task)
        
        return tasks
    
    def _get_top25_stickies(self, cursor) -> List[Dict]:
        """
        Get top 25 sticky notes with smart prioritization
        Allan's notes always visible, meeting preps auto-decay
        """
        cursor.execute("""
            WITH prioritized_notes AS (
                SELECT 
                    sn.*,
                    CASE 
                        -- Allan's notes always at top
                        WHEN sn.created_by = 'allan' THEN 100
                        
                        -- Meeting prep notes (high priority before meeting, decay after)
                        WHEN sn.category = 'meeting_prep' AND sn.updated_at > NOW() - INTERVAL '3 hours' THEN 90
                        
                        -- Revenue-related (deals, pipeline)
                        WHEN sn.category IN ('deals', 'pipeline', 'opportunities') THEN 85
                        
                        -- High priority surfaced notes
                        WHEN sn.surface_priority >= 15 THEN 80
                        
                        -- Important surfaced notes
                        WHEN sn.surface_priority >= 10 AND sn.surface_status = 'surfaced' THEN 70
                        
                        -- Recently updated
                        WHEN sn.updated_at > NOW() - INTERVAL '24 hours' THEN 60
                        
                        -- Regular surfaced
                        WHEN sn.surface_status = 'surfaced' THEN 50
                        
                        ELSE 40
                    END + COALESCE(sn.surface_priority, 0) AS computed_priority,
                    
                    -- Auto-decay meeting preps 3 hours after last update
                    CASE 
                        WHEN sn.category = 'meeting_prep' AND sn.updated_at < NOW() - INTERVAL '3 hours' 
                        THEN 'auto_decayed'
                        ELSE sn.surface_status
                    END AS effective_status
                    
                FROM sticky_notes sn
                WHERE sn.surface_status != 'dismissed'
            )
            SELECT 
                pn.*,
                CASE 
                    WHEN pn.computed_priority >= 100 THEN '📌 Always Visible'
                    WHEN pn.computed_priority >= 90 THEN '🔴 Critical'
                    WHEN pn.computed_priority >= 80 THEN '💰 Revenue Focus'
                    WHEN pn.computed_priority >= 70 THEN '🟡 High Priority'
                    ELSE '🟢 Active'
                END AS display_category
            FROM prioritized_notes pn
            ORDER BY computed_priority DESC, updated_at DESC
            LIMIT 25
        """)
        
        return [dict(row) for row in cursor.fetchall()]
    
    def _auto_create_email_task(self, cursor, message: Dict):
        """
        Auto-create task for critical emails needing response
        Linked to email so it can be auto-removed when replied
        """
        # Check if task already exists for this email
        cursor.execute("""
            SELECT id FROM tasks 
            WHERE linked_email_id = %s 
            AND status != 'completed'
            AND status != 'cancelled'
        """, (message.get('id'),))
        
        if cursor.fetchone():
            return  # Task already exists
        
        # Create task
        cursor.execute("""
            INSERT INTO tasks (
                title, 
                description, 
                priority, 
                due_date,
                estimated_minutes,
                linked_email_id,
                tags,
                status
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, 'pending'
            )
            RETURNING id
        """, (
            f"Reply to: {message.get('subject', 'Email')}",
            f"From: {message.get('from_email', 'Unknown')}",
            message.get('priority_score', 50),
            message.get('received_at') + timedelta(hours=24),  # Due in 24 hours
            15,  # Estimate 15 minutes
            message.get('id'),
            ['email_response', 'auto_created'],
        ))
        
        self.db.commit()
    
    def _check_email_replied_and_remove_task(self, cursor, task: Dict):
        """
        Check if linked email has been replied to
        If yes, auto-complete the task
        """
        if not task.get('linked_email_id'):
            return
        
        cursor.execute("""
            SELECT replied_to FROM messages 
            WHERE id = %s
        """, (task['linked_email_id'],))
        
        result = cursor.fetchone()
        if result and result['replied_to']:
            # Email was replied to - auto-complete task
            cursor.execute("""
                UPDATE tasks 
                SET status = 'completed',
                    completed_at = NOW(),
                    completion_note = 'Auto-completed: Email replied to'
                WHERE id = %s
            """, (task['id'],))
            
            self.db.commit()
    
    def get_attention_balance_report(self) -> Dict:
        """
        Analyze current attention balance
        Ensure we're hitting 70% important / 30% urgent targets
        """
        dashboard = self.get_attention_dashboard()
        
        messages = dashboard['messages']
        important = [m for m in messages if m.get('category') == 'important']
        urgent = [m for m in messages if m.get('category') == 'urgent']
        quick_wins = [m for m in urgent if m.get('is_quick_win')]
        
        return {
            "current_balance": {
                "important": len(important),
                "important_pct": round(len(important) / len(messages) * 100, 1) if messages else 0,
                "urgent": len(urgent),
                "urgent_pct": round(len(urgent) / len(messages) * 100, 1) if messages else 0,
                "quick_wins": len(quick_wins)
            },
            "target_balance": {
                "important_pct": 70,
                "urgent_pct": 30,
                "quick_wins_goal": "~7-8 items (30% of 25)"
            },
            "on_target": abs(len(important) / len(messages) * 100 - 70) < 10 if messages else False,
            "recommendation": self._get_balance_recommendation(len(important), len(urgent), len(messages))
        }
    
    def _get_balance_recommendation(self, important_count: int, urgent_count: int, total: int) -> str:
        """Get recommendation for attention balance adjustment"""
        if total == 0:
            return "No messages to analyze"
        
        important_pct = important_count / total * 100
        
        if important_pct > 80:
            return "⚠️ Too much important work - add some quick wins for momentum!"
        elif important_pct < 60:
            return "⚠️ Too many urgent items - focus on strategic important work!"
        else:
            return "✅ Great balance! 70% important strategic work, 30% urgent quick wins"


# Convenience functions
def get_attention_dashboard() -> Dict:
    """Quick function to get full attention dashboard"""
    service = AttentionManagementService()
    return service.get_attention_dashboard()

def get_balance_report() -> Dict:
    """Quick function to check attention balance"""
    service = AttentionManagementService()
    return service.get_attention_balance_report()


    def _add_risk_scores(self, messages: List[Dict]) -> List[Dict]:
        """
        Add risk scoring to messages using PrioritiesEngine
        High-risk items get priority boost
        """
        for message in messages:
            risk_score = self.priorities_engine.calculate_risk({
                'reputational': 8 if message.get('from_vip') else 5,
                'financial': 9 if 'deal' in message.get('subject', '').lower() else 5,
                'temporal': 10 if message.get('needs_response') else 3,
                'personal': 3
            })
            
            message['risk_score'] = risk_score
            message['risk_level'] = 'HIGH' if risk_score >= 7 else 'MEDIUM' if risk_score >= 5 else 'LOW'
            
            # Boost priority for high-risk items
            if risk_score >= 7:
                message['priority_score'] = message.get('priority_score', 50) + 30
        
        return messages
    
    def _extract_recent_directives(self, cursor) -> List[Dict]:
        """
        Extract directives from recent conversations
        Creates tasks automatically for actionable directives
        """
        # Get recent conversations
        cursor.execute("""
            SELECT c.id, c.title, c.created_at,
                   array_agg(m.content ORDER BY m.created_at) as messages
            FROM conversations c
            JOIN messages m ON m.conversation_id = c.id
            WHERE c.created_at > NOW() - INTERVAL '24 hours'
            GROUP BY c.id
            ORDER BY c.created_at DESC
            LIMIT 5
        """)
        
        conversations = cursor.fetchall()
        
        all_directives = []
        for conv in conversations:
            directives = self.directive_capture.extract_directives(
                conversation_id=conv['id'],
                messages=conv['messages']
            )
            
            # Auto-create tasks for actionable directives
            for directive in directives:
                if directive['type'] == 'task' and directive['confidence'] >= 0.8:
                    self._create_task_from_directive(cursor, directive)
            
            all_directives.extend(directives)
        
        return all_directives
    
    def _create_task_from_directive(self, cursor, directive: Dict):
        """
        Create task from captured directive
        This is AllanBot training in action!
        """
        cursor.execute("""
            INSERT INTO tasks (
                title, description, priority, tags, metadata
            ) VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT DO NOTHING
        """, (
            directive['title'],
            directive['description'],
            directive['priority'],
            ['auto_created', 'directive_based'],
            {'directive_id': directive['id'], 'confidence': directive['confidence']}
        ))
        
        self.db.commit()
