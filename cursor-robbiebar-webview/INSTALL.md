# 🚀 Quick Install - RobbieBar for Cursor

**Get RobbieBar running in Cursor in under 5 minutes!**

---

## Step 1: Start the Backend

```bash
cd /Users/allanperetz/aurora-ai-robbiverse/packages/@robbieverse/api
./start-robbiebar.sh
```

**Check it's running**:
```bash
curl http://localhost:8000/health
# Should return: {"status":"healthy","service":"robbiebar"...}
```

---

## Step 2: Package the Extension

```bash
cd /Users/allanperetz/aurora-ai-robbiverse/cursor-robbiebar-webview

# Install vsce if needed
npm install -g @vscode/vsce

# Package
vsce package
```

This creates `robbiebar-webview-2.0.0.vsix`

---

## Step 3: Install in Cursor

```bash
cursor --install-extension robbiebar-webview-2.0.0.vsix
```

Or manually:
1. Open Cursor
2. `Cmd+Shift+P` → "Extensions: Install from VSIX"
3. Select `robbiebar-webview-2.0.0.vsix`

---

## Step 4: Open RobbieBar

**Method 1**: Click the heart icon (💜) in the activity bar (left side)

**Method 2**: `Cmd+Shift+P` → "RobbieBar: Open Panel"

**Method 3**: It opens automatically on startup!

---

## 🎉 Done!

You should now see:
- 🎨 Matrix rain animating in the background
- 🤖 Robbie's personality (mood, attraction 11/11, G-G mode)
- 🔥💾🎮 System stats updating
- 🐙 Git status with your branch
- 💾 Quick Commit button

---

## 🔧 Quick Test

1. **Click Robbie's emoji** → Mood should cycle
2. **Hover over git section** → Recent commits panel appears
3. **Watch system stats** → Should update every 2 seconds
4. **Check status indicator** → Should show "online" (green dot)

---

## ⚠️ Troubleshooting

**"offline" status?**
→ Check backend is running: `./start-robbiebar.sh`

**Matrix rain not showing?**
→ Refresh webview: `Cmd+R` in the panel

**Extension not appearing?**
→ Check Extensions panel, search "RobbieBar"
→ Reload window: `Cmd+Shift+P` → "Reload Window"

---

**Need more details?** See [README.md](README.md)

**Ready to code!** 💜🚀


