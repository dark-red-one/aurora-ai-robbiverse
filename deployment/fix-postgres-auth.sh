#!/bin/bash
# Fix PostgreSQL auth to allow local passwordless access

echo "🔧 Configuring PostgreSQL for passwordless local access..."

# Backup original config
sudo cp /Library/PostgreSQL/16/data/pg_hba.conf /Library/PostgreSQL/16/data/pg_hba.conf.backup

# Update pg_hba.conf to trust local connections
sudo tee /Library/PostgreSQL/16/data/pg_hba.conf > /dev/null << 'EOF'
# TYPE  DATABASE        USER            ADDRESS                 METHOD

# "local" is for Unix domain socket connections only
local   all             all                                     trust

# IPv4 local connections:
host    all             all             127.0.0.1/32            trust
host    all             all             ::1/128                 trust

# Allow replication connections from localhost
local   replication     all                                     trust
host    replication     all             127.0.0.1/32            trust
host    replication     all             ::1/128                 trust
EOF

echo "✅ pg_hba.conf updated to trust local connections"

# Reload PostgreSQL config
echo "🔄 Reloading PostgreSQL..."
sudo /Library/PostgreSQL/16/bin/pg_ctl -D /Library/PostgreSQL/16/data reload

echo "✅ PostgreSQL configured for passwordless local access"

