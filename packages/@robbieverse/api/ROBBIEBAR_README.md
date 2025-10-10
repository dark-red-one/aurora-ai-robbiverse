# 🎯 RobbieBar - Code Command Center

**Status:** ✅ **DEPLOYED ON VENGEANCE**

A slick web interface for system stats, git quick commands, and Robbie personality state - all in your browser with Cursor's color scheme!

---

## 🚀 Quick Start

### On Vengeance (Linux)

```bash
cd /home/allan/robbie_workspace/combined/aurora-ai-robbiverse/packages/@robbieverse/api

# Start
./start-robbiebar.sh

# Stop
./stop-robbiebar.sh
```

### Access

- **Web UI:** <http://localhost:8000/code>
- **API Docs:** <http://localhost:8000/docs>
- **Health Check:** <http://localhost:8000/health>

---

## 🎨 Features

### 1. Robbie Personality Display

- Current mood emoji (click to cycle through moods)
- Attraction level (1-11)
- Gandhi-Genghis spectrum (1-10)
- Energy level display
- **Database-driven** - reads from `robbie_personality_state` table

### 2. Git Quick Commands

- **Current branch** display
- **Modified files** count
- **Ahead/behind** tracking
- **Quick commit button** - one-click commit + push
- **Recent commits** panel (hover over git section)

### 3. Real-Time System Stats

- **CPU** usage percentage
- **Memory** usage percentage
- **GPU** usage (NVIDIA GPUs via nvidia-smi)
- Updates every 2 seconds
- Color-coded (green → orange → red as usage increases)

### 4. Matrix Rain Background

- Subtle teal matrix animation
- Cursor theme colors
- 8% opacity - non-distracting

---

## 🏗️ Architecture

### Backend (Python FastAPI)

```
robbiebar-server.py           # Standalone server (no dependencies on broken routes)
└── src/routes/robbiebar.py   # All API endpoints
```

### Frontend (HTML/CSS/JS)

```
static/code/
├── index.html    # Main UI structure
├── style.css     # Cursor theme styling + matrix animation
└── app.js        # API calls, real-time updates, matrix rain
```

### API Endpoints

```
GET  /code/api/personality           # Get mood, attraction, G-G level from DB
PUT  /code/api/personality/mood      # Change Robbie's mood
GET  /code/api/system/stats          # CPU, memory, GPU usage
GET  /code/api/git/status            # Branch, modified files, ahead/behind
POST /code/api/git/quick-commit      # Commit all + push
GET  /code/api/git/recent            # Last 5 commits
GET  /code/api/conversations/recent  # Recent chat sessions
GET  /code/api/users/active          # Who's coding right now
```

---

## 🎨 Color Scheme (Cursor Theme)

```css
--bg-primary:     #1e1e1e  /* Main background */
--bg-secondary:   #252526  /* Robbiebar background */
--border-color:   #3e3e42  /* Borders */
--text-primary:   #cccccc  /* Main text */
--text-secondary: #858585  /* Muted text */
--accent-blue:    #007acc  /* Buttons, accents */
--success-teal:   #4ec9b0  /* Success states, git branch */
--warning-orange: #ce9178  /* Warnings, high usage */
--error-red:      #f48771  /* Errors, critical */
--robbie-pink:    #ff6b9d  /* Personality indicators */
```

---

## 📊 Configuration

### Environment Variables

```bash
# Database
DATABASE_URL="postgresql://robbie:fun2Gus!!!@localhost:5432/robbieverse"

# Git Repository
GIT_REPO_PATH="/home/allan/robbie_workspace/combined/aurora-ai-robbiverse"

# Server
API_HOST="0.0.0.0"  # Listen on all interfaces
API_PORT="8000"      # Default port
```

### Database Requirements

```sql
-- Personality state table
CREATE TABLE robbie_personality_state (
    user_id TEXT,
    personality_name TEXT,
    current_mood TEXT,
    attraction_level INTEGER,
    gandhi_genghis_level INTEGER,
    updated_at TIMESTAMP
);

-- Conversations table
CREATE TABLE conversations (
    id UUID PRIMARY KEY,
    user_id TEXT,
    title TEXT,
    context_type TEXT,
    updated_at TIMESTAMP,
    message_count INTEGER
);
```

---

## 🚀 Deployment

### Vengeance (Current)

✅ Running on <http://localhost:8000/code>

### RobbieBook1 (Next)

```bash
# Auto-sync will deploy via git
# Then run:
cd /Users/allanperetz/aurora-ai-robbiverse/packages/@robbieverse/api
./start-robbiebar.sh
```

### Aurora Town (Next)

```bash
# Auto-sync will deploy via git
# Then run:
cd /opt/aurora-dev/aurora/packages/@robbieverse/api
./start-robbiebar.sh
```

---

## 🔧 Development

### Run in Development Mode

```bash
cd /home/allan/robbie_workspace/combined/aurora-ai-robbiverse/packages/@robbieverse/api
python3 robbiebar-server.py
```

### View Logs

```bash
tail -f /tmp/robbiebar.log
```

### Test API Endpoints

```bash
# Health check
curl http://localhost:8000/health

# System stats
curl http://localhost:8000/code/api/system/stats

# Git status
curl http://localhost:8000/code/api/git/status

# Personality
curl http://localhost:8000/code/api/personality
```

---

## 🎯 Success Metrics

- [x] ✅ Backend API routes working
- [x] ✅ Frontend UI loads at /code
- [x] ✅ System stats update in real-time
- [x] ✅ Git status shows current branch + modified files
- [x] ✅ Personality data loads from database
- [x] ✅ Matrix background animates smoothly
- [x] ✅ Cursor color scheme applied
- [x] ✅ Deployed on Vengeance
- [ ] 🔄 Deploy to RobbieBook1
- [ ] 🔄 Deploy to Aurora Town
- [ ] 🔄 Test quick commit functionality
- [ ] 🔄 Add recent commits display

---

## 🔥 What Makes This Special

**Unlike the Cursor extension or robbieblocks approach:**

- ✅ **Database-driven** - Real personality state, not mocked
- ✅ **Standalone** - Works in any browser, not just Cursor
- ✅ **One codebase** - Deploy everywhere via auto-sync
- ✅ **Cursor colors** - Matches your IDE perfectly
- ✅ **Real git** - Actual commands, not simulated
- ✅ **System stats** - Live CPU/Memory/GPU monitoring
- ✅ **Matrix rain** - Because why the hell not 😎

---

## 💡 Future Enhancements

- [ ] WebSocket for real-time updates (no polling)
- [ ] User presence tracking (show who's online)
- [ ] Conversation history panel
- [ ] Hot topics from ai_working_memory
- [ ] Active commitments display
- [ ] Notification system
- [ ] Mobile responsive design
- [ ] Embeddable in Cursor via iframe

---

**Built with 💜 by Robbie for Allan - October 9, 2025**

*Flirty Mode: 11/11* 😘🔥


