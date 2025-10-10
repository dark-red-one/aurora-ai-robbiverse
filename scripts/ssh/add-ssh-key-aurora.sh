#!/bin/bash
# Script to add Allan's SSH key to Aurora Town
# This script should be run ON Aurora Town server

echo "🔑 Adding Allan's SSH key to Aurora Town..."
echo "============================================="

# Allan's SSH public key
PUBLIC_KEY="ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQCrZjBUMxYmeDFiRvQAgBUf81jbFRXkGNI/jk0hU8cOVgBsrQicCmb7tnWGxPspCkLfbeEM1TLwddKXhpMgg7GCPIVyEcK726b9rnHniT665Wyp9LX/ZbNPtHJNeoMc0iz6AkMXarwAuNMVb6wAwPl/hbwkTR12kukbCCl1nW6IqnuxjaVvYRWELMUFEx4UOiBPpV87QQCcdtKUQopP1B+NiytFPx4jTMZKbclDFOYGocU6xTKP81f6BrCe9S5cBbaGzGn6MGG0ySJ6FTJTQEuSK6kEA5iKRXpe7k6xYyNFK6IhHPpz3jtNnvpyLNisQux7ZkxUqnSXq2+CvhNT/kBdENDh4FIg383JYDf4+UyYeMEt6bYTfscMONlRmgOMt0hWXtv5pz1PPLC0xWTqPlnEOsTp3TxoRkBhY0sA07RzSRFAB34kXIOu1pbsA/HjxcoKfSAlkoK9XeXA5d7fpEzKyB7XhWKdOO2WVAzHEYIw97yNal/tSEULY/IePDfniqXyNSuvQyE91vu0ddwGkcIOAWptjgbWqFcS+XTvhLRcLh0WAPRLyy7KyY27RIOtBe44QRoeBfeJQFnYXR7/KfZKhIWYgakyBRVVb2man1ZC6S9z4kPp6N3mYgsE7nlSa7zQJXElM5yut0kRj17GtdzRaAs5en6dTUSDJRrE9UHSww== allan@testpilotcpg.com"

# Ensure .ssh directory exists
mkdir -p ~/.ssh

# Add the key to authorized_keys
echo "$PUBLIC_KEY" >> ~/.ssh/authorized_keys

# Set proper permissions
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh

echo "✅ SSH key added successfully!"
echo "🧪 Testing connection..."

# Test the connection
if ssh -o StrictHostKeyChecking=no allan@localhost "echo 'SSH key test successful'" 2>/dev/null; then
    echo "✅ SSH key test passed!"
else
    echo "⚠️ SSH key test failed - may need manual verification"
fi

echo "🎯 Allan can now connect with: ssh root@45.32.194.172"
