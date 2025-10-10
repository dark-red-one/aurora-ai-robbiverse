#!/bin/bash
# Manual SSH Key Setup for Aurora Network
# This script provides instructions and commands for manual SSH key setup

echo "🔑 Aurora AI Empire - Manual SSH Key Setup"
echo "=========================================="

PUBLIC_KEY="ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQCrZjBUMxYmeDFiRvQAgBUf81jbFRXkGNI/jk0hU8cOVgBsrQicCmb7tnWGxPspCkLfbeEM1TLwddKXhpMgg7GCPIVyEcK726b9rnHniT665Wyp9LX/ZbNPtHJNeoMc0iz6AkMXarwAuNMVb6wAwPl/hbwkTR12kukbCCl1nW6IqnuxjaVvYRWELMUFEx4UOiBPpV87QQCcdtKUQopP1B+NiytFPx4jTMZKbclDFOYGocU6xTKP81f6BrCe9S5cBbaGzGn6MGG0ySJ6FTJTQEuSK6kEA5iKRXpe7k6xYyNFK6IhHPpz3jtNnvpyLNisQux7ZkxUqnSXq2+CvhNT/kBdENDh4FIg383JYDf4+UyYeMEt6bYTfscMONlRmgOMt0hWXtv5pz1PPLC0xWTqPlnEOsTp3TxoRkBhY0sA07RzSRFAB34kXIOu1pbsA/HjxcoKfSAlkoK9XeXA5d7fpEzKyB7XhWKdOO2WVAzHEYIw97yNal/tSEULY/IePDfniqXyNSuvQyE91vu0ddwGkcIOAWptjgbWqFcS+XTvhLRcLh0WAPRLyy7KyY27RIOtBe44QRoeBfeJQFnYXR7/KfZKhIWYgakyBRVVb2man1ZC6S9z4kPp6N3mYgsE7nlSa7zQJXElM5yut0kRj17GtdzRaAs5en6dTUSDJRrE9UHSww== allan@testpilotcpg.com"

echo "📋 Your SSH Public Key:"
echo "$PUBLIC_KEY"
echo ""

echo "🚀 Manual Setup Commands:"
echo "========================="
echo ""
echo "1. For Aurora Town (45.32.194.172):"
echo "   ssh root@45.32.194.172"
echo "   mkdir -p ~/.ssh"
echo "   echo '$PUBLIC_KEY' >> ~/.ssh/authorized_keys"
echo "   chmod 600 ~/.ssh/authorized_keys"
echo "   chmod 700 ~/.ssh"
echo ""

echo "2. For Vengeance (via VPN):"
echo "   ssh aurora"
echo "   ssh allan@10.0.0.3"
echo "   mkdir -p ~/.ssh"
echo "   echo '$PUBLIC_KEY' >> ~/.ssh/authorized_keys"
echo "   chmod 600 ~/.ssh/authorized_keys"
echo "   chmod 700 ~/.ssh"
echo ""

echo "3. For RobbieBook1 (via VPN):"
echo "   ssh aurora"
echo "   ssh allan@10.0.0.4"
echo "   mkdir -p ~/.ssh"
echo "   echo '$PUBLIC_KEY' >> ~/.ssh/authorized_keys"
echo "   chmod 600 ~/.ssh/authorized_keys"
echo "   chmod 700 ~/.ssh"
echo ""

echo "🧪 Test Commands:"
echo "================="
echo "ssh aurora                    # Test Aurora connection"
echo "ssh vengeance                 # Test Vengeance connection"
echo "ssh robbiebook1              # Test RobbieBook1 connection"
echo ""

echo "💡 Alternative: Use ssh-copy-id"
echo "ssh-copy-id root@45.32.194.172"
echo ""

echo "🎯 Once setup is complete, you'll have passwordless SSH across the entire Aurora network!"
