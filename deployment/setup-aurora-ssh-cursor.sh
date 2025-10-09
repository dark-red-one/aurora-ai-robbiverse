#!/bin/bash
# Setup SSH and Cursor on Aurora Server
# Run this on Aurora to enable SSH access and Cursor

set -e

echo "🔧 Setting up SSH and Cursor on Aurora..."

# Create .ssh directory for root
mkdir -p /root/.ssh
chmod 700 /root/.ssh

# Add your public key to authorized_keys
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAICS1Am0RlJctPTnw9FH3V5qf2Qra9UW+BfZG7NDbU4YO allanperetz@Allans-MacBook-Pro.local" >> /root/.ssh/authorized_keys
chmod 600 /root/.ssh/authorized_keys

# Also add to allan user if it exists
if id "allan" &>/dev/null; then
    mkdir -p /home/allan/.ssh
    chmod 700 /home/allan/.ssh
    echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAICS1Am0RlJctPTnw9FH3V5qf2Qra9UW+BfZG7NDbU4YO allanperetz@Allans-MacBook-Pro.local" >> /home/allan/.ssh/authorized_keys
    chmod 600 /home/allan/.ssh/authorized_keys
    chown -R allan:allan /home/allan/.ssh
fi

# Update SSH config for better security and Cursor compatibility
cat > /etc/ssh/sshd_config << 'EOF'
# Aurora SSH Configuration for Cursor
Port 22
Protocol 2
HostKey /etc/ssh/ssh_host_rsa_key
HostKey /etc/ssh/ssh_host_ecdsa_key
HostKey /etc/ssh/ssh_host_ed25519_key

# Authentication
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys
PasswordAuthentication no
PermitEmptyPasswords no
ChallengeResponseAuthentication no

# Security
PermitRootLogin yes
StrictModes yes
MaxAuthTries 3
MaxSessions 10

# Cursor compatibility
ClientAliveInterval 60
ClientAliveCountMax 3
TCPKeepAlive yes

# Allow port forwarding for Cursor
AllowTcpForwarding yes
GatewayPorts no
X11Forwarding yes
X11DisplayOffset 10
X11UseLocalhost yes

# Logging
SyslogFacility AUTH
LogLevel INFO

# Subsystem
Subsystem sftp /usr/lib/openssh/sftp-server
EOF

# Restart SSH service
systemctl restart ssh
systemctl enable ssh

echo "✅ SSH configured and restarted"

# Install Cursor dependencies
echo "📦 Installing Cursor dependencies..."
apt update
apt install -y curl wget gnupg software-properties-common apt-transport-https ca-certificates

# Install Node.js (required for Cursor)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install VS Code Server (Cursor uses similar architecture)
curl -fsSL https://code-server.dev/install.sh | sh

# Create Cursor workspace directory
mkdir -p /opt/cursor-workspace
chmod 755 /opt/cursor-workspace

# Install additional tools for development
apt install -y git vim nano htop tree jq

# Set up code-server service
cat > /etc/systemd/system/code-server.service << 'EOF'
[Unit]
Description=Code Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/cursor-workspace
ExecStart=/usr/bin/code-server --bind-addr 0.0.0.0:8080 --auth none --disable-telemetry
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Start code-server
systemctl daemon-reload
systemctl enable code-server
systemctl start code-server

echo "✅ Code-server installed and started on port 8080"

# Create a simple test file
cat > /opt/cursor-workspace/aurora-test.py << 'EOF'
#!/usr/bin/env python3
"""
Aurora Test File - Edit this in Cursor!
"""
import time
from datetime import datetime

def main():
    print("🤖 Aurora AI Empire - Cursor Test")
    print(f"⏰ Current time: {datetime.now()}")
    print("✅ Cursor is working on Aurora!")
    
    # Test Aurora services
    try:
        import requests
        response = requests.get("http://localhost:8015/health", timeout=5)
        print(f"🔗 Integration Demo: {response.json()}")
    except Exception as e:
        print(f"⚠️  Integration Demo not running: {e}")

if __name__ == "__main__":
    main()
EOF

chmod +x /opt/cursor-workspace/aurora-test.py

# Show connection info
echo ""
echo "🎉 Aurora SSH and Cursor setup complete!"
echo ""
echo "📡 Connection Info:"
echo "  SSH: ssh root@$(curl -s ifconfig.me)"
echo "  Code Server: http://$(curl -s ifconfig.me):8080"
echo ""
echo "🔑 SSH Key added to authorized_keys"
echo "🌐 Code Server running on port 8080"
echo "📁 Workspace: /opt/cursor-workspace"
echo ""
echo "✅ Ready for Cursor development!"
