#!/bin/bash
# One-liner to fix SSH and setup Cursor on Aurora

cat << 'EOF' > /tmp/setup-ssh-cursor.sh
#!/bin/bash
set -e

echo "🔧 Setting up SSH and Cursor on Aurora..."

# Create .ssh directory and add key
mkdir -p /root/.ssh
chmod 700 /root/.ssh
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAICS1Am0RlJctPTnw9FH3V5qf2Qra9UW+BfZG7NDbU4YO allanperetz@Allans-MacBook-Pro.local" >> /root/.ssh/authorized_keys
chmod 600 /root/.ssh/authorized_keys

# Update SSH config
cat > /etc/ssh/sshd_config << 'SSHEOF'
Port 22
Protocol 2
HostKey /etc/ssh/ssh_host_rsa_key
HostKey /etc/ssh/ssh_host_ecdsa_key
HostKey /etc/ssh/ssh_host_ed25519_key
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys
PasswordAuthentication no
PermitRootLogin yes
StrictModes yes
ClientAliveInterval 60
ClientAliveCountMax 3
TCPKeepAlive yes
AllowTcpForwarding yes
X11Forwarding yes
Subsystem sftp /usr/lib/openssh/sftp-server
SSHEOF

# Restart SSH
systemctl restart ssh

# Install Node.js and code-server
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs curl wget git vim nano htop
curl -fsSL https://code-server.dev/install.sh | sh

# Create workspace
mkdir -p /opt/cursor-workspace
chmod 755 /opt/cursor-workspace

# Start code-server
code-server --bind-addr 0.0.0.0:8080 --auth none --disable-telemetry &

echo "✅ SSH and Cursor setup complete!"
echo "🔗 SSH: ssh root@$(curl -s ifconfig.me)"
echo "🌐 Code Server: http://$(curl -s ifconfig.me):8080"
echo "📁 Workspace: /opt/cursor-workspace"
EOF

chmod +x /tmp/setup-ssh-cursor.sh
/tmp/setup-ssh-cursor.sh
