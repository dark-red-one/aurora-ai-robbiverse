#!/bin/bash
# Quick push to GitHub
# Usage: ./push-to-github.sh "commit message"

REPO_DIR="/home/allan/robbie_workspace/combined/aurora-ai-robbiverse"
cd "$REPO_DIR" || exit 1

# Default message if none provided
MSG="${1:-💾 Auto-save from Vengeance - $(date +%Y-%m-%d\ %H:%M)}"

# Add all changes
git add -A

# Check if there are changes to commit
if git diff --cached --quiet; then
    echo "✅ No changes to push"
    exit 0
fi

# Commit and push
git commit -m "$MSG"
git push origin main

if [ $? -eq 0 ]; then
    echo "✅ Pushed to GitHub successfully"
else
    echo "🔴 Push failed - check git status"
    exit 1
fi

