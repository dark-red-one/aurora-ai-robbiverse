#!/bin/bash
# Complete RobbieBook1 Town Setup
# Sets up VPN, Squid proxy, database replication, and all services

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🏛️  ROBBIEBOOK1 COMPLETE TOWN SETUP"
echo "=========================================="
echo ""
echo "This will configure RobbieBook1 as a full town with:"
echo "  ✓ VPN connectivity to Aurora Town"
echo "  ✓ Local Squid proxy routing through Aurora"
echo "  ✓ Database replication (bidirectional)"
echo "  ✓ Multi-context switching (TestPilot/Aurora/President)"
echo "  ✓ All services with town configuration"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# 1. Install Squid
echo ""
echo "🦑 PHASE 1: Install Squid Proxy"
echo "==============================="

if ! command -v squid &> /dev/null; then
    echo "Installing Squid..."
    brew install squid
else
    echo "✅ Squid already installed"
fi

# 2. Configure Squid
echo ""
echo "🦑 PHASE 2: Configure Squid"
echo "==========================="

SQUID_CONF="/usr/local/etc/squid/squid.conf"
echo "Backing up existing Squid config..."
if [ -f "$SQUID_CONF" ]; then
    sudo cp "$SQUID_CONF" "$SQUID_CONF.backup.$(date +%Y%m%d)"
fi

echo "Installing RobbieBook1 Squid configuration..."
sudo cp "$SCRIPT_DIR/robbiebook1-squid.conf" "$SQUID_CONF"

# Create cache and log directories
echo "Creating Squid directories..."
sudo mkdir -p /usr/local/var/cache/squid
sudo mkdir -p /usr/local/var/logs/squid
sudo mkdir -p /usr/local/var/run
sudo chown -R $(whoami):staff /usr/local/var/cache/squid
sudo chown -R $(whoami):staff /usr/local/var/logs/squid

# Initialize Squid cache
echo "Initializing Squid cache..."
squid -z -f "$SQUID_CONF" || true

echo "✅ Squid configured"

# 3. Install Squid LaunchAgent
echo ""
echo "🚀 PHASE 3: Install Squid LaunchAgent"
echo "======================================"

LAUNCH_AGENT_DIR="$HOME/Library/LaunchAgents"
mkdir -p "$LAUNCH_AGENT_DIR"

echo "Installing Squid LaunchAgent..."
cp "$SCRIPT_DIR/com.robbiebook.squid.plist" "$LAUNCH_AGENT_DIR/"

# Load LaunchAgent
echo "Loading LaunchAgent..."
launchctl unload "$LAUNCH_AGENT_DIR/com.robbiebook.squid.plist" 2>/dev/null || true
launchctl load "$LAUNCH_AGENT_DIR/com.robbiebook.squid.plist"

sleep 3

# Verify Squid is running
if pgrep -f squid > /dev/null; then
    echo "✅ Squid is running"
else
    echo "⚠️  Squid may not have started - check logs"
fi

# 4. Apply Database Schemas
echo ""
echo "🗄️  PHASE 4: Apply Database Schemas"
echo "===================================="

echo "Applying multi-context schema locally..."
PGPASSWORD="fun2Gus!!!" psql -h localhost -U postgres -d aurora_unified \
    -f "$REPO_ROOT/database/unified-schema/24-user-contexts.sql" 2>/dev/null || \
    echo "⚠️  Schema may already exist"

echo "Applying town separation schema locally..."
PGPASSWORD="fun2Gus!!!" psql -h localhost -U postgres -d aurora_unified \
    -f "$REPO_ROOT/database/unified-schema/05-town-separation.sql" 2>/dev/null || \
    echo "⚠️  Schema may already exist"

echo "✅ Schemas applied locally"

# 5. VPN Setup (if not already configured)
echo ""
echo "🔐 PHASE 5: VPN Configuration"
echo "=============================="

if [ ! -f "$HOME/.wireguard/robbie-empire.conf" ]; then
    echo "Running VPN setup..."
    bash "$REPO_ROOT/setup-robbiebook1-complete.sh"
else
    echo "✅ VPN already configured at ~/.wireguard/robbie-empire.conf"
    echo ""
    echo "📋 Your VPN public key (add this to Aurora Town):"
    cat "$HOME/.wireguard/publickey"
    echo ""
fi

# 6. Update LaunchAgent with town configuration
echo ""
echo "🚀 PHASE 6: Update Service LaunchAgent"
echo "======================================="

EMPIRE_PLIST="$LAUNCH_AGENT_DIR/com.robbiebook.empire.plist"
if [ -f "$EMPIRE_PLIST" ]; then
    echo "LaunchAgent already exists - adding town environment variables..."
    
    # Backup existing plist
    cp "$EMPIRE_PLIST" "$EMPIRE_PLIST.backup.$(date +%Y%m%d)"
    
    # Note: Manual update recommended for LaunchAgent plist
    echo "⚠️  TODO: Manually add environment variables to LaunchAgent"
    echo "    Edit: $EMPIRE_PLIST"
    echo "    Add these to <key>EnvironmentVariables</key>:"
    echo "      CITY=robbiebook1"
    echo "      TOWN_NAME=robbiebook1"
    echo "      NODE_TYPE=mobile"
    echo "      GATEWAY_TOWN=aurora"
    echo "      HTTP_PROXY=http://localhost:3128"
else
    echo "✅ LaunchAgent will be created on first service start"
fi

# 7. Test Configuration
echo ""
echo "🧪 PHASE 7: Testing Configuration"
echo "=================================="

echo ""
echo "Testing Squid proxy..."
if curl -s --proxy localhost:3128 https://httpbin.org/status/200 > /dev/null; then
    echo "✅ Squid proxy working"
else
    echo "⚠️  Squid proxy test failed"
fi

echo ""
echo "Testing database connection..."
if PGPASSWORD="fun2Gus!!!" psql -h localhost -U postgres -d aurora_unified -c "SELECT name FROM towns WHERE name='robbiebook1';" 2>/dev/null | grep -q robbiebook1; then
    echo "✅ RobbieBook1 town registered in database"
else
    echo "⚠️  RobbieBook1 not found in towns table"
fi

# 8. Summary
echo ""
echo "✅ ROBBIEBOOK1 TOWN SETUP COMPLETE!"
echo "===================================="
echo ""
echo "📊 Configuration Summary:"
echo "  🏛️  Town Name: robbiebook1"
echo "  🌐 Gateway: Aurora Town (10.0.0.10)"
echo "  🦑 Squid Proxy: localhost:3128"
echo "  🗄️  Database: localhost:5432/aurora_unified"
echo "  🔐 VPN Config: ~/.wireguard/robbie-empire.conf"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. ADD ROBBIEBOOK1 TO AURORA TOWN VPN"
echo "   ssh root@aurora-postgres-u44170.vm.elestio.app"
echo "   nano /etc/wireguard/wg0.conf"
echo "   Add this peer:"
echo "   ┌─────────────────────────────────────────"
echo "   │ [Peer]"
echo "   │ PublicKey = $(cat ~/.wireguard/publickey 2>/dev/null || echo '<YOUR_PUBLIC_KEY>')"
echo "   │ AllowedIPs = 10.0.0.100/32"
echo "   └─────────────────────────────────────────"
echo "   systemctl restart wg-quick@wg0"
echo ""
echo "2. APPLY SCHEMAS TO AURORA TOWN"
echo "   ssh root@aurora-postgres-u44170.vm.elestio.app"
echo "   psql -U aurora_app -d aurora_unified \\"
echo "     -f database/unified-schema/24-user-contexts.sql"
echo "   psql -U aurora_app -d aurora_unified \\"
echo "     -f database/unified-schema/05-town-separation.sql"
echo ""
echo "3. CONNECT TO VPN"
echo "   ~/robbie-vpn-connect.sh"
echo ""
echo "4. START SERVICES"
echo "   cd $REPO_ROOT"
echo "   ./deployment/start-robbiebook-empire.sh"
echo ""
echo "5. VERIFY EVERYTHING"
echo "   # VPN connectivity"
echo "   ping 10.0.0.10"
echo "   "
echo "   # Proxy through Aurora"
echo "   curl --proxy localhost:3128 https://ifconfig.me"
echo "   "
echo "   # Database sync"
echo "   psql -d aurora_unified -c \"SELECT * FROM towns;\""
echo "   "
echo "   # Context switching"
echo "   curl http://localhost:8000/api/contexts/allan"
echo ""
echo "🎉 RobbieBook1 is ready to join the empire!"
echo ""

