# 📧 @robbie/gmail-tools

**Gmail Automation & Intelligent Inbox Management**

This package contains Robbie's Gmail automation tools for smart inbox management, email interception, color-coding, and intelligent filtering. Keep your inbox clean and organized automatically.

---

## 📦 What's Inside

### `robbie-intelligent-inbox.py` (27KB) ⭐

**The Complete Intelligent Inbox System**

Features:
- **Smart categorization** - Automatically categorize emails by type
- **Priority scoring** - Score emails by importance (0-100)
- **Automatic labels** - Apply Gmail labels based on content
- **Snooze management** - Smart snoozing for follow-ups
- **Conversation threading** - Group related emails
- **VIP detection** - Identify high-priority senders
- **Action extraction** - Find actionable items in emails

**Use this for:** Complete inbox automation

---

### `robbie-smart-inbox.py` (19KB)

**PostgreSQL-Backed Smart Inbox**

Features:
- **Database storage** - Store email metadata in Postgres
- **Search indexing** - Full-text search across all emails
- **Analytics** - Email patterns and statistics
- **Integration** - Connect with CRM and deals
- **Sticky notes** - Auto-create notes from important emails
- **Contact enrichment** - Update contact records from emails

**Use this for:** Business intelligence from email

---

### `robbie-email-interceptor.py` (15KB)

**Real-Time Email Interception & Processing**

Features:
- **Live monitoring** - Watch inbox for new emails
- **Instant processing** - Process emails as they arrive
- **Auto-responses** - Send automatic replies
- **Forwarding rules** - Smart email forwarding
- **Trigger actions** - Execute workflows on email receipt
- **Alert system** - Notify on important emails

**Use this for:** Real-time email automation

---

### `robbie-clean-inbox.py` (7KB)

**Inbox Cleanup & Maintenance**

Features:
- **Bulk archiving** - Archive old emails by criteria
- **Unsubscribe detection** - Find and unsubscribe from lists
- **Duplicate removal** - Delete duplicate emails
- **Old thread cleanup** - Archive completed conversations
- **Storage optimization** - Free up Gmail storage
- **Report generation** - Cleanup summary reports

**Use this for:** Periodic inbox maintenance

---

### `gmail-color-flag-cleanup.py` (4KB)

**Color Coding & Flag Management**

Features:
- **Color categories** - Auto-assign colors by sender/subject
- **Flag cleanup** - Remove outdated flags
- **Star management** - Smart starring system
- **Label colors** - Organize labels by color
- **Visual organization** - Make inbox visually scannable

**Use this for:** Visual inbox organization

---

## 🚀 Quick Start

### 1. Set Up Google API Credentials

```bash
# Get credentials from Google Cloud Console
# Enable Gmail API
# Download credentials.json

cp credentials.json ~/.config/robbie/gmail-credentials.json
```

### 2. Install Dependencies

```bash
cd packages/@robbie/gmail-tools
pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client
```

### 3. Run Initial Setup

```bash
python robbie-intelligent-inbox.py --setup
```

This will:
- Authenticate with Google
- Create necessary labels
- Set up filters
- Initialize database (if using smart-inbox)

### 4. Run Automation

```bash
# One-time cleanup
python robbie-intelligent-inbox.py

# Continuous monitoring
python robbie-email-interceptor.py --daemon

# Weekly cleanup
python robbie-clean-inbox.py --schedule weekly
```

---

## 🔧 Configuration

### Environment Variables

```bash
# Gmail API
GOOGLE_CREDENTIALS_PATH=~/.config/robbie/gmail-credentials.json
GMAIL_USER_EMAIL=allan@testpilotcpg.com

# Database (for smart-inbox)
ROBBIE_DB_URL=postgresql://robbie:password@localhost:5432/robbieverse

# Automation Settings
INBOX_CHECK_INTERVAL=60  # Seconds
AUTO_ARCHIVE_DAYS=90
PRIORITY_THRESHOLD=70
```

### Configuration File

Create `~/.config/robbie/gmail-config.json`:

```json
{
  "categories": {
    "deals": {
      "keywords": ["proposal", "contract", "agreement"],
      "priority": 90,
      "label": "💰 Deals",
      "color": "green"
    },
    "urgent": {
      "keywords": ["urgent", "asap", "immediately"],
      "priority": 100,
      "label": "🔥 Urgent",
      "color": "red"
    },
    "newsletters": {
      "keywords": ["unsubscribe", "newsletter"],
      "priority": 10,
      "label": "📰 Newsletters",
      "color": "gray"
    }
  },
  "vip_senders": [
    "important-client@company.com",
    "ceo@partner.com"
  ],
  "auto_archive": {
    "newsletters": true,
    "promotional": true,
    "social": false
  }
}
```

---

## 🎯 Usage Examples

### Example 1: Intelligent Inbox Processing

```bash
python robbie-intelligent-inbox.py
```

What it does:
```
[INFO] Processing 47 unread emails...
[INFO] Categorized 12 as "Deals" (avg priority: 85)
[INFO] Categorized 8 as "Newsletters" (avg priority: 12)
[INFO] Categorized 5 as "Urgent" (avg priority: 95)
[INFO] Auto-archived 20 low-priority emails
[INFO] Created 3 sticky notes from important emails
[INFO] Inbox: 47 → 7 emails remaining
```

### Example 2: Real-Time Monitoring

```bash
python robbie-email-interceptor.py --daemon
```

What it does:
```
[INFO] Monitoring inbox for new emails...
[2025-10-10 14:23] New email from deal@client.com
  → Priority: 95 (Deal-related)
  → Action: Created CRM task
  → Notification: Sent to Slack
[2025-10-10 14:45] New email from newsletter@service.com
  → Priority: 10 (Newsletter)
  → Action: Auto-archived
```

### Example 3: Weekly Cleanup

```bash
python robbie-clean-inbox.py --dry-run
```

What it would do:
```
[DRY RUN] Would archive 234 emails older than 90 days
[DRY RUN] Would unsubscribe from 12 lists
[DRY RUN] Would remove 45 duplicate emails
[DRY RUN] Would free up 1.2GB of storage

Run without --dry-run to execute.
```

---

## 🧠 Smart Features

### Priority Scoring Algorithm

Emails are scored 0-100 based on:

```python
priority = (
    sender_importance * 40 +      # Who sent it?
    keyword_relevance * 30 +       # What's it about?
    urgency_indicators * 20 +      # How urgent?
    recency * 10                   # How recent?
)
```

**90-100:** Critical (deals, urgent requests)  
**70-89:** High (important business)  
**40-69:** Medium (normal emails)  
**10-39:** Low (newsletters, updates)  
**0-9:** Very low (spam, promotions)

### VIP Detection

Automatically detects VIP senders:
- CRM contacts marked as "VIP"
- Frequent collaborators
- Domain reputation
- Previous email importance
- Manual VIP list

### Action Extraction

Finds actionable items:
- Questions requiring response
- Requests for information
- Meeting scheduling
- Document review
- Approval needed

Creates tasks automatically in:
- Sticky Notes
- CRM tasks
- Calendar reminders

---

## 🔒 Privacy & Security

### Credentials Storage

- OAuth2 tokens stored encrypted
- Refresh tokens rotated regularly
- No password storage
- Scoped API access (minimal permissions)

### Email Content

- Email bodies not stored unless needed
- Only metadata in database
- Full text search uses secure indexing
- Deleted emails purged immediately

### API Limits

Google API limits respected:
- 250 quota units per user per second
- 1,000,000 quota units per day
- Automatic rate limiting
- Exponential backoff on errors

---

## 📊 Analytics

### Email Patterns

Track:
- Emails per day/week/month
- Response time averages
- Sender frequency
- Category distribution
- Storage usage trends

### Productivity Metrics

Measure:
- Inbox zero frequency
- Time saved by automation
- Auto-archived emails
- Priority accuracy
- Action completion rate

### Reports

Generate:
- Weekly inbox summary
- Monthly statistics
- Sender analysis
- Category breakdown
- Storage optimization tips

---

## 🔗 Integrations

### With @robbieverse/api

- Store email metadata in Postgres
- Link emails to CRM contacts
- Create tasks from emails
- Update deal status from emails

### With Sticky Notes

- Auto-create notes from important emails
- Link emails to existing notes
- Surface relevant notes when reading emails

### With Daily Brief

- Include important unread emails
- Summarize email activity
- Flag emails needing response

---

## 🛠️ Troubleshooting

### Authentication Errors

```bash
# Re-authenticate
python robbie-intelligent-inbox.py --reauth

# Refresh tokens
rm ~/.config/robbie/gmail-token.json
python robbie-intelligent-inbox.py --setup
```

### Rate Limiting

```bash
# Slow down processing
export INBOX_CHECK_INTERVAL=300  # 5 minutes

# Batch processing
python robbie-intelligent-inbox.py --batch-size 25
```

### Missing Emails

```bash
# Force full sync
python robbie-smart-inbox.py --full-sync

# Check filters
python robbie-intelligent-inbox.py --list-filters
```

---

## 🎨 Customization

### Custom Categories

Add to `gmail-config.json`:

```json
{
  "categories": {
    "cpg-industry": {
      "keywords": ["CPG", "consumer packaged goods", "retail"],
      "senders": ["@cpgdirectory.com"],
      "priority": 80,
      "label": "🛒 CPG",
      "color": "blue"
    }
  }
}
```

### Custom Actions

Create action hooks:

```python
# ~/.config/robbie/gmail-actions.py

def on_deal_email(email):
    """Custom action when deal-related email arrives"""
    # Your code here
    create_hubspot_task(email)
    send_slack_notification(email)
    log_to_database(email)
```

### Custom Filters

Add Gmail filters programmatically:

```python
from gmail_tools import create_filter

create_filter(
    from_address="newsletter@service.com",
    action="archive",
    label="Newsletters"
)
```

---

## 📚 API Reference

### IntelligentInbox Class

```python
from robbie.gmail_tools import IntelligentInbox

inbox = IntelligentInbox(credentials_path="~/.config/robbie/gmail-credentials.json")

# Process inbox
results = inbox.process()

# Get priority emails
urgent = inbox.get_priority_emails(threshold=80)

# Auto-archive
archived = inbox.auto_archive(days=90)
```

### EmailInterceptor Class

```python
from robbie.gmail_tools import EmailInterceptor

interceptor = EmailInterceptor()

# Set up handler
@interceptor.on_email
def handle_email(email):
    if email.priority > 90:
        send_notification(email)

# Start monitoring
interceptor.start_daemon()
```

---

## 🚀 Future Enhancements

- [ ] AI-powered email composition
- [ ] Smart reply suggestions
- [ ] Email scheduling optimization
- [ ] Sender sentiment analysis
- [ ] Automatic follow-up reminders
- [ ] Meeting scheduling from emails
- [ ] Email performance analytics
- [ ] Multi-account support

---

**Built for inbox zero and staying there** ✉️💜

*"The best inbox is an empty inbox. The second best is an organized inbox."* - Robbie

