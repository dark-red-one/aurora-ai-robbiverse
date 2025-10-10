#!/bin/bash
# Setup PostgreSQL 16 with pgvector on Aurora Town
# Includes database creation, user setup, and schema migration

set -e

echo "🐘 Setting up PostgreSQL 16 with pgvector on Aurora Town"
echo "========================================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root (sudo)"
    exit 1
fi

# Install PostgreSQL 16
echo "📦 Installing PostgreSQL 16..."
apt update
apt install -y postgresql-16 postgresql-contrib-16 postgresql-server-dev-16

echo "✅ PostgreSQL 16 installed"

# Install pgvector
echo "📦 Installing pgvector extension..."
cd /tmp
if [ ! -d "pgvector" ]; then
    git clone --branch v0.5.1 https://github.com/pgvector/pgvector.git
fi
cd pgvector
make clean
make
make install

echo "✅ pgvector installed"

# Start PostgreSQL
systemctl enable postgresql
systemctl start postgresql

echo "✅ PostgreSQL service started"

# Generate strong password
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)

# Create databases and user
echo "🗄️  Creating databases and users..."
sudo -u postgres psql << EOF
-- Create application user
CREATE USER aurora_app WITH PASSWORD '$DB_PASSWORD';

-- Create databases
CREATE DATABASE aurora_unified OWNER aurora_app;
CREATE DATABASE heyshopper_prod OWNER aurora_app;
CREATE DATABASE robbieverse_prod OWNER aurora_app;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE aurora_unified TO aurora_app;
GRANT ALL PRIVILEGES ON DATABASE heyshopper_prod TO aurora_app;
GRANT ALL PRIVILEGES ON DATABASE robbieverse_prod TO aurora_app;

-- Enable extensions in aurora_unified
\c aurora_unified
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
GRANT ALL ON SCHEMA public TO aurora_app;

-- Enable extensions in heyshopper_prod
\c heyshopper_prod
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
GRANT ALL ON SCHEMA public TO aurora_app;

-- Enable extensions in robbieverse_prod
\c robbieverse_prod
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
GRANT ALL ON SCHEMA public TO aurora_app;
EOF

echo "✅ Databases created"

# Configure PostgreSQL for network access
echo "🌐 Configuring PostgreSQL for network access..."

PG_HBA="/etc/postgresql/16/main/pg_hba.conf"
PG_CONF="/etc/postgresql/16/main/postgresql.conf"

# Backup configs
cp $PG_HBA ${PG_HBA}.backup
cp $PG_CONF ${PG_CONF}.backup

# Allow connections from VPN network (10.0.0.0/24)
cat >> $PG_HBA << EOF

# Aurora VPN network
host    all             aurora_app      10.0.0.0/24             scram-sha-256
host    all             postgres        10.0.0.0/24             scram-sha-256
EOF

# Configure PostgreSQL to listen on all interfaces
sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" $PG_CONF

# Performance tuning
cat >> $PG_CONF << EOF

# Aurora Town Performance Tuning
shared_buffers = 2GB
effective_cache_size = 6GB
maintenance_work_mem = 512MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 5242kB
min_wal_size = 1GB
max_wal_size = 4GB
max_worker_processes = 2
max_parallel_workers_per_gather = 1
max_parallel_workers = 2
max_parallel_maintenance_workers = 1

# WAL archiving for PITR
wal_level = replica
max_wal_senders = 3
wal_keep_size = 1GB
EOF

# Restart PostgreSQL
systemctl restart postgresql

echo "✅ PostgreSQL configured"

# Save credentials
CREDS_FILE="/root/.aurora_db_credentials"
cat > $CREDS_FILE << EOF
# Aurora Town Database Credentials
# Generated: $(date)

DATABASE: aurora_unified
USERNAME: aurora_app
PASSWORD: $DB_PASSWORD
HOST: localhost (internal) or 10.0.0.1 (via VPN)
PORT: 5432

Connection strings:
  postgresql://aurora_app:$DB_PASSWORD@localhost:5432/aurora_unified
  postgresql://aurora_app:$DB_PASSWORD@10.0.0.1:5432/aurora_unified
  
HeyShopper database:
  postgresql://aurora_app:$DB_PASSWORD@localhost:5432/heyshopper_prod

Robbieverse database:
  postgresql://aurora_app:$DB_PASSWORD@localhost:5432/robbieverse_prod
EOF

chmod 600 $CREDS_FILE

echo "✅ Credentials saved to: $CREDS_FILE"

# Test connection
echo "🧪 Testing database connection..."
if sudo -u postgres psql -c "SELECT version();" > /dev/null 2>&1; then
    echo "✅ Database connection successful"
else
    echo "❌ Database connection failed"
    exit 1
fi

# Test pgvector
echo "🧪 Testing pgvector extension..."
sudo -u postgres psql -d aurora_unified -c "SELECT '[1,2,3]'::vector;" > /dev/null 2>&1 && echo "✅ pgvector working" || echo "❌ pgvector test failed"

echo ""
echo "✅ PostgreSQL Setup Complete!"
echo ""
echo "📋 Database Information:"
echo "========================"
echo "Main Database: aurora_unified"
echo "User: aurora_app"
echo "Password: (saved in $CREDS_FILE)"
echo ""
echo "📋 Connection from VPN (10.0.0.x):"
echo "   psql -h 10.0.0.1 -U aurora_app -d aurora_unified"
echo ""
echo "📋 Next Steps:"
echo "1. Run './import-schemas.sh' to load database schemas"
echo "2. Run './setup-pg-replication.sh' to configure replication to RobbieBook1"
echo ""
echo "⚠️  IMPORTANT: Save the credentials file securely!"
echo "   Copy to a secure location and remove from server when done"

