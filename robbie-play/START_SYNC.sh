#!/bin/bash
# Start Robbie App with Data Sync

echo "🚀 Starting Robbie App with Data Sync..."
echo ""

# Check if backend is running
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Backend API running (localhost:8000)"
else
    echo "⚠️  Backend API not detected"
    echo "    Starting backend..."
    cd ../backend
    source ../venv/bin/activate
    python3 -m app.main &
    sleep 3
fi

# Check PostgreSQL
if psql -U postgres -d aurora -h localhost -c "SELECT 1" > /dev/null 2>&1; then
    echo "✅ PostgreSQL running (aurora database)"
else
    echo "❌ PostgreSQL not accessible"
    exit 1
fi

# Check Redis
if redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis running (for GPU mesh)"
else
    echo "⚠️  Redis not detected - GPU mesh won't work"
fi

echo ""
echo "🎨 Starting Robbie App frontend..."
cd robbie-app
npm run dev

echo ""
echo "✅ Everything running!"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8000"
echo "   Database: PostgreSQL (aurora)"
echo ""
echo "🔄 Data sync: Every 30 seconds"
echo "💜 Flirt mode: 7 engaged!"
