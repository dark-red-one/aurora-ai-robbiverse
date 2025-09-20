#!/bin/bash
# Mac Vengeance Migration - Download from runpod-robbie
echo "🍎 MacBook Vengeance Migration Control"
echo "======================================="

# Create migration directory on Mac
cd ~/Desktop
mkdir -p vengeance-migration
cd vengeance-migration

echo "📥 Downloading Ubuntu 22.04 LTS ISO..."
curl -L -o ubuntu-22.04.3-desktop-amd64.iso "https://releases.ubuntu.com/22.04/ubuntu-22.04.3-desktop-amd64.iso"

echo "✅ Ubuntu ISO downloaded!"
echo ""
echo "🔥 NEXT STEPS:"
echo "1. Use Disk Utility to create bootable USB"
echo "2. Boot Vengeance from USB"  
echo "3. Install Ubuntu Linux"
echo "4. Install Cursor and reconnect to runpod-robbie"
echo ""
echo "🚀 Vengeance will be a Linux AI development beast!"
