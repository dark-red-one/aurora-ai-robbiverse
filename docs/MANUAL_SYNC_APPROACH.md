# 🔧 MANUAL SYNC APPROACH - When Direct Pod-to-Pod Fails

**Issue:** RunPod-to-RunPod SSH connections not working (common network restriction)
**Solution:** Use MacBook as sync hub + manual deployment

## 🍎 **OPTION 1: MacBook-Orchestrated Sync**

### From MacBook, sync to all 3 pods:
```bash
# 1. Sync Aurora to MacBook first
rsync -avz --delete -e "ssh -p 24505" root@82.221.170.242:/workspace/aurora/ ~/aurora-sync/

# 2. Push from MacBook to Collaboration
rsync -avz --delete -e "ssh -p 43540" ~/aurora-sync/ root@213.181.111.2:/workspace/aurora/

# 3. Push from MacBook to Fluenti
rsync -avz --delete -e "ssh -p 19777" ~/aurora-sync/ root@103.196.86.56:/workspace/aurora/
```

## 🔧 **OPTION 2: Manual SSH Setup on Each Pod**

### Collaboration Pod Setup:
```bash
# SSH from your MacBook:
ssh root@213.181.111.2 -p 43540

# Once connected, run:
cd /workspace
rm -rf aurora 2>/dev/null  # Remove any old version
git clone https://github.com/dark-red-one/aurora-ai-robbiverse.git aurora
cd aurora
echo "✅ Collaboration pod synced with Aurora!"
```

### Fluenti Pod Setup:
```bash
# SSH from your MacBook:
ssh root@103.196.86.56 -p 19777

# Once connected, run:
cd /workspace
rm -rf aurora 2>/dev/null  # Remove any old version  
git clone https://github.com/dark-red-one/aurora-ai-robbiverse.git aurora
cd aurora
echo "✅ Fluenti pod synced with Aurora!"
```

## 🎯 **VERIFICATION:**

### Check all pods have same Aurora version:
```bash
# Test each pod:
ssh root@82.221.170.242 -p 24505 "cd /workspace/aurora && ls -la src/allanBotTraining.js"
ssh root@213.181.111.2 -p 43540 "cd /workspace/aurora && ls -la src/allanBotTraining.js"  
ssh root@103.196.86.56 -p 19777 "cd /workspace/aurora && ls -la src/allanBotTraining.js"
```

---
**Ready to try the MacBook orchestration approach?**
