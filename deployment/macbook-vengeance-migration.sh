#!/bin/bash
# MACBOOK CONTROL HUB - Vengeance Linux Migration Orchestrator
# Use MacBook to remotely manage Vengeance Windows → Linux migration

echo "🍎 MACBOOK VENGEANCE MIGRATION CONTROL HUB"
echo "=========================================="

# Create local migration directory
MIGRATION_DIR="$HOME/vengeance-migration"
mkdir -p "$MIGRATION_DIR"
cd "$MIGRATION_DIR"

echo "📁 Migration Control Directory: $MIGRATION_DIR"

# 1. Clone Aurora repository (since MacBook is already authenticated)
echo "📥 Cloning Aurora AI RobbieVerse repository..."
if [ ! -d "aurora-ai-robbiverse" ]; then
    git clone https://github.com/dark-red-one/aurora-ai-robbiverse.git
    cd aurora-ai-robbiverse
else
    cd aurora-ai-robbiverse
    git pull origin main
fi

# Copy migration scripts
cp vengeance-migration-backup.sh ../
cp vengeance-linux-setup.sh ../
cp cursor-linux-install.sh ../
cd ..

# 2. Download Ubuntu 22.04 LTS ISO (if not already downloaded)
echo "💿 Checking for Ubuntu ISO..."
UBUNTU_ISO="ubuntu-22.04.3-desktop-amd64.iso"
if [ ! -f "$UBUNTU_ISO" ]; then
    echo "📥 Downloading Ubuntu 22.04 LTS..."
    curl -o "$UBUNTU_ISO" "https://releases.ubuntu.com/22.04/ubuntu-22.04.3-desktop-amd64.iso"
else
    echo "✅ Ubuntu ISO already exists"
fi

# 3. Create bootable USB (macOS specific)
create_bootable_usb() {
    echo "🔥 Creating bootable USB for Vengeance..."
    echo "Available drives:"
    diskutil list
    echo ""
    read -p "Enter disk identifier (e.g. /dev/disk2): " DISK_ID
    
    if [ ! -z "$DISK_ID" ]; then
        echo "⚠️  WARNING: This will erase $DISK_ID completely!"
        read -p "Continue? (yes/no): " CONFIRM
        
        if [ "$CONFIRM" = "yes" ]; then
            sudo diskutil eraseDisk MS-DOS "UBUNTU" GPT $DISK_ID
            sudo dd if="$UBUNTU_ISO" of="$DISK_ID" bs=1m
            echo "✅ Bootable USB created!"
        fi
    fi
}

# 4. Transfer files to Vengeance (if accessible via network)
transfer_to_vengeance() {
    echo "📡 Attempting to transfer files to Vengeance..."
    read -p "Enter Vengeance IP address (or skip): " VENGEANCE_IP
    
    if [ ! -z "$VENGEANCE_IP" ]; then
        # Try to copy files via SCP (if SSH enabled on Windows)
        scp vengeance-*.sh "$USER@$VENGEANCE_IP:~/" || echo "SCP failed - use manual transfer"
        
        # Alternative: Use SMB share
        echo "Alternative: Access Windows share at smb://$VENGEANCE_IP"
    fi
}

# 5. Monitor Vengeance during migration
monitor_vengeance() {
    echo "📊 Monitoring Vengeance migration..."
    read -p "Enter new Vengeance Linux IP (after Ubuntu install): " LINUX_IP
    
    if [ ! -z "$LINUX_IP" ]; then
        echo "🐧 Testing Linux connection..."
        ping -c 3 "$LINUX_IP"
        
        echo "🔗 Attempting SSH connection..."
        ssh "$USER@$LINUX_IP" "echo 'Vengeance Linux is alive!'"
        
        echo "📦 Remote execution of setup script..."
        scp vengeance-linux-setup.sh "$USER@$LINUX_IP:~/"
        ssh "$USER@$LINUX_IP" "chmod +x vengeance-linux-setup.sh && ./vengeance-linux-setup.sh"
    fi
}

# 6. Verify Aurora reconnection
verify_aurora_connection() {
    echo "🤖 Verifying Aurora connection from new Vengeance Linux..."
    read -p "Enter Vengeance Linux IP: " LINUX_IP
    
    if [ ! -z "$LINUX_IP" ]; then
        ssh "$USER@$LINUX_IP" "curl -s http://your-aurora-endpoint/health" || echo "Aurora connection test failed"
    fi
}

# Main menu
echo ""
echo "🎛️  MACBOOK MIGRATION CONTROL OPTIONS:"
echo "1. Download migration files"
echo "2. Create bootable Ubuntu USB"
echo "3. Transfer files to Vengeance"
echo "4. Monitor migration progress"
echo "5. Verify Aurora connection"
echo "6. Full automated sequence"
echo ""

read -p "Choose option (1-6): " CHOICE

case $CHOICE in
    1) echo "Files ready in: $MIGRATION_DIR" ;;
    2) create_bootable_usb ;;
    3) transfer_to_vengeance ;;
    4) monitor_vengeance ;;
    5) verify_aurora_connection ;;
    6) 
        echo "🚀 Running full migration sequence..."
        create_bootable_usb
        transfer_to_vengeance
        echo "📋 Manual step: Boot Vengeance from USB and install Ubuntu"
        read -p "Press Enter when Ubuntu installation is complete..."
        monitor_vengeance
        verify_aurora_connection
        echo "✅ Vengeance migration complete!"
        ;;
    *)
        echo "ℹ️  Manual steps available in $MIGRATION_DIR"
        ;;
esac

echo ""
echo "🎯 MIGRATION CONTROL READY!"
echo "🍎 MacBook orchestrating Vengeance transformation..."
echo "🔥 Next: Boot Vengeance from USB → Linux installation"
