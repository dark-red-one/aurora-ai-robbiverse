#!/bin/bash
# PostgreSQL + pgvector setup for Aurora
# Run with: sudo ./setup-postgres-vector.sh

echo "🔧 Starting PostgreSQL..."
systemctl start postgresql
systemctl enable postgresql

echo "📊 Setting up Aurora database..."
sudo -u postgres psql << EOF
-- Create database if not exists
SELECT 'CREATE DATABASE aurora' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'aurora')\gexec

-- Create user if not exists  
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'allan') THEN
    CREATE USER allan WITH PASSWORD 'aurora_dev_2025';
  END IF;
END
\$\$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE aurora TO allan;

\c aurora

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO allan;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO allan;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO allan;

-- Show status
\dx
EOF

echo "✅ PostgreSQL + pgvector ready!"
echo "   Database: aurora"
echo "   User: allan"
echo "   Password: aurora_dev_2025"
echo ""
echo "Test with: psql -U allan -d aurora -h localhost"
