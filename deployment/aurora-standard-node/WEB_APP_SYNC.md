# 🔄 Web App Synchronization Across Nodes

## 🎯 The Question: How Do Web Apps Stay Synced?

When you have multiple nodes, how do HTML/JS/CSS files stay synchronized?

**Answer:** Automatic asset synchronization via the Asset Sync service.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ AURORA (Origin Server)                                       │
│                                                               │
│  MinIO S3 Bucket: aurora-assets                              │
│  ├─ webapps/                                                 │
│  │  ├─ robbie-unified-interface.html                         │
│  │  ├─ robbie-terminal.html                                  │
│  │  ├─ static/css/styles.css                                 │
│  │  ├─ static/js/app.js                                      │
│  │  └─ images/robbie-avatar.png                              │
│  └─ assets/                                                  │
│     ├─ logos/                                                │
│     └─ backgrounds/                                          │
└─────────────────────────────────────────────────────────────┘
                         │
              Sync every 5 minutes (configurable)
                         │
        ┌────────────────┼────────────────┐
        ↓                ↓                ↓
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ RUNPOD TX   │  │ VENGEANCE   │  │ ROBBIEBOOK1 │
│             │  │             │  │             │
│ asset-sync  │  │ asset-sync  │  │ asset-sync  │
│ service     │  │ service     │  │ service     │
│     ↓       │  │     ↓       │  │     ↓       │
│ /assets/    │  │ /assets/    │  │ /assets/    │
│ (local)     │  │ (local)     │  │ (local)     │
│     ↓       │  │     ↓       │  │     ↓       │
│ nginx       │  │ nginx       │  │ nginx       │
│ serves      │  │ serves      │  │ serves      │
└─────────────┘  └─────────────┘  └─────────────┘
```

---

## 🔄 How It Works

### 1. Upload to Origin (Aurora)

```bash
# Option A: Direct upload to MinIO
aws s3 cp robbie-unified-interface.html \
  s3://aurora-assets/webapps/robbie-unified-interface.html \
  --endpoint-url http://10.0.0.1:9000

# Option B: Use MinIO web console
# http://10.0.0.1:9001
# Login → aurora-assets bucket → Upload

# Option C: Automated CI/CD (GitHub Actions)
# On git push → Upload to Aurora MinIO
```

### 2. Asset Sync Service Detects Change

```python
# Runs every 5 minutes on each node
async def sync_assets():
    # Get manifest from origin
    manifest = await get_manifest('http://10.0.0.1:9000/aurora-assets')
    
    for asset in manifest:
        # Check local file
        local_file = f'/assets/{asset.path}'
        
        # Compare checksums
        if not exists(local_file) or checksum_differs(asset, local_file):
            # Download updated file
            await download(asset, local_file)
            print(f"✅ Synced: {asset.path}")
```

### 3. Nginx Serves from Local Assets

```nginx
server {
    listen 80;
    server_name chat.aurora.local;
    
    # Serve from synced assets directory
    root /assets/webapps;
    
    location / {
        # Try file, then directory, then fallback
        try_files $uri $uri/ /robbie-unified-interface.html;
    }
    
    # Cache static resources
    location ~* \.(js|css|png|jpg|gif|svg)$ {
        expires 1h;
        add_header Cache-Control "public, immutable";
    }
    
    # Proxy API calls to backend
    location /api/ {
        proxy_pass http://chat-backend:8000;
    }
}
```

### 4. User Connects to Any Node

```
User → http://chat.aurora.local
    ↓ (Load balancer or direct)
    ├─> Aurora (10.0.0.1) ✅
    ├─> RunPod TX (10.0.0.3) ✅
    ├─> Vengeance (10.0.0.4) ✅
    └─> RobbieBook1 (10.0.0.5) ✅

All nodes serve same version (synced within last 5 min)
```

---

## ⚡ Sync Modes

### Mode 1: Polling (Default - 5 minutes)

**Pros:**
- Simple, reliable
- No extra configuration
- Works with any S3-compatible storage

**Cons:**
- 5-minute delay for updates

**Configuration:**
```bash
# In .env
ASSET_SYNC_INTERVAL=300  # 5 minutes
```

### Mode 2: Webhook (Instant)

**Pros:**
- Instant propagation (< 1 second)
- Efficient (only syncs when changed)

**Cons:**
- Requires MinIO webhook configuration

**Configuration:**
```bash
# 1. Configure MinIO webhook on Aurora
mc admin config set aurora notify_webhook:1 \
  endpoint="http://event-bus:5000/asset-webhook" \
  queue_limit="10"

# 2. Restart MinIO
mc admin service restart aurora

# 3. Asset sync listens for webhooks
# Receives notification → Syncs immediately
```

### Mode 3: On-Demand (Manual)

```bash
# Force immediate sync on specific node
aurora-cli sync-assets

# Or via API
curl -X POST http://10.0.0.3:9999/sync-assets
```

---

## 📁 What Gets Synced

### Static Web Apps
```
/assets/webapps/
├── robbie-unified-interface.html
├── robbie-terminal.html
├── robbie-avatar-chat.html
├── static/
│   ├── css/
│   │   ├── styles.css
│   │   └── themes/
│   ├── js/
│   │   ├── app.js
│   │   ├── websocket.js
│   │   └── personalities.js
│   └── fonts/
└── templates/
```

### Images & Assets
```
/assets/images/
├── logos/
│   ├── robbie-logo.png
│   ├── testpilot-logo.png
│   └── aurora-icon.svg
├── avatars/
│   ├── robbie-happy.png
│   ├── robbie-thinking.png
│   └── robbie-surprised.png
└── backgrounds/
```

### Generated Content (Optional)
```
/assets/generated/
├── charts/
├── reports/
└── exports/
```

---

## 🚀 Deployment Workflow

### 1. Development → Aurora

```bash
# Developer updates web app
git commit -m "Update chat interface"
git push origin main

# GitHub Actions triggers
name: Deploy Web Apps
on:
  push:
    branches: [main]
    paths:
      - '**.html'
      - 'static/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Upload to Aurora MinIO
        run: |
          aws s3 sync . s3://aurora-assets/webapps/ \
            --endpoint-url ${{ secrets.MINIO_ENDPOINT }} \
            --exclude "*" \
            --include "*.html" \
            --include "static/*"
```

### 2. Aurora → All Nodes (Automatic)

```
Asset sync service on each node:
├─ Detects new files (within 5 min)
├─ Downloads changed files only
├─ Updates local /assets directory
└─ Nginx serves updated files
```

### 3. Verification

```bash
# Check sync status on each node
aurora-cli sync-assets --status

# Output:
Last sync: 2 minutes ago
Files synced: 47
Bytes synced: 3.2 MB
Status: Up to date ✅
```

---

## 🎯 Real-World Example

### Scenario: Update Chat Interface

```bash
# 1. Developer updates HTML locally
vim robbie-unified-interface.html
# Add new feature, fix bug, etc.

# 2. Commit and push
git add robbie-unified-interface.html
git commit -m "Add dark mode toggle"
git push

# 3. CI/CD uploads to Aurora
# GitHub Actions → MinIO upload
# ✅ File now on Aurora

# 4. Asset sync propagates (automatic)
# RunPod TX syncs (within 5 min) ✅
# Vengeance syncs (within 5 min) ✅
# RobbieBook1 syncs (within 5 min) ✅

# 5. Users see update
# Next page load on ANY node → New version ✅
```

**Timeline:**
- 0:00 - Push to GitHub
- 0:01 - Upload to Aurora completes
- 0:06 - All nodes synced (worst case: 5 min + 1 min)
- Users see update on next page load

---

## 💰 Benefits

### For Users
✅ **Consistent experience** - Same version on all nodes
✅ **Fast loading** - Local copy on every node
✅ **High availability** - If one node fails, others work

### For Developers
✅ **Deploy once** - Upload to Aurora, everywhere gets it
✅ **No manual sync** - Automatic propagation
✅ **Version control** - Git tracks changes

### For Operations
✅ **Bandwidth savings** - Nodes only download changes
✅ **Scalable** - Add nodes, they auto-sync
✅ **Observable** - Sync status visible in Grafana

---

## 🔧 Advanced: Cache Invalidation

### Problem: User loads page, browser caches old version

**Solution 1: Cache busting with versioning**

```html
<!-- Add version query parameter -->
<script src="/static/js/app.js?v=20251006"></script>
<link href="/static/css/styles.css?v=20251006" rel="stylesheet">
```

**Solution 2: Event bus cache invalidation**

```python
# When new assets uploaded
await redis_client.publish(
    'aurora:cache:invalidate',
    json.dumps({
        'type': 'asset_update',
        'paths': ['robbie-unified-interface.html']
    })
)

# Nginx receives event, clears cache
# Users get fresh version immediately
```

**Solution 3: Nginx cache headers**

```nginx
# For development
location /static/ {
    expires -1;  # No cache
    add_header Cache-Control "no-store, no-cache, must-revalidate";
}

# For production
location /static/ {
    expires 1h;  # Cache 1 hour
    add_header Cache-Control "public, immutable";
}
```

---

## 📊 Monitoring Asset Sync

### Grafana Dashboard

**Metrics to track:**
- Last sync time per node
- Files synced per hour
- Bytes transferred
- Sync failures
- Out-of-sync nodes

**Alerts:**
- Node hasn't synced in > 10 minutes
- Sync failure rate > 5%
- Checksum mismatch detected

### Check Sync Status

```bash
# On any node
curl http://localhost:8000/assets/.sync_status

# Output:
{
  "last_sync": "2025-10-06T12:05:00Z",
  "files_synced": 47,
  "bytes_synced": 3245789,
  "errors": 0,
  "sync_duration": 2.3,
  "node": "vengeance"
}
```

---

## 🎯 Best Practices

### 1. **Organize Assets by Type**
```
aurora-assets/
├── webapps/      # HTML, JS, CSS
├── images/       # Static images
├── generated/    # Dynamic content
└── archives/     # Old versions
```

### 2. **Version Your Assets**
```bash
# Include version in filename
app.v2.1.0.js
styles.20251006.css

# Or use Git commit hash
app.${GIT_COMMIT}.js
```

### 3. **Compress Before Upload**
```bash
# Gzip large files
gzip -k large-app.js
# Upload both versions
# Nginx serves .gz if client supports
```

### 4. **Set Appropriate Sync Intervals**
```bash
# Development: Sync frequently
ASSET_SYNC_INTERVAL=60  # 1 minute

# Production: Less frequent (saves bandwidth)
ASSET_SYNC_INTERVAL=300  # 5 minutes

# Critical updates: Use webhooks
```

### 5. **Use CDN for Heavy Assets** (Optional)
```
User → CDN (Cloudflare) → Aurora assets
# For videos, large downloads, etc.
# Reduces Aurora bandwidth
```

---

## 🚀 Quick Start

### 1. Upload Your Web App to Aurora

```bash
# One-time setup: Configure AWS CLI for MinIO
aws configure --profile aurora
AWS Access Key ID: aurora_admin
AWS Secret Access Key: your_secret_key
Default region name: us-east-1

# Upload your web apps
aws s3 sync ./webapps/ s3://aurora-assets/webapps/ \
  --profile aurora \
  --endpoint-url http://10.0.0.1:9000
```

### 2. Asset Sync Runs Automatically

Already configured in standard node! Just wait 5 minutes.

### 3. Access from Any Node

```bash
# Hit any node:
http://10.0.0.1/robbie-unified-interface.html  # Aurora
http://10.0.0.3/robbie-unified-interface.html  # RunPod TX
http://10.0.0.4/robbie-unified-interface.html  # Vengeance
http://10.0.0.5/robbie-unified-interface.html  # RobbieBook1

# All serve same file ✅
```

---

## ✅ Summary

**Web apps stay synced via:**

1. **Asset Sync Service** - Polls MinIO every 5 minutes
2. **Local Caching** - Each node has `/assets` directory
3. **Nginx Serving** - Serves from local assets (fast!)
4. **Event Bus** - Optional instant invalidation
5. **CI/CD** - Automated uploads to Aurora

**Result:**
- Upload once to Aurora
- All nodes get it automatically
- Users connect to any node
- Consistent experience everywhere
- < 5 minute propagation time

**This is production-grade distributed static asset delivery.** 🚀

---

*Part of the Aurora Standard Node Deployment System*
