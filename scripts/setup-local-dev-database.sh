#!/bin/bash
# Local Development Database Setup
# Creates a local PostgreSQL database for Aurora AI Empire development

set -e

echo "🗄️ LOCAL AURORA DEVELOPMENT DATABASE"
echo "===================================="

# Check if we can access PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL not found. Please install PostgreSQL first:"
    echo "   sudo apt update"
    echo "   sudo apt install -y postgresql postgresql-contrib"
    echo "   sudo systemctl start postgresql"
    exit 1
fi

echo "✅ PostgreSQL found"

# Create a local database using Docker (if available)
if command -v docker &> /dev/null; then
    echo "🐳 Setting up PostgreSQL with Docker..."
    
    # Create docker-compose.yml for local development
    cat > docker-compose.aurora-dev.yml << 'DOCKER'
version: '3.8'
services:
  aurora-db:
    image: pgvector/pgvector:pg16
    container_name: aurora-dev-db
    environment:
      POSTGRES_DB: aurora_unified
      POSTGRES_USER: aurora_user
      POSTGRES_PASSWORD: aurora_password
    ports:
      - "5432:5432"
    volumes:
      - aurora_data:/var/lib/postgresql/data
      - ./scripts/create-aurora-database.sql:/docker-entrypoint-initdb.d/init.sql
    restart: unless-stopped

volumes:
  aurora_data:
DOCKER

    echo "🚀 Starting Aurora development database..."
    docker-compose -f docker-compose.aurora-dev.yml up -d
    
    echo "⏳ Waiting for database to initialize..."
    sleep 10
    
    echo "✅ Aurora development database is running!"
    echo "🔗 Connection details:"
    echo "   Host: localhost"
    echo "   Port: 5432"
    echo "   Database: aurora_unified"
    echo "   User: aurora_user"
    echo "   Password: aurora_password"
    
else
    echo "❌ Docker not found. Please install Docker or PostgreSQL manually."
    echo "📋 Manual setup instructions:"
    echo "   1. Install PostgreSQL: sudo apt install postgresql postgresql-contrib"
    echo "   2. Create database: sudo -u postgres createdb aurora_unified"
    echo "   3. Create user: sudo -u postgres createuser aurora_user"
    echo "   4. Set password: sudo -u postgres psql -c \"ALTER USER aurora_user PASSWORD 'aurora_password';\""
    echo "   5. Grant privileges: sudo -u postgres psql -c \"GRANT ALL PRIVILEGES ON DATABASE aurora_unified TO aurora_user;\""
    echo "   6. Load schema: psql -h localhost -U aurora_user -d aurora_unified -f scripts/create-aurora-database.sql"
fi

echo ""
echo "🧪 Testing database connection..."
if python3 scripts/connect-to-aurora-db.py; then
    echo "✅ Database connection successful!"
    echo "🎉 Aurora development database is ready!"
else
    echo "❌ Database connection failed. Check the setup above."
fi
