# 🚀 SMART ROBBIE@CODE - LIVE DEMO

## ✅ What's Running Right Now

```bash
# Check status
curl http://localhost:3001/health
```

**Expected Output:**

```json
{
  "status": "healthy",
  "timestamp": "2025-10-08T...",
  "postgres": "connected",
  "ollama": "http://localhost:11435"
}
```

## 🎯 DEMO SCRIPT

### Demo 1: Basic Chat with Memory

**Open VS Code:**

```bash
code /home/allan/robbie_workspace/combined/aurora-ai-robbiverse
```

**Press Cmd+L** to open Robbie chat

**Try this conversation:**

```
You: "How do I set up error handling in TestPilot?"

Robbie: [Responds with generic advice]

You: "I prefer using try/catch with toast notifications"

Robbie: [Takes note, responds accordingly]
```

**Close VS Code, reopen, press Cmd+L again:**

```
You: "What's my error handling pattern?"

Robbie: [Should remember your preference for try/catch + toast]
```

### Demo 2: Code Editing with Cmd+I

**Open any file in VS Code**

**Select some code**

**Press Cmd+I**

**Type:** "Add error handling"

Robbie edits the code inline ✨

### Demo 3: Vector Search (API Level)

**Search past conversations:**

```bash
curl -X POST http://localhost:3001/api/search/messages \
  -H "Content-Type: application/json" \
  -d '{
    "query": "error handling",
    "user_id": "allan",
    "limit": 5
  }' | jq .
```

**Save a code pattern:**

```bash
curl -X POST http://localhost:3001/api/patterns \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "allan",
    "pattern_type": "error_handling",
    "pattern_name": "TestPilot API Error Pattern",
    "example_code": "try { const result = await fetch(...); } catch (e) { toast.error(e.message); }",
    "explanation": "Standard TestPilot error handling with user feedback"
  }' | jq .
```

**Search for patterns:**

```bash
curl -X POST http://localhost:3001/api/search/patterns \
  -H "Content-Type: application/json" \
  -d '{
    "query": "API error handling",
    "user_id": "allan"
  }' | jq .
```

### Demo 4: Check Robbie's Personality

```bash
curl http://localhost:3001/api/personality/allan | jq .
```

**Expected Output:**

```json
{
  "success": true,
  "personality": {
    "user_id": "allan",
    "current_mood": "focused",
    "gandhi_genghis_level": 7,
    "attraction_level": 8,
    "updated_at": "2025-10-08T..."
  }
}
```

**Update Robbie's mood:**

```bash
curl -X PUT http://localhost:3001/api/personality/allan \
  -H "Content-Type: application/json" \
  -d '{
    "current_mood": "playful",
    "gandhi_genghis_level": 8
  }' | jq .
```

### Demo 5: See What's in the Database

```bash
cd /home/allan/robbie_workspace/combined/aurora-ai-robbiverse/robbieverse-api

# Count conversations
docker-compose exec postgres psql -U robbie -d robbieverse \
  -c "SELECT COUNT(*) FROM code_conversations;"

# Count messages
docker-compose exec postgres psql -U robbie -d robbieverse \
  -c "SELECT COUNT(*) FROM code_messages;"

# See recent conversations
docker-compose exec postgres psql -U robbie -d robbieverse \
  -c "SELECT title, context_type, created_at FROM code_conversations ORDER BY created_at DESC LIMIT 5;"

# Check personality state
docker-compose exec postgres psql -U robbie -d robbieverse \
  -c "SELECT * FROM robbie_personality_state WHERE user_id = 'allan';"
```

## 🎬 THE FULL DEMO

### Step 1: Start Everything

```bash
/home/allan/robbie_workspace/combined/aurora-ai-robbiverse/START_SMART_ROBBIE.sh
```

### Step 2: Open VS Code

```bash
code /home/allan/robbie_workspace/combined/aurora-ai-robbiverse
```

### Step 3: Test Chat (Cmd+L)

1. Press **Cmd+L**
2. Chat appears in right panel
3. Ask: "Explain the architecture of this codebase"
4. Robbie responds using GPUs
5. Message gets saved to Postgres with embeddings

### Step 4: Test Inline Edit (Cmd+I)

1. Open `robbieverse-api/src/server.ts`
2. Select the `getEmbedding` function
3. Press **Cmd+I**
4. Type: "Add better error logging"
5. Robbie edits in place

### Step 5: Test Memory Persistence

1. Close VS Code
2. Reopen VS Code
3. Press **Cmd+L**
4. Ask: "What did we just talk about?"
5. Robbie remembers the previous conversation

### Step 6: Check the Logs

```bash
# API logs
tail -f /tmp/robbie-api.log

# See embedding generation happening
# See database queries
# See Ollama requests
```

## 📊 WHAT YOU'RE SEEING

**When you chat:**

1. Your message → Robbieverse API
2. API generates embedding (nomic-embed-text on your GPU)
3. API searches past conversations (vector similarity)
4. API builds enriched context
5. API sends to Ollama (qwen2.5-coder:7b on your GPU)
6. Response streams back
7. Everything saves to Postgres

**The difference vs Cursor:**

- Cursor: Question → LLM → Response → **FORGET**
- Robbie: Question → Vector Search → Enriched Context → LLM → Response → **REMEMBER FOREVER**

## 🎯 THE PROOF

**Try this test:**

**Day 1:**

```
You: "I prefer using Result<T, E> pattern for error handling"
Robbie: "Got it, I'll remember that"
```

**Day 2 (new session):**

```
You: "Add error handling to this function"
Robbie: "Based on your preference for Result<T, E> pattern..."
```

**Cursor would have NO IDEA what you prefer.**
**Robbie REMEMBERS.**

## 🚀 SUCCESS CRITERIA

✅ Cmd+L opens chat
✅ Chat responses work
✅ Cmd+I edits code
✅ Autocomplete suggests as you type
✅ API shows "Embeddings: Local ✅"
✅ Database has conversations and messages
✅ Vector search returns relevant results
✅ Robbie remembers across sessions

## 🎉 YOU'RE DONE

You now have:

- AI coding assistant with **persistent memory**
- **100% local** (your GPUs, your data)
- **Vector search** of all past conversations
- **Pattern learning** from your code
- **Robbie's personality** across all interfaces

**This is what Cursor should be.**
**This is what Continue doesn't have.**
**This is yours.** 🚀

