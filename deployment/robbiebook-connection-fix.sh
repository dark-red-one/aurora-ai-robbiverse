#!/bin/bash

# 🔑 ROBBIEBOOK CONNECTION FIX
# ============================
# This script fixes SSH connections between Aurora/Vengeance and RobbieBook1

echo "🔑 ROBBIEBOOK CONNECTION FIX"
echo "============================"
echo ""

# RobbieBook1 details
ROBBYBOOK_IP="192.199.240.226"
ROBBYBOOK_USER="allanperetz"
ROBBYBOOK_SSH_KEY="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIIKtYaAt1pjSiHpFJbktjN8JfzJ8SLhiMnpf1QsZnJIQ robbiebook@aurora-empire"

echo "📋 RobbieBook1 Details:"
echo "IP: $ROBBYBOOK_IP"
echo "User: $ROBBYBOOK_USER"
echo "SSH Key: $ROBBYBOOK_SSH_KEY"
echo ""

# Create SSH key if it doesn't exist
if [ ! -f ~/.ssh/id_ed25519 ]; then
    echo "🔑 Creating SSH key..."
    ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519 -N "" -C "aurora@robbie-empire"
    echo "✅ SSH key created"
else
    echo "✅ SSH key already exists"
fi

# Display our public key
echo ""
echo "📋 Aurora's Public Key (add this to RobbieBook1):"
echo "=================================================="
cat ~/.ssh/id_ed25519.pub
echo ""

# Test connection to RobbieBook1
echo "🔍 Testing connection to RobbieBook1..."
if ping -c 1 $ROBBYBOOK_IP >/dev/null 2>&1; then
    echo "✅ RobbieBook1 is reachable"
    
    # Try SSH connection
    if ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no $ROBBYBOOK_USER@$ROBBYBOOK_IP "echo 'SSH connection successful'" 2>/dev/null; then
        echo "✅ SSH connection to RobbieBook1 works!"
    else
        echo "❌ SSH connection failed - need to add Aurora's key to RobbieBook1"
        echo ""
        echo "📋 MANUAL STEPS FOR ROBBIEBOOK1:"
        echo "1. Open Terminal on RobbieBook1"
        echo "2. Run: mkdir -p ~/.ssh"
        echo "3. Run: echo '$ROBBYBOOK_SSH_KEY' >> ~/.ssh/authorized_keys"
        echo "4. Run: chmod 600 ~/.ssh/authorized_keys"
        echo "5. Run: chmod 700 ~/.ssh"
        echo ""
        echo "Then test: ssh aurora@$(hostname -I | awk '{print $1}')"
    fi
else
    echo "❌ RobbieBook1 not reachable - check network/VPN"
fi

# Test Vengeance connection
echo ""
echo "🔍 Testing Vengeance connection..."
if ssh vengeance "echo 'Vengeance connection test'" 2>/dev/null; then
    echo "✅ Vengeance connection works!"
else
    echo "❌ Vengeance connection failed"
fi

# Create connection test script
cat > ~/test-connections.sh << 'EOF'
#!/bin/bash
echo "🔍 TESTING ALL CONNECTIONS"
echo "=========================="

# Test RobbieBook1
echo -n "RobbieBook1: "
if ping -c 1 192.199.240.226 >/dev/null 2>&1; then
    echo -n "✅ Reachable "
    if ssh -o ConnectTimeout=5 allanperetz@192.199.240.226 "echo 'SSH OK'" 2>/dev/null; then
        echo "✅ SSH OK"
    else
        echo "❌ SSH Failed"
    fi
else
    echo "❌ Not reachable"
fi

# Test Vengeance
echo -n "Vengeance: "
if ssh vengeance "echo 'SSH OK'" 2>/dev/null; then
    echo "✅ SSH OK"
else
    echo "❌ SSH Failed"
fi

# Test Aurora (self)
echo -n "Aurora: "
if hostname >/dev/null 2>&1; then
    echo "✅ Running"
else
    echo "❌ Issues"
fi
EOF

chmod +x ~/test-connections.sh

echo ""
echo "✅ Connection test script created: ~/test-connections.sh"
echo "Run it anytime with: ~/test-connections.sh"
echo ""
echo "🎯 NEXT STEPS:"
echo "1. Add Aurora's key to RobbieBook1 (manual steps above)"
echo "2. Test: ~/test-connections.sh"
echo "3. Once connected, sync: rsync -av . allanperetz@192.199.240.226:~/aurora-sync/"
