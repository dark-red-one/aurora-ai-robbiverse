#!/bin/bash
# RunPod Production Setup Script
# Run this in the RunPod terminal to set up all services

set -e

echo "🚀 AURORA GPU WORKER PRODUCTION SETUP"
echo "====================================="

# 1. Create health monitoring
echo "📊 Setting up health monitoring..."
mkdir -p /workspace/health /workspace/logs /workspace/scripts

cat > /workspace/health/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head><title>Aurora GPU Worker</title></head>
<body>
<h1>Aurora GPU Worker - Status: OK</h1>
<p>GPU: RTX 4090</p>
<p>Status: Online</p>
<p>Last Check: <span id="time"></span></p>
<script>document.getElementById('time').textContent = new Date().toISOString();</script>
</body>
</html>
EOF

# 2. Create comprehensive health check
cat > /workspace/scripts/health-check.py << 'EOF'
#!/usr/bin/env python3
import json, torch, psycopg2, time, os
from datetime import datetime

def health_check():
    status = {
        "timestamp": datetime.utcnow().isoformat(),
        "status": "healthy",
        "services": {}
    }
    
    # GPU Check
    try:
        status["services"]["gpu"] = {
            "available": torch.cuda.is_available(),
            "count": torch.cuda.device_count(),
            "name": torch.cuda.get_device_name(0) if torch.cuda.is_available() else None
        }
    except Exception as e:
        status["services"]["gpu"] = {"error": str(e)}
        status["status"] = "degraded"
    
    # Database Check
    try:
        conn = psycopg2.connect(
            host="aurora-postgres-u44170.vm.elestio.app",
            port=25432,
            dbname="aurora_unified", 
            user="aurora_app",
            password="TestPilot2025_Aurora!",
            sslmode="require",
            connect_timeout=5
        )
        with conn.cursor() as cur:
            cur.execute("SELECT 1")
            cur.fetchone()
        conn.close()
        status["services"]["database"] = {"status": "connected"}
    except Exception as e:
        status["services"]["database"] = {"error": str(e)}
        status["status"] = "unhealthy"
    
    return status

if __name__ == "__main__":
    health = health_check()
    print(json.dumps(health, indent=2))
    
    # Write to health endpoint
    with open("/workspace/health/status.json", "w") as f:
        json.dump(health, f, indent=2)
EOF

chmod +x /workspace/scripts/health-check.py

# 3. Create service startup script
cat > /workspace/scripts/start-services.sh << 'EOF'
#!/bin/bash
# Start all Aurora GPU Worker services

set -e

echo "🚀 Starting Aurora GPU Worker services..."

# Set environment variables
export AURORA_DB_HOST=aurora-postgres-u44170.vm.elestio.app
export AURORA_DB_PORT=25432
export AURORA_DB_NAME=aurora_unified
export AURORA_DB_USER=aurora_app
export AURORA_DB_PASSWORD="TestPilot2025_Aurora!"
export AURORA_DB_SSLMODE=require
export CITY=aurora
export APP_ENV=prod
export NODE_TYPE=gpu_worker

# Start health monitoring server
echo "📊 Starting health server on port 8000..."
python3 -m http.server 8000 --directory /workspace/health > /workspace/logs/health-server.log 2>&1 &
echo $! > /workspace/health-server.pid

# Run initial health check
echo "🔍 Running initial health check..."
python3 /workspace/scripts/health-check.py

# Start periodic health checks (every 30 seconds)
echo "⏰ Starting periodic health checks..."
(while true; do
    python3 /workspace/scripts/health-check.py > /workspace/logs/health-$(date +%Y%m%d).log 2>&1
    sleep 30
done) &
echo $! > /workspace/health-check.pid

echo "✅ All services started successfully!"
echo "📊 Health endpoint: http://localhost:8000"
echo "📊 Health status: http://localhost:8000/status.json"
echo "📝 Logs: /workspace/logs/"

# Show status
ps aux | grep -E "(python3|http.server)" | grep -v grep
EOF

chmod +x /workspace/scripts/start-services.sh

# 4. Create stop services script
cat > /workspace/scripts/stop-services.sh << 'EOF'
#!/bin/bash
# Stop all Aurora GPU Worker services

echo "🛑 Stopping Aurora GPU Worker services..."

# Stop health server
if [ -f /workspace/health-server.pid ]; then
    kill $(cat /workspace/health-server.pid) 2>/dev/null || true
    rm -f /workspace/health-server.pid
fi

# Stop health checks
if [ -f /workspace/health-check.pid ]; then
    kill $(cat /workspace/health-check.pid) 2>/dev/null || true
    rm -f /workspace/health-check.pid
fi

# Kill any remaining python servers
pkill -f "python3 -m http.server" || true
pkill -f "health-check.py" || true

echo "✅ All services stopped"
EOF

chmod +x /workspace/scripts/stop-services.sh

# 5. Start services
echo "🚀 Starting production services..."
/workspace/scripts/start-services.sh

echo ""
echo "✅ PRODUCTION SETUP COMPLETE!"
echo ""
echo "📊 Services running:"
echo "• Health server: http://localhost:8000"
echo "• Health status: http://localhost:8000/status.json"
echo "• Logs: /workspace/logs/"
echo ""
echo "🔧 Management commands:"
echo "• Start: /workspace/scripts/start-services.sh"
echo "• Stop: /workspace/scripts/stop-services.sh"
echo "• Health check: /workspace/scripts/health-check.py"
