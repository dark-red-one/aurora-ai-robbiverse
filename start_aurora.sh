#!/bin/bash
# Aurora RobbieVerse - Start Script

echo "🚀 Starting Aurora RobbieVerse System..."

# Start PostgreSQL if not running
if ! pgrep -f postgres > /dev/null; then
    echo "📊 Starting PostgreSQL..."
    runuser -u postgres -- /usr/lib/postgresql/16/bin/pg_ctl -D /var/lib/postgresql/16/main -l /var/log/postgresql/postgresql-16-main.log start
fi

# Start FastAPI Backend
echo "🔧 Starting FastAPI Backend..."
cd /workspace/aurora/backend
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &

# Wait a moment for server to start
sleep 3

# Test endpoints
echo "🧪 Testing API endpoints..."
curl -s http://localhost:8000/ || echo "❌ Root endpoint failed"
curl -s http://localhost:8000/api/v1/mentors || echo "❌ Mentors endpoint failed"

echo "✅ Aurora RobbieVerse Phase 1 Complete!"
echo "📍 API available at: http://localhost:8000"
echo "📚 API docs at: http://localhost:8000/docs"
echo "🔌 WebSocket test at: http://localhost:8000/ws-test"

