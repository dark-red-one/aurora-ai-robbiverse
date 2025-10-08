#!/bin/bash
# COMPLETE AURORA AI BOOT SCRIPT
# Starts EVERYTHING needed for full Cursor + GPU mesh integration
# Run this on boot OR after reboot to get full system operational

set -e

echo "🚀 AURORA AI - COMPLETE SYSTEM STARTUP"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}✅ $1${NC}"; }
log_warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# ============================================
# 1. OLLAMA SERVICE
# ============================================
echo "1️⃣  Starting Ollama Service..."

# Check if already running
if pgrep -f "ollama serve" > /dev/null; then
    log_info "Ollama already running"
else
    # Kill any conflicting processes
    pkill -f "ollama serve" 2>/dev/null || true
    sleep 2
    
    # Start Ollama
    nohup ollama serve >> /tmp/ollama.log 2>&1 &
    OLLAMA_PID=$!
    sleep 3
    
    if ps -p $OLLAMA_PID > /dev/null; then
        log_info "Ollama started (PID: $OLLAMA_PID)"
    else
        log_error "Ollama failed to start"
        exit 1
    fi
fi

# Wait for Ollama to be responsive
for i in {1..10}; do
    if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        MODEL_COUNT=$(curl -s http://localhost:11434/api/tags | jq -r '.models | length')
        log_info "Ollama responding ($MODEL_COUNT models loaded)"
        break
    fi
    echo "  Waiting for Ollama..."
    sleep 2
done

# ============================================
# 2. SSH TUNNELS TO REMOTE GPUs
# ============================================
echo ""
echo "2️⃣  Setting up GPU tunnels..."

# Port 8080: Iceland/RunPod GPU
if ss -tulpn 2>/dev/null | grep -q ":8080"; then
    log_info "Port 8080 tunnel already active"
else
    log_warn "Starting Iceland/RunPod tunnel (port 8080)..."
    nohup ssh -i /home/allan/.ssh/id_ed25519 -p 13323 \
        -L 8080:127.0.0.1:11434 \
        -o ServerAliveInterval=60 \
        -o ServerAliveCountMax=3 \
        -o StrictHostKeyChecking=no \
        -N root@209.170.80.132 \
        >> /tmp/ssh-tunnel-8080.log 2>&1 &
    
    sleep 3
    
    if ss -tulpn 2>/dev/null | grep -q ":8080"; then
        log_info "Port 8080 tunnel established"
    else
        log_warn "Port 8080 tunnel may not be active (check credentials)"
    fi
fi

# Verify tunnel connectivity
if curl -s --max-time 3 http://localhost:8080/api/tags > /dev/null 2>&1; then
    REMOTE_MODELS=$(curl -s http://localhost:8080/api/tags | jq -r '.models | length')
    log_info "Iceland/RunPod responding ($REMOTE_MODELS models)"
else
    log_warn "Iceland/RunPod not responding (tunnel may be down)"
fi

# Port 8081: Second GPU (if configured)
# NOTE: Currently not set up - uncomment and configure if you have Vengeance accessible
# if ! ss -tulpn 2>/dev/null | grep -q ":8081"; then
#     nohup ssh -L 8081:127.0.0.1:11434 -N user@vengeance.local >> /tmp/ssh-tunnel-8081.log 2>&1 &
#     log_info "Port 8081 tunnel started"
# fi

# ============================================
# 3. GPU MESH MONITOR
# ============================================
echo ""
echo "3️⃣  Starting GPU Mesh Monitor..."

MESH_DIR="/home/allan/aurora-ai-robbiverse/services/gpu-mesh"
PID_FILE="/tmp/aurora-gpu-mesh.pid"

if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if ps -p "$OLD_PID" > /dev/null 2>&1; then
        log_info "GPU Mesh already running (PID: $OLD_PID)"
    else
        rm "$PID_FILE"
    fi
fi

if [ ! -f "$PID_FILE" ]; then
    cd "$MESH_DIR"
    nohup python3 -u unified_gpu_mesh.py >> /tmp/aurora-gpu-mesh/gpu-mesh.log 2>&1 &
    NEW_PID=$!
    echo "$NEW_PID" > "$PID_FILE"
    sleep 3
    
    if ps -p "$NEW_PID" > /dev/null 2>&1; then
        log_info "GPU Mesh started (PID: $NEW_PID)"
    else
        log_error "GPU Mesh failed to start"
        rm "$PID_FILE"
    fi
fi

# ============================================
# 4. VERIFY MCP SERVER DEPENDENCIES
# ============================================
echo ""
echo "4️⃣  Checking MCP server dependencies..."

# Check PostgreSQL
if pg_isready -q 2>/dev/null; then
    log_info "PostgreSQL running"
else
    log_warn "PostgreSQL not running - some MCP servers may not work"
fi

# Check required MCP server scripts exist
MCP_SERVERS=(
    "/home/allan/aurora-ai-robbiverse/services/mcp_ollama_server.py"
    "/home/allan/aurora-ai-robbiverse/services/mcp_gpu_mesh_server.py"
)

for server in "${MCP_SERVERS[@]}"; do
    if [ -f "$server" ]; then
        log_info "$(basename $server) exists"
    else
        log_warn "$(basename $server) NOT FOUND - will need to be created"
    fi
done

# ============================================
# 5. SYSTEM STATUS SUMMARY
# ============================================
echo ""
echo "========================================"
echo "📊 SYSTEM STATUS"
echo "========================================"

# Ollama
if pgrep -f "ollama serve" > /dev/null; then
    MODELS=$(curl -s http://localhost:11434/api/tags 2>/dev/null | jq -r '.models | length' || echo "?")
    echo "🟢 Ollama Local:      RUNNING ($MODELS models)"
else
    echo "🔴 Ollama Local:      OFFLINE"
fi

# Iceland tunnel
if curl -s --max-time 2 http://localhost:8080/api/tags > /dev/null 2>&1; then
    ICELAND_MODELS=$(curl -s http://localhost:8080/api/tags | jq -r '.models | length')
    echo "🟢 Iceland GPU (8080): ONLINE ($ICELAND_MODELS models)"
else
    echo "🔴 Iceland GPU (8080): OFFLINE"
fi

# GPU Mesh
if [ -f "$PID_FILE" ] && ps -p "$(cat $PID_FILE)" > /dev/null 2>&1; then
    echo "🟢 GPU Mesh Monitor:   RUNNING"
else
    echo "🔴 GPU Mesh Monitor:   OFFLINE"
fi

# PostgreSQL
if pg_isready -q 2>/dev/null; then
    echo "🟢 PostgreSQL:         RUNNING"
else
    echo "🟡 PostgreSQL:         NOT CHECKED"
fi

echo "========================================"
echo ""

# ============================================
# 6. CURSOR INTEGRATION STATUS
# ============================================
echo "📱 CURSOR INTEGRATION"
echo "========================================"
echo "Cursor MCP config:     ~/.cursor/mcp.json"
echo "GPU config:            ~/.cursor/dual-rtx4090-integration.json"
echo ""
echo "When you open Cursor, MCP servers will auto-connect to:"
echo "  • Local Ollama (11434)"
echo "  • Iceland GPU via tunnel (8080)"
echo "  • GPU Mesh coordinator"
echo "  • Business intelligence backend"
echo "========================================"
echo ""

# ============================================
# 7. QUICK ACCESS COMMANDS
# ============================================
echo "💡 QUICK COMMANDS"
echo "========================================"
echo "Check status:    bash $MESH_DIR/check-mesh-status.sh"
echo "View logs:       tail -f /tmp/aurora-gpu-mesh/gpu-mesh.log"
echo "Restart mesh:    bash $MESH_DIR/restart-mesh.sh"
echo "Stop everything: pkill -f 'ollama serve' && pkill -f unified_gpu_mesh"
echo "========================================"
echo ""

log_info "AURORA AI SYSTEM READY! 🚀"
echo ""

