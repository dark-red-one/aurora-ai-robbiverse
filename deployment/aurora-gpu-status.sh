#!/bin/bash
# Aurora GPU Status - Complete Diagnostic
# Shows everything about RobbieBook1 → Aurora GPU connection

clear
echo "╔════════════════════════════════════════════════════════════╗"
echo "║         AURORA GPU STATUS - ROBBIEBOOK1 DIAGNOSTIC        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. NETWORK CONNECTIVITY
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  NETWORK CONNECTIVITY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

AURORA_HOST="aurora-u44170.vm.elestio.app"
AURORA_IP="8.17.147.158"

echo -n "   Hostname Resolution: "
if host $AURORA_HOST > /dev/null 2>&1; then
    RESOLVED_IP=$(host $AURORA_HOST | grep "has address" | awk '{print $4}' | head -1)
    echo -e "${GREEN}✅ $AURORA_HOST → $RESOLVED_IP${NC}"
else
    echo -e "${RED}❌ DNS resolution failed${NC}"
fi

echo -n "   Network Ping: "
if ping -c 1 -W 2 $AURORA_HOST > /dev/null 2>&1; then
    PING_TIME=$(ping -c 1 $AURORA_HOST | grep 'time=' | awk -F'time=' '{print $2}' | awk '{print $1}')
    echo -e "${GREEN}✅ ${PING_TIME}ms${NC}"
else
    echo -e "${RED}❌ Host unreachable${NC}"
fi

echo ""

# 2. SSH CONFIGURATION
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  SSH CONFIGURATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "   SSH Config (~/.ssh/config):"
if grep -q "aurora-u44170" ~/.ssh/config 2>/dev/null; then
    echo -e "   ${GREEN}✅ Aurora entry exists${NC}"
    echo ""
    grep -A 6 "Host aurora" ~/.ssh/config | sed 's/^/      /'
else
    echo -e "   ${RED}❌ No Aurora entry in SSH config${NC}"
fi

echo ""
echo "   SSH Key:"
if [ -f ~/.ssh/id_ed25519 ]; then
    echo -e "   ${GREEN}✅ Private key exists${NC}"
    echo "      Location: ~/.ssh/id_ed25519"
else
    echo -e "   ${RED}❌ Private key missing${NC}"
fi

if [ -f ~/.ssh/id_ed25519.pub ]; then
    echo -e "   ${GREEN}✅ Public key exists${NC}"
    echo "      Fingerprint: $(ssh-keygen -lf ~/.ssh/id_ed25519.pub | awk '{print $2}')"
else
    echo -e "   ${RED}❌ Public key missing${NC}"
fi

echo ""

# 3. SSH CONNECTION TEST
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  SSH CONNECTION TEST"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo -n "   SSH to Aurora (port 10001): "
SSH_TEST=$(ssh -p 10001 -o ConnectTimeout=5 -o StrictHostKeyChecking=no root@$AURORA_HOST "echo 'SUCCESS'" 2>&1)

if echo "$SSH_TEST" | grep -q "SUCCESS"; then
    echo -e "${GREEN}✅ CONNECTED${NC}"
    HOSTNAME=$(ssh -p 10001 root@$AURORA_HOST "hostname" 2>/dev/null)
    echo "      Remote hostname: $HOSTNAME"
    echo -e "      ${GREEN}SSH key is properly configured!${NC}"
else
    echo -e "${RED}❌ FAILED${NC}"
    echo "      Error: $SSH_TEST"
    echo ""
    echo -e "      ${YELLOW}⚠️  ACTION REQUIRED:${NC}"
    echo "      Add SSH key via web terminal:"
    echo "      1. https://aurora-u44170.vm.elestio.app:10004/"
    echo "      2. Login: root / quB7SC-7bM5-KW3O9U"
    echo "      3. Paste this:"
    echo ""
    echo -e "      ${BLUE}mkdir -p /root/.ssh && echo \"ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIIKtYaAt1pjSiHpFJbktjN8JfzJ8SLhiMnpf1QsZnJIQ robbiebook@aurora-empire\" >> /root/.ssh/authorized_keys && chmod 600 /root/.ssh/authorized_keys && echo \"✅ Done!\"${NC}"
fi

echo ""

# 4. OLLAMA STATUS ON AURORA
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  OLLAMA STATUS ON AURORA"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if echo "$SSH_TEST" | grep -q "SUCCESS"; then
    echo -n "   Ollama Service: "
    OLLAMA_RUNNING=$(ssh -p 10001 root@$AURORA_HOST "pgrep ollama > /dev/null && echo 'YES' || echo 'NO'" 2>/dev/null)
    
    if [ "$OLLAMA_RUNNING" = "YES" ]; then
        echo -e "${GREEN}✅ Running${NC}"
        
        MODELS=$(ssh -p 10001 root@$AURORA_HOST "curl -s localhost:11434/api/tags 2>/dev/null | jq -r '.models[].name' 2>/dev/null" 2>/dev/null)
        if [ -n "$MODELS" ]; then
            MODEL_COUNT=$(echo "$MODELS" | wc -l | tr -d ' ')
            echo "      Models installed: $MODEL_COUNT"
            echo "$MODELS" | while read model; do
                echo "      - $model"
            done
        else
            echo -e "      ${YELLOW}⚠️  No models installed${NC}"
        fi
    else
        echo -e "${RED}❌ Not running${NC}"
        echo -e "      ${YELLOW}⚠️  Install Ollama:${NC}"
        echo "      ssh -p 10001 root@$AURORA_HOST 'curl -fsSL https://ollama.com/install.sh | sh'"
    fi
    
    echo ""
    echo -n "   GPU Status: "
    GPU_INFO=$(ssh -p 10001 root@$AURORA_HOST "nvidia-smi --query-gpu=name,memory.total --format=csv,noheader 2>/dev/null" 2>/dev/null)
    
    if [ -n "$GPU_INFO" ]; then
        echo -e "${GREEN}✅ GPU Detected${NC}"
        echo "      $GPU_INFO"
    else
        echo -e "${RED}❌ No GPU detected${NC}"
    fi
else
    echo -e "   ${YELLOW}⚠️  Cannot check - SSH not connected${NC}"
fi

echo ""

# 5. LOCAL SSH TUNNEL
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5️⃣  LOCAL SSH TUNNEL STATUS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo -n "   Tunnel Process: "
TUNNEL_PID=$(ps aux | grep "[1]1435:localhost:11434" | awk '{print $2}')

if [ -n "$TUNNEL_PID" ]; then
    echo -e "${GREEN}✅ Running (PID: $TUNNEL_PID)${NC}"
else
    echo -e "${RED}❌ Not running${NC}"
    echo "      Start tunnel: ./deployment/start-aurora-gpu-tunnel.sh &"
fi

echo -n "   Local Ollama Access (port 11435): "
if curl -s --connect-timeout 2 localhost:11435/api/tags > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Accessible${NC}"
    LOCAL_MODELS=$(curl -s localhost:11435/api/tags | jq -r '.models[].name' 2>/dev/null)
    if [ -n "$LOCAL_MODELS" ]; then
        MODEL_COUNT=$(echo "$LOCAL_MODELS" | wc -l | tr -d ' ')
        echo "      Available models: $MODEL_COUNT"
    fi
else
    echo -e "${RED}❌ Not accessible${NC}"
fi

echo ""

# 6. GPU MESH CLIENT
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6️⃣  GPU MESH CLIENT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -f "services/gpu-mesh/robbiebook-client.py" ]; then
    echo -e "   ${GREEN}✅ Client installed${NC}"
    echo "      Location: services/gpu-mesh/robbiebook-client.py"
    
    if curl -s --connect-timeout 2 localhost:11435/api/tags > /dev/null 2>&1; then
        echo ""
        echo "   Test client:"
        echo "      python3 services/gpu-mesh/robbiebook-client.py --test"
    fi
else
    echo -e "   ${RED}❌ Client not found${NC}"
fi

echo ""

# 7. LAUNCHAGENT STATUS
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7️⃣  AUTO-START CONFIGURATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

PLIST_FILE="$HOME/Library/LaunchAgents/com.robbiebook.aurora-gpu.plist"
if [ -f "$PLIST_FILE" ]; then
    echo -e "   ${GREEN}✅ LaunchAgent installed${NC}"
    
    if launchctl list | grep -q "com.robbiebook.aurora-gpu"; then
        echo -e "   ${GREEN}✅ LaunchAgent loaded${NC}"
        
        if [ -f "$HOME/Library/Logs/aurora-gpu.log" ]; then
            echo "      Recent log entries:"
            tail -3 "$HOME/Library/Logs/aurora-gpu.log" 2>/dev/null | sed 's/^/      /'
        fi
    else
        echo -e "   ${YELLOW}⚠️  LaunchAgent not loaded${NC}"
        echo "      Load it: launchctl load $PLIST_FILE"
    fi
else
    echo -e "   ${RED}❌ LaunchAgent not installed${NC}"
fi

echo ""

# 8. SUMMARY & NEXT STEPS
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "8️⃣  SUMMARY & NEXT STEPS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Determine overall status
if echo "$SSH_TEST" | grep -q "SUCCESS" && curl -s --connect-timeout 2 localhost:11435/api/tags > /dev/null 2>&1; then
    echo -e "   ${GREEN}✅✅✅ SYSTEM OPERATIONAL ✅✅✅${NC}"
    echo ""
    echo "   RobbieBook1 is connected to Aurora RTX 4090!"
    echo ""
    echo "   Quick test:"
    echo "   python3 services/gpu-mesh/robbiebook-client.py --test"
elif echo "$SSH_TEST" | grep -q "SUCCESS"; then
    echo -e "   ${YELLOW}⚠️  SSH Connected, but tunnel not running${NC}"
    echo ""
    echo "   Next step:"
    echo "   ./deployment/start-aurora-gpu-tunnel.sh &"
else
    echo -e "   ${RED}❌ NOT OPERATIONAL${NC}"
    echo ""
    echo "   Required action: Add SSH key to Aurora"
    echo ""
    echo "   1. Open: https://aurora-u44170.vm.elestio.app:10004/"
    echo "   2. Login: root / quB7SC-7bM5-KW3O9U"
    echo "   3. Paste:"
    echo ""
    echo "   mkdir -p /root/.ssh && echo \"ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIIKtYaAt1pjSiHpFJbktjN8JfzJ8SLhiMnpf1QsZnJIQ robbiebook@aurora-empire\" >> /root/.ssh/authorized_keys && chmod 600 /root/.ssh/authorized_keys && echo \"✅ Done!\""
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

