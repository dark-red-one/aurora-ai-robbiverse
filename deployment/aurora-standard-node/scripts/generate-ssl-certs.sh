#!/bin/bash

# SSL Certificate Generation Script
# Creates self-signed certificates for Aurora development/production

set -euo pipefail

echo "🔐 Generating SSL certificates for Aurora..."

# Create SSL directory
mkdir -p services/web-frontend/ssl

# Generate private key
echo "📝 Generating private key..."
openssl genrsa -out services/web-frontend/ssl/aurora.key 2048

# Generate certificate signing request
echo "📝 Generating certificate signing request..."
openssl req -new -key services/web-frontend/ssl/aurora.key -out services/web-frontend/ssl/aurora.csr -subj "/C=US/ST=Texas/L=Austin/O=TestPilot CPG/OU=AI Division/CN=aurora-town-u44170.vm.elestio.app"

# Generate self-signed certificate
echo "📝 Generating self-signed certificate..."
openssl x509 -req -days 365 -in services/web-frontend/ssl/aurora.csr -signkey services/web-frontend/ssl/aurora.key -out services/web-frontend/ssl/aurora.crt

# Generate wildcard certificate for all nodes
echo "📝 Generating wildcard certificate..."
openssl req -x509 -newkey rsa:2048 -keyout services/web-frontend/ssl/wildcard.key -out services/web-frontend/ssl/wildcard.crt -days 365 -nodes -subj "/C=US/ST=Texas/L=Austin/O=TestPilot CPG/OU=AI Division/CN=*.aurora.local"

# Set proper permissions
chmod 600 services/web-frontend/ssl/*.key
chmod 644 services/web-frontend/ssl/*.crt
chmod 644 services/web-frontend/ssl/*.csr

echo "✅ SSL certificates generated:"
echo "  - aurora.key (private key)"
echo "  - aurora.crt (certificate)"
echo "  - wildcard.key (wildcard private key)"
echo "  - wildcard.crt (wildcard certificate)"

# Generate Let's Encrypt instructions
cat > services/web-frontend/ssl/letsencrypt-setup.md << 'EOF'
# Let's Encrypt Setup for Production

## For Aurora (aurora-town-u44170.vm.elestio.app)

```bash
# Install certbot
apt update && apt install -y certbot

# Generate Let's Encrypt certificate
certbot certonly --standalone -d aurora-town-u44170.vm.elestio.app

# Copy certificates
cp /etc/letsencrypt/live/aurora-town-u44170.vm.elestio.app/fullchain.pem services/web-frontend/ssl/aurora.crt
cp /etc/letsencrypt/live/aurora-town-u44170.vm.elestio.app/privkey.pem services/web-frontend/ssl/aurora.key

# Set up auto-renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
```

## For Other Nodes

Use the wildcard certificate for *.aurora.local domains:
- vengeance.aurora.local
- runpod-tx.aurora.local
- robbiebook1.aurora.local
EOF

echo "📋 Let's Encrypt setup instructions saved to services/web-frontend/ssl/letsencrypt-setup.md"
