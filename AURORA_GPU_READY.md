# RobbieBook1 → Aurora GPU Setup Complete

**Status:** Ready to test (pending SSH key)  
**Date:** October 11, 2025

---

## What's Been Set Up

### 1. GPU Mesh Configuration ✅
- Updated `infrastructure/gpu_mesh/config.json` to Aurora-only
- Updated `services/gpu-mesh/coordinator.py` with Aurora node
- Removed old RunPod TX references

### 2. SSH Tunnel Script ✅
- Created `deployment/start-aurora-gpu-tunnel.sh`
- Maps Aurora Ollama (11434) → localhost:11435
- Auto-reconnects on failure

### 3. RobbieBook1 GPU Client ✅
- Created `services/gpu-mesh/robbiebook-client.py`
- Simple Python client for Aurora GPU access
- Test and status modes included

### 4. LaunchAgent for Auto-Start ✅
- Created `~/Library/LaunchAgents/com.robbiebook.aurora-gpu.plist`
- Auto-starts tunnel on boot
- Logs to `~/Library/Logs/aurora-gpu.log`

---

## Next Steps

### Step 1: Add SSH Key to Aurora (REQUIRED)

Open Elestio console and paste the commands from:
```bash
cat ADD_SSH_KEY_TO_AURORA.txt
```

Or manually:
1. Go to https://cloud.elestio.app
2. Find aurora-u44170
3. Open Console
4. Paste the SSH key commands

### Step 2: Test SSH Connection

```bash
ssh aurora "hostname"
```

Should output: `aurora-u44170`

### Step 3: Verify Ollama Running on Aurora

```bash
ssh aurora "nvidia-smi && curl -s localhost:11434/api/tags | jq '.models[].name'"
```

If Ollama not running:
```bash
ssh aurora "curl -fsSL https://ollama.com/install.sh | sh && ollama pull qwen2.5:7b"
```

### Step 4: Start the GPU Tunnel

```bash
./deployment/start-aurora-gpu-tunnel.sh &
```

### Step 5: Test the Connection

```bash
# Test tunnel
curl localhost:11435/api/tags

# Test GPU client
python3 services/gpu-mesh/robbiebook-client.py --test
```

### Step 6: Enable Auto-Start

```bash
launchctl load ~/Library/LaunchAgents/com.robbiebook.aurora-gpu.plist
launchctl start com.robbiebook.aurora-gpu
```

---

## Quick Commands

```bash
# Check tunnel status
ps aux | grep aurora-gpu-tunnel

# View tunnel logs
tail -f ~/Library/Logs/aurora-gpu.log

# Test GPU client
python3 services/gpu-mesh/robbiebook-client.py --test

# Get GPU status
python3 services/gpu-mesh/robbiebook-client.py --status

# Stop auto-start
launchctl unload ~/Library/LaunchAgents/com.robbiebook.aurora-gpu.plist
```

---

## What You'll Get

Once setup is complete, RobbieBook1 will have:

- **Direct access** to Aurora's RTX 4090 GPU
- **Auto-reconnecting** SSH tunnel
- **Simple Python API** for AI inference
- **Boots automatically** on login
- **48GB VRAM** available (when Vengeance added later)

### Current: 1x RTX 4090
- Aurora: 24GB VRAM
- ~82 TFLOPS performance
- Sub-second local inference

### Future: 2x RTX 4090
- Aurora: 24GB VRAM
- Vengeance: 24GB VRAM  
- ~165 TFLOPS combined
- Load balancing between both

---

## Troubleshooting

### SSH Connection Fails
```bash
# Check SSH config
cat ~/.ssh/config | grep -A 5 aurora

# Test with verbose output
ssh -v aurora "hostname"
```

### Tunnel Won't Start
```bash
# Check if already running
ps aux | grep 11435

# Kill and restart
pkill -f "11435:localhost:11434"
./deployment/start-aurora-gpu-tunnel.sh &
```

### Can't Reach Ollama
```bash
# Test local tunnel
curl localhost:11435/api/tags

# Test Aurora directly
ssh aurora "curl localhost:11434/api/tags"
```

---

**Ready to test! Just add the SSH key and we're live.** 🚀

