#!/usr/bin/env python3
"""
Gmail Color Flag Cleanup Script
Runs every hour to clean up color flag labels automatically
"""

import asyncio
import time
import logging
import sys
import os
from datetime import datetime
from google.oauth2 import service_account
from googleapiclient.discovery import build

# Add the project root to the path
sys.path.append('/Users/allanperetz/aurora-ai-robbiverse')

# Configuration
CREDS_FILE = '/Users/allanperetz/aurora-ai-robbiverse/api-connectors/google-credentials.json'
ADMIN_EMAIL = 'allan@testpilotcpg.com'
SCOPES = ['https://mail.google.com/']

# Color flag labels to clean up
CLEANUP_LABELS = ['Action', 'Comment', 'FYI', 'Groceryshop', 'LinkedIn', 'Notes']

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/Users/allanperetz/aurora-ai-robbiverse/logs/gmail-cleanup.log'),
        logging.StreamHandler()
    ]
)

async def cleanup_color_flags():
    """Clean up color flag labels - remove INBOX and mark as read"""
    try:
        logging.info("🤖 Starting Gmail color flag cleanup...")
        
        credentials = service_account.Credentials.from_service_account_file(
            CREDS_FILE, scopes=SCOPES
        )
        delegated_credentials = credentials.with_subject(ADMIN_EMAIL)
        
        gmail_service = build('gmail', 'v1', credentials=delegated_credentials)
        
        total_cleaned = 0
        
        for label_name in CLEANUP_LABELS:
            try:
                # Get emails with this label that are still in inbox
                results = gmail_service.users().messages().list(
                    userId='me',
                    maxResults=100,
                    q=f'label:{label_name} in:inbox'
                ).execute()
                
                messages = results.get('messages', [])
                if messages:
                    message_ids = [msg['id'] for msg in messages]
                    
                    # Remove INBOX and mark as read
                    gmail_service.users().messages().batchModify(
                        userId='me',
                        body={
                            'ids': message_ids,
                            'removeLabelIds': ['INBOX', 'UNREAD']
                        }
                    ).execute()
                    
                    total_cleaned += len(message_ids)
                    logging.info(f'✅ Cleaned {len(message_ids)} {label_name} emails')
                else:
                    logging.info(f'ℹ️ No {label_name} emails in inbox to clean')
                    
            except Exception as e:
                logging.error(f'❌ Error cleaning {label_name}: {e}')
                continue
        
        if total_cleaned > 0:
            logging.info(f'🎉 Total cleaned: {total_cleaned} emails')
        else:
            logging.info('✨ No emails needed cleaning - inbox is clean!')
            
        return total_cleaned
        
    except Exception as e:
        logging.error(f'❌ Error in cleanup: {e}')
        return 0

def run_cleanup():
    """Run the cleanup in async context"""
    return asyncio.run(cleanup_color_flags())

def main():
    """Main function - run cleanup once"""
    logging.info("🤖 Gmail Color Flag Cleanup Started")
    logging.info("🚀 Running cleanup...")
    
    # Run cleanup once
    cleaned = run_cleanup()
    
    if cleaned > 0:
        logging.info(f"✅ Cleanup completed - {cleaned} emails processed")
    else:
        logging.info("✨ No emails needed cleaning - inbox is clean!")
    
    logging.info("🏁 Cleanup finished")

if __name__ == "__main__":
    main()
