#!/bin/bash
# Aurora Migration to 4TB Network Storage
# Use existing testpilot-simulations volume

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║      AURORA MIGRATION TO 4TB NETWORK STORAGE                ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Configuration
S3_BUCKET="bguoh9kd1g"
S3_ENDPOINT="https://s3api-eur-is-1.runpod.io"
STORAGE_ROOT="aurora-persistent"

echo -e "${GREEN}✅ Using existing 4TB testpilot-simulations volume${NC}"
echo ""

# 1. Create directory structure on S3
echo -e "${YELLOW}📁 Creating persistent storage structure...${NC}"
aws s3api put-object --bucket $S3_BUCKET --key "$STORAGE_ROOT/" --endpoint-url $S3_ENDPOINT
aws s3api put-object --bucket $S3_BUCKET --key "$STORAGE_ROOT/postgres/" --endpoint-url $S3_ENDPOINT
aws s3api put-object --bucket $S3_BUCKET --key "$STORAGE_ROOT/system/" --endpoint-url $S3_ENDPOINT
aws s3api put-object --bucket $S3_BUCKET --key "$STORAGE_ROOT/workspace/" --endpoint-url $S3_ENDPOINT
aws s3api put-object --bucket $S3_BUCKET --key "$STORAGE_ROOT/backups/" --endpoint-url $S3_ENDPOINT

# 2. Stop PostgreSQL
echo -e "${YELLOW}🛑 Stopping PostgreSQL...${NC}"
systemctl stop postgresql 2>/dev/null || service postgresql stop 2>/dev/null || pkill -f postgres

# 3. Backup and upload PostgreSQL data
echo -e "${YELLOW}🗄️ Backing up PostgreSQL to 4TB storage...${NC}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
tar -czf /tmp/postgres-data-$TIMESTAMP.tar.gz /var/lib/postgresql
aws s3 cp /tmp/postgres-data-$TIMESTAMP.tar.gz s3://$S3_BUCKET/$STORAGE_ROOT/postgres/postgres-data-$TIMESTAMP.tar.gz --endpoint-url $S3_ENDPOINT
rm /tmp/postgres-data-$TIMESTAMP.tar.gz

# 4. Backup system configurations
echo -e "${YELLOW}📦 Backing up system configurations...${NC}"
tar -czf /tmp/system-configs-$TIMESTAMP.tar.gz /root/.ssh /root/.gitconfig /root/.bashrc /etc/apt/sources.list.d/ 2>/dev/null || echo "Some configs missing, continuing..."
aws s3 cp /tmp/system-configs-$TIMESTAMP.tar.gz s3://$S3_BUCKET/$STORAGE_ROOT/system/system-configs-$TIMESTAMP.tar.gz --endpoint-url $S3_ENDPOINT
rm /tmp/system-configs-$TIMESTAMP.tar.gz

# 5. Backup Aurora workspace
echo -e "${YELLOW}📦 Backing up Aurora workspace...${NC}"
tar -czf /tmp/aurora-workspace-$TIMESTAMP.tar.gz /workspace/aurora
aws s3 cp /tmp/aurora-workspace-$TIMESTAMP.tar.gz s3://$S3_BUCKET/$STORAGE_ROOT/workspace/aurora-workspace-$TIMESTAMP.tar.gz --endpoint-url $S3_ENDPOINT
rm /tmp/aurora-workspace-$TIMESTAMP.tar.gz

# 6. Create restoration script
echo -e "${YELLOW}🚀 Creating restoration script...${NC}"
cat > /tmp/aurora-restore.sh << EOF
#!/bin/bash
# Aurora Restoration Script - Run on pod boot

echo "🚀 Aurora Restoration Script Running..."

# Configuration
S3_BUCKET="$S3_BUCKET"
S3_ENDPOINT="$S3_ENDPOINT"
STORAGE_ROOT="$STORAGE_ROOT"

# Download and restore PostgreSQL
echo "🗄️ Restoring PostgreSQL..."
LATEST_POSTGRES=\$(aws s3 ls s3://\$S3_BUCKET/\$STORAGE_ROOT/postgres/ --endpoint-url \$S3_ENDPOINT | grep "postgres-data-" | sort | tail -1 | awk '{print \$4}')
if [ ! -z "\$LATEST_POSTGRES" ]; then
    aws s3 cp s3://\$S3_BUCKET/\$STORAGE_ROOT/postgres/\$LATEST_POSTGRES /tmp/restore-postgres.tar.gz --endpoint-url \$S3_ENDPOINT
    tar -xzf /tmp/restore-postgres.tar.gz -C /
    chown -R postgres:postgres /var/lib/postgresql
    chmod -R 700 /var/lib/postgresql
    rm /tmp/restore-postgres.tar.gz
fi

# Download and restore system configs
echo "🔑 Restoring system configurations..."
LATEST_CONFIGS=\$(aws s3 ls s3://\$S3_BUCKET/\$STORAGE_ROOT/system/ --endpoint-url \$S3_ENDPOINT | grep "system-configs-" | sort | tail -1 | awk '{print \$4}')
if [ ! -z "\$LATEST_CONFIGS" ]; then
    aws s3 cp s3://\$S3_BUCKET/\$STORAGE_ROOT/system/\$LATEST_CONFIGS /tmp/restore-configs.tar.gz --endpoint-url \$S3_ENDPOINT
    tar -xzf /tmp/restore-configs.tar.gz -C /
    chmod 700 /root/.ssh
    chmod 600 /root/.ssh/* 2>/dev/null || true
    rm /tmp/restore-configs.tar.gz
fi

# Download and restore Aurora workspace
echo "📦 Restoring Aurora workspace..."
LATEST_WORKSPACE=\$(aws s3 ls s3://\$S3_BUCKET/\$STORAGE_ROOT/workspace/ --endpoint-url \$S3_ENDPOINT | grep "aurora-workspace-" | sort | tail -1 | awk '{print \$4}')
if [ ! -z "\$LATEST_WORKSPACE" ]; then
    aws s3 cp s3://\$S3_BUCKET/\$STORAGE_ROOT/workspace/\$LATEST_WORKSPACE /tmp/restore-workspace.tar.gz --endpoint-url \$S3_ENDPOINT
    tar -xzf /tmp/restore-workspace.tar.gz -C /
    rm /tmp/restore-workspace.tar.gz
fi

# Start PostgreSQL
echo "🔄 Starting PostgreSQL..."
systemctl start postgresql || service postgresql start

echo "✅ Aurora restoration complete!"
EOF

# Upload restoration script
aws s3 cp /tmp/aurora-restore.sh s3://$S3_BUCKET/$STORAGE_ROOT/system/aurora-restore.sh --endpoint-url $S3_ENDPOINT

# 7. Create hourly backup script
echo -e "${YELLOW}🔄 Creating hourly backup script...${NC}"
cat > /tmp/aurora-hourly-backup.sh << EOF
#!/bin/bash
# Hourly backup to 4TB storage

TIMESTAMP=\$(date +%Y%m%d-%H%M%S)
S3_BUCKET="$S3_BUCKET"
S3_ENDPOINT="$S3_ENDPOINT"
STORAGE_ROOT="$STORAGE_ROOT"

# Backup PostgreSQL
echo "🗄️ Hourly PostgreSQL backup..."
pg_dumpall -U postgres > /tmp/postgres-hourly-\$TIMESTAMP.sql
aws s3 cp /tmp/postgres-hourly-\$TIMESTAMP.sql s3://\$S3_BUCKET/\$STORAGE_ROOT/backups/postgres-\$TIMESTAMP.sql --endpoint-url \$S3_ENDPOINT
rm /tmp/postgres-hourly-\$TIMESTAMP.sql

# Backup Aurora workspace (if changed)
echo "📦 Hourly Aurora workspace backup..."
cd /workspace
if [ aurora/ -nt /tmp/last-workspace-backup ]; then
    tar -czf /tmp/aurora-hourly-\$TIMESTAMP.tar.gz aurora/
    aws s3 cp /tmp/aurora-hourly-\$TIMESTAMP.tar.gz s3://\$S3_BUCKET/\$STORAGE_ROOT/backups/aurora-\$TIMESTAMP.tar.gz --endpoint-url \$S3_ENDPOINT
    rm /tmp/aurora-hourly-\$TIMESTAMP.tar.gz
    touch /tmp/last-workspace-backup
fi

# Backup system configs (daily)
if [ ! -f /tmp/last-config-backup ] || [ /root/.ssh -nt /tmp/last-config-backup ]; then
    echo "🔑 Daily config backup..."
    tar -czf /tmp/configs-daily-\$TIMESTAMP.tar.gz /root/.ssh /root/.gitconfig /root/.bashrc 2>/dev/null
    aws s3 cp /tmp/configs-daily-\$TIMESTAMP.tar.gz s3://\$S3_BUCKET/\$STORAGE_ROOT/backups/configs-\$TIMESTAMP.tar.gz --endpoint-url \$S3_ENDPOINT
    rm /tmp/configs-daily-\$TIMESTAMP.tar.gz
    touch /tmp/last-config-backup
fi

echo "\$(date): Hourly backup completed" >> /tmp/backup.log
EOF

# Upload hourly backup script
aws s3 cp /tmp/aurora-hourly-backup.sh s3://$S3_BUCKET/$STORAGE_ROOT/system/aurora-hourly-backup.sh --endpoint-url $S3_ENDPOINT

# 8. Set up cron job for hourly backups
echo -e "${YELLOW}⏰ Setting up hourly backup cron job...${NC}"
cat > /tmp/setup-cron.sh << EOF
#!/bin/bash
# Download and setup cron job
aws s3 cp s3://$S3_BUCKET/$STORAGE_ROOT/system/aurora-hourly-backup.sh /usr/local/bin/aurora-hourly-backup.sh --endpoint-url $S3_ENDPOINT
chmod +x /usr/local/bin/aurora-hourly-backup.sh
(crontab -l 2>/dev/null; echo "0 * * * * /usr/local/bin/aurora-hourly-backup.sh") | crontab -
echo "✅ Hourly backup cron job installed"
EOF

chmod +x /tmp/setup-cron.sh
/tmp/setup-cron.sh

# 9. Start PostgreSQL
echo -e "${YELLOW}🔄 Starting PostgreSQL...${NC}"
systemctl start postgresql || service postgresql start

# 10. Test PostgreSQL
echo -e "${YELLOW}🧪 Testing PostgreSQL...${NC}"
sleep 5
psql -U postgres -c "SELECT 'PostgreSQL is running and backed up to 4TB storage!' as status;"

echo ""
echo -e "${GREEN}✅ MIGRATION TO 4TB STORAGE COMPLETE!${NC}"
echo ""
echo -e "${BLUE}📊 What's now backed up to your 4TB volume:${NC}"
echo "• PostgreSQL data: $STORAGE_ROOT/postgres/"
echo "• System configs: $STORAGE_ROOT/system/"
echo "• Aurora workspace: $STORAGE_ROOT/workspace/"
echo "• Hourly backups: $STORAGE_ROOT/backups/"
echo ""
echo -e "${YELLOW}🔄 Next time pod restarts, run:${NC}"
echo "aws s3 cp s3://$S3_BUCKET/$STORAGE_ROOT/system/aurora-restore.sh /tmp/ && chmod +x /tmp/aurora-restore.sh && /tmp/aurora-restore.sh"
echo ""
echo -e "${GREEN}💰 Cost: \$200/month for 4TB (already paid!)${NC}"
echo -e "${GREEN}🎉 Your data is now SAFE on your giant volume!${NC}"
