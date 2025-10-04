#!/bin/bash
# RunPod Debug Commands
# Run these in the RunPod web terminal to diagnose issues

echo "🔍 RUNPOD DIAGNOSTIC COMMANDS"
echo "=============================="
echo ""

echo "1. Check if environment variables are set:"
echo "env | grep AURORA"
echo ""

echo "2. Test CUDA availability:"
echo "python3 -c 'import torch; print(\"CUDA:\", torch.cuda.is_available(), \"GPUs:\", torch.cuda.device_count())'"
echo ""

echo "3. Test database connection manually:"
echo "python3 -c 'import psycopg2; conn=psycopg2.connect(host=\"aurora-postgres-u44170.vm.elestio.app\", port=25432, dbname=\"aurora_unified\", user=\"aurora_app\", password=\"TestPilot2025_Aurora!\", sslmode=\"require\"); cur=conn.cursor(); cur.execute(\"SELECT 1\"); print(\"DB OK:\", cur.fetchone()[0]); conn.close()'"
echo ""

echo "4. Check if packages are installed:"
echo "dpkg -l | grep -E '(awscli|ca-certificates|python3-psycopg2)'"
echo ""

echo "5. Check if port 8000 is in use:"
echo "netstat -tulpn | grep 8000"
echo ""

echo "6. Check running processes:"
echo "ps aux | grep python"
echo ""

echo "7. Check disk space:"
echo "df -h"
echo ""

echo "8. Start health server manually:"
echo "mkdir -p /workspace/health && echo OK > /workspace/health/index.html && python3 -m http.server 8000 --directory /workspace/health &"
echo ""

echo "9. Test health endpoint:"
echo "curl http://localhost:8000"
echo ""

echo "10. Check logs if available:"
echo "journalctl -f"
