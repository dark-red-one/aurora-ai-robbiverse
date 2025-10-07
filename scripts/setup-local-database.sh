#!/bin/bash
# Local Aurora Database Setup
# Creates a local PostgreSQL database for development

set -e

echo "🗄️ LOCAL AURORA DATABASE SETUP"
echo "==============================="

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL not found. Installing..."
    sudo apt update
    sudo apt install -y postgresql postgresql-contrib
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
fi

# Check if PostgreSQL is running
if ! sudo systemctl is-active --quiet postgresql; then
    echo "🔄 Starting PostgreSQL..."
    sudo systemctl start postgresql
fi

echo "✅ PostgreSQL is running"

# Create database and user
echo "🔧 Creating Aurora database..."
sudo -u postgres psql << 'SQL'
-- Create database
CREATE DATABASE aurora_unified;

-- Create user
CREATE USER aurora_user WITH PASSWORD 'aurora_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE aurora_unified TO aurora_user;

-- Connect to database and grant schema privileges
\c aurora_unified;
GRANT ALL ON SCHEMA public TO aurora_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO aurora_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO aurora_user;

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgvector";

\q
SQL

echo "✅ Local Aurora database created"

# Update connection script for local database
cat > scripts/connect-to-local-db.py << 'PYTHON'
#!/usr/bin/env python3
"""
Local Aurora Database Connection
"""

import psycopg2
import psycopg2.extras
import json

class LocalAuroraDatabase:
    def __init__(self):
        self.connection = None
        self.cursor = None
        
        # Local database configuration
        self.db_config = {
            'host': 'localhost',
            'port': 5432,
            'database': 'aurora_unified',
            'user': 'aurora_user',
            'password': 'aurora_password'
        }
    
    def connect(self):
        """Connect to local database"""
        try:
            print("🔗 Connecting to local Aurora database...")
            self.connection = psycopg2.connect(**self.db_config)
            self.cursor = self.connection.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            print("✅ Connected to local Aurora database!")
            return True
        except Exception as e:
            print(f"❌ Database connection failed: {e}")
            return False
    
    def test_connection(self):
        """Test database connection"""
        if not self.connect():
            return False
        
        # Test basic query
        result = self.cursor.execute("SELECT NOW() as current_time")
        result = self.cursor.fetchone()
        print(f"✅ Database time: {result['current_time']}")
        
        self.connection.close()
        return True

if __name__ == "__main__":
    db = LocalAuroraDatabase()
    if db.test_connection():
        print("🎉 Local Aurora database is ready!")
    else:
        print("❌ Local database setup failed!")
PYTHON

chmod +x scripts/connect-to-local-db.py

echo "✅ Local database setup complete!"
echo "🔧 To test: python3 scripts/connect-to-local-db.py"
