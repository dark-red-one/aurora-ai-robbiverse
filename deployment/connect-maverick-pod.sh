#!/bin/bash
# Connect Aurora Town to Maverick Pod (when deployed)
# Usage: ./connect-maverick-pod.sh <POD_IP> <SSH_PORT>

set -euo pipefail

if [ $# -lt 2 ]; then
    echo "Usage: $0 <POD_IP> <SSH_PORT>"
    echo "Example: $0 213.181.111.2 12345"
    exit 1
fi

POD_IP=$1
SSH_PORT=$2

echo "🔗 CONNECTING AURORA TOWN TO MAVERICK POD"
echo "=========================================="
echo "Pod IP: $POD_IP"
echo "SSH Port: $SSH_PORT"
echo ""

# Test connection
echo "🧪 Testing pod connection..."
if ! timeout 5 nc -zv $POD_IP $SSH_PORT 2>&1; then
    echo "❌ Cannot reach pod at $POD_IP:$SSH_PORT"
    exit 1
fi
echo "✅ Pod reachable"

# Create or update tunnel for Maverick
echo "🔗 Setting up tunnel for Maverick..."
ssh root@aurora-town-u44170.vm.elestio.app << ENDSSH
# Stop existing maverick tunnel if any
systemctl stop maverick-tunnel 2>/dev/null || true

# Create new tunnel service
cat > /etc/systemd/system/maverick-tunnel.service << 'EOF'
[Unit]
Description=SSH Tunnel to Maverick Pod
After=network.target

[Service]
Type=simple
User=root
Restart=always
RestartSec=10
ExecStart=/usr/bin/ssh -N -L 11435:localhost:11434 -o StrictHostKeyChecking=no -o ServerAliveInterval=60 -p ${SSH_PORT} -i /root/.ssh/id_ed25519 root@${POD_IP}

[Install]
WantedBy=multi-user.target
EOF

# Reload and start
systemctl daemon-reload
systemctl enable maverick-tunnel
systemctl start maverick-tunnel
sleep 3

# Test tunnel
if curl -s http://localhost:11435/api/tags | grep -q "llama4:maverick"; then
    echo "✅ Maverick connected on localhost:11435"
else
    echo "⚠️  Tunnel up but Maverick not ready yet (may still be loading)"
fi
ENDSSH

echo ""
echo "✅ MAVERICK POD CONNECTED!"
echo ""
echo "📊 Service: maverick-tunnel"
echo "🌐 Aurora Town Endpoint: localhost:11435"
echo ""
echo "🧪 Test:"
echo "  curl http://localhost:11435/api/tags"
echo ""
echo "💡 Update gateway to route llama4:maverick to port 11435"

