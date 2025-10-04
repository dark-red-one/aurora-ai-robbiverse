#!/bin/bash
# CURSOR LINUX INSTALLATION - Reconnect to Aurora Cloud Workspace
# Install Cursor on fresh Linux system

echo "💻 INSTALLING CURSOR ON LINUX"
echo "============================="

# Download and install Cursor for Linux
echo "📥 Downloading Cursor for Linux..."
cd /tmp
wget -O cursor.AppImage "https://downloader.cursor.sh/linux/appImage/x64"

# Make it executable
chmod +x cursor.AppImage

# Create applications directory if it doesn't exist
mkdir -p ~/.local/share/applications
mkdir -p ~/.local/bin

# Move Cursor to local bin
mv cursor.AppImage ~/.local/bin/cursor

# Create desktop entry
cat > ~/.local/share/applications/cursor.desktop << 'EOF'
[Desktop Entry]
Name=Cursor
Comment=AI-powered code editor
Exec=/home/$USER/.local/bin/cursor %U
Terminal=false
Type=Application
Icon=cursor
Categories=Development;IDE;
StartupWMClass=cursor
MimeType=text/plain;inode/directory;
EOF

# Make desktop entry executable
chmod +x ~/.local/share/applications/cursor.desktop

# Add to PATH
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

echo ""
echo "✅ CURSOR INSTALLED ON LINUX!"
echo "=============================="
echo "🚀 Launch with: cursor"
echo "🔗 Reconnect to Aurora: SSH to runpod-robbie"
echo "📁 Workspace: /workspace/aurora"
echo ""
echo "🌐 Aurora AI Empire continues in the cloud!"
echo "🔥 Vengeance is now a Linux development beast!"
