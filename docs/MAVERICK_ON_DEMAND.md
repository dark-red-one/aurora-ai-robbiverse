# Llama 4 Maverick - On-Demand Multi-GPU Setup

**Status:** On-demand deployment ready  
**Model:** Llama 4 Maverick (244GB, 400B params, 1M context)  
**Strategy:** Deploy only when needed, destroy after use

---

## 💰 Cost Analysis

### Current Always-On Setup
- **RTX 4090 RunPod:** $0.35-0.50/hour
- **Models:** qwen2.5:7b, llama3.1:8b
- **Cost:** ~$300/month
- **Handles:** 99% of workload ✅

### Maverick On-Demand
- **2x A100 80GB:** ~$3/hour
- **Deploy:** Only when needed
- **Usage scenarios:**
  - 1 hour/week = $12/month
  - 2 hours/week = $24/month
  - 1 hour/day = $90/month
  - Full-time = $2,160/month (don't do this!)

---

## 🎯 When to Use Maverick

**Perfect For:**
- Long documents (50K+ words) with 1M context
- Complex multimodal tasks (text + images)
- Strategic analysis requiring deep reasoning
- Technical documentation with images
- Large codebase analysis

**Overkill For:**
- Quick questions (use qwen2.5:7b)
- Code completion (use llama3.1:8b)
- Simple chat (use existing models)
- Daily operations

---

## 🚀 Quick Deploy Guide

### Step 1: Deploy RunPod
```bash
1. Go to: https://runpod.io/console/pods
2. Click "Deploy" or "GPU Pods"
3. Select: "2x A100 (80GB)" or "2x A100-SXM4-80GB"
4. Template: PyTorch 2.1+ with CUDA 12+
5. Storage: 300GB network volume
6. Ports: 11434, 8000, 22
7. Click "Deploy"
```

### Step 2: Setup Ollama on Pod
SSH to the new pod, then:
```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Start with multi-GPU support
export CUDA_VISIBLE_DEVICES=0,1
export OLLAMA_HOST=0.0.0.0:11434
nohup ollama serve > /tmp/ollama.log 2>&1 &
sleep 5

# Pull Maverick (will take 10-15 mins)
ollama pull llama4:maverick

# Verify
ollama list
nvidia-smi
```

### Step 3: Connect Aurora Town
From your local machine:
```bash
cd /home/allan/robbie_workspace/combined/aurora-ai-robbiverse

# Replace with your pod's IP and SSH port
./deployment/connect-maverick-pod.sh <POD_IP> <SSH_PORT>
```

Example:
```bash
./deployment/connect-maverick-pod.sh 213.181.111.2 12345
```

### Step 4: Test Maverick
```bash
# From Aurora Town
ssh root@aurora-town-u44170.vm.elestio.app

# Test direct connection
curl http://localhost:11435/api/tags

# Test inference
curl -X POST http://localhost:11435/api/generate \
  -H 'Content-Type: application/json' \
  -d '{"model": "llama4:maverick", "prompt": "Test"}'
```

---

## 🔄 Multi-Backend Gateway

Aurora Town gateway will route based on model:

**Architecture:**
```
Aurora Town Gateway (:8080)
  ├─ qwen2.5:7b    → RTX 4090 (port 11434)
  ├─ llama3.1:8b   → RTX 4090 (port 11434)
  └─ llama4:maverick → Multi-GPU Pod (port 11435) [on-demand]
```

**Update gateway** to support multiple backends:
- Port 11434: Always-on RTX 4090
- Port 11435: On-demand Maverick pod

---

## 🛑 Shutdown Procedure

When done with Maverick:

**Step 1: Stop tunnel on Aurora Town**
```bash
ssh root@aurora-town-u44170.vm.elestio.app
systemctl stop maverick-tunnel
systemctl disable maverick-tunnel
```

**Step 2: Terminate RunPod**
```bash
# Via web UI: https://runpod.io/console/pods
# Click pod → "Terminate"
```

**Cost saved:** $3/hour no longer running ✅

---

## 📊 Example Usage Patterns

### Weekly Strategic Analysis (Low Usage)
- Deploy Maverick pod: Friday 2pm
- Run 3-4 hour analysis session
- Terminate pod: Friday 6pm
- **Cost:** $12/week = $48/month

### Daily Power User (Medium Usage)  
- Deploy pod each morning
- Use 2-3 hours
- Terminate each evening
- **Cost:** $6-9/day = $180-270/month

### Always Available (High Usage)
- Keep pod running 24/7
- **Cost:** $2,160/month
- **Not recommended** - use smaller models instead

---

## 🎯 Recommended Pattern

**Default:** RTX 4090 with qwen2.5:7b and llama3.1:8b
- Fast, cheap, handles 99% of tasks
- Cost: ~$300/month

**When Needed:** Deploy Maverick
- 1-click deployment via RunPod UI
- Use for specific high-value tasks
- Destroy immediately after
- Incremental cost: $3/hour only when running

---

## 🔧 Files

```
deployment/
├── setup-maverick-on-demand.sh      # This guide
├── connect-maverick-pod.sh          # Auto-connect script
└── maverick-pod-template.json       # RunPod deployment template (in /tmp)

Aurora Town:
├── /etc/systemd/system/runpod-tunnel.service      # RTX 4090 (port 11434)
└── /etc/systemd/system/maverick-tunnel.service    # Maverick (port 11435)
```

---

## ✅ Current Status

**Production Setup:**
- ✅ Aurora Town: qwen2.5:7b, llama3.1:8b
- ✅ RunPod RTX 4090: Always-on inference
- ✅ Disk space: 415GB free (8% used)
- ✅ Ready for on-demand Maverick deployment

**Maverick:**
- 🔄 On-demand only (not deployed)
- 📋 1-click deployment ready
- 💰 Pay only when using

---

## 🚀 Quick Deploy Command

**When you need Maverick power:**

1. Deploy pod via RunPod UI (2x A100 80GB)
2. Get SSH details from pod dashboard
3. Run: `./deployment/connect-maverick-pod.sh <IP> <PORT>`
4. Use via Aurora Town gateway
5. Terminate pod when done

**Total time:** 15-20 minutes to deploy and connect

---

*Ship fast with small models. Deploy the beast only when you need it.* 🚀

