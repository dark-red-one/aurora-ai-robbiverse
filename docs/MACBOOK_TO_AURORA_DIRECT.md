# MacBook → Aurora GPU Access (DIRECT PATH) 🚀

**Status:** Ollama running on Aurora with 8 models ready  
**Path:** MacBook → SSH Tunnel → Aurora Ollama (port 11434)

---

## STEP 1: FIX SSH ACCESS (One-time)

Your MacBook's SSH key needs to be added to Aurora.

### Option A: Via Elestio Dashboard (FASTEST)
1. Go to https://elestio.app/
2. Find Aurora server (aurora-u44170)
3. Look for "SSH Keys" or "Access" section
4. Add this public key:
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOMN15Q5olKSddEDf2Dfpo2YobBHeNTbj19UaDDoNA/o aurora-mesh-20251006
```

### Option B: If you have Aurora root password
From your MacBook:
```bash
# This will prompt for password
ssh-copy-id -i ~/.ssh/id_ed25519.pub allan@aurora.testpilot.ai
```

---

## STEP 2: CREATE THE TUNNEL (From MacBook)

Once SSH works, run this in MacBook Terminal:

```bash
# Forward Aurora's Ollama port to your MacBook
ssh -L 11434:localhost:11434 allan@aurora.testpilot.ai -N
```

**Leave this terminal open!** (minimize it if you want)

---

## STEP 3: TEST THE CONNECTION (From MacBook)

Open a **new** terminal on MacBook:

```bash
# Should return list of 8 models
curl http://localhost:11434/v1/models
```

**Expected result:**
```json
{"object":"list","data":[{"id":"qwen2.5-coder:7b",...}]}
```

---

## STEP 4: CONFIGURE CURSOR (On MacBook)

1. **Open Cursor Settings** (⚙️ → Cursor Settings → Models)

2. **Override OpenAI Base URL:**
   - ☑️ Check "Override OpenAI Base URL"
   - Base URL: `http://localhost:11434/v1`
   - API Key: `ollama` (any string works)

3. **Select Model:**
   - Model dropdown: `qwen2.5-coder:7b`
   
4. **CRITICAL - Uncheck cloud models:**
   - ❌ GPT-4o
   - ❌ Claude 3.5 Sonnet
   - ❌ ALL cloud models
   - ✅ ONLY check your local model

5. **Click Verify** - should get green checkmark ✅

6. **Save** and close settings

---

## STEP 5: TEST IN CURSOR

1. Open Cursor Chat (Cmd+L)
2. Ask: "Explain async/await in JavaScript"
3. Watch response time:
   - **5-15 seconds = WORKING!** ✅
   - **Immediate error = tunnel died**

---

## MAKE IT PERMANENT 🔐

### Auto-Reconnecting Tunnel (RECOMMENDED)

Edit `~/.ssh/config` on your MacBook:
```bash
nano ~/.ssh/config
```

Add this:
```
Host aurora-ollama
    HostName aurora.testpilot.ai
    User allan
    LocalForward 11434 localhost:11434
    ServerAliveInterval 60
    ServerAliveCountMax 3
    ExitOnForwardFailure yes
```

Save (Ctrl+X, Y, Enter)

Now you can just run:
```bash
ssh aurora-ollama
```

The tunnel auto-creates and stays alive!

### Background Auto-Restart (ADVANCED)

Install autossh:
```bash
brew install autossh
```

Create launch agent:
```bash
mkdir -p ~/Library/LaunchAgents

cat > ~/Library/LaunchAgents/com.testpilot.aurora-tunnel.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.testpilot.aurora-tunnel</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/bin/autossh</string>
        <string>-M</string>
        <string>0</string>
        <string>-N</string>
        <string>-L</string>
        <string>11434:localhost:11434</string>
        <string>allan@aurora.testpilot.ai</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
EOF

# Load it (starts on every boot)
launchctl load ~/Library/LaunchAgents/com.testpilot.aurora-tunnel.plist
```

Tunnel now runs automatically! 🎯

---

## AVAILABLE MODELS ON AURORA

```
qwen2.5-coder:7b          ← BEST for coding (4.7 GB)
deepseek-coder:33b-instruct ← More powerful (18 GB)
codellama:13b-instruct      ← Alternative (7.4 GB)
deepseek-r1:7b              ← Reasoning model
llama3.1:8b                 ← General purpose
mistral:7b                  ← Fast general
qwen2.5:7b                  ← General purpose
```

---

## TROUBLESHOOTING

### "Connection refused" when testing
**Fix:** Make sure tunnel terminal is still running

### Cursor shows 502 error
**Fix:** 
1. Close Cursor completely
2. Verify tunnel: `curl http://localhost:11434/v1/models`
3. Restart Cursor

### "Permission denied (publickey)"
**Fix:** Your SSH key isn't on Aurora yet - do Step 1

### Responses are slow
**Note:** Aurora has no GPUs - it's running on CPU. For GPU speed, we need to connect Vengeance (your gaming PC) to the mesh.

---

## NEXT LEVEL: ADD YOUR GAMING PC GPUs 🔥

Once this works, we can add your Vengeance machine (with actual GPUs) to the mesh for 10x faster responses.

**For now:** This gets Cursor working with Aurora's CPU-based Ollama.

---

## QUICK REFERENCE

**Start tunnel (MacBook):**
```bash
ssh -L 11434:localhost:11434 allan@aurora.testpilot.ai -N
```

**Test (MacBook):**
```bash
curl http://localhost:11434/v1/models
```

**Cursor settings:**
- Base URL: `http://localhost:11434/v1`
- API Key: `ollama`
- Model: `qwen2.5-coder:7b`
- Uncheck all cloud models

---

**Ready to go!** Fix the SSH key issue in Step 1, then you're live! 🚀


