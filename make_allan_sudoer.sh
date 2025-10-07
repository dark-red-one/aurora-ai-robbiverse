#!/bin/bash

# Script to make Allan a sudoer on the remote server
# Run this script manually: bash make_allan_sudoer.sh

echo "Connecting to aurora-u44170.vm.elestio.app as root..."
echo "You'll need to enter the root password when prompted"

# Method 1: Add Allan directly to sudoers
ssh root@aurora-u44170.vm.elestio.app << 'EOF'
echo "allan ALL=(ALL:ALL) ALL" >> /etc/sudoers
echo "Added Allan to sudoers file"
visudo -c
echo "Sudoers file validation complete"
EOF

echo "Testing sudo access for Allan..."
ssh root@aurora-u44170.vm.elestio.app << 'EOF'
su - allan -c "sudo whoami"
EOF

echo "Done! Allan should now have sudo access."
