#!/bin/bash
# Aurora Database Initialization Script
# Sets up the complete Aurora AI Empire database

set -e

echo "🗄️ AURORA DATABASE INITIALIZATION"
echo "=================================="

# Database configuration
AURORA_HOST="45.32.194.172"
AURORA_PORT="5432"
AURORA_DB="aurora_unified"
AURORA_USER="postgres"
AURORA_PASSWORD="fun2Gus!!!"

echo "🔗 Connecting to Aurora Town database..."
echo "Host: $AURORA_HOST:$AURORA_PORT"
echo "Database: $AURORA_DB"
echo ""

# Test connection
echo "🧪 Testing database connection..."
if PGPASSWORD="$AURORA_PASSWORD" psql -h "$AURORA_HOST" -p "$AURORA_PORT" -U "$AURORA_USER" -d "$AURORA_DB" -c "SELECT version();" > /dev/null 2>&1; then
    echo "✅ Database connection successful"
else
    echo "❌ Database connection failed"
    echo "🔧 Please check Aurora Town server status"
    exit 1
fi

# Create database schema
echo ""
echo "🔧 Creating database schema..."
if PGPASSWORD="$AURORA_PASSWORD" psql -h "$AURORA_HOST" -p "$AURORA_PORT" -U "$AURORA_USER" -d "$AURORA_DB" -f scripts/create-aurora-database.sql; then
    echo "✅ Database schema created successfully"
else
    echo "❌ Schema creation failed"
    exit 1
fi

# Test Python connection
echo ""
echo "🐍 Testing Python database connection..."
if python3 scripts/connect-to-aurora-db.py; then
    echo "✅ Python connection successful"
else
    echo "❌ Python connection failed"
    exit 1
fi

echo ""
echo "🎉 AURORA DATABASE INITIALIZATION COMPLETE!"
echo "==========================================="
echo ""
echo "✅ Database Features:"
echo "   • 15 tables with full relationships"
echo "   • 12 performance indexes"
echo "   • 3 analytical views"
echo "   • Vector search capabilities (pgvector)"
echo "   • Real-time triggers and functions"
echo ""
echo "✅ Initial Data Loaded:"
echo "   • Users: Allan Peretz (CEO)"
echo "   • AI Personalities: Robbie, AllanBot, Gatekeeper"
echo "   • Widgets: 10 widgets with status tracking"
echo "   • Sites: 5 RobbieBlocks sites"
echo "   • GPU Nodes: 5 nodes including RunPod"
echo "   • Deals: $52,740 in closed deals + pipeline"
echo ""
echo "🚀 Ready for Aurora AI Empire operations!"
