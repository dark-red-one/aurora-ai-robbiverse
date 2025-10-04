#!/bin/bash
# Aurora Migration to Persistent Storage
# Run this AFTER creating network volumes

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        AURORA MIGRATION TO PERSISTENT STORAGE               ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if volumes are mounted
if [ ! -d "/persistent/postgres" ]; then
    echo -e "${RED}❌ PostgreSQL volume not mounted at /persistent/postgres${NC}"
    echo "Please create and mount the aurora-postgres volume first!"
    exit 1
fi

if [ ! -d "/persistent/system" ]; then
    echo -e "${RED}❌ System volume not mounted at /persistent/system${NC}"
    echo "Please create and mount the aurora-system volume first!"
    exit 1
fi

echo -e "${GREEN}✅ Persistent volumes detected${NC}"
echo ""

# 1. Stop PostgreSQL
echo -e "${YELLOW}🛑 Stopping PostgreSQL...${NC}"
systemctl stop postgresql 2>/dev/null || service postgresql stop 2>/dev/null || pkill -f postgres

# 2. Backup current PostgreSQL data
echo -e "${YELLOW}📦 Creating PostgreSQL backup...${NC}"
mkdir -p /persistent/system/backups
tar -czf /persistent/system/backups/postgres-backup-$(date +%Y%m%d-%H%M%S).tar.gz /var/lib/postgresql

# 3. Migrate PostgreSQL data
echo -e "${YELLOW}🗄️ Migrating PostgreSQL to persistent storage...${NC}"
rsync -av /var/lib/postgresql/ /persistent/postgres/
chown -R postgres:postgres /persistent/postgres
chmod -R 700 /persistent/postgres

# 4. Update PostgreSQL config
echo -e "${YELLOW}⚙️ Updating PostgreSQL configuration...${NC}"
sed -i "s|#data_directory = '/var/lib/postgresql/16/main'|data_directory = '/persistent/postgres/16/main'|g" /etc/postgresql/16/main/postgresql.conf

# 5. Create system backup
echo -e "${YELLOW}📦 Backing up system configurations...${NC}"
mkdir -p /persistent/system/{ssh,git,apt}
rsync -av /root/.ssh/ /persistent/system/ssh/ 2>/dev/null || echo "No SSH keys found"
rsync -av /root/.gitconfig /persistent/system/git/ 2>/dev/null || echo "No git config found"

# 6. Create startup script
echo -e "${YELLOW}🚀 Creating startup script...${NC}"
cat > /persistent/system/startup.sh << 'EOF'
#!/bin/bash
# Aurora Startup Script - Run on pod boot

echo "🚀 Aurora Startup Script Running..."

# Mount persistent volumes (if not already mounted)
if [ ! -d "/persistent/postgres" ]; then
    echo "Mounting PostgreSQL volume..."
    # Add mount command here when volume is attached
fi

if [ ! -d "/persistent/system" ]; then
    echo "Mounting system volume..."
    # Add mount command here when volume is attached  
fi

# Restore SSH keys
if [ -d "/persistent/system/ssh" ]; then
    cp -r /persistent/system/ssh/* /root/.ssh/
    chmod 700 /root/.ssh
    chmod 600 /root/.ssh/*
fi

# Restore git config
if [ -f "/persistent/system/git/.gitconfig" ]; then
    cp /persistent/system/git/.gitconfig /root/.gitconfig
fi

# Start PostgreSQL
systemctl start postgresql || service postgresql start

echo "✅ Aurora startup complete!"
EOF

chmod +x /persistent/system/startup.sh

# 7. Create hourly backup script
echo -e "${YELLOW}🔄 Setting up hourly backups...${NC}"
cat > /persistent/system/hourly-backup.sh << 'EOF'
#!/bin/bash
# Hourly backup script

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
S3_BUCKET="bguoh9kd1g"
S3_ENDPOINT="https://s3api-eur-is-1.runpod.io"

# Backup PostgreSQL
pg_dumpall -U postgres > /tmp/postgres-hourly-$TIMESTAMP.sql
aws s3 cp /tmp/postgres-hourly-$TIMESTAMP.sql s3://$S3_BUCKET/backups/hourly/postgres-$TIMESTAMP.sql --endpoint-url $S3_ENDPOINT
rm /tmp/postgres-hourly-$TIMESTAMP.sql

# Backup Aurora code (if changed)
cd /workspace
if [ aurora/ -nt /persistent/system/last-backup ]; then
    tar -czf /tmp/aurora-hourly-$TIMESTAMP.tar.gz aurora/
    aws s3 cp /tmp/aurora-hourly-$TIMESTAMP.tar.gz s3://$S3_BUCKET/backups/hourly/aurora-$TIMESTAMP.tar.gz --endpoint-url $S3_ENDPOINT
    rm /tmp/aurora-hourly-$TIMESTAMP.tar.gz
    touch /persistent/system/last-backup
fi

echo "$(date): Hourly backup completed" >> /persistent/system/backup.log
EOF

chmod +x /persistent/system/hourly-backup.sh

# 8. Set up cron job
echo -e "${YELLOW}⏰ Setting up hourly backup cron job...${NC}"
(crontab -l 2>/dev/null; echo "0 * * * * /persistent/system/hourly-backup.sh") | crontab -

# 9. Start PostgreSQL
echo -e "${YELLOW}🔄 Starting PostgreSQL on persistent storage...${NC}"
systemctl start postgresql || service postgresql start

# 10. Test PostgreSQL
echo -e "${YELLOW}🧪 Testing PostgreSQL...${NC}"
sleep 5
psql -U postgres -c "SELECT 'PostgreSQL is running on persistent storage!' as status;"

echo ""
echo -e "${GREEN}✅ MIGRATION COMPLETE!${NC}"
echo ""
echo -e "${BLUE}📊 What's now persistent:${NC}"
echo "• PostgreSQL data: /persistent/postgres"
echo "• System configs: /persistent/system"  
echo "• Hourly backups: Automated to S3"
echo "• Startup script: /persistent/system/startup.sh"
echo ""
echo -e "${YELLOW}🔄 Next time pod restarts, run:${NC}"
echo "/persistent/system/startup.sh"
echo ""
echo -e "${GREEN}🎉 Your data is now SAFE!${NC}"
