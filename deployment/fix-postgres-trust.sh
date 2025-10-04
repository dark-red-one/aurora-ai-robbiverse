#!/bin/bash
# Fix PostgreSQL to trust local connections - ONE command

echo "🔧 Configuring PostgreSQL for passwordless local access..."

# Backup and update pg_hba.conf
sudo tee /Library/PostgreSQL/16/data/pg_hba.conf.backup < /Library/PostgreSQL/16/data/pg_hba.conf > /dev/null 2>&1

sudo tee /Library/PostgreSQL/16/data/pg_hba.conf > /dev/null << 'HBAEOF'
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             all                                     trust
host    all             all             127.0.0.1/32            trust
host    all             all             ::1/128                 trust
local   replication     all                                     trust
host    replication     all             127.0.0.1/32            trust
host    replication     all             ::1/128                 trust
HBAEOF

# Restart PostgreSQL to apply changes
echo "🔄 Restarting PostgreSQL..."
sudo launchctl unload /Library/LaunchDaemons/com.edb.launchd.postgresql-16.plist 2>/dev/null
sudo launchctl load /Library/LaunchDaemons/com.edb.launchd.postgresql-16.plist 2>/dev/null

sleep 2

# Test connection
echo "🧪 Testing passwordless connection..."
export PATH="/Library/PostgreSQL/16/bin:$PATH"
if psql -h localhost -p 5432 -U postgres -d postgres -c "SELECT '✅ Passwordless access works!' as status;" 2>/dev/null; then
    echo ""
    echo "✅ PostgreSQL configured successfully!"
    echo "You can now run: ./deployment/setup-robbiebook-replica.sh"
else
    echo "⚠️  Testing failed - PostgreSQL may still be restarting. Wait 10 seconds and try:"
    echo "  psql -h localhost -U postgres -d postgres"
fi

