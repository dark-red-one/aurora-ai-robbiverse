#!/usr/bin/env python3
"""
ROBBIE SMART INBOX
AI-powered email organization with Top7, Top3, and smart tags
Keeps emails IN INBOX but organized with labels
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
        logging.FileHandler('/Users/allanperetz/aurora-ai-robbiverse/logs/smart-inbox.log'),
        logging.StreamHandler()
    ]
)

class RobbieSmartInbox:
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
            
            # Load and create labels
            await self.setup_labels()
            
            logging.info("🚀 Robbie Smart Inbox initialized!")
            
        except Exception as e:
            logging.error(f"❌ Initialization error: {e}")
            raise
    
    async def setup_labels(self):
        """Setup all required labels"""
        try:
            labels_result = self.gmail_service.users().labels().list(userId='me').execute()
            labels = labels_result.get('labels', [])
            
            self.labels = {label['name']: label['id'] for label in labels}
            
            # Required labels
            required_labels = [
                'Top7',           # 7 Most Important
                'Top3',           # 3 Most Urgent
                'Action',         # Requires action
                'Comment',        # Needs comment/response
                'FYI',           # For your information
                'LinkedIn',       # LinkedIn related
                'Notes',         # Note-worthy
                'Interesting'    # Interesting content
            ]
            
            for label_name in required_labels:
                if label_name not in self.labels:
                    label = self.gmail_service.users().labels().create(
                        userId='me',
                        body={'name': label_name}
                    ).execute()
                    self.labels[label_name] = label['id']
                    logging.info(f"✅ Created label: {label_name}")
            
            # Delete old ROBBIE/ labels (only once)
            old_labels = [name for name in self.labels.keys() if name.startswith('ROBBIE/')]
            if old_labels:
                for label_name in old_labels:
                    try:
                        self.gmail_service.users().labels().delete(
                            userId='me',
                            id=self.labels[label_name]
                        ).execute()
                        logging.info(f"🗑️ Deleted old label: {label_name}")
                    except:
                        pass
            
        except Exception as e:
            logging.error(f"❌ Error setting up labels: {e}")
    
    async def ai_analyze_email(self, email_data: dict) -> dict:
        """AI-powered email analysis (no regex!)"""
        try:
            subject = email_data['subject'].lower()
            sender = email_data['sender'].lower()
            body = email_data.get('body_preview', '').lower()
            date = email_data.get('date')
            
            # Calculate age
            if date:
                age_hours = (datetime.now() - date).total_seconds() / 3600
            else:
                age_hours = 0
            
            analysis = {
                'importance_score': 0.0,
                'urgency_score': 0.0,
                'tags': [],
                'reasoning': [],
                'todo_items': []
            }
            
            # === IMPORTANCE SCORING (0-100) ===
            
            # Revenue signals (HIGH importance)
            if any(word in subject or word in sender or word in body for word in [
                'deal', 'proposal', 'contract', 'revenue', 'payment', 'invoice', '$', 'money'
            ]):
                analysis['importance_score'] += 40
                analysis['reasoning'].append("💰 REVENUE OPPORTUNITY")
                analysis['tags'].append('Action')
                analysis['todo_items'].append(f"Review revenue opportunity: {email_data['subject'][:60]}")
            
            # Client communication (HIGH importance)
            if any(client in sender for client in [
                'testpilot', 'wildmonkey', 'simplygoodfoods', 'cpg'
            ]):
                analysis['importance_score'] += 35
                analysis['reasoning'].append("👤 CLIENT COMMUNICATION")
                analysis['tags'].append('Action')
                analysis['todo_items'].append(f"Respond to client: {email_data['subject'][:60]}")
            
            # LinkedIn connections (MEDIUM-HIGH importance)
            if 'linkedin' in sender:
                if 'messaged you' in subject or 'message from' in subject:
                    analysis['importance_score'] += 30
                    analysis['reasoning'].append("🤝 LINKEDIN DIRECT MESSAGE")
                    analysis['tags'].append('LinkedIn')
                    analysis['tags'].append('Action')
                    analysis['todo_items'].append(f"Respond to LinkedIn message: {email_data['subject'][:60]}")
                elif 'connection request' in subject or 'wants to connect' in subject:
                    analysis['importance_score'] += 20
                    analysis['reasoning'].append("🤝 LINKEDIN CONNECTION REQUEST")
                    analysis['tags'].append('LinkedIn')
                    analysis['tags'].append('Action')
                else:
                    analysis['importance_score'] += 10
                    analysis['reasoning'].append("📱 LINKEDIN NOTIFICATION")
                    analysis['tags'].append('LinkedIn')
                    analysis['tags'].append('FYI')
            
            # HubSpot leads (HIGH importance)
            if 'hubspot' in sender and 'submission' in subject:
                analysis['importance_score'] += 35
                analysis['reasoning'].append("🎯 NEW LEAD SUBMISSION")
                analysis['tags'].append('Action')
                analysis['todo_items'].append(f"Follow up on lead: {email_data['subject'][:60]}")
            
            # Meeting requests (MEDIUM importance)
            if any(word in subject or word in body for word in [
                'meeting', 'call', 'schedule', 'calendar', 'zoom', 'meet'
            ]):
                analysis['importance_score'] += 25
                analysis['reasoning'].append("📅 MEETING REQUEST")
                analysis['tags'].append('Action')
                analysis['todo_items'].append(f"Schedule meeting: {email_data['subject'][:60]}")
            
            # Questions/Comments (MEDIUM importance)
            if any(word in subject or word in body for word in [
                'question', 'thoughts', 'feedback', 'comment', 'opinion', 'what do you think'
            ]):
                analysis['importance_score'] += 20
                analysis['reasoning'].append("💬 REQUIRES COMMENT/FEEDBACK")
                analysis['tags'].append('Comment')
                analysis['todo_items'].append(f"Provide feedback: {email_data['subject'][:60]}")
            
            # Interesting content (LOW-MEDIUM importance)
            if any(word in subject or word in body for word in [
                'article', 'blog', 'insight', 'trend', 'analysis', 'research', 'study'
            ]):
                analysis['importance_score'] += 15
                analysis['reasoning'].append("📚 INTERESTING CONTENT")
                analysis['tags'].append('Interesting')
                analysis['tags'].append('Notes')
            
            # === URGENCY SCORING (0-100) ===
            
            # Explicit urgency keywords
            if any(word in subject or word in body for word in [
                'urgent', 'asap', 'immediate', 'critical', 'emergency', 'now'
            ]):
                analysis['urgency_score'] += 50
                analysis['reasoning'].append("⚡ MARKED AS URGENT")
            
            # Deadline mentions
            if any(word in subject or word in body for word in [
                'deadline', 'due', 'expires', 'expiring', 'today', 'tomorrow'
            ]):
                analysis['urgency_score'] += 40
                analysis['reasoning'].append("⏰ DEADLINE MENTIONED")
            
            # Time-sensitive
            if age_hours < 2:
                analysis['urgency_score'] += 30
                analysis['reasoning'].append("🕐 JUST RECEIVED")
            elif age_hours < 24:
                analysis['urgency_score'] += 20
                analysis['reasoning'].append("📆 RECEIVED TODAY")
            elif age_hours < 72:
                analysis['urgency_score'] += 10
                analysis['reasoning'].append("📅 RECENT (3 days)")
            
            # Action verbs
            if any(word in subject for word in [
                'review', 'approve', 'sign', 'confirm', 'respond', 'reply'
            ]):
                analysis['urgency_score'] += 25
                analysis['reasoning'].append("✅ ACTION REQUIRED")
            
            # === DEDUCTIONS ===
            
            # Alerts/Notifications (LOW importance)
            if any(word in sender for word in [
                'noreply', 'no-reply', 'notification', 'alert', 'github', 'google'
            ]):
                analysis['importance_score'] -= 20
                analysis['urgency_score'] -= 20
                analysis['reasoning'].append("🔔 AUTOMATED ALERT")
                analysis['tags'].append('FYI')
            
            # Marketing/Sales (VERY LOW importance)
            if any(word in sender or word in subject for word in [
                'marketing', 'newsletter', 'unsubscribe', 'promo', 'offer'
            ]):
                analysis['importance_score'] -= 30
                analysis['urgency_score'] -= 30
                analysis['reasoning'].append("📧 MARKETING EMAIL")
                analysis['tags'].append('FYI')
            
            # Ensure scores are in range
            analysis['importance_score'] = max(0, min(100, analysis['importance_score']))
            analysis['urgency_score'] = max(0, min(100, analysis['urgency_score']))
            
            # Default tag if none assigned
            if not analysis['tags']:
                analysis['tags'].append('FYI')
            
            return analysis
            
        except Exception as e:
            logging.error(f"❌ Error analyzing email: {e}")
            return {
                'importance_score': 0,
                'urgency_score': 0,
                'tags': ['FYI'],
                'reasoning': ['Error analyzing'],
                'todo_items': []
            }
    
    async def organize_inbox(self):
        """Organize all emails with AI analysis and surface important ones"""
        try:
            logging.info("🚀 Starting inbox organization...")
            
            # Get ALL emails from last 3 days (not just inbox!)
            # Limit to 100 for speed
            results = self.gmail_service.users().messages().list(
                userId='me',
                maxResults=100,
                q='-in:trash -in:spam newer_than:3d'
            ).execute()
            
            messages = results.get('messages', [])
            logging.info(f"📧 Found {len(messages)} emails to analyze")
            
            # Analyze all emails
            analyzed_emails = []
            
            for msg in messages:
                try:
                    message = self.gmail_service.users().messages().get(
                        userId='me',
                        id=msg['id'],
                        format='full'
                    ).execute()
                    
                    headers = message['payload'].get('headers', [])
                    subject = next((h['value'] for h in headers if h['name'] == 'Subject'), 'No Subject')
                    sender = next((h['value'] for h in headers if h['name'] == 'From'), 'Unknown')
                    date_str = next((h['value'] for h in headers if h['name'] == 'Date'), None)
                    
                    # Parse date
                    email_date = None
                    if date_str:
                        try:
                            from email.utils import parsedate_to_datetime
                            email_date = parsedate_to_datetime(date_str).replace(tzinfo=None)
                        except:
                            pass
                    
                    # Get body preview
                    body_preview = ""
                    if 'parts' in message['payload']:
                        for part in message['payload']['parts']:
                            if part['mimeType'] == 'text/plain':
                                body_data = part['body'].get('data', '')
                                if body_data:
                                    import base64
                                    body_preview = base64.urlsafe_b64decode(body_data).decode('utf-8', errors='ignore')[:500]
                                    break
                    
                    email_data = {
                        'id': msg['id'],
                        'subject': subject,
                        'sender': sender,
                        'date': email_date,
                        'body_preview': body_preview
                    }
                    
                    # AI analysis
                    analysis = await self.ai_analyze_email(email_data)
                    
                    analyzed_emails.append({
                        **email_data,
                        **analysis
                    })
                    
                except Exception as e:
                    logging.error(f"❌ Error analyzing email: {e}")
                    continue
            
            logging.info(f"✅ Analyzed {len(analyzed_emails)} emails")
            
            # Sort by importance and urgency
            analyzed_emails.sort(key=lambda x: (x['importance_score'], x['urgency_score']), reverse=True)
            
            # Top 7 Most Important
            top7 = analyzed_emails[:7]
            
            # Top 3 Most Urgent (from remaining)
            remaining = analyzed_emails[7:]
            remaining.sort(key=lambda x: x['urgency_score'], reverse=True)
            top3 = remaining[:3]
            
            # Everything else
            everything_else = remaining[3:]
            
            # Apply labels
            all_todos = []
            
            # Top 7
            logging.info("🏆 Tagging Top 7 Most Important...")
            for email in top7:
                await self.apply_labels(email, ['Top7'] + email['tags'])
                all_todos.extend(email['todo_items'])
                logging.info(f"  ⭐ {email['subject'][:50]} (Score: {email['importance_score']:.1f})")
            
            # Top 3
            logging.info("⚡ Tagging Top 3 Most Urgent...")
            for email in top3:
                await self.apply_labels(email, ['Top3'] + email['tags'])
                all_todos.extend(email['todo_items'])
                logging.info(f"  🔥 {email['subject'][:50]} (Urgency: {email['urgency_score']:.1f})")
            
            # Everything else
            logging.info(f"📋 Tagging everything else ({len(everything_else)} emails)...")
            for i, email in enumerate(everything_else, 1):
                await self.apply_labels(email, email['tags'])
                all_todos.extend(email['todo_items'])
                if i % 10 == 0:
                    logging.info(f"   Tagged {i}/{len(everything_else)}...")
                time.sleep(0.3)  # Small delay to avoid rate limits
            
            # Store all TODOs in database
            await self.store_todos(all_todos)
            
            logging.info(f"✅ Organization complete!")
            logging.info(f"   🏆 Top 7: {len(top7)}")
            logging.info(f"   ⚡ Top 3: {len(top3)}")
            logging.info(f"   📋 Everything else: {len(everything_else)}")
            logging.info(f"   ✅ Generated {len(all_todos)} TODO items")
            
        except Exception as e:
            logging.error(f"❌ Error organizing inbox: {e}")
    
    async def apply_labels(self, email: dict, tags: list):
        """Apply labels to an email and surface it to INBOX"""
        try:
            label_ids = [self.labels[tag] for tag in tags if tag in self.labels]
            
            # ALWAYS add INBOX tag to surface the email
            label_ids.append('INBOX')
            
            if label_ids:
                self.gmail_service.users().messages().modify(
                    userId='me',
                    id=email['id'],
                    body={'addLabelIds': label_ids}
                ).execute()
            
        except Exception as e:
            logging.error(f"❌ Error applying labels: {e}")
    
    async def store_todos(self, todos: list):
        """Store all TODO items in database"""
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
            
            logging.info(f"✅ Stored {len(todos)} TODO items in database")
            
        except Exception as e:
            logging.error(f"❌ Error storing TODOs: {e}")

async def main():
    """Main function"""
    inbox = RobbieSmartInbox()
    await inbox.initialize()
    await inbox.organize_inbox()

if __name__ == "__main__":
    asyncio.run(main())
