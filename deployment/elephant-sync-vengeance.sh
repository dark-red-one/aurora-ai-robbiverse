#!/bin/bash
# Bidirectional Database Sync: Vengeance ↔ Elephant Master
# Runs continuously to keep Vengeance in sync with Elephant
set -e

# Configuration
ELEPHANT_HOST="aurora-postgres-u44170.vm.elestio.app"
ELEPHANT_PORT="25432"
ELEPHANT_DB="aurora_unified"
ELEPHANT_USER="postgres"
ELEPHANT_PASS="0qyMjZQ3-xKIe-ylAPt0At"

LOCAL_CONTAINER="robbieverse-postgres"
LOCAL_USER="robbie"
LOCAL_DB="robbieverse"

NODE_NAME="vengeance"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log_to_elephant() {
    local sync_type=$1
    local status=$2
    local message=$3
    local rows=$4
    
    docker exec $LOCAL_CONTAINER sh -c "PGPASSWORD=$ELEPHANT_PASS psql -h $ELEPHANT_HOST -p $ELEPHANT_PORT -U $ELEPHANT_USER -d $ELEPHANT_DB -c \"
    INSERT INTO sync.sync_log (node_name, sync_type, status, completed_at, rows_affected, error_message) 
    VALUES ('$NODE_NAME', '$sync_type', '$status', NOW(), $rows, '$message');
    \"" &> /dev/null || true
}

update_node_status() {
    local is_online=$1
    local success_time=$2
    
    docker exec $LOCAL_CONTAINER sh -c "PGPASSWORD=$ELEPHANT_PASS psql -h $ELEPHANT_HOST -p $ELEPHANT_PORT -U $ELEPHANT_USER -d $ELEPHANT_DB -c \"
    UPDATE sync.node_status 
    SET is_online = $is_online, 
        last_sync_attempt = NOW(),
        ${success_time:+last_sync_success = NOW(),}
        total_syncs = total_syncs + 1
    WHERE node_name = '$NODE_NAME';
    \"" &> /dev/null || true
}

sync_from_elephant() {
    log "📥 Pulling changes FROM Elephant master..."
    
    local start_time=$(date +%s)
    
    # Test connection first
    if ! docker exec $LOCAL_CONTAINER sh -c "PGPASSWORD=$ELEPHANT_PASS psql -h $ELEPHANT_HOST -p $ELEPHANT_PORT -U $ELEPHANT_USER -d $ELEPHANT_DB -c 'SELECT 1;'" &> /dev/null; then
        log "❌ Cannot connect to Elephant - offline?"
        update_node_status false ""
        return 1
    fi
    
    # Pull data from Elephant (without schema, just data)
    docker exec $LOCAL_CONTAINER sh -c "PGPASSWORD=$ELEPHANT_PASS pg_dump -h $ELEPHANT_HOST -p $ELEPHANT_PORT -U $ELEPHANT_USER -d $ELEPHANT_DB --data-only --disable-triggers" | \
        docker exec -i $LOCAL_CONTAINER psql -U $LOCAL_USER -d $LOCAL_DB &> /tmp/sync_pull.log
    
    local exit_code=$?
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    if [ $exit_code -eq 0 ]; then
        log "✅ Pull complete ($duration seconds)"
        update_node_status true "success"
        log_to_elephant "pull" "success" "" 0
    else
        log "❌ Pull failed (see /tmp/sync_pull.log)"
        log_to_elephant "pull" "error" "$(tail -1 /tmp/sync_pull.log)" 0
        return 1
    fi
}

sync_to_elephant() {
    log "📤 Pushing changes TO Elephant master..."
    
    # Check for local changes (simplified - just push everything)
    local start_time=$(date +%s)
    
    # Push data to Elephant (without schema, just data)
    docker exec $LOCAL_CONTAINER pg_dump -U $LOCAL_USER -d $LOCAL_DB --data-only --disable-triggers | \
        docker exec -i $LOCAL_CONTAINER sh -c "PGPASSWORD=$ELEPHANT_PASS psql -h $ELEPHANT_HOST -p $ELEPHANT_PORT -U $ELEPHANT_USER -d $ELEPHANT_DB" &> /tmp/sync_push.log
    
    local exit_code=$?
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    if [ $exit_code -eq 0 ]; then
        log "✅ Push complete ($duration seconds)"
        log_to_elephant "push" "success" "" 0
    else
        log "❌ Push failed (see /tmp/sync_push.log)"
        log_to_elephant "push" "error" "$(tail -1 /tmp/sync_push.log)" 0
        return 1
    fi
}

# Main sync loop
log "🐘 Starting Elephant Sync Service for $NODE_NAME"
log "🔄 Sync interval: 5 minutes"

while true; do
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Pull from Elephant first (master data)
    sync_from_elephant
    
    # Wait a bit
    sleep 10
    
    # Push local changes to Elephant  
    sync_to_elephant
    
    # Update last sync time
    update_node_status true "success"
    
    log "😴 Next sync in 5 minutes..."
    sleep 300  # 5 minutes
done

