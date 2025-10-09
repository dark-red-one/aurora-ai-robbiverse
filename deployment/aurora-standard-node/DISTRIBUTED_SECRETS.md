# 🔐 Distributed Secrets Management

## Overview

All nodes share API credentials through a **centralized Secrets Manager** running on the lead node (Aurora). Each node can **override** global credentials with node-specific or company-specific variants.

**Perfect for multi-tenant scenarios!** (e.g., "Company Town" with their own HubSpot instance)

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│         AURORA (Lead Node - Secrets Manager)            │
│  ┌────────────────────────────────────────────────┐    │
│  │  Global Credentials Store                      │    │
│  │  • HubSpot API Key (global)                    │    │
│  │  • Google Workspace (global)                   │    │
│  │  • Stripe (global)                             │    │
│  │  • OpenAI API Key (global)                     │    │
│  │  • Fireflies API (global)                      │    │
│  └────────────────────────────────────────────────┘    │
└──────────────────────┬──────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
┌───────▼──────┐ ┌─────▼──────┐ ┌────▼───────┐
│ RunPod TX    │ │ Vengeance  │ │ RobbieBook1│
│              │ │            │ │            │
│ Uses global  │ │ OVERRIDE:  │ │ Uses global│
│ credentials  │ │ Custom     │ │ credentials│
│              │ │ HubSpot    │ │            │
│              │ │ for        │ │            │
│              │ │ "Company   │ │            │
│              │ │  Town"     │ │            │
└──────────────┘ └────────────┘ └────────────┘
```

---

## How Override Logic Works

When a node requests a credential, the Secrets Manager checks in order:

```
1. Node-specific override
   ↓ (not found)
2. Company-specific override  
   ↓ (not found)
3. Global credential
   ↓ (not found)
4. Error (credential missing)
```

---

## API Examples

### 1. Store Global Credential

```bash
POST http://aurora.local:8003/api/secrets
Content-Type: application/json

{
  "service": "hubspot",
  "key_name": "api_key",
  "key_value": "pat-na1-abc123...",
  "scope": "global",
  "metadata": {
    "description": "TestPilot CPG HubSpot",
    "owner": "Allan"
  }
}
```

**Response:**
```json
{
  "success": true,
  "secret_id": 1,
  "message": "Secret stored successfully"
}
```

---

### 2. Store Company-Specific Override

```bash
POST http://aurora.local:8003/api/secrets
Content-Type: application/json

{
  "service": "hubspot",
  "key_name": "api_key",
  "key_value": "pat-na1-xyz789...",
  "scope": "company",
  "scope_id": "company-town-foods",
  "metadata": {
    "description": "Company Town Foods' own HubSpot",
    "contact": "jane@companytownfoods.com"
  }
}
```

---

### 3. Store Node-Specific Override

```bash
POST http://aurora.local:8003/api/secrets
Content-Type: application/json

{
  "service": "openai",
  "key_name": "api_key",
  "key_value": "sk-vengeance-special...",
  "scope": "node",
  "scope_id": "vengeance",
  "metadata": {
    "description": "Vengeance has higher rate limits",
    "note": "Paid tier"
  }
}
```

---

### 4. Retrieve Credential (with Override)

```bash
GET http://aurora.local:8003/api/secrets/hubspot/api_key
Headers:
  X-Node-Name: vengeance
  X-Company-Id: company-town-foods
```

**Response (company override applied):**
```json
{
  "service": "hubspot",
  "key_name": "api_key",
  "key_value": "pat-na1-xyz789...",
  "scope": "company",
  "scope_id": "company-town-foods",
  "metadata": {
    "description": "Company Town Foods' own HubSpot"
  },
  "override_applied": "company"
}
```

---

### 5. Retrieve Credential (global fallback)

```bash
GET http://aurora.local:8003/api/secrets/hubspot/api_key
Headers:
  X-Node-Name: runpod-tx
```

**Response (no override, using global):**
```json
{
  "service": "hubspot",
  "key_name": "api_key",
  "key_value": "pat-na1-abc123...",
  "scope": "global",
  "scope_id": null,
  "metadata": {
    "description": "TestPilot CPG HubSpot"
  },
  "override_applied": null
}
```

---

## API Connectivity Status Sharing

Each node reports API health status to the Secrets Manager, giving **mesh-wide visibility** of which APIs are working.

### Report API Status

```bash
POST http://aurora.local:8003/api/connectivity/status
Headers:
  X-Node-Name: vengeance
Content-Type: application/json

{
  "service": "hubspot",
  "status": "healthy",
  "response_time_ms": 145
}
```

**Response:**
```json
{
  "success": true,
  "message": "Status updated"
}
```

---

### Get API Connectivity Status

```bash
GET http://aurora.local:8003/api/connectivity/status?service=hubspot
```

**Response:**
```json
{
  "services": [
    {
      "service": "hubspot",
      "overall_status": "healthy",
      "nodes": [
        {
          "node": "aurora",
          "status": "healthy",
          "response_time_ms": 132,
          "last_error": null,
          "last_check": "2025-10-06T15:30:00Z"
        },
        {
          "node": "vengeance",
          "status": "healthy",
          "response_time_ms": 145,
          "last_error": null,
          "last_check": "2025-10-06T15:30:05Z"
        },
        {
          "node": "runpod-tx",
          "status": "degraded",
          "response_time_ms": 2400,
          "last_error": "Timeout after 2s",
          "last_check": "2025-10-06T15:29:45Z"
        }
      ]
    }
  ],
  "total_services": 1
}
```

---

### Get Overall Health

```bash
GET http://aurora.local:8003/api/connectivity/health
```

**Response:**
```json
{
  "overall_status": "degraded",
  "total_services": 5,
  "healthy": 4,
  "degraded": 1,
  "down": 0,
  "timestamp": "2025-10-06T15:30:00Z"
}
```

---

## Supported Services

### Current Integrations

| Service | Global Credentials | Override Support |
|---------|-------------------|------------------|
| HubSpot | ✅ API Key | ✅ Company-level |
| Google Workspace | ✅ OAuth2 | ✅ Node-level |
| Stripe | ✅ Secret Key | ✅ Company-level |
| OpenAI | ✅ API Key | ✅ Node-level |
| Fireflies | ✅ API Key | ✅ Node-level |
| GitHub | ✅ Personal Access Token | ✅ Node-level |
| Slack | ✅ Bot Token | ✅ Company-level |

---

## Multi-Tenant Example: Company Town Foods

**Scenario:** Company Town Foods is a TestPilot client who wants to use their own HubSpot instance.

### Setup

1. **Store their HubSpot credentials:**
```bash
POST /api/secrets
{
  "service": "hubspot",
  "key_name": "api_key",
  "key_value": "pat-na1-companytown...",
  "scope": "company",
  "scope_id": "company-town-foods"
}
```

2. **Configure their requests to include company ID:**
```python
# In their sync service
import requests

# Get HubSpot credentials for Company Town
response = requests.get(
    "http://aurora.local:8003/api/secrets/hubspot/api_key",
    headers={
        "X-Node-Name": "vengeance",
        "X-Company-Id": "company-town-foods"
    }
)

credentials = response.json()
hubspot_key = credentials["key_value"]

# Now use their own HubSpot instance
hubspot_api = HubSpotClient(api_key=hubspot_key)
```

3. **Result:**
   - Company Town's node uses their HubSpot
   - All other nodes use TestPilot's global HubSpot
   - No credential conflicts!

---

## Security Features

### 1. Encryption at Rest
All secrets are encrypted using **Fernet** (AES-128) before storage:

```python
from cryptography.fernet import Fernet

# Generate encryption key (store in secure vault!)
ENCRYPTION_KEY = Fernet.generate_key()
cipher = Fernet(ENCRYPTION_KEY)

# Encrypt secret
encrypted = cipher.encrypt(secret_value.encode())

# Decrypt when retrieved
decrypted = cipher.decrypt(encrypted).decode()
```

### 2. Redis Caching
Secrets are cached in Redis for 5 minutes to reduce database load:

```python
cache_key = f"secret:{service}:{key_name}:{scope}:{scope_id}"
redis_client.setex(cache_key, 300, json.dumps(secret))
```

Cache is **invalidated** on update.

### 3. Audit Trail
Every access is logged:

```sql
CREATE TABLE secrets_audit_log (
    id SERIAL PRIMARY KEY,
    node_name TEXT,
    service TEXT,
    key_name TEXT,
    action TEXT,  -- read, write, delete
    scope TEXT,
    scope_id TEXT,
    timestamp TIMESTAMP DEFAULT NOW()
);
```

---

## Node Heartbeat & Health Monitoring

Each node runs a **connectivity monitor** that checks API health every 60 seconds:

```python
# services/health-monitor/monitor.py (updated)

import asyncio
import httpx

async def check_api_connectivity():
    """Check API connectivity and report to secrets manager"""
    
    apis_to_check = [
        {"service": "hubspot", "url": "https://api.hubapi.com/crm/v3/objects/contacts?limit=1"},
        {"service": "google", "url": "https://www.googleapis.com/gmail/v1/users/me/profile"},
        {"service": "stripe", "url": "https://api.stripe.com/v1/charges?limit=1"},
        {"service": "openai", "url": "https://api.openai.com/v1/models"},
    ]
    
    for api in apis_to_check:
        try:
            start = time.time()
            
            # Get credentials
            creds = await get_secret(api["service"], "api_key")
            
            # Make test request
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    api["url"],
                    headers={"Authorization": f"Bearer {creds}"},
                    timeout=5.0
                )
            
            duration_ms = int((time.time() - start) * 1000)
            
            # Report status
            status = "healthy" if response.status_code < 400 else "degraded"
            await report_status(api["service"], status, duration_ms)
            
        except Exception as e:
            # Report failure
            await report_status(api["service"], "down", None, str(e))
```

---

## Environment Variables

```bash
# In .env file

# Encryption key (CRITICAL - store securely!)
ENCRYPTION_KEY=<32-byte-base64-key>

# Database
POSTGRES_HOST=postgres
POSTGRES_PASSWORD=<secret>

# Redis
REDIS_HOST=redis
REDIS_PASSWORD=<secret>

# Node identity
NODE_NAME=aurora
NODE_ROLE=lead
```

---

## Usage in Services

### Integration Sync Service

```python
# services/integration-sync/sync_engine.py

async def get_hubspot_credentials(company_id=None):
    """Get HubSpot credentials with company override support"""
    async with httpx.AsyncClient() as client:
        headers = {"X-Node-Name": os.getenv("NODE_NAME")}
        
        if company_id:
            headers["X-Company-Id"] = company_id
        
        response = await client.get(
            "http://secrets-manager:8003/api/secrets/hubspot/api_key",
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            return data["key_value"]
        else:
            raise Exception("Failed to get HubSpot credentials")
```

### Chat Backend

```python
# services/chat-backend/main.py

async def get_openai_key():
    """Get OpenAI API key (node-specific override possible)"""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "http://secrets-manager:8003/api/secrets/openai/api_key",
            headers={"X-Node-Name": os.getenv("NODE_NAME")}
        )
        
        return response.json()["key_value"]
```

---

## Management UI

Add to Robbie Unified Interface:

```javascript
// Secrets Manager Panel

async function loadSecrets() {
  const response = await fetch('http://localhost:8003/api/secrets');
  const data = await response.json();
  
  renderSecretsTable(data.secrets);
}

async function addSecret(service, keyName, keyValue, scope, scopeId) {
  await fetch('http://localhost:8003/api/secrets', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      service,
      key_name: keyName,
      key_value: keyValue,
      scope,
      scope_id: scopeId
    })
  });
  
  loadSecrets();  // Refresh
}
```

---

## Best Practices

✅ **Store encryption key in secure vault** (not in code!)
✅ **Use company overrides for multi-tenant** scenarios
✅ **Use node overrides for different rate limits** or regions
✅ **Monitor API connectivity status** across all nodes
✅ **Rotate credentials regularly** (API keys, tokens)
✅ **Audit secret access** for security compliance
✅ **Cache secrets** to reduce latency (5 min TTL)
✅ **Publish events** when secrets change (invalidate caches)

---

## Event Bus Integration

### Secret Updated Event

```python
# Published when secret is created/updated
redis.publish("aurora:secrets:updated", json.dumps({
    "service": "hubspot",
    "key_name": "api_key",
    "scope": "global",
    "timestamp": "2025-10-06T15:30:00Z"
}))
```

### API Status Event

```python
# Published when API status changes
redis.publish("aurora:api:status", json.dumps({
    "node": "vengeance",
    "service": "hubspot",
    "status": "degraded",
    "timestamp": "2025-10-06T15:30:00Z"
}))
```

**Subscribers:**
- Web frontend (show API status indicators)
- Alert system (notify on service degradation)
- Load balancer (route away from degraded nodes)

---

## Summary

🔐 **Centralized credential management** - One place for all API keys
🔄 **Automatic sync** - All nodes get credentials from lead node
🎯 **Override support** - Node-specific and company-specific variants
📊 **Connectivity sharing** - All nodes report API health status
🔒 **Encrypted storage** - Secrets encrypted at rest
⚡ **Redis caching** - Fast retrieval with 5-min TTL
📡 **Event-driven** - Real-time updates via event bus
🏢 **Multi-tenant ready** - Perfect for client-specific integrations

**No more copying .env files to every node!** 🚀
