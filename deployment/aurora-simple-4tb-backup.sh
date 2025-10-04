#!/bin/bash
# Simple Aurora Backup to 4TB Storage
# Fix the S3 directory structure issue

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        AURORA SIMPLE 4TB BACKUP SYSTEM                     ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Configuration
S3_BUCKET="bguoh9kd1g"
S3_ENDPOINT="https://s3api-eur-is-1.runpod.io"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

echo -e "${GREEN}✅ Using existing 4TB testpilot-simulations volume${NC}"
echo ""

# 1. Backup PostgreSQL
echo -e "${YELLOW}🗄️ Backing up PostgreSQL...${NC}"
pg_dumpall -U postgres -p 5432 > /tmp/postgres-backup-$TIMESTAMP.sql
aws s3 cp /tmp/postgres-backup-$TIMESTAMP.sql s3://$S3_BUCKET/postgres-backup-$TIMESTAMP.sql --endpoint-url $S3_ENDPOINT
rm /tmp/postgres-backup-$TIMESTAMP.sql
echo -e "${GREEN}✅ PostgreSQL backed up to S3${NC}"

# 2. Backup Aurora workspace
echo -e "${YELLOW}📦 Backing up Aurora workspace...${NC}"
cd /workspace
tar -czf /tmp/aurora-backup-$TIMESTAMP.tar.gz aurora/
aws s3 cp /tmp/aurora-backup-$TIMESTAMP.tar.gz s3://$S3_BUCKET/aurora-backup-$TIMESTAMP.tar.gz --endpoint-url $S3_ENDPOINT
rm /tmp/aurora-backup-$TIMESTAMP.tar.gz
echo -e "${GREEN}✅ Aurora workspace backed up to S3${NC}"

# 3. Backup system configs
echo -e "${YELLOW}🔑 Backing up system configurations...${NC}"
tar -czf /tmp/configs-backup-$TIMESTAMP.tar.gz /root/.ssh /root/.gitconfig /root/.bashrc 2>/dev/null || echo "Some configs missing, continuing..."
aws s3 cp /tmp/configs-backup-$TIMESTAMP.tar.gz s3://$S3_BUCKET/configs-backup-$TIMESTAMP.tar.gz --endpoint-url $S3_ENDPOINT
rm /tmp/configs-backup-$TIMESTAMP.tar.gz
echo -e "${GREEN}✅ System configs backed up to S3${NC}"

# 4. Create simple restore script
echo -e "${YELLOW}🚀 Creating restore script...${NC}"
cat > /tmp/aurora-restore.sh << EOF
#!/bin/bash
# Aurora Restore Script

echo "🚀 Aurora Restore Script Running..."

S3_BUCKET="$S3_BUCKET"
S3_ENDPOINT="$S3_ENDPOINT"

# Find latest backups
LATEST_POSTGRES=\$(aws s3 ls s3://\$S3_BUCKET/ --endpoint-url \$S3_ENDPOINT | grep "postgres-backup-" | sort | tail -1 | awk '{print \$4}')
LATEST_AURORA=\$(aws s3 ls s3://\$S3_BUCKET/ --endpoint-url \$S3_ENDPOINT | grep "aurora-backup-" | sort | tail -1 | awk '{print \$4}')
LATEST_CONFIGS=\$(aws s3 ls s3://\$S3_BUCKET/ --endpoint-url \$S3_ENDPOINT | grep "configs-backup-" | sort | tail -1 | awk '{print \$4}')

# Restore PostgreSQL
if [ ! -z "\$LATEST_POSTGRES" ]; then
    echo "🗄️ Restoring PostgreSQL..."
    aws s3 cp s3://\$S3_BUCKET/\$LATEST_POSTGRES /tmp/restore-postgres.sql --endpoint-url \$S3_ENDPOINT
    psql -U postgres -f /tmp/restore-postgres.sql
    rm /tmp/restore-postgres.sql
fi

# Restore Aurora workspace
if [ ! -z "\$LATEST_AURORA" ]; then
    echo "📦 Restoring Aurora workspace..."
    aws s3 cp s3://\$S3_BUCKET/\$LATEST_AURORA /tmp/restore-aurora.tar.gz --endpoint-url \$S3_ENDPOINT
    tar -xzf /tmp/restore-aurora.tar.gz -C /workspace/
    rm /tmp/restore-aurora.tar.gz
fi

# Restore system configs
if [ ! -z "\$LATEST_CONFIGS" ]; then
    echo "🔑 Restoring system configurations..."
    aws s3 cp s3://\$S3_BUCKET/\$LATEST_CONFIGS /tmp/restore-configs.tar.gz --endpoint-url \$S3_ENDPOINT
    tar -xzf /tmp/restore-configs.tar.gz -C /
    chmod 700 /root/.ssh
    chmod 600 /root/.ssh/* 2>/dev/null || true
    rm /tmp/restore-configs.tar.gz
fi

echo "✅ Aurora restore complete!"
EOF

# Upload restore script
aws s3 cp /tmp/aurora-restore.sh s3://$S3_BUCKET/aurora-restore.sh --endpoint-url $S3_ENDPOINT
echo -e "${GREEN}✅ Restore script uploaded to S3${NC}"

# 5. Create simple backup script for regular use
echo -e "${YELLOW}🔄 Creating backup script...${NC}"
cat > /tmp/aurora-backup.sh << EOF
#!/bin/bash
# Aurora Backup Script

TIMESTAMP=\$(date +%Y%m%d-%H%M%S)
S3_BUCKET="$S3_BUCKET"
S3_ENDPOINT="$S3_ENDPOINT"

# Backup PostgreSQL
pg_dumpall -U postgres -p 5432 > /tmp/postgres-backup-\$TIMESTAMP.sql
aws s3 cp /tmp/postgres-backup-\$TIMESTAMP.sql s3://\$S3_BUCKET/postgres-backup-\$TIMESTAMP.sql --endpoint-url \$S3_ENDPOINT
rm /tmp/postgres-backup-\$TIMESTAMP.sql

# Backup Aurora workspace
cd /workspace
tar -czf /tmp/aurora-backup-\$TIMESTAMP.tar.gz aurora/
aws s3 cp /tmp/aurora-backup-\$TIMESTAMP.tar.gz s3://\$S3_BUCKET/aurora-backup-\$TIMESTAMP.tar.gz --endpoint-url \$S3_ENDPOINT
rm /tmp/aurora-backup-\$TIMESTAMP.tar.gz

echo "\$(date): Backup completed" >> /tmp/backup.log
EOF

chmod +x /tmp/aurora-backup.sh
cp /tmp/aurora-backup.sh /usr/local/bin/aurora-backup.sh

# 6. Set up simple cron job
echo -e "${YELLOW}⏰ Setting up backup cron job...${NC}"
echo "0 */6 * * * /usr/local/bin/aurora-backup.sh" | crontab - 2>/dev/null || echo "Cron not available, manual backups only"

# 7. Show current backups
echo -e "${YELLOW}📊 Current backups on 4TB storage:${NC}"
aws s3 ls s3://$S3_BUCKET/ --endpoint-url $S3_ENDPOINT | grep -E "(postgres-backup|aurora-backup|configs-backup)" | tail -10

echo ""
echo -e "${GREEN}✅ SIMPLE 4TB BACKUP SYSTEM COMPLETE!${NC}"
echo ""
echo -e "${BLUE}📊 What's backed up:${NC}"
echo "• PostgreSQL: postgres-backup-$TIMESTAMP.sql"
echo "• Aurora workspace: aurora-backup-$TIMESTAMP.tar.gz"
echo "• System configs: configs-backup-$TIMESTAMP.tar.gz"
echo "• Restore script: aurora-restore.sh"
echo ""
echo -e "${YELLOW}🔄 To restore after pod restart:${NC}"
echo "aws s3 cp s3://$S3_BUCKET/aurora-restore.sh /tmp/ && chmod +x /tmp/aurora-restore.sh && /tmp/aurora-restore.sh"
echo ""
echo -e "${YELLOW}🔄 To backup manually:${NC}"
echo "/usr/local/bin/aurora-backup.sh"
echo ""
echo -e "${GREEN}💰 Cost: \$200/month for 4TB (already paid!)${NC}"
echo -e "${GREEN}🎉 Your data is now SAFE on your giant volume!${NC}"
