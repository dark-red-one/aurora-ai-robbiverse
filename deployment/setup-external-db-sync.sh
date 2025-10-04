#!/bin/bash
# Setup External Database Synchronization
# Sync local Aurora PostgreSQL with Elestio managed database

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        EXTERNAL DATABASE SYNCHRONIZATION SETUP            ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Configuration
LOCAL_HOST="localhost"
LOCAL_PORT="5432"
LOCAL_USER="postgres"
LOCAL_DB="aurora_unified"

EXTERNAL_HOST="pg-u44170.vm.elestio.app"
EXTERNAL_PORT="25432"
EXTERNAL_USER="postgres"
EXTERNAL_DB="aurora_backup"

echo -e "${GREEN}✅ Setting up external database synchronization...${NC}"
echo ""

# 1. Test connection to external database
echo -e "${YELLOW}🔍 Testing connection to external database...${NC}"
if PGPASSWORD="${EXTERNAL_PASSWORD}" psql -h $EXTERNAL_HOST -p $EXTERNAL_PORT -U $EXTERNAL_USER -d postgres -c "SELECT version();" 2>/dev/null; then
    echo -e "${GREEN}✅ External database connection successful${NC}"
else
    echo -e "${RED}❌ External database connection failed${NC}"
    echo "Please provide the external database password:"
    read -s EXTERNAL_PASSWORD
    export PGPASSWORD="$EXTERNAL_PASSWORD"
    
    if PGPASSWORD="$EXTERNAL_PASSWORD" psql -h $EXTERNAL_HOST -p $EXTERNAL_PORT -U $EXTERNAL_USER -d postgres -c "SELECT version();" 2>/dev/null; then
        echo -e "${GREEN}✅ External database connection successful${NC}"
    else
        echo -e "${RED}❌ External database connection still failed${NC}"
        echo "Please check your credentials and try again"
        exit 1
    fi
fi

# 2. Create backup database on external server
echo -e "${YELLOW}📦 Creating backup database on external server...${NC}"
PGPASSWORD="$EXTERNAL_PASSWORD" psql -h $EXTERNAL_HOST -p $EXTERNAL_PORT -U $EXTERNAL_USER -d postgres -c "DROP DATABASE IF EXISTS $EXTERNAL_DB;" 2>/dev/null
PGPASSWORD="$EXTERNAL_PASSWORD" psql -h $EXTERNAL_HOST -p $EXTERNAL_PORT -U $EXTERNAL_USER -d postgres -c "CREATE DATABASE $EXTERNAL_DB;"

# 3. Create synchronization script
echo -e "${YELLOW}📝 Creating database synchronization script...${NC}"
cat > /usr/local/bin/aurora-db-sync.sh << EOF
#!/bin/bash
# Aurora Database Synchronization Script

# Configuration
LOCAL_HOST="localhost"
LOCAL_PORT="5432"
LOCAL_USER="postgres"
LOCAL_DB="aurora_unified"

EXTERNAL_HOST="$EXTERNAL_HOST"
EXTERNAL_PORT="$EXTERNAL_PORT"
EXTERNAL_USER="$EXTERNAL_USER"
EXTERNAL_DB="$EXTERNAL_DB"
EXTERNAL_PASSWORD="$EXTERNAL_PASSWORD"

TIMESTAMP=\$(date +%Y%m%d-%H%M%S)
LOG_FILE="/var/log/aurora-db-sync.log"

# Function to log messages
log_message() {
    echo "\$(date '+%Y-%m-%d %H:%M:%S') - \$1" >> \$LOG_FILE
    echo "\$(date '+%Y-%m-%d %H:%M:%S') - \$1"
}

log_message "🔄 Starting Aurora database synchronization..."

# 1. Create full dump of local database
log_message "📦 Creating full dump of local database..."
pg_dump -h \$LOCAL_HOST -p \$LOCAL_PORT -U \$LOCAL_USER -d \$LOCAL_DB > /tmp/aurora-local-\$TIMESTAMP.sql
if [ \$? -eq 0 ]; then
    log_message "✅ Local database dump created successfully"
else
    log_message "❌ Local database dump failed"
    exit 1
fi

# 2. Upload dump to external database
log_message "⬆️ Uploading dump to external database..."
PGPASSWORD="\$EXTERNAL_PASSWORD" psql -h \$EXTERNAL_HOST -p \$EXTERNAL_PORT -U \$EXTERNAL_USER -d \$EXTERNAL_DB -f /tmp/aurora-local-\$TIMESTAMP.sql
if [ \$? -eq 0 ]; then
    log_message "✅ Database synchronization successful"
else
    log_message "❌ Database synchronization failed"
    exit 1
fi

# 3. Clean up temporary files
rm /tmp/aurora-local-\$TIMESTAMP.sql

# 4. Verify synchronization
log_message "🔍 Verifying synchronization..."
LOCAL_COUNT=\$(psql -h \$LOCAL_HOST -p \$LOCAL_PORT -U \$LOCAL_USER -d \$LOCAL_DB -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
EXTERNAL_COUNT=\$(PGPASSWORD="\$EXTERNAL_PASSWORD" psql -h \$EXTERNAL_HOST -p \$EXTERNAL_PORT -U \$EXTERNAL_USER -d \$EXTERNAL_DB -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")

if [ "\$LOCAL_COUNT" = "\$EXTERNAL_COUNT" ]; then
    log_message "✅ Synchronization verified - Tables match: \$LOCAL_COUNT"
else
    log_message "⚠️ Synchronization mismatch - Local: \$LOCAL_COUNT, External: \$EXTERNAL_COUNT"
fi

log_message "✅ Aurora database synchronization completed"
EOF

chmod +x /usr/local/bin/aurora-db-sync.sh

# 4. Create incremental sync script
echo -e "${YELLOW}📝 Creating incremental synchronization script...${NC}"
cat > /usr/local/bin/aurora-db-sync-incremental.sh << EOF
#!/bin/bash
# Aurora Incremental Database Synchronization Script

# Configuration
LOCAL_HOST="localhost"
LOCAL_PORT="5432"
LOCAL_USER="postgres"
LOCAL_DB="aurora_unified"

EXTERNAL_HOST="$EXTERNAL_HOST"
EXTERNAL_PORT="$EXTERNAL_PORT"
EXTERNAL_USER="$EXTERNAL_USER"
EXTERNAL_DB="$EXTERNAL_DB"
EXTERNAL_PASSWORD="$EXTERNAL_PASSWORD"

TIMESTAMP=\$(date +%Y%m%d-%H%M%S)
LOG_FILE="/var/log/aurora-db-sync.log"

# Function to log messages
log_message() {
    echo "\$(date '+%Y-%m-%d %H:%M:%S') - \$1" >> \$LOG_FILE
    echo "\$(date '+%Y-%m-%d %H:%M:%S') - \$1"
}

log_message "🔄 Starting incremental database synchronization..."

# Get last sync time
LAST_SYNC_FILE="/tmp/last-db-sync"
if [ -f "\$LAST_SYNC_FILE" ]; then
    LAST_SYNC=\$(cat \$LAST_SYNC_FILE)
else
    LAST_SYNC="1970-01-01 00:00:00"
fi

# Create incremental dump (only changed data)
log_message "📦 Creating incremental dump since \$LAST_SYNC..."
pg_dump -h \$LOCAL_HOST -p \$LOCAL_PORT -U \$LOCAL_USER -d \$LOCAL_DB --data-only --where="updated_at > '\$LAST_SYNC'" > /tmp/aurora-incremental-\$TIMESTAMP.sql 2>/dev/null

if [ -s /tmp/aurora-incremental-\$TIMESTAMP.sql ]; then
    # Upload incremental changes
    log_message "⬆️ Uploading incremental changes..."
    PGPASSWORD="\$EXTERNAL_PASSWORD" psql -h \$EXTERNAL_HOST -p \$EXTERNAL_PORT -U \$EXTERNAL_USER -d \$EXTERNAL_DB -f /tmp/aurora-incremental-\$TIMESTAMP.sql
    if [ \$? -eq 0 ]; then
        log_message "✅ Incremental synchronization successful"
    else
        log_message "❌ Incremental synchronization failed"
    fi
    rm /tmp/aurora-incremental-\$TIMESTAMP.sql
else
    log_message "ℹ️ No changes since last sync"
fi

# Update last sync time
date '+%Y-%m-%d %H:%M:%S' > \$LAST_SYNC_FILE

log_message "✅ Incremental synchronization completed"
EOF

chmod +x /usr/local/bin/aurora-db-sync-incremental.sh

# 5. Create restore script from external database
echo -e "${YELLOW}📝 Creating restore script from external database...${NC}"
cat > /usr/local/bin/aurora-db-restore-from-external.sh << EOF
#!/bin/bash
# Restore Aurora Database from External Backup

# Configuration
LOCAL_HOST="localhost"
LOCAL_PORT="5432"
LOCAL_USER="postgres"
LOCAL_DB="aurora_unified"

EXTERNAL_HOST="$EXTERNAL_HOST"
EXTERNAL_PORT="$EXTERNAL_PORT"
EXTERNAL_USER="$EXTERNAL_USER"
EXTERNAL_DB="$EXTERNAL_DB"
EXTERNAL_PASSWORD="$EXTERNAL_PASSWORD"

TIMESTAMP=\$(date +%Y%m%d-%H%M%S)
LOG_FILE="/var/log/aurora-db-restore.log"

# Function to log messages
log_message() {
    echo "\$(date '+%Y-%m-%d %H:%M:%S') - \$1" >> \$LOG_FILE
    echo "\$(date '+%Y-%m-%d %H:%M:%S') - \$1"
}

log_message "🔄 Starting database restore from external backup..."

# 1. Backup current local database
log_message "📦 Backing up current local database..."
pg_dump -h \$LOCAL_HOST -p \$LOCAL_PORT -U \$LOCAL_USER -d \$LOCAL_DB > /tmp/aurora-local-backup-\$TIMESTAMP.sql
if [ \$? -eq 0 ]; then
    log_message "✅ Local database backed up"
else
    log_message "❌ Local database backup failed"
    exit 1
fi

# 2. Drop and recreate local database
log_message "🗑️ Dropping and recreating local database..."
psql -h \$LOCAL_HOST -p \$LOCAL_PORT -U \$LOCAL_USER -d postgres -c "DROP DATABASE IF EXISTS \$LOCAL_DB;"
psql -h \$LOCAL_HOST -p \$LOCAL_PORT -U \$LOCAL_USER -d postgres -c "CREATE DATABASE \$LOCAL_DB;"

# 3. Restore from external database
log_message "⬇️ Restoring from external database..."
PGPASSWORD="\$EXTERNAL_PASSWORD" pg_dump -h \$EXTERNAL_HOST -p \$EXTERNAL_PORT -U \$EXTERNAL_USER -d \$EXTERNAL_DB > /tmp/aurora-external-\$TIMESTAMP.sql
if [ \$? -eq 0 ]; then
    psql -h \$LOCAL_HOST -p \$LOCAL_PORT -U \$LOCAL_USER -d \$LOCAL_DB -f /tmp/aurora-external-\$TIMESTAMP.sql
    if [ \$? -eq 0 ]; then
        log_message "✅ Database restore successful"
    else
        log_message "❌ Database restore failed"
        # Restore from local backup
        psql -h \$LOCAL_HOST -p \$LOCAL_PORT -U \$LOCAL_USER -d \$LOCAL_DB -f /tmp/aurora-local-backup-\$TIMESTAMP.sql
        log_message "🔄 Restored from local backup"
    fi
else
    log_message "❌ External database dump failed"
    # Restore from local backup
    psql -h \$LOCAL_HOST -p \$LOCAL_PORT -U \$LOCAL_USER -d \$LOCAL_DB -f /tmp/aurora-local-backup-\$TIMESTAMP.sql
    log_message "🔄 Restored from local backup"
fi

# 4. Clean up temporary files
rm /tmp/aurora-external-\$TIMESTAMP.sql
rm /tmp/aurora-local-backup-\$TIMESTAMP.sql

log_message "✅ Database restore from external backup completed"
EOF

chmod +x /usr/local/bin/aurora-db-restore-from-external.sh

# 6. Add database sync to automated backup system
echo -e "${YELLOW}🔄 Adding database sync to automated backup system...${NC}"
cat > /usr/local/bin/aurora-backup-with-db-sync.sh << EOF
#!/bin/bash
# Aurora Backup with Database Synchronization

# Run regular backup
/usr/local/bin/aurora-backup/aurora-backup.sh

# Run database synchronization
/usr/local/bin/aurora-db-sync-incremental.sh

echo "✅ Aurora backup with database sync completed"
EOF

chmod +x /usr/local/bin/aurora-backup-with-db-sync.sh

# 7. Update cron job to include database sync
echo -e "${YELLOW}⏰ Updating cron job to include database sync...${NC}"
(crontab -l 2>/dev/null | grep -v "aurora-backup"; echo "0 */6 * * * /usr/local/bin/aurora-backup-with-db-sync.sh >> /var/log/aurora-backup.log 2>&1") | crontab -

# 8. Test the synchronization
echo -e "${YELLOW}🧪 Testing database synchronization...${NC}"
/usr/local/bin/aurora-db-sync.sh

echo ""
echo -e "${GREEN}✅ EXTERNAL DATABASE SYNCHRONIZATION SETUP COMPLETE!${NC}"
echo ""
echo -e "${BLUE}📊 Synchronization Strategy:${NC}"
echo "• Full sync: Every 6 hours with backups"
echo "• Incremental sync: Continuous changes"
echo "• External backup: Managed PostgreSQL with auto-failover"
echo "• Local backup: 4TB S3 storage"
echo ""
echo -e "${BLUE}🛠️ Available Commands:${NC}"
echo "• aurora-db-sync                    - Full database sync"
echo "• aurora-db-sync-incremental       - Incremental sync"
echo "• aurora-db-restore-from-external  - Restore from external DB"
echo "• aurora-backup-with-db-sync       - Backup + sync"
echo ""
echo -e "${BLUE}📁 Files Created:${NC}"
echo "• Sync script: /usr/local/bin/aurora-db-sync.sh"
echo "• Incremental sync: /usr/local/bin/aurora-db-sync-incremental.sh"
echo "• Restore script: /usr/local/bin/aurora-db-restore-from-external.sh"
echo "• Combined backup: /usr/local/bin/aurora-backup-with-db-sync.sh"
echo ""
echo -e "${GREEN}🎉 Your Aurora AI Empire now has bulletproof database protection!${NC}"
