#!/usr/bin/env python3
"""
ROBBIE CLEAN INBOX
Emergency cleanup: Only Top7/Top3 emails should be in INBOX
"""

import psycopg2
from google.oauth2 import service_account
from googleapiclient.discovery import build
import logging

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

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')

def clean_inbox():
    """Remove ALL emails from inbox, then surface only Top 10"""
    try:
        # Connect to Gmail
        credentials = service_account.Credentials.from_service_account_file(CREDS_FILE, scopes=SCOPES)
        delegated_credentials = credentials.with_subject(ADMIN_EMAIL)
        gmail = build('gmail', 'v1', credentials=delegated_credentials)
        
        logging.info("🧹 CLEANING INBOX...")
        
        # Get all emails in inbox
        inbox = gmail.users().messages().list(userId='me', maxResults=500, q='in:inbox').execute()
        messages = inbox.get('messages', [])
        
        logging.info(f"📧 Found {len(messages)} emails in inbox")
        
        # Remove INBOX tag from ALL emails (SUBMERGE EVERYTHING)
        logging.info("🌊 SUBMERGING all emails...")
        for i, msg in enumerate(messages):
            try:
                gmail.users().messages().modify(
                    userId='me',
                    id=msg['id'],
                    body={'removeLabelIds': ['INBOX']}
                ).execute()
                
                if i % 50 == 0:
                    logging.info(f"   Submerged {i} emails...")
            except Exception as e:
                logging.error(f"Error submerging email {msg['id']}: {e}")
        
        logging.info(f"✅ Submerged {len(messages)} emails from inbox")
        
        # Now surface only Top 10
        surface_top_10(gmail)
        
    except Exception as e:
        logging.error(f"❌ Error: {e}")

def surface_top_10(gmail):
    """Surface only the Top 10 emails with proper tags"""
    try:
        # Get Top 10 from database
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT interaction_id, subject, importance_score, urgency_score
            FROM interactions
            WHERE interaction_type = 'email'
            AND interaction_date > NOW() - INTERVAL '3 days'
            AND (importance_score > 0 OR urgency_score > 0)
            ORDER BY importance_score DESC, urgency_score DESC
            LIMIT 10
        """)
        
        top_emails = cursor.fetchall()
        cursor.close()
        conn.close()
        
        logging.info(f"🏆 Surfacing {len(top_emails)} Top emails...")
        
        # Get Gmail labels
        labels_result = gmail.users().labels().list(userId='me').execute()
        labels = {label['name']: label['id'] for label in labels_result.get('labels', [])}
        
        # Ensure Top7 and Top3 labels exist
        for label_name in ['Top7', 'Top3']:
            if label_name not in labels:
                label = gmail.users().labels().create(
                    userId='me',
                    body={'name': label_name}
                ).execute()
                labels[label_name] = label['id']
                logging.info(f"✅ Created label: {label_name}")
        
        # Surface ONLY Top 10 emails (ENFORCE LIMIT)
        logging.info("🚀 SURFACING Top 10 emails...")
        surfaced_count = 0
        
        for i, (interaction_id, subject, importance, urgency) in enumerate(top_emails, 1):
            if surfaced_count >= 10:  # ENFORCE 10 LIMIT
                logging.info(f"⚠️ Reached 10 email limit, stopping")
                break
                
            try:
                # Determine if Top7 or Top3
                if i <= 7:
                    tag_label = 'Top7'
                    emoji = '⭐'
                else:
                    tag_label = 'Top3'
                    emoji = '🔥'
                
                # Add both INBOX and tag labels (SURFACE)
                gmail.users().messages().modify(
                    userId='me',
                    id=interaction_id,
                    body={
                        'addLabelIds': ['INBOX', labels[tag_label]]
                    }
                ).execute()
                
                surfaced_count += 1
                logging.info(f"{surfaced_count}. {emoji} {subject[:50]} (I:{importance:.0f}, U:{urgency:.0f})")
                
            except Exception as e:
                logging.error(f"Error surfacing email {interaction_id}: {e}")
        
        logging.info(f"✅ Surfaced {surfaced_count} emails")
        
        # Verify final inbox count (should be exactly 10)
        final_inbox = gmail.users().messages().list(userId='me', maxResults=1, q='in:inbox').execute()
        final_count = final_inbox.get('resultSizeEstimate', 0)
        
        if final_count == 10:
            logging.info(f"✅ PERFECT! Inbox has exactly {final_count} emails")
        elif final_count < 10:
            logging.warning(f"⚠️ Inbox has only {final_count} emails (expected 10)")
        else:
            logging.error(f"❌ Inbox has {final_count} emails (TOO MANY! Expected 10)")
            logging.error("🔧 Running emergency cleanup...")
            # Emergency cleanup if more than 10
            emergency_cleanup(gmail)
        
    except Exception as e:
        logging.error(f"❌ Error surfacing emails: {e}")

def emergency_cleanup(gmail):
    """Emergency cleanup if inbox has more than 10 emails"""
    try:
        logging.info("🚨 EMERGENCY CLEANUP: Removing excess emails...")
        
        # Get all emails in inbox
        inbox = gmail.users().messages().list(userId='me', maxResults=500, q='in:inbox').execute()
        messages = inbox.get('messages', [])
        
        # Remove INBOX from all except first 10
        for i, msg in enumerate(messages[10:], 10):  # Skip first 10
            try:
                gmail.users().messages().modify(
                    userId='me',
                    id=msg['id'],
                    body={'removeLabelIds': ['INBOX']}
                ).execute()
            except:
                pass
        
        # Check final count
        final_inbox = gmail.users().messages().list(userId='me', maxResults=1, q='in:inbox').execute()
        final_count = final_inbox.get('resultSizeEstimate', 0)
        logging.info(f"✅ Emergency cleanup complete: {final_count} emails in inbox")
        
    except Exception as e:
        logging.error(f"❌ Emergency cleanup failed: {e}")

if __name__ == "__main__":
    clean_inbox()
