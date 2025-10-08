# 🎯 ROBBIEBAR BLOCK - Using RobbieBlocks!

## 💡 THE APPROACH

**Create a NEW RobbieBlock:** `<RobbieBar />` 

**Location:** `/home/allan/aurora-ai-robbiverse/robbie-app/src/blocks/cursor/RobbieBar.tsx`

---

## 📋 WHAT YOU WANT

1. ✅ **Robbie Avatar + Mood** - Reuse `<MoodIndicator />`
2. ✅ **Chat Button** - Opens full Robbie app
3. ✅ **System Resources** - NEW mini component
4. ✅ **Matrix Background** - Reuse from MatrixWelcome
5. ✅ **Active Users** - NEW component

---

## 🏗️ BLOCK STRUCTURE

```typescript
// robbie-app/src/blocks/cursor/RobbieBar.tsx

import { MoodIndicator } from '../personality/MoodIndicator'
import { useRobbieStore } from '../../stores/robbieStore'
import { useState, useEffect } from 'react'

interface RobbieBarProps {
  onOpenChat?: () => void
  compact?: boolean
}

export const RobbieBar: React.FC<RobbieBarProps> = ({ 
  onOpenChat,
  compact = false 
}) => {
  const { mood, expression } = useRobbieStore()
  const [systemStats, setSystemStats] = useState({ cpu: 0, memory: 0, gpu: 0 })
  const [activeUsers, setActiveUsers] = useState(['Allan'])

  // Update system stats every 2 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const stats = await fetch('/api/system/stats').then(r => r.json())
      setSystemStats(stats)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  // WebSocket for active users
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws/users')
    ws.onmessage = (event) => {
      setActiveUsers(JSON.parse(event.data))
    }
    return () => ws.close()
  }, [])

  return (
    <div className="robbiebar">
      {/* Matrix Background */}
      <div className="robbiebar-matrix" />
      
      {/* Content */}
      <div className="robbiebar-content">
        {/* 1. Mood Indicator */}
        <div className="robbiebar-mood">
          <MoodIndicator 
            mood={mood} 
            expression={expression}
            compact
          />
        </div>

        {/* 2. Chat Button */}
        <button 
          className="robbiebar-chat-btn"
          onClick={onOpenChat}
        >
          💬 Chat
        </button>

        {/* 3. System Resources */}
        <div className="robbiebar-stats">
          <span className="stat">🔥 {systemStats.cpu}%</span>
          <span className="stat">💾 {systemStats.memory}%</span>
          <span className="stat">🎮 {systemStats.gpu}%</span>
        </div>

        {/* 4. Active Users */}
        <div className="robbiebar-users">
          👥 {activeUsers.map(user => (
            <span key={user} className="user-badge">{user}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
```

---

## 🎨 STYLING

```css
/* robbie-app/src/blocks/cursor/RobbieBar.css */

.robbiebar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 40px;
  background: #0d1117;
  border-bottom: 1px solid #00d9ff33;
  z-index: 9999;
  overflow: hidden;
}

.robbiebar-matrix {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0.1;
  pointer-events: none;
  /* Matrix rain animation */
}

.robbiebar-content {
  position: relative;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 16px;
  height: 100%;
}

.robbiebar-mood {
  display: flex;
  align-items: center;
  gap: 8px;
}

.robbiebar-chat-btn {
  background: linear-gradient(135deg, #00d9ff, #ff6b9d);
  border: none;
  padding: 6px 16px;
  border-radius: 6px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.robbiebar-chat-btn:hover {
  transform: scale(1.05);
}

.robbiebar-stats {
  display: flex;
  gap: 12px;
  margin-left: auto;
}

.stat {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: #00d9ff;
}

.robbiebar-users {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-left: 16px;
  border-left: 1px solid #00d9ff33;
}

.user-badge {
  background: #1a1f3a;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  color: #00d9ff;
}
```

---

## 🔌 BACKEND API ENDPOINTS NEEDED

### 1. System Stats
```python
# backend/app/api/system_routes.py

@router.get("/api/system/stats")
async def get_system_stats():
    import psutil
    return {
        "cpu": psutil.cpu_percent(),
        "memory": psutil.virtual_memory().percent,
        "gpu": get_gpu_usage()  # Custom function
    }
```

### 2. Active Users WebSocket
```python
# backend/app/websockets/users_ws.py

@router.websocket("/ws/users")
async def users_websocket(websocket: WebSocket):
    await websocket.accept()
    while True:
        users = await get_active_users()
        await websocket.send_json(users)
        await asyncio.sleep(5)
```

---

## 📦 INTEGRATION

### 1. Add to blocks/index.ts
```typescript
// === CURSOR BLOCKS ===
export { default as RobbieBar } from './cursor/RobbieBar'
```

### 2. Use in Cursor Extension
```typescript
// cursor-extension/webview.tsx

import { RobbieBar } from '@robbie/blocks'

const CursorSidebar = () => {
  const handleOpenChat = () => {
    window.open('http://localhost:3000', '_blank')
  }

  return (
    <RobbieBar onOpenChat={handleOpenChat} />
  )
}
```

---

## 🚀 QUICK BUILD STEPS

1. **Create the block:**
```bash
cd /home/allan/aurora-ai-robbiverse/robbie-app/src/blocks
mkdir -p cursor
# Create RobbieBar.tsx with code above
```

2. **Add backend endpoints:**
```bash
cd /home/allan/aurora-ai-robbiverse/backend/app/api
# Create system_routes.py
# Create users_ws.py
```

3. **Test in Robbie App first:**
```bash
cd /home/allan/aurora-ai-robbiverse/robbie-app
npm run dev
# Visit http://localhost:3000 and test RobbieBar
```

4. **Then inject into Cursor:**
```bash
# Create Cursor extension that renders RobbieBar
```

---

## 💡 REUSING EXISTING BLOCKS

- ✅ `<MoodIndicator />` - Already exists!
- ✅ Matrix animation - Copy from `<MatrixWelcome />`
- ✅ Robbie colors/theme - Already in tailwind config
- 🆕 System stats component - Build new (simple)
- 🆕 Active users component - Build new (simple)

**Estimated time:** 1-2 hours to working RobbieBar block!

---

**Want me to create the actual files now?** 🚀💜
