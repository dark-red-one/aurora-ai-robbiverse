#!/usr/bin/env python3
"""
ROBBIE EMAIL INTERCEPTOR
Intercepts emails the SECOND they arrive, removes INBOX tag,
organizes into folders, and adds RobbieSummary
"""

import asyncio
import psycopg2
import logging
import time
import aiohttp
from datetime import datetime
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
        logging.FileHandler('/Users/allanperetz/aurora-ai-robbiverse/logs/email-interceptor.log'),
        logging.StreamHandler()
    ]
)

class RobbieEmailInterceptor:
    def __init__(self):
        self.gmail_service = None
        self.db_conn = None
        self.processed_emails = set()
        self.labels = {}
        
    async def initialize(self):
        """Initialize Gmail connection"""
        try:
            credentials = service_account.Credentials.from_service_account_file(
                CREDS_FILE, scopes=SCOPES
            )
            delegated_credentials = credentials.with_subject(ADMIN_EMAIL)
            self.gmail_service = build('gmail', 'v1', credentials=delegated_credentials)
            
            self.db_conn = psycopg2.connect(**DB_CONFIG)
            
            # Load all labels
            await self.load_labels()
            
            # Load processed emails
            await self.load_processed_emails()
            
            logging.info("🚀 Robbie Email Interceptor initialized!")
            
        except Exception as e:
            logging.error(f"❌ Initialization error: {e}")
            raise
    
    async def load_labels(self):
        """Load all Gmail labels"""
        try:
            labels_result = self.gmail_service.users().labels().list(userId='me').execute()
            labels = labels_result.get('labels', [])
            
            self.labels = {label['name']: label['id'] for label in labels}
            
            # Ensure key labels exist
            required_labels = [
                'ROBBIE/Revenue',
                'ROBBIE/Clients',
                'ROBBIE/Leads',
                'ROBBIE/LinkedIn',
                'ROBBIE/Alerts',
                'ROBBIE/Sales-Junk',
                'ROBBIE/Processed'
            ]
            
            for label_name in required_labels:
                if label_name not in self.labels:
                    # Create label
                    label = self.gmail_service.users().labels().create(
                        userId='me',
                        body={'name': label_name}
                    ).execute()
                    self.labels[label_name] = label['id']
                    logging.info(f"✅ Created label: {label_name}")
            
        except Exception as e:
            logging.error(f"❌ Error loading labels: {e}")
    
    async def load_processed_emails(self):
        """Load recently processed emails from database"""
        try:
            cursor = self.db_conn.cursor()
            cursor.execute("""
                SELECT source_id 
                FROM priorities_queue 
                WHERE task_type = 'email_intercepted'
                AND created_at > NOW() - INTERVAL '24 hours'
            """)
            
            emails = cursor.fetchall()
            self.processed_emails = {email[0] for email in emails}
            
            cursor.close()
            logging.info(f"📧 Loaded {len(self.processed_emails)} processed emails")
            
        except Exception as e:
            logging.error(f"❌ Error loading processed emails: {e}")
    
    async def generate_robbie_summary(self, email_data: dict) -> str:
        """Generate 'Why Allan should care' summary"""
        try:
            subject = email_data['subject']
            sender = email_data['sender']
            body_preview = email_data.get('body_preview', '')[:500]
            
            # Analyze why Allan should care
            reasons = []
            priority = "MEDIUM"
            
            # Revenue opportunities
            if any(word in subject.lower() or word in sender.lower() for word in ['deal', 'proposal', 'contract', 'revenue', '$']):
                reasons.append("💰 REVENUE OPPORTUNITY")
                priority = "HIGH"
            
            # Client communication
            if any(word in sender.lower() for word in ['testpilot', 'wildmonkey', 'simplygoodfoods']):
                reasons.append("👤 CLIENT COMMUNICATION")
                priority = "HIGH"
            
            # LinkedIn connections
            if 'linkedin' in sender.lower() and 'messaged you' in subject.lower():
                reasons.append("🤝 LINKEDIN CONNECTION")
                priority = "HIGH"
            
            # HubSpot leads
            if 'hubspot' in sender.lower() and 'submission' in subject.lower():
                reasons.append("🎯 NEW LEAD")
                priority = "HIGH"
            
            # Meeting requests
            if any(word in subject.lower() for word in ['meeting', 'call', 'schedule', 'calendar']):
                reasons.append("📅 MEETING REQUEST")
                priority = "MEDIUM"
            
            # Action required
            if any(word in subject.lower() for word in ['urgent', 'asap', 'action required', 'deadline']):
                reasons.append("⚡ ACTION REQUIRED")
                priority = "HIGH"
            
            # Sales/Marketing (low priority)
            if any(word in sender.lower() for word in ['noreply', 'no-reply', 'marketing', 'newsletter']):
                if not reasons:  # Only if no other reasons
                    reasons.append("📧 SALES/MARKETING")
                    priority = "LOW"
            
            # Build summary
            if not reasons:
                reasons.append("📬 GENERAL EMAIL")
            
            summary = f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 ROBBIE SUMMARY - {priority} PRIORITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WHY ALLAN SHOULD CARE:
{' | '.join(reasons)}

FROM: {sender[:60]}
SUBJECT: {subject[:60]}

QUICK CONTEXT:
{body_preview[:200]}...

ROBBIE'S RECOMMENDATION:
"""
            
            if priority == "HIGH":
                summary += "⭐ REVIEW THIS NOW - High value/urgency"
            elif priority == "MEDIUM":
                summary += "📋 Review when you have time"
            else:
                summary += "🗂️ Filed for reference - low priority"
            
            summary += "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            
            return summary
            
        except Exception as e:
            logging.error(f"❌ Error generating summary: {e}")
            return "🤖 ROBBIE: Unable to generate summary"
    
    async def generate_robbie_response_via_universal_input(self, email_data: dict) -> str:
        """
        Generate Robbie's response via Universal Input API
        
        This routes through the universal input API with SENDER's personality settings.
        Joe gets professional responses, Allan gets flirty responses.
        """
        try:
            subject = email_data['subject']
            sender = email_data['sender']
            body_preview = email_data.get('body_preview', '')
            
            # Extract sender email
            sender_email = sender.split('<')[-1].split('>')[0].strip()
            if not sender_email:
                sender_email = sender
            
            # Look up user by email (Joe vs Allan vs guest)
            user_id = self.lookup_user_by_email(sender_email)
            
            logging.info(f"📧 Email TO robbie@testpilot.ai from {sender_email} (user_id: {user_id})")
            
            # Route through universal input API
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    'http://localhost:8000/api/v2/universal/request',
                    json={
                        'source': 'email',
                        'source_metadata': {
                            'sender': sender_email,
                            'subject': subject,
                            'to': 'robbie@testpilot.ai'
                        },
                        'ai_service': 'chat',
                        'payload': {
                            'input': f"Email from {sender_email}:\nSubject: {subject}\n\n{body_preview}",
                            'parameters': {
                                'temperature': 0.7,
                                'max_tokens': 500
                            }
                        },
                        'user_id': user_id,  # CRITICAL: Use sender's user_id
                        'fetch_context': True
                    },
                    timeout=aiohttp.ClientTimeout(total=20)
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        if data.get('status') == 'approved':
                            robbie_response = data['robbie_response']['message']
                            mood = data['robbie_response']['mood']
                            
                            # Format as email draft
                            draft = f"""🤖 ROBBIE RESPONSE (mood: {mood}, user: {user_id}):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{robbie_response}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 Reply based on {user_id}'s personality settings
"""
                            
                            logging.info(f"✅ Generated Robbie response for {user_id} (mood: {mood})")
                            return draft
                        else:
                            logging.warning(f"Request rejected: {data.get('gatekeeper_review', {}).get('reasoning')}")
                            return f"🤖 ROBBIE: Message blocked by gatekeeper"
                    else:
                        error_text = await response.text()
                        logging.error(f"Universal input API error: {response.status} - {error_text}")
                        return f"🤖 ROBBIE: API error - {response.status}"
        
        except Exception as e:
            logging.error(f"❌ Error generating universal input response: {e}")
            return "🤖 ROBBIE: Unable to generate response"
    
    def lookup_user_by_email(self, email: str) -> str:
        """
        Look up user ID by email address
        
        Args:
            email: Email address of sender
            
        Returns:
            User ID (allan, joe, or guest)
        """
        # Normalize email
        email = email.lower().strip()
        
        # Known email mappings
        known_users = {
            'allan@testpilotcpg.com': 'allan',
            'allan@testpilot.ai': 'allan',
            'joe@testpilotcpg.com': 'joe',
            'joe@testpilot.ai': 'joe'
        }
        
        user_id = known_users.get(email, 'guest')
        logging.info(f"📧 Email lookup: {email} → {user_id}")
        return user_id
    
    async def categorize_email(self, email_data: dict) -> str:
        """Determine which folder/label this email belongs to"""
        subject = email_data['subject'].lower()
        sender = email_data['sender'].lower()
        
        # Revenue/Deals
        if any(word in subject or word in sender for word in ['deal', 'proposal', 'contract', '$', 'revenue']):
            return 'ROBBIE/Revenue'
        
        # Clients
        if any(word in sender for word in ['testpilot', 'wildmonkey', 'simplygoodfoods']):
            return 'ROBBIE/Clients'
        
        # Leads
        if 'hubspot' in sender and 'submission' in subject:
            return 'ROBBIE/Leads'
        
        # LinkedIn
        if 'linkedin' in sender:
            if 'messaged you' in subject:
                return 'ROBBIE/Leads'  # Direct messages are leads
            else:
                return 'ROBBIE/LinkedIn'  # Other LinkedIn stuff
        
        # Alerts (GitHub, Google, etc.)
        if any(word in sender for word in ['github', 'google', 'alert', 'notification', 'elestio', 'runpod']):
            return 'ROBBIE/Alerts'
        
        # Sales junk
        if any(word in sender for word in ['noreply', 'no-reply', 'marketing', 'newsletter', 'unsubscribe']):
            return 'ROBBIE/Sales-Junk'
        
        # Default
        return 'ROBBIE/Processed'
    
    async def add_robbie_summary_to_email(self, email_id: str, summary: str):
        """Add RobbieSummary by storing it in the database (not as email reply)"""
        try:
            # Store summary in database instead of sending email
            cursor = self.db_conn.cursor()
            cursor.execute("""
                INSERT INTO priorities_queue (
                    task_id, task_type, task_category, task_description,
                    source, source_id, llm_reasoning, status
                )
                VALUES (%s, %s, %s, %s, 'gmail', %s, %s, 'completed')
                ON CONFLICT (task_id) DO UPDATE SET
                    llm_reasoning = EXCLUDED.llm_reasoning,
                    updated_at = CURRENT_TIMESTAMP
            """, (
                f"robbie_summary_{email_id}",
                'robbie_summary',
                'email_analysis',
                f"RobbieSummary for email",
                email_id,
                summary
            ))
            self.db_conn.commit()
            cursor.close()
            
            logging.info(f"✅ Stored RobbieSummary in database")
            
        except Exception as e:
            logging.error(f"❌ Error storing summary: {e}")
    
    async def intercept_email(self, email_id: str):
        """Intercept and process a single email"""
        try:
            # Get full message
            message = self.gmail_service.users().messages().get(
                userId='me',
                id=email_id,
                format='full'
            ).execute()
            
            headers = message['payload'].get('headers', [])
            subject = next((h['value'] for h in headers if h['name'] == 'Subject'), 'No Subject')
            sender = next((h['value'] for h in headers if h['name'] == 'From'), 'Unknown')
            
            logging.info(f"🔍 Intercepting: {subject[:50]}")
            
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
                'id': email_id,
                'subject': subject,
                'sender': sender,
                'body_preview': body_preview
            }
            
            # Check if email is TO robbie@testpilot.ai
            to_addresses = []
            for header in headers:
                if header['name'] == 'To':
                    to_addresses.append(header['value'])
            
            is_to_robbie = any('robbie@testpilot.ai' in addr.lower() for addr in to_addresses)
            
            # 1. Generate RobbieSummary OR route through universal input
            if is_to_robbie:
                # Route through universal input with SENDER's personality
                summary = await self.generate_robbie_response_via_universal_input(email_data)
            else:
                # Regular summary generation
                summary = await self.generate_robbie_summary(email_data)
            
            # 2. Add summary to email
            await self.add_robbie_summary_to_email(email_id, summary)
            
            # 3. Categorize email
            target_label = await self.categorize_email(email_data)
            
            # 4. Remove INBOX, add target label
            label_id = self.labels.get(target_label)
            
            if label_id:
                self.gmail_service.users().messages().modify(
                    userId='me',
                    id=email_id,
                    body={
                        'addLabelIds': [label_id, self.labels['ROBBIE/Processed']],
                        'removeLabelIds': ['INBOX', 'UNREAD']
                    }
                ).execute()
                
                logging.info(f"✅ Moved to {target_label} and removed from INBOX")
            
            # 5. Log to database
            cursor = self.db_conn.cursor()
            cursor.execute("""
                INSERT INTO priorities_queue (
                    task_id, task_type, task_category, task_description,
                    source, source_id, status
                )
                VALUES (%s, %s, %s, %s, 'gmail', %s, 'completed')
                ON CONFLICT (task_id) DO NOTHING
            """, (
                f"email_intercepted_{email_id}",
                'email_intercepted',
                'inbox_management',
                f"Intercepted: {subject[:100]}",
                email_id
            ))
            self.db_conn.commit()
            cursor.close()
            
            # Mark as processed
            self.processed_emails.add(email_id)
            
        except Exception as e:
            logging.error(f"❌ Error intercepting email {email_id}: {e}")
    
    async def run_interceptor_cycle(self):
        """Run one cycle of email interception"""
        try:
            logging.info("🚀 Starting email interception cycle...")
            
            # Get ALL emails in INBOX
            results = self.gmail_service.users().messages().list(
                userId='me',
                maxResults=50,
                q='in:inbox'
            ).execute()
            
            messages = results.get('messages', [])
            logging.info(f"📧 Found {len(messages)} emails in INBOX")
            
            intercepted_count = 0
            
            for msg in messages:
                email_id = msg['id']
                
                # Skip if already processed
                if email_id in self.processed_emails:
                    continue
                
                # Intercept it!
                await self.intercept_email(email_id)
                intercepted_count += 1
                
                # Small delay to avoid rate limits
                time.sleep(0.5)
            
            logging.info(f"✅ Intercepted {intercepted_count} new emails")
            logging.info(f"🏁 Interception cycle complete!")
            
        except Exception as e:
            logging.error(f"❌ Error in interceptor cycle: {e}")
        finally:
            if self.db_conn:
                self.db_conn.close()

async def main():
    """Main function"""
    interceptor = RobbieEmailInterceptor()
    await interceptor.initialize()
    await interceptor.run_interceptor_cycle()

if __name__ == "__main__":
    asyncio.run(main())
