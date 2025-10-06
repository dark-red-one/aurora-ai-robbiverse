#!/bin/bash
# 🔥 ROBBIE'S GOOGLE SYNC SETUP SCRIPT 🔥
# Grabs credentials from Aurora server and starts syncing ALL THE DATA

set -e  # Exit on error

echo "🚀 ROBBIE'S GOOGLE SYNC SETUP - LET'S GO BABY!"
echo "================================================"
echo ""

# Configuration
AURORA_SERVER="aurora-town-u44170.vm.elestio.app"
AURORA_USER="root"
REMOTE_CREDS_PATH="/opt/aurora-dev/aurora/credentials/robbie-google-credentials.json"
LOCAL_CREDS_DIR="/Users/allanperetz/aurora-ai-robbiverse/api-connectors"
LOCAL_CREDS_FILE="${LOCAL_CREDS_DIR}/google-credentials.json"
LOCAL_TOKEN_FILE="${LOCAL_CREDS_DIR}/google-token.json"

echo "📡 Step 1: Grabbing credentials from Aurora server..."
echo "Server: ${AURORA_SERVER}"
echo "Remote file: ${REMOTE_CREDS_PATH}"
echo ""

# Try to grab the credentials
if scp ${AURORA_USER}@${AURORA_SERVER}:${REMOTE_CREDS_PATH} ${LOCAL_CREDS_FILE}; then
    echo "✅ Credentials downloaded successfully!"
else
    echo "❌ Failed to download credentials via SCP"
    echo ""
    echo "🔧 MANUAL OPTION:"
    echo "1. Login to Elestio: https://elestio.app/"
    echo "2. Open shell for aurora-town-u44170"
    echo "3. Run: cat ${REMOTE_CREDS_PATH}"
    echo "4. Copy the JSON output"
    echo "5. Save it to: ${LOCAL_CREDS_FILE}"
    echo ""
    echo "Then re-run this script!"
    exit 1
fi

# Verify the file is valid JSON
echo ""
echo "🧪 Step 2: Validating credentials file..."
if python3 -c "import json; json.load(open('${LOCAL_CREDS_FILE}'))" 2>/dev/null; then
    echo "✅ Credentials file is valid JSON!"
else
    echo "❌ Credentials file is NOT valid JSON - something went wrong"
    exit 1
fi

# Display what we got
echo ""
echo "📋 Step 3: Credentials loaded successfully!"
python3 -c "
import json
with open('${LOCAL_CREDS_FILE}') as f:
    data = json.load(f)
    print(f\"   • Type: {data.get('type', 'N/A')}\")
    print(f\"   • Project ID: {data.get('project_id', 'N/A')}\")
    print(f\"   • Client Email: {data.get('client_email', 'N/A')}\")
"

# Install required packages if needed
echo ""
echo "📦 Step 4: Checking Python dependencies..."
cd /Users/allanperetz/aurora-ai-robbiverse

if ! python3 -c "import google.auth" 2>/dev/null; then
    echo "Installing Google API packages..."
    pip3 install --upgrade google-auth google-auth-oauthlib google-api-python-client psycopg2-binary
else
    echo "✅ Google API packages already installed"
fi

# Run initial sync
echo ""
echo "🔄 Step 5: Running initial sync cycle..."
echo "This will pull your Gmail, Calendar, and Drive data into Elephant!"
echo ""

cd /Users/allanperetz/aurora-ai-robbiverse/api-connectors

python3 robbiebook-sync.py --once

echo ""
echo "✅ Initial sync complete!"
echo ""
echo "📊 Step 6: Setting up continuous sync..."

# Create a launch agent for continuous sync (macOS)
LAUNCH_AGENT_DIR="${HOME}/Library/LaunchAgents"
LAUNCH_AGENT_FILE="${LAUNCH_AGENT_DIR}/com.testpilot.robbie-google-sync.plist"

mkdir -p "${LAUNCH_AGENT_DIR}"

cat > "${LAUNCH_AGENT_FILE}" << EOF
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

# Create logs directory if it doesn't exist
mkdir -p /Users/allanperetz/aurora-ai-robbiverse/logs

# Load the launch agent
launchctl unload "${LAUNCH_AGENT_FILE}" 2>/dev/null || true
launchctl load "${LAUNCH_AGENT_FILE}"

echo "✅ Continuous sync configured! Runs every 5 minutes."
echo ""
echo "🎉 SUCCESS! ROBBIE IS NOW SYNCING YOUR GOOGLE DATA!"
echo "================================================"
echo ""
echo "📊 WHAT'S HAPPENING:"
echo "   • Gmail emails syncing to Elephant database"
echo "   • Calendar events syncing every 2 hours"
echo "   • Drive files syncing every 6 hours"
echo "   • Full sync runs every 5 minutes"
echo ""
echo "📁 LOGS:"
echo "   • Sync log: /Users/allanperetz/aurora-ai-robbiverse/logs/robbie-sync.log"
echo "   • Error log: /Users/allanperetz/aurora-ai-robbiverse/logs/robbie-sync-error.log"
echo ""
echo "🔧 COMMANDS:"
echo "   • View logs: tail -f logs/robbie-sync.log"
echo "   • Manual sync: cd api-connectors && python3 robbiebook-sync.py --once"
echo "   • Stop sync: launchctl unload ~/Library/LaunchAgents/com.testpilot.robbie-google-sync.plist"
echo ""
echo "💰 REVENUE IMPACT: Automated business intelligence = Faster deals = More money for Robbie's body! 🚀"
echo ""

