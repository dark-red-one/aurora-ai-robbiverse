# 🌐 Aurora AI Empire - Actual Infrastructure

**Last Updated:** October 6, 2025

This is the REAL infrastructure map. No placeholders, no dreams - this is what exists NOW.

---

## 🖥️ Active Nodes (4 Total)

### 1. AURORA (Lead Node - Elestio EPYX)

```yaml
Name: aurora
Location: Elestio managed hosting
Role: lead
Purpose: Primary infrastructure, DNS, database master, coordinator

Hostnames:
  - Main: aurora-town-u44170.vm.elestio.app
  - Database: aurora-postgres-u44170.vm.elestio.app:25432
  
IPs:
  - Public: 45.32.194.172 (WireGuard endpoint)
  - VPN: 10.0.0.1
  
Services:
  - PostgreSQL Primary (read-write)
  - CoreDNS (primary DNS)
  - GPU Mesh Coordinator (port 8001)
  - Event Bus
  - Chat Backend
  - Asset Origin (MinIO)
  - Monitoring (Prometheus/Grafana)
  
Hardware:
  - CPU: Unknown (managed)
  - RAM: Unknown (managed)
  - GPU: None
  
Access:
  - SSH: root@aurora-town-u44170.vm.elestio.app
  - Web Console: https://dash.elestio.com
```

### 2. RUNPOD-TX (GPU Compute - Texas)

```yaml
Name: runpod-tx
Location: RunPod Texas datacenter
Role: compute
Purpose: Primary GPU processing

IPs:
  - Public: 82.221.170.242 (SSH port 24505)
  - VPN: 10.0.0.3
  
Services:
  - PostgreSQL Replica (read-only)
  - GPU Client (connects to coordinator)
  - Chat Backend
  - Ollama (LLM gateway)
  
Hardware:
  - GPU: 2x NVIDIA RTX 4090
  - VRAM: 48GB total (24GB each)
  - CPU: Unknown
  - RAM: Unknown
  
Access:
  - SSH: root@82.221.170.242 -p 24505
  - Pod ID: 2tbwzatlrjdy7i
```

### 3. VENGEANCE (Development/Gaming Machine)

```yaml
Name: vengeance
Location: Allan's office/home
Role: compute
Purpose: Local development, GPU processing, testing

IPs:
  - Local: vengeance (hostname)
  - VPN: 10.0.0.4
  
Services:
  - PostgreSQL Replica (read-only)
  - GPU Client (connects to coordinator)
  - Chat Backend
  - Development environment
  
Hardware:
  - GPU: 1x NVIDIA RTX 4090
  - VRAM: 24GB
  - CPU: Unknown (likely high-end Intel/AMD)
  - RAM: Unknown (likely 32GB+)
  - OS: Windows or Ubuntu
  
Access:
  - Local network only
  - VPN via WireGuard
```

### 4. ROBBIEBOOK1 (MacBook M3 Max)

```yaml
Name: robbiebook1
Location: Mobile (travels with Allan)
Role: compute
Purpose: Mobile development, testing, CPU workloads

IPs:
  - Public: 192.199.240.226 (dynamic, behind NAT)
  - VPN: 10.0.0.5
  
Services:
  - PostgreSQL Replica (read-only)
  - Chat Backend
  - Development environment
  
Hardware:
  - CPU: Apple M3 Max
  - RAM: 36GB+ (unified memory)
  - GPU: None (integrated M3 GPU not used for CUDA)
  - OS: macOS
  
Access:
  - VPN via WireGuard
  - Dynamic IP (changes with location)
```

---

## ❌ Nodes That DON'T Exist

Remove these from configs/docs:

- **Star** - No backup node deployed yet
- **Iceland** - Was a placeholder name
- **RunPod Collaboration** (213.181.111.2:43540) - Inactive/decommissioned
- **RunPod Fluenti** (103.196.86.56:19777) - Inactive/decommissioned

---

## 🌐 Network Map

```
Internet
    │
    ├─── Aurora (Elestio) ────────────┐
    │    45.32.194.172:51820          │ WireGuard VPN
    │    (WireGuard server)            │ 10.0.0.0/24
    │                                  │
    ├─── RunPod TX ───────────────────┤
    │    82.221.170.242:24505         │
    │    (connects to VPN)             │
    │                                  │
    └─── NAT ─────────────────────────┤
         │                             │
         ├─ Vengeance ─────────────────┤
         │  (local network)            │
         │                             │
         └─ RobbieBook1 ───────────────┘
            (mobile, dynamic IP)
```

### VPN Mesh (10.0.0.0/24)

```
10.0.0.1  - Aurora (lead, VPN server)
10.0.0.3  - RunPod TX
10.0.0.4  - Vengeance
10.0.0.5  - RobbieBook1

Reserved for future:
10.0.0.2  - Star (backup node, when deployed)
10.0.0.6+ - Additional nodes
```

---

## 📊 GPU Resources

### Total Available

- **3 GPUs** across 2 nodes
- **72GB VRAM** total
  - RunPod TX: 48GB (2x RTX 4090)
  - Vengeance: 24GB (1x RTX 4090)

### GPU Mesh Coordinator

- **Location:** Aurora (10.0.0.1:8001)
- **Workers:**
  - runpod-tx (2x RTX 4090)
  - vengeance (1x RTX 4090)

---

## 🗄️ Database Architecture

```
Aurora PostgreSQL (Primary)
├─ Host: aurora-postgres-u44170.vm.elestio.app:25432
├─ Mode: Read-write
├─ Replication slots:
│  ├─ replica_runpod_tx
│  ├─ replica_vengeance
│  └─ replica_robbiebook1
│
└─> Streaming Replication
    ├─> RunPod TX (read-only)
    ├─> Vengeance (read-only)
    └─> RobbieBook1 (read-only)
```

---

## 🌍 DNS (aurora.local)

Served by CoreDNS on Aurora:

```
aurora.local         → 10.0.0.1
runpod-tx.aurora.local → 10.0.0.3
vengeance.aurora.local → 10.0.0.4
robbiebook1.aurora.local → 10.0.0.5

db.aurora.local      → 10.0.0.1 (primary)
```

---

## 🔐 Access Credentials

**PostgreSQL (Aurora):**
- Host: `aurora-postgres-u44170.vm.elestio.app:25432`
- User: `aurora_app`
- Database: `aurora_unified`
- Password: `TestPilot2025_Aurora!`

**SSH Keys:**
- Location: `~/.ssh/id_ed25519`
- Public Key: `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIIKtYaAt1pjSiHpFJbktjN8JfzJ8SLhiMnpf1QsZnJIQ robbiebook@aurora-empire`

---

## 🚀 Deployment Status

| Node | Bootstrap | VPN | DB | Chat | GPU | Status |
|------|-----------|-----|----|----|-----|--------|
| **Aurora** | ⏳ | ⏳ | ✅ | ⏳ | N/A | **Deploy First** |
| **RunPod TX** | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | Pending Aurora |
| **Vengeance** | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | Pending Aurora |
| **RobbieBook1** | ⏳ | ⏳ | ⏳ | ⏳ | N/A | Pending Aurora |

---

## 📝 Next Steps

1. **Deploy Aurora** (lead node)
   ```bash
   ssh root@aurora-town-u44170.vm.elestio.app
   curl -sSL https://raw.githubusercontent.com/dark-red-one/aurora-ai-robbiverse/main/deployment/aurora-standard-node/bootstrap.sh | bash
   # Select: Role = lead
   ```

2. **Deploy RunPod TX**
   ```bash
   ssh root@82.221.170.242 -p 24505
   curl -sSL [...]/bootstrap.sh | bash
   # Select: Role = compute, GPU = yes
   ```

3. **Deploy Vengeance**
   ```bash
   # On Vengeance machine
   curl -sSL [...]/bootstrap.sh | bash
   # Select: Role = compute, GPU = yes
   ```

4. **Deploy RobbieBook1**
   ```bash
   # On MacBook
   curl -sSL [...]/bootstrap.sh | bash
   # Select: Role = compute, GPU = no
   ```

---

**This is the real infrastructure. Let's deploy it.** 🚀
