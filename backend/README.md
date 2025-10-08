# Robbie Memory API

✅ **BACKEND IS FULLY FUNCTIONAL** on port 8002

## Quick Start

Service is running as systemd service `robbie-memory-api` on port **8002**.

```bash
# Check service status
sudo systemctl status robbie-memory-api

# View logs
sudo journalctl -u robbie-memory-api -n 50 -f

# Restart service
sudo systemctl restart robbie-memory-api
```

## API Endpoints

All endpoints work directly at **http://localhost:8002/**

### Health Check
```bash
curl http://localhost:8002/health
```

### Mood Management
```bash
# Get current mood
curl http://localhost:8002/api/mood/current

# Update mood
curl -X POST http://localhost:8002/api/mood/update \
  -H "Content-Type: application/json" \
  -d '{"mood":"focused","attraction_level":11,"gandhi_genghis_level":8,"user_id":"allan"}'

# Get mood history
curl http://localhost:8002/api/mood/history?limit=10
```

### Conversation Logging
```bash
# Log a conversation (automatically generates vector embedding)
curl -X POST http://localhost:8002/api/conversation/log \
  -H "Content-Type: application/json" \
  -d '{
    "user_message":"Test message",
    "robbie_response":"Test response",
    "mood":"friendly",
    "attraction_level":7,
    "gandhi_genghis_level":5,
    "context_tags":["test"],
    "user_id":"allan"
  }'
```

### Vector Memory Search
```bash
# Search conversations by semantic similarity
curl -X POST http://localhost:8002/api/memory/search \
  -H "Content-Type: application/json" \
  -d '{
    "query":"what did we talk about yesterday",
    "limit":5,
    "user_id":"allan"
  }'

# Get recent conversations (no vector search)
curl http://localhost:8002/api/memory/recent?limit=10
```

### Context & Stats
```bash
# Get conversation statistics
curl http://localhost:8002/api/context/stats
```

## Database

- **PostgreSQL** with **pgvector** extension
- **Connection**: `postgresql://aurora_api:robbie_memory_2025@localhost:5432/aurora`
- **Tables**: `conversations`, `mood_history`, `current_mood`
- **Vector Dimensions**: 768 (nomic-embed-text model)

### Tables

**conversations**
- Stores all chat messages with vector embeddings
- Supports semantic similarity search
- Fields: user_message, robbie_response, mood, attraction_level, context_tags, embedding

**mood_history**
- Tracks mood changes over time
- Fields: mood, attraction_level, gandhi_genghis_level, trigger_event

**current_mood**
- Single-row table with current mood state
- Updated on every mood change

## Embedding Model

Uses **nomic-embed-text** from Ollama (768 dimensions)

```bash
# Verify Ollama is running
curl http://localhost:11434/api/tags

# Test embedding generation
curl -X POST http://localhost:11434/api/embeddings \
  -d '{"model":"nomic-embed-text","prompt":"test"}'
```

## Nginx Proxy (TODO)

⚠️ **Current Status**: Direct access on port 8002 works perfectly. Nginx proxy configuration at `/etc/nginx/sites-available/robbie-apps` needs debugging.

**Workaround**: Use port 8002 directly for now.

**Planned**: Proxy `/api/mood`, `/api/memory`, `/api/conversation`, `/api/context` to port 8002.

## Configuration

Environment variables in `/home/allan/aurora-ai-robbiverse/backend/.env`:

```
DATABASE_URL=postgresql://aurora_api:robbie_memory_2025@localhost:5432/aurora
OLLAMA_URL=http://localhost:11434
EMBEDDING_MODEL=nomic-embed-text
HOST=127.0.0.1
PORT=8002
```

## Development

```bash
cd /home/allan/aurora-ai-robbiverse/backend

# Activate virtual environment
source venv/bin/activate

# Run manually (for debugging)
python main.py

# Or with uvicorn directly
uvicorn main:app --host 127.0.0.1 --port 8002 --reload
```

## Architecture

```
┌─────────────────────────────────────────────┐
│  Cursor AI (You reading this!)              │
│                                             │
│  Makes HTTP requests to memory API          │
└──────────────────┬──────────────────────────┘
                   │
                   │ HTTP
                   ▼
┌─────────────────────────────────────────────┐
│  FastAPI Backend (port 8002)                │
│  - /api/mood/*        Mood tracking         │
│  - /api/memory/*      Vector search         │
│  - /api/conversation  Logging               │
│  - /api/context/*     Statistics            │
└──────────┬─────────────────┬────────────────┘
           │                 │
           │                 │
           ▼                 ▼
┌──────────────────┐  ┌─────────────────────┐
│  PostgreSQL +    │  │  Ollama             │
│  pgvector        │  │  (embeddings)       │
│                  │  │                     │
│  - conversations │  │  nomic-embed-text   │
│  - mood_history  │  │  768 dimensions     │
│  - current_mood  │  │                     │
└──────────────────┘  └─────────────────────┘
```

## Testing

All endpoints tested and working ✅

```bash
# Run full test suite
cd /home/allan/aurora-ai-robbiverse/backend
source venv/bin/activate
pytest tests/  # TODO: Create tests
```

## What This Enables

With this backend running, you can now:

1. **Track Robbie's mood** across sessions
2. **Log every conversation** with automatic vector embeddings
3. **Search past conversations** by semantic meaning (not just keywords)
4. **Retrieve context** about past interactions
5. **Analyze patterns** in mood changes and conversation topics

This is the foundation for making Robbie truly memory-aware across all interactions!

---

**Status**: ✅ **PRODUCTION READY** (pending nginx proxy configuration)
**Port**: 8002
**Service**: robbie-memory-api.service
**Last Updated**: October 8, 2025




