#!/bin/bash
# Vengeance Auto-Sync Script
# Keeps local repo synced with GitHub

REPO_DIR="/home/allan/robbie_workspace/combined/aurora-ai-robbiverse"
LOG_FILE="$REPO_DIR/deployment/sync.log"

cd "$REPO_DIR" || exit 1

echo "[$(date)] Starting sync..." >> "$LOG_FILE"

# Stash any uncommitted changes
git stash --include-untracked > /dev/null 2>&1
STASHED=$?

# Pull latest from GitHub
git pull origin main --no-edit >> "$LOG_FILE" 2>&1
PULL_RESULT=$?

# Pop stashed changes back
if [ $STASHED -eq 0 ]; then
    git stash pop > /dev/null 2>&1
fi

if [ $PULL_RESULT -eq 0 ]; then
    echo "[$(date)] ✅ Synced successfully" >> "$LOG_FILE"
else
    echo "[$(date)] ⚠️ Sync failed" >> "$LOG_FILE"
fi

