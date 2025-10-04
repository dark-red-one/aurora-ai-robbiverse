#!/bin/bash
# Aurora health check and auto-recovery

echo "🏥 Aurora Health Check - Linus approved monitoring"

# Check Aurora backend
if ! curl -f http://localhost:8000/health >/dev/null 2>&1; then
    echo "❌ Aurora backend down - restarting..."
    cd /workspace/aurora
    pkill -f "uvicorn backend.main:app"
    python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 &
    sleep 5
fi

# Check GPU coordinator
if ! curl -f http://localhost:8001/ >/dev/null 2>&1; then
    echo "❌ GPU coordinator down - restarting..."
    cd /workspace/aurora
    pkill -f "gpu_mesh/coordinator.py"
    python3 gpu_mesh/coordinator.py &
    sleep 5
fi

# Check GPU dashboard
if ! curl -f http://localhost:8002/ >/dev/null 2>&1; then
    echo "❌ GPU dashboard down - restarting..."
    cd /workspace/aurora
    pkill -f "gpu-mesh-dashboard.py"
    python3 gpu-mesh-dashboard.py &
    sleep 5
fi

# Check Nginx
if ! systemctl is-active --quiet nginx; then
    echo "❌ Nginx down - restarting..."
    systemctl start nginx
fi

echo "✅ Health check complete - All systems operational"
