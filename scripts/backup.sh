#!/bin/bash
# Aurora backup system - Enterprise grade

BACKUP_DIR="/workspace/aurora/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="aurora_backup_${DATE}.tar.gz"

echo "💾 Starting Aurora backup..."

# Create backup
tar -czf "${BACKUP_DIR}/${BACKUP_FILE}" \
    --exclude="*.log" \
    --exclude="node_modules" \
    --exclude="__pycache__" \
    --exclude=".git" \
    /workspace/aurora/

# Keep only last 7 days of backups
find $BACKUP_DIR -name "aurora_backup_*.tar.gz" -mtime +7 -delete

echo "✅ Backup complete: ${BACKUP_FILE}"
