#!/bin/bash
echo "🧪 Testing Aurora Town Tunnel..."
echo ""

# Test SSH connection
echo "1️⃣ Testing SSH connection..."
ssh -o ConnectTimeout=5 root@aurora-town-u44170.vm.elestio.app echo '✅ SSH works!'

if [ $? -eq 0 ]; then
    echo ""
    echo "2️⃣ Starting tunnel in background..."
    ./deployment/start-aurora-tunnel.sh &
    TUNNEL_PID=$!
    
    sleep 5
    
    echo ""
    echo "3️⃣ Testing forwarded ports..."
    echo "   Port 11435 (Aurora Ollama)..."
    curl -s http://localhost:11435/api/tags > /dev/null && echo "   ✅ Ollama accessible" || echo "   ❌ Ollama not accessible"
    
    echo "   Port 8006 (Aurora Chat MVP)..."
    curl -s http://localhost:8006/api/status > /dev/null && echo "   ✅ Chat MVP accessible" || echo "   ❌ Chat MVP not accessible"
    
    echo ""
    echo "Tunnel PID: $TUNNEL_PID"
    echo "Kill tunnel: kill $TUNNEL_PID"
else
    echo "❌ SSH connection failed - add your SSH key to Elestio first"
fi

