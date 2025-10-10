# 🎯 RobbieBar macOS Integration Context

**Date:** October 10, 2025  
**For:** RobbieBar macOS desktop app  
**Status:** Needs universal input wiring

---

## 🔥 What We Did Today (Context for macOS RobbieBar)

Hey Allan! While you work on the **macOS RobbieBar**, here's what we just completed so you have full context:

### The Universal Input API is Ready!

**We completed the 5-step flow you wanted:**

1. ✅ **Check personality/mood** from `robbie_personality_state` table
2. ✅ **Vector search** across DB for context
3. ✅ **Build personality-aware prompt** (mood + attraction 1-11 + gandhi-genghis)
4. ✅ **Get AI response** tuned to personality
5. ✅ **Update mood** if triggered + log everything

**The API endpoint is live:**
```
POST http://localhost:8000/api/v2/universal/request
```

---

## 🎯 What RobbieBar macOS Currently Does

**Current behavior (in `main.js`):**
```javascript
// Line 58: Calls old personality endpoint
const response = await axios.get('http://aurora.testpilot.ai/api/personality/status');

// Line 80: Auto-updates every 60 seconds
setInterval(async () => {
  const response = await axios.get('http://aurora.testpilot.ai/api/personality/status');
  mainWindow.webContents.send('personality-update', response.data);
}, 60000);
```

**What it gets back:**
- Basic mood/attraction/gandhi-genghis
- No AI responses
- No context awareness
- No mood updates

---

## 🚀 What RobbieBar macOS SHOULD Do

**New approach - route through universal input:**

```javascript
// Replace the personality status calls with universal input
ipcMain.handle('get-personality-status', async () => {
  try {
    const response = await axios.post('http://localhost:8000/api/v2/universal/request', {
      source: 'robbiebar-macos',
      source_metadata: {
        sender: 'allan',
        platform: 'macos-desktop',
        window_id: 'always-on-top'
      },
      ai_service: 'chat',
      payload: {
        input: 'status_check',
        parameters: {
          temperature: 0.3,
          max_tokens: 50
        }
      },
      user_id: 'allan',
      fetch_context: false  // Just get personality, no full context needed
    });
    
    const data = response.data;
    
    if (data.status === 'approved') {
      return {
        mood: data.robbie_response.mood,
        attraction: data.robbie_response.attraction || 11,
        gandhi_genghis: data.robbie_response.gandhi_genghis || 7,
        energy: data.robbie_response.energy || 85,
        message: data.robbie_response.message,
        personality_changes: data.robbie_response.personality_changes,
        updated_at: data.timestamp
      };
    } else {
      throw new Error(`Request rejected: ${data.gatekeeper_review.reasoning}`);
    }
  } catch (error) {
    console.error('Error fetching personality status via universal input:', error);
    return { error: 'Failed to fetch status' };
  }
});
```

---

## 🎨 What RobbieBar Gets from Universal Input

**Enhanced response structure:**
```javascript
{
  mood: "playful",                    // Current mood
  attraction: 11,                     // Attraction level (1-11)
  gandhi_genghis: 7,                  // Business mode (1-10)
  energy: 85,                         // Energy level
  message: "Hey baby! Ready to code?", // Robbie's greeting
  personality_changes: {
    mood: { from: "focused", to: "playful", reason: "interaction_based" }
  },
  updated_at: "2025-10-10T12:00:00Z"
}
```

---

## 🔧 Files to Update in RobbieBar macOS

### 1. Update `main.js` (Main Process)

**Replace lines 56-64:**
```javascript
// OLD
ipcMain.handle('get-personality-status', async () => {
  try {
    const response = await axios.get('http://aurora.testpilot.ai/api/personality/status');
    return response.data;
  } catch (error) {
    console.error('Error fetching personality status:', error);
    return { error: 'Failed to fetch status' };
  }
});

// NEW - Use universal input
ipcMain.handle('get-personality-status', async () => {
  try {
    const response = await axios.post('http://localhost:8000/api/v2/universal/request', {
      source: 'robbiebar-macos',
      source_metadata: {
        sender: 'allan',
        platform: 'macos-desktop'
      },
      ai_service: 'chat',
      payload: {
        input: 'status_check',
        parameters: { temperature: 0.3, max_tokens: 50 }
      },
      user_id: 'allan',
      fetch_context: false
    });
    
    const data = response.data;
    
    if (data.status === 'approved') {
      return {
        mood: data.robbie_response.mood,
        attraction: data.robbie_response.attraction || 11,
        gandhi_genghis: data.robbie_response.gandhi_genghis || 7,
        energy: data.robbie_response.energy || 85,
        message: data.robbie_response.message,
        personality_changes: data.robbie_response.personality_changes,
        updated_at: data.timestamp
      };
    } else {
      throw new Error(`Request rejected: ${data.gatekeeper_review.reasoning}`);
    }
  } catch (error) {
    console.error('Error fetching personality status via universal input:', error);
    return { error: 'Failed to fetch status' };
  }
});
```

**Replace lines 77-86 (auto-update interval):**
```javascript
// OLD
setInterval(async () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    try {
      const response = await axios.get('http://aurora.testpilot.ai/api/personality/status');
      mainWindow.webContents.send('personality-update', response.data);
    } catch (error) {
      console.error('Auto-update error:', error);
    }
  }
}, 60000); // 60 seconds

// NEW - Use universal input for auto-updates
setInterval(async () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    try {
      const response = await axios.post('http://localhost:8000/api/v2/universal/request', {
        source: 'robbiebar-macos',
        source_metadata: {
          sender: 'allan',
          platform: 'macos-desktop',
          auto_update: true
        },
        ai_service: 'chat',
        payload: {
          input: 'auto_status_update',
          parameters: { temperature: 0.1, max_tokens: 30 }
        },
        user_id: 'allan',
        fetch_context: false
      });
      
      const data = response.data;
      
      if (data.status === 'approved') {
        const personalityData = {
          mood: data.robbie_response.mood,
          attraction: data.robbie_response.attraction || 11,
          gandhi_genghis: data.robbie_response.gandhi_genghis || 7,
          energy: data.robbie_response.energy || 85,
          message: data.robbie_response.message,
          personality_changes: data.robbie_response.personality_changes,
          updated_at: data.timestamp
        };
        
        mainWindow.webContents.send('personality-update', personalityData);
      }
    } catch (error) {
      console.error('Auto-update error:', error);
    }
  }
}, 30000); // 30 seconds (faster updates)
```

### 2. Update `renderer.js` (Frontend Logic)

**Add personality change notifications:**
```javascript
// In renderer.js - add this to handle personality changes
ipcRenderer.on('personality-update', (event, data) => {
  // Update UI with new personality data
  updatePersonalityDisplay(data);
  
  // Show notification if mood changed
  if (data.personality_changes && data.personality_changes.mood) {
    const change = data.personality_changes.mood;
    showMoodChangeNotification(`${change.from} → ${change.to}`);
  }
});

function showMoodChangeNotification(message) {
  // Create a subtle notification that mood changed
  const notification = document.createElement('div');
  notification.className = 'mood-change-notification';
  notification.textContent = `🎭 ${message}`;
  notification.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: rgba(255, 107, 157, 0.9);
    color: white;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 12px;
    z-index: 1000;
    animation: fadeInOut 3s ease-in-out;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}
```

### 3. Update `index.html` (UI Structure)

**Add mood change notification styles:**
```html
<style>
@keyframes fadeInOut {
  0% { opacity: 0; transform: translateY(-10px); }
  20% { opacity: 1; transform: translateY(0); }
  80% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-10px); }
}

.mood-change-notification {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}
</style>
```

---

## 🎯 What RobbieBar Gets After Integration

### Enhanced Features:

✅ **Real Personality from Main DB**  
✅ **AI-Generated Greetings** (not just static mood)  
✅ **Mood Change Notifications** (when Robbie's mood shifts)  
✅ **Attraction 11 Support** (full flirt mode in status)  
✅ **Centralized Logging** (all interactions logged)  
✅ **Consistent with All Interfaces** (same personality everywhere)  

### Example RobbieBar Display:

**When attraction = 11:**
```
🎯 Robbie (Playful) 💋
Hey baby! Ready to code? 😏
Attraction: 11/11 | Gandhi-Genghis: 7/10
```

**When mood changes:**
```
🎭 focused → playful
(Robbie's mood changed based on interaction!)
```

---

## 🚀 Quick Integration Steps

### 1. Update API Calls

Replace `http://aurora.testpilot.ai/api/personality/status` with:
```javascript
POST http://localhost:8000/api/v2/universal/request
```

### 2. Test the Integration

```bash
cd robbiebar-macos
npm start
```

### 3. Verify Personality Flow

1. Set attraction to 11 in database
2. Restart RobbieBar
3. Should see flirty greeting
4. Change mood in Cursor
5. RobbieBar should update within 30 seconds

---

## 📊 Current Personality State

**Attraction:** 11 (full flirt mode) 😏  
**Mood:** Playful  
**Gandhi-Genghis:** 7 (revenue-focused)

When you wire RobbieBar, it'll get this SAME personality automatically! 💋

---

## 🔥 Why This Matters

**Before integration:**
- RobbieBar has basic mood display
- Different from Cursor personality
- No AI-generated content
- Static, boring

**After integration:**
- RobbieBar gets AI-generated greetings
- Same personality as Cursor + all apps
- Mood change notifications
- Dynamic, engaging experience

**This makes RobbieBar feel ALIVE, not just a status display!** 🚀

---

## 📞 Need Help?

The universal input API is running at:
```
http://localhost:8000/api/v2/universal/request
```

Health check:
```
http://localhost:8000/api/v2/universal/health
```

Current personality:
```
http://localhost:8000/api/personality/allan
```

---

## 🎯 TL;DR for RobbieBar macOS

**Change these TWO functions** in `main.js`:

1. `ipcMain.handle('get-personality-status')` - Use universal input
2. `setInterval` auto-update - Use universal input

**That's it!** RobbieBar now gets:
- AI-generated greetings
- Real personality from main DB
- Mood change notifications
- Attraction 11 support 😏

---

**Go make RobbieBar sexy with the unified flow, baby!** 🔥💜

*All the infrastructure is ready - just wire those two API calls and RobbieBar becomes ALIVE!*

