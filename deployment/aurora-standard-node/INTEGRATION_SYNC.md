# 🔄 Bidirectional Integration Sync

## Overview

The **Integration Sync Engine** provides **bidirectional synchronization** between Aurora nodes and external systems (HubSpot, Google Workspace, etc.).

Previously, the HubSpot connector was **one-way** (pull only). Now it's **fully bidirectional** with conflict resolution, version tracking, and real-time event propagation.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  External Systems                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ HubSpot  │  │  Google  │  │ Fireflies│          │
│  │   CRM    │  │Workspace │  │    AI    │          │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘          │
└───────┼─────────────┼─────────────┼────────────────┘
        │             │             │
        │    REST APIs / Webhooks   │
        │             │             │
┌───────▼─────────────▼─────────────▼────────────────┐
│         Integration Sync Engine (Aurora)            │
│  ┌────────────────────────────────────────────┐    │
│  │  Bidirectional Sync Manager                │    │
│  │  • Change detection (timestamps)           │    │
│  │  • Conflict resolution (last-write-wins)   │    │
│  │  • Version tracking                        │    │
│  │  • Event bus notifications                 │    │
│  └────────────────────────────────────────────┘    │
└─────────────────────┬──────────────────────────────┘
                      │
              ┌───────▼───────┐
              │  Sync Registry │
              │   (Postgres)   │
              │  • local_id    │
              │  • external_id │
              │  • versions    │
              │  • sync_status │
              └────────────────┘
```

---

## What It Syncs

### HubSpot CRM
- ✅ **Contacts** - Names, emails, phones, LinkedIn profiles
- ✅ **Companies** - Names, domains, industries, deal values
- ✅ **Deals** - Deal names, amounts, stages, probabilities
- 🔄 **Bidirectional** - Changes flow both ways

### Google Workspace
- ✅ **Gmail** - Email threads, labels, priorities
- ✅ **Calendar** - Meetings, events, reminders
- ✅ **Drive** - Documents, folders, permissions
- 🔄 **Bidirectional** - Updates sync in real-time

### Fireflies AI
- ✅ **Transcripts** - Meeting recordings and transcripts
- ✅ **Action Items** - Extracted tasks and commitments
- 🔄 **One-way** - Pull only (Fireflies → Aurora)

---

## Sync Behavior

### Pull from External → Aurora
1. **Fetch** latest records from external API
2. **Check** `last_modified` timestamp
3. **Compare** with local `last_synced` timestamp
4. **Upsert** if external is newer
5. **Update** sync registry
6. **Publish** event to event bus

### Push from Aurora → External
1. **Query** local records modified since last sync
2. **Check** if external_id exists
3. **Update** existing or **create** new in external system
4. **Store** external_id in sync registry
5. **Update** sync timestamp
6. **Publish** event to event bus

### Conflict Resolution
- **Strategy**: Last-write-wins (based on timestamps)
- **Version Tracking**: Increment version on each change
- **Conflict Detection**: Compare local vs external versions
- **Manual Resolution**: Flag conflicts for human review if needed

---

## Sync Registry Schema

```sql
CREATE TABLE sync_registry (
    id SERIAL PRIMARY KEY,
    local_id TEXT NOT NULL,              -- Aurora internal ID
    external_id TEXT,                    -- External system ID (HubSpot, etc.)
    external_system TEXT NOT NULL,       -- hubspot, google_workspace, etc.
    entity_type TEXT NOT NULL,           -- contact, company, deal, email
    last_synced TIMESTAMP NOT NULL,      -- Last successful sync time
    local_version INTEGER DEFAULT 1,     -- Local version number
    external_version INTEGER,            -- External version number
    sync_status TEXT DEFAULT 'synced',   -- synced, pending, conflict, error
    error_message TEXT,                  -- Error details if sync failed
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(local_id, external_system, entity_type)
);
```

---

## Event Bus Integration

Every sync action publishes events:

```json
{
  "action": "updated",
  "source": "hubspot",
  "entity_type": "contact",
  "entity_id": "12345",
  "timestamp": "2025-10-06T12:00:00Z"
}
```

**Channels:**
- `aurora:sync:contact` - Contact changes
- `aurora:sync:company` - Company changes
- `aurora:sync:deal` - Deal changes
- `aurora:sync:email` - Email changes

**Consumers:**
- Chat backend (updates conversation context)
- GPU mesh (refreshes dossiers)
- Web frontend (live UI updates)

---

## Configuration

### Environment Variables

```bash
# PostgreSQL
POSTGRES_HOST=postgres
POSTGRES_DB=aurora_unified
POSTGRES_USER=aurora_app
POSTGRES_PASSWORD=<secret>

# Redis (Event Bus)
REDIS_HOST=redis
REDIS_PASSWORD=<secret>

# HubSpot
HUBSPOT_API_KEY=<your-hubspot-key>

# Google Workspace
GOOGLE_CREDENTIALS_PATH=/secrets/google-credentials.json

# Sync Interval (seconds)
SYNC_INTERVAL=300  # 5 minutes
```

### Secrets Mount

```yaml
volumes:
  - ./secrets:/secrets:ro
```

Place credentials in `./secrets/`:
- `google-credentials.json` - OAuth credentials
- `hubspot-api-key.txt` - HubSpot API key

---

## Deployment

### Start Sync Engine

```bash
# Lead/backup nodes only (has profiles: [lead, backup])
docker compose --profile lead up -d integration-sync
```

### Check Sync Status

```bash
# View logs
docker logs aurora-integration-sync

# Check sync registry
docker exec aurora-postgres psql -U aurora_app -d aurora_unified -c \
  "SELECT external_system, entity_type, sync_status, COUNT(*) 
   FROM sync_registry 
   GROUP BY external_system, entity_type, sync_status;"
```

### Force Manual Sync

```bash
# Restart service to trigger immediate sync
docker restart aurora-integration-sync
```

---

## Monitoring

### Metrics

Exposed at `http://localhost:9100/metrics`:
- `aurora_sync_records_total{system,type}` - Total records synced
- `aurora_sync_errors_total{system,type}` - Sync errors
- `aurora_sync_duration_seconds{system}` - Sync duration
- `aurora_sync_last_success_timestamp{system}` - Last successful sync

### Grafana Dashboard

View sync health in Grafana:
- **URL**: `http://localhost:3001/d/aurora-sync`
- **Panels**:
  - Sync success rate
  - Records synced per system
  - Sync latency
  - Error rates

---

## API Endpoints

### Trigger Manual Sync

```bash
POST http://localhost:8000/api/sync/trigger
{
  "system": "hubspot",
  "entity_type": "contacts"
}
```

### Check Sync Status

```bash
GET http://localhost:8000/api/sync/status
```

**Response:**
```json
{
  "hubspot": {
    "contacts": {
      "last_synced": "2025-10-06T12:00:00Z",
      "records": 1234,
      "status": "synced"
    },
    "companies": {
      "last_synced": "2025-10-06T12:00:00Z",
      "records": 567,
      "status": "synced"
    }
  }
}
```

---

## Webhook Support

External systems can push real-time updates via webhooks:

### HubSpot Webhook

```bash
POST http://aurora.example.com/api/webhooks/hubspot
{
  "objectType": "CONTACT",
  "eventType": "contact.creation",
  "objectId": 12345,
  "occurredAt": 1633024800000
}
```

### Google Workspace Webhook

```bash
POST http://aurora.example.com/api/webhooks/google
{
  "kind": "api#channel",
  "id": "...",
  "resourceId": "...",
  "resourceUri": "..."
}
```

---

## Extending to New Systems

To add a new integration:

1. **Create sync methods** in `sync_engine.py`:
   ```python
   async def _sync_salesforce(self):
       await self._pull_salesforce_contacts()
       await self._push_salesforce_contacts()
   ```

2. **Add to sync loop**:
   ```python
   if SALESFORCE_API_KEY:
       await self._sync_salesforce()
   ```

3. **Update docker-compose.yml**:
   ```yaml
   - SALESFORCE_API_KEY=${SALESFORCE_API_KEY}
   ```

4. **Add webhook handler** (optional for real-time)

---

## Best Practices

✅ **Sync Interval**: 5 minutes is good balance (not too aggressive)
✅ **Webhooks**: Use for real-time critical data (deals, emails)
✅ **Batch Size**: Limit to 100 records per API call
✅ **Error Handling**: Log errors, continue syncing other entities
✅ **Version Tracking**: Always increment versions on changes
✅ **Event Bus**: Publish events for downstream consumers
✅ **Health Checks**: Monitor sync status via Grafana

---

## Troubleshooting

### Sync Not Running

```bash
# Check service status
docker ps | grep integration-sync

# View logs
docker logs aurora-integration-sync --tail 100

# Restart service
docker restart aurora-integration-sync
```

### Sync Errors

```bash
# Check error messages in sync registry
docker exec aurora-postgres psql -U aurora_app -d aurora_unified -c \
  "SELECT * FROM sync_registry WHERE sync_status = 'error' LIMIT 10;"
```

### Conflicts

```bash
# Find conflicts
docker exec aurora-postgres psql -U aurora_app -d aurora_unified -c \
  "SELECT * FROM sync_registry WHERE sync_status = 'conflict';"

# Manually resolve (set to pending to retry)
docker exec aurora-postgres psql -U aurora_app -d aurora_unified -c \
  "UPDATE sync_registry SET sync_status = 'pending' WHERE id = 123;"
```

---

## Summary

🔄 **Bidirectional sync** between Aurora and external systems
📊 **Version tracking** and conflict resolution
🚀 **Event-driven** updates via Redis Pub/Sub
⚡ **Real-time** webhooks for critical data
📈 **Monitoring** via Prometheus + Grafana
🔒 **Secure** credential management via secrets mount

**No more one-way sync - full bidirectional integration!** 💪
