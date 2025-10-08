#!/usr/bin/env python3
"""
ROBBIE PRIORITIES ENGINE
Self-managing AI system that runs every minute and decides what to do next
"""

import asyncio
import psycopg2
import json
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
from google.oauth2 import service_account
from googleapiclient.discovery import build

# Configuration
DB_CONFIG = {
    'host': 'aurora-postgres-u44170.vm.elestio.app',
    'port': 25432,
    'dbname': 'aurora_unified',
    'user': 'aurora_app',
    'password': 'TestPilot2025_Aurora!',
    'sslmode': 'require'
}

CREDS_FILE = '/Users/allanperetz/aurora-ai-robbiverse/api-connectors/google-credentials.json'
ADMIN_EMAIL = 'allan@testpilotcpg.com'
SCOPES = ['https://mail.google.com/', 'https://www.googleapis.com/auth/calendar.readonly']

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/Users/allanperetz/aurora-ai-robbiverse/logs/priorities-engine.log'),
        logging.StreamHandler()
    ]
)

class PrioritiesEngine:
    def __init__(self):
        self.db_conn = None
        self.gmail_service = None
        self.calendar_service = None
        self.personality_state = {}
        self.weights = {}
        
    async def initialize(self):
        """Initialize database and API connections"""
        try:
            # Database
            self.db_conn = psycopg2.connect(**DB_CONFIG)
            logging.info("🐘 PostgreSQL connected!")
            
            # Gmail & Calendar
            credentials = service_account.Credentials.from_service_account_file(
                CREDS_FILE, scopes=SCOPES
            )
            delegated_credentials = credentials.with_subject(ADMIN_EMAIL)
            self.gmail_service = build('gmail', 'v1', credentials=delegated_credentials)
            self.calendar_service = build('calendar', 'v3', credentials=delegated_credentials)
            logging.info("📧 Gmail & Calendar connected!")
            
            # Load personality state
            await self.load_personality_state()
            
            # Load dimension weights
            await self.load_weights()
            
            logging.info("🤖 Priorities Engine initialized!")
            
        except Exception as e:
            logging.error(f"❌ Initialization error: {e}")
            raise
    
    async def load_personality_state(self):
        """Load Robbie's current personality sliders"""
        try:
            cursor = self.db_conn.cursor()
            cursor.execute("""
                SELECT gandhi, flirty, turbo, auto 
                FROM user_personality_state 
                WHERE user_id = 'allan'
            """)
            personality = cursor.fetchone()
            
            if personality:
                self.personality_state = {
                    'gandhi': personality[0],
                    'flirty': personality[1],
                    'turbo': personality[2],
                    'auto': personality[3]
                }
                logging.info(f"🎭 Personality: Gandhi:{self.personality_state['gandhi']}, "
                           f"Flirty:{self.personality_state['flirty']}, "
                           f"Turbo:{self.personality_state['turbo']}, "
                           f"Auto:{self.personality_state['auto']}")
            
            cursor.close()
            
        except Exception as e:
            logging.error(f"❌ Error loading personality: {e}")
    
    async def load_weights(self):
        """Load current dimension weights"""
        try:
            cursor = self.db_conn.cursor()
            cursor.execute("SELECT dimension, weight FROM priorities_weights")
            weights = cursor.fetchall()
            
            self.weights = {dimension: float(weight) for dimension, weight in weights}
            logging.info(f"⚖️ Weights loaded: {self.weights}")
            
            cursor.close()
            
        except Exception as e:
            logging.error(f"❌ Error loading weights: {e}")
    
    async def scan_gmail(self) -> List[Dict[str, Any]]:
        """Scan Gmail for new tasks"""
        tasks = []
        
        try:
            # Get unread emails
            results = self.gmail_service.users().messages().list(
                userId='me',
                maxResults=20,
                q='is:unread'
            ).execute()
            
            messages = results.get('messages', [])
            logging.info(f"📧 Found {len(messages)} unread emails")
            
            for msg in messages[:10]:  # Limit to 10 for performance
                try:
                    message = self.gmail_service.users().messages().get(
                        userId='me',
                        id=msg['id']
                    ).execute()
                    
                    headers = message['payload'].get('headers', [])
                    subject = next((h['value'] for h in headers if h['name'] == 'Subject'), 'No Subject')
                    sender = next((h['value'] for h in headers if h['name'] == 'From'), 'Unknown')
                    
                    # Create email triage task
                    task = {
                        'task_id': f"email_triage_{msg['id']}",
                        'task_type': 'email_triage',
                        'task_category': 'inbox_management',
                        'task_description': f"Triage email: {subject[:100]}",
                        'source': 'gmail',
                        'source_id': msg['id'],
                        'metadata': {
                            'subject': subject,
                            'sender': sender,
                            'message_id': msg['id']
                        }
                    }
                    
                    tasks.append(task)
                    
                except Exception as e:
                    logging.error(f"❌ Error processing email {msg['id']}: {e}")
                    continue
            
        except Exception as e:
            logging.error(f"❌ Error scanning Gmail: {e}")
        
        return tasks
    
    async def scan_calendar(self) -> List[Dict[str, Any]]:
        """Scan Calendar for upcoming meetings"""
        tasks = []
        
        try:
            # Get events in next 24 hours
            now = datetime.utcnow().isoformat() + 'Z'
            tomorrow = (datetime.utcnow() + timedelta(days=1)).isoformat() + 'Z'
            
            events_result = self.calendar_service.events().list(
                calendarId='primary',
                timeMin=now,
                timeMax=tomorrow,
                maxResults=10,
                singleEvents=True,
                orderBy='startTime'
            ).execute()
            
            events = events_result.get('items', [])
            logging.info(f"📅 Found {len(events)} upcoming meetings")
            
            for event in events:
                start = event['start'].get('dateTime', event['start'].get('date'))
                summary = event.get('summary', 'No Title')
                
                # Create meeting prep task if meeting is within 30 minutes
                start_time = datetime.fromisoformat(start.replace('Z', '+00:00'))
                time_until = (start_time - datetime.now(start_time.tzinfo)).total_seconds() / 60
                
                if 15 <= time_until <= 30:
                    task = {
                        'task_id': f"meeting_prep_{event['id']}",
                        'task_type': 'meeting_prep',
                        'task_category': 'calendar_management',
                        'task_description': f"Prepare for meeting: {summary}",
                        'source': 'calendar',
                        'source_id': event['id'],
                        'deadline': start_time,
                        'metadata': {
                            'summary': summary,
                            'start_time': start,
                            'event_id': event['id']
                        }
                    }
                    
                    tasks.append(task)
            
        except Exception as e:
            logging.error(f"❌ Error scanning Calendar: {e}")
        
        return tasks
    
    async def detect_eliminations(self):
        """Detect and eliminate obsolete tasks"""
        eliminated_count = 0
        
        try:
            cursor = self.db_conn.cursor()
            
            # Get pending tasks
            cursor.execute("""
                SELECT task_id, task_type, source_id, deadline, created_at
                FROM priorities_queue
                WHERE status = 'pending'
            """)
            
            tasks = cursor.fetchall()
            
            for task_id, task_type, source_id, deadline, created_at in tasks:
                eliminated = False
                reason = ""
                
                # Check email draft elimination
                if task_type == 'email_draft':
                    # Check if user sent their own reply
                    # TODO: Implement email thread checking
                    pass
                
                # Check meeting prep elimination
                if task_type == 'meeting_prep' and deadline:
                    if datetime.now() > deadline:
                        reason = "Meeting already occurred"
                        eliminated = True
                
                # Eliminate if needed
                if eliminated:
                    cursor.execute("""
                        SELECT eliminate_task(%s, %s, %s, %s)
                    """, (task_id, task_type, reason, 'auto_detection'))
                    
                    eliminated_count += 1
                    logging.info(f"🗑️ Eliminated task: {task_id} - {reason}")
            
            self.db_conn.commit()
            cursor.close()
            
            logging.info(f"🗑️ Eliminated {eliminated_count} obsolete tasks")
            
        except Exception as e:
            logging.error(f"❌ Error detecting eliminations: {e}")
            self.db_conn.rollback()
    
    async def score_task(self, task: Dict[str, Any]) -> float:
        """Calculate total score for a task"""
        try:
            # Calculate dimension scores (0-10 scale)
            urgency = await self.calculate_urgency(task)
            impact = await self.calculate_impact(task)
            effort = await self.calculate_effort(task)
            context = await self.calculate_context(task)
            dependency = await self.calculate_dependencies(task)
            personality = await self.calculate_personality_fit(task)
            
            # Apply weights
            total_score = (
                urgency * self.weights.get('urgency', 0.30) +
                impact * self.weights.get('impact', 0.25) +
                effort * self.weights.get('effort', 0.15) +
                context * self.weights.get('context_relevance', 0.15) +
                dependency * self.weights.get('dependencies', 0.10) +
                personality * self.weights.get('personality', 0.05)
            )
            
            return round(total_score, 2)
            
        except Exception as e:
            logging.error(f"❌ Error scoring task: {e}")
            return 0.0
    
    async def calculate_urgency(self, task: Dict[str, Any]) -> float:
        """Calculate urgency score (0-10)"""
        score = 5.0  # Default medium urgency
        
        # Check deadline
        if task.get('deadline'):
            deadline = task['deadline']
            if isinstance(deadline, str):
                deadline = datetime.fromisoformat(deadline)
            
            time_until = (deadline - datetime.now()).total_seconds() / 3600  # hours
            
            if time_until < 1:
                score = 10.0  # Critical - less than 1 hour
            elif time_until < 4:
                score = 8.0  # High - less than 4 hours
            elif time_until < 24:
                score = 6.0  # Medium - less than 1 day
            else:
                score = 4.0  # Low - more than 1 day
        
        # Check task type urgency
        if task['task_type'] in ['security_alert', 'system_down']:
            score = 10.0
        elif task['task_type'] in ['meeting_prep', 'client_response']:
            score += 2.0
        
        return min(score, 10.0)
    
    async def calculate_impact(self, task: Dict[str, Any]) -> float:
        """Calculate impact score (0-10)"""
        score = 5.0  # Default medium impact
        
        # Check task category
        if task['task_category'] == 'business_development':
            score = 9.0  # High impact - revenue related
        elif task['task_category'] == 'inbox_management':
            score = 6.0  # Medium impact - productivity
        elif task['task_category'] == 'system_maintenance':
            score = 7.0  # Medium-high impact - operational
        
        # Check for revenue keywords
        description = task.get('task_description', '').lower()
        if any(word in description for word in ['deal', 'revenue', 'client', 'proposal']):
            score += 2.0
        
        return min(score, 10.0)
    
    async def calculate_effort(self, task: Dict[str, Any]) -> float:
        """Calculate effort score (0-10, higher = less effort)"""
        score = 5.0  # Default medium effort
        
        # Estimate based on task type
        effort_map = {
            'email_triage': 8.0,  # Quick - 1-2 minutes
            'meeting_prep': 6.0,  # Medium - 5-10 minutes
            'email_draft': 5.0,  # Medium - 10-15 minutes
            'proposal_draft': 2.0,  # Long - 30+ minutes
        }
        
        score = effort_map.get(task['task_type'], 5.0)
        
        return score
    
    async def calculate_context(self, task: Dict[str, Any]) -> float:
        """Calculate context relevance score (0-10)"""
        score = 5.0  # Default neutral context
        
        # Check if task matches current focus
        # TODO: Implement context detection from user activity
        
        # For now, boost email tasks during work hours
        hour = datetime.now().hour
        if task['task_category'] == 'inbox_management' and 9 <= hour <= 17:
            score = 7.0
        
        return score
    
    async def calculate_dependencies(self, task: Dict[str, Any]) -> float:
        """Calculate dependency score (0-10)"""
        score = 5.0  # Default independent task
        
        # TODO: Implement dependency graph checking
        
        return score
    
    async def calculate_personality_fit(self, task: Dict[str, Any]) -> float:
        """Calculate personality alignment score (0-10)"""
        score = 5.0  # Default neutral fit
        
        # Gandhi mode: Prioritize important over urgent
        if self.personality_state.get('gandhi', 5) > 7:
            if task['task_category'] in ['business_development', 'strategic']:
                score += 2.0
        
        # Turbo mode: Prioritize quick wins
        if self.personality_state.get('turbo', 5) > 7:
            if task['task_type'] in ['email_triage', 'quick_response']:
                score += 2.0
        
        # Flirty mode: Prioritize communication
        if self.personality_state.get('flirty', 5) > 7:
            if task['task_category'] in ['communication', 'relationship']:
                score += 2.0
        
        return min(score, 10.0)
    
    async def create_or_update_task(self, task: Dict[str, Any]):
        """Create or update task in database"""
        try:
            cursor = self.db_conn.cursor()
            
            # Calculate score
            total_score = await self.score_task(task)
            
            # Insert or update task
            cursor.execute("""
                INSERT INTO priorities_queue (
                    task_id, task_type, task_category, task_description,
                    source, source_id, deadline, total_score, status
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'pending')
                ON CONFLICT (task_id) 
                DO UPDATE SET
                    total_score = EXCLUDED.total_score,
                    updated_at = CURRENT_TIMESTAMP
            """, (
                task['task_id'],
                task['task_type'],
                task['task_category'],
                task['task_description'],
                task['source'],
                task.get('source_id'),
                task.get('deadline'),
                total_score
            ))
            
            self.db_conn.commit()
            cursor.close()
            
            logging.info(f"✅ Task created/updated: {task['task_id']} (score: {total_score})")
            
        except Exception as e:
            logging.error(f"❌ Error creating/updating task: {e}")
            self.db_conn.rollback()
    
    async def get_top_priority_task(self) -> Optional[Dict[str, Any]]:
        """Get the highest priority task"""
        try:
            cursor = self.db_conn.cursor()
            
            # Get confidence threshold based on auto mode
            auto_level = self.personality_state.get('auto', 5)
            thresholds = {10: 0.5, 9: 0.6, 8: 0.7, 7: 0.8, 6: 0.9, 5: 1.0}
            confidence_threshold = thresholds.get(auto_level, 0.7)
            
            # Get top task
            cursor.execute("""
                SELECT task_id, task_type, task_description, total_score
                FROM get_top_priority_task(%s)
            """, (confidence_threshold,))
            
            result = cursor.fetchone()
            cursor.close()
            
            if result:
                return {
                    'task_id': result[0],
                    'task_type': result[1],
                    'task_description': result[2],
                    'total_score': float(result[3])
                }
            
            return None
            
        except Exception as e:
            logging.error(f"❌ Error getting top priority task: {e}")
            return None
    
    async def execute_task(self, task: Dict[str, Any]) -> bool:
        """Execute the given task"""
        try:
            logging.info(f"🚀 Executing task: {task['task_id']} - {task['task_description']}")
            
            # Update task status
            cursor = self.db_conn.cursor()
            cursor.execute("""
                UPDATE priorities_queue
                SET status = 'executing', executed_at = CURRENT_TIMESTAMP
                WHERE task_id = %s
            """, (task['task_id'],))
            self.db_conn.commit()
            cursor.close()
            
            # Execute based on task type
            success = False
            result = ""
            
            if task['task_type'] == 'email_triage':
                # Run inbox analysis
                success = await self.execute_inbox_analysis()
                result = "Inbox analysis completed"
            else:
                result = f"Task type {task['task_type']} not yet implemented"
                success = False
            
            # Log execution
            cursor = self.db_conn.cursor()
            cursor.execute("""
                INSERT INTO priorities_execution_log (
                    task_id, action_taken, result, success
                )
                VALUES (%s, %s, %s, %s)
            """, (task['task_id'], f"Execute {task['task_type']}", result, success))
            
            # Update task status
            cursor.execute("""
                UPDATE priorities_queue
                SET status = %s, completed_at = CURRENT_TIMESTAMP
                WHERE task_id = %s
            """, ('completed' if success else 'failed', task['task_id']))
            
            self.db_conn.commit()
            cursor.close()
            
            return success
            
        except Exception as e:
            logging.error(f"❌ Error executing task: {e}")
            self.db_conn.rollback()
            return False
    
    async def execute_inbox_analysis(self) -> bool:
        """Execute inbox analysis (run robbie-intelligent-inbox.py)"""
        try:
            import subprocess
            
            result = subprocess.run(
                ['python3', '/Users/allanperetz/aurora-ai-robbiverse/robbie-intelligent-inbox.py'],
                capture_output=True,
                text=True,
                timeout=60
            )
            
            return result.returncode == 0
            
        except Exception as e:
            logging.error(f"❌ Error running inbox analysis: {e}")
            return False
    
    async def run_cycle(self):
        """Run one cycle of the priorities engine"""
        try:
            logging.info("🔄 Starting Priorities Engine cycle...")
            
            # 1. Scan all sources for new tasks
            gmail_tasks = await self.scan_gmail()
            calendar_tasks = await self.scan_calendar()
            
            all_tasks = gmail_tasks + calendar_tasks
            logging.info(f"📊 Found {len(all_tasks)} potential tasks")
            
            # 2. Detect and eliminate obsolete tasks
            await self.detect_eliminations()
            
            # 3. Create/update tasks in database
            for task in all_tasks:
                await self.create_or_update_task(task)
            
            # 4. Get top priority task
            top_task = await self.get_top_priority_task()
            
            if top_task:
                logging.info(f"🎯 Top priority: {top_task['task_description']} (score: {top_task['total_score']})")
                
                # 5. Execute task
                success = await self.execute_task(top_task)
                
                if success:
                    logging.info(f"✅ Task completed successfully!")
                else:
                    logging.warning(f"⚠️ Task execution failed")
            else:
                logging.info("✨ No high-priority tasks - smart idleness")
            
            logging.info("🏁 Priorities Engine cycle complete!")
            
        except Exception as e:
            logging.error(f"❌ Error in engine cycle: {e}")
        finally:
            if self.db_conn:
                self.db_conn.close()

async def main():
    """Main function"""
    engine = PrioritiesEngine()
    await engine.initialize()
    await engine.run_cycle()

if __name__ == "__main__":
    asyncio.run(main())
