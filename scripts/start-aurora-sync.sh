#!/bin/bash
# Aurora Sync Startup Script
# Launches real data sync from Google, Fireflies, HubSpot, etc.

echo "🚀 AURORA SYNC STARTUP"
echo "======================"

# Set environment variables
export PYTHONPATH="/Users/allanperetz/aurora-ai-robbiverse:$PYTHONPATH"
export AURORA_BASE_PATH="/Users/allanperetz/aurora-ai-robbiverse"

# Check if we're in the right directory
if [ ! -d "/Users/allanperetz/aurora-ai-robbiverse/api-connectors" ]; then
    echo "❌ Error: Aurora directory not found"
    exit 1
fi

# Check disk space
echo "💾 Checking disk space..."
df -h /Users/allanperetz/aurora-ai-robbiverse/data 2>/dev/null || echo "⚠️ Data directory not found, will be created"

# Check Python dependencies
echo "🐍 Checking Python dependencies..."
cd /Users/allanperetz/aurora-ai-robbiverse/api-connectors
python3 -c "import psycopg2, requests, google.auth" 2>/dev/null && echo "✅ Dependencies OK" || echo "⚠️ Some dependencies missing"

# Check API keys
echo "🔑 Checking API keys..."
if [ -n "$HUBSPOT_API_KEY" ]; then
    echo "✅ HubSpot API key found"
else
    echo "⚠️ HubSpot API key not set"
fi

if [ -n "$FIREFLIES_API_KEY" ]; then
    echo "✅ Fireflies API key found"
else
    echo "⚠️ Fireflies API key not set"
fi

if [ -n "$GOOGLE_CREDENTIALS_PATH" ]; then
    echo "✅ Google credentials path set"
else
    echo "⚠️ Google credentials path not set"
fi

# Launch Aurora sync
echo ""
echo "🚀 Launching Aurora sync..."
python3 aurora-sync-launcher.py

echo ""
echo "✅ Aurora sync startup complete!"











