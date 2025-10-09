#!/usr/bin/env python3
"""
ROBBIE INTELLIGENT INBOX - FULL AUTO MODE
Surfaces important emails (mark unread, star, pin) and submerges after response
"""

import asyncio
import psycopg2
import json
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Tuple
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

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/Users/allanperetz/aurora-ai-robbiverse/logs/robbie-inbox.log'),
        logging.StreamHandler()
    ]
)

class RobbieIntelligentInbox:
    def __init__(self):
        self.gmail_service = None
        self.db_conn = None
        self.personality_state = {}
        self.conversational_priorities = []
        self.surfaced_emails = set()  # Track what we've surfaced
        
    async def initialize(self):
        """Initialize Gmail and database connections"""
        try:
            # Gmail setup
            credentials = service_account.Credentials.from_service_account_file(
                CREDS_FILE, scopes=SCOPES
            )
            delegated_credentials = credentials.with_subject(ADMIN_EMAIL)
            self.gmail_service = build('gmail', 'v1', credentials=delegated_credentials)
            
            # Database setup
            self.db_conn = psycopg2.connect(**DB_CONFIG)
            
            # Load Robbie's current state
            await self.load_robbie_state()
            
            # Load surfaced emails from previous run
            await self.load_surfaced_emails()
            
            logging.info("🤖 Robbie Intelligent Inbox initialized!")
            
        except Exception as e:
            logging.error(f"❌ Initialization error: {e}")
            raise
    
    async def load_robbie_state(self):
        """Load Robbie's personality sliders from database"""
        try:
            cursor = self.db_conn.cursor()
            
            # Get personality state
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
            
            # Get conversational priorities
            cursor.execute("""
                SELECT priority_type, priority_content, weight
                FROM conversational_priorities 
                WHERE user_id = 'allan' AND active = true
                ORDER BY weight DESC
            """)
            priorities = cursor.fetchall()
            
            self.conversational_priorities = [
                {
                    'type': p[0],
                    'content': p[1], 
                    'weight': p[2]
                } for p in priorities
            ]
            
            cursor.close()
            
            logging.info(f"🎭 Robbie state loaded - Auto:{self.personality_state.get('auto', 'N/A')}")
            
        except Exception as e:
            logging.error(f"❌ Error loading Robbie state: {e}")
    
    async def load_surfaced_emails(self):
        """Load previously surfaced emails from database"""
        try:
            cursor = self.db_conn.cursor()
            
            # Get surfaced emails from last 7 days
            cursor.execute("""
                SELECT source_id 
                FROM priorities_queue 
                WHERE task_type = 'email_surfaced' 
                AND created_at > NOW() - INTERVAL '7 days'
                AND status != 'submerged'
            """)
            
            surfaced = cursor.fetchall()
            self.surfaced_emails = {email[0] for email in surfaced}
            
            cursor.close()
            
            logging.info(f"🌊 Loaded {len(self.surfaced_emails)} surfaced emails")
            
        except Exception as e:
            logging.error(f"❌ Error loading surfaced emails: {e}")
    
    async def analyze_email_importance(self, email_data: Dict[str, Any]) -> Tuple[float, str]:
        """Analyze email importance based on Robbie's personality and priorities"""
        try:
            importance_score = 0.0
            reasoning = []
            
            # Base factors
            subject = email_data.get('subject', '').lower()
            sender = email_data.get('sender', '').lower()
            body_preview = email_data.get('body_preview', '').lower()
            is_unread = email_data.get('is_unread', False)
            labels = email_data.get('labels', [])
            
            # 1. Sender importance (REVENUE & RELATIONSHIPS FIRST!)
            sender_importance = 0
            
            # TOP PRIORITY: Real people and business
            if 'linkedin' in sender and 'messaging' in sender:
                sender_importance = 15  # Direct LinkedIn messages
                reasoning.append("💬 LinkedIn message")
            elif 'testpilot' in sender or 'wildmonkey' in sender:
                sender_importance = 14  # TestPilot business
                reasoning.append("💼 TestPilot/Client")
            elif 'hubspot' in sender and 'forms' in sender:
                sender_importance = 13  # New leads!
                reasoning.append("🎯 HubSpot lead")
            elif 'linkedin' in sender:
                sender_importance = 10  # LinkedIn content
                reasoning.append("📱 LinkedIn")
            elif '@' in sender and not any(x in sender for x in ['noreply', 'no-reply', 'notifications', 'alerts']):
                sender_importance = 9  # Real person
                reasoning.append("👤 Real person")
            
            # LOWER PRIORITY: Alerts and notifications
            elif 'github' in sender or 'gitguardian' in sender:
                sender_importance = 3  # GitHub alerts
                reasoning.append("🔧 GitHub")
            elif 'google' in sender and 'alert' in sender:
                sender_importance = 2  # Google alerts
                reasoning.append("⚠️ Google alert")
            elif 'elestio' in sender or 'runpod' in sender:
                sender_importance = 2  # Infrastructure
                reasoning.append("🖥️ Infrastructure")
            
            importance_score += sender_importance * 0.40  # Increased weight!
            
            # 2. Subject keywords (BUSINESS FIRST!)
            subject_keywords = {
                # REVENUE & BUSINESS (highest priority)
                'deal': 20, 'proposal': 18, 'contract': 18, 'sale': 16,
                'revenue': 16, 'client': 15, 'customer': 15, 'lead': 14,
                'meeting': 14, 'call': 12, 'demo': 12, 'opportunity': 14,
                
                # RELATIONSHIPS
                'messaged you': 18, 'replied': 12, 'mentioned': 10,
                
                # PROJECTS & WORK
                'project': 10, 'deadline': 12, 'urgent': 10,
                
                # LOWER PRIORITY: Alerts
                'alert': 3, 'security': 3, 'error': 4, 'failed': 2,
                
                # AI/AUTOMATION
                'ai': 8, 'agent': 8, 'robbie': 10, 'automation': 8
            }
            
            subject_score = 0
            for keyword, weight in subject_keywords.items():
                if keyword in subject:
                    subject_score += weight
                    reasoning.append(f"💡 '{keyword}'")
            
            importance_score += subject_score * 0.30  # Increased weight!
            
            # 3. Label importance
            label_importance = 0
            if 'Action' in labels:
                label_importance += 15
                reasoning.append("Action label")
            if 'Comment' in labels:
                label_importance += 10
                reasoning.append("Comment label")
            if 'FYI' in labels:
                label_importance += 8
                reasoning.append("FYI label")
            
            importance_score += label_importance * 0.25
            
            # 4. Conversational priorities
            priority_score = 0
            for priority in self.conversational_priorities:
                content = priority['content'].lower()
                weight = priority['weight']
                
                if any(word in subject or word in body_preview for word in content.split()):
                    priority_score += weight
                    reasoning.append(f"Priority: {priority['type']}")
            
            importance_score += priority_score * 0.15
            
            # 5. Recency
            email_date = email_data.get('date', datetime.now())
            now = datetime.now()
            hours_old = (now - email_date).total_seconds() / 3600
            
            if hours_old < 1:
                recency_score = 10
                reasoning.append("Very recent")
            elif hours_old < 6:
                recency_score = 7
                reasoning.append("Recent")
            elif hours_old < 24:
                recency_score = 5
                reasoning.append("Today")
            else:
                recency_score = 3
            
            importance_score += recency_score * 0.10
            
            return importance_score, " | ".join(reasoning[:3])
            
        except Exception as e:
            logging.error(f"❌ Error analyzing email: {e}")
            return 0.0, "Error"
    
    async def get_top_10_emails(self) -> Dict[str, List[Dict[str, Any]]]:
        """Get Top 10 most important emails"""
        try:
            logging.info("🔍 Analyzing ALL emails for Top 10...")
            
            # Get ALL emails (not just inbox) from last 7 days
            results = self.gmail_service.users().messages().list(
                userId='me',
                maxResults=200,
                q='newer_than:7d'
            ).execute()
            
            messages = results.get('messages', [])
            logging.info(f"📧 Found {len(messages)} emails to analyze")
            
            # Analyze each email
            analyzed_emails = []
            
            for msg in messages[:100]:  # Limit for performance
                try:
                    message = self.gmail_service.users().messages().get(
                        userId='me',
                        id=msg['id'],
                        format='full'
                    ).execute()
                    
                    headers = message['payload'].get('headers', [])
                    subject = next((h['value'] for h in headers if h['name'] == 'Subject'), 'No Subject')
                    sender = next((h['value'] for h in headers if h['name'] == 'From'), 'Unknown')
                    date_str = next((h['value'] for h in headers if h['name'] == 'Date'), '')
                    
                    # Parse date
                    try:
                        from email.utils import parsedate_to_datetime
                        email_date = parsedate_to_datetime(date_str)
                        if email_date.tzinfo is not None:
                            email_date = email_date.replace(tzinfo=None)
                    except:
                        email_date = datetime.now()
                    
                    # Get body preview
                    body_preview = ""
                    if 'parts' in message['payload']:
                        for part in message['payload']['parts']:
                            if part['mimeType'] == 'text/plain':
                                body_data = part['body'].get('data', '')
                                if body_data:
                                    import base64
                                    body_preview = base64.urlsafe_b64decode(body_data).decode('utf-8', errors='ignore')[:200]
                                    break
                    
                    # Get labels
                    label_ids = message.get('labelIds', [])
                    label_names = []
                    for label_id in label_ids:
                        if not label_id.startswith('CATEGORY_') and label_id not in ['INBOX', 'SENT', 'DRAFT', 'SPAM', 'TRASH', 'UNREAD', 'STARRED', 'IMPORTANT']:
                            try:
                                label = self.gmail_service.users().labels().get(
                                    userId='me',
                                    id=label_id
                                ).execute()
                                label_names.append(label['name'])
                            except:
                                pass
                    
                    is_unread = 'UNREAD' in label_ids
                    in_inbox = 'INBOX' in label_ids
                    is_starred = 'STARRED' in label_ids
                    
                    email_data = {
                        'id': msg['id'],
                        'subject': subject,
                        'sender': sender,
                        'date': email_date,
                        'body_preview': body_preview,
                        'is_unread': is_unread,
                        'in_inbox': in_inbox,
                        'is_starred': is_starred,
                        'labels': label_names
                    }
                    
                    # Analyze importance
                    importance_score, reasoning = await self.analyze_email_importance(email_data)
                    
                    email_data['importance_score'] = importance_score
                    email_data['reasoning'] = reasoning
                    
                    analyzed_emails.append(email_data)
                    
                except Exception as e:
                    logging.error(f"❌ Error processing email: {e}")
                    continue
            
            # Sort by importance
            analyzed_emails.sort(key=lambda x: x['importance_score'], reverse=True)
            
            # Aggressive deduplication by normalized subject
            seen_subjects = {}
            deduplicated_emails = []
            
            for email in analyzed_emails:
                subject = email['subject'].lower()
                # Remove common prefixes
                subject = subject.replace('re:', '').replace('fwd:', '').replace('fw:', '').strip()
                
                # Normalize GitHub subjects - extract the core message
                if 'github' in subject or 'run failed' in subject:
                    # Extract just the repo and action type
                    if 'run failed' in subject:
                        subject = 'github_run_failed'
                    elif 'security scan' in subject:
                        subject = 'github_security_scan'
                    elif 'workflow' in subject:
                        subject = 'github_workflow'
                
                # Normalize Google alerts
                if 'security alert' in subject or 'password' in subject:
                    if 'password' in subject:
                        subject = 'google_password_alert'
                    elif 'sign-in' in subject or 'signin' in subject:
                        subject = 'google_signin_alert'
                    else:
                        subject = 'google_security_alert'
                
                # Keep only first occurrence
                if subject not in seen_subjects:
                    seen_subjects[subject] = True
                    deduplicated_emails.append(email)
                else:
                    logging.info(f"🗑️ Skipping duplicate: {email['subject'][:50]}")
            
            logging.info(f"📧 Deduplicated: {len(analyzed_emails)} → {len(deduplicated_emails)}")
            
            # Top 10
            most_important = deduplicated_emails[:7]
            most_urgent = deduplicated_emails[7:10]
            
            return {
                'most_important': most_important,
                'most_urgent': most_urgent,
                'total_analyzed': len(deduplicated_emails)
            }
            
        except Exception as e:
            logging.error(f"❌ Error getting top 10: {e}")
            return {'most_important': [], 'most_urgent': [], 'total_analyzed': 0}
    
    async def surface_email(self, email: Dict[str, Any]):
        """Surface email: mark unread, star, and move to inbox"""
        try:
            email_id = email['id']
            
            logging.info(f"🌊 SURFACING: {email['subject'][:50]}")
            
            # Modify email: add UNREAD, STARRED, INBOX
            self.gmail_service.users().messages().modify(
                userId='me',
                id=email_id,
                body={
                    'addLabelIds': ['UNREAD', 'STARRED', 'INBOX'],
                    'removeLabelIds': []
                }
            ).execute()
            
            # Track in database
            cursor = self.db_conn.cursor()
            cursor.execute("""
                INSERT INTO priorities_queue (
                    task_id, task_type, task_category, task_description,
                    source, source_id, total_score, status
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, 'surfaced')
                ON CONFLICT (task_id) DO UPDATE SET
                    updated_at = CURRENT_TIMESTAMP,
                    status = 'surfaced'
            """, (
                f"email_surfaced_{email_id}",
                'email_surfaced',
                'inbox_management',
                f"Surfaced: {email['subject'][:100]}",
                'gmail',
                email_id,
                email['importance_score']
            ))
            self.db_conn.commit()
            cursor.close()
            
            # Add to surfaced set
            self.surfaced_emails.add(email_id)
            
            logging.info(f"✅ Surfaced: {email['subject'][:50]}")
            
        except Exception as e:
            logging.error(f"❌ Error surfacing email: {e}")
    
    async def check_for_response(self, email: Dict[str, Any]) -> bool:
        """Check if Allan responded to this email"""
        try:
            email_id = email['id']
            
            # Get the email's thread ID
            message = self.gmail_service.users().messages().get(
                userId='me',
                id=email_id
            ).execute()
            
            thread_id = message.get('threadId')
            
            # Check if there are sent messages in this thread after we surfaced it
            sent_in_thread = self.gmail_service.users().messages().list(
                userId='me',
                q=f'in:sent thread:{thread_id}'
            ).execute()
            
            sent_messages = sent_in_thread.get('messages', [])
            
            if sent_messages:
                logging.info(f"✅ Allan responded to: {email['subject'][:50]}")
                return True
            
            return False
            
        except Exception as e:
            logging.error(f"❌ Error checking response: {e}")
            return False
    
    async def submerge_email(self, email: Dict[str, Any]):
        """Submerge email: mark read, unstar, archive"""
        try:
            email_id = email['id']
            
            logging.info(f"🌊 SUBMERGING: {email['subject'][:50]}")
            
            # Modify email: remove UNREAD, STARRED, INBOX
            self.gmail_service.users().messages().modify(
                userId='me',
                id=email_id,
                body={
                    'addLabelIds': [],
                    'removeLabelIds': ['UNREAD', 'STARRED', 'INBOX']
                }
            ).execute()
            
            # Update database
            cursor = self.db_conn.cursor()
            cursor.execute("""
                UPDATE priorities_queue
                SET status = 'submerged', completed_at = CURRENT_TIMESTAMP
                WHERE task_id = %s
            """, (f"email_surfaced_{email_id}",))
            self.db_conn.commit()
            cursor.close()
            
            # Remove from surfaced set
            self.surfaced_emails.discard(email_id)
            
            logging.info(f"✅ Submerged: {email['subject'][:50]}")
            
        except Exception as e:
            logging.error(f"❌ Error submerging email: {e}")
    
    async def log_security_alert_as_task(self, email: Dict[str, Any]):
        """Log security alerts as tasks in Priorities Engine instead of surfacing"""
        try:
            email_id = email['id']
            subject = email['subject']
            sender = email['sender']
            
            logging.info(f"🔒 Logging security alert as task: {subject[:50]}")
            
            # Determine task type
            if 'github' in sender.lower():
                task_type = 'github_security_alert'
                task_category = 'system_maintenance'
            elif 'google' in sender.lower():
                task_type = 'google_security_alert'
                task_category = 'system_maintenance'
            else:
                task_type = 'security_alert'
                task_category = 'system_maintenance'
            
            # Create task in Priorities Engine
            cursor = self.db_conn.cursor()
            cursor.execute("""
                INSERT INTO priorities_queue (
                    task_id, task_type, task_category, task_description,
                    source, source_id, total_score, status
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, 'pending')
                ON CONFLICT (task_id) DO UPDATE SET
                    updated_at = CURRENT_TIMESTAMP
            """, (
                f"security_alert_{email_id}",
                task_type,
                task_category,
                f"Security Alert: {subject[:100]}",
                'gmail',
                email_id,
                email['importance_score']
            ))
            self.db_conn.commit()
            cursor.close()
            
            # Archive the email (don't surface it)
            self.gmail_service.users().messages().modify(
                userId='me',
                id=email_id,
                body={
                    'addLabelIds': [],
                    'removeLabelIds': ['INBOX', 'UNREAD']
                }
            ).execute()
            
            logging.info(f"✅ Logged as task and archived: {subject[:50]}")
            
        except Exception as e:
            logging.error(f"❌ Error logging security alert: {e}")
    
    async def run_full_auto_cycle(self):
        """Run full auto inbox management cycle"""
        try:
            logging.info("🚀 Starting FULL AUTO inbox cycle...")
            
            # 1. Get Top 10 emails
            top_10 = await self.get_top_10_emails()
            
            most_important = top_10['most_important']
            most_urgent = top_10['most_urgent']
            all_emails = most_important + most_urgent
            
            logging.info(f"🎯 Top 10: {len(most_important)} important, {len(most_urgent)} urgent")
            
            # 2. Separate security alerts from business emails
            security_alerts = []
            business_emails = []
            
            for email in all_emails:
                sender = email['sender'].lower()
                subject = email['subject'].lower()
                
                # Check if it's a security alert
                is_security_alert = (
                    ('github' in sender and ('security' in subject or 'failed' in subject)) or
                    ('google' in sender and 'alert' in subject) or
                    ('gitguardian' in sender) or
                    ('elestio' in sender and 'alert' in subject)
                )
                
                if is_security_alert:
                    security_alerts.append(email)
                else:
                    business_emails.append(email)
            
            logging.info(f"🔒 Security alerts: {len(security_alerts)}, 💼 Business emails: {len(business_emails)}")
            
            # 3. Log security alerts as tasks (don't surface them)
            for email in security_alerts:
                await self.log_security_alert_as_task(email)
            
            # 4. Check surfaced emails for responses
            for email_id in list(self.surfaced_emails):
                # Find email in business emails
                email = next((e for e in business_emails if e['id'] == email_id), None)
                
                if email:
                    # Check if Allan responded
                    if await self.check_for_response(email):
                        # Submerge it!
                        await self.submerge_email(email)
            
            # 5. Surface new business emails (Top 10)
            surfaced_count = 0
            for email in business_emails[:10]:  # Only top 10 business emails
                if email['id'] not in self.surfaced_emails:
                    # Surface it!
                    await self.surface_email(email)
                    surfaced_count += 1
            
            logging.info(f"🌊 Surfaced {surfaced_count} business emails")
            logging.info(f"🔒 Logged {len(security_alerts)} security alerts as tasks")
            logging.info(f"🏁 FULL AUTO cycle complete!")
            
        except Exception as e:
            logging.error(f"❌ Error in full auto cycle: {e}")
        finally:
            if self.db_conn:
                self.db_conn.close()

async def main():
    """Main function"""
    inbox = RobbieIntelligentInbox()
    await inbox.initialize()
    await inbox.run_full_auto_cycle()

if __name__ == "__main__":
    asyncio.run(main())