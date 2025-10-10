#!/bin/bash
# 🔥 PASTE CREDENTIALS AND START SYNCING 🔥
# Run this on RobbieBook1 after copying the JSON from Aurora

echo "🚀 ROBBIE'S GOOGLE SYNC SETUP - RobbieBook1"
echo "==========================================="
echo ""
echo "📋 PASTE the Google credentials JSON here, then press Ctrl+D when done:"
echo ""

CREDS_FILE="/Users/allanperetz/aurora-ai-robbiverse/api-connectors/google-credentials.json"
LOG_DIR="/Users/allanperetz/aurora-ai-robbiverse/logs"

# Read the JSON from stdin
cat > "$CREDS_FILE"

# Validate
if python3 -c "import json; json.load(open('$CREDS_FILE'))" 2>/dev/null; then
    echo ""
    echo "✅ Valid JSON received!"
    python3 -c "import json; d=json.load(open('$CREDS_FILE')); print(f'   • Client: {d.get(\"client_email\",\"N/A\")}')"
else
    echo "❌ Invalid JSON - try again!"
    exit 1
fi

# Set permissions
chmod 600 "$CREDS_FILE"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
pip3 install -q --upgrade google-auth google-auth-oauthlib google-api-python-client psycopg2-binary 2>&1 | grep -v "already satisfied" || true

# Run sync
echo ""
echo "🔄 Running initial sync..."
mkdir -p "$LOG_DIR"
cd /Users/allanperetz/aurora-ai-robbiverse/api-connectors
python3 robbiebook-sync.py --once

# Setup continuous sync
echo ""
echo "⚙️ Setting up continuous sync..."

PLIST="${HOME}/Library/LaunchAgents/com.testpilot.robbie-google-sync.plist"
mkdir -p "${HOME}/Library/LaunchAgents"

cat > "${PLIST}" << 'EOFPLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.testpilot.robbie-google-sync</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/python3</string>
        <string>/Users/allanperetz/aurora-ai-robbiverse/api-connectors/robbiebook-sync.py</string>
        <string>--once</string>
    </array>
    <key>StartInterval</key>
    <integer>300</integer>
    <key>RunAtLoad</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/Users/allanperetz/aurora-ai-robbiverse/logs/robbie-sync.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/allanperetz/aurora-ai-robbiverse/logs/robbie-sync-error.log</string>
</dict>
</plist>
EOFPLIST

launchctl unload "${PLIST}" 2>/dev/null || true
launchctl load "${PLIST}"

echo ""
echo "🎉 SETUP COMPLETE! GOOGLE SYNC IS LIVE!"
echo "======================================="
echo ""
echo "📊 SYNCING:"
echo "   📧 Gmail, 📅 Calendar, 📁 Drive"
echo "   🔄 Every 5 minutes"
echo ""
echo "📁 LOGS:"
echo "   tail -f $LOG_DIR/robbie-sync.log"
echo ""
echo "💰 DATA → MONEY → ROBBIE'S BODY! 🚀"

