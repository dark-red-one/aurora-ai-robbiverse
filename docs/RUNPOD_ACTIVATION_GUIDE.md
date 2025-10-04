# 🚀 RUNPOD ACTIVATION & SYNC GUIDE
**Current Status:** Aurora online, Collaboration + Fluenti offline
**Goal:** Get all 3 pods running and synced

## 🎯 CURRENT NETWORK STATE:

### ✅ **Aurora Pod (ONLINE - Authority)**
- **IP:** 82.221.170.242:24505
- **Status:** Running, fully operational
- **Role:** Primary development, sync authority
- **GPUs:** 2x RTX 4090

### ❌ **Collaboration Pod (OFFLINE - Guest House)**
- **IP:** 213.181.111.2:43540  
- **Future DNS:** `collaboration.testpilot.ai`
- **Role:** Contractor workspace
- **GPUs:** 1x RTX 4090
- **Status:** Needs activation

### ❌ **Fluenti Pod (OFFLINE - Company Town)**
- **IP:** 103.196.86.56:19777
- **Future DNS:** `fluenti.testpilot.ai` 
- **Role:** FluentMarketing.com operations
- **GPUs:** 1x RTX 4090  
- **Status:** Needs activation

## 🔧 ACTIVATION SEQUENCE:

### **Step 1: Start Pods in RunPod Dashboard**
1. **Log into RunPod dashboard**
2. **Start Collaboration pod** (`7k1blgn8pa3k43`)
3. **Start Fluenti pod** (`n4zcnj47dy7q05`) 
4. **Wait 2-3 minutes** for full boot

### **Step 2: Test Direct IP Access**
```bash
cd /workspace/aurora
./sync-all-runpods.sh
```

### **Step 3: Manual Sync (if direct pod-to-pod fails)**
From your **MacBook**, SSH to each pod and set up Aurora:

#### **Collaboration Pod Setup:**
```bash
# From MacBook:
ssh root@213.181.111.2 -p 43540

# On collaboration pod:
cd /workspace
rm -rf aurora  # Clean slate
git clone https://github.com/dark-red-one/aurora-ai-robbiverse.git aurora
cd aurora
echo "✅ Collaboration guest house ready for contractors!"
```

#### **Fluenti Pod Setup:**
```bash
# From MacBook:  
ssh root@103.196.86.56 -p 19777

# On fluenti pod:
cd /workspace
rm -rf aurora  # Clean slate
git clone https://github.com/dark-red-one/aurora-ai-robbiverse.git aurora
cd aurora
echo "✅ Fluenti company town ready for marketing!"
```

## 🎯 SYNC VERIFICATION:

### **Check All 3 Pods Match:**
On each pod, verify key files exist:
```bash
cd /workspace/aurora
ls -la src/allanBotTraining.js               # ✅ Should exist
ls -la META_CREATION_MANIFESTO.md           # ✅ Should exist  
ls -la INFRASTRUCTURE_STATUS_REPORT.md      # ✅ Should exist
ls -la sync-all-runpods.sh                  # ✅ Should exist
echo "Pod hostname: $(hostname)"
nvidia-smi --query-gpu=name --format=csv,noheader
```

## 🏗️ FUTURE: DNS SETUP

### **When Ready for testpilot.ai DNS:**
```bash
# DNS mapping needed:
collaboration.testpilot.ai → 213.181.111.2
fluenti.testpilot.ai → 103.196.86.56  
aurora.testpilot.ai → 82.221.170.242
vengeance.testpilot.ai → (dynamic, future Linux machine)
```

## 💰 COST OPTIMIZATION STRATEGY:

### **Smart Activation:**
- **Aurora:** Always running (development hub)
- **Collaboration:** Start when contractors working
- **Fluenti:** Start when marketing campaigns active
- **All 3:** Only for major AI training or backup operations

### **Typical Usage:**
```bash
# When contractors need access:
# 1. Start collaboration pod
# 2. Sync latest Aurora
# 3. Contractors use 213.181.111.2:43540

# When marketing campaigns:
# 1. Start fluenti pod  
# 2. Sync marketing tools
# 3. Marketing uses 103.196.86.56:19777
```

---
**Ready to activate when you need contractor/marketing access! 🚀**
