# 🏷️ Gmail Automation Rules - Manual Setup Guide

## 🎯 **CLEANUP COMPLETED:**
- ✅ **1,152 emails** processed and cleaned
- ✅ **6 color flag labels** cleaned up
- ✅ **All emails** removed from INBOX and marked as read

## 🤖 **AUTOMATIC RULES TO CREATE MANUALLY:**

### **Step 1: Go to Gmail Settings**
1. Open Gmail
2. Click the gear icon (Settings)
3. Click "See all settings"
4. Go to "Filters and Blocked Addresses" tab
5. Click "Create a new filter"

### **Step 2: Create These 6 Rules**

#### **Rule 1: Action Label Auto-Cleanup**
- **Search criteria**: `label:Action`
- **Actions**:
  - ✅ Skip the Inbox (Archive it)
  - ✅ Mark as read
- **Click**: "Create filter"

#### **Rule 2: Comment Label Auto-Cleanup**
- **Search criteria**: `label:Comment`
- **Actions**:
  - ✅ Skip the Inbox (Archive it)
  - ✅ Mark as read
- **Click**: "Create filter"

#### **Rule 3: FYI Label Auto-Cleanup**
- **Search criteria**: `label:FYI`
- **Actions**:
  - ✅ Skip the Inbox (Archive it)
  - ✅ Mark as read
- **Click**: "Create filter"

#### **Rule 4: Groceryshop Label Auto-Cleanup**
- **Search criteria**: `label:Groceryshop`
- **Actions**:
  - ✅ Skip the Inbox (Archive it)
  - ✅ Mark as read
- **Click**: "Create filter"

#### **Rule 5: LinkedIn Label Auto-Cleanup**
- **Search criteria**: `label:LinkedIn`
- **Actions**:
  - ✅ Skip the Inbox (Archive it)
  - ✅ Mark as read
- **Click**: "Create filter"

#### **Rule 6: Notes Label Auto-Cleanup**
- **Search criteria**: `label:Notes`
- **Actions**:
  - ✅ Skip the Inbox (Archive it)
  - ✅ Mark as read
- **Click**: "Create filter"

## 🔄 **SCHEDULED CLEANUP SCRIPT**

I'll also create a Python script that runs every hour to clean up any emails that slip through:

```python
#!/usr/bin/env python3
"""
Gmail Color Flag Cleanup Script
Runs every hour to clean up color flag labels
"""

import asyncio
import schedule
import time
from google.oauth2 import service_account
from googleapiclient.discovery import build

# Configuration
CREDS_FILE = '/Users/allanperetz/aurora-ai-robbiverse/api-connectors/google-credentials.json'
ADMIN_EMAIL = 'allan@testpilotcpg.com'
SCOPES = ['https://mail.google.com/']

CLEANUP_LABELS = ['Action', 'Comment', 'FYI', 'Groceryshop', 'LinkedIn', 'Notes']

async def cleanup_color_flags():
    """Clean up color flag labels - remove INBOX and mark as read"""
    try:
        credentials = service_account.Credentials.from_service_account_file(
            CREDS_FILE, scopes=SCOPES
        )
        delegated_credentials = credentials.with_subject(ADMIN_EMAIL)
        
        gmail_service = build('gmail', 'v1', credentials=delegated_credentials)
        
        total_cleaned = 0
        
        for label_name in CLEANUP_LABELS:
            # Get emails with this label
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
                print(f'✅ Cleaned {len(message_ids)} {label_name} emails')
        
        if total_cleaned > 0:
            print(f'🎉 Total cleaned: {total_cleaned} emails')
        
    except Exception as e:
        print(f'❌ Error: {e}')

def run_cleanup():
    """Run the cleanup in async context"""
    asyncio.run(cleanup_color_flags())

if __name__ == "__main__":
    # Schedule cleanup every hour
    schedule.every().hour.do(run_cleanup)
    
    print("🤖 Gmail Color Flag Cleanup Scheduler Started")
    print("📅 Running every hour...")
    
    while True:
        schedule.run_pending()
        time.sleep(60)  # Check every minute
```

## 🚀 **SETUP INSTRUCTIONS:**

1. **Manual Rules**: Follow the 6 rules above in Gmail settings
2. **Scheduled Script**: Save the Python script and run it as a service
3. **Monitor**: Check logs to see cleanup activity

## 📊 **EXPECTED RESULTS:**

- 🏷️ **Color flag emails** will automatically skip inbox
- 📧 **Inbox stays clean** with only important emails
- 🔄 **Hourly cleanup** catches any missed emails
- ✅ **Zero manual work** required going forward

## 🎯 **YOUR INBOX WILL BE:**
- 📬 **Clean and organized**
- 🏷️ **Color flags preserved** for reference
- 🤖 **Fully automated** cleanup
- ⚡ **Lightning fast** processing
