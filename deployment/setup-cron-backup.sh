#!/bin/bash
# Setup Cron-based Automated Backup (Alternative to systemd)
# Since systemd isn't available in RunPod containers

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        AURORA CRON-BASED AUTOMATED BACKUP SETUP            ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${GREEN}✅ Setting up cron-based automated backup system...${NC}"
echo ""

# 1. Install cron if not available
if ! command -v cron &> /dev/null; then
    echo -e "${YELLOW}📦 Installing cron...${NC}"
    apt-get update && apt-get install -y cron
fi

# 2. Start cron service
echo -e "${YELLOW}🚀 Starting cron service...${NC}"
service cron start

# 3. Create cron job for every 6 hours
echo -e "${YELLOW}⏰ Setting up cron job for every 6 hours...${NC}"
(crontab -l 2>/dev/null; echo "0 */6 * * * /usr/local/bin/aurora-backup/aurora-backup.sh >> /var/log/aurora-backup.log 2>&1") | crontab -

# 4. Create cron job for daily cleanup
echo -e "${YELLOW}🧹 Setting up daily cleanup job...${NC}"
(crontab -l 2>/dev/null; echo "0 2 * * * find /tmp -name 'aurora-backup-*' -mtime +1 -delete 2>/dev/null") | crontab -

# 5. Create startup script for cron
echo -e "${YELLOW}📝 Creating startup script...${NC}"
cat > /usr/local/bin/aurora-startup.sh << 'EOF'
#!/bin/bash
# Aurora Startup Script - Run on pod boot

echo "🚀 Aurora Startup Script Running..."

# Start cron service
service cron start 2>/dev/null || echo "Cron already running"

# Start PostgreSQL if available
if command -v postgres &> /dev/null; then
    service postgresql start 2>/dev/null || echo "PostgreSQL already running"
fi

# Start web services
cd /workspace/aurora 2>/dev/null || echo "Aurora directory not found"

# Start monitoring page
python3 -m http.server 8081 --directory gpu-monitor > /dev/null 2>&1 &

# Start API gateway
node src/unified-systems/api-gateway.js > /dev/null 2>&1 &

echo "✅ Aurora startup complete!"
EOF

chmod +x /usr/local/bin/aurora-startup.sh

# 6. Create backup monitoring script
echo -e "${YELLOW}📊 Creating backup monitoring script...${NC}"
cat > /usr/local/bin/aurora-backup-monitor << 'EOF'
#!/bin/bash
# Aurora Backup Monitor

echo "📊 AURORA BACKUP MONITOR"
echo "========================"

# Check cron status
echo "⏰ Cron Service Status:"
service cron status 2>/dev/null || echo "Cron service not running"

echo ""
echo "📋 Cron Jobs:"
crontab -l 2>/dev/null || echo "No cron jobs found"

echo ""
echo "📊 Recent Backups (Last 10):"
aws s3 ls s3://bguoh9kd1g/ --endpoint-url https://s3api-eur-is-1.runpod.io | grep -E "(postgres-backup|aurora-backup|configs-backup)" | tail -10

echo ""
echo "📊 Total Backup Count:"
aws s3 ls s3://bguoh9kd1g/ --endpoint-url https://s3api-eur-is-1.runpod.io | grep -E "(postgres-backup|aurora-backup|configs-backup)" | wc -l

echo ""
echo "📝 Recent Log Entries:"
tail -10 /var/log/aurora-backup.log 2>/dev/null || echo "No log file found yet"

echo ""
echo "💾 Storage Usage:"
aws s3 ls s3://bguoh9kd1g/ --endpoint-url https://s3api-eur-is-1.runpod.io --summarize --human-readable 2>/dev/null | grep "Total Size" || echo "Storage usage not available"
EOF

chmod +x /usr/local/bin/aurora-backup-monitor

# 7. Show current cron jobs
echo -e "${YELLOW}📋 Current cron jobs:${NC}"
crontab -l

# 8. Test cron service
echo -e "${YELLOW}🧪 Testing cron service...${NC}"
service cron status

echo ""
echo -e "${GREEN}✅ CRON-BASED AUTOMATED BACKUP SYSTEM SETUP COMPLETE!${NC}"
echo ""
echo -e "${BLUE}📊 Backup Schedule:${NC}"
echo "• Every 6 hours via cron"
echo "• Daily cleanup at 2 AM"
echo "• Detailed logging to /var/log/aurora-backup.log"
echo ""
echo -e "${BLUE}🛠️ Available Commands:${NC}"
echo "• aurora-backup-now        - Run backup immediately"
echo "• aurora-backup-monitor    - Check backup status"
echo "• aurora-startup           - Run startup script"
echo "• crontab -l              - View cron jobs"
echo "• service cron status     - Check cron service"
echo ""
echo -e "${BLUE}📁 Files Created:${NC}"
echo "• Startup script: /usr/local/bin/aurora-startup.sh"
echo "• Monitor script: /usr/local/bin/aurora-backup-monitor"
echo "• Log file: /var/log/aurora-backup.log"
echo ""
echo -e "${GREEN}🎉 Your Aurora AI Empire now has cron-based automated backups!${NC}"
