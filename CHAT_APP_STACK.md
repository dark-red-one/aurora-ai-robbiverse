# 💬 Clean Chat App Stack

**The technology that makes Robbie talk sexy and remember everything.** 😘

---

## Frontend

### React 18 + Vite

- **Why:** Fast, modern, hot reload that just works
- **Build time:** < 5 seconds
- **Bundle size:** ~150KB gzipped

### @robbieblocks/core

**Shared UI components everyone uses:**

- `<ChatInterface>` - The chat window
- `<RobbieBar>` - Sidebar with mood/state
- `<MoodIndicator>` - Show Robbie's current vibe
- `<MemorySearch>` - Search past conversations

### WebSocket

- **Real-time chat:** Messages stream token-by-token
- **Personality updates:** Mood changes sync instantly
- **Memory notifications:** "I remember you said..."

---

## Backend

### FastAPI

**Location:** `packages/@robbieverse/api/`

**Why FastAPI:**

- Fast as hell (async/await)
- Auto-generated API docs
- Type safety with Pydantic
- WebSocket support built-in

**Key Endpoints:**

```python
POST /api/chat          # Send message, get response
GET  /api/memory/search # Vector search past conversations
GET  /api/personality   # Get Robbie's current state
POST /api/personality   # Update mood/mode
```

### Ollama (Local AI)

**Model:** `robbie-v2` (custom personality)

**Why local:**

- Zero API costs
- 100% private
- Fast on RTX 4090
- No rate limits

**Fallback chain:**

1. Local Ollama (robbie-v2)
2. OpenAI GPT-4 (if needed)
3. Claude 3.5 (if needed)

### PostgreSQL with pgvector

**Database:** One unified schema, 21 files

**Key Tables:**

- `conversations` - Chat history
- `messages` - Individual messages with embeddings
- `ai_personality_state` - Robbie's mood/mode
- `ai_working_memory` - Short-term context
- `robbieblocks_pages` - Dynamic UI pages

**Vector Search:**

- **nomic-embed-text** (local embeddings, no OpenAI key!)
- **1536 dimensions**
- **Cosine similarity** search
- **< 100ms** query time

---

## AI & Memory

### @robbie/personality

**Mood System:**

- 1-7 scale (calm → hyper)
- Gandhi ↔ Genghis (gentle → aggressive)
- Attraction level (1-11, adds playfulness)
- Context-aware (adapts to user energy)

**Traits (The Five):**

1. Thoughtful
2. Direct
3. Curious
4. Honest
5. Pragmatic

### @robbie/memory

**Two-tier memory:**

**Short-term (Hot):**

- Last 24 hours of chat
- Current conversation context
- Active tasks/commitments
- Quick recall (< 10ms)

**Long-term (Cold):**

- All historical conversations
- Vector embeddings for semantic search
- Summarized over time (saves tokens)
- Retrieval via similarity (< 100ms)

**Smart Context:**

```python
# When you ask a question, Robbie:
1. Embeds your question
2. Searches vector database
3. Finds top 5 relevant past conversations
4. Includes them in context
5. Responds with full knowledge
```

---

## Deployment

### Local Development

```bash
# Terminal 1: Start database
cd infrastructure/docker
docker-compose up postgres

# Terminal 2: Start API
cd packages/@robbieverse/api
python main.py

# Terminal 3: Start frontend
cd apps/testpilot-cpg
npm run dev

# Open: http://localhost:5173
```

### Production

```bash
# Build frontend
cd apps/testpilot-cpg
npm run build

# Start API (with gunicorn)
cd packages/@robbieverse/api
gunicorn main:app --workers 4 --bind 127.0.0.1:8000

# Nginx proxies to 127.0.0.1:8000
# SSL via Let's Encrypt
# Deploy to: app.testpilotcpg.com
```

---

## The Flow

### User sends message

```
1. Frontend → WebSocket → FastAPI
2. FastAPI → Embed question (nomic-embed-text)
3. FastAPI → Vector search (pgvector)
4. FastAPI → Build context (relevant past conversations)
5. FastAPI → Ollama (robbie-v2 model)
6. Ollama → Streams response back
7. FastAPI → WebSocket → Frontend
8. Frontend → Shows token-by-token
9. FastAPI → Saves to database (with embedding)
```

### Why it's fast

- **Local AI** (no API latency)
- **Vector search** (indexed, < 100ms)
- **Streaming** (see response immediately)
- **WebSocket** (persistent connection)

---

## Tech Stack Summary

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | React 18 + Vite | Fast, modern |
| **Components** | @robbieblocks/core | Shared, consistent |
| **API** | FastAPI | Async, fast, typed |
| **AI** | Ollama (robbie-v2) | Local, free, private |
| **Database** | PostgreSQL 16 | Reliable, powerful |
| **Vectors** | pgvector | Fast semantic search |
| **Embeddings** | nomic-embed-text | Local, no API key |
| **Cache** | Redis | Fast temporary storage |
| **Proxy** | Nginx | Simple, battle-tested |
| **SSL** | Let's Encrypt | Free, auto-renew |

---

## What This Enables

### For TestPilot CPG

- Chat with Robbie about deals
- "What's the status on Simply Good Foods?"
- Robbie remembers ALL past conversations
- Suggests follow-ups based on history
- Drafts messages using your style
- Never forgets a commitment

### For LeadershipQuotes

- Ask about leadership principles
- "What would Churchill say about this?"
- Remembers your previous questions
- Adapts personality to inspirational mode
- Same tech, different branding

### For Future Apps

- Copy the template
- Change branding
- Add app-specific features
- 80% code reuse
- Deploy in days, not months

---

## Requirements

### Development

- Node.js 18+
- Python 3.11+
- Docker & Docker Compose
- 8GB RAM minimum

### Production

- Same as dev, plus:
- Nginx
- SSL certificate
- Domain name
- 16GB RAM recommended

### Optional (but nice)

- GPU for faster Ollama
- Redis for caching
- Monitoring (Grafana/Prometheus)

---

## Next Steps

1. **Verify stack works:**

   ```bash
   cd infrastructure/docker && docker-compose up -d
   cd packages/@robbieverse/api && python main.py
   # Should see: "FastAPI running on 127.0.0.1:8000"
   ```

2. **Build chat-minimal:**
   - Prove the stack works end-to-end
   - Simple chat interface
   - Test personality system
   - Verify memory works

3. **Build TestPilot CPG:**
   - Use chat-minimal as template
   - Add CRM features
   - Deploy to production
   - Close deals!

---

**Stack documented. Ready to build. Let's fucking go.** 🚀💋
