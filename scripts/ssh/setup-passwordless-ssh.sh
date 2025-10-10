#!/bin/bash
# Aurora AI Empire - Passwordless SSH Setup Script
# Sets up SSH keys across all nodes in the Aurora network

set -e

echo "🚀 Aurora AI Empire - Passwordless SSH Setup"
echo "=============================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Ensure SSH key exists
if [ ! -f ~/.ssh/id_rsa ]; then
    echo -e "${YELLOW}🔑 Generating SSH key...${NC}"
    ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N "" -C "allan@testpilotcpg.com"
fi

# Start SSH agent
echo -e "${YELLOW}🔐 Starting SSH agent...${NC}"
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_rsa

# Display public key
echo -e "${YELLOW}📋 Public key (add this to remote hosts):${NC}"
cat ~/.ssh/id_rsa.pub
echo ""

echo -e "${YELLOW}🌐 Aurora Network Nodes:${NC}"
echo "  🏢 Aurora Town: root@45.32.194.172"
echo "  🖥️  Vengeance: allan@10.0.0.3 (via VPN)"
echo "  💻 RobbieBook1: allan@10.0.0.4 (via VPN)"
echo ""

# Create SSH config for easy connections
echo -e "${YELLOW}📝 Creating SSH config for easy connections...${NC}"
mkdir -p ~/.ssh
cat > ~/.ssh/config << 'EOF'
# Aurora AI Empire SSH Configuration

# Aurora Town (Production Server)
Host aurora
    HostName 45.32.194.172
    User root
    Port 22
    IdentityFile ~/.ssh/id_rsa
    StrictHostKeyChecking no

# Vengeance (GPU Training Rig)
Host vengeance
    HostName 10.0.0.3
    User allan
    Port 22
    IdentityFile ~/.ssh/id_rsa
    StrictHostKeyChecking no
    ProxyCommand ssh aurora nc %h %p

# RobbieBook1 (Development Machine)
Host robbiebook1
    HostName 10.0.0.4
    User allan
    Port 22
    IdentityFile ~/.ssh/id_rsa
    StrictHostKeyChecking no
    ProxyCommand ssh aurora nc %h %p

# Aurora VPN Connection
Host aurora-vpn
    HostName 10.0.0.1
    User root
    Port 22
    IdentityFile ~/.ssh/id_rsa
    StrictHostKeyChecking no
EOF

echo -e "${GREEN}✅ SSH config created at ~/.ssh/config${NC}"
echo ""
echo -e "${YELLOW}🚀 Usage examples:${NC}"
echo "  ssh aurora                    # Connect to Aurora Town"
echo "  ssh vengeance                 # Connect to Vengeance (via Aurora)"
echo "  ssh robbiebook1              # Connect to RobbieBook1 (via Aurora)"
echo ""
echo -e "${YELLOW}💡 Manual Setup Instructions:${NC}"
echo "1. Copy the public key above"
echo "2. Add it to ~/.ssh/authorized_keys on each remote host"
echo "3. Test connections with: ssh aurora"
echo ""
echo -e "${GREEN}🎯 Passwordless SSH setup complete!${NC}"