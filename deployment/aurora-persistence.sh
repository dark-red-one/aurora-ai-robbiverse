#!/bin/bash
# Aurora Persistence Manager - Never Lose Data Again!

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
S3_BUCKET="bguoh9kd1g"
S3_ENDPOINT="https://s3api-eur-is-1.runpod.io"
BACKUP_PREFIX="aurora-backups/auto"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

function show_menu() {
    echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║           AURORA PERSISTENCE MANAGER                         ║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "1) 🚨 Emergency Backup Everything NOW"
    echo "2) 📦 Backup Code & Configs"
    echo "3) 🗄️  Backup PostgreSQL"
    echo "4) 🔄 Setup Hourly Auto-Backup"
    echo "5) 🏗️  Create Restore Script"
    echo "6) 📊 Check Backup Status"
    echo "7) 🔧 Full System Snapshot"
    echo "8) 🚀 Restore from Backup"
    echo "9) 📝 Setup Git Repository"
    echo "0) Exit"
    echo ""
    read -p "Choose option: " choice
}

function emergency_backup() {
    echo -e "${RED}🚨 EMERGENCY BACKUP INITIATED${NC}"
    
    # Create backup directory
    BACKUP_DIR="/tmp/emergency-$TIMESTAMP"
    mkdir -p $BACKUP_DIR
    
    # 1. Backup Aurora codebase
    echo -e "${YELLOW}📦 Backing up Aurora codebase...${NC}"
    cd /workspace
    tar -czf $BACKUP_DIR/aurora-code.tar.gz aurora/
    
    # 2. Backup PostgreSQL
    echo -e "${YELLOW}🗄️  Backing up PostgreSQL...${NC}"
    pg_dumpall -U postgres -p 5432 > $BACKUP_DIR/postgres-complete.sql
    
    # 3. Backup SSH keys and configs
    echo -e "${YELLOW}🔑 Backing up SSH keys and configs...${NC}"
    tar -czf $BACKUP_DIR/configs.tar.gz \
        /root/.ssh \
        /root/.gitconfig \
        /root/.bashrc \
        /root/.config \
        2>/dev/null
    
    # 4. Save installed packages
    echo -e "${YELLOW}📦 Saving package lists...${NC}"
    dpkg -l | grep ^ii | awk '{print $2}' > $BACKUP_DIR/apt-packages.txt
    pip freeze > $BACKUP_DIR/pip-requirements.txt
    npm list -g --depth=0 > $BACKUP_DIR/npm-global.txt 2>/dev/null
    
    # 5. Save environment variables
    echo -e "${YELLOW}🔧 Saving environment...${NC}"
    env > $BACKUP_DIR/environment.txt
    
    # 6. Save running services
    echo -e "${YELLOW}⚙️  Saving service states...${NC}"
    systemctl list-units --state=running > $BACKUP_DIR/running-services.txt
    
    # 7. Create master backup
    echo -e "${YELLOW}📦 Creating master backup...${NC}"
    cd /tmp
    tar -czf emergency-$TIMESTAMP.tar.gz emergency-$TIMESTAMP/
    
    # 8. Upload to S3
    echo -e "${YELLOW}☁️  Uploading to S3...${NC}"
    aws s3 cp emergency-$TIMESTAMP.tar.gz \
        s3://$S3_BUCKET/$BACKUP_PREFIX/emergency-$TIMESTAMP.tar.gz \
        --endpoint-url $S3_ENDPOINT
    
    # Also upload individual components for easy access
    aws s3 cp $BACKUP_DIR/aurora-code.tar.gz \
        s3://$S3_BUCKET/$BACKUP_PREFIX/code-$TIMESTAMP.tar.gz \
        --endpoint-url $S3_ENDPOINT
    
    aws s3 cp $BACKUP_DIR/postgres-complete.sql \
        s3://$S3_BUCKET/$BACKUP_PREFIX/postgres-$TIMESTAMP.sql \
        --endpoint-url $S3_ENDPOINT
    
    echo -e "${GREEN}✅ EMERGENCY BACKUP COMPLETE!${NC}"
    echo -e "${GREEN}📍 Location: s3://$S3_BUCKET/$BACKUP_PREFIX/emergency-$TIMESTAMP.tar.gz${NC}"
    
    # Cleanup
    rm -rf $BACKUP_DIR
    rm -f /tmp/emergency-$TIMESTAMP.tar.gz
}

function backup_code() {
    echo -e "${BLUE}📦 Backing up code and configs...${NC}"
    
    cd /workspace
    tar -czf /tmp/aurora-code-$TIMESTAMP.tar.gz aurora/
    
    aws s3 cp /tmp/aurora-code-$TIMESTAMP.tar.gz \
        s3://$S3_BUCKET/$BACKUP_PREFIX/code-$TIMESTAMP.tar.gz \
        --endpoint-url $S3_ENDPOINT
    
    rm /tmp/aurora-code-$TIMESTAMP.tar.gz
    
    echo -e "${GREEN}✅ Code backup complete${NC}"
}

function backup_postgres() {
    echo -e "${BLUE}🗄️  Backing up PostgreSQL...${NC}"
    
    pg_dumpall -U postgres -p 5432 > /tmp/postgres-$TIMESTAMP.sql
    
    aws s3 cp /tmp/postgres-$TIMESTAMP.sql \
        s3://$S3_BUCKET/$BACKUP_PREFIX/postgres-$TIMESTAMP.sql \
        --endpoint-url $S3_ENDPOINT
    
    rm /tmp/postgres-$TIMESTAMP.sql
    
    echo -e "${GREEN}✅ PostgreSQL backup complete${NC}"
}

function setup_auto_backup() {
    echo -e "${BLUE}🔄 Setting up hourly auto-backup...${NC}"
    
    # Create cron script
    cat > /workspace/aurora/auto-backup.sh << 'EOF'
#!/bin/bash
# Auto-backup script for Aurora

S3_BUCKET="bguoh9kd1g"
S3_ENDPOINT="https://s3api-eur-is-1.runpod.io"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Backup code (incremental)
cd /workspace
tar -czf /tmp/aurora-auto-$TIMESTAMP.tar.gz \
    --exclude='aurora/.git' \
    --exclude='aurora/node_modules' \
    --exclude='aurora/__pycache__' \
    aurora/

aws s3 cp /tmp/aurora-auto-$TIMESTAMP.tar.gz \
    s3://$S3_BUCKET/aurora-backups/auto/code-$TIMESTAMP.tar.gz \
    --endpoint-url $S3_ENDPOINT \
    --quiet

rm /tmp/aurora-auto-$TIMESTAMP.tar.gz

# Backup PostgreSQL (only if changed)
pg_dumpall -U postgres -p 5432 > /tmp/postgres-new.sql
if ! cmp -s /tmp/postgres-new.sql /tmp/postgres-last.sql; then
    aws s3 cp /tmp/postgres-new.sql \
        s3://$S3_BUCKET/aurora-backups/auto/postgres-$TIMESTAMP.sql \
        --endpoint-url $S3_ENDPOINT \
        --quiet
    cp /tmp/postgres-new.sql /tmp/postgres-last.sql
fi
rm /tmp/postgres-new.sql

echo "$(date): Auto-backup complete" >> /var/log/aurora-backup.log

# Keep only last 48 hours of hourly backups
aws s3 ls s3://$S3_BUCKET/aurora-backups/auto/ \
    --endpoint-url $S3_ENDPOINT | \
    while read -r line; do
        createDate=$(echo $line | awk '{print $1" "$2}')
        createDate=$(date -d"$createDate" +%s)
        olderThan=$(date -d"2 days ago" +%s)
        if [[ $createDate -lt $olderThan ]]; then
            fileName=$(echo $line | awk '{print $4}')
            if [[ $fileName != "" ]]; then
                aws s3 rm s3://$S3_BUCKET/aurora-backups/auto/$fileName \
                    --endpoint-url $S3_ENDPOINT --quiet
            fi
        fi
    done
EOF
    
    chmod +x /workspace/aurora/auto-backup.sh
    
    # Add to crontab
    (crontab -l 2>/dev/null | grep -v "auto-backup.sh"; echo "0 * * * * /workspace/aurora/auto-backup.sh") | crontab -
    
    echo -e "${GREEN}✅ Auto-backup configured to run every hour${NC}"
    echo -e "${YELLOW}📝 Log file: /var/log/aurora-backup.log${NC}"
}

function create_restore_script() {
    echo -e "${BLUE}🏗️  Creating restore script...${NC}"
    
    cat > /workspace/aurora/restore-aurora.sh << 'EOF'
#!/bin/bash
# Aurora Restoration Script - Rebuild Everything!

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

S3_BUCKET="bguoh9kd1g"
S3_ENDPOINT="https://s3api-eur-is-1.runpod.io"

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              AURORA RESTORATION SYSTEM                       ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"

# List available backups
echo -e "${YELLOW}Available backups:${NC}"
aws s3 ls s3://$S3_BUCKET/aurora-backups/auto/ --endpoint-url $S3_ENDPOINT | \
    grep emergency | tail -5

read -p "Enter backup filename (or 'latest' for most recent): " BACKUP_FILE

if [ "$BACKUP_FILE" = "latest" ]; then
    BACKUP_FILE=$(aws s3 ls s3://$S3_BUCKET/aurora-backups/auto/ --endpoint-url $S3_ENDPOINT | \
        grep emergency | tail -1 | awk '{print $4}')
fi

echo -e "${YELLOW}🔄 Restoring from: $BACKUP_FILE${NC}"

# Download and extract backup
aws s3 cp s3://$S3_BUCKET/aurora-backups/auto/$BACKUP_FILE /tmp/ --endpoint-url $S3_ENDPOINT
cd /tmp
tar -xzf $BACKUP_FILE

BACKUP_DIR=$(ls -d emergency-* | head -1)

# 1. Restore Aurora code
echo -e "${YELLOW}📦 Restoring Aurora codebase...${NC}"
cd /workspace
tar -xzf /tmp/$BACKUP_DIR/aurora-code.tar.gz

# 2. Restore PostgreSQL
echo -e "${YELLOW}🗄️  Restoring PostgreSQL...${NC}"
systemctl start postgresql
psql -U postgres -p 5432 < /tmp/$BACKUP_DIR/postgres-complete.sql

# 3. Restore configs
echo -e "${YELLOW}🔑 Restoring configs...${NC}"
cd /
tar -xzf /tmp/$BACKUP_DIR/configs.tar.gz

# 4. Reinstall packages
echo -e "${YELLOW}📦 Reinstalling packages...${NC}"
apt-get update
cat /tmp/$BACKUP_DIR/apt-packages.txt | xargs apt-get install -y
pip install -r /tmp/$BACKUP_DIR/pip-requirements.txt

# 5. Restore environment
echo -e "${YELLOW}🔧 Restoring environment...${NC}"
cat /tmp/$BACKUP_DIR/environment.txt | grep -E "^(OPENAI|ANTHROPIC|RUNPOD|AWS)" > /etc/environment

echo -e "${GREEN}✅ RESTORATION COMPLETE!${NC}"
echo -e "${YELLOW}⚠️  Please restart your shell or run: source /etc/environment${NC}"

# Cleanup
rm -rf /tmp/$BACKUP_DIR
rm /tmp/$BACKUP_FILE
EOF
    
    chmod +x /workspace/aurora/restore-aurora.sh
    
    echo -e "${GREEN}✅ Restore script created at: /workspace/aurora/restore-aurora.sh${NC}"
}

function check_backup_status() {
    echo -e "${BLUE}📊 Backup Status${NC}"
    echo ""
    
    echo -e "${YELLOW}Recent backups:${NC}"
    aws s3 ls s3://$S3_BUCKET/aurora-backups/ --endpoint-url $S3_ENDPOINT --recursive | \
        sort -r | head -10
    
    echo ""
    echo -e "${YELLOW}Storage usage:${NC}"
    TOTAL_SIZE=$(aws s3 ls s3://$S3_BUCKET/aurora-backups/ --endpoint-url $S3_ENDPOINT --recursive --summarize | \
        grep "Total Size" | awk '{print $3}')
    echo "Total backup size: $(echo "scale=2; $TOTAL_SIZE/1024/1024" | bc) MB"
    
    echo ""
    echo -e "${YELLOW}Last auto-backup:${NC}"
    tail -1 /var/log/aurora-backup.log 2>/dev/null || echo "No auto-backups yet"
}

function full_system_snapshot() {
    echo -e "${BLUE}🔧 Creating full system snapshot...${NC}"
    
    SNAPSHOT_DIR="/tmp/snapshot-$TIMESTAMP"
    mkdir -p $SNAPSHOT_DIR
    
    # System information
    echo -e "${YELLOW}Gathering system info...${NC}"
    uname -a > $SNAPSHOT_DIR/system-info.txt
    df -h > $SNAPSHOT_DIR/disk-usage.txt
    free -h > $SNAPSHOT_DIR/memory-usage.txt
    nvidia-smi > $SNAPSHOT_DIR/gpu-status.txt 2>/dev/null
    
    # Network configuration
    ip a > $SNAPSHOT_DIR/network-config.txt
    ss -tulpn > $SNAPSHOT_DIR/open-ports.txt 2>/dev/null
    
    # Process information
    ps aux > $SNAPSHOT_DIR/processes.txt
    
    # Cron jobs
    crontab -l > $SNAPSHOT_DIR/crontab.txt 2>/dev/null
    
    # Create archive
    tar -czf /tmp/snapshot-$TIMESTAMP.tar.gz -C /tmp snapshot-$TIMESTAMP/
    
    # Upload to S3
    aws s3 cp /tmp/snapshot-$TIMESTAMP.tar.gz \
        s3://$S3_BUCKET/aurora-backups/snapshots/snapshot-$TIMESTAMP.tar.gz \
        --endpoint-url $S3_ENDPOINT
    
    echo -e "${GREEN}✅ System snapshot created${NC}"
    
    # Cleanup
    rm -rf $SNAPSHOT_DIR
    rm /tmp/snapshot-$TIMESTAMP.tar.gz
}

function restore_from_backup() {
    /workspace/aurora/restore-aurora.sh
}

function setup_git() {
    echo -e "${BLUE}📝 Setting up Git repository...${NC}"
    
    cd /workspace/aurora
    
    if [ -d .git ]; then
        echo -e "${YELLOW}Git already initialized${NC}"
    else
        git init
        echo -e "${GREEN}✅ Git initialized${NC}"
    fi
    
    read -p "Enter GitHub username: " GH_USER
    read -p "Enter repository name (e.g., aurora-ai): " REPO_NAME
    
    git remote remove origin 2>/dev/null
    git remote add origin https://github.com/$GH_USER/$REPO_NAME.git
    
    # Create .gitignore
    cat > .gitignore << 'EOF'
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
.env

# Node
node_modules/
npm-debug.log

# Database
*.db
*.sql

# Logs
*.log

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/

# Sensitive
.env
secrets/
*.key
*.pem
EOF
    
    git add -A
    git commit -m "Aurora AI Empire - $(date +%Y%m%d)"
    
    echo -e "${GREEN}✅ Git configured${NC}"
    echo -e "${YELLOW}To push: git push -u origin main${NC}"
    echo -e "${YELLOW}You may need to create the repo on GitHub first${NC}"
}

# Main loop
while true; do
    show_menu
    
    case $choice in
        1) emergency_backup ;;
        2) backup_code ;;
        3) backup_postgres ;;
        4) setup_auto_backup ;;
        5) create_restore_script ;;
        6) check_backup_status ;;
        7) full_system_snapshot ;;
        8) restore_from_backup ;;
        9) setup_git ;;
        0) echo "Goodbye!"; exit 0 ;;
        *) echo -e "${RED}Invalid option${NC}" ;;
    esac
    
    echo ""
    read -p "Press Enter to continue..."
done
