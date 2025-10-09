#!/bin/bash
echo "🧹 Safe Repo Cleanup - Protecting All Gems!"
echo "=========================================="

# ONLY remove installer files at root level
echo "Removing installer files from root..."
rm -f postgresql.dmg openvpn-installer.pkg tunnelblick.dmg openvpn-2.6.8.tar.gz
rm -rf openvpn-2.6.8/
rm -f ~

# Remove logs directory (regeneratable)
if [ -d "logs" ]; then
    echo "Removing logs directory..."
    rm -rf logs/
fi

# Update .gitignore
echo ""
echo "Updating .gitignore..."
cat >> .gitignore << 'IGNORE'

# Installer files (download locally, don't commit)
*.dmg
*.pkg
openvpn-*.tar.gz

# Logs
logs/

# Python virtual environments
gigamind/venv/
venv/
.venv/

# Temporary files
*~
.DS_Store
IGNORE

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "PROTECTED:"
echo "  ✅ deployment/aurora-standard-node/ (all files)"
echo "  ✅ aurora-client.ovpn"
echo "  ✅ aurora-code-server.py"
echo "  ✅ aurora-web-tunnel.html"
echo "  ✅ backend/"
echo "  ✅ database/"
echo "  ✅ All code and configs"
echo ""
echo "REMOVED:"
echo "  ❌ Root-level installer files only"
echo "  ❌ logs/ directory"
