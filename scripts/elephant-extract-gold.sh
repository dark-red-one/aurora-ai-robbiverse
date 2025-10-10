#!/bin/bash
# Elephant Gold Extraction Script
# Extract high-value data that's not easily reproducible via APIs

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${BLUE}${BOLD}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}${BOLD}║         ELEPHANT GOLD EXTRACTION - HIGH VALUE DATA        ║${NC}"
echo -e "${BLUE}${BOLD}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Configuration
ELEPHANT_HOST="aurora-postgres-u44170.vm.elestio.app"
ELEPHANT_PORT="25432"
ELEPHANT_DB="aurora_unified"
ELEPHANT_USER="postgres"
ELEPHANT_PASS="0qyMjZQ3-xKIe-ylAPt0At"

EXPORT_DIR="data/elephant-exports/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$EXPORT_DIR"

echo -e "${GREEN}📂 Export directory: $EXPORT_DIR${NC}"
echo -e "${GREEN}🔗 Connecting to: $ELEPHANT_HOST:$ELEPHANT_PORT/$ELEPHANT_DB${NC}"
echo ""

# Export function
export_table() {
    local table_name=$1
    local row_count=$2
    local description=$3
    
    echo -e "${YELLOW}📦 Exporting ${BOLD}${table_name}${NC}${YELLOW} (${row_count} rows) - ${description}${NC}"
    
    # SQL dump format (best for re-import)
    PGPASSWORD="$ELEPHANT_PASS" pg_dump \
        -h "$ELEPHANT_HOST" \
        -p "$ELEPHANT_PORT" \
        -U "$ELEPHANT_USER" \
        -d "$ELEPHANT_DB" \
        --table="public.$table_name" \
        --data-only \
        --column-inserts \
        > "$EXPORT_DIR/${table_name}.sql" 2>/dev/null
    
    # Also export as CSV for easy viewing
    PGPASSWORD="$ELEPHANT_PASS" psql \
        -h "$ELEPHANT_HOST" \
        -p "$ELEPHANT_PORT" \
        -U "$ELEPHANT_USER" \
        -d "$ELEPHANT_DB" \
        -c "COPY (SELECT * FROM public.$table_name) TO STDOUT WITH CSV HEADER;" \
        > "$EXPORT_DIR/${table_name}.csv" 2>/dev/null
    
    echo -e "${GREEN}   ✅ Saved to ${table_name}.sql and ${table_name}.csv${NC}"
}

# Start extraction
echo -e "${BLUE}${BOLD}Starting High Priority Extractions...${NC}"
echo "=" * 80

# 1. Google Emails (57,412 rows) - GOLD
export_table "google_emails" "57,412" "Full email archive"

# 2. Interactions (18,700 rows) - GOLD  
export_table "interactions" "18,700" "Meetings, calls, conversations, notes"

# 3. Google Emails Massive (18,700 rows)
export_table "google_emails_massive" "18,700" "Additional email data"

# 4. Google Drive Files (6,857 rows) - GOLD
export_table "google_drive_files" "6,857" "Document metadata and links"

# 5. Google Emails Analyzed (100 rows)
export_table "google_emails_analyzed" "100" "AI-analyzed emails"

# 6. AllanBot Patterns (40 rows) - LEARNING DATA
export_table "allanbot_patterns" "40" "AI learning patterns"

# 7. AllanBot Memories (21 rows) - CONTEXT
export_table "allanbot_memories" "21" "AI memory context"

# 8. Conversation History (16 rows)
export_table "conversation_history" "16" "Chat conversations"

# 9. AllanBot Memory (9 rows)
export_table "allanbot_memory" "9" "Additional AI memory"

# 10. Conversational Priorities (5 rows)
export_table "conversational_priorities" "5" "Priority context"

# 11. Emails (5 rows)
export_table "emails" "5" "Email records"

# 12. Meetings (5 rows)
export_table "meetings" "5" "Meeting metadata"

# 13. Conversation Context (3 rows)
export_table "conversation_context" "3" "Conversation context"

# 14. Code Conversations (1 row)
export_table "code_conversations" "1" "Code conversation"

# Medium Priority - User/Profile Data
echo ""
echo -e "${BLUE}${BOLD}Medium Priority - User & Profile Data...${NC}"

export_table "profiles" "39" "User profiles"
export_table "users" "1" "User accounts"
export_table "user_mood_state" "1" "User mood tracking"
export_table "user_personality_state" "1" "User personality settings"
export_table "user_activity" "2" "User activity log"

# AI Personality Data
echo ""
echo -e "${BLUE}${BOLD}AI Personality & Learning Data...${NC}"

export_table "ai_personalities" "4" "AI personality definitions"
export_table "ai_personality_state" "4" "AI personality states"
export_table "ai_mentors" "5" "AI mentor configurations"
export_table "robbie_personality_state" "1" "Robbie's personality state"

# System Configuration
echo ""
echo -e "${BLUE}${BOLD}System Configuration...${NC}"

export_table "system_config" "4" "System settings"
export_table "priorities_weights" "6" "Priority weights config"
export_table "inbox_categories" "11" "Inbox categorization"

# Generate manifest
echo ""
echo -e "${YELLOW}📝 Generating export manifest...${NC}"

cat > "$EXPORT_DIR/MANIFEST.md" << EOF
# Elephant Database Export Manifest

**Export Date:** $(date)
**Database:** $ELEPHANT_DB
**Host:** $ELEPHANT_HOST

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

\`\`\`bash
# Import a specific table
psql -h localhost -U postgres -d target_db < google_emails.sql

# Or import all tables
for file in *.sql; do
    psql -h localhost -U postgres -d target_db < "\$file"
done
\`\`\`

## Notes

- Total records exported: ~83,000+ rows
- High-value data not available via APIs
- Preserves AI learning, memories, and conversation history
- Email archive: 57K+ emails with full metadata
- Interactions: 18K+ meetings, calls, and notes
EOF

# Summary
echo ""
echo -e "${GREEN}${BOLD}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║                    EXTRACTION COMPLETE!                   ║${NC}"
echo -e "${GREEN}${BOLD}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📊 Summary:${NC}"
echo -e "  • Export directory: ${BOLD}$EXPORT_DIR${NC}"
echo -e "  • Tables exported: ${BOLD}29${NC}"
echo -e "  • Total records: ${BOLD}~83,000+${NC}"
echo -e "  • Format: SQL + CSV"
echo ""
echo -e "${GREEN}✅ All high-value data extracted!${NC}"
echo -e "${YELLOW}📝 See MANIFEST.md in export directory for details${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo -e "  1. Review exported data in $EXPORT_DIR"
echo -e "  2. Verify critical tables (emails, interactions, patterns)"
echo -e "  3. Archive this data for safekeeping"
echo -e "  4. Import into target database if needed"
echo ""



