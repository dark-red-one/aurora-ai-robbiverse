#!/bin/bash
# Nightly Local Backup Commit
# Commits work locally without pushing to GitHub
# Runs at 2 AM daily

REPO_DIR="/home/allan/robbie_workspace/combined/aurora-ai-robbiverse"
LOG_FILE="$REPO_DIR/deployment/nightly-backup.log"

cd "$REPO_DIR" || exit 1

DATE=$(date +%Y-%m-%d)
TIME=$(date +%H:%M)

echo "[$DATE $TIME] Starting nightly backup commit..." >> "$LOG_FILE"

# Check if there are any changes
if git diff-index --quiet HEAD --; then
    echo "[$DATE $TIME] No changes to commit" >> "$LOG_FILE"
    exit 0
fi

# Commit all changes locally
git add -A
git commit -m "💾 Nightly backup: $DATE at $TIME - Auto-saved from Vengeance"

if [ $? -eq 0 ]; then
    echo "[$DATE $TIME] ✅ Committed successfully (not pushed to GitHub)" >> "$LOG_FILE"
    
    # Show what was saved
    STATS=$(git diff HEAD~1 --shortstat)
    echo "[$DATE $TIME] Changes: $STATS" >> "$LOG_FILE"
else
    echo "[$DATE $TIME] ⚠️ Commit failed" >> "$LOG_FILE"
fi

