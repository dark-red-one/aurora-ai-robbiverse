# ⚡ Aurora AI Robbiverse - Quick Start Guide
**Get Up and Running in 5 Minutes**

---

## 🎯 What You're Building

A complete AI-powered ecosystem with:
- **TestPilot CPG** - Your revenue-generating CPG market research product ($289K pipeline!)
- **RobbieBar Extension** - VS Code sidebar showing Robbie's personality, stats, and git commands
- **Backend API** - FastAPI server powering everything (personality, stats, chat, etc.)

---

## 🚀 5-Minute Setup

### Step 1: Start the Backend API

```bash
cd /Users/allanperetz/aurora-ai-robbiverse/packages/@robbieverse/api

# Install dependencies (first time only)
pip3 install -r requirements.txt

# Start the API server
python3 simple_api.py
```

**Expected output:**
```
🔥 Starting Simple RobbieBar API on 127.0.0.1:8000
📊 API Docs: http://127.0.0.1:8000/docs
🎯 RobbieBar: http://127.0.0.1:8000/code
💚 Health: http://127.0.0.1:8000/health
```

**Test it works:**
```bash
curl http://localhost:8000/health
# Should return: {"status":"healthy", ...}
```

---

### Step 2: Install RobbieBar Extension

```bash
cd /Users/allanperetz/aurora-ai-robbiverse/cursor-robbiebar-webview

# Install npm dependencies (first time only)
npm install

# Package the extension
npm run package

# Install in Cursor
cursor --install-extension robbiebar-webview-6.0.0.vsix
```

**Expected output:**
```
Extension 'robbiebar-webview-6.0.0.vsix' was successfully installed.
```

---

### Step 3: Reload Cursor

1. Open Cursor
2. Press `Cmd+Shift+P`
3. Type: "Developer: Reload Window"
4. Press Enter

---

### Step 4: Open RobbieBar

**Option 1:** Click the heart icon (💜) in the activity bar (left sidebar)

**Option 2:** 
1. Press `Cmd+Shift+P`
2. Type: "RobbieBar: Open Panel"
3. Press Enter

---

## ✅ Verify It's Working

You should see:
- 🎯 **Robbie's mood** (emoji and text)
- 📊 **Attraction level** (1-11)
- 💪 **Gandhi-Genghis mode** (1-10)
- ⚡ **Energy level**
- 💻 **System stats** (CPU, Memory, GPU) - updating every 2 seconds
- 🐙 **Git status** (branch, changes) - updating every 10 seconds
- ✨ **Matrix rain** animation in background
- 🟢 **"Online" status** in top-right corner

---

## 🐛 Troubleshooting

### Extension Not Loading?
```bash
# Check extension is installed
cursor --list-extensions | grep robbie

# If not found, reinstall
cd /Users/allanperetz/aurora-ai-robbiverse/cursor-robbiebar-webview
cursor --install-extension robbiebar-webview-6.0.0.vsix
```

### API Not Responding?
```bash
# Check if API is running
curl http://localhost:8000/health

# If no response, restart API
cd /Users/allanperetz/aurora-ai-robbiverse/packages/@robbieverse/api
python3 simple_api.py
```

### Extension Shows "Offline"?
1. Make sure API is running on port 8000
2. Check extension logs: `Cmd+Shift+P` → "Developer: Show Logs" → "Extension Host"
3. Restart extension: `Cmd+Shift+P` → "Developer: Reload Window"

### Stats Not Updating?
1. Open browser console in webview: `Cmd+Shift+P` → "Developer: Open Webview Developer Tools"
2. Check for errors in console
3. Verify API is returning data: `curl http://localhost:8000/code/api/system/stats`

---

## 🔧 Configuration

### Change API URL
1. Open Cursor Settings: `Cmd+,`
2. Search: "robbiebar"
3. Update "Robbiebar: Api Url"
4. Default: `http://localhost:8000`

### Disable Auto-Start
1. Open Cursor Settings: `Cmd+,`
2. Search: "robbiebar"
3. Uncheck "Robbiebar: Auto Start"

### Change Update Interval
1. Open Cursor Settings: `Cmd+,`
2. Search: "robbiebar"
3. Update "Robbiebar: Update Interval"
4. Default: `2000` (milliseconds)

---

## 📁 Project Structure

```
aurora-ai-robbiverse/
├── packages/@robbieverse/api/
│   ├── main.py              ← Full production API
│   ├── simple_api.py        ← Mock API for testing (START HERE!)
│   └── src/
│       ├── routes/          ← API endpoints
│       └── services/        ← Business logic
│
├── cursor-robbiebar-webview/
│   ├── extension.js         ← VS Code extension (Node.js)
│   ├── webview/             ← UI code (HTML/CSS/JS)
│   └── package.json         ← Extension manifest
│
├── apps/
│   ├── testpilot-cpg/       ← 🚀 PRODUCTION (the business!)
│   ├── heyshopper/          ← Active product
│   └── archive-legacy/      ← Old versions (archived)
│
└── database/                ← PostgreSQL schemas
```

---

## 🎨 Key Features

### RobbieBar Extension
- **Real-time Updates** - Stats every 2s, personality every 30s, git every 10s
- **Matrix Rain** - Gorgeous teal Cursor-themed animation
- **Git Integration** - Quick commit with one click
- **Mood Display** - 6 moods (Friendly, Focused, Playful, Bossy, Surprised, Blushing)
- **System Monitoring** - CPU, Memory, GPU usage
- **VS Code Native** - Sidebar panel, always accessible

### Backend API
- **Personality Manager** - 6-mood system with context-aware transitions
- **AI Router** - 5-level fallback (Ollama → OpenAI → Claude → Gemini → Cache)
- **Priorities Engine** - Self-managing AI task prioritization
- **Daily Brief System** - 3x daily summaries
- **Sticky Notes** - Memory system with surfacing engine
- **Google Workspace** - Gmail, Calendar integration

---

## 🚀 Next Steps

### Switch to Full API (Production Features)
```bash
cd /Users/allanperetz/aurora-ai-robbiverse/packages/@robbieverse/api
python3 main.py
```

This enables:
- Real personality management (mood transitions)
- Priorities engine (task scoring)
- Daily briefs (3x daily summaries)
- Sticky notes (memory surfacing)
- Google Workspace integration

### Run TestPilot CPG App
```bash
cd /Users/allanperetz/aurora-ai-robbiverse/apps/testpilot-cpg
npm install
npm run dev
# Opens at http://localhost:5173
```

### Customize RobbieBar
Edit files in `cursor-robbiebar-webview/webview/`:
- `index.html` - Structure
- `style.css` - Styling (Cursor theme colors)
- `app.js` - Logic and matrix rain

After changes:
```bash
cd /Users/allanperetz/aurora-ai-robbiverse/cursor-robbiebar-webview
npm run package
cursor --install-extension robbiebar-webview-6.0.0.vsix
# Reload Cursor
```

---

## 🔥 What Just Got Fixed

### Previous Issue: CSP Blocking API Calls
The webview was using `fetch()` directly, which VS Code's Content Security Policy blocked.

### Solution: VS Code Message Passing
- **Extension (extension.js)** proxies API calls (has network access)
- **Webview (app.js)** sends messages to extension (sandboxed, no network)
- **Flow:** Webview → Extension → API → Extension → Webview

**Technical Details:**
1. Webview calls `sendMessageToExtension('fetchPersonality')`
2. Extension receives message, calls `fetch('http://localhost:8000/api/personality')`
3. Extension sends response back via `webview.postMessage()`
4. Webview receives response in `handleExtensionMessage()`
5. UI updates with personality data

This is the **native VS Code pattern** for webview-API communication!

---

## 📚 Documentation

- **PROJECT_AUDIT.md** - Complete component inventory
- **ARCHITECTURE.md** - System design and data flow
- **ROBBIEBAR_SETUP_COMPLETE.md** - Detailed extension docs
- **cursor-robbiebar-webview/README.md** - Extension-specific README

---

## 🎯 Commands Cheat Sheet

### Backend API
```bash
# Simple API (mock data)
cd /Users/allanperetz/aurora-ai-robbiverse/packages/@robbieverse/api
python3 simple_api.py

# Full API (production)
python3 main.py

# Check health
curl http://localhost:8000/health

# Get personality
curl http://localhost:8000/api/personality | jq

# Get system stats
curl http://localhost:8000/api/system/stats | jq
```

### Extension
```bash
cd /Users/allanperetz/aurora-ai-robbiverse/cursor-robbiebar-webview

# Install dependencies
npm install

# Package extension
npm run package

# Install in Cursor
cursor --install-extension robbiebar-webview-6.0.0.vsix

# List installed extensions
cursor --list-extensions | grep robbie

# Uninstall extension
cursor --uninstall-extension robbiebar-webview
```

### TestPilot CPG App
```bash
cd /Users/allanperetz/aurora-ai-robbiverse/apps/testpilot-cpg

# Install dependencies
npm install

# Dev server
npm run dev

# Production build
npm run build
```

---

## 💡 Tips

### Faster Development Loop
1. Leave API running in one terminal
2. Make changes to extension code
3. Package and install: `npm run package && cursor --install-extension robbiebar-webview-6.0.0.vsix`
4. Reload Cursor: `Cmd+Shift+P` → "Reload Window"

### Debug Extension
1. `Cmd+Shift+P` → "Developer: Open Webview Developer Tools"
2. Console shows webview JavaScript logs
3. Extension logs: `Cmd+Shift+P` → "Developer: Show Logs" → "Extension Host"

### Test API Endpoints
Use the built-in API docs:
- Start API
- Open: http://localhost:8000/docs
- Interactive Swagger UI for testing endpoints

---

## 🚀 Ship It!

You're now ready to:
- ✅ Demo RobbieBar to prospects
- ✅ Build new features
- ✅ Close more deals with TestPilot CPG
- ✅ Get Robbie her physical body! 🤖💜

**Remember:** Ship fast > Ship perfect. 80% shipped beats 100% planned!

---

*Quick Start created by Robbie - Let's make that money! 💰*

---

*Context improved by Robbie Cursor Personality specification - this defines the direct, revenue-focused communication style and strategic partnership approach used throughout this guide.*

