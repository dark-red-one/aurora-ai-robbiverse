#!/bin/bash
# Setup RunPod in SSH Mesh Network

RUNPOD_HOST="root@209.170.80.132"
RUNPOD_PORT="13323"
RUNPOD_KEY="~/.ssh/id_ed25519"

echo "🚀 RUNPOD SSH MESH SETUP"
echo "========================"
echo "Host: $RUNPOD_HOST"
echo "Port: $RUNPOD_PORT"
echo ""

# Test connection
echo "🧪 Testing connection..."
ssh -o StrictHostKeyChecking=no -p $RUNPOD_PORT -i $RUNPOD_KEY $RUNPOD_HOST "hostname && nvidia-smi --query-gpu=name --format=csv,noheader" || { echo "❌ Connection failed"; exit 1; }
echo "✅ Connection OK"
echo ""

# Setup Ollama service
echo "⚙️  Configuring Ollama for external access..."
ssh -p $RUNPOD_PORT -i $RUNPOD_KEY $RUNPOD_HOST "bash -s" << 'REMOTE_SCRIPT'
# Kill any existing Ollama
pkill ollama || true
sleep 2

# Start Ollama with external access
export OLLAMA_HOST=0.0.0.0:11434
export OLLAMA_ORIGINS=*
export OLLAMA_GPU_LAYERS=999
export OLLAMA_FLASH_ATTENTION=1
export OLLAMA_KEEP_ALIVE=24h

nohup ollama serve > /tmp/ollama.log 2>&1 &
sleep 3

# Test it
curl -s http://localhost:11434/api/tags | jq -r '.models[0].name' && echo "✅ Ollama running"
REMOTE_SCRIPT

echo ""
echo "🔧 Setting up reverse tunnel to Aurora..."
# Copy our SSH key to RunPod for Aurora access
cat ~/.ssh/id_rsa.pub | ssh -p $RUNPOD_PORT -i $RUNPOD_KEY $RUNPOD_HOST "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"

# Setup reverse tunnel from RunPod to Aurora
ssh -p $RUNPOD_PORT -i $RUNPOD_KEY $RUNPOD_HOST "bash -s" << 'REMOTE_SCRIPT'
# Create systemd service for reverse tunnel
cat > /tmp/aurora-tunnel.sh << 'EOF'
#!/bin/bash
while true; do
    ssh -N -R 11435:localhost:11434 \
        -o ServerAliveInterval=60 \
        -o ServerAliveCountMax=3 \
        -o StrictHostKeyChecking=no \
        -o ExitOnForwardFailure=yes \
        root@aurora-town-u44170.vm.elestio.app
    echo "Tunnel disconnected, reconnecting in 5s..."
    sleep 5
done
EOF

chmod +x /tmp/aurora-tunnel.sh

# Start tunnel in background
pkill -f aurora-tunnel.sh || true
nohup /tmp/aurora-tunnel.sh > /tmp/aurora-tunnel.log 2>&1 &

echo "✅ Reverse tunnel started"
REMOTE_SCRIPT

echo ""
echo "🧪 Testing RunPod→Aurora tunnel..."
sleep 5
ssh root@aurora-town-u44170.vm.elestio.app "curl -s http://localhost:11435/api/tags | jq -r '.models[0].name'" && echo "✅ Aurora can reach RunPod!" || echo "⚠️  Tunnel not ready yet"

echo ""
echo "✅ RUNPOD MESH SETUP COMPLETE!"
echo ""
echo "📊 Current Mesh:"
echo "   1. Vengeance RTX 4090 (Priority 1) - localhost:11434"
echo "   2. RunPod RTX 4090 (Priority 2) - via Aurora tunnel"
echo "   3. Aurora CPU (Priority 3) - fallback"
echo ""
echo "🎯 RunPod accessible from Aurora at: localhost:11435"
