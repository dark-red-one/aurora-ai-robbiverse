#!/bin/bash
# Aurora Firewall Configuration Script
# Secures all nodes with proper firewall rules

set -e

echo "🔥 Configuring Aurora Firewall..."

# Detect OS
if [ "$(uname)" == "Darwin" ]; then
    echo "macOS detected"
    OS="macos"
elif [ -f /etc/debian_version ]; then
    echo "Debian/Ubuntu detected"
    OS="ubuntu"
else
    echo "Unknown OS - exiting"
    exit 1
fi

# Ubuntu/Debian Configuration
if [ "$OS" == "ubuntu" ]; then
    echo "Configuring Ubuntu firewall..."
    
    # Reset firewall
    ufw --force reset
    
    # Default policies
    ufw default deny incoming
    ufw default allow outgoing
    
    # Essential services
    ufw allow 22/tcp     # SSH
    ufw allow 51820/udp  # WireGuard VPN
    ufw allow 443/tcp    # HTTPS (future)
    
    # Docker network access
    ufw allow from 172.20.0.0/16
    ufw allow from 10.0.0.0/24
    
    # Local development networks
    ufw allow from 192.168.0.0/16
    ufw allow from 10.0.0.0/8
    
    # Enable firewall
    ufw --force enable
    
    # Install fail2ban
    apt-get update
    apt-get install -y fail2ban
    
    # Configure fail2ban
    cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 3
EOF
    
    # Start fail2ban
    systemctl enable fail2ban
    systemctl start fail2ban
    
    echo "✅ Ubuntu firewall configured"
    
elif [ "$OS" == "macos" ]; then
    echo "Configuring macOS firewall..."
    
    # Enable firewall
    sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate on
    
    # Allow Docker
    sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /Applications/Docker.app/Contents/MacOS/Docker
    
    # Allow Node.js (for development)
    if [ -f /usr/local/bin/node ]; then
        sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/node
    fi
    
    # Block incoming connections by default
    sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setblockall on
    
    echo "✅ macOS firewall configured"
fi

# Test firewall
echo "Testing firewall configuration..."
if [ "$OS" == "ubuntu" ]; then
    ufw status verbose
elif [ "$OS" == "macos" ]; then
    sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate
fi

echo "🔥 Aurora Firewall Configuration Complete!"
echo ""
echo "Next steps:"
echo "1. Set API keys in .env file"
echo "2. Configure SSL certificates (if needed)"
echo "3. Test API authentication"
echo "4. Monitor security logs"
