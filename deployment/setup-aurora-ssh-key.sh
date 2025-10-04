#!/bin/bash
# Setup SSH key for Aurora Town access

echo "🔑 Setting up SSH key for Aurora Town..."
echo ""

# Generate SSH key if not exists
if [ ! -f ~/.ssh/id_ed25519 ]; then
    echo "📝 Generating new ED25519 SSH key..."
    ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519 -N "" -C "robbiebook@aurora-empire"
    echo "✅ Key generated!"
else
    echo "✅ SSH key already exists"
fi

echo ""
echo "📋 YOUR PUBLIC KEY (add this to Aurora Town):"
echo "================================================"
cat ~/.ssh/id_ed25519.pub
echo "================================================"
echo ""
echo "📝 NEXT STEPS:"
echo "1. Copy the public key above"
echo "2. Log into Elestio dashboard: https://dash.elestio.com"
echo "3. Go to Aurora Town VM settings"
echo "4. Add the public key to authorized SSH keys"
echo ""
echo "OR manually add it:"
echo "  ssh root@aurora-town-u44170.vm.elestio.app"
echo "  echo 'YOUR_PUBLIC_KEY' >> ~/.ssh/authorized_keys"
echo ""
echo "Then test with:"
echo "  ssh root@aurora-town-u44170.vm.elestio.app echo 'Connection OK'"

