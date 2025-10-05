# 🌐 ROBBIE SSH MESH ARCHITECTURE

**Intelligent Resource Discovery Over SSH Tunnels**

## Core Principle

**Everything communicates via SSH tunnels. No exposed ports, no VPN complexity.**

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    SSH MESH NETWORK                          │
│                                                              │
│  ┌──────────────┐      SSH       ┌──────────────┐          │
│  │   Aurora     │◄───────────────►│  Vengeance   │          │
│  │   Town       │                 │  (RTX 4090)  │          │
│  │  (Priority 1)│                 │  (Priority 2)│          │
│  └──────┬───────┘                 └──────┬───────┘          │
│         │                                │                   │
│         │           SSH                  │                   │
│         └────────────┼───────────────────┘                   │
│                      │                                       │
│              ┌───────▼────────┐                             │
│              │  RobbieBook1   │                             │
│              │  (M3 MacBook)  │                             │
│              │  (Priority 3)  │                             │
│              └────────────────┘                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔑 SSH Tunnel Strategy

### **1. Aurora Town (Hub Node)**

**Role:** Primary coordinator, always-on cloud node
**Location:** `aurora-town-u44170.vm.elestio.app`

**Outbound Tunnels:**

```bash
# To Vengeance (when available)
ssh -L 11434:localhost:11434 vengeance.local  # Ollama
ssh -L 5432:localhost:5432 vengeance.local    # PostgreSQL
ssh -L 8001:localhost:8001 vengeance.local    # GPU API

# To RunPod (when needed)
ssh -L 11435:localhost:11434 root@runpod-gpu  # RunPod Ollama
```

**Inbound Tunnels:**

```bash
# From RobbieBook1
ssh -R 8007:localhost:8007 root@aurora-town  # Expose Aurora to Mac
```

---

### **2. Vengeance (GPU Node)**

**Role:** Local GPU powerhouse, desktop always-on
**Hardware:** RTX 4090

**Outbound Tunnels:**

```bash
# To Aurora (register availability)
ssh -R 11434:localhost:11434 root@aurora-town  # Expose Ollama to Aurora
ssh -R 8001:localhost:8001 root@aurora-town    # Expose GPU API
```

**Services Exposed:**

- `localhost:11434` - Ollama with RTX 4090
- `localhost:5432` - PostgreSQL with pgvector
- `localhost:8001` - GPU compute API

---

### **3. RobbieBook1 (Mobile Node)**

**Role:** Laptop, offline-capable, initiates connections
**Hardware:** M3 MacBook Pro

**Outbound Tunnels:**

```bash
# To Aurora (when online)
ssh -L 8007:localhost:8007 root@aurora-town   # Aurora web UI
ssh -L 11434:localhost:11434 root@aurora-town # Aurora Ollama
ssh -L 5432:localhost:5432 root@aurora-town   # Aurora DB

# To Vengeance (when on local network)
ssh -L 11434:localhost:11434 vengeance.local  # Vengeance Ollama
ssh -L 5432:localhost:5432 vengeance.local    # Vengeance DB
```

**Local Fallback:**

- `localhost:11434` - Local Ollama (M3 Neural Engine)
- `~/robbie-local.db` - SQLite for offline mode

---

## 🤖 Resource Orchestrator (Per Node)

Each node runs its own orchestrator that:

1. **Discovers** available resources via SSH health checks
2. **Prioritizes** based on availability and capabilities
3. **Routes** requests to best available resource
4. **Fails over** gracefully when resources disappear

### **Discovery Protocol**

```javascript
// Each node pings others via SSH tunnels
async function discoverNode(sshConfig) {
    try {
        // SSH tunnel is already established by systemd
        const response = await fetch(`http://localhost:${sshConfig.localPort}/health`, {
            timeout: 2000
        });
        return response.ok ? 'online' : 'degraded';
    } catch {
        return 'offline';
    }
}
```

---

## 📋 Priority Routing Logic

### **When on RobbieBook1 (Laptop):**

```
1. Try Aurora (via SSH tunnel) → RunPod GPU access
2. Try Vengeance (via SSH tunnel) → Local RTX 4090
3. Fallback to local M3 + SQLite
```

### **When on Aurora Town:**

```
1. Use local resources (AMD EPYC CPU)
2. Try Vengeance (via reverse tunnel) → RTX 4090
3. Try RunPod (via SSH tunnel) → 2x RTX 4090
```

### **When on Vengeance:**

```
1. Use local RTX 4090
2. Try Aurora (via SSH tunnel) → RunPod access
3. Local-only mode
```

---

## 🔧 Implementation: SSH Tunnel Manager

### **File:** `src/ssh-tunnel-manager.js`

```javascript
class SSHTunnelManager {
    constructor() {
        this.tunnels = {
            aurora: {
                host: 'aurora-town-u44170.vm.elestio.app',
                ports: {
                    web: { local: 8007, remote: 8007 },
                    ollama: { local: 11434, remote: 11434 },
                    db: { local: 5432, remote: 5432 }
                },
                status: 'unknown'
            },
            vengeance: {
                host: 'vengeance.local',
                ports: {
                    ollama: { local: 11434, remote: 11434 },
                    gpu: { local: 8001, remote: 8001 },
                    db: { local: 5432, remote: 5432 }
                },
                status: 'unknown'
            }
        };
    }

    // Check if SSH tunnel is alive
    async checkTunnel(name) {
        const tunnel = this.tunnels[name];
        try {
            // Try to hit health endpoint through tunnel
            const response = await fetch(
                `http://localhost:${tunnel.ports.web?.local || tunnel.ports.ollama.local}/health`,
                { timeout: 2000 }
            );
            tunnel.status = response.ok ? 'online' : 'degraded';
        } catch {
            tunnel.status = 'offline';
        }
        return tunnel.status;
    }

    // Get best available resource
    async getBestResource() {
        // Check all tunnels
        await Promise.all([
            this.checkTunnel('aurora'),
            this.checkTunnel('vengeance')
        ]);

        // Priority: Aurora > Vengeance > Local
        if (this.tunnels.aurora.status === 'online') {
            return 'aurora';
        } else if (this.tunnels.vengeance.status === 'online') {
            return 'vengeance';
        } else {
            return 'local';
        }
    }
}
```

---

## 🚀 Deployment: Systemd SSH Tunnels

### **On RobbieBook1 (Mac - using launchd):**

**File:** `~/Library/LaunchAgents/com.testpilot.aurora-tunnel.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.testpilot.aurora-tunnel</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/ssh</string>
        <string>-N</string>
        <string>-L</string>
        <string>8007:localhost:8007</string>
        <string>-L</string>
        <string>11434:localhost:11434</string>
        <string>-L</string>
        <string>5432:localhost:5432</string>
        <string>-o</string>
        <string>ServerAliveInterval=60</string>
        <string>-o</string>
        <string>ExitOnForwardFailure=yes</string>
        <string>root@aurora-town-u44170.vm.elestio.app</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardErrorPath</key>
    <string>/tmp/aurora-tunnel.err</string>
    <key>StandardOutPath</key>
    <string>/tmp/aurora-tunnel.out</string>
</dict>
</plist>
```

**Activate:**

```bash
launchctl load ~/Library/LaunchAgents/com.testpilot.aurora-tunnel.plist
```

---

### **On Vengeance (Linux - systemd):**

**File:** `/etc/systemd/system/aurora-reverse-tunnel.service`

```ini
[Unit]
Description=Aurora Town Reverse SSH Tunnel
After=network.target

[Service]
Type=simple
User=allan
ExecStart=/usr/bin/ssh -N \
    -R 11434:localhost:11434 \
    -R 8001:localhost:8001 \
    -o ServerAliveInterval=60 \
    -o ExitOnForwardFailure=yes \
    root@aurora-town-u44170.vm.elestio.app
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Activate:**

```bash
systemctl enable aurora-reverse-tunnel
systemctl start aurora-reverse-tunnel
```

---

## 💾 Database Sync Strategy

### **Aurora Town (Primary)**

- PostgreSQL with pgvector
- Always-on, source of truth

### **Vengeance (Secondary)**

- PostgreSQL replica (streaming replication via SSH tunnel)
- Can operate independently if Aurora unreachable

### **RobbieBook1 (Tertiary)**

- SQLite for offline mode
- Syncs to Aurora when online via SSH tunnel

**Sync Command:**

```bash
# From RobbieBook1 to Aurora (when online)
ssh root@aurora-town "pg_dump aurora" | psql -h localhost -p 5432 robbie_local

# From Vengeance to Aurora (continuous replication)
# Handled by PostgreSQL streaming replication over SSH tunnel
```

---

## 🧪 Testing the Mesh

### **Test 1: Full Mesh (All Online)**

```bash
# From RobbieBook1
curl http://localhost:8007/health  # Should hit Aurora
curl http://localhost:11434/api/tags  # Should hit Aurora's Ollama
```

### **Test 2: Aurora Down (Vengeance Available)**

```bash
# Orchestrator should failover to Vengeance
curl http://localhost:11434/api/tags  # Should hit Vengeance RTX 4090
```

### **Test 3: Airplane Mode (Local Only)**

```bash
# Orchestrator should use local resources
curl http://localhost:11434/api/tags  # Should hit local Ollama (M3)
sqlite3 ~/robbie-local.db "SELECT * FROM conversations LIMIT 1"
```

---

## 🎯 Key Benefits

1. **No Exposed Ports** - Everything over SSH, maximum security
2. **Automatic Failover** - Orchestrator handles node failures gracefully
3. **Offline Capable** - RobbieBook1 works standalone in airplane mode
4. **Resource Aware** - Always uses best available GPU/CPU
5. **Simple Management** - systemd/launchd keeps tunnels alive

---

## 📊 Resource Priority Matrix

| Location | Priority 1 | Priority 2 | Priority 3 |
|----------|-----------|-----------|-----------|
| **RobbieBook1** | Aurora (via SSH) | Vengeance (via SSH) | Local M3 |
| **Aurora Town** | Local CPU | Vengeance (via reverse SSH) | RunPod GPU |
| **Vengeance** | Local RTX 4090 | Aurora (via SSH) | Local-only |

---

## 🚀 Next Steps

1. ✅ Create SSH tunnel systemd/launchd services
2. ✅ Deploy orchestrator to all nodes
3. ✅ Test full mesh connectivity
4. ✅ Test failover scenarios
5. ✅ Implement database sync
6. ✅ Update UI to show current resource

**The mesh is self-healing, self-discovering, and always uses the best available resources!** 🎯
