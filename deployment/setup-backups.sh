#!/bin/bash
# Setup automated backup system for Aurora Town
# Includes PostgreSQL, Redis, configs, and application data

set -e

echo "💾 Setting up Aurora Town Backup System"
echo "========================================"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root (sudo)"
    exit 1
fi

# Create backup directories
BACKUP_ROOT="/var/backups/aurora"
mkdir -p $BACKUP_ROOT/{database,redis,configs,logs}

echo "✅ Backup directories created"

# Create database backup script
echo "📝 Creating database backup script..."

cat > /home/allan/robbie-ai/scripts/backup-database.sh << 'DBBACKUPEOF'
#!/bin/bash
# PostgreSQL Backup Script

BACKUP_DIR="/var/backups/aurora/database"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/var/log/aurora/backup-database.log"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a $LOG_FILE
}

log "💾 Starting PostgreSQL backup..."

# Check if PostgreSQL is installed
if ! systemctl list-units --all | grep -q postgresql; then
    log "⚠️  PostgreSQL not installed, skipping database backup"
    exit 0
fi

# Backup all databases
DATABASES="aurora_unified heyshopper_prod robbieverse_prod"

for DB in $DATABASES; do
    if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw $DB; then
        log "Backing up $DB..."
        sudo -u postgres pg_dump $DB | gzip > $BACKUP_DIR/${DB}_${TIMESTAMP}.sql.gz
        
        if [ $? -eq 0 ]; then
            SIZE=$(du -h $BACKUP_DIR/${DB}_${TIMESTAMP}.sql.gz | cut -f1)
            log "✅ $DB backed up successfully ($SIZE)"
        else
            log "❌ Failed to backup $DB"
        fi
    else
        log "⚠️  Database $DB does not exist"
    fi
done

# Keep only last 7 daily backups
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
log "✅ Old backups cleaned up"

log "💾 Database backup complete"
DBBACKUPEOF

chmod +x /home/allan/robbie-ai/scripts/backup-database.sh

# Create Redis backup script
echo "📝 Creating Redis backup script..."

cat > /home/allan/robbie-ai/scripts/backup-redis.sh << 'REDISBACKUPEOF'
#!/bin/bash
# Redis Backup Script

BACKUP_DIR="/var/backups/aurora/redis"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/var/log/aurora/backup-redis.log"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a $LOG_FILE
}

log "💾 Starting Redis backup..."

# Check if Redis is installed
if ! systemctl list-units --all | grep -q redis; then
    log "⚠️  Redis not installed, skipping Redis backup"
    exit 0
fi

# Trigger Redis save
if systemctl is-active --quiet redis-server; then
    redis-cli BGSAVE > /dev/null 2>&1
    sleep 2
    
    # Copy RDB file
    if [ -f /var/lib/redis/dump.rdb ]; then
        cp /var/lib/redis/dump.rdb $BACKUP_DIR/dump_${TIMESTAMP}.rdb
        gzip $BACKUP_DIR/dump_${TIMESTAMP}.rdb
        
        SIZE=$(du -h $BACKUP_DIR/dump_${TIMESTAMP}.rdb.gz | cut -f1)
        log "✅ Redis backed up successfully ($SIZE)"
    else
        log "❌ Redis dump file not found"
    fi
else
    log "⚠️  Redis not running"
fi

# Keep only last 7 daily backups
find $BACKUP_DIR -name "dump_*.rdb.gz" -mtime +7 -delete
log "✅ Old backups cleaned up"

log "💾 Redis backup complete"
REDISBACKUPEOF

chmod +x /home/allan/robbie-ai/scripts/backup-redis.sh

# Create configuration backup script
echo "📝 Creating configuration backup script..."

cat > /home/allan/robbie-ai/scripts/backup-configs.sh << 'CONFIGBACKUPEOF'
#!/bin/bash
# Configuration Files Backup Script

BACKUP_DIR="/var/backups/aurora/configs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/configs_${TIMESTAMP}.tar.gz"
LOG_FILE="/var/log/aurora/backup-configs.log"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a $LOG_FILE
}

log "💾 Starting configuration backup..."

# Create temporary directory
TMP_DIR="/tmp/aurora-config-backup-$$"
mkdir -p $TMP_DIR

# Copy configuration files
log "Copying configuration files..."

# Nginx configs
if [ -d /etc/nginx ]; then
    mkdir -p $TMP_DIR/nginx
    cp -r /etc/nginx/* $TMP_DIR/nginx/ 2>/dev/null || true
fi

# PostgreSQL configs
if [ -d /etc/postgresql ]; then
    mkdir -p $TMP_DIR/postgresql
    cp -r /etc/postgresql/* $TMP_DIR/postgresql/ 2>/dev/null || true
fi

# Redis configs
if [ -f /etc/redis/redis.conf ]; then
    mkdir -p $TMP_DIR/redis
    cp /etc/redis/redis.conf $TMP_DIR/redis/
fi

# WireGuard configs
if [ -d /etc/wireguard ]; then
    mkdir -p $TMP_DIR/wireguard
    cp /etc/wireguard/*.conf $TMP_DIR/wireguard/ 2>/dev/null || true
fi

# Systemd services
mkdir -p $TMP_DIR/systemd
cp /etc/systemd/system/ai-router.service $TMP_DIR/systemd/ 2>/dev/null || true
cp /etc/systemd/system/aurora-*.service $TMP_DIR/systemd/ 2>/dev/null || true
cp /etc/systemd/system/wg-quick@wg0.service $TMP_DIR/systemd/ 2>/dev/null || true

# Cron jobs
mkdir -p $TMP_DIR/cron
cp /etc/cron.d/aurora* $TMP_DIR/cron/ 2>/dev/null || true

# AI Router configs
if [ -d /home/allan/robbie-ai ]; then
    mkdir -p $TMP_DIR/robbie-ai
    cp -r /home/allan/robbie-ai/ai-router/*.py $TMP_DIR/robbie-ai/ 2>/dev/null || true
fi

# Create tarball
tar -czf $BACKUP_FILE -C $TMP_DIR . 2>/dev/null

if [ $? -eq 0 ]; then
    SIZE=$(du -h $BACKUP_FILE | cut -f1)
    log "✅ Configurations backed up successfully ($SIZE)"
else
    log "❌ Failed to create configuration backup"
fi

# Cleanup
rm -rf $TMP_DIR

# Keep only last 7 daily backups
find $BACKUP_DIR -name "configs_*.tar.gz" -mtime +7 -delete
log "✅ Old backups cleaned up"

log "💾 Configuration backup complete"
CONFIGBACKUPEOF

chmod +x /home/allan/robbie-ai/scripts/backup-configs.sh

# Create full backup script
echo "📝 Creating full backup script..."

cat > /home/allan/robbie-ai/scripts/backup-full.sh << 'FULLBACKUPEOF'
#!/bin/bash
# Full System Backup Script
# Runs all backup scripts

LOG_FILE="/var/log/aurora/backup-full.log"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a $LOG_FILE
}

log "💾 Starting full Aurora Town backup..."
log "======================================"

# Run database backup
log "Step 1/3: Backing up databases..."
/home/allan/robbie-ai/scripts/backup-database.sh

# Run Redis backup
log "Step 2/3: Backing up Redis..."
/home/allan/robbie-ai/scripts/backup-redis.sh

# Run configuration backup
log "Step 3/3: Backing up configurations..."
/home/allan/robbie-ai/scripts/backup-configs.sh

log "======================================"
log "✅ Full backup complete!"
log ""

# Calculate total backup size
TOTAL_SIZE=$(du -sh /var/backups/aurora | cut -f1)
log "Total backup size: $TOTAL_SIZE"

# Count backup files
DB_COUNT=$(find /var/backups/aurora/database -name "*.sql.gz" | wc -l)
REDIS_COUNT=$(find /var/backups/aurora/redis -name "*.rdb.gz" | wc -l)
CONFIG_COUNT=$(find /var/backups/aurora/configs -name "*.tar.gz" | wc -l)

log "Backup files: $DB_COUNT databases, $REDIS_COUNT Redis, $CONFIG_COUNT configs"
FULLBACKUPEOF

chmod +x /home/allan/robbie-ai/scripts/backup-full.sh

echo "✅ Backup scripts created"

# Setup cron jobs
echo "⏰ Setting up backup cron jobs..."

cat > /etc/cron.d/aurora-backups << 'BACKUPCRONEOF'
# Aurora Town Automated Backups
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin

# Full backup daily at 2 AM
0 2 * * * root /home/allan/robbie-ai/scripts/backup-full.sh

# Database backup every 6 hours
0 */6 * * * root /home/allan/robbie-ai/scripts/backup-database.sh

# Redis backup every 6 hours (offset by 3 hours)
0 3,9,15,21 * * * root /home/allan/robbie-ai/scripts/backup-redis.sh
BACKUPCRONEOF

chmod 644 /etc/cron.d/aurora-backups

echo "✅ Backup cron jobs installed"

# Create restore script
echo "📝 Creating restore script..."

cat > /home/allan/robbie-ai/scripts/restore.sh << 'RESTOREEOF'
#!/bin/bash
# Aurora Town Restore Script
# Usage: ./restore.sh [database|redis|configs|all] [backup_file]

BACKUP_TYPE=$1
BACKUP_FILE=$2

if [ -z "$BACKUP_TYPE" ]; then
    echo "Usage: $0 [database|redis|configs|all] [backup_file]"
    echo ""
    echo "Available backups:"
    echo "=================="
    echo ""
    echo "Databases:"
    ls -lh /var/backups/aurora/database/*.sql.gz 2>/dev/null | tail -5
    echo ""
    echo "Redis:"
    ls -lh /var/backups/aurora/redis/*.rdb.gz 2>/dev/null | tail -5
    echo ""
    echo "Configs:"
    ls -lh /var/backups/aurora/configs/*.tar.gz 2>/dev/null | tail -5
    exit 1
fi

case $BACKUP_TYPE in
    database)
        if [ -z "$BACKUP_FILE" ]; then
            echo "❌ Please specify backup file"
            exit 1
        fi
        
        DB_NAME=$(basename $BACKUP_FILE | cut -d'_' -f1)
        echo "🔄 Restoring database: $DB_NAME"
        echo "⚠️  This will OVERWRITE the existing database!"
        read -p "Are you sure? (yes/no): " CONFIRM
        
        if [ "$CONFIRM" = "yes" ]; then
            gunzip -c $BACKUP_FILE | sudo -u postgres psql $DB_NAME
            echo "✅ Database restored"
        else
            echo "❌ Restore cancelled"
        fi
        ;;
        
    redis)
        if [ -z "$BACKUP_FILE" ]; then
            echo "❌ Please specify backup file"
            exit 1
        fi
        
        echo "🔄 Restoring Redis..."
        echo "⚠️  This will OVERWRITE the existing Redis data!"
        read -p "Are you sure? (yes/no): " CONFIRM
        
        if [ "$CONFIRM" = "yes" ]; then
            systemctl stop redis-server
            gunzip -c $BACKUP_FILE > /var/lib/redis/dump.rdb
            chown redis:redis /var/lib/redis/dump.rdb
            systemctl start redis-server
            echo "✅ Redis restored"
        else
            echo "❌ Restore cancelled"
        fi
        ;;
        
    configs)
        if [ -z "$BACKUP_FILE" ]; then
            echo "❌ Please specify backup file"
            exit 1
        fi
        
        echo "🔄 Restoring configurations..."
        echo "⚠️  This will OVERWRITE existing configs!"
        read -p "Are you sure? (yes/no): " CONFIRM
        
        if [ "$CONFIRM" = "yes" ]; then
            tar -xzf $BACKUP_FILE -C /tmp/
            echo "✅ Configurations extracted to /tmp/"
            echo "   Review and manually copy files as needed"
        else
            echo "❌ Restore cancelled"
        fi
        ;;
        
    *)
        echo "❌ Invalid backup type. Use: database, redis, configs, or all"
        exit 1
        ;;
esac
RESTOREEOF

chmod +x /home/allan/robbie-ai/scripts/restore.sh

echo "✅ Restore script created"

# Run initial backup
echo ""
echo "🧪 Running initial backup..."
bash /home/allan/robbie-ai/scripts/backup-full.sh

echo ""
echo "✅ Backup System Setup Complete!"
echo ""
echo "📋 What's Configured:"
echo "===================="
echo "✅ Daily full backup at 2:00 AM"
echo "✅ Database backup every 6 hours"
echo "✅ Redis backup every 6 hours (offset)"
echo "✅ Configuration backup daily"
echo "✅ Automatic cleanup (7 days retention)"
echo "✅ Restore scripts available"
echo ""
echo "📋 Backup Locations:"
echo "===================="
echo "Database: /var/backups/aurora/database/"
echo "Redis:    /var/backups/aurora/redis/"
echo "Configs:  /var/backups/aurora/configs/"
echo ""
echo "📋 Commands:"
echo "============"
echo "Full backup:     sudo /home/allan/robbie-ai/scripts/backup-full.sh"
echo "DB backup:       sudo /home/allan/robbie-ai/scripts/backup-database.sh"
echo "Redis backup:    sudo /home/allan/robbie-ai/scripts/backup-redis.sh"
echo "Config backup:   sudo /home/allan/robbie-ai/scripts/backup-configs.sh"
echo "Restore:         sudo /home/allan/robbie-ai/scripts/restore.sh"
echo "View backups:    ls -lh /var/backups/aurora/*/"
echo ""
echo "⚠️  IMPORTANT: Set up remote backup sync to AWS S3 or Backblaze B2!"

