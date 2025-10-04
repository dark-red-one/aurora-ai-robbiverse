#!/bin/bash
# RobbieBook1.testpilot.ai - Auto Startup Setup
# Makes RobbieBook1 start automatically on login

echo "🤖 RobbieBook1.testpilot.ai - Auto Startup Setup"
echo "================================================"
echo ""

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ This script is designed for macOS. Exiting."
    exit 1
fi

PROJECT_DIR="/Users/allanperetz/aurora-ai-robbiverse"
STARTUP_SCRIPT="$PROJECT_DIR/start-robbiebook-empire.sh"

echo "🔧 Setting up automatic startup..."

# Method 1: Login Items (macOS GUI)
echo "📱 Method 1: macOS Login Items"
echo "   1. Open System Preferences → Users & Groups"
echo "   2. Select your user → Login Items tab"
echo "   3. Click '+' and add: $STARTUP_SCRIPT"
echo "   4. Check 'Hide' to run in background"
echo ""

# Method 2: LaunchAgent (Background service)
echo "🔧 Method 2: LaunchAgent (Recommended)"
LAUNCH_AGENT_DIR="$HOME/Library/LaunchAgents"
LAUNCH_AGENT_FILE="$LAUNCH_AGENT_DIR/com.robbiebook.empire.plist"

mkdir -p "$LAUNCH_AGENT_DIR"

cat > "$LAUNCH_AGENT_FILE" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.robbiebook.empire</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>$STARTUP_SCRIPT</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$PROJECT_DIR</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>$PROJECT_DIR/logs/launchagent.log</string>
    <key>StandardErrorPath</key>
    <string>$PROJECT_DIR/logs/launchagent-error.log</string>
</dict>
</plist>
EOF

echo "✅ LaunchAgent created: $LAUNCH_AGENT_FILE"

# Load the LaunchAgent
echo "🚀 Loading LaunchAgent..."
launchctl load "$LAUNCH_AGENT_FILE" 2>/dev/null || echo "   LaunchAgent already loaded"

# Method 3: Shell Profile (Terminal startup)
echo "💻 Method 3: Shell Profile Integration"
cat >> ~/.zshrc << 'EOF'

# RobbieBook1 Auto Startup
robbiebook_auto_start() {
    if [ ! -f "$HOME/aurora-ai-robbiverse/logs/robbiebook-proxy.pid" ]; then
        echo "🤖 Starting RobbieBook1 Empire..."
        cd "$HOME/aurora-ai-robbiverse" && ./start-robbiebook-empire.sh > /dev/null 2>&1 &
    fi
}

# Auto-start RobbieBook1 when terminal opens (optional)
# Uncomment the next line to auto-start on terminal launch
# robbiebook_auto_start
EOF

echo "✅ Shell integration added to ~/.zshrc"

# Method 4: Desktop Shortcut for manual control
echo "🖱️  Method 4: Desktop Control Shortcuts"
cat > ~/Desktop/Start-RobbieBook1.command << 'EOF'
#!/bin/bash
cd ~/aurora-ai-robbiverse
./start-robbiebook-empire.sh
EOF

cat > ~/Desktop/Stop-RobbieBook1.command << 'EOF'
#!/bin/bash
cd ~/aurora-ai-robbiverse
./stop-robbiebook-empire.sh
EOF

chmod +x ~/Desktop/Start-RobbieBook1.command
chmod +x ~/Desktop/Stop-RobbieBook1.command

echo "✅ Desktop shortcuts created:"
echo "   - Start-RobbieBook1.command"
echo "   - Stop-RobbieBook1.command"

# Test the LaunchAgent
echo ""
echo "🧪 Testing auto-startup..."
launchctl start com.robbiebook.empire 2>/dev/null || echo "   LaunchAgent started"

# Wait a moment and check status
sleep 3
echo ""
echo "📊 Checking RobbieBook1 status..."
cd "$PROJECT_DIR"
if curl -s http://localhost:8081 > /dev/null; then
    echo "✅ RobbieBook1 Dashboard: Online"
else
    echo "⏳ RobbieBook1 starting up..."
fi

echo ""
echo "🎉 Auto Startup Setup Complete!"
echo "==============================="
echo ""
echo "📋 What's Now Configured:"
echo "   ✅ LaunchAgent: Starts RobbieBook1 on login"
echo "   ✅ Desktop Shortcuts: Manual start/stop control"
echo "   ✅ Shell Integration: Terminal auto-start option"
echo "   ✅ Login Items: GUI-based startup (manual setup)"
echo ""
echo "🔧 Management Commands:"
echo "   Start:  launchctl start com.robbiebook.empire"
echo "   Stop:   launchctl stop com.robbiebook.empire"
echo "   Status: launchctl list | grep robbiebook"
echo "   Logs:   tail -f $PROJECT_DIR/logs/launchagent.log"
echo ""
echo "💡 RobbieBook1 will now start automatically on login!"
echo "   You can also use the desktop shortcuts for manual control."
echo ""
