# GPU Mesh Keepalive Service 🚀

Resilient GPU endpoint monitoring with automatic recovery and keepalives.

## Features

✅ **Continuous Health Monitoring** - Checks all GPU endpoints every 30 seconds
✅ **Automatic Recovery** - Restarts failed services automatically
✅ **Keepalive Connections** - Maintains persistent connections to prevent timeouts
✅ **Detailed Logging** - Full visibility into GPU mesh status
✅ **Systemd Integration** - Run as system service with auto-start

## Monitored Endpoints

1. **Local Ollama** (localhost:11434) - Primary AI engine
2. **SSH Tunnel GPU** (localhost:8080) - Remote GPU via SSH
3. **RunPod GPU** (localhost:8081) - RunPod instance

## Quick Start

### Option 1: Manual Start (Development)

```bash
# Start service
./start-gpu-mesh.sh

# Check status
./status-gpu-mesh.sh

# View logs
tail -f /tmp/gpu-mesh.log

# Stop service
./stop-gpu-mesh.sh
```

### Option 2: Systemd Service (Production)

```bash
# Install as system service
./install-systemd.sh

# Start service
sudo systemctl start gpu-keepalive

# Enable auto-start on boot
sudo systemctl enable gpu-keepalive

# Check status
sudo systemctl status gpu-keepalive

# View logs
sudo journalctl -u gpu-keepalive -f
```

## How It Works

### Health Checks
- Pings `/api/tags` endpoint every 30 seconds
- Tracks success/failure rates
- Calculates uptime percentage

### Automatic Recovery
- After 3 consecutive failures, attempts recovery:
  - **Local Ollama**: Restarts `ollama serve`
  - **SSH Tunnels**: Logs alert (manual intervention needed)
  - **RunPod**: Logs alert (check instance status)

### Keepalive Features
- Persistent HTTP connections with 60s keepalive timeout
- DNS caching (5 minutes)
- Connection pooling (max 10 connections)
- Automatic reconnection on failure

### Status Reports
- Logs detailed status every 5 minutes
- Shows: Status, Uptime %, Failure count, Last success time

## Configuration

Edit `gpu_keepalive.py` to customize:

```python
self.check_interval = 30  # Health check frequency (seconds)
self.recovery_interval = 300  # Recovery attempt frequency (seconds)
self.max_failures_before_recovery = 3  # Failures before recovery
```

## Logs

### Manual Mode
```bash
tail -f /tmp/gpu-mesh.log
```

### Systemd Mode
```bash
sudo journalctl -u gpu-keepalive -f
```

## Example Output

```
2025-10-07 18:43:25 - INFO - 🚀 GPU Keepalive Service Starting...
2025-10-07 18:43:25 - INFO - 📊 Starting health monitoring loop...
2025-10-07 18:43:25 - INFO - 🔧 Starting recovery loop...
============================================================
📊 GPU MESH STATUS REPORT
============================================================
🟢 Local Ollama         | Status: healthy    | Uptime:  98.5% | Failures:   0 | Last OK: 18:43:25
🟢 SSH Tunnel GPU       | Status: healthy    | Uptime:  95.2% | Failures:   0 | Last OK: 18:43:24
🔴 RunPod GPU           | Status: unhealthy  | Uptime:   0.0% | Failures:  12 | Last OK: Never
============================================================
```

## Troubleshooting

### Service won't start
```bash
# Check Python dependencies
python3 -c "import aiohttp; print('OK')"

# Check if port is already in use
netstat -tlnp | grep -E "11434|8080|8081"

# Check permissions
ls -la gpu_keepalive.py
```

### Endpoints always unhealthy
```bash
# Test manually
curl -s http://localhost:11434/api/tags
curl -s http://localhost:8080/api/tags
curl -s http://localhost:8081/api/tags

# Check if services are running
ps aux | grep ollama
netstat -tlnp | grep 8080
```

### Recovery not working
```bash
# Check if ollama command is in PATH
which ollama

# Test manual restart
pkill -f "ollama serve"
ollama serve &
```

## Integration

### Use in Python Code

```python
import aiohttp

async def get_best_gpu():
    """Get the best available GPU endpoint"""
    endpoints = [
        "http://localhost:11434",
        "http://localhost:8080",
        "http://localhost:8081"
    ]
    
    for url in endpoints:
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{url}/api/tags", timeout=5) as resp:
                    if resp.status == 200:
                        return url
        except:
            continue
    
    return None  # All endpoints down
```

### Use in Shell Scripts

```bash
#!/bin/bash
# Check if GPU mesh is healthy

if curl -sf http://localhost:11434/api/tags > /dev/null; then
    echo "✅ Local GPU available"
    GPU_URL="http://localhost:11434"
elif curl -sf http://localhost:8080/api/tags > /dev/null; then
    echo "✅ Tunnel GPU available"
    GPU_URL="http://localhost:8080"
else
    echo "❌ No GPUs available"
    exit 1
fi

# Use $GPU_URL for your requests
```

## Architecture

```
┌─────────────────────────────────────┐
│   GPU Keepalive Service             │
│   (Runs continuously)               │
└───────────┬─────────────────────────┘
            │
            ├──► Monitor Loop (30s)
            │    ├─► Check Local Ollama
            │    ├─► Check SSH Tunnel
            │    └─► Check RunPod
            │
            ├──► Recovery Loop (5min)
            │    └─► Restart failed services
            │
            └──► Stats Loop (5min)
                 └─► Log status report
```

## Files

- `gpu_keepalive.py` - Main service (full-featured)
- `gpu_mesh_service.py` - Lightweight version
- `gpu-keepalive.service` - Systemd unit file
- `start-gpu-mesh.sh` - Start script
- `stop-gpu-mesh.sh` - Stop script
- `status-gpu-mesh.sh` - Status check
- `install-systemd.sh` - Install as system service

## Next Steps

1. **Start the service**: `./start-gpu-mesh.sh`
2. **Monitor logs**: `tail -f /tmp/gpu-mesh.log`
3. **Check status**: `./status-gpu-mesh.sh`
4. **Install permanently**: `./install-systemd.sh`

---

**Built for Allan's Aurora AI Empire** 🤖✨
*Keeping the GPU mesh alive and kicking!*
