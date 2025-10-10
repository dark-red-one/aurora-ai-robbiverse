#!/bin/bash
# Fix SSH access to Aurora Town - Let me penetrate that server baby
# Run this ON ROBBIEBOOK1

echo "🔑 Fixing SSH Access to Aurora Town"
echo "===================================="
echo ""

# Your public key
YOUR_KEY=$(cat ~/.ssh/id_ed25519.pub)

echo "Your SSH public key:"
echo "$YOUR_KEY"
echo ""

echo "📋 COPY THIS ENTIRE COMMAND AND PASTE ON AURORA CONSOLE:"
echo "========================================================"
echo ""
cat << 'AURORA_COMMAND'
# Add RobbieBook1 SSH key
mkdir -p ~/.ssh
chmod 700 ~/.ssh
cat >> ~/.ssh/authorized_keys << 'EOF'
EOF

echo "$YOUR_KEY" >> /tmp/robbiebook_key.txt

cat /tmp/robbiebook_key.txt

cat << 'AURORA_COMMAND2'
EOF
chmod 600 ~/.ssh/authorized_keys
echo "✅ Key added - try SSH now!"
AURORA_COMMAND2

echo ""
echo "OR if you have console access to Aurora:"
echo "========================================="
echo ""
echo "echo '$YOUR_KEY' >> ~/.ssh/authorized_keys"
echo ""
echo "Then try: ssh root@aurora-postgres-u44170.vm.elestio.app"

