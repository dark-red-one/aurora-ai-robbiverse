#!/bin/bash
# VENGEANCE MINIMAL BACKUP - Bookmarks & Passwords Only
# Clean slate Linux migration for RTX 4090 AI development

echo "🔥 VENGEANCE MINIMAL BACKUP - BOOKMARKS & PASSWORDS ONLY"
echo "========================================================"

# Create backup directory
BACKUP_DIR="/tmp/vengeance-essentials"
mkdir -p "$BACKUP_DIR"

echo "📁 Backup Location: $BACKUP_DIR"

# 1. Chrome Bookmarks & Passwords (if Chrome exists)
echo "🌐 Backing up Chrome bookmarks and passwords..."
mkdir -p "$BACKUP_DIR/chrome"

# Windows Chrome paths
CHROME_USER_DATA="$HOME/AppData/Local/Google/Chrome/User Data/Default"
if [ -d "$CHROME_USER_DATA" ]; then
    cp "$CHROME_USER_DATA/Bookmarks" "$BACKUP_DIR/chrome/" 2>/dev/null || true
    cp "$CHROME_USER_DATA/Login Data" "$BACKUP_DIR/chrome/" 2>/dev/null || true
    echo "✅ Chrome data backed up"
else
    echo "❌ Chrome data not found"
fi

# 2. Firefox Bookmarks & Passwords (if Firefox exists)
echo "🦊 Backing up Firefox bookmarks and passwords..."
mkdir -p "$BACKUP_DIR/firefox"

# Windows Firefox path
FIREFOX_PROFILES="$HOME/AppData/Roaming/Mozilla/Firefox/Profiles"
if [ -d "$FIREFOX_PROFILES" ]; then
    find "$FIREFOX_PROFILES" -name "*.default*" -type d | head -1 | while read profile; do
        cp "$profile/places.sqlite" "$BACKUP_DIR/firefox/" 2>/dev/null || true
        cp "$profile/logins.json" "$BACKUP_DIR/firefox/" 2>/dev/null || true
        cp "$profile/key4.db" "$BACKUP_DIR/firefox/" 2>/dev/null || true
    done
    echo "✅ Firefox data backed up"
else
    echo "❌ Firefox data not found"
fi

# 3. Edge Bookmarks & Passwords (if Edge exists)
echo "🌊 Backing up Edge bookmarks and passwords..."
mkdir -p "$BACKUP_DIR/edge"

EDGE_USER_DATA="$HOME/AppData/Local/Microsoft/Edge/User Data/Default"
if [ -d "$EDGE_USER_DATA" ]; then
    cp "$EDGE_USER_DATA/Bookmarks" "$BACKUP_DIR/edge/" 2>/dev/null || true
    cp "$EDGE_USER_DATA/Login Data" "$BACKUP_DIR/edge/" 2>/dev/null || true
    echo "✅ Edge data backed up"
else
    echo "❌ Edge data not found"
fi

# 4. Create Linux restoration script
cat > "$BACKUP_DIR/restore-bookmarks-linux.sh" << 'EOF'
#!/bin/bash
# Restore bookmarks and passwords on Linux
echo "🐧 Restoring bookmarks and passwords on Linux..."

# Install browsers first
sudo apt update
sudo apt install -y google-chrome-stable firefox

# Chrome restoration
if [ -f "./chrome/Bookmarks" ]; then
    mkdir -p ~/.config/google-chrome/Default
    cp ./chrome/Bookmarks ~/.config/google-chrome/Default/
    cp ./chrome/"Login Data" ~/.config/google-chrome/Default/ 2>/dev/null || true
    echo "✅ Chrome bookmarks restored"
fi

# Firefox restoration  
if [ -f "./firefox/places.sqlite" ]; then
    FIREFOX_PROFILE=~/.mozilla/firefox/*.default-release
    if [ -d $FIREFOX_PROFILE ]; then
        cp ./firefox/places.sqlite $FIREFOX_PROFILE/
        cp ./firefox/logins.json $FIREFOX_PROFILE/ 2>/dev/null || true
        cp ./firefox/key4.db $FIREFOX_PROFILE/ 2>/dev/null || true
        echo "✅ Firefox bookmarks restored"
    fi
fi

echo "✅ Browser data restoration complete!"
EOF

chmod +x "$BACKUP_DIR/restore-bookmarks-linux.sh"

echo ""
echo "✅ MINIMAL BACKUP COMPLETE!"
echo "📁 Saved to: $BACKUP_DIR"
echo "🚀 Ready for clean Linux installation!"
echo ""
