#!/bin/bash
# Setup Fail2ban for Aurora Town
# Protects against brute force attacks on SSH, Nginx, PostgreSQL

set -e

echo "🛡️  Setting up Fail2ban Security"
echo "================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root (sudo)"
    exit 1
fi

# Install Fail2ban
echo "📦 Installing Fail2ban..."
apt update
apt install -y fail2ban

echo "✅ Fail2ban installed"

# Create custom configuration
echo "⚙️  Configuring Fail2ban..."

# Create local configuration file
cat > /etc/fail2ban/jail.local << 'JAILEOF'
[DEFAULT]
# Ban hosts for 1 hour
bantime = 3600

# Find time window (10 minutes)
findtime = 600

# Max retries before ban
maxretry = 5

# Email notifications (optional)
destemail = allan@testpilotcpg.com
sender = fail2ban@aurora-town
action = %(action_mwl)s

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3
bantime = 7200

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 5

[nginx-botsearch]
enabled = true
port = http,https
logpath = /var/log/nginx/access.log
maxretry = 3

[nginx-badbots]
enabled = true
port = http,https
logpath = /var/log/nginx/access.log
maxretry = 2

[nginx-noscript]
enabled = true
port = http,https
logpath = /var/log/nginx/access.log
maxretry = 3

[nginx-noproxy]
enabled = true
port = http,https
logpath = /var/log/nginx/access.log
maxretry = 2
JAILEOF

# Create PostgreSQL jail if installed
if systemctl list-units --all | grep -q postgresql; then
    cat >> /etc/fail2ban/jail.local << 'PGEOF'

[postgresql]
enabled = true
port = 5432
logpath = /var/log/postgresql/postgresql-*-main.log
maxretry = 3
bantime = 7200
PGEOF
fi

echo "✅ Fail2ban configured"

# Create custom filters
echo "📝 Creating custom filters..."

# Create AI Router filter
mkdir -p /etc/fail2ban/filter.d

cat > /etc/fail2ban/filter.d/ai-router.conf << 'FILTEREOF'
[Definition]
failregex = ^.*"(GET|POST|PUT|DELETE) .* HTTP.*" (401|403|429).*$
ignoreregex =
FILTEREOF

# Add AI Router jail
cat >> /etc/fail2ban/jail.local << 'AIROUTEREOF'

[ai-router]
enabled = true
port = 8000,10002
logpath = /var/log/aurora/ai-router.log
filter = ai-router
maxretry = 10
bantime = 1800
AIROUTEREOF

echo "✅ Custom filters created"

# Enable and start Fail2ban
systemctl enable fail2ban
systemctl restart fail2ban

echo "✅ Fail2ban started"

# Wait for service to initialize
sleep 3

# Check status
echo ""
echo "📊 Fail2ban Status:"
fail2ban-client status

echo ""
echo "✅ Fail2ban Setup Complete!"
echo ""
echo "📋 What's Protected:"
echo "==================="
echo "✅ SSH (3 attempts, 2 hour ban)"
echo "✅ Nginx HTTP auth (5 attempts)"
echo "✅ Nginx bot searches (3 attempts)"
echo "✅ Nginx bad bots (2 attempts)"
echo "✅ Nginx no-script attacks"
echo "✅ Nginx no-proxy attacks"

if systemctl list-units --all | grep -q postgresql; then
    echo "✅ PostgreSQL (3 attempts, 2 hour ban)"
fi

echo "✅ AI Router (10 attempts, 30 min ban)"
echo ""
echo "📋 Commands:"
echo "============"
echo "Status:           sudo fail2ban-client status"
echo "Check jail:       sudo fail2ban-client status sshd"
echo "Unban IP:         sudo fail2ban-client set sshd unbanip <IP>"
echo "Banned IPs:       sudo fail2ban-client banned"
echo "View logs:        sudo tail -f /var/log/fail2ban.log"
echo ""
echo "🔍 Test Protection:"
echo "==================="
echo "Try SSH brute force: ssh invalid@8.17.147.158 (3 failed attempts = ban)"

