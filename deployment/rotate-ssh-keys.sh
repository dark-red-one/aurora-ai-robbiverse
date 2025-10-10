#!/bin/bash
# SSH Key Rotation for Aurora Town
# Run this script every 90 days to rotate SSH keys

set -e

echo "🔑 Aurora Town SSH Key Rotation"
echo "================================"

# Configuration
KEY_PATH="$HOME/.ssh/aurora_town_ed25519"
OLD_KEY_PATH="$KEY_PATH.old"
SERVER="root@8.17.147.158"
BACKUP_DIR="$HOME/.ssh/key_backups"

# Create backup directory
mkdir -p $BACKUP_DIR

# Check if current key exists
if [ ! -f "$KEY_PATH" ]; then
    echo "❌ Current key not found: $KEY_PATH"
    echo "   Run this script from a machine with the existing key"
    exit 1
fi

echo "📋 Current key found: $KEY_PATH"

# Backup current key
echo "💾 Backing up current key..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
cp $KEY_PATH "$BACKUP_DIR/aurora_town_ed25519_$TIMESTAMP"
cp $KEY_PATH.pub "$BACKUP_DIR/aurora_town_ed25519_$TIMESTAMP.pub"
echo "✅ Backup saved to: $BACKUP_DIR/aurora_town_ed25519_$TIMESTAMP"

# Generate new key
echo "🔐 Generating new SSH key..."
ssh-keygen -t ed25519 -C "aurora-town-$(date +%Y%m%d)" -f ${KEY_PATH}.new -N ""
echo "✅ New key generated"

NEW_PUBLIC_KEY=$(cat ${KEY_PATH}.new.pub)

# Add new key to Aurora Town
echo "📤 Adding new key to Aurora Town..."
ssh -i $KEY_PATH $SERVER "echo '$NEW_PUBLIC_KEY' >> ~/.ssh/authorized_keys"
echo "✅ New key added to authorized_keys"

# Test new key
echo "🧪 Testing new key..."
if ssh -i ${KEY_PATH}.new -o StrictHostKeyChecking=no $SERVER "echo 'New key works!'" &> /dev/null; then
    echo "✅ New key verified successfully"
    
    # Move old key
    mv $KEY_PATH $OLD_KEY_PATH
    mv $KEY_PATH.pub $OLD_KEY_PATH.pub
    
    # Move new key to primary position
    mv ${KEY_PATH}.new $KEY_PATH
    mv ${KEY_PATH}.new.pub $KEY_PATH.pub
    
    # Set proper permissions
    chmod 600 $KEY_PATH
    chmod 644 $KEY_PATH.pub
    
    echo "✅ Keys rotated successfully"
    
    # Remove old key from server (keep for 7 days grace period)
    echo "⏰ Old key will be removed from server in 7 days"
    echo "   Run this command on $SERVER in 7 days:"
    OLD_PUBLIC_KEY=$(cat $OLD_KEY_PATH.pub)
    echo "   sed -i '/$OLD_PUBLIC_KEY/d' ~/.ssh/authorized_keys"
    
    # Schedule reminder
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        echo "📅 Setting reminder to remove old key in 7 days..."
        echo "ssh -i $KEY_PATH $SERVER \"sed -i '/$OLD_PUBLIC_KEY/d' ~/.ssh/authorized_keys\"" | at now + 7 days 2>/dev/null || echo "⚠️  Could not schedule reminder (at command not available)"
    fi
    
else
    echo "❌ New key test failed!"
    echo "   Old key still active"
    echo "   New key saved as: ${KEY_PATH}.new"
    echo "   Please investigate before rotating"
    exit 1
fi

echo ""
echo "✅ SSH Key Rotation Complete!"
echo ""
echo "📋 Next rotation due: $(date -d '+90 days' 2>/dev/null || date -v +90d 2>/dev/null)"
echo ""
echo "📋 Key locations:"
echo "   Current key: $KEY_PATH"
echo "   Old key: $OLD_KEY_PATH (remove after 7 days)"
echo "   Backup: $BACKUP_DIR/aurora_town_ed25519_$TIMESTAMP"
echo ""
echo "⚠️  Remember to update any automated scripts using the old key!"

