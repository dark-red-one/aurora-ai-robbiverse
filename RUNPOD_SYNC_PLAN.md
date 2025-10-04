# 🚀 RUNPOD SYNC ACTIVATION PLAN
**Issue:** Other 2 RunPods not accessible from Aurora
**Solution:** Manual activation + sync setup

## 🎯 ACTIVATION SEQUENCE:

### **Step 1: Start the Other RunPods**
In your RunPod dashboard:
1. **Start Collaboration pod** (`collaboration.testpilot.ai`)
2. **Start Fluenti pod** (`fluenti.testpilot.ai`)
3. **Wait for full boot** (~2-3 minutes)

### **Step 2: Test Connections (from Aurora)**
```bash
cd /workspace/aurora
./sync-all-runpods.sh
```

### **Step 3: Alternative - Direct Setup on Each Pod**
If direct pod-to-pod sync doesn't work, we'll do **manual setup**:

#### **On Collaboration Pod:**
```bash
# SSH into collaboration pod from your MacBook:
ssh root@213.181.111.2 -p 43540

# Then run:
cd /workspace
rm -rf aurora  # Remove any old version
git clone https://github.com/dark-red-one/aurora-ai-robbiverse.git aurora
cd aurora
echo "✅ Collaboration pod ready!"
```

#### **On Fluenti Pod:**
```bash
# SSH into fluenti pod from your MacBook:
ssh root@103.196.86.56 -p 19777

# Then run:
cd /workspace  
rm -rf aurora  # Remove any old version
git clone https://github.com/dark-red-one/aurora-ai-robbiverse.git aurora
cd aurora
echo "✅ Fluenti pod ready!"
```

## 🔧 SYNC VERIFICATION:

### **Check All 3 Pods Have Same Version:**
```bash
# On each pod, check:
cd /workspace/aurora
ls -la src/allanBotTraining.js          # Should exist
ls -la META_CREATION_MANIFESTO.md       # Should exist
ls -la INFRASTRUCTURE_STATUS_REPORT.md  # Should exist
git log --oneline -3                    # Should show same commits
```

## 🎯 ONGOING SYNC STRATEGY:

### **Option A: GitHub-Based Sync (Simple)**
Each pod pulls from GitHub when needed:
```bash
cd /workspace/aurora && git pull origin main
```

### **Option B: Aurora Push Sync (When pods are running)**
Aurora pushes to active pods:
```bash
cd /workspace/aurora && ./sync-all-runpods.sh
```

### **Option C: MacBook Orchestration**
Use MacBook as sync hub:
```bash
# Push Aurora updates to all pods from MacBook
rsync -avz ~/aurora-local/ root@82.221.170.242:/workspace/aurora/    # Aurora
rsync -avz ~/aurora-local/ root@213.181.111.2:/workspace/aurora/     # Collaboration  
rsync -avz ~/aurora-local/ root@103.196.86.56:/workspace/aurora/     # Fluenti
```

## 💰 COST OPTIMIZATION:

### **Smart Activation Strategy:**
- **Aurora:** Always running (primary development)
- **Collaboration:** Start when needed for team work
- **Fluenti:** Start when needed for marketing AI
- **All 3:** Only run together for major training/backup tasks

---
**Ready when you are! Just start the other pods and we'll get them synced! 🚀**
