# 📍 Aurora Node Registry - Dynamic Node Discovery

## ✅ YES - Maintaining Dynamic Node Map

The **Node Registry** service maintains a real-time map of all nodes in the Aurora mesh.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ AURORA (Lead Node)                                           │
│                                                               │
│  Node Registry Service (Port 9999)                           │
│  ├─ Listens to heartbeats (event bus)                        │
│  ├─ Stores node info (Redis)                                 │
│  ├─ Tracks status (active/warning/offline)                   │
│  └─ Provides REST API (node discovery)                       │
└─────────────────┬───────────────────────────────────────────┘
                  │
     Event Bus (Redis Pub/Sub)
                  │
    ┌─────────────┼─────────────┬─────────────┐
    ↓             ↓             ↓             ↓
┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
│RUNPOD TX│  │VENGEANCE│  │ROBBIE   │  │  (New)  │
│         │  │         │  │ BOOK1   │  │  Node   │
│Sends    │  │Sends    │  │Sends    │  │Sends    │
│heartbeat│  │heartbeat│  │heartbeat│  │heartbeat│
│every 1m │  │every 1m │  │every 1m │  │every 1m │
└─────────┘  └─────────┘  └─────────┘  └─────────┘
```

---

## 🔥 How It Works

### 1. Node Bootstrap (Auto-Registration)

When a node boots:

```python
# In bootstrap.sh or startup script
import requests

# Register with node registry
requests.post('http://10.0.0.1:9999/nodes/register', json={
    "name": "vengeance",
    "role": "compute",
    "vpn_ip": "10.0.0.4",
    "public_ip": "dynamic",
    "capabilities": {
        "gpu": True,
        "gpu_count": 1,
        "gpu_type": "RTX 4090",
        "gpu_memory": 24
    },
    "metadata": {
        "os": "ubuntu",
        "docker_version": "24.0.7"
    }
})
```

### 2. Heartbeat (Event Bus Integration)

```python
# Event bus already sends heartbeats
# Node registry listens and updates "last seen"

# Every 60 seconds from event-bus service:
await redis.publish('aurora:events:global', {
    "type": "node_heartbeat",
    "source_node": "vengeance",
    "data": {
        "node": "vengeance",
        "role": "compute",
        "status": "active"
    }
})

# Registry receives → Updates last_seen timestamp
```

### 3. Status Tracking

```
Node Status Logic:
├─ last_seen < 2 min ago → "active" ✅
├─ last_seen 2-5 min ago → "warning" ⚠️
└─ last_seen > 5 min ago → "offline" ❌
```

---

## 📊 REST API

### List All Nodes

```bash
curl http://10.0.0.1:9999/nodes
```

Response:
```json
{
  "nodes": {
    "aurora": {
      "name": "aurora",
      "role": "lead",
      "vpn_ip": "10.0.0.1",
      "public_ip": "45.32.194.172",
      "status": "active",
      "last_seen": "2025-10-06T12:00:05Z",
      "capabilities": {},
      "registered_at": "2025-10-06T10:00:00Z"
    },
    "runpod-tx": {
      "name": "runpod-tx",
      "role": "compute",
      "vpn_ip": "10.0.0.3",
      "public_ip": "82.221.170.242",
      "status": "active",
      "last_seen": "2025-10-06T12:00:03Z",
      "capabilities": {
        "gpu": true,
        "gpu_count": 2,
        "gpu_type": "RTX 4090",
        "gpu_memory": 48
      },
      "registered_at": "2025-10-06T10:05:00Z"
    },
    "vengeance": {
      "name": "vengeance",
      "role": "compute",
      "vpn_ip": "10.0.0.4",
      "status": "active",
      "last_seen": "2025-10-06T12:00:01Z",
      "capabilities": {
        "gpu": true,
        "gpu_count": 1,
        "gpu_type": "RTX 4090",
        "gpu_memory": 24
      },
      "registered_at": "2025-10-06T10:10:00Z"
    },
    "robbiebook1": {
      "name": "robbiebook1",
      "role": "compute",
      "vpn_ip": "10.0.0.5",
      "status": "warning",
      "last_seen": "2025-10-06T11:56:00Z",
      "capabilities": {
        "gpu": false
      },
      "registered_at": "2025-10-06T10:15:00Z"
    }
  },
  "total": 4,
  "active": 3,
  "timestamp": "2025-10-06T12:00:05Z"
}
```

### Get Specific Node

```bash
curl http://10.0.0.1:9999/nodes/vengeance
```

### Network Topology

```bash
curl http://10.0.0.1:9999/topology
```

Response:
```json
{
  "nodes": [
    {
      "id": "aurora",
      "label": "aurora",
      "role": "lead",
      "status": "active",
      "vpn_ip": "10.0.0.1",
      "capabilities": {}
    },
    {
      "id": "runpod-tx",
      "label": "runpod-tx",
      "role": "compute",
      "status": "active",
      "vpn_ip": "10.0.0.3",
      "capabilities": {"gpu": true, "gpu_count": 2}
    }
  ],
  "connections": [
    {
      "source": "aurora",
      "target": "runpod-tx",
      "type": "vpn_mesh"
    },
    {
      "source": "aurora",
      "target": "runpod-tx",
      "type": "db_replication"
    },
    {
      "source": "runpod-tx",
      "target": "aurora",
      "type": "gpu_mesh"
    }
  ],
  "timestamp": "2025-10-06T12:00:05Z"
}
```

### Registry Stats

```bash
curl http://10.0.0.1:9999/stats
```

Response:
```json
{
  "total_nodes": 4,
  "active_nodes": 3,
  "offline_nodes": 1,
  "nodes_by_role": {
    "lead": 1,
    "compute": 3
  },
  "total_gpus": 3,
  "total_vram_gb": 72,
  "timestamp": "2025-10-06T12:00:05Z"
}
```

---

## 🎯 Use Cases

### 1. Auto-Discovery

```python
# Service needs to find all GPU nodes
import requests

response = requests.get('http://10.0.0.1:9999/nodes')
nodes = response.json()['nodes']

gpu_nodes = [
    node for node in nodes.values()
    if node.get('capabilities', {}).get('gpu') and node['status'] == 'active'
]

print(f"Found {len(gpu_nodes)} GPU nodes")
# Output: Found 2 GPU nodes (runpod-tx, vengeance)
```

### 2. Health Monitoring

```python
# Check if all nodes are healthy
response = requests.get('http://10.0.0.1:9999/nodes')
nodes = response.json()['nodes']

for name, info in nodes.items():
    if info['status'] != 'active':
        print(f"⚠️ {name} is {info['status']}")
        # Send alert, trigger failover, etc.
```

### 3. Topology Visualization

```javascript
// React component for network map
fetch('http://10.0.0.1:9999/topology')
  .then(r => r.json())
  .then(data => {
    // Render D3.js graph
    renderNetworkGraph(data.nodes, data.connections);
  });
```

### 4. Capacity Planning

```python
# Check if we have capacity for new workload
response = requests.get('http://10.0.0.1:9999/stats')
stats = response.json()

if stats['total_vram_gb'] < 64:
    print("⚠️ Low GPU capacity - consider adding nodes")
```

---

## 🔄 Integration with Other Services

### GPU Mesh Coordinator

```python
# GPU mesh uses registry to discover nodes
async def discover_gpu_nodes():
    response = await aiohttp.get('http://node-registry:9999/nodes')
    nodes = await response.json()
    
    for name, info in nodes['nodes'].items():
        if info.get('capabilities', {}).get('gpu'):
            # Register with GPU mesh
            await register_gpu_node(name, info)
```

### Load Balancer

```python
# Route traffic to active nodes only
async def get_active_backends():
    response = await aiohttp.get('http://node-registry:9999/nodes')
    nodes = await response.json()
    
    return [
        f"http://{node['vpn_ip']}:8000"
        for node in nodes['nodes'].values()
        if node['status'] == 'active'
    ]
```

### Monitoring/Grafana

```prometheus
# Scrape registry metrics
- job_name: 'node-registry'
  static_configs:
    - targets: ['10.0.0.1:9999']
  metrics_path: '/metrics'
```

---

## 📊 Visualization Options

### Option 1: Grafana Dashboard

Create dashboard showing:
- Node count gauge
- Active vs offline nodes
- GPU utilization heatmap
- Network topology graph
- Node status timeline

### Option 2: Web UI

```html
<!-- Simple status page -->
<script>
fetch('http://10.0.0.1:9999/nodes')
  .then(r => r.json())
  .then(data => {
    const html = Object.values(data.nodes).map(node => `
      <div class="node ${node.status}">
        <h3>${node.name}</h3>
        <p>Role: ${node.role}</p>
        <p>Status: ${node.status}</p>
        <p>IP: ${node.vpn_ip}</p>
        ${node.capabilities.gpu ? `<p>GPU: ${node.capabilities.gpu_type}</p>` : ''}
      </div>
    `).join('');
    
    document.getElementById('nodes').innerHTML = html;
  });
</script>
```

### Option 3: CLI Tool

```bash
# aurora-cli nodes
aurora-cli nodes

# Output:
# NAME          ROLE     STATUS   IP          GPU
# aurora        lead     active   10.0.0.1    -
# runpod-tx     compute  active   10.0.0.3    2x RTX 4090
# vengeance     compute  active   10.0.0.4    1x RTX 4090
# robbiebook1   compute  warning  10.0.0.5    -
```

---

## 💰 Benefits

### Operational
✅ **Real-time visibility** - Know what's running at all times
✅ **Auto-discovery** - New nodes automatically appear
✅ **Health tracking** - Instant alerts on node failures
✅ **Capacity planning** - See total resources across mesh

### Development
✅ **Service discovery** - Services find each other dynamically
✅ **Testing** - Easy to see test vs production nodes
✅ **Debugging** - Trace requests across nodes

### Business
✅ **Resource optimization** - Deploy workloads to available nodes
✅ **Cost tracking** - Know what infrastructure is running
✅ **Scalability** - Add nodes without manual configuration

---

## 🚀 Deployment

Already included in standard node! Just needs coordinator profile:

```bash
# On Aurora (lead node)
export COMPOSE_PROFILES=coordinator
docker-compose up -d node-registry

# Verify it's running
curl http://10.0.0.1:9999/health

# Check nodes (will be empty until nodes register)
curl http://10.0.0.1:9999/nodes
```

---

## ✅ Summary

**YES - Dynamic node map maintained in Node Registry:**

- **Location:** Aurora lead node (port 9999)
- **Storage:** Redis (shared state)
- **Updates:** Real-time via event bus heartbeats
- **API:** REST endpoints for discovery
- **Integration:** GPU mesh, load balancer, monitoring
- **Status tracking:** active/warning/offline
- **Auto-discovery:** Nodes register on bootstrap

**Every node is visible. Every capability is tracked. Network topology is always current.** 🎯

---

*Part of the Aurora Standard Node Deployment System*
