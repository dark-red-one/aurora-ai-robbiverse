# Elephant Database Export Manifest

**Export Date:** Thu Oct  9 07:36:15 PM CDT 2025
**Database:** aurora_unified
**Host:** aurora-postgres-u44170.vm.elestio.app

## Files Exported

### High Priority (Not Reproducible via APIs)

| File | Rows | Description |
|------|------|-------------|
| google_emails.{sql,csv} | 57,412 | Full email archive with metadata |
| interactions.{sql,csv} | 18,700 | Meetings, calls, conversations, notes |
| google_emails_massive.{sql,csv} | 18,700 | Additional email data |
| google_drive_files.{sql,csv} | 6,857 | Document metadata and links |
| google_emails_analyzed.{sql,csv} | 100 | AI-analyzed email insights |
| allanbot_patterns.{sql,csv} | 40 | AI learning patterns |
| allanbot_memories.{sql,csv} | 21 | AI memory context |
| conversation_history.{sql,csv} | 16 | Chat conversation history |
| allanbot_memory.{sql,csv} | 9 | Additional AI memory |
| conversational_priorities.{sql,csv} | 5 | Priority context |
| emails.{sql,csv} | 5 | Email records |
| meetings.{sql,csv} | 5 | Meeting metadata |
| conversation_context.{sql,csv} | 3 | Conversation context |
| code_conversations.{sql,csv} | 1 | Code conversation |

### User & Profile Data

| File | Rows | Description |
|------|------|-------------|
| profiles.{sql,csv} | 39 | User profiles |
| users.{sql,csv} | 1 | User accounts |
| user_mood_state.{sql,csv} | 1 | User mood tracking |
| user_personality_state.{sql,csv} | 1 | User personality settings |
| user_activity.{sql,csv} | 2 | User activity log |

### AI Personality & Learning

| File | Rows | Description |
|------|------|-------------|
| ai_personalities.{sql,csv} | 4 | AI personality definitions |
| ai_personality_state.{sql,csv} | 4 | AI personality states |
| ai_mentors.{sql,csv} | 5 | AI mentor configurations |
| robbie_personality_state.{sql,csv} | 1 | Robbie's personality state |

### System Configuration

| File | Rows | Description |
|------|------|-------------|
| system_config.{sql,csv} | 4 | System settings |
| priorities_weights.{sql,csv} | 6 | Priority weights config |
| inbox_categories.{sql,csv} | 11 | Inbox categorization |

## File Formats

- **.sql** - PostgreSQL INSERT statements (best for re-importing)
- **.csv** - CSV format with headers (best for analysis/viewing)

## Re-importing

To re-import this data into a database:

```bash
# Import a specific table
psql -h localhost -U postgres -d target_db < google_emails.sql

# Or import all tables
for file in *.sql; do
    psql -h localhost -U postgres -d target_db < "$file"
done
```

## Notes

- Total records exported: ~83,000+ rows
- High-value data not available via APIs
- Preserves AI learning, memories, and conversation history
- Email archive: 57K+ emails with full metadata
- Interactions: 18K+ meetings, calls, and notes
