#!/bin/bash
# Complete SSH Setup for Aurora AI Empire
# This script completes the passwordless SSH setup across all nodes

echo "🚀 Aurora AI Empire - Complete SSH Setup"
echo "========================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Allan's SSH public key
PUBLIC_KEY="ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQCrZjBUMxYmeDFiRvQAgBUf81jbFRXkGNI/jk0hU8cOVgBsrQicCmb7tnWGxPspCkLfbeEM1TLwddKXhpMgg7GCPIVyEcK726b9rnHniT665Wyp9LX/ZbNPtHJNeoMc0iz6AkMXarwAuNMVb6wAwPl/hbwkTR12kukbCCl1nW6IqnuxjaVvYRWELMUFEx4UOiBPpV87QQCcdtKUQopP1B+NiytFPx4jTMZKbclDFOYGocU6xTKP81f6BrCe9S5cBbaGzGn6MGG0ySJ6FTJTQEuSK6kEA5iKRXpe7k6xYyNFK6IhHPpz3jtNnvpyLNisQux7ZkxUqnSXq2+CvhNT/kBdENDh4FIg383JYDf4+UyYeMEt6bYTfscMONlRmgOMt0hWXtv5pz1PPLC0xWTqPlnEOsTp3TxoRkBhY0sA07RzSRFAB34kXIOu1pbsA/HjxcoKfSAlkoK9XeXA5d7fpEzKyB7XhWKdOO2WVAzHEYIw97yNal/tSEULY/IePDfniqXyNSuvQyE91vu0ddwGkcIOAWptjgbWqFcS+XTvhLRcLh0WAPRLyy7KyY27RIOtBe44QRoeBfeJQFnYXR7/KfZKhIWYgakyBRVVb2man1ZC6S9z4kPp6N3mYgsE7nlSa7zQJXElM5yut0kRj17GtdzRaAs5en6dTUSDJRrE9UHSww== allan@testpilotcpg.com"

echo -e "${YELLOW}🔑 Adding Allan's SSH key to Aurora Town...${NC}"

# Ensure .ssh directory exists
mkdir -p ~/.ssh

# Add the key to authorized_keys (avoid duplicates)
if ! grep -q "allan@testpilotcpg.com" ~/.ssh/authorized_keys 2>/dev/null; then
    echo "$PUBLIC_KEY" >> ~/.ssh/authorized_keys
    echo -e "${GREEN}✅ SSH key added to Aurora Town${NC}"
else
    echo -e "${YELLOW}⚠️ SSH key already exists on Aurora Town${NC}"
fi

# Set proper permissions
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh

echo -e "${YELLOW}🌐 Setting up SSH access to other nodes...${NC}"

# Try to add SSH key to Vengeance (if accessible)
if ping -c 1 -W 1 10.0.0.3 >/dev/null 2>&1; then
    echo -e "${YELLOW}🔗 Adding SSH key to Vengeance...${NC}"
    if ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 allan@10.0.0.3 "mkdir -p ~/.ssh && echo '$PUBLIC_KEY' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && chmod 700 ~/.ssh" 2>/dev/null; then
        echo -e "${GREEN}✅ SSH key added to Vengeance${NC}"
    else
        echo -e "${RED}❌ Failed to add SSH key to Vengeance${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ Vengeance not reachable via VPN${NC}"
fi

# Try to add SSH key to RobbieBook1 (if accessible)
if ping -c 1 -W 1 10.0.0.4 >/dev/null 2>&1; then
    echo -e "${YELLOW}🔗 Adding SSH key to RobbieBook1...${NC}"
    if ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 allan@10.0.0.4 "mkdir -p ~/.ssh && echo '$PUBLIC_KEY' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && chmod 700 ~/.ssh" 2>/dev/null; then
        echo -e "${GREEN}✅ SSH key added to RobbieBook1${NC}"
    else
        echo -e "${RED}❌ Failed to add SSH key to RobbieBook1${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ RobbieBook1 not reachable via VPN${NC}"
fi

echo ""
echo -e "${GREEN}🎉 SSH Setup Complete!${NC}"
echo ""
echo -e "${YELLOW}🧪 Test Commands:${NC}"
echo "  ssh root@45.32.194.172    # Test Aurora connection"
echo "  ssh allan@10.0.0.3        # Test Vengeance connection"
echo "  ssh allan@10.0.0.4        # Test RobbieBook1 connection"
echo ""
echo -e "${GREEN}🚀 Allan now has passwordless SSH access to the Aurora network!${NC}"
