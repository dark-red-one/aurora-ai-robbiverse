# Aurora Town GPU Server - Setup Instructions

**Date:** October 9, 2025  
**Server:** aurora-u44170.vm.elestio.app (8.17.147.158)  
**GPU:** RTX 4090 24GB  
**User:** allan (sudoer)

---

## 🚀 Quick Setup (3 steps)

### Step 1: SSH into Aurora Town

```bash
ssh allan@aurora-u44170.vm.elestio.app
# Password: fun2Gus!!!
```

### Step 2: Upload and run setup script

**On your local machine:**

```bash
scp deployment/setup-aurora-gpu-complete.sh allan@aurora-u44170.vm.elestio.app:~/
```

**On Aurora Town:**

```bash
chmod +x setup-aurora-gpu-complete.sh
./setup-aurora-gpu-complete.sh
```

### Step 3: Verify everything works

```bash
~/robbie-ai/status.sh
```

**That's it! Setup takes ~30-45 minutes (mostly downloading AI models).**

---

## 📋 What Gets Installed

### System Tools

- git, curl, wget, vim, tmux, htop, build-essential
- Python 3 + pip + venv
- jq (JSON processing)

### AI Stack

- **Ollama** (local AI inference)
  - llama3 (8B general model)
  - mistral (7B fast model)
  - codellama (code understanding)
  - nomic-embed-text (embeddings)

- **PyTorch with CUDA**
  - Full GPU support
  - transformers, sentence-transformers
  - langchain, chromadb

- **AI Router Service**
  - FastAPI web service on port 8000
  - Routes: `/v1/chat/completions`, `/v1/embeddings`, `/health`
  - Auto-starts on boot

### Security

- **UFW Firewall**
  - Allow: 22 (SSH), 80 (HTTP), 443 (HTTPS)
  - Deny: Everything else

### Monitoring

- GPU monitor (tmux session)
- Status dashboard script
- Service health checks

---

## 🔧 Manual Setup (if script fails)

### Phase 1: System Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install tools
sudo apt install -y git curl wget vim tmux htop build-essential python3-pip python3-venv python3-dev jq

# Verify GPU
nvidia-smi
```

### Phase 2: Install Ollama

```bash
curl -fsSL https://ollama.com/install.sh | sh
sudo systemctl enable ollama
sudo systemctl start ollama

# Pull models (takes ~10 minutes)
ollama pull llama3
ollama pull mistral
ollama pull codellama
ollama pull nomic-embed-text
```

### Phase 3: Python Setup

```bash
cd /home/allan
mkdir -p robbie-ai
cd robbie-ai
python3 -m venv venv
source venv/bin/activate

# Install PyTorch
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121

# Install ML libraries
pip install transformers sentence-transformers langchain chromadb
pip install fastapi uvicorn[standard] httpx pydantic
pip install psycopg2-binary asyncpg python-dotenv
```

### Phase 4: AI Router

```bash
mkdir -p /home/allan/robbie-ai/ai-router
cd /home/allan/robbie-ai/ai-router

# Create ai_router.py (see setup script for full code)
# Or download from repo

# Create systemd service
sudo nano /etc/systemd/system/ai-router.service
# (see setup script for service file)

sudo systemctl daemon-reload
sudo systemctl enable ai-router
sudo systemctl start ai-router
```

### Phase 5: Configure Firewall

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## ✅ Verification Checklist

After setup completes, verify:

```bash
# 1. GPU visible
nvidia-smi | grep "RTX 4090"
# Should show: GeForce RTX 4090

# 2. Ollama working
ollama list
# Should show 4 models

# 3. AI Router responding
curl http://localhost:8000/health
# Should return: {"status": "healthy"}

# 4. Database connected
PGPASSWORD=0qyMjZQ3-xKIe-ylAPt0At psql \
  --host=aurora-postgres-u44170.vm.elestio.app \
  --port=25432 \
  --username=postgres \
  -c "SELECT version();"
# Should show PostgreSQL version

# 5. Firewall configured
sudo ufw status
# Should show: Status: active with ports 22, 80, 443

# 6. Services auto-start
sudo systemctl list-unit-files | grep -E "(ollama|ai-router)"
# Both should show "enabled"
```

---

## 🎯 Quick Commands Reference

```bash
# Check everything
~/robbie-ai/status.sh

# Monitor GPU
tmux attach -t gpu-monitor
# (Ctrl+B then D to detach)

# Test AI
ollama run llama3 "Hello!"
curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"prompt": "What is 2+2?"}'

# Restart services
sudo systemctl restart ollama
sudo systemctl restart ai-router

# View logs
sudo journalctl -u ollama -f
sudo journalctl -u ai-router -f

# Python environment
cd ~/robbie-ai && source venv/bin/activate
```

---

## 🐛 Troubleshooting

### GPU not detected

```bash
nvidia-smi
# If fails, check drivers:
nvidia-smi -L
sudo apt install nvidia-driver-535
```

### Ollama not starting

```bash
sudo systemctl status ollama
sudo journalctl -u ollama -n 50
# Check if port 11434 is blocked
```

### AI Router fails

```bash
sudo systemctl status ai-router
sudo journalctl -u ai-router -n 50
# Check Python path in service file
```

### Database connection fails

```bash
# Test network connectivity
ping aurora-postgres-u44170.vm.elestio.app
# Test port
nc -zv aurora-postgres-u44170.vm.elestio.app 25432
```

### Firewall blocks needed traffic

```bash
# Check rules
sudo ufw status numbered
# Add rule if needed
sudo ufw allow <port>/tcp
```

---

## 📊 Performance Expectations

**With RTX 4090:**

- Llama3 inference: 50-80 tokens/sec
- Mistral inference: 60-100 tokens/sec
- Embeddings: ~1000 texts/sec
- Latency: 10-50ms (vs 200-500ms OpenAI)
- Concurrent requests: 5-10 simultaneous

**Cost Savings:**

- OpenAI API: ~$200-500/month
- Local GPU: $100/month (server cost)
- **Net savings: $100-400/month** 💰

---

## 🔐 Security Notes

**Firewall:**

- ONLY ports 22/80/443 are open
- AI Router (port 8000) is internal only
- Access via nginx reverse proxy for external

**Credentials:**

- SSH password: fun2Gus!!!
- Database password: stored in ~/.robbie-ai/.env (chmod 600)
- No passwords in git repos

**Best Practices:**

- Keep system updated: `sudo apt update && sudo apt upgrade`
- Monitor logs: `sudo journalctl -u ai-router -f`
- Check firewall: `sudo ufw status`

---

## 📚 Next Steps

1. **Setup nginx reverse proxy** (port 80/443 → AI Router)
2. **Deploy Robbie personality system**
3. **Connect to TestPilot/HeyShopper**
4. **Setup backup/monitoring**
5. **Configure SSL certificates**

---

## 📞 Support

**If setup fails:**

1. Check logs: `sudo journalctl -u <service> -n 100`
2. Run status script: `~/robbie-ai/status.sh`
3. Check this guide's troubleshooting section
4. Document error and ask Allan

**Files to check:**

- `/home/allan/robbie-ai/.env` - credentials
- `/home/allan/robbie-ai/ai-router/ai_router.py` - AI Router code
- `/etc/systemd/system/ai-router.service` - service config
- `/home/allan/robbie-ai/QUICKSTART.md` - quick reference

---

**Setup script:** `deployment/setup-aurora-gpu-complete.sh`  
**This guide:** `deployment/AURORA_GPU_SETUP_INSTRUCTIONS.md`

🚀 **Your AI powerhouse awaits!**

