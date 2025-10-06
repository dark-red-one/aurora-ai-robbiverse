#!/bin/bash
set -euo pipefail

# RobbieBook1 Sync Setup Script
# Sets up automated sync between RobbieBook1 and Elephant

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
SYNC_SCRIPT="$ROOT_DIR/api-connectors/robbiebook-sync.py"
LOG_DIR="$ROOT_DIR/logs"

echo "🚀 Setting up RobbieBook1 sync system..."

# Create logs directory
mkdir -p "$LOG_DIR"

# Make scripts executable
chmod +x "$SYNC_SCRIPT"

# Test database connection
echo "🧪 Testing Elephant database connection..."
python3 -c "
import psycopg2
db_config = {
    'host': 'aurora-postgres-u44170.vm.elestio.app',
    'port': 25432,
    'dbname': 'aurora_unified',
    'user': 'aurora_app',
    'password': 'TestPilot2025_Aurora!',
    'sslmode': 'require'
}
try:
    conn = psycopg2.connect(**db_config)
    print('✅ Elephant database connection successful!')
    conn.close()
except Exception as e:
    print(f'❌ Database connection failed: {e}')
    exit(1)
"

# Test sync script
echo "🧪 Testing sync script..."
python3 "$SYNC_SCRIPT" --once

if [ $? -eq 0 ]; then
    echo "✅ Sync script test successful!"
else
    echo "❌ Sync script test failed!"
    exit 1
fi

# Set up cron job for continuous sync
echo "⏰ Setting up cron job for continuous sync..."
CRON_JOB="*/1 * * * * cd $ROOT_DIR && python3 $SYNC_SCRIPT --once >> $LOG_DIR/cron-sync.log 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "robbiebook-sync.py"; then
    echo "⚠️ Cron job already exists"
else
    # Add cron job
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    echo "✅ Cron job added: sync every minute"
fi

# Create manual sync script
cat > "$ROOT_DIR/manual-sync.sh" << 'EOF'
#!/bin/bash
# Manual sync trigger for RobbieBook1
cd "$(dirname "$0")"
python3 api-connectors/robbiebook-sync.py --once
EOF

chmod +x "$ROOT_DIR/manual-sync.sh"

# Create continuous sync script
cat > "$ROOT_DIR/start-continuous-sync.sh" << 'EOF'
#!/bin/bash
# Start continuous sync (runs until stopped)
cd "$(dirname "$0")"
python3 api-connectors/robbiebook-sync.py --continuous --interval 1
EOF

chmod +x "$ROOT_DIR/start-continuous-sync.sh"

echo ""
echo "🎉 RobbieBook1 sync setup complete!"
echo ""
echo "📋 Available commands:"
echo "• ./manual-sync.sh - Run sync once"
echo "• ./start-continuous-sync.sh - Start continuous sync"
echo "• crontab -l - View cron jobs"
echo "• tail -f logs/cron-sync.log - Monitor sync logs"
echo ""
echo "📊 Next steps:"
echo "1. Set up Google OAuth credentials:"
echo "   cd api-connectors && python3 setup-google-oauth.py"
echo "2. Monitor sync status:"
echo "   tail -f logs/robbiebook-sync.log"
echo "3. Check sync data in Elephant database"
echo ""
echo "✅ Ready for production sync operations!"
