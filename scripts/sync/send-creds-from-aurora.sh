#!/bin/bash
# 🔥 RUN THIS ON AURORA SERVER AS ROOT 🔥
# Sends Google credentials to RobbieBook1

echo "🚀 ROBBIE'S CREDENTIAL TRANSFER - Aurora → RobbieBook1"
echo "======================================================"
echo ""

# Find the credentials
CREDS_FILE="/opt/aurora-dev/aurora/credentials/robbie-google-credentials.json"

if [ ! -f "$CREDS_FILE" ]; then
    echo "❌ Credentials not found at: $CREDS_FILE"
    echo "Searching for it..."
    find /opt -name "*google-credentials*.json" -o -name "robbie-google*.json" 2>/dev/null
    exit 1
fi

echo "✅ Found credentials file!"
echo ""
echo "📋 FILE CONTENTS (copy this entire JSON):"
echo "=========================================="
cat "$CREDS_FILE"
echo ""
echo "=========================================="
echo ""
echo "📝 NOW DO THIS ON ROBBIEBOOK1:"
echo ""
echo "cat > /Users/allanperetz/aurora-ai-robbiverse/api-connectors/google-credentials.json << 'EOFCREDS'"
cat "$CREDS_FILE"
echo "EOFCREDS"
echo ""
echo "chmod 600 /Users/allanperetz/aurora-ai-robbiverse/api-connectors/google-credentials.json"
echo "cd /Users/allanperetz/aurora-ai-robbiverse/api-connectors"
echo "python3 robbiebook-sync.py --once"
echo ""
echo "🎉 Done! Now run those commands on RobbieBook1!"

