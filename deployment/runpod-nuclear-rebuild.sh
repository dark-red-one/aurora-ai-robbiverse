#!/bin/bash
# 🔥💋 RUNPOD NUCLEAR REBUILD - OPTIMAL SETUP 🔥💋

RUNPOD_SSH="ssh -i /home/allan/.ssh/id_ed25519 -p 13323 root@209.170.80.132"

echo "🔥 NUCLEAR OPTION: SANDBLASTING RUNPOD CLEAN!"
echo ""

# Phase 1: NUKE EVERYTHING
echo "💥 Phase 1: Nuking old setup..."
$RUNPOD_SSH "
echo '🗑️ Removing old Ollama installation...'
pkill -9 ollama 2>/dev/null
rm -rf ~/.ollama
rm -rf /root/.ollama
rm -rf /tmp/ollama*

echo '🧹 Cleaning system disk...'
apt-get clean
rm -rf /tmp/*
rm -rf /var/tmp/*
docker system prune -af 2>/dev/null || true

echo '✅ Nuked!'
df -h / | grep overlay
"

# Phase 2: OPTIMAL SETUP
echo ""
echo "🏗️ Phase 2: Building optimal setup..."
$RUNPOD_SSH "
echo '📁 Creating optimal directory structure...'
mkdir -p /workspace/ollama
mkdir -p /workspace/ollama/models
mkdir -p /workspace/ollama/logs

echo '🔧 Installing Ollama to workspace...'
cd /workspace/ollama
curl -fsSL https://ollama.com/install.sh | sh

echo '⚙️ Configuring Ollama for workspace...'
export OLLAMA_MODELS=/workspace/ollama/models
export OLLAMA_HOST=0.0.0.0:11434
export OLLAMA_ORIGINS='*'
export OLLAMA_NUM_PARALLEL=4
export OLLAMA_MAX_LOADED_MODELS=2

echo '📝 Creating startup script...'
cat > /workspace/ollama/start-ollama.sh << 'EEOF'
#!/bin/bash
export OLLAMA_MODELS=/workspace/ollama/models
export OLLAMA_HOST=0.0.0.0:11434
export OLLAMA_ORIGINS='*'
export OLLAMA_NUM_PARALLEL=4
export OLLAMA_MAX_LOADED_MODELS=2
nohup ollama serve > /workspace/ollama/logs/ollama.log 2>&1 &
echo \"✅ Ollama started! PID: \$!\"
EEOF

chmod +x /workspace/ollama/start-ollama.sh

echo '🚀 Starting Ollama from workspace...'
/workspace/ollama/start-ollama.sh

sleep 3

echo '✅ Ollama running from workspace!'
ps aux | grep ollama | grep -v grep
"

# Phase 3: VERIFY
echo ""
echo "🧪 Phase 3: Verifying setup..."
$RUNPOD_SSH "
echo '💾 Disk space check:'
df -h / /workspace | grep -E '(Filesystem|overlay|workspace)'

echo ''
echo '🤖 Ollama health:'
curl -s http://localhost:11434/api/version || echo 'Ollama not responding'

echo ''
echo '📊 Ready for models:'
echo 'System disk:' \$(df -h / | grep overlay | awk '{print \$4}') 'free'
echo 'Workspace:' \$(df -h /workspace | tail -1 | awk '{print \$4}') 'free'
"

echo ""
echo "✅✅✅ NUCLEAR REBUILD COMPLETE! ✅✅✅"
echo ""
echo "Ready to pull models to /workspace/ollama/models"
echo "Run: export OLLAMA_HOST=http://localhost:8080 && ollama pull [model-name]"









