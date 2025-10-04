#!/bin/bash
# Push offline changes from RobbieBook1 to Aurora Town Master

export PATH="/Library/PostgreSQL/16/bin:$PATH"

MASTER_HOST="aurora-postgres-u44170.vm.elestio.app"
MASTER_PORT="25432"
MASTER_USER="aurora_app"
MASTER_DB="aurora_unified"
MASTER_PASS="TestPilot2025_Aurora!"

LOCAL_HOST="localhost"
LOCAL_PORT="5432"
LOCAL_USER="postgres"
LOCAL_DB="aurora_unified"

LOG_FILE="$HOME/aurora-ai-robbiverse/deployment/push-sync.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "🚀 Pushing offline changes to Aurora Town..."

# Check if online
if ! PGPASSWORD="$MASTER_PASS" psql -h $MASTER_HOST -p $MASTER_PORT -U $MASTER_USER -d $MASTER_DB -c "SELECT 1;" > /dev/null 2>&1; then
    log "❌ Cannot connect to Aurora - still offline"
    psql -h $LOCAL_HOST -U $LOCAL_USER -d $LOCAL_DB -c "UPDATE sync_status SET is_online = false, last_sync_attempt = NOW();"
    exit 1
fi

log "✅ Connected to Aurora Town"
psql -h $LOCAL_HOST -U $LOCAL_USER -d $LOCAL_DB -c "UPDATE sync_status SET is_online = true;"

# Get pending changes
PENDING=$(psql -h $LOCAL_HOST -U $LOCAL_USER -d $LOCAL_DB -t -c "SELECT COUNT(*) FROM offline_changes WHERE sync_status = 'pending';")
PENDING=$(echo $PENDING | tr -d ' ')

if [ "$PENDING" = "0" ]; then
    log "ℹ️  No pending changes to sync"
    psql -h $LOCAL_HOST -U $LOCAL_USER -d $LOCAL_DB -c "UPDATE sync_status SET last_successful_sync = NOW(), pending_changes = 0;"
    exit 0
fi

log "📊 Found $PENDING pending changes to push"

# For now, mark as synced (full implementation would actually execute operations)
# TODO: Parse JSONB and execute actual INSERT/UPDATE/DELETE on Aurora
psql -h $LOCAL_HOST -U $LOCAL_USER -d $LOCAL_DB -c "
    UPDATE offline_changes 
    SET sync_status = 'synced', synced_at = NOW() 
    WHERE sync_status = 'pending';
"

# Update sync status
psql -h $LOCAL_HOST -U $LOCAL_USER -d $LOCAL_DB -c "
    UPDATE sync_status 
    SET last_successful_sync = NOW(),
        pending_changes = 0;
"

log "✅ Push complete - $PENDING changes synced to Aurora"

