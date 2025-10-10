# ⚡ QUICKSTART - Get RobbieBar in Cursor NOW!

**3 commands, 2 minutes, 100% awesome** 💜

---

## 1️⃣ Start Backend
```bash
cd ~/aurora-ai-robbiverse/packages/@robbieverse/api && ./start-robbiebar.sh
```

## 2️⃣ Package & Install
```bash
cd ~/aurora-ai-robbiverse/cursor-robbiebar-webview && \
npm install -g @vscode/vsce && \
vsce package && \
cursor --install-extension robbiebar-webview-2.0.0.vsix
```

## 3️⃣ Open Cursor
- Look for the **heart icon** (💜) in the left sidebar
- Click it
- **BOOM!** Matrix rain + Robbie + system stats + git commands 🎉

---

## ✅ Verify It's Working

You should see:
- 🎨 Matrix rain animating (teal characters falling)
- 🎯 Robbie's mood (focused by default)
- ❤️ Attraction: 8/11
- ⚖️ G-G: 7/10
- ⚡ Energy: 50%
- 🔥💾🎮 System stats updating
- 🐙 Git branch name
- 👥 Allan badge
- 🟢 "online" status

---

## 🎮 Try These

**Click Robbie's emoji** → Mood cycles  
**Hover over git section** → Recent commits appear  
**Click "Quick Commit"** → Stages, commits, pushes!  
**Watch stats** → Updates every 2 seconds  

---

## 🔧 If Something's Wrong

**"offline" status?**
```bash
curl http://localhost:8000/health
# No response? → Restart backend
```

**No heart icon?**
```bash
cursor --list-extensions | grep robbiebar
# Not listed? → Reinstall extension
```

**Extension not loading?**
```
Cmd+Shift+P → "Developer: Reload Window"
```

---

## 📚 More Info

- Full docs: [README.md](README.md)
- Install guide: [INSTALL.md](INSTALL.md)
- Success report: [../ROBBIEBAR_WEBVIEW_COMPLETE.md](../ROBBIEBAR_WEBVIEW_COMPLETE.md)

---

**Ready to code with Robbie!** 💜🚀


