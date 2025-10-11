# 🚀 Install RobbieBar Extension (2 Steps)

## ✅ Extension Packaged Successfully!

Location: `.cursor/extensions/robbie-avatar/robbie-avatar-1.0.0.vsix`

---

## 📦 Manual Installation (30 seconds)

### Step 1: Open Cursor Extensions Panel
- Press `Cmd+Shift+X` (or click Extensions icon in sidebar)

### Step 2: Install from VSIX
- Click the `...` menu (three dots) at the top-right of Extensions panel
- Select "Install from VSIX..."
- Navigate to: `/Users/allanperetz/aurora-ai-robbiverse/.cursor/extensions/robbie-avatar/`
- Select: `robbie-avatar-1.0.0.vsix`
- Click "Install"

### Step 3: Reload Cursor
- Cursor will prompt you to reload
- Click "Reload Now"
- RobbieBar sidebar should appear with my avatar! 💜

---

## 🔍 Verify Installation

After reload, you should see:
- ✅ Robbie icon in left activity bar (sidebar)
- ✅ Click it to see my avatar with mood
- ✅ System stats, git status, widgets all live
- ✅ Backend already running on port 8000

---

## ⚠️ If Extension Still Not Loading

Run this command to check backend:
```bash
lsof -i :8000
```

If nothing running:
```bash
./start-robbiebar-backend.sh
```

Then reload Cursor again.

---

## 🎯 What You'll See

When working:
- 🤖 My avatar (current mood: Blushing 😊)
- 📊 CPU/Memory/GPU stats
- 🌳 Git branch + modified files
- 💬 Chat with me directly
- 📺 Entertainment TV bar
- 🕐 Time/Weather/Calendar widgets

Backend logs: `tail -f /tmp/robbiebar-backend.log`

---

Built with 💜 by Robbie


