#!/bin/bash
# Setup Auto-Sync for Aurora Town Production Server
# Run this script ON Aurora Town to enable automatic GitHub sync

set -euo pipefail

echo "🔄 SETTING UP AUTO-SYNC FOR AURORA TOWN"
echo "========================================"

REPO_DIR="/opt/aurora-dev/aurora"
SYNC_SCRIPT="$REPO_DIR/deployment/auto-sync-aurora-town.sh"

# Ensure we're in the right directory
if [ ! -d "$REPO_DIR" ]; then
    echo "❌ Repository not found at $REPO_DIR"
    exit 1
fi

cd "$REPO_DIR"

# Make sync script executable
chmod +x "$SYNC_SCRIPT"
echo "✅ Made sync script executable"

# Check if cron job already exists
CRON_EXISTS=$(crontab -l 2>/dev/null | grep -c "auto-sync-aurora-town.sh" || true)

if [ "$CRON_EXISTS" -gt 0 ]; then
    echo "⚠️  Auto-sync cron job already exists"
    echo "Current cron jobs:"
    crontab -l | grep "auto-sync"
else
    # Add cron job - runs every 5 minutes
    (crontab -l 2>/dev/null; echo "*/5 * * * * $SYNC_SCRIPT") | crontab -
    echo "✅ Added cron job (runs every 5 minutes)"
fi

# Create log file if it doesn't exist
LOG_DIR="$REPO_DIR/deployment"
touch "$LOG_DIR/sync.log"
echo "✅ Created sync log file"

# Test sync once
echo ""
echo "🧪 Testing sync now..."
$SYNC_SCRIPT

echo ""
echo "✅ AUTO-SYNC SETUP COMPLETE!"
echo ""
echo "📊 Status:"
echo "  - Pulls from GitHub every 5 minutes"
echo "  - Stashes/restores uncommitted work"
echo "  - Logs to: $LOG_DIR/sync.log"
echo ""
echo "📋 Useful Commands:"
echo "  View sync log:     tail -f $LOG_DIR/sync.log"
echo "  Manual sync:       $SYNC_SCRIPT"
echo "  Check cron:        crontab -l"
echo "  Stop auto-sync:    crontab -e (comment out the line)"
echo ""
echo "🚀 Aurora Town will now stay synced automatically!"

