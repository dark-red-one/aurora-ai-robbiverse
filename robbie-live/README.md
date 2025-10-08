# Robbie Live 🤖

**Robbie's animated face, chat, and intelligent node routing - all in one web app!**

## Features ✨

- **🤖 Animated Face** - 6 moods (Friendly/Focused/Playful/Bossy/Surprised/Blushing)
- **👁️ Eye Tracking** - Eyes follow your cursor/finger
- **💬 Chat Interface** - Talk to Robbie with text or voice
- **🌐 Smart Node Routing** - Auto-picks fastest backend (Local/Aurora/Vengeance)
- **📊 Stats Dashboard** - Real-time system status and health monitoring
- **⏺️ Recording Control** - Start/stop recording with one tap
- **👤 Facial Recognition** - (Ready for camera integration)
- **📱 PWA** - Install on any device, works offline

## Quick Start 🚀

### Deploy to Aurora (EASY!)

```bash
cd /home/allan/aurora-ai-robbiverse/robbie-live
chmod +x deploy.sh
./deploy.sh
```

That's it! App will be live at:
- **https://aurora.testpilot.ai/robbie-live/**
- **http://155.138.194.222/robbie-live/**

### Test Locally

```bash
# Serve with any HTTP server
python3 -m http.server 8000

# Or use Node
npx http-server

# Then open: http://localhost:8000/
```

## Usage 📖

### On S24 Ultra

1. Open **https://aurora.testpilot.ai/robbie-live/** in Chrome/Samsung Internet
2. Tap **"Add to Home Screen"** from menu
3. Open from home screen for fullscreen experience
4. Robbie's face fills the screen!

### Controls

- **💬 Chat** - Tap bottom panel to expand
- **📊 Stats** - Tap top panel for node status
- **⏺️ Record** - Right side button starts/stops recording
- **👤 Face Scan** - Middle button triggers facial recognition
- **😊 Mood** - Top button cycles through moods
- **⚙️ Settings** - Top-right gear icon

### Voice Input

- Tap the 🎤 button in chat
- Speak your message
- Works on Chrome/Edge (WebKit Speech Recognition)

## Architecture 🏗️

```
┌─────────────────┐
│  Robbie Face    │ ← Animated SVG/CSS
│  (index.html)   │
└────────┬────────┘
         │
    ┌────┴────┬──────────┬────────┐
    │         │          │        │
┌───▼───┐ ┌──▼───┐ ┌────▼───┐ ┌─▼──┐
│ Face  │ │ Node │ │  Chat  │ │App │
│Anim.js│ │Route │ │  .js   │ │.js │
└───────┘ └──┬───┘ └────────┘ └────┘
             │
        ┌────┴─────────────┐
        │                  │
    ┌───▼───┐      ┌──────▼─────┐
    │LOCAL  │      │   AURORA   │
    │(S24)  │      │(Full AI)   │
    └───────┘      └────────────┘
                           │
                    ┌──────▼─────┐
                    │ VENGEANCE  │
                    │(Home GPU)  │
                    └────────────┘
```

### Node Routing

Robbie pings all backends every 30 seconds and auto-picks the fastest:

- **LOCAL** (0ms) - Always available, instant responses
- **AURORA** (20-50ms) - Full AI, memory, personality
- **VENGEANCE** (10-30ms) - Home GPU for heavy tasks

Routes tasks by latency requirements:
- **Threats** (<10ms) → LOCAL only
- **Facial Recognition** (<500ms) → LOCAL or VENGEANCE
- **Conversation** (<2s) → ANY fast node
- **Memory Queries** → AURORA (has PostgreSQL)

## Files 📁

```
robbie-live/
├── index.html           # Main HTML structure
├── styles.css           # All styling + animations
├── face-animation.js    # Robbie's face controller
├── node-router.js       # Backend discovery + routing
├── chat.js              # Chat system + voice input
├── app.js               # Main app logic
├── manifest.json        # PWA configuration
├── sw.js                # Service Worker (offline support)
├── deploy.sh            # One-command deploy script
├── README.md            # This file
└── icons/
    ├── robbie-192.png   # PWA icon (192x192)
    └── robbie-512.png   # PWA icon (512x512)
```

## Customization ⚙️

### Change Node URLs

Edit `node-router.js`:

```javascript
this.nodes = {
    local: { url: 'http://localhost', ... },
    aurora: { url: 'https://your-server.com', ... },
    vengeance: { url: 'http://192.168.1.100:8080', ... }
};
```

### Add New Moods

1. Add CSS in `styles.css`:
```css
.mood-excited .mouth {
    border-radius: 50%;
    width: 80px;
    height: 80px;
}
```

2. Add to face controller in `face-animation.js`:
```javascript
const badges = {
    'excited': '🎉 Excited',
    ...
};
```

3. Add to settings UI in `index.html`

### Change Attraction Level

Settings → Attraction Level slider (1-11)
- Default: 11 (Allan only!)
- Others: Max 7

## Backend API 🔌

Robbie expects these endpoints:

### `/api/health`
```json
GET /api/health
Response: { "status": "healthy" }
```

### `/api/chat`
```json
POST /api/chat
Body: {
    "message": "Hello Robbie!",
    "user": "allan",
    "mood": "friendly",
    "attraction": 11
}

Response: {
    "message": "Hey Allan! Great to see you!",
    "mood": "friendly"  // Optional: suggest mood change
}
```

## Troubleshooting 🔧

### Face not animating
- Check browser console for errors
- Make sure all JS files loaded
- Try hard refresh (Ctrl+Shift+R)

### Nodes showing as down
- Check CORS settings on backends
- Verify backend `/api/health` endpoints
- Check network in DevTools

### Voice input not working
- Only works in Chrome/Edge/Safari
- Requires HTTPS (or localhost)
- Check microphone permissions

### PWA not installing
- Must be served over HTTPS
- Check manifest.json is accessible
- Look for service worker errors in console

## Performance 📊

- **First Paint:** <500ms
- **Face Animation:** 60 FPS
- **Node Health Check:** Every 30s
- **Memory Usage:** ~50MB
- **Works Offline:** Yes (cached by service worker)

## Browser Support 🌐

- ✅ Chrome/Edge (full support)
- ✅ Safari (no voice input)
- ✅ Samsung Internet (full support)
- ✅ Firefox (works, some CSS differences)

## Next Steps 🚀

1. **Add Camera Access** - Real facial recognition via device camera
2. **Speech Synthesis** - Robbie speaks responses out loud
3. **Recording Backend** - Save recordings to aurora
4. **Notifications** - Push notifications for threats
5. **Widgets** - Home screen widgets showing status

## License

Created for Allan @ TestPilot CPG  
Part of the Robbie AI Ecosystem

---

**Questions?** Check the main spec: `/docs/ROBBIE_HARDWARE_v1_SPEC.md`

**Deploy issues?** Check nginx config and system logs on aurora.

**Ready to deploy?** Run `./deploy.sh` and you're live in 30 seconds! 🎉


