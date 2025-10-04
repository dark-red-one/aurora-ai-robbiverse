#!/bin/bash
# Setup RobbieBook1 as Full Replica of Aurora Town Master
# Aurora Town (Elestio) = Master (always-on)
# RobbieBook1 (Mac) = Full Replica (offline-capable)

set -e

echo "🗄️ ROBBIEBOOK1 DATABASE REPLICATION SETUP"
echo "=========================================="
echo ""

# Aurora Town Master (Elestio)
MASTER_HOST="aurora-postgres-u44170.vm.elestio.app"
MASTER_PORT="25432"
MASTER_USER="aurora_app"
MASTER_DB="aurora_unified"
MASTER_PASS="TestPilot2025_Aurora!"

# RobbieBook1 Local Replica
LOCAL_HOST="localhost"
LOCAL_PORT="5432"
LOCAL_USER="postgres"
LOCAL_DB="aurora_unified"

echo "📋 Configuration:"
echo "  Master:  ${MASTER_HOST}:${MASTER_PORT}"
echo "  Replica: ${LOCAL_HOST}:${LOCAL_PORT}"
echo ""

# 1. Test connection to master
echo "🔍 Testing connection to Aurora Town master..."
PGPASSWORD="$MASTER_PASS" psql -h $MASTER_HOST -p $MASTER_PORT -U $MASTER_USER -d $MASTER_DB -c "SELECT 'Master connection OK' as status;" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Master connection successful"
else
    echo "❌ Cannot connect to master - check SSH tunnel or credentials"
    exit 1
fi

# 2. Check if local PostgreSQL is running
echo ""
echo "🔍 Checking local PostgreSQL..."
export PATH="/Library/PostgreSQL/16/bin:$PATH"
if psql -h $LOCAL_HOST -p $LOCAL_PORT -U $LOCAL_USER -d postgres -c "SELECT version();" > /dev/null 2>&1; then
    echo "✅ Local PostgreSQL is running"
else
    echo "⚠️  Local PostgreSQL not running - trying to start..."
    # Try to start PostgreSQL
    if [ -f /Library/LaunchDaemons/com.edb.launchd.postgresql-16.plist ]; then
        sudo launchctl load /Library/LaunchDaemons/com.edb.launchd.postgresql-16.plist 2>/dev/null
        sleep 3
        if psql -h $LOCAL_HOST -p $LOCAL_PORT -U $LOCAL_USER -d postgres -c "SELECT version();" > /dev/null 2>&1; then
            echo "✅ PostgreSQL started successfully"
        else
            echo "❌ Could not start PostgreSQL"
            exit 1
        fi
    else
        echo "❌ PostgreSQL not installed properly"
        exit 1
    fi
fi

# 3. Create full sync script
echo ""
echo "📝 Creating full database sync script..."
cat > /tmp/robbiebook-db-sync-full << 'SYNCEOF'
#!/bin/bash
# Full database sync from Aurora Town to RobbieBook1

MASTER_HOST="aurora-postgres-u44170.vm.elestio.app"
MASTER_PORT="25432"
MASTER_USER="aurora_app"
MASTER_DB="aurora_unified"
MASTER_PASS="TestPilot2025_Aurora!"

LOCAL_HOST="localhost"
LOCAL_PORT="5432"
LOCAL_USER="postgres"
LOCAL_DB="aurora_unified"

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG_DIR="$HOME/aurora-ai-robbiverse/deployment"
LOG_FILE="$LOG_DIR/replica-sync.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "🔄 Starting full database sync from Aurora Town..."

# Create local backup first
log "📦 Backing up local database..."
pg_dump -h $LOCAL_HOST -p $LOCAL_PORT -U $LOCAL_USER -d $LOCAL_DB > /tmp/robbiebook-backup-$TIMESTAMP.sql 2>/dev/null || true

# Drop and recreate local database
log "🗑️  Recreating local database..."
dropdb -h $LOCAL_HOST -p $LOCAL_PORT -U $LOCAL_USER $LOCAL_DB 2>/dev/null || true
createdb -h $LOCAL_HOST -p $LOCAL_PORT -U $LOCAL_USER $LOCAL_DB

# Install pgvector extension
log "🧩 Installing pgvector extension..."
psql -h $LOCAL_HOST -p $LOCAL_PORT -U $LOCAL_USER -d $LOCAL_DB -c "CREATE EXTENSION IF NOT EXISTS vector;" 2>/dev/null || log "⚠️  pgvector not available - vector search disabled"

# Apply unified schema (if full dump fails, we have schema ready)
log "📋 Applying unified schema..."
SCHEMA_DIR="$HOME/aurora-ai-robbiverse/database/unified-schema"
for schema_file in 01-core-no-vector.sql 02-conversations.sql 04-enhanced-business-tables.sql 05-town-separation.sql; do
    if [ -f "$SCHEMA_DIR/$schema_file" ]; then
        psql -h $LOCAL_HOST -p $LOCAL_PORT -U $LOCAL_USER -d $LOCAL_DB -f "$SCHEMA_DIR/$schema_file" > /dev/null 2>&1 || true
    fi
done
log "✅ Schema applied"

# Dump from master
log "⬇️  Pulling full database from Aurora Town..."
PGPASSWORD="$MASTER_PASS" pg_dump -h $MASTER_HOST -p $MASTER_PORT -U $MASTER_USER -d $MASTER_DB > /tmp/aurora-master-$TIMESTAMP.sql

if [ $? -eq 0 ]; then
    log "✅ Master dump successful"
    
    # Restore to local
    log "📥 Restoring to local replica..."
    psql -h $LOCAL_HOST -p $LOCAL_PORT -U $LOCAL_USER -d $LOCAL_DB -f /tmp/aurora-master-$TIMESTAMP.sql > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        log "✅ Full sync completed successfully"
        
        # Verify
        LOCAL_COUNT=$(psql -h $LOCAL_HOST -p $LOCAL_PORT -U $LOCAL_USER -d $LOCAL_DB -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
        log "📊 Local replica has $LOCAL_COUNT tables"
        
        # Save sync timestamp
        echo $TIMESTAMP > /tmp/last-full-sync
    else
        log "❌ Restore failed - rolling back"
        psql -h $LOCAL_HOST -p $LOCAL_PORT -U $LOCAL_USER -d $LOCAL_DB -f /tmp/robbiebook-backup-$TIMESTAMP.sql > /dev/null 2>&1
    fi
else
    log "❌ Master dump failed"
    exit 1
fi

# Cleanup
rm /tmp/aurora-master-$TIMESTAMP.sql /tmp/robbiebook-backup-$TIMESTAMP.sql 2>/dev/null || true

log "✅ Sync complete"
SYNCEOF

echo "fun2Gus!!!" | sudo -S mv /tmp/robbiebook-db-sync-full /usr/local/bin/robbiebook-db-sync-full
echo "fun2Gus!!!" | sudo -S chmod +x /usr/local/bin/robbiebook-db-sync-full

# 4. Create incremental sync script
echo "📝 Creating incremental sync script..."
cat > /tmp/robbiebook-db-sync-incremental << 'INCREOF'
#!/bin/bash
# Incremental database sync from Aurora Town to RobbieBook1

MASTER_HOST="aurora-postgres-u44170.vm.elestio.app"
MASTER_PORT="25432"
MASTER_USER="aurora_app"
MASTER_DB="aurora_unified"
MASTER_PASS="TestPilot2025_Aurora!"

LOCAL_HOST="localhost"
LOCAL_PORT="5432"
LOCAL_USER="postgres"
LOCAL_DB="aurora_unified"

LOG_DIR="$HOME/aurora-ai-robbiverse/deployment"
LOG_FILE="$LOG_DIR/replica-sync.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "🔄 Starting incremental sync..."

# Get last sync time
LAST_SYNC_FILE="/tmp/last-incremental-sync"
if [ -f "$LAST_SYNC_FILE" ]; then
    LAST_SYNC=$(cat $LAST_SYNC_FILE)
else
    LAST_SYNC="1970-01-01 00:00:00"
fi

log "📅 Last sync: $LAST_SYNC"

# Sync tables with updated_at columns
for TABLE in companies contacts deals activities meeting_transcripts emails calendar_events tasks; do
    log "🔄 Syncing $TABLE..."
    
    # Export changes from master
    PGPASSWORD="$MASTER_PASS" psql -h $MASTER_HOST -p $MASTER_PORT -U $MASTER_USER -d $MASTER_DB -c "\COPY (SELECT * FROM $TABLE WHERE updated_at > '$LAST_SYNC') TO '/tmp/${TABLE}_changes.csv' WITH CSV HEADER"
    
    if [ -s "/tmp/${TABLE}_changes.csv" ]; then
        # Import to local
        psql -h $LOCAL_HOST -p $LOCAL_PORT -U $LOCAL_USER -d $LOCAL_DB -c "\COPY $TABLE FROM '/tmp/${TABLE}_changes.csv' WITH CSV HEADER" 2>/dev/null || true
        rm /tmp/${TABLE}_changes.csv
    fi
done

# Update sync timestamp
date '+%Y-%m-%d %H:%M:%S' > $LAST_SYNC_FILE

log "✅ Incremental sync complete"
INCREOF

echo "fun2Gus!!!" | sudo -S mv /tmp/robbiebook-db-sync-incremental /usr/local/bin/robbiebook-db-sync-incremental
echo "fun2Gus!!!" | sudo -S chmod +x /usr/local/bin/robbiebook-db-sync-incremental

echo ""
echo "✅ ROBBIEBOOK1 REPLICATION SETUP COMPLETE!"
echo ""
echo "📊 Available Commands:"
echo "  robbiebook-db-sync-full         - Full replica refresh from Aurora"
echo "  robbiebook-db-sync-incremental  - Sync recent changes only"
echo ""
echo "🔄 Recommended Schedule:"
echo "  Full sync:        Daily at 2 AM (or after major Aurora changes)"
echo "  Incremental sync: Every 15 minutes"
echo ""
echo "⏰ Set up auto-sync with cron:"
echo "  */15 * * * * /usr/local/bin/robbiebook-db-sync-incremental >> $HOME/aurora-ai-robbiverse/deployment/replica-sync.log 2>&1"
echo "  0 2 * * * /usr/local/bin/robbiebook-db-sync-full >> $HOME/aurora-ai-robbiverse/deployment/replica-sync.log 2>&1"
echo ""

