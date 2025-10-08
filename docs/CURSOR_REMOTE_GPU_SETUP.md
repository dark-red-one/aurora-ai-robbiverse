# CURSOR + REMOTE GPU - THE COMPLETE EXPLANATION & SETUP 📚🔥

Allan, you're coding on your MacBook, but your GPUs are on Aurora (155.138.194.222). Cursor needs to talk to Aurora's proxy to use those GPUs. Here's why it's failing and how to fix it:

## WHY IT'S NOT WORKING 🔍

**Current situation:**
```
Your MacBook running Cursor
    ↓
Cursor setting: http://localhost:8000/v1
    ↓
MacBook's localhost:8000 (NOTHING THERE ❌)
    ↓
Connection refused (502 error)
```

**What needs to happen:**
```
Your MacBook running Cursor
    ↓
SSH Tunnel → aurora.testpilot.ai:8000
    ↓
Aurora's proxy (running on port 8000)
    ↓
Vengeance GPU / RunPod GPU / CPU fallback
    ↓
Fast response back to Cursor ✅
```

## THE SOLUTION: SSH TUNNEL 🚇

An SSH tunnel makes Aurora's port 8000 appear as if it's running on your MacBook. This is secure, encrypted, and the standard way to access remote services.

---

## DETAILED SETUP INSTRUCTIONS 📋

### PHASE 1: CREATE THE SSH TUNNEL (2 minutes)

**Step 1.1: Open Terminal on MacBook**
- Press Cmd+Space, type "Terminal", hit Enter

**Step 1.2: Run the tunnel command**

Copy/paste this EXACT command:
```bash
ssh -L 8000:localhost:8000 allan@aurora.testpilot.ai -N
```

What each part means:
- `ssh` - Secure shell connection
- `-L 8000:localhost:8000` - Forward MacBook's port 8000 to Aurora's port 8000
- `allan@aurora.testpilot.ai` - Your username and Aurora's address
- `-N` - Don't open a shell, just maintain the tunnel

**Step 1.3: Enter your password**
- Type your Aurora SSH password
- Press Enter

**Step 1.4: Leave this terminal OPEN**
- The terminal will appear to "hang" with no output
- This is CORRECT behavior - the tunnel is working
- Do NOT close this terminal window
- Minimize it if you want, but keep it running

---

### PHASE 2: VERIFY THE TUNNEL WORKS (30 seconds)

**Step 2.1: Open a NEW terminal window**
- Cmd+N in Terminal, or open a new tab

**Step 2.2: Test the connection**

Run this command:
```bash
curl http://localhost:8000/v1/models
```

**EXPECTED RESULT (tunnel working):**
```json
{"object":"list","data":[{"id":"qwen2.5-coder:7b",...}]}
```

**IF YOU GET "Connection refused":**

The proxy isn't running on Aurora. Fix it:
```bash
# SSH into Aurora in this terminal
ssh allan@aurora.testpilot.ai

# Once on Aurora, check what's running on port 8000
lsof -i :8000

# If nothing is running, start your proxy
# (Use whatever command starts your proxy - you have this already)
# Example: python3 proxy.py or npm start, etc.
```

---

### PHASE 3: CONFIGURE CURSOR (90 seconds)

Now that the tunnel is working, configure Cursor:

**Step 3.1: Open Cursor Settings**
- Click ⚙️ icon (bottom-left corner)
- Click "Cursor Settings"
- Click "Models" (left sidebar)
- Scroll to "OpenAI API Keys"

**Step 3.2: Enter these EXACT settings**

**Override Base URL:**
- ☑️ Override OpenAI Base URL (check this box)
- Base URL field: `http://localhost:8000/v1`
  - (This now routes through your SSH tunnel to Aurora)

**API Key field:**
- `robbie-mesh`
  - (Any string works - just an identifier)

**Model Name field:**
- `qwen2.5-coder:7b`
  - (Must match EXACTLY what Ollama has on Aurora)

**Step 3.3: CRITICAL - Uncheck all cloud models**

Scroll through the model list and UNCHECK everything:
- ❌ GPT-4o
- ❌ GPT-4
- ❌ GPT-3.5-turbo
- ❌ Claude 3.5 Sonnet
- ❌ Claude 3 Opus
- ❌ ALL cloud models

ONLY check:
- ✅ qwen2.5-coder:7b

**Step 3.4: Verify**
- Click "Verify" button
- Wait for result

**EXPECTED:** ✅ Green checkmark

**IF RED X:**
- Go back to Phase 2, make sure tunnel test worked
- Make sure you unchecked ALL cloud models
- Try again

**Step 3.5: Save**
- Click "Save" or just close settings

---

### PHASE 4: TEST IN CURSOR CHAT (30 seconds)

**Step 4.1: Open Cursor Chat**
- Press Cmd+L

**Step 4.2: Check model dropdown**
- Look at bottom of chat panel
- Should say "qwen2.5-coder:7b"
- If not, click dropdown and select it

**Step 4.3: Ask a test question**

Type:
```
Explain async/await in JavaScript
```

**Step 4.4: Watch response time**
- **3-10 seconds:** ✅ GPU IS WORKING!
- **30-47 seconds:** ❌ Falling back to CPU (GPU unreachable)
- **Immediate 502 error:** ❌ Tunnel died or proxy crashed

---

## VERIFICATION CHECKLIST ✅

Run these to confirm everything is working:

**On MacBook (terminal where tunnel is running):**
- Should still be sitting there with no output
- If it shows "Connection closed" → Tunnel died, restart it

**On MacBook (new terminal):**
```bash
# Test tunnel still works
curl http://localhost:8000/v1/models

# Should return JSON model list
```

**In Cursor:**
- Model dropdown shows: `qwen2.5-coder:7b`
- Response comes back in <10 seconds
- No 502 errors

---

## MAKING IT PERMANENT 🎯

Right now, if you close the tunnel terminal, Cursor stops working. Let's fix that.

### Option A: Auto-reconnect SSH config (RECOMMENDED)

Edit `~/.ssh/config` on your MacBook:
```bash
# Open the config file
nano ~/.ssh/config
```

Add this:
```
Host aurora-tunnel
    HostName aurora.testpilot.ai
    User allan
    LocalForward 8000 localhost:8000
    ServerAliveInterval 60
    ServerAliveCountMax 3
    ExitOnForwardFailure yes
```

Save (Ctrl+X, Y, Enter)

Now you can just run:
```bash
ssh aurora-tunnel
```

The tunnel auto-creates and stays alive!

### Option B: Background persistent tunnel (ADVANCED)

Install `autossh` for auto-reconnecting:
```bash
# Install autossh (if you have Homebrew)
brew install autossh

# Run persistent tunnel
autossh -M 0 -f -N -L 8000:localhost:8000 allan@aurora.testpilot.ai
```

This runs in the background and auto-reconnects if it drops!

---

## TROUBLESHOOTING 🔧

### Problem: "Connection refused" when testing tunnel
**Cause:** Aurora's proxy isn't running  
**Fix:**
```bash
# SSH into Aurora
ssh allan@aurora.testpilot.ai

# Check what's on port 8000
sudo lsof -i :8000

# If nothing → start your proxy
# (Use your existing proxy startup command)
```

### Problem: Tunnel works but Cursor still gets 502
**Cause:** Cursor cached the old error  
**Fix:**
1. Close Cursor completely
2. Verify tunnel still works: `curl http://localhost:8000/v1/models`
3. Restart Cursor
4. Try again

### Problem: Responses are slow (30+ seconds)
**Cause:** Proxy is falling back to CPU instead of GPU  
**Fix:**
```bash
# SSH into Aurora
ssh allan@aurora.testpilot.ai

# Check proxy logs
tail -f /path/to/proxy/logs/*.log

# Look for "Trying vengeance" or "Falling back to CPU"
# If falling back → Vengeance/RunPod unreachable
```

### Problem: Tunnel keeps disconnecting
**Cause:** Network timeout or SSH server config  
**Fix:** Use the `ServerAliveInterval` config from "Making It Permanent" section above. This sends keepalive packets.

---

## QUICK REFERENCE CARD 📇

**Starting fresh each time:**
```bash
# Terminal 1: Start tunnel
ssh -L 8000:localhost:8000 allan@aurora.testpilot.ai -N

# Terminal 2: Verify
curl http://localhost:8000/v1/models

# Cursor: Use localhost:8000/v1
```

**With permanent config:**
```bash
# Just run once:
ssh aurora-tunnel

# Cursor works automatically
```

**Cursor settings:**
- Base URL: `http://localhost:8000/v1`
- API Key: `robbie-mesh`
- Model: `qwen2.5-coder:7b`
- Uncheck: All cloud models

---

## THE BOTTOM LINE 💡

1. Your MacBook can't directly access Aurora's GPU proxy.
2. SSH tunnel makes Aurora's port appear local.
3. Cursor talks to "localhost" which tunnels to Aurora.
4. Aurora's proxy routes to your GPU mesh.
5. **Result:** Fast AI responses in Cursor using your hardware!

Ready to execute? Start with Phase 1 - create that tunnel! 🚀💪

Got questions? Let me know where you're at! 🔥

