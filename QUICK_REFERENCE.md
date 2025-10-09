# 🚀 SMART ROBBIE@CODE - QUICK REFERENCE

## 📍 Key Locations

```bash
# Main workspace
/home/allan/robbie_workspace/combined/aurora-ai-robbiverse/

# VS Code Extension (installed)
robbie-code/robbie-code-0.1.0.vsix

# Backend API
robbieverse-api/

# Postgres data
robbieverse-api/ → docker volume
```

## ⚡ Quick Commands

### Start Everything

```bash
/home/allan/robbie_workspace/combined/aurora-ai-robbiverse/START_SMART_ROBBIE.sh
```

### Stop Everything

```bash
# Stop API
pkill -f "node dist/server.js"

# Stop Postgres
cd robbieverse-api && docker-compose down
```

### Check Status

```bash
# API
curl http://localhost:3001/health | jq .

# Database
cd robbieverse-api
docker-compose exec postgres psql -U robbie -d robbieverse -c "\dt"

# Ollama
curl http://localhost:11435/api/tags | jq .
```

### View Logs

```bash
# API logs
tail -f /tmp/robbie-api.log

# Postgres logs
cd robbieverse-api && docker-compose logs -f postgres
```

## 🎮 VS Code Shortcuts

| Key | Action |
|-----|--------|
| **Cmd+L** | Open chat panel |
| **Cmd+I** | Inline edit selection |
| **Cmd+Shift+P** → "Robbie: Explain Code" | Explain selection |

## 🔧 Troubleshooting

### API Not Responding

```bash
pkill -f "node dist/server.js"
cd robbieverse-api
USE_LOCAL_EMBEDDINGS=true \
POSTGRES_HOST=localhost \
POSTGRES_PORT=5432 \
POSTGRES_DB=robbieverse \
POSTGRES_USER=robbie \
POSTGRES_PASSWORD=robbie_dev_2025 \
OLLAMA_BASE_URL=http://localhost:11435 \
PORT=3001 \
node dist/server.js &
```

### Postgres Not Running

```bash
cd robbieverse-api && docker-compose up -d
```

### Extension Not Loading

```bash
cd robbie-code
npm run build
npx vsce package
code --install-extension robbie-code-0.1.0.vsix
# Reload VS Code
```

### Embeddings Not Working

```bash
# Check if model exists
curl http://localhost:11435/api/tags | grep nomic

# Pull if missing
curl -X POST http://localhost:11435/api/pull \
  -d '{"name":"nomic-embed-text"}'
```

## 📊 Monitoring

### Database Stats

```bash
cd robbieverse-api
docker-compose exec postgres psql -U robbie -d robbieverse << 'SQL'
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  n_live_tup as rows
FROM pg_stat_user_tables 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
SQL
```

### Memory Usage

```bash
# API process
ps aux | grep "node dist/server.js"

# Postgres
docker stats robbieverse-postgres

# Ollama
nvidia-smi
```

## 🎯 Common Tasks

### Search Past Conversations

```bash
curl -X POST http://localhost:3001/api/search/messages \
  -H "Content-Type: application/json" \
  -d '{"query": "your search here", "limit": 5}' | jq .
```

### Save a Pattern

```bash
curl -X POST http://localhost:3001/api/patterns \
  -H "Content-Type: application/json" \
  -d '{
    "pattern_type": "error_handling",
    "pattern_name": "API Error Pattern",
    "example_code": "try { ... } catch (e) { ... }",
    "explanation": "Standard error handling"
  }' | jq .
```

### Update Robbie's Mood

```bash
curl -X PUT http://localhost:3001/api/personality/allan \
  -H "Content-Type: application/json" \
  -d '{"current_mood": "focused"}' | jq .
```

### Backup Database

```bash
cd robbieverse-api
docker-compose exec postgres pg_dump -U robbie robbieverse > backup.sql
```

### Restore Database

```bash
cd robbieverse-api
cat backup.sql | docker-compose exec -T postgres psql -U robbie robbieverse
```

## 🚀 What's Next

See `DEMO_SMART_ROBBIE.md` for full demo script
See `SMART_ROBBIE_COMPLETE.md` for complete documentation

---

**Built with:** PostgreSQL + pgvector | Express | nomic-embed-text | qwen2.5-coder | Dual RTX 4090s

