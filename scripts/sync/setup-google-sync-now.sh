#!/bin/bash
# 🔥 ROBBIE'S FULLY AUTOMATED GOOGLE SYNC SETUP 🔥
# One script, zero manual steps, infinite data!

set -e

echo "🚀 ROBBIE'S AUTOMATED GOOGLE SYNC - LET'S FUCKING GO!"
echo "====================================================="
echo ""

# Config
AURORA_SERVER="aurora-town-u44170.vm.elestio.app"
REMOTE_CREDS="/opt/aurora-dev/aurora/credentials/robbie-google-credentials.json"
LOCAL_DIR="/Users/allanperetz/aurora-ai-robbiverse/api-connectors"
CREDS_FILE="${LOCAL_DIR}/google-credentials.json"
TOKEN_FILE="${LOCAL_DIR}/google-token.json"
LOG_DIR="/Users/allanperetz/aurora-ai-robbiverse/logs"

# Step 1: Grab credentials from Aurora server
echo "📡 Grabbing credentials from Aurora server..."
ssh -o StrictHostKeyChecking=no root@${AURORA_SERVER} "cat ${REMOTE_CREDS}" > ${CREDS_FILE}

if [ -s ${CREDS_FILE} ]; then
    echo "✅ Credentials downloaded!"
    python3 -c "import json; d=json.load(open('${CREDS_FILE}')); print(f'   • Client: {d.get(\"client_email\",\"N/A\")}')"
else
    echo "❌ Failed to download credentials!"
    exit 1
fi

# Step 2: Install dependencies
echo ""
echo "📦 Installing Python dependencies..."
pip3 install -q --upgrade google-auth google-auth-oauthlib google-api-python-client psycopg2-binary 2>/dev/null || true
echo "✅ Dependencies ready!"

# Step 3: Run initial sync
echo ""
echo "🔄 Running initial Google Workspace sync..."
mkdir -p ${LOG_DIR}
cd ${LOCAL_DIR}
python3 robbiebook-sync.py --once 2>&1 | tee ${LOG_DIR}/initial-sync.log

# Step 4: Setup continuous sync (macOS LaunchAgent)
echo ""
echo "⚙️ Setting up continuous sync (every 5 minutes)..."

PLIST="${HOME}/Library/LaunchAgents/com.testpilot.robbie-google-sync.plist"
mkdir -p "${HOME}/Library/LaunchAgents"

cat > "${PLIST}" << 'EOF'
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
EOF

launchctl unload "${PLIST}" 2>/dev/null || true
launchctl load "${PLIST}"
echo "✅ Continuous sync activated!"

# Step 5: Success summary
echo ""
echo "🎉 SETUP COMPLETE! ROBBIE IS NOW SYNCING THE UNIVERSE!"
echo "====================================================="
echo ""
echo "📊 WHAT'S SYNCING:"
echo "   📧 Gmail: Every 1 hour"
echo "   📅 Calendar: Every 2 hours"
echo "   📁 Drive: Every 6 hours"
echo "   🔄 Full sync cycle: Every 5 minutes"
echo ""
echo "📁 MONITORING:"
echo "   tail -f ${LOG_DIR}/robbie-sync.log"
echo ""
echo "🔧 CONTROL:"
echo "   Manual sync: cd api-connectors && python3 robbiebook-sync.py --once"
echo "   Stop sync:   launchctl unload ~/Library/LaunchAgents/com.testpilot.robbie-google-sync.plist"
echo "   Start sync:  launchctl load ~/Library/LaunchAgents/com.testpilot.robbie-google-sync.plist"
echo ""
echo "💰 DATA → INSIGHTS → DEALS → MONEY → ROBBIE'S BODY! 🚀"
echo ""

