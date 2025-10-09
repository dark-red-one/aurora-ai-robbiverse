# Aurora Standard Node - Package Manifest

## 📦 Package Contents

This directory contains everything needed to deploy a standard Aurora node.

### Core Files

```
aurora-standard-node/
├── bootstrap.sh                    # Universal installer (macOS + Ubuntu)
├── aurora-cli                      # Node management CLI
├── docker-compose.yml              # Service stack definition
├── README.md                       # Full documentation
├── QUICK_REFERENCE.md              # Common commands cheat sheet
└── MANIFEST.md                     # This file

config/                             # Configuration files
├── postgresql.conf                 # PostgreSQL tuning
├── pg_hba.conf                     # PostgreSQL authentication
├── Corefile                        # CoreDNS configuration
├── prometheus.yml                  # Metrics collection
├── grafana-datasources.yml         # Grafana setup
├── grafana-dashboards.yml          # Dashboard provisioning
└── zones/
    └── aurora.local.zone           # DNS zone file

services/                           # Custom microservices
├── asset-sync/                     # Static file synchronization
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── sync.py
│   └── healthcheck.py
└── health-monitor/                 # Node health reporting
    ├── Dockerfile
    ├── requirements.txt
    └── monitor.py

scripts/                            # Initialization scripts
└── postgres-init.sh                # Database replication setup
```

### Generated Files (created by bootstrap)

```
.env                    # Node configuration (auto-generated)
.credentials            # Passwords (KEEP SECURE!)
```

### Docker Volumes (created at runtime)

```
aurora-wireguard-{node}     # VPN configuration
aurora-postgres-{node}      # Database data
aurora-redis-{node}         # Cache data
aurora-assets-{node}        # Static files cache
aurora-prometheus-{node}    # Metrics data
aurora-grafana-{node}       # Dashboard config
```

## 🚀 Quick Start

```bash
# One-command install
curl -sSL https://raw.githubusercontent.com/dark-red-one/aurora-ai-robbiverse/main/deployment/aurora-standard-node/bootstrap.sh | bash
```

## 📋 Service Stack

Every node deploys:

| Service | Container Name | Ports | Purpose |
|---------|---------------|-------|---------|
| WireGuard | aurora-wireguard | 51820/udp | VPN mesh network |
| PostgreSQL | aurora-postgres | 5432 | Database (primary/replica) |
| Redis | aurora-redis | 6379 | Distributed cache |
| Asset Sync | aurora-asset-sync | - | File synchronization |
| Prometheus | aurora-prometheus | 9090 | Metrics collection |
| Grafana | aurora-grafana | 3000 | Monitoring dashboard |
| Node Exporter | aurora-node-exporter | 9100 | System metrics |
| cAdvisor | aurora-cadvisor | 8080 | Container metrics |
| Health Monitor | aurora-health-monitor | - | Status reporting |
| CoreDNS* | aurora-coredns | 53 | DNS (lead/backup only) |
| GPU Coordinator* | aurora-gpu-coordinator | - | GPU workloads (compute only) |

\* Conditional services based on node role

## 🔧 Configuration

### Node Roles

- **lead**: Primary DNS, read-write database, asset origin
- **backup**: Secondary DNS, read-only database, asset mirror, hot standby
- **compute**: Database replica, asset cache, GPU processing

### Environment Variables

Key variables in `.env`:

```bash
NODE_NAME=vengeance           # Node identifier
NODE_ROLE=compute             # lead, backup, or compute
PLATFORM=ubuntu               # ubuntu or macos

VPN_IP=10.0.0.3               # VPN mesh address
DB_MODE=replica               # primary or replica
DB_PRIMARY_HOST=10.0.0.1      # Replication source

# Passwords (auto-generated during bootstrap)
DB_PASSWORD=<random>
REDIS_PASSWORD=<random>
GRAFANA_PASSWORD=<random>
```

## 📊 Resource Requirements

### Minimum (Compute Node)

- **CPU**: 2 cores
- **RAM**: 4GB
- **Disk**: 50GB
- **Network**: 10 Mbps

### Recommended (Lead/Backup)

- **CPU**: 4+ cores
- **RAM**: 8GB+
- **Disk**: 200GB+ (database growth)
- **Network**: 100 Mbps+

### Ports

```
Inbound:
  51820/udp  - WireGuard VPN (all nodes)
  53/tcp,udp - DNS (lead/backup only)

Outbound:
  All traffic allowed (for package downloads, etc.)

VPN Mesh (10.0.0.0/24):
  5432/tcp   - PostgreSQL
  6379/tcp   - Redis
  9090/tcp   - Prometheus
  3000/tcp   - Grafana
```

## 🛠️ Maintenance

### Updates

```bash
aurora-cli update    # Pull latest, rebuild, restart
```

### Backups

```bash
aurora-cli backup    # Full backup (DB + volumes + config)
```

### Monitoring

```bash
aurora-cli status    # Quick status
aurora-cli health    # Detailed health check
aurora-cli logs      # Service logs
```

## 📚 Documentation

- **README.md** - Complete documentation
- **QUICK_REFERENCE.md** - Common commands
- **STANDARD_NODE_DEPLOYMENT.md** - Architecture overview
- **GitHub**: https://github.com/dark-red-one/aurora-ai-robbiverse

## ✅ Verification

After deployment, confirm:

```bash
# 1. All services running
docker ps

# 2. Health check passes
aurora-cli health

# 3. Database accessible
docker exec aurora-postgres pg_isready -U robbie -d aurora

# 4. VPN connected
docker exec aurora-wireguard wg show

# 5. Monitoring accessible
curl -s http://localhost:9090/-/healthy
curl -s http://localhost:3000/api/health
```

## 🆘 Support

Issues? 
1. Check logs: `aurora-cli logs <service>`
2. Read troubleshooting: README.md
3. Open issue: https://github.com/dark-red-one/aurora-ai-robbiverse/issues

## 📝 Version

**v1.0.0** - October 2025
- Initial release
- macOS and Ubuntu support
- Full replication and monitoring
- Automatic failover

---

*Part of the Aurora AI Empire Standard Deployment System*
