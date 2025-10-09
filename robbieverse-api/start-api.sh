#!/bin/bash
# Start Robbieverse API for Smart Robbie@Code

cd /home/allan/robbie_workspace/combined/aurora-ai-robbiverse/robbieverse-api

# Check if Postgres is running
if ! docker ps | grep -q robbieverse-postgres; then
    echo "🔴 Postgres not running - starting it..."
    docker-compose up -d
    sleep 3
fi

# Build TypeScript if needed
if [ ! -d "dist" ]; then
    echo "📦 Building TypeScript..."
    npm run build
fi

# Start the API
echo "🚀 Starting Robbieverse API..."
npm run dev


