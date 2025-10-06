#!/usr/bin/env python3
"""
ROBBIE POSTGRES SMART INBOX
Analyzes emails from PostgreSQL (FAST!), then updates Gmail with tags
"""

import asyncio
import psycopg2
import logging
import time
from datetime import datetime, timedelta
from google.oauth2 import service_account
from googleapiclient.discovery import build

# Configuration
CREDS_FILE = '/Users/allanperetz/aurora-ai-robbiverse/api-connectors/google-credentials.json'
ADMIN_EMAIL = 'allan@testpilotcpg.com'
SCOPES = ['https://mail.google.com/']

DB_CONFIG = {
    'host': 'aurora-postgres-u44170.vm.elestio.app',
    'port': 25432,
    'dbname': 'aurora_unified',
    'user': 'aurora_app',
    'password': 'TestPilot2025_Aurora!',
    'sslmode': 'require'
}

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/Users/allanperetz/aurora-ai-robbiverse/logs/postgres-smart-inbox.log'),
        logging.StreamHandler()
    ]
)

class RobbiePostgresSmartInbox:
    def __init__(self):
        self.gmail_service = None
        self.db_conn = None
        self.labels = {}
        
    async def initialize(self):
        """Initialize Gmail and database connections"""
        try:
            credentials = service_account.Credentials.from_service_account_file(
                CREDS_FILE, scopes=SCOPES
            )
            delegated_credentials = credentials.with_subject(ADMIN_EMAIL)
            self.gmail_service = build('gmail', 'v1', credentials=delegated_credentials)
            
            self.db_conn = psycopg2.connect(**DB_CONFIG)
            
            # Load Gmail labels
            await self.setup_labels()
            
            logging.info("🚀 Robbie Postgres Smart Inbox initialized!")
            
        except Exception as e:
            logging.error(f"❌ Initialization error: {e}")
            raise
    
    async def setup_labels(self):
        """Setup Gmail labels"""
        try:
            labels_result = self.gmail_service.users().labels().list(userId='me').execute()
            labels = labels_result.get('labels', [])
            
            self.labels = {label['name']: label['id'] for label in labels}
            
            # Required labels
            required_labels = ['Top7', 'Top3', 'Action', 'Comment', 'FYI', 'LinkedIn', 'Notes', 'Interesting']
            
            for label_name in required_labels:
                if label_name not in self.labels:
                    label = self.gmail_service.users().labels().create(
                        userId='me',
                        body={'name': label_name}
                    ).execute()
                    self.labels[label_name] = label['id']
                    logging.info(f"✅ Created label: {label_name}")
            
        except Exception as e:
            logging.error(f"❌ Error setting up labels: {e}")
    
    async def ai_analyze_email(self, email: dict) -> dict:
        """AI-powered email analysis"""
        try:
            subject = (email.get('subject') or '').lower()
            sender = (email.get('from_email') or '').lower()
            snippet = (email.get('snippet') or '').lower()
            
            # Calculate age
            email_date = email.get('email_date')
            if email_date:
                if isinstance(email_date, str):
                    email_date = datetime.fromisoformat(email_date.replace('Z', '+00:00')).replace(tzinfo=None)
                age_hours = (datetime.now() - email_date).total_seconds() / 3600
            else:
                age_hours = 999
            
            analysis = {
                'importance_score': 0.0,
                'urgency_score': 0.0,
                'tags': [],
                'reasoning': [],
                'todo_items': []
            }
            
            # === IMPORTANCE SCORING ===
            
            # Revenue signals
            if any(word in subject or word in sender or word in snippet for word in [
                'deal', 'proposal', 'contract', 'revenue', 'payment', 'invoice', '$', 'money', 'price', 'quote'
            ]):
                analysis['importance_score'] += 40
                analysis['reasoning'].append("💰 REVENUE OPPORTUNITY")
                analysis['tags'].append('Action')
                analysis['todo_items'].append(f"Review revenue opportunity: {email.get('subject', '')[:60]}")
            
            # Client communication
            if any(client in sender for client in ['testpilot', 'wildmonkey', 'simplygoodfoods', 'cpg']):
                analysis['importance_score'] += 35
                analysis['reasoning'].append("👤 CLIENT COMMUNICATION")
                analysis['tags'].append('Action')
                analysis['todo_items'].append(f"Respond to client: {email.get('subject', '')[:60]}")
            
            # LinkedIn
            if 'linkedin' in sender:
                if 'messaged you' in subject or 'message from' in subject:
                    analysis['importance_score'] += 30
                    analysis['reasoning'].append("🤝 LINKEDIN DIRECT MESSAGE")
                    analysis['tags'].append('LinkedIn')
                    analysis['tags'].append('Action')
                    analysis['todo_items'].append(f"Respond to LinkedIn message: {email.get('subject', '')[:60]}")
                elif 'connection request' in subject:
                    analysis['importance_score'] += 20
                    analysis['reasoning'].append("🤝 LINKEDIN CONNECTION")
                    analysis['tags'].append('LinkedIn')
                    analysis['tags'].append('Action')
                else:
                    analysis['importance_score'] += 10
                    analysis['tags'].append('LinkedIn')
                    analysis['tags'].append('FYI')
            
            # HubSpot leads
            if 'hubspot' in sender and 'submission' in subject:
                analysis['importance_score'] += 35
                analysis['reasoning'].append("🎯 NEW LEAD")
                analysis['tags'].append('Action')
                analysis['todo_items'].append(f"Follow up on lead: {email.get('subject', '')[:60]}")
            
            # Meeting requests
            if any(word in subject or word in snippet for word in ['meeting', 'call', 'schedule', 'calendar', 'zoom', 'meet']):
                analysis['importance_score'] += 25
                analysis['reasoning'].append("📅 MEETING REQUEST")
                analysis['tags'].append('Action')
                analysis['todo_items'].append(f"Schedule meeting: {email.get('subject', '')[:60]}")
            
            # Questions/Comments
            if any(word in subject or word in snippet for word in ['question', 'thoughts', 'feedback', 'comment', 'opinion']):
                analysis['importance_score'] += 20
                analysis['reasoning'].append("💬 REQUIRES COMMENT")
                analysis['tags'].append('Comment')
                analysis['todo_items'].append(f"Provide feedback: {email.get('subject', '')[:60]}")
            
            # Interesting content
            if any(word in subject or word in snippet for word in ['article', 'blog', 'insight', 'trend', 'analysis', 'research']):
                analysis['importance_score'] += 15
                analysis['reasoning'].append("📚 INTERESTING CONTENT")
                analysis['tags'].append('Interesting')
                analysis['tags'].append('Notes')
            
            # === URGENCY SCORING ===
            
            # Explicit urgency
            if any(word in subject or word in snippet for word in ['urgent', 'asap', 'immediate', 'critical', 'emergency', 'now']):
                analysis['urgency_score'] += 50
                analysis['reasoning'].append("⚡ MARKED AS URGENT")
            
            # Deadlines
            if any(word in subject or word in snippet for word in ['deadline', 'due', 'expires', 'expiring', 'today', 'tomorrow']):
                analysis['urgency_score'] += 40
                analysis['reasoning'].append("⏰ DEADLINE MENTIONED")
            
            # Recency
            if age_hours < 2:
                analysis['urgency_score'] += 30
            elif age_hours < 24:
                analysis['urgency_score'] += 20
            elif age_hours < 72:
                analysis['urgency_score'] += 10
            
            # Action verbs
            if any(word in subject for word in ['review', 'approve', 'sign', 'confirm', 'respond', 'reply']):
                analysis['urgency_score'] += 25
                analysis['reasoning'].append("✅ ACTION REQUIRED")
            
            # === DEDUCTIONS ===
            
            # Alerts/Notifications
            if any(word in sender for word in ['noreply', 'no-reply', 'notification', 'alert', 'github', 'google']):
                analysis['importance_score'] -= 20
                analysis['urgency_score'] -= 20
                analysis['tags'].append('FYI')
            
            # Marketing
            if any(word in sender or word in subject for word in ['marketing', 'newsletter', 'unsubscribe', 'promo', 'offer']):
                analysis['importance_score'] -= 30
                analysis['urgency_score'] -= 30
                analysis['tags'].append('FYI')
            
            # Ensure scores are in range
            analysis['importance_score'] = max(0, min(100, analysis['importance_score']))
            analysis['urgency_score'] = max(0, min(100, analysis['urgency_score']))
            
            # Default tag
            if not analysis['tags']:
                analysis['tags'].append('FYI')
            
            return analysis
            
        except Exception as e:
            logging.error(f"❌ Error analyzing email: {e}")
            return {'importance_score': 0, 'urgency_score': 0, 'tags': ['FYI'], 'reasoning': [], 'todo_items': []}
    
    async def analyze_conversation_context(self, thread_id):
        """Analyze thread for escalations, commitments, and Allan's responses"""
        try:
            cursor = self.db_conn.cursor()
            cursor.execute("""
                SELECT interaction_id, subject, from_user, snippet, interaction_date
                FROM interactions
                WHERE thread_id = %s
                ORDER BY interaction_date ASC
            """, (thread_id,))
            
            thread_emails = cursor.fetchall()
            cursor.close()
            
            if len(thread_emails) <= 1:
                return {'escalation_bonus': 0, 'commitment_penalty': 0, 'reasoning': []}
            
            allan_responses = 0
            escalations = 0
            commitments = 0
            unanswered = 0
            
            for email in thread_emails:
                from_user = (email[2] or '').lower()
                snippet = (email[3] or '').lower()
                
                if 'allan@testpilotcpg.com' in from_user:
                    allan_responses += 1
                    if any(word in snippet for word in ['will', 'going to', 'plan to', 'by friday', 'this week']):
                        commitments += 1
                else:
                    if any(word in snippet for word in ['urgent', 'asap', 'final', 'notice', 'deadline', 'overdue']):
                        escalations += 1
            
            unanswered = len(thread_emails) - allan_responses - 1  # -1 for the current email
            
            escalation_bonus = escalations * 30
            commitment_penalty = commitments * 20 if unanswered > 0 else 0
            
            reasoning = []
            if escalations > 0:
                reasoning.append(f"🚨 {escalations} escalation(s) in thread")
            if unanswered > 0:
                reasoning.append(f"📧 {unanswered} unanswered in thread")
            if commitment_penalty > 0:
                reasoning.append(f"⚠️ Broken commitment")
            if allan_responses > 0:
                reasoning.append(f"✅ Allan engaged ({allan_responses} replies)")
            
            return {
                'escalation_bonus': escalation_bonus,
                'commitment_penalty': commitment_penalty,
                'reasoning': reasoning
            }
            
        except Exception as e:
            logging.error(f"❌ Error analyzing thread: {e}")
            return {'escalation_bonus': 0, 'commitment_penalty': 0, 'reasoning': []}
    
    async def organize_inbox(self):
        """Organize emails from PostgreSQL with conversation analysis"""
        try:
            logging.info("🚀 Starting inbox organization with conversation analysis...")
            
            # Get emails from last 3 days, grouped by thread
            cursor = self.db_conn.cursor()
            cursor.execute("""
                SELECT gmail_id, thread_id, subject, from_email, to_email, 
                       email_date, snippet, labels, is_unread
                FROM google_emails_massive
                WHERE email_date > NOW() - INTERVAL '3 days'
                ORDER BY thread_id, email_date DESC
            """)
            
            all_emails = cursor.fetchall()
            cursor.close()
            
            logging.info(f"📧 Found {len(all_emails)} emails from PostgreSQL")
            
            # Group by thread and pick the most important email from each thread
            from collections import defaultdict
            threads = defaultdict(list)
            for email in all_emails:
                thread_id = email[1] or email[0]  # Use gmail_id if no thread_id
                threads[thread_id].append(email)
            
            logging.info(f"🧵 Grouped into {len(threads)} threads")
            
            # Analyze threads and pick ONE email per thread to surface
            analyzed_emails = []
            
            for thread_id, thread_emails in threads.items():
                # Analyze conversation context for the entire thread
                thread_context = await self.analyze_conversation_context(thread_id)
                
                # Analyze each email in the thread
                thread_analyzed = []
                for email_row in thread_emails:
                    email_data = {
                        'gmail_id': email_row[0],
                        'thread_id': email_row[1],
                        'subject': email_row[2],
                        'from_email': email_row[3],
                        'to_email': email_row[4],
                        'email_date': email_row[5],
                        'snippet': email_row[6],
                        'labels': email_row[7],
                        'is_unread': email_row[8]
                    }
                    
                    # AI analysis
                    analysis = await self.ai_analyze_email(email_data)
                    
                    # Adjust scores based on conversation
                    final_importance = analysis['importance_score']
                    final_urgency = analysis['urgency_score'] + thread_context['escalation_bonus'] + thread_context['commitment_penalty']
                    final_urgency = min(100, final_urgency)
                    
                    # Combine reasoning
                    combined_reasoning = analysis['reasoning'] + thread_context['reasoning']
                    
                    thread_analyzed.append({
                        **email_data,
                        'importance_score': final_importance,
                        'urgency_score': final_urgency,
                        'tags': analysis['tags'],
                        'reasoning': combined_reasoning,
                        'todo_items': analysis['todo_items']
                    })
                
                # Pick the MOST IMPORTANT email from this thread to surface
                if thread_analyzed:
                    # Sort by urgency first (escalations), then importance
                    thread_analyzed.sort(key=lambda x: (x['urgency_score'], x['importance_score']), reverse=True)
                    best_email = thread_analyzed[0]
                    
                    # Add thread context to reasoning
                    if len(thread_emails) > 1:
                        best_email['reasoning'].insert(0, f"📧 Thread: {len(thread_emails)} emails")
                    
                    analyzed_emails.append(best_email)
            
            logging.info(f"✅ Analyzed {len(analyzed_emails)} emails")
            
            # Sort by importance and urgency
            analyzed_emails.sort(key=lambda x: (x['importance_score'], x['urgency_score']), reverse=True)
            
            # Top 7 Most Important
            top7 = analyzed_emails[:7]
            
            # Top 3 Most Urgent (from remaining) - deduplicate by subject
            remaining = analyzed_emails[7:]
            remaining.sort(key=lambda x: x['urgency_score'], reverse=True)
            
            # Deduplicate by subject
            seen_subjects = set()
            top3 = []
            for email in remaining:
                subject_normalized = email['subject'].lower().strip()
                if subject_normalized not in seen_subjects:
                    top3.append(email)
                    seen_subjects.add(subject_normalized)
                    if len(top3) >= 3:
                        break
            
            # Everything else
            everything_else = remaining[3:]
            
            # Apply Gmail labels and store in database
            all_todos = []
            
            # Top 7
            logging.info("🏆 Tagging Top 7 Most Important...")
            for email in top7:
                await self.apply_gmail_labels(email, ['Top7'] + email['tags'])
                await self.store_analysis(email)
                all_todos.extend(email['todo_items'])
                logging.info(f"  ⭐ {email['subject'][:50]} (Score: {email['importance_score']:.1f})")
            
            # Top 3
            logging.info("⚡ Tagging Top 3 Most Urgent...")
            for email in top3:
                await self.apply_gmail_labels(email, ['Top3'] + email['tags'])
                await self.store_analysis(email)
                all_todos.extend(email['todo_items'])
                logging.info(f"  🔥 {email['subject'][:50]} (Urgency: {email['urgency_score']:.1f})")
            
            # Everything else (store analysis only, no Gmail API calls)
            logging.info(f"📋 Storing analysis for {len(everything_else)} other emails...")
            for email in everything_else:
                await self.store_analysis(email)
                all_todos.extend(email['todo_items'])
            
            # Store all TODOs
            await self.store_todos(all_todos)
            
            logging.info(f"✅ Organization complete!")
            logging.info(f"   🏆 Top 7: {len(top7)}")
            logging.info(f"   ⚡ Top 3: {len(top3)}")
            logging.info(f"   📋 Everything else: {len(everything_else)}")
            logging.info(f"   ✅ Generated {len(all_todos)} TODO items")
            
        except Exception as e:
            logging.error(f"❌ Error organizing inbox: {e}")
            import traceback
            logging.error(traceback.format_exc())
    
    async def apply_gmail_labels(self, email: dict, tags: list):
        """Apply labels to Gmail (and add INBOX tag)"""
        try:
            label_ids = [self.labels[tag] for tag in tags if tag in self.labels]
            label_ids.append('INBOX')  # Surface to inbox
            
            self.gmail_service.users().messages().modify(
                userId='me',
                id=email['gmail_id'],
                body={'addLabelIds': label_ids}
            ).execute()
            
            time.sleep(0.2)  # Rate limit
            
        except Exception as e:
            logging.error(f"❌ Error applying Gmail labels: {e}")
    
    async def store_analysis(self, email: dict):
        """Store analysis in interactions table"""
        try:
            cursor = self.db_conn.cursor()
            cursor.execute("""
                UPDATE interactions SET
                    importance_score = %s,
                    urgency_score = %s,
                    ai_tags = %s,
                    ai_reasoning = %s,
                    analyzed_at = CURRENT_TIMESTAMP
                WHERE interaction_id = %s
            """, (
                email['importance_score'],
                email['urgency_score'],
                email['tags'],
                ' | '.join(email['reasoning']),
                email['gmail_id']
            ))
            self.db_conn.commit()
            cursor.close()
            
        except Exception as e:
            logging.error(f"❌ Error storing analysis: {e}")
            self.db_conn.rollback()
    
    async def store_todos(self, todos: list):
        """Store TODO items in priorities_queue"""
        try:
            cursor = self.db_conn.cursor()
            
            for todo in todos:
                cursor.execute("""
                    INSERT INTO priorities_queue (
                        task_id, task_type, task_category, task_description,
                        source, status, total_score
                    )
                    VALUES (%s, %s, %s, %s, 'gmail', 'pending', 50.0)
                    ON CONFLICT (task_id) DO NOTHING
                """, (
                    f"todo_{hash(todo)}",
                    'email_todo',
                    'inbox_action',
                    todo
                ))
            
            self.db_conn.commit()
            cursor.close()
            
            logging.info(f"✅ Stored {len(todos)} TODO items")
            
        except Exception as e:
            logging.error(f"❌ Error storing TODOs: {e}")

async def main():
    """Main function"""
    inbox = RobbiePostgresSmartInbox()
    await inbox.initialize()
    await inbox.organize_inbox()

if __name__ == "__main__":
    asyncio.run(main())
