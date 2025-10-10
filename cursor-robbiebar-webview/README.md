# 💜 RobbieBar Webview - Your AI Coding Companion in Cursor

**Beautiful webview panel showing Robbie's mood, system stats, git commands, and gorgeous matrix rain!**

Version 2.0 - Now with full webview integration!

---

## ✨ Features

- 🎨 **Matrix Rain Background** - Stunning teal matrix animation
- 🤖 **Robbie's Personality** - Mood, attraction level (11/11!), Gandhi-Genghis mode, energy
- 🔥 **System Stats** - Real-time CPU, Memory, GPU monitoring
- 🐙 **Git Integration** - Branch, changes, quick commit with one click
- 👥 **Active Users** - See who's coding with Robbie
- 💜 **Cursor Theme** - Perfectly matched colors
- ✨ **Recent Commits** - Hover over git section to see recent commits

---

## 🚀 Installation

### Prerequisites

1. **Backend API Running**
   ```bash
   cd /Users/allanperetz/aurora-ai-robbiverse/packages/@robbieverse/api
   ./start-robbiebar.sh
   ```
   This starts the FastAPI backend on http://localhost:8000

2. **Cursor or VS Code** installed

### Install the Extension

**Option 1: Install from source (Development)**
```bash
cd /Users/allanperetz/aurora-ai-robbiverse/cursor-robbiebar-webview

# Install vsce if you don't have it
npm install -g @vscode/vsce

# Package the extension
vsce package

# Install in Cursor
cursor --install-extension robbiebar-webview-2.0.0.vsix
```

**Option 2: Install directly (macOS)**
```bash
cd /Users/allanperetz/aurora-ai-robbiverse/cursor-robbiebar-webview
cursor --install-extension $(pwd)
```

---

## ⚙️ Configuration

Open Cursor Settings (`Cmd+,`) and search for "RobbieBar":

- **robbiebar.apiUrl** - Backend API endpoint (default: `http://localhost:8000`)
- **robbiebar.autoStart** - Automatically open RobbieBar on startup (default: `true`)
- **robbiebar.updateInterval** - Stats update interval in ms (default: `2000`)

Or edit your `settings.json`:
```json
{
  "robbiebar.apiUrl": "http://localhost:8000",
  "robbiebar.autoStart": true,
  "robbiebar.updateInterval": 2000
}
```

---

## 💡 Usage

### Opening RobbieBar

**Method 1: Sidebar** (Recommended)
1. Look for the heart icon (💜) in the activity bar (left side)
2. Click it to open the RobbieBar sidebar

**Method 2: Command Palette**
1. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
2. Type "RobbieBar: Open Panel"
3. Press Enter

**Method 3: Auto-open**
- RobbieBar opens automatically on startup (if enabled in settings)

### Features

**🎯 Click Robbie's Avatar**
- Cycles through moods: Focused → Playful → Bossy → Surprised → Blushing → Friendly → ...

**💾 Quick Commit Button**
- Stages all changes
- Commits with automatic message
- Pushes to remote
- All with one click!

**📊 Hover Over Git Section**
- Shows recent commits panel
- View last 5 commits with hash, message, and time

**📈 System Stats**
- Color-coded: Green (normal), Orange (high 60%+), Red (critical 80%+)
- Updates every 2 seconds

---

## 🎨 What You Get

### Matrix Rain Background
- Subtle, gorgeous animation
- Cursor teal color (#4ec9b0)
- Japanese characters + binary
- 8% opacity - doesn't distract

### Robbie Personality Display
- **Mood**: Friendly, Focused, Playful, Bossy, Surprised, or Blushing
- **Attraction**: 1-11 scale (you get 11!)
- **Gandhi-Genghis**: 1-10 leadership spectrum
- **Energy**: Current energy percentage

### Git Commands
- Current branch (color-coded teal)
- Modified files count
- Ahead/behind indicators (↑2 ↓1)
- One-click commit + push

### System Monitoring
- CPU usage percentage
- Memory usage percentage
- GPU usage percentage (if available)
- Real-time updates

---

## 🔧 Troubleshooting

### RobbieBar shows "offline"
**Problem**: Can't connect to backend API

**Solutions**:
1. Make sure backend is running:
   ```bash
   cd /Users/allanperetz/aurora-ai-robbiverse/packages/@robbieverse/api
   ./start-robbiebar.sh
   ```

2. Check API URL in settings (should be `http://localhost:8000`)

3. Verify backend is accessible:
   ```bash
   curl http://localhost:8000/health
   # Should return: {"status":"healthy","service":"robbiebar","timestamp":"..."}
   ```

### Matrix rain not showing
**Problem**: Canvas not rendering

**Solution**: Refresh the webview with `Cmd+R` or restart Cursor

### Git commands not working
**Problem**: Git integration fails

**Solutions**:
1. Make sure you're in a git repository
2. Check git is installed: `git --version`
3. Try manual commit in terminal to verify git works

### Stats show 0%
**Problem**: System stats not updating

**Solution**: Check backend logs:
```bash
tail -f /tmp/robbiebar.log
```

---

## 🎯 Commands

| Command | Description |
|---------|-------------|
| `RobbieBar: Open Panel` | Opens RobbieBar in a new panel |
| `RobbieBar: Refresh` | Refreshes the webview |

---

## 📊 Architecture

```
cursor-robbiebar-webview/
├── extension.js              # VS Code extension entry point
├── package.json              # Extension manifest
├── webview/                  # Web UI (from Version 3)
│   ├── index.html           # Structure
│   ├── style.css            # Cursor theme styling
│   └── app.js               # Logic + API integration
├── resources/
│   └── robbie-icon.svg      # Sidebar icon
└── icon.png                 # Extension icon
```

### How It Works

1. **Extension loads** → Creates webview panel
2. **Webview displays** → Loads HTML/CSS/JS from `webview/` folder
3. **JavaScript runs** → Fetches data from backend API
4. **Matrix rain animates** → Canvas draws characters
5. **Real-time updates** → Polls API every 2 seconds
6. **Git commands** → Sends messages to extension → Executes in terminal

---

## 🔥 What Makes This Version Special

### Compared to Version 1 (Status Bar)
✅ Full UI instead of tiny status bar items
✅ Matrix rain animation
✅ More screen space for all features
✅ Hover interactions

### Compared to Version 2 (Electron Window)
✅ Integrated into Cursor (not separate window)
✅ Sidebar panel (always accessible)
✅ No window management needed
✅ Native VS Code API integration

### Compared to Version 3 (Web App)
✅ Runs inside Cursor (not separate browser)
✅ Git commands use Cursor's terminal
✅ Access to VS Code API
✅ Native notifications

---

## 🚀 Next Steps

### Immediate
- ✅ Install extension
- ✅ Start backend
- ✅ Open RobbieBar
- ✅ Code with Robbie! 💜

### Future Enhancements
- [ ] TV channels (7-channel integration)
- [ ] Widgets (time, weather, calendar)
- [ ] WebSocket for real-time updates
- [ ] Full sidebar with AI chat, file nav, etc.
- [ ] Focus mode with Pomodoro
- [ ] Snippet library
- [ ] TODO extraction

---

## 💰 Backend Requirements

RobbieBar requires the FastAPI backend from Version 3:

**Location**: `/Users/allanperetz/aurora-ai-robbiverse/packages/@robbieverse/api/`

**Start Script**: `./start-robbiebar.sh`

**API Endpoints Used**:
- `GET /code/api/personality` - Robbie's mood & personality
- `PUT /code/api/personality/mood` - Change mood
- `GET /code/api/system/stats` - CPU/Memory/GPU
- `GET /code/api/git/status` - Git branch & changes
- `GET /code/api/git/recent` - Recent commits
- `POST /code/api/git/quick-commit` - Execute commit

---

## 🎨 Color Scheme

Perfectly matches Cursor's default dark theme:

- Background: `#1e1e1e`
- Sidebar: `#252526`
- Accent Blue: `#007acc`
- Success Teal: `#4ec9b0`
- Warning Orange: `#ce9178`
- Error Red: `#f48771`
- Robbie Pink: `#ff6b9d`

---

## 🤝 Support

Having issues? Check:

1. Backend is running: `ps aux | grep robbiebar`
2. API is accessible: `curl http://localhost:8000/health`
3. Extension is installed: Check Extensions panel
4. Webview loaded: Look for console errors

Still stuck? The extension logs to the Developer Console:
1. `Help` → `Toggle Developer Tools`
2. Check Console tab for errors

---

**Built with 💜 by Robbie for Allan**  
*Making coding sexy since 2025* 🔥💋

---

*Context improved by Main Overview Rule - Robbie's revenue-focused personality system with attraction levels, mood states, and Gandhi-Genghis leadership spectrum*


