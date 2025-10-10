#!/bin/bash
# Setup SSH tunnel from Aurora Town to RunPod Ollama
# Forwards localhost:11434 on Aurora Town to RunPod's Ollama

set -euo pipefail

echo "🔗 SETTING UP SSH TUNNEL: Aurora Town -> RunPod"
echo "================================================"

# Create SSH key on Aurora Town if not exists
if [ ! -f ~/.ssh/id_ed25519 ]; then
    echo "🔑 Generating SSH key..."
    ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519 -N ""
fi

# Copy the key to RunPod (you'll need to do this manually or provide password)
echo "📋 Your public key (add this to RunPod's authorized_keys):"
cat ~/.ssh/id_ed25519.pub
echo ""
echo "⚠️  Manually add this key to RunPod: ssh root@209.170.80.132 -p 13323"
echo "    Then run: echo 'YOUR_PUBLIC_KEY' >> ~/.ssh/authorized_keys"
echo ""

# Create persistent SSH tunnel service
cat > /etc/systemd/system/runpod-tunnel.service << 'EOF'
[Unit]
Description=SSH Tunnel to RunPod Ollama
After=network.target

[Service]
Type=simple
User=root
Restart=always
RestartSec=10
ExecStart=/usr/bin/ssh -N -L 11434:localhost:11434 -o StrictHostKeyChecking=no -o ServerAliveInterval=60 -p 13323 -i /root/.ssh/id_ed25519 root@209.170.80.132

[Install]
WantedBy=multi-user.target
EOF

# Update gateway to use localhost instead of public IP
sed -i 's|http://209.170.80.132:.*|http://localhost:11434|g' /opt/aurora-dev/aurora/llm-gateway/main.py

echo ""
echo "✅ Tunnel service created!"
echo ""
echo "📋 Next steps:"
echo "1. Add Aurora Town's public key to RunPod"
echo "2. Test: ssh -p 13323 -i ~/.ssh/id_ed25519 root@209.170.80.132"
echo "3. Start tunnel: systemctl start runpod-tunnel"
echo "4. Enable on boot: systemctl enable runpod-tunnel"
echo "5. Restart gateway: systemctl restart aurora-llm-gateway"
echo ""
echo "🧪 Test: curl http://localhost:11434/api/tags"

