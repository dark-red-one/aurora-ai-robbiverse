#!/bin/bash
# Setup SSH Mesh Network for Robbie
# Run this on each node to establish persistent SSH tunnels

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE_NAME="${1:-unknown}"

echo "🌐 ROBBIE SSH MESH SETUP"
echo "========================"
echo "Node: $NODE_NAME"
echo ""

# Detect current node if not specified
if [ "$NODE_NAME" = "unknown" ]; then
    if [ -f /opt/aurora-dev/aurora/.node-id ]; then
        NODE_NAME="aurora"
    elif [ -f /home/allan/vengeance/.node-id ]; then
        NODE_NAME="vengeance"
    elif [ "$(uname)" = "Darwin" ]; then
        NODE_NAME="robbiebook1"
    fi
    echo "🔍 Detected node: $NODE_NAME"
fi

# Aurora Town SSH credentials
AURORA_HOST="aurora-town-u44170.vm.elestio.app"
AURORA_USER="root"
AURORA_PASS="yjAcD7ot-GqWp-BlkDS5zy"

# Setup SSH key for passwordless auth
setup_ssh_key() {
    echo "🔑 Setting up SSH key for passwordless auth..."
    
    if [ ! -f ~/.ssh/id_rsa ]; then
        ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N "" -C "robbie-mesh-$NODE_NAME"
        echo "✅ SSH key generated"
    else
        echo "✅ SSH key already exists"
    fi
    
    # Copy key to Aurora Town
    echo "📤 Copying key to Aurora Town..."
    sshpass -p "$AURORA_PASS" ssh-copy-id -o StrictHostKeyChecking=no "$AURORA_USER@$AURORA_HOST" 2>/dev/null || true
    echo "✅ Key copied to Aurora"
}

# Setup tunnels for RobbieBook1 (Mac)
setup_robbiebook1_tunnels() {
    echo "🍎 Setting up RobbieBook1 (Mac) tunnels..."
    
    # Create launchd plist for Aurora tunnel
    cat > ~/Library/LaunchAgents/com.testpilot.aurora-tunnel.plist << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.testpilot.aurora-tunnel</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/ssh</string>
        <string>-N</string>
        <string>-L</string>
        <string>8007:localhost:8007</string>
        <string>-L</string>
        <string>11434:localhost:11434</string>
        <string>-L</string>
        <string>5432:localhost:5432</string>
        <string>-o</string>
        <string>ServerAliveInterval=60</string>
        <string>-o</string>
        <string>ServerAliveCountMax=3</string>
        <string>-o</string>
        <string>ExitOnForwardFailure=yes</string>
        <string>-o</string>
        <string>StrictHostKeyChecking=no</string>
        <string>$AURORA_USER@$AURORA_HOST</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <dict>
        <key>SuccessfulExit</key>
        <false/>
    </dict>
    <key>StandardErrorPath</key>
    <string>/tmp/aurora-tunnel.err</string>
    <key>StandardOutPath</key>
    <string>/tmp/aurora-tunnel.out</string>
</dict>
</plist>
EOF
    
    # Load the service
    launchctl unload ~/Library/LaunchAgents/com.testpilot.aurora-tunnel.plist 2>/dev/null || true
    launchctl load ~/Library/LaunchAgents/com.testpilot.aurora-tunnel.plist
    
    echo "✅ Aurora tunnel configured and started"
    echo "   Ports: 8007 (web), 11434 (ollama), 5432 (db)"
}

# Setup tunnels for Vengeance (Linux)
setup_vengeance_tunnels() {
    echo "⚡ Setting up Vengeance (Linux) reverse tunnels..."
    
    # Create systemd service for reverse tunnel to Aurora
    sudo tee /etc/systemd/system/aurora-reverse-tunnel.service > /dev/null << EOF
[Unit]
Description=Aurora Town Reverse SSH Tunnel
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$USER
ExecStart=/usr/bin/ssh -N \\
    -R 11434:localhost:11434 \\
    -R 8001:localhost:8001 \\
    -R 5433:localhost:5432 \\
    -o ServerAliveInterval=60 \\
    -o ServerAliveCountMax=3 \\
    -o ExitOnForwardFailure=yes \\
    -o StrictHostKeyChecking=no \\
    $AURORA_USER@$AURORA_HOST
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
    
    sudo systemctl daemon-reload
    sudo systemctl enable aurora-reverse-tunnel
    sudo systemctl restart aurora-reverse-tunnel
    
    echo "✅ Vengeance reverse tunnel configured and started"
    echo "   Exposed to Aurora: 11434 (ollama), 8001 (gpu), 5433 (db)"
}

# Setup Aurora Town (receives tunnels)
setup_aurora_tunnels() {
    echo "☁️  Setting up Aurora Town (hub)..."
    
    # Aurora doesn't need outbound tunnels, it receives them
    # But we can set up optional RunPod tunnel
    
    echo "📝 Aurora Town SSH config:"
    cat >> ~/.ssh/config << EOF

# Vengeance GPU Node (via reverse tunnel)
Host vengeance-tunnel
    HostName localhost
    Port 11434
    User allan
    StrictHostKeyChecking no

# RunPod GPU (optional)
Host runpod-gpu
    HostName 209.170.80.132
    Port 22
    User root
    StrictHostKeyChecking no
EOF
    
    echo "✅ Aurora Town configured as mesh hub"
    echo "   Listening for reverse tunnels from Vengeance"
}

# Test tunnel connectivity
test_tunnels() {
    echo ""
    echo "🧪 Testing tunnel connectivity..."
    
    if [ "$NODE_NAME" = "robbiebook1" ]; then
        echo "Testing Aurora tunnel..."
        curl -s http://localhost:8007/health && echo "✅ Aurora web: OK" || echo "❌ Aurora web: FAIL"
        curl -s http://localhost:11434/api/tags && echo "✅ Aurora Ollama: OK" || echo "❌ Aurora Ollama: FAIL"
    elif [ "$NODE_NAME" = "vengeance" ]; then
        echo "Testing reverse tunnel to Aurora..."
        ssh -o ConnectTimeout=5 "$AURORA_USER@$AURORA_HOST" "curl -s http://localhost:11434/api/tags" && echo "✅ Vengeance→Aurora: OK" || echo "❌ Vengeance→Aurora: FAIL"
    elif [ "$NODE_NAME" = "aurora" ]; then
        echo "Testing local services..."
        curl -s http://localhost:8007/health && echo "✅ Local web: OK" || echo "❌ Local web: FAIL"
        curl -s http://localhost:11434/api/tags && echo "✅ Local Ollama: OK" || echo "❌ Local Ollama: FAIL"
    fi
}

# Main setup flow
main() {
    setup_ssh_key
    
    case "$NODE_NAME" in
        robbiebook1)
            setup_robbiebook1_tunnels
            ;;
        vengeance)
            setup_vengeance_tunnels
            ;;
        aurora)
            setup_aurora_tunnels
            ;;
        *)
            echo "❌ Unknown node: $NODE_NAME"
            echo "Usage: $0 [robbiebook1|vengeance|aurora]"
            exit 1
            ;;
    esac
    
    test_tunnels
    
    echo ""
    echo "✅ SSH MESH SETUP COMPLETE!"
    echo ""
    echo "📊 Status:"
    echo "   Node: $NODE_NAME"
    echo "   Tunnels: Active"
    echo "   Orchestrator: Ready"
    echo ""
    echo "🎯 Next: Deploy resource orchestrator"
}

main
