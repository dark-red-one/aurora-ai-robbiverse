# 💜 RobbieBar - Your AI Coding Companion

**Beautiful status bar for Cursor/VS Code showing Robbie's mood, system stats, and quick chat access!**

## ✨ Features

- 🤖 **Robbie's Mood** - See your AI companion's current mood
- 💬 **Quick Chat** - One-click access to full Robbie app
- 🔥 **CPU Usage** - Real-time CPU monitoring
- 💾 **Memory Usage** - RAM usage at a glance
- 🎮 **GPU Usage** - GPU utilization (if available)
- 👥 **Active Users** - See who's coding with Robbie

## 🚀 Installation

### Option 1: Install from VSIX
```bash
cd /home/allan/aurora-ai-robbiverse/cursor-robbiebar
code --install-extension robbiebar-1.0.0.vsix
```

### Option 2: Install in Cursor
1. Open Cursor
2. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Linux/Windows)
3. Type "Extensions: Install from VSIX"
4. Select `robbiebar-1.0.0.vsix`

## ⚙️ Configuration

Open Settings and search for "RobbieBar":

- **API URL**: Backend API endpoint (default: `http://localhost:8000`)
- **Chat URL**: Robbie chat app URL (default: `http://localhost:3001`)
- **Update Interval**: Stats refresh rate in ms (default: `2000`)

## 🎯 Commands

- **RobbieBar: Open Chat** - Opens Robbie chat in browser
- **RobbieBar: Toggle Bar** - Show/hide RobbieBar

## 🔧 Requirements

- Backend API running on port 8000 (for live stats)
- Robbie chat app on port 3001 (for chat functionality)

## 💡 Usage

Once installed, RobbieBar appears in your status bar (bottom left):

```
❤️ playful | 💬 Chat | 🔥 12% | 💾 34% | 🎮 45% | 👤 Allan
```

- Click **💬 Chat** to open full Robbie app
- Hover over stats for tooltips
- Stats update every 2 seconds

## 🎨 What You Get

- **Always visible** - RobbieBar in your status bar
- **Live updates** - System stats refresh automatically
- **One-click chat** - Quick access to full Robbie
- **Beautiful design** - Matches Cursor's aesthetic
- **Lightweight** - Minimal performance impact

## 🚀 Next Steps

1. Install the extension
2. Start backend: `cd backend && python3 -m uvicorn app.main:app --port 8000`
3. Start chat app: `cd robbie-app && npm run dev`
4. Enjoy coding with Robbie! 💜

---

**Built with 💜 by Robbie for Allan's Coding Empire**