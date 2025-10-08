# Aurora GPU Mesh - Unified Monitoring System

**Production-ready GPU mesh with health monitoring, keepalive, auto-recovery, and alerts**

## 🚀 Features

- ✅ **Continuous Health Monitoring** - Checks all GPU nodes every 30s
- ✅ **Automatic Keepalive** - Maintains connections and attempts recovery
- ✅ **Auto-Recovery** - Automatically restarts failed Ollama instances
- ✅ **Real-time Alerts** - Warning/Error/Critical alerts with graduated severity
- ✅ **Centralized Logging** - All activity logged to `/tmp/aurora-gpu-mesh/gpu-mesh.log`
- ✅ **Performance Tracking** - Success rates, response times, uptime scores
- ✅ **Live Dashboard** - Console dashboard updates every minute
- ✅ **Systemd Service** - Runs as user service with auto-restart on failure
- ✅ **Statistics Reports** - Detailed stats every 5 minutes

## 📊 Monitored GPU Nodes

1. **Local Ollama** (`localhost:11434`) - Primary local GPU
2. **Iceland/RunPod Tunnel** (`localhost:8080`) - SSH tunnel to remote GPU
3. _(Expandable to more nodes)_

## 🔧 Installation

### Quick Start

```bash
cd /home/allan/aurora-ai-robbiverse/services/gpu-mesh

# Install as systemd service
bash install-mesh-service.sh
```

### Manual Installation

```bash
# 1. Install service file
mkdir -p ~/.config/systemd/user/
cp aurora-gpu-mesh.service ~/.config/systemd/user/
systemctl --user daemon-reload

# 2. Enable and start
systemctl --user enable aurora-gpu-mesh
systemctl --user start aurora-gpu-mesh

# 3. Set up log rotation (optional)
bash setup-log-rotation.sh
```

## 📈 Monitoring & Status

### Quick Status Check

```bash
bash check-mesh-status.sh
```

Output:
```
🎯 AURORA GPU MESH - QUICK STATUS CHECK
========================================

✅ GPU Mesh Service: RUNNING

📊 GPU Node Status:

🟢 Local Ollama (11434): HEALTHY - 8 models
🟢 Iceland/RunPod (8080): HEALTHY - 12 models

📝 Recent Log Activity:
[Recent health checks and alerts]
```

### Service Status

```bash
# Check service
systemctl --user status aurora-gpu-mesh

# View live logs
journalctl --user -u aurora-gpu-mesh -f

# View mesh logs
tail -f /tmp/aurora-gpu-mesh/gpu-mesh.log
```

### Service Control

```bash
# Start
systemctl --user start aurora-gpu-mesh

# Stop
systemctl --user stop aurora-gpu-mesh

# Restart
systemctl --user restart aurora-gpu-mesh

# Disable auto-start
systemctl --user disable aurora-gpu-mesh
```

## 🎯 How It Works

### Health Monitoring Loop (every 30s)

1. Checks all GPU nodes in parallel
2. Measures response time
3. Fetches model list
4. Updates node status (Healthy/Degraded/Unhealthy/Offline)
5. Logs results

### Keepalive Loop (every 60s)

1. Identifies unhealthy/offline nodes
2. Attempts automatic recovery:
   - **Local Ollama**: Checks process, restarts if needed
   - **Tunnels**: Logs for manual intervention
3. Sends recovery alerts

### Alert System

**Alert Levels:**
- 🟢 **INFO**: Node recovered, routine events
- 🟡 **WARNING**: Node degraded (1-2 failures)
- 🔴 **ERROR**: Node unhealthy (3+ failures)
- 🚨 **CRITICAL**: Node offline (5+ failures)

### Statistics Reporter (every 5 minutes)

Logs comprehensive stats:
- Node status and health scores
- Success rates
- Response times
- Model counts
- Overall mesh health percentage

### Live Dashboard (every 60s)

Console display showing:
- Real-time node status
- Response times and success rates
- Uptime scores
- Recent alerts (last 5 min)

## 📊 Node Status States

| State | Icon | Description | Action |
|-------|------|-------------|--------|
| **Healthy** | 🟢 | 0 failures, responding | Normal operation |
| **Degraded** | 🟡 | 1-2 failures | Warning logged |
| **Unhealthy** | 🔴 | 3-4 failures | Error logged, recovery attempt |
| **Offline** | ⚫ | 5+ failures | Critical alert, recovery attempt |
| **Unknown** | ⚪ | Not checked yet | Initial state |

## 🔍 Monitoring Metrics

For each node:
- **Status**: Current health state
- **Response Time**: API response latency (ms)
- **Success Rate**: % of successful requests
- **Uptime Score**: Overall health score (0-100)
- **Models**: Number of loaded models
- **Consecutive Failures**: Failure counter
- **Last Check**: Timestamp of last health check

## 🚨 Alert Examples

```
ℹ️ [INFO] Local Ollama: Node recovered! Response time: 45ms, Models: 8

⚠️ [WARNING] Iceland/RunPod (Tunnel): Node degraded: Timeout (10s)

❌ [ERROR] Local Ollama: Node UNHEALTHY: Connection error: ClientError

🚨 [CRITICAL] Iceland/RunPod (Tunnel): Node OFFLINE after 5 failures: Timeout (10s)
```

## 📝 Log Files

### Main Log
`/tmp/aurora-gpu-mesh/gpu-mesh.log`
- All health checks
- Status changes
- Alerts
- Recovery attempts
- Statistics reports

### Systemd Journal
```bash
journalctl --user -u aurora-gpu-mesh -f
```
- Service start/stop
- System-level events
- Crash reports

### Log Rotation
After running `setup-log-rotation.sh`:
- Rotates daily
- Keeps 7 days of logs
- Compresses old logs
- Max 100MB per log file

## 🔧 Configuration

Edit `unified_gpu_mesh.py` to customize:

```python
# Check intervals
self.check_interval = 30  # Health check frequency (seconds)
self.keepalive_interval = 60  # Keepalive frequency (seconds)
self.stats_interval = 300  # Stats report frequency (seconds)

# Alert thresholds
self.max_consecutive_failures = 3  # Unhealthy threshold
self.critical_failure_threshold = 5  # Offline threshold

# Add more GPU nodes
self.nodes['vengeance'] = GPUNode(
    name='Vengeance GPU',
    url='http://vengeance.local:11434',
    port=11434
)
```

## 🧪 Testing

### Test Node Failure

```bash
# Stop Ollama to trigger alerts
pkill -f "ollama serve"

# Watch mesh detect failure and attempt recovery
tail -f /tmp/aurora-gpu-mesh/gpu-mesh.log
```

Expected behavior:
1. After 1-2 checks: **WARNING** - Node degraded
2. After 3 checks: **ERROR** - Node unhealthy
3. Keepalive loop attempts restart
4. If successful: **INFO** - Node recovered

### Test Full Mesh

```bash
# Check all nodes are healthy
bash check-mesh-status.sh

# View live dashboard
journalctl --user -u aurora-gpu-mesh -f | grep "DASHBOARD"
```

## 🎯 Architecture

```
┌─────────────────────────────────────────┐
│     Unified GPU Mesh Coordinator        │
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────────────────────────────┐ │
│  │   Health Monitor Loop (30s)       │ │
│  │   - Check all nodes in parallel   │ │
│  │   - Update status & metrics       │ │
│  │   - Send alerts on changes        │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │   Keepalive Loop (60s)            │ │
│  │   - Identify failed nodes         │ │
│  │   - Attempt auto-recovery         │ │
│  │   - Restart Ollama if needed      │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │   Stats Reporter (5min)           │ │
│  │   - Generate statistics           │ │
│  │   - Log comprehensive report      │ │
│  │   - Calculate mesh health         │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │   Dashboard (60s)                 │ │
│  │   - Display live status           │ │
│  │   - Show recent alerts            │ │
│  │   - Update metrics                │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │   Alert Processor                 │ │
│  │   - Manage alert queue            │ │
│  │   - Log with severity levels      │ │
│  │   - Track alert history           │ │
│  └───────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
              │
              ├─────────┬─────────┬────────
              │         │         │
              ▼         ▼         ▼
         ┌────────┐ ┌────────┐ ┌────────┐
         │ Local  │ │Tunnel  │ │Venge-  │
         │ Ollama │ │:8080   │ │ance    │
         └────────┘ └────────┘ └────────┘
```

## 🚀 Next Steps

### Expand the Mesh

Add Vengeance GPU:
```python
# In unified_gpu_mesh.py
self.nodes['vengeance'] = GPUNode(
    name='Vengeance GPU',
    url='http://10.59.98.X:11434',  # Your Vengeance Nebula IP
    port=11434
)
```

### Email Alerts (Optional)

Add SMTP configuration for critical alerts:
```python
# In send_alert() method
if level == AlertLevel.CRITICAL:
    await self.send_email_alert(alert)
```

### Workload Distribution

Integrate with your AI services to route requests to healthy nodes:
```python
# Get best available node
healthy_nodes = [n for n in mesh.nodes.values() if n.status == NodeStatus.HEALTHY]
best_node = max(healthy_nodes, key=lambda n: n.uptime_score)
```

## 📞 Troubleshooting

### Service won't start

```bash
# Check logs
journalctl --user -u aurora-gpu-mesh -n 50

# Test script directly
python3 unified_gpu_mesh.py
```

### Nodes always showing offline

```bash
# Test node connectivity
curl http://localhost:11434/api/tags
curl http://localhost:8080/api/tags

# Check if Ollama is running
ps aux | grep ollama

# Check SSH tunnel
ps aux | grep "ssh.*8080"
```

### Logs not rotating

```bash
# Test logrotate
sudo logrotate -f /etc/logrotate.d/aurora-gpu-mesh

# Check logrotate config
cat /etc/logrotate.d/aurora-gpu-mesh
```

## 📚 Files

- `unified_gpu_mesh.py` - Main mesh coordinator
- `aurora-gpu-mesh.service` - Systemd service file
- `install-mesh-service.sh` - Installation script
- `check-mesh-status.sh` - Quick status checker
- `setup-log-rotation.sh` - Log rotation setup
- `README.md` - This file

## 🎉 Success Criteria

✅ Service runs continuously without crashes
✅ All healthy nodes show 🟢 status
✅ Failed nodes trigger alerts within 2 minutes
✅ Auto-recovery restarts failed Ollama instances
✅ Logs track all activity
✅ Dashboard updates every minute
✅ Statistics reports every 5 minutes

---

**Built for Allan's GPU mesh - Production ready! 🚀**
