#!/bin/bash
# Setup automated SSH tunnel service to Aurora Town
# Runs on RobbieBook1 or other client machines

set -e

echo "🔗 Setting up Aurora Town SSH Tunnel Service"
echo "============================================="

# Check if SSH key exists
if [ ! -f "$HOME/.ssh/aurora_town_ed25519" ]; then
    echo "❌ SSH key not found: $HOME/.ssh/aurora_town_ed25519"
    echo "   Please ensure the key is installed first"
    exit 1
fi

echo "✅ SSH key found"

# Detect OS and set systemd path
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS uses launchd instead of systemd
    echo "📱 Detected macOS - Creating LaunchAgent..."
    
    PLIST_FILE="$HOME/Library/LaunchAgents/com.aurora.tunnel.plist"
    
    cat > $PLIST_FILE << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.aurora.tunnel</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/ssh</string>
        <string>-N</string>
        <string>-o</string>
        <string>ServerAliveInterval=60</string>
        <string>-o</string>
        <string>ServerAliveCountMax=3</string>
        <string>-o</string>
        <string>StrictHostKeyChecking=no</string>
        <string>-i</string>
        <string>HOME_PLACEHOLDER/.ssh/aurora_town_ed25519</string>
        <string>-L</string>
        <string>11435:localhost:11434</string>
        <string>-L</string>
        <string>8006:localhost:8000</string>
        <string>-L</string>
        <string>5433:localhost:5432</string>
        <string>-L</string>
        <string>6380:localhost:6379</string>
        <string>-L</string>
        <string>3001:localhost:3000</string>
        <string>-L</string>
        <string>9091:localhost:9090</string>
        <string>root@8.17.147.158</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/aurora-tunnel.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/aurora-tunnel-error.log</string>
</dict>
</plist>
EOF
    
    # Replace HOME placeholder
    sed -i '' "s|HOME_PLACEHOLDER|$HOME|g" $PLIST_FILE
    
    # Load the service
    launchctl unload $PLIST_FILE 2>/dev/null || true
    launchctl load $PLIST_FILE
    
    echo "✅ LaunchAgent installed and loaded"
    echo "📍 Service file: $PLIST_FILE"
    echo ""
    echo "📋 To check status:"
    echo "   launchctl list | grep aurora.tunnel"
    echo ""
    echo "📋 To stop:"
    echo "   launchctl unload $PLIST_FILE"
    echo ""
    echo "📋 To start:"
    echo "   launchctl load $PLIST_FILE"
    
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux uses systemd
    echo "🐧 Detected Linux - Creating systemd service..."
    
    # Check if running as root or can sudo
    if [ "$EUID" -ne 0 ]; then
        if ! command -v sudo &> /dev/null; then
            echo "❌ Not running as root and sudo not available"
            exit 1
        fi
        SUDO="sudo"
    else
        SUDO=""
    fi
    
    # Copy service file
    SERVICE_FILE="/etc/systemd/system/aurora-tunnel.service"
    SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
    
    $SUDO cp "$SCRIPT_DIR/aurora-tunnel.service" $SERVICE_FILE
    
    # Update user in service file
    $SUDO sed -i "s|User=allan|User=$USER|g" $SERVICE_FILE
    $SUDO sed -i "s|/home/allan|$HOME|g" $SERVICE_FILE
    
    # Reload systemd
    $SUDO systemctl daemon-reload
    
    # Enable and start service
    $SUDO systemctl enable aurora-tunnel
    $SUDO systemctl start aurora-tunnel
    
    echo "✅ Systemd service installed and started"
    echo "📍 Service file: $SERVICE_FILE"
    echo ""
    echo "📋 To check status:"
    echo "   sudo systemctl status aurora-tunnel"
    echo ""
    echo "📋 To stop:"
    echo "   sudo systemctl stop aurora-tunnel"
    echo ""
    echo "📋 To restart:"
    echo "   sudo systemctl restart aurora-tunnel"
    echo ""
    echo "📋 View logs:"
    echo "   sudo journalctl -u aurora-tunnel -f"
    
else
    echo "❌ Unsupported operating system: $OSTYPE"
    exit 1
fi

echo ""
echo "🧪 Testing tunnel connections..."
sleep 5

# Test Ollama
if curl -f http://localhost:11435/api/tags &> /dev/null; then
    echo "✅ Ollama tunnel working (port 11435)"
else
    echo "⚠️  Ollama tunnel not responding yet (may need a moment)"
fi

# Test AI Router
if curl -f http://localhost:8006/health &> /dev/null; then
    echo "✅ AI Router tunnel working (port 8006)"
else
    echo "⚠️  AI Router tunnel not responding yet"
fi

echo ""
echo "✅ SSH tunnel service setup complete!"
echo ""
echo "📋 Port Forwarding:"
echo "   localhost:11435 → Aurora Ollama (11434)"
echo "   localhost:8006  → Aurora AI Router (8000)"
echo "   localhost:5433  → Aurora PostgreSQL (5432)"
echo "   localhost:6380  → Aurora Redis (6379)"
echo "   localhost:3001  → Aurora Grafana (3000)"
echo "   localhost:9091  → Aurora Prometheus (9090)"

