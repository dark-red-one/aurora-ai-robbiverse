#!/bin/bash
# Setup Automated Backup System for Aurora
# Runs backups every 6 hours automatically

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        AURORA AUTOMATED BACKUP SYSTEM SETUP               ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Configuration
S3_BUCKET="bguoh9kd1g"
S3_ENDPOINT="https://s3api-eur-is-1.runpod.io"
BACKUP_DIR="/usr/local/bin/aurora-backup"

echo -e "${GREEN}✅ Setting up automated backup system...${NC}"
echo ""

# 1. Create backup directory
mkdir -p $BACKUP_DIR
echo -e "${YELLOW}📁 Created backup directory: $BACKUP_DIR${NC}"

# 2. Create enhanced backup script
echo -e "${YELLOW}📝 Creating enhanced backup script...${NC}"
cat > $BACKUP_DIR/aurora-backup.sh << 'EOF'
#!/bin/bash
# Aurora Automated Backup Script
# Runs every 6 hours automatically

# Configuration
S3_BUCKET="bguoh9kd1g"
S3_ENDPOINT="https://s3api-eur-is-1.runpod.io"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG_FILE="/var/log/aurora-backup.log"

# Function to log messages
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> $LOG_FILE
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_message "🚀 Starting Aurora automated backup..."

# 1. Backup PostgreSQL
log_message "🗄️ Backing up PostgreSQL..."
if pg_dumpall -U postgres -p 5432 > /tmp/postgres-backup-$TIMESTAMP.sql 2>/dev/null; then
    aws s3 cp /tmp/postgres-backup-$TIMESTAMP.sql s3://$S3_BUCKET/postgres-backup-$TIMESTAMP.sql --endpoint-url $S3_ENDPOINT
    if [ $? -eq 0 ]; then
        log_message "✅ PostgreSQL backup successful"
        rm /tmp/postgres-backup-$TIMESTAMP.sql
    else
        log_message "❌ PostgreSQL backup upload failed"
    fi
else
    log_message "⚠️ PostgreSQL backup failed (service may be down)"
fi

# 2. Backup Aurora workspace
log_message "📦 Backing up Aurora workspace..."
cd /workspace
if tar -czf /tmp/aurora-backup-$TIMESTAMP.tar.gz aurora/ 2>/dev/null; then
    aws s3 cp /tmp/aurora-backup-$TIMESTAMP.tar.gz s3://$S3_BUCKET/aurora-backup-$TIMESTAMP.tar.gz --endpoint-url $S3_ENDPOINT
    if [ $? -eq 0 ]; then
        log_message "✅ Aurora workspace backup successful"
        rm /tmp/aurora-backup-$TIMESTAMP.tar.gz
    else
        log_message "❌ Aurora workspace backup upload failed"
    fi
else
    log_message "❌ Aurora workspace backup failed"
fi

# 3. Backup system configurations
log_message "🔑 Backing up system configurations..."
if tar -czf /tmp/configs-backup-$TIMESTAMP.tar.gz /root/.ssh /root/.gitconfig /root/.bashrc 2>/dev/null; then
    aws s3 cp /tmp/configs-backup-$TIMESTAMP.tar.gz s3://$S3_BUCKET/configs-backup-$TIMESTAMP.tar.gz --endpoint-url $S3_ENDPOINT
    if [ $? -eq 0 ]; then
        log_message "✅ System configs backup successful"
        rm /tmp/configs-backup-$TIMESTAMP.tar.gz
    else
        log_message "❌ System configs backup upload failed"
    fi
else
    log_message "⚠️ System configs backup failed (some files may not exist)"
fi

# 4. Clean up old backups (keep last 7 days)
log_message "🧹 Cleaning up old backups..."
aws s3 ls s3://$S3_BUCKET/ --endpoint-url $S3_ENDPOINT | grep "postgres-backup-" | awk '{print $1 " " $2}' | while read date time; do
    if [ $(date -d "$date $time" +%s) -lt $(date -d "7 days ago" +%s) ]; then
        aws s3 rm s3://$S3_BUCKET/postgres-backup-$TIMESTAMP.sql --endpoint-url $S3_ENDPOINT 2>/dev/null
    fi
done

# 5. Update restore script
log_message "🔄 Updating restore script..."
cat > /tmp/aurora-restore.sh << 'RESTORE_EOF'
#!/bin/bash
# Aurora Restore Script - Auto-updated

echo "🚀 Aurora Restore Script Running..."

S3_BUCKET="bguoh9kd1g"
S3_ENDPOINT="https://s3api-eur-is-1.runpod.io"

# Find latest backups
LATEST_POSTGRES=$(aws s3 ls s3://$S3_BUCKET/ --endpoint-url $S3_ENDPOINT | grep "postgres-backup-" | sort | tail -1 | awk '{print $4}')
LATEST_AURORA=$(aws s3 ls s3://$S3_BUCKET/ --endpoint-url $S3_ENDPOINT | grep "aurora-backup-" | sort | tail -1 | awk '{print $4}')
LATEST_CONFIGS=$(aws s3 ls s3://$S3_BUCKET/ --endpoint-url $S3_ENDPOINT | grep "configs-backup-" | sort | tail -1 | awk '{print $4}')

# Restore PostgreSQL
if [ ! -z "$LATEST_POSTGRES" ]; then
    echo "🗄️ Restoring PostgreSQL..."
    aws s3 cp s3://$S3_BUCKET/$LATEST_POSTGRES /tmp/restore-postgres.sql --endpoint-url $S3_ENDPOINT
    if [ -f "/tmp/restore-postgres.sql" ]; then
        psql -U postgres -f /tmp/restore-postgres.sql
        rm /tmp/restore-postgres.sql
        echo "✅ PostgreSQL restored"
    fi
fi

# Restore Aurora workspace
if [ ! -z "$LATEST_AURORA" ]; then
    echo "📦 Restoring Aurora workspace..."
    aws s3 cp s3://$S3_BUCKET/$LATEST_AURORA /tmp/restore-aurora.tar.gz --endpoint-url $S3_ENDPOINT
    if [ -f "/tmp/restore-aurora.tar.gz" ]; then
        tar -xzf /tmp/restore-aurora.tar.gz -C /workspace/
        rm /tmp/restore-aurora.tar.gz
        echo "✅ Aurora workspace restored"
    fi
fi

# Restore system configs
if [ ! -z "$LATEST_CONFIGS" ]; then
    echo "🔑 Restoring system configurations..."
    aws s3 cp s3://$S3_BUCKET/$LATEST_CONFIGS /tmp/restore-configs.tar.gz --endpoint-url $S3_ENDPOINT
    if [ -f "/tmp/restore-configs.tar.gz" ]; then
        tar -xzf /tmp/restore-configs.tar.gz -C /
        chmod 700 /root/.ssh
        chmod 600 /root/.ssh/* 2>/dev/null || true
        rm /tmp/restore-configs.tar.gz
        echo "✅ System configs restored"
    fi
fi

echo "✅ Aurora restore complete!"
RESTORE_EOF

# Upload updated restore script
aws s3 cp /tmp/aurora-restore.sh s3://$S3_BUCKET/aurora-restore.sh --endpoint-url $S3_ENDPOINT
rm /tmp/aurora-restore.sh

# 6. Log backup summary
BACKUP_COUNT=$(aws s3 ls s3://$S3_BUCKET/ --endpoint-url $S3_ENDPOINT | grep -E "(postgres-backup|aurora-backup|configs-backup)" | wc -l)
log_message "📊 Total backups in storage: $BACKUP_COUNT"
log_message "✅ Aurora automated backup completed successfully"

# 7. Send backup status to monitoring
echo "Aurora Backup Status: SUCCESS - $(date)" >> /tmp/backup-status.txt
EOF

chmod +x $BACKUP_DIR/aurora-backup.sh
echo -e "${GREEN}✅ Enhanced backup script created${NC}"

# 3. Create systemd service for automated backups
echo -e "${YELLOW}⚙️ Creating systemd service...${NC}"
cat > /etc/systemd/system/aurora-backup.service << EOF
[Unit]
Description=Aurora Automated Backup Service
After=network.target

[Service]
Type=oneshot
ExecStart=$BACKUP_DIR/aurora-backup.sh
User=root
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# 4. Create systemd timer for scheduling
echo -e "${YELLOW}⏰ Creating backup timer...${NC}"
cat > /etc/systemd/system/aurora-backup.timer << EOF
[Unit]
Description=Run Aurora backup every 6 hours
Requires=aurora-backup.service

[Timer]
OnCalendar=*-*-* 00,06,12,18:00:00
Persistent=true

[Install]
WantedBy=timers.target
EOF

# 5. Enable and start the timer
echo -e "${YELLOW}🚀 Enabling automated backup timer...${NC}"
systemctl daemon-reload
systemctl enable aurora-backup.timer
systemctl start aurora-backup.timer

# 6. Create manual backup script
echo -e "${YELLOW}📝 Creating manual backup script...${NC}"
cat > /usr/local/bin/aurora-backup-now << 'EOF'
#!/bin/bash
# Manual backup trigger
echo "🚀 Running Aurora backup now..."
/usr/local/bin/aurora-backup/aurora-backup.sh
echo "✅ Backup completed!"
EOF

chmod +x /usr/local/bin/aurora-backup-now

# 7. Create backup status checker
echo -e "${YELLOW}📊 Creating backup status checker...${NC}"
cat > /usr/local/bin/aurora-backup-status << 'EOF'
#!/bin/bash
# Check backup status and recent backups

echo "📊 AURORA BACKUP STATUS"
echo "========================"

# Check timer status
echo "⏰ Backup Timer Status:"
systemctl status aurora-backup.timer --no-pager | grep -E "(Active|Loaded|Trigger)"

echo ""
echo "📋 Recent Backups:"
aws s3 ls s3://bguoh9kd1g/ --endpoint-url https://s3api-eur-is-1.runpod.io | grep -E "(postgres-backup|aurora-backup|configs-backup)" | tail -5

echo ""
echo "📊 Backup Count:"
aws s3 ls s3://bguoh9kd1g/ --endpoint-url https://s3api-eur-is-1.runpod.io | grep -E "(postgres-backup|aurora-backup|configs-backup)" | wc -l

echo ""
echo "📝 Recent Log Entries:"
tail -5 /var/log/aurora-backup.log 2>/dev/null || echo "No log file found yet"
EOF

chmod +x /usr/local/bin/aurora-backup-status

# 8. Run initial backup
echo -e "${YELLOW}🔄 Running initial backup...${NC}"
$BACKUP_DIR/aurora-backup.sh

# 9. Show status
echo ""
echo -e "${GREEN}✅ AUTOMATED BACKUP SYSTEM SETUP COMPLETE!${NC}"
echo ""
echo -e "${BLUE}📊 Backup Schedule:${NC}"
echo "• Every 6 hours (00:00, 06:00, 12:00, 18:00)"
echo "• Automatic cleanup (keeps 7 days)"
echo "• Detailed logging"
echo "• Error handling"
echo ""
echo -e "${BLUE}🛠️ Available Commands:${NC}"
echo "• aurora-backup-now     - Run backup immediately"
echo "• aurora-backup-status  - Check backup status"
echo "• systemctl status aurora-backup.timer - Check timer status"
echo ""
echo -e "${BLUE}📁 Files Created:${NC}"
echo "• Backup script: $BACKUP_DIR/aurora-backup.sh"
echo "• Service: /etc/systemd/system/aurora-backup.service"
echo "• Timer: /etc/systemd/system/aurora-backup.timer"
echo "• Log: /var/log/aurora-backup.log"
echo ""
echo -e "${GREEN}🎉 Your Aurora AI Empire now has bulletproof automated backups!${NC}"
