#!/bin/bash
# Automated Chrome proxy configuration

echo "🤖 Automated Chrome Proxy Configuration"
echo "========================================"

# Create Chrome preferences directory
CHROME_PREFS_DIR="$HOME/Library/Application Support/Google/Chrome/Default"
mkdir -p "$CHROME_PREFS_DIR"

# Backup existing preferences
if [ -f "$CHROME_PREFS_DIR/Preferences" ]; then
    cp "$CHROME_PREFS_DIR/Preferences" "$CHROME_PREFS_DIR/Preferences.backup.$(date +%s)"
    echo "✅ Backed up existing Chrome preferences"
fi

# Create proxy configuration
cat > "$CHROME_PREFS_DIR/Preferences" << 'CHROME_PREFS'
{
  "profile": {
    "default_content_setting_values": {
      "cookies": 1
    }
  },
  "proxy": {
    "mode": "fixed_servers",
    "server": "127.0.0.1:8080"
  },
  "robbiebook_proxy": {
    "enabled": true,
    "server": "127.0.0.1:8080",
    "bypass_list": "localhost,127.0.0.1",
    "setup_date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  }
}
CHROME_PREFS

echo "✅ Chrome proxy preferences configured"
echo "   Proxy: 127.0.0.1:8080"
echo "   Bypass: localhost,127.0.0.1"
