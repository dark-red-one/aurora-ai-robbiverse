#!/bin/bash
# RobbieBook1 Auto-Sync Script
# Keeps local Mac repo synced with GitHub

REPO_DIR="/Users/allanperetz/aurora-ai-robbiverse"
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
    # Restart RobbieBook1 services if needed
    if pgrep -f "robbie-ollama-backend.py" > /dev/null; then
        echo "[$(date)] 🔄 Restarting Robbie Ollama Backend..." >> "$LOG_FILE"
        pkill -f "robbie-ollama-backend.py"
        sleep 2
        cd "$REPO_DIR" && python3 robbie-ollama-backend.py >> "$LOG_FILE" 2>&1 &
    fi
    
    if pgrep -f "infrastructure/chat-mvp/app.py" > /dev/null; then
        echo "[$(date)] 🔄 Restarting Chat MVP..." >> "$LOG_FILE"
        pkill -f "infrastructure/chat-mvp/app.py"
        sleep 2
        cd "$REPO_DIR/infrastructure/chat-mvp" && python3 app.py >> "$LOG_FILE" 2>&1 &
    fi
else
    echo "[$(date)] ⚠️ Sync failed" >> "$LOG_FILE"
fi

