# 🎯 ROBBIEBAR BUILD PLAN
*Exactly What Allan Wants*

## 📋 REQUIREMENTS

### **What You Want:**
1. ✅ **Robbie Avatar with Mood** - Shows current mood, clickable
2. ✅ **Button to Open Chat App** - One-click to full Robbie app
3. ✅ **System Resources** - CPU, Memory, GPU usage
4. ✅ **Matrix Background** - Subtle, Robbie-themed
5. ✅ **Active Users** - Who's using RobbieBar (You + Andre eventually)

---

## 🏗️ IMPLEMENTATION APPROACH

### **Option 1: HTML Injection (Fastest)**
- Inject HTML/CSS/JS into Cursor
- Works immediately
- Easy to iterate

### **Option 2: VS Code Extension (Proper)**
- Build as proper extension
- More stable
- Takes longer

**Decision: Start with Option 1, upgrade to Option 2 later**

---

## 📐 LAYOUT (Top Bar - 40px height)

```
┌─────────────────────────────────────────────────────────────────┐
│ 🤖 Mood  |  💬 Chat  |  🔥12% 💾34% 🎮45%  |  👥 Allan, Andre  │
└─────────────────────────────────────────────────────────────────┘
```

### **Sections:**
1. **Robbie Avatar + Mood** (100px)
   - Avatar image
   - Current mood text
   - Click to cycle mood

2. **Chat Button** (80px)
   - "💬 Open Chat" button
   - Opens full Robbie app

3. **System Resources** (200px)
   - CPU usage %
   - Memory usage %
   - GPU usage %
   - Real-time updates

4. **Active Users** (flex)
   - User avatars
   - Online status
   - Hover for details

---

## 🎨 VISUAL DESIGN

### **Colors:**
- Background: `#0d1117` (dark, matches Cursor)
- Accent: `#00d9ff` (cyan)
- Text: `#ffffff`
- Matrix: `#00ff41` (green)

### **Matrix Background:**
- Subtle rain effect
- Low opacity (10%)
- Doesn't distract
- Robbie colors (cyan/pink/teal)

---

## 🔧 TECHNICAL STACK

### **Files to Create:**
```
cursor-robbiebar/
├── robbiebar.html          # Main UI
├── robbiebar.css           # Styling + Matrix
├── robbiebar.js            # Logic + API calls
├── inject.js               # Cursor injection script
└── README.md               # Setup instructions
```

### **APIs Needed:**
- System resources: `os` module or `/proc`
- Mood: PostgreSQL `personality_settings` table
- Active users: WebSocket or polling
- Chat app: Launch command

---

## 📊 FEATURES BREAKDOWN

### **1. Robbie Avatar + Mood**
```javascript
// Fetch current mood from database
const mood = await fetch('/api/personality/mood');
// Display avatar with mood
// Click to cycle: Focused → Playful → Bossy → Flirty
```

### **2. Chat Button**
```javascript
// Open Robbie chat app
button.onclick = () => {
  window.open('http://localhost:3000', '_blank');
  // Or: exec('npm run dev') if not running
};
```

### **3. System Resources**
```javascript
// Update every 2 seconds
setInterval(async () => {
  const stats = await fetch('/api/system/stats');
  updateUI(stats.cpu, stats.memory, stats.gpu);
}, 2000);
```

### **4. Active Users**
```javascript
// WebSocket for real-time updates
const ws = new WebSocket('ws://localhost:8000/ws/users');
ws.onmessage = (event) => {
  const users = JSON.parse(event.data);
  updateActiveUsers(users);
};
```

---

## 🚀 BUILD SEQUENCE

### **Step 1: HTML Structure** (10 min)
- Create basic layout
- Add sections
- Test in browser

### **Step 2: CSS Styling** (15 min)
- Add colors
- Matrix background
- Hover effects
- Responsive design

### **Step 3: JavaScript Logic** (20 min)
- Fetch mood
- System resources
- Active users
- Button actions

### **Step 4: Cursor Injection** (15 min)
- Create injection script
- Test in Cursor
- Debug positioning

### **Step 5: Backend API** (20 min)
- `/api/personality/mood`
- `/api/system/stats`
- `/ws/users` WebSocket

**Total Time: ~80 minutes to working prototype**

---

## 🎯 SUCCESS CRITERIA

- [ ] RobbieBar appears at top of Cursor
- [ ] Shows current mood
- [ ] Chat button opens Robbie app
- [ ] System resources update in real-time
- [ ] Shows active users (Allan)
- [ ] Matrix background looks cool
- [ ] Doesn't interfere with coding

---

## 💡 FUTURE ENHANCEMENTS

- Click avatar to change mood
- More system metrics (network, disk)
- User presence (typing indicator)
- Notifications from Robbie
- Quick actions (commit, push, test)
- Personality sliders (quick access)

---

**Ready to build! Starting with HTML structure...**
