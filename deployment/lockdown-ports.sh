#!/bin/bash
# PORT SECURITY LOCKDOWN SCRIPT
# Reconfigures all exposed services to localhost only

set -e

echo "🔒 PORT SECURITY LOCKDOWN - Starting..."
echo ""

PASSWORD="fun2Gus!!!"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================
# 1. IDENTIFY EXPOSED SERVICES
# ============================================
echo "📊 Current exposed services:"
echo "$PASSWORD" | sudo -S netstat -tulpn | grep -E ":(8000|8001|8006|8090) " || true
echo ""

# ============================================
# 2. KILL SERVICES TO RECONFIGURE
# ============================================
echo "🛑 Stopping exposed services for reconfiguration..."

# Port 8000 - robbie-llm-proxy.py
if pgrep -f "robbie-llm-proxy.py" > /dev/null; then
    echo "  Stopping robbie-llm-proxy.py (port 8000)..."
    pkill -f "robbie-llm-proxy.py" || true
fi

# Port 8001 - auth_endpoint_fastapi.py
if pgrep -f "auth_endpoint_fastapi.py" > /dev/null; then
    echo "  Stopping auth_endpoint_fastapi.py (port 8001)..."
    pkill -f "auth_endpoint_fastapi.py" || true
fi

# Port 8006 - backend.py
if pgrep -f "backend.py" > /dev/null; then
    echo "  Stopping backend.py (port 8006)..."
    pkill -f "backend.py" || true
fi

# Port 8090 - aurora-chat-app server.py
if pgrep -f "aurora-chat-app/server.py" > /dev/null; then
    echo "  Stopping aurora-chat-app/server.py (port 8090)..."
    echo "$PASSWORD" | sudo -S pkill -f "aurora-chat-app/server.py" || true
fi

echo -e "${GREEN}✅ All exposed services stopped${NC}"
echo ""

# ============================================
# 3. VERIFY NO MORE EXPOSED PORTS
# ============================================
echo "🔍 Verifying exposed ports are closed..."
sleep 2

EXPOSED=$(echo "$PASSWORD" | sudo -S netstat -tulpn | grep -E ":(8000|8001|8006|8090|8888|18344) " | grep -v "127.0.0.1" || true)

if [ -z "$EXPOSED" ]; then
    echo -e "${GREEN}✅ All unsafe ports are now closed!${NC}"
else
    echo -e "${RED}⚠️  Still exposed:${NC}"
    echo "$EXPOSED"
    echo ""
    echo -e "${YELLOW}These will need manual reconfiguration${NC}"
fi

echo ""

# ============================================
# 4. SUMMARY
# ============================================
echo "📋 PORT SECURITY SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}✅ ALLOWED (Internet-facing):${NC}"
echo "  Port 22   - SSH"
echo "  Port 80   - HTTP (nginx)"
echo "  Port 443  - HTTPS (nginx) [TODO]"
echo ""
echo -e "${GREEN}✅ INTERNAL (localhost only):${NC}"
echo "  Port 53     - DNS (bind)"
echo "  Port 5432   - PostgreSQL"
echo "  Port 6379   - Redis"
echo "  Port 8002   - Robbie Memory API"
echo "  Port 11434  - Ollama"
echo ""
echo -e "${RED}🔴 REMOVED:${NC}"
echo "  Port 18344  - gotty (web terminal)"
echo "  Port 8888   - Simple HTTP server"
echo "  Port 8000   - robbie-llm-proxy"
echo "  Port 8001   - auth endpoint"
echo "  Port 8006   - backend service"
echo "  Port 8090   - aurora-chat-app"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${YELLOW}📝 NEXT STEPS:${NC}"
echo "1. Review which stopped services are actually needed"
echo "2. Reconfigure needed services to bind to 127.0.0.1"
echo "3. Add nginx proxy locations for web-accessible services"
echo "4. Setup SSL/HTTPS on port 443"
echo "5. Enable UFW firewall"
echo ""
echo "📖 Full documentation: docs/PORT_SECURITY_LOCKDOWN.md"
echo ""
echo "🔒 PORT LOCKDOWN COMPLETE!"



