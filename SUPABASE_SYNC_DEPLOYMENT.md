# Supabase Sync Service Deployment Guide

## Overview

This guide explains how to deploy the **READ-ONLY** sync service between Supabase (TestPilot CPG production) and local PostgreSQL nodes.

## 🔒 **SAFE MODE: READ-ONLY BY DEFAULT**

**The sync service is configured in READ-ONLY mode:**
- ✅ Pulls data FROM Supabase to local nodes
- ❌ NEVER writes back to Supabase
- 🔒 Zero risk to production database
- 💰 Your $289K revenue stream is 100% safe

## Prerequisites

✅ **Completed Steps:**

- [x] Supabase schema replicated locally (`22-testpilot-production.sql`)
- [x] Production data imported (1,377 rows from 33 tables)
- [x] Sync service code created (`supabase-sync.ts`)
- [x] API routes configured (`sync-routes.ts`)

## Environment Setup

### 1. Environment Variables

Create `.env` file in `packages/@robbieverse/api/`:

```bash
# Supabase Configuration
SUPABASE_URL=https://hykelmayopljuguuueme.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Local Database
DATABASE_URL=postgresql://robbie:robbie_dev_2025@localhost:5432/robbieverse

# Sync Configuration
SYNC_ENABLED=true
SYNC_INTERVAL=30000  # 30 seconds
SYNC_READ_ONLY=true  # 🔒 SAFE MODE: Never write to Supabase
```

### 2. Install Dependencies

```bash
cd packages/@robbieverse/api
npm install @supabase/supabase-js pg
```

## Deployment Options

### Option 1: Standalone Sync Service

Run the sync service independently:

```bash
# Make executable
chmod +x scripts/start-sync-service.js

# Start sync service
node scripts/start-sync-service.js
```

**Output:**

```
🚀 Starting TestPilot CPG Sync Service...
📊 Syncing with Supabase: https://hykelmayopljuguuueme.supabase.co
🗄️  Local database: postgresql://***:***@localhost:5432/robbieverse
⏰ Sync interval: 30 seconds
🔒 Mode: READ-ONLY (safe - never writes to Supabase)
📋 Tables to sync: companies, tests, test_variations, ...
✅ Sync service started - syncing every 30s
📥 READ-ONLY sync...
```

### Option 2: Integrated with Robbieverse API

The sync service is integrated into the main FastAPI application:

```bash
cd packages/@robbieverse/api
python main.py
```

**API Endpoints:**

- `POST /api/sync/start` - Start sync service
- `POST /api/sync/stop` - Stop sync service  
- `GET /api/sync/status` - Get sync status
- `POST /api/sync/sync-table/{tableName}` - Sync specific table
- `GET /api/sync/config` - Get sync configuration

### Option 3: Docker Deployment

Create `docker-compose.sync.yml`:

```yaml
version: '3.8'
services:
  sync-service:
    build: .
    environment:
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
      - DATABASE_URL=postgresql://robbie:robbie_dev_2025@postgres:5432/robbieverse
      - SYNC_ENABLED=true
    depends_on:
      - postgres
    restart: unless-stopped
    command: node scripts/start-sync-service.js

  postgres:
    image: pgvector/pgvector:pg16
    environment:
      - POSTGRES_DB=robbieverse
      - POSTGRES_USER=robbie
      - POSTGRES_PASSWORD=robbie_dev_2025
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ../database:/docker-entrypoint-initdb.d:ro
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

## Monitoring & Verification

### 1. Check Sync Status

```bash
# Via API
curl http://localhost:8000/api/sync/status

# Response:
{
  "success": true,
  "running": true,
  "status": [
    {
      "table_name": "companies",
      "total_rows": 40,
      "synced_rows": 40,
      "pending_rows": 0,
      "last_update": "2025-01-09T..."
    }
  ]
}
```

### 2. Test Bidirectional Sync

**Test 1: Supabase → Local**

1. Make a change in Supabase dashboard
2. Wait 30 seconds
3. Check local database - change should appear

**Test 2: Local → Supabase**

1. Update local database:

   ```sql
   UPDATE companies SET name = 'Test Update' WHERE id = 1;
   ```

2. Wait 30 seconds  
3. Check Supabase dashboard - change should appear

### 3. Monitor Logs

```bash
# Standalone service
tail -f sync-service.log

# Integrated API
tail -f api.log | grep "sync"
```

**Expected log output:**

```
🔄 Performing bidirectional sync...
✅ Synced table: companies
✅ Synced table: tests
📥 Synced 2 rows from Supabase to local (companies)
📤 Synced 1 rows from local to Supabase (tests)
```

## Troubleshooting

### Common Issues

**1. Connection Errors**

```
❌ Error: connect ECONNREFUSED
```

- Check if PostgreSQL is running: `docker ps`
- Verify connection string in `.env`

**2. Authentication Errors**

```
❌ Error: Invalid API key
```

- Verify Supabase keys in `.env`
- Check if service role key has proper permissions

**3. Schema Mismatches**

```
❌ Error: column "updated_at" does not exist
```

- Run schema update: `docker exec robbieverse-postgres psql -U robbie -d robbieverse -f /docker-entrypoint-initdb.d/22-testpilot-production.sql`

**4. Sync Not Working**

```
❌ No data syncing
```

- Check sync status: `GET /api/sync/status`
- Verify tables in sync configuration
- Check network connectivity to Supabase

### Debug Mode

Enable detailed logging:

```bash
DEBUG=true node scripts/start-sync-service.js
```

## Production Deployment

### RobbieBook1 (MacBook)

```bash
# Start sync service
pm2 start scripts/start-sync-service.js --name "testpilot-sync"

# Monitor
pm2 logs testpilot-sync
```

### Aurora Town (RunPod)

```bash
# Start with systemd
sudo systemctl start testpilot-sync

# Check status
sudo systemctl status testpilot-sync
```

### Monitoring Setup

**Health Checks:**

- API endpoint: `GET /api/sync/status`
- Database connectivity: `pg_isready`
- Supabase connectivity: `curl` to Supabase API

**Alerts:**

- Sync service down
- High error rates
- Data inconsistencies
- Network connectivity issues

## Success Criteria

✅ **Deployment Complete When:**

1. Sync service starts without errors
2. All 14 tables syncing successfully
3. Bidirectional sync working (< 30s latency)
4. No data corruption or duplicates
5. Monitoring and alerting configured
6. Graceful shutdown handling

## Next Steps

1. **Test Sync Service** - Verify bidirectional sync works
2. **Deploy to Network Nodes** - RobbieBook1, Aurora Town
3. **Monitor Production** - Watch for 24 hours
4. **Build HeyShopper** - Use TestPilot data as blueprint

---

🎯 **Ready to deploy the sync service and get TestPilot data flowing to all your nodes!**
