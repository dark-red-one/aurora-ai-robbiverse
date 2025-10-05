#!/bin/bash
# Setup Scalable SSH Mesh - No Port Juggling!

echo "🌐 SCALABLE SSH MESH SETUP"
echo "=========================="
echo ""

# Step 1: Generate mesh key if doesn't exist
if [ ! -f ~/.ssh/robbie_mesh ]; then
    echo "🔑 Generating SSH mesh key..."
    ssh-keygen -t ed25519 -f ~/.ssh/robbie_mesh -N ""
    echo "✅ Key generated"
else
    echo "✅ SSH mesh key already exists"
fi

echo ""

# Step 2: Define all nodes
echo "📋 Configuring mesh nodes..."

# Create/update SSH config
cat > ~/.ssh/config.robbie_mesh << 'EOF'
# Robbie Mesh Configuration
# All nodes accessible via simple hostnames

Host vengeance
    HostName 192.168.1.246
    User allan
    IdentityFile ~/.ssh/robbie_mesh
    ServerAliveInterval 60
    ServerAliveCountMax 3
    StrictHostKeyChecking no

Host aurora
    HostName aurora-town-u44170.vm.elestio.app
    User root
    IdentityFile ~/.ssh/robbie_mesh
    ServerAliveInterval 60
    ServerAliveCountMax 3
    StrictHostKeyChecking no

Host runpod
    HostName 209.170.80.132
    Port 13323
    User root
    IdentityFile ~/.ssh/id_ed25519
    ServerAliveInterval 60
    ServerAliveCountMax 3
    StrictHostKeyChecking no
EOF

# Merge with existing config
if [ -f ~/.ssh/config ]; then
    # Remove old robbie mesh config if exists
    sed -i '/# Robbie Mesh Configuration/,/^$/d' ~/.ssh/config 2>/dev/null || true
fi

cat ~/.ssh/config.robbie_mesh >> ~/.ssh/config
rm ~/.ssh/config.robbie_mesh

echo "✅ SSH config updated"
echo ""

# Step 3: Copy keys to all nodes
echo "🔐 Distributing SSH keys..."

echo "Copying to Aurora..."
ssh-copy-id -i ~/.ssh/robbie_mesh -o StrictHostKeyChecking=no root@aurora-town-u44170.vm.elestio.app 2>/dev/null || echo "  (key may already exist)"

echo "Copying to RunPod..."
ssh-copy-id -i ~/.ssh/id_ed25519 -o StrictHostKeyChecking=no -p 13323 root@209.170.80.132 2>/dev/null || echo "  (key may already exist)"

echo "✅ Keys distributed"
echo ""

# Step 4: Test connectivity
echo "🧪 Testing mesh connectivity..."

test_node() {
    local name=$1
    local host=$2
    
    if ssh -o ConnectTimeout=5 $host "curl -s http://localhost:11434/api/tags | jq -r '.models[0].name'" 2>/dev/null; then
        echo "  ✅ $name: ONLINE"
        return 0
    else
        echo "  ❌ $name: OFFLINE"
        return 1
    fi
}

test_node "Vengeance" "vengeance"
test_node "Aurora" "aurora"
test_node "RunPod" "runpod"

echo ""

# Step 5: Show usage
echo "═══════════════════════════════════════"
echo "📊 MESH CONFIGURATION COMPLETE"
echo "═══════════════════════════════════════"
echo ""
echo "Usage examples:"
echo ""
echo "# Call Vengeance Ollama:"
echo "  ssh vengeance 'curl -s http://localhost:11434/api/generate -d \"{...}\"'"
echo ""
echo "# Call Aurora Ollama:"
echo "  ssh aurora 'curl -s http://localhost:11434/api/generate -d \"{...}\"'"
echo ""
echo "# Call RunPod Ollama:"
echo "  ssh runpod 'curl -s http://localhost:11434/api/generate -d \"{...}\"'"
echo ""
echo "✅ All nodes use standard port 11434"
echo "✅ No port forwarding needed"
echo "✅ SSH handles all routing"
echo ""
echo "🎯 Next: Update orchestrator to use SSH calls"
echo "═══════════════════════════════════════"
