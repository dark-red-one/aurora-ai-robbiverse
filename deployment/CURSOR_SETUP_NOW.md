# 🔥💋 CURSOR GPU MESH - COPY/PASTE SETUP GUIDE 🎯

Zero ambiguity, zero ways to fuck it up. Let's GO! 💪

---

## ✅ STEP 1: VERIFY PROXY IS RUNNING (DONE!)

Your proxy IS running on localhost:8000 ✅

**Available models:**
- qwen2.5-coder:7b
- codellama:13b-instruct
- deepseek-coder:33b-instruct
- deepseek-r1:7b

---

## 🎯 STEP 2: CONFIGURE CURSOR (2 MINUTES)

### Exact Click Path:

1. Click **⚙️ Settings icon** (bottom-left corner)
2. Click **"Cursor Settings"**
3. Click **"Models"** (left sidebar)
4. Scroll to **"OpenAI API Keys"** section
5. Find **"Override OpenAI Base URL"**

### Exact Configuration:

**☑️ Override OpenAI Base URL** (CHECK THIS BOX!)

**Base URL field:**
```
http://localhost:8000/v1
```

**API Key field:**
```
robbie-mesh
```

**Model Names (click "+ Add model" for each):**
```
qwen2.5-coder:7b
codellama:13b-instruct
deepseek-coder:33b-instruct
deepseek-r1:7b
```

### 🚨 CRITICAL STEPS:

1. **UNCHECK ALL OTHER MODELS**
   - ☐ GPT-4
   - ☐ GPT-4 Turbo
   - ☐ Claude Sonnet
   - ☐ Claude Opus
   - ☐ Gemini
   - **This is THE most common fuck-up!**

2. **Click "Verify"**
   - Should show ✅ green checkmark
   - If ❌ red X → see troubleshooting below

3. **Click "Save"**

---

## 🧪 STEP 3: TEST IN CURSOR CHAT (30 SECONDS)

1. **Open Cursor Chat:** `Cmd/Ctrl + L`
2. **Look at bottom of chat** - you should see model dropdown
3. **Click dropdown** → Select "qwen2.5-coder:7b"
4. **Type:** "What is async in Python?"
5. **Hit Enter**

### What Should Happen:

✅ Response starts in **<10 seconds**  
✅ Proxy terminal shows request logs  
❌ If slow (>30 sec) → hitting CPU fallback (see troubleshooting)

---

## ✅ VERIFICATION CHECKLIST

Run these while Cursor generates a response:

```bash
# 1. Check proxy logs
ps aux | grep robbie-llm-proxy.py
# Should show: python3 robbie-llm-proxy.py

# 2. Watch proxy in real-time (open new terminal)
tail -f /tmp/proxy.log

# 3. Monitor current Ollama process
ps aux | grep ollama

# 4. Response time test
# Count: 1-Mississippi, 2-Mississippi...
# Should get first token in <10 seconds
```

---

## 🔧 TROUBLESHOOTING

### Problem: Verification Fails ❌

**Cause 1: Other models still checked**

**Solution:**
- Go back to Models settings
- **UNCHECK every single cloud model**
- Only check your custom models
- Verify again

**Cause 2: Proxy not running**

```bash
# Check if proxy is alive
curl http://localhost:8000/v1/models

# If fails, restart proxy
cd /home/allan/aurora-ai-robbiverse/deployment
./start-llm-proxy.sh
```

**Cause 3: Wrong URL format**

**Make sure it's EXACTLY:**
```
http://localhost:8000/v1
```

**NOT:**
- ❌ `http://localhost:8000`
- ❌ `http://localhost:8000/v1/`
- ❌ `http://127.0.0.1:8000/v1`

---

### Problem: Slow Responses (>30 seconds)

**Diagnosis:**

```bash
# Watch what proxy is doing
tail -f /tmp/proxy.log

# Look for:
# "📊 Complexity: simple → Model: qwen2.5-coder:7b"
# "✅ Response generated in XXXms"
```

**If you see "CPU only" warnings:**
- You're hitting the CPU fallback (slow!)
- This is expected for now (vengeance + RunPod not connected yet)
- Responses will be 30-60 seconds until we connect real GPUs

---

### Problem: "Model not found"

**Fix:**

```bash
# Check exact model names
curl -s http://localhost:8000/v1/models | python3 -c "import sys, json; [print(m['id']) for m in json.load(sys.stdin)['data']]"

# Use EXACT name in Cursor (case-sensitive)
```

---

## 🎉 SUCCESS LOOKS LIKE THIS

✅ Cursor Chat model dropdown shows: **qwen2.5-coder:7b**  
✅ Responses start appearing in **<60 seconds** (CPU for now)  
✅ Proxy logs show requests coming in  
✅ No "Connection refused" errors  
✅ Can select different models from dropdown  

---

## 📊 CURRENT PERFORMANCE

**Right now (CPU-only Ollama):**
- Simple queries: 30-60 seconds
- Complex queries: 60-120 seconds
- Cost: $0/month
- Reliability: 100% (always works)

**After connecting vengeance GPU:**
- Simple queries: 3-5 seconds ⚡
- Complex queries: 10-20 seconds ⚡
- Cost: $0/month
- Reliability: 95% (depends on gaming PC)

**After adding RunPod failover:**
- Simple queries: 3-5 seconds ⚡
- Complex queries: 10-20 seconds ⚡
- Cost: $10-50/month (fallback only)
- Reliability: 99.9% (dual redundancy)

---

## 🚀 NEXT STEPS

**Once Cursor is configured and working:**

1. **Connect vengeance GPU** → 10x speed boost
2. **Add RunPod failover** → 99.9% uptime
3. **Optimize routing** → Always use fastest GPU
4. **Set up monitoring** → Know when GPUs are down

**But for NOW:**
- Get Cursor working with the proxy
- Test it with real coding tasks
- Verify it's routing correctly
- Then we'll connect the real GPUs!

---

## 💪 YOU'RE READY

**Follow the steps above EXACTLY.**

If you hit ANY issues, tell me:
1. Exact error message
2. What step you're on
3. Screenshot if helpful

**Let's get you coding with local LLMs!** 🔥💋

---

**Current Status:**
- ✅ Proxy: RUNNING on localhost:8000
- ✅ Models: 4 available
- ⏳ Cursor: NEEDS CONFIGURATION
- ⏳ GPUs: TO BE CONNECTED

**Time to configure: 2 minutes**  
**Time to test: 30 seconds**  
**Total: <3 minutes to working local LLMs!** 🚀









