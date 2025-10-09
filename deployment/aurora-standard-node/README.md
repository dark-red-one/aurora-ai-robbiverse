# 🚀 Aurora Standard Node Deployment

**The universal, batteries-included deployment system for Aurora AI Empire nodes.**

Deploy a fully-configured Aurora node in **under 5 minutes** with VPN mesh, database replication, monitoring, asset sync, and automatic failover.

## 📦 What You Get

Every Aurora node gets:

- ✅ **WireGuard VPN** - Auto-connects to mesh network
- ✅ **PostgreSQL** - Streaming replication (primary or replica)
- ✅ **Redis** - Distributed caching
- ✅ **Asset Sync** - Local cache of images/static files
- ✅ **Monitoring** - Prometheus + Grafana + Node Exporter
- ✅ **DNS** - CoreDNS (lead/backup nodes only)
- ✅ **Health Monitoring** - Auto-reports to lead node
- ✅ **GPU Support** - Optional GPU mesh coordination

## 🏗️ Architecture

```
Aurora (Lead - Elestio)
├── Primary PostgreSQL (read-write)
├── DNS Server (CoreDNS)
├── Asset Origin (MinIO)
└── Central Monitoring

Star (Backup)
├── PostgreSQL Replica (read-only)
├── DNS Server (hot standby)
└── Asset Mirror

Compute Nodes (Vengeance, Iceland, RobbieBook1)
├── PostgreSQL Replica (read-only)
├── Asset Cache
└── GPU Processing
```

## 🚀 Quick Start

### One-Line Install

```bash
curl -sSL https://raw.githubusercontent.com/dark-red-one/aurora-ai-robbiverse/main/deployment/aurora-standard-node/bootstrap.sh | bash
```

The bootstrap script will:
1. Detect your platform (macOS/Ubuntu)
2. Install prerequisites (Docker, Docker Compose)
3. Ask for node configuration (name, role, VPN IP)
4. Generate secure passwords
5. Deploy all services
6. Configure replication
7. Install management CLI

### Manual Install

```bash
# Clone repository
git clone https://github.com/dark-red-one/aurora-ai-robbiverse.git
cd aurora-ai-robbiverse/deployment/aurora-standard-node

# Run bootstrap
chmod +x bootstrap.sh
./bootstrap.sh
```

## 🎯 Node Roles

### Lead Node (Primary)
- **DNS**: Serves aurora.local domain
- **Database**: PostgreSQL primary (read-write)
- **Assets**: Origin server for static files
- **Monitoring**: Central Grafana dashboard
- **Typical deployment**: Elestio managed server (Aurora)

### Backup Node
- **DNS**: Hot standby, zone transfer from lead
- **Database**: PostgreSQL replica (read-only)
- **Assets**: Mirror of origin
- **Monitoring**: Federated to lead
- **Failover**: Auto-promotes to lead if lead fails
- **Typical deployment**: Dedicated backup server (Star)

### Compute Node
- **Database**: PostgreSQL replica (read-only)
- **Assets**: Local cache
- **GPU**: Processes AI workloads
- **Monitoring**: Reports to lead
- **Typical deployment**: Workstations (Vengeance, Iceland, RobbieBook1)

## 🛠️ Management CLI

Once deployed, use `aurora-cli` to manage your node:

```bash
# Check node status
aurora-cli status

# View service logs
aurora-cli logs postgres
aurora-cli logs asset-sync

# Restart services
aurora-cli restart            # All services
aurora-cli restart postgres   # Single service

# Health check
aurora-cli health

# Database operations
aurora-cli sync-db           # Check replication status
aurora-cli sync-assets       # Force asset sync

# Backup
aurora-cli backup

# Failover operations
aurora-cli promote           # Promote backup to lead
aurora-cli demote            # Demote lead to backup

# Updates
aurora-cli update            # Pull latest version
```

## 🔧 Configuration

### Environment Variables

The `.env` file is auto-generated during bootstrap:

```bash
NODE_NAME=vengeance
NODE_ROLE=compute
PLATFORM=ubuntu

VPN_IP=10.0.0.3
DB_MODE=replica
DB_PRIMARY_HOST=10.0.0.1

# Passwords auto-generated during bootstrap
DB_PASSWORD=<secure-random>
REDIS_PASSWORD=<secure-random>
GRAFANA_PASSWORD=<secure-random>
```

### Customization

Edit `docker-compose.yml` to customize:
- Resource limits (memory, CPU)
- Port mappings
- Volume mounts
- Service profiles (DNS, GPU)

## 🗄️ Database Replication

### How It Works

Aurora uses **PostgreSQL streaming replication**:

1. **Primary** (Aurora lead): Accepts writes
2. **Replicas** (all other nodes): Read-only, sync from primary
3. **Replication lag**: Typically < 1 second
4. **Failover**: Star can promote to primary if Aurora fails

### Check Replication Status

```bash
aurora-cli sync-db
```

Output:
```
Replication lag: 0.234s
```

### Manual Failover

If Aurora fails:

```bash
# On Star (backup node)
aurora-cli promote

# Update DNS to point to Star
# Update app configs to use Star as primary
```

## 🖼️ Asset Sync

The asset sync service keeps local copies of static files (images, PNGs, etc.) from the origin server.

### How It Works

1. Origin server (Aurora) hosts files in MinIO (S3-compatible)
2. Each node runs `asset-sync` service
3. Service polls origin every 5 minutes (configurable)
4. Downloads new/changed files based on checksums
5. Local applications use `/assets` volume

### Force Sync

```bash
aurora-cli sync-assets
```

### Check Sync Status

```bash
cat /opt/aurora-node/assets/.sync_status
```

## 🌐 DNS Configuration

Lead and backup nodes run **CoreDNS** to serve the `aurora.local` domain.

### DNS Records

Automatically configured:
- `aurora.local` → 10.0.0.1
- `star.local` → 10.0.0.2
- `db.aurora.local` → 10.0.0.1
- `grafana.aurora.local` → 10.0.0.1

### Client Configuration

On nodes:
```bash
# Add to /etc/resolv.conf or DNS settings
nameserver 10.0.0.1
nameserver 10.0.0.2  # Fallback
```

### Zone File

Edit `config/zones/aurora.local.zone` to add records:

```zone
myservice  IN  A   10.0.0.10
```

## 📊 Monitoring

Access Grafana dashboard:
```
http://localhost:3000
Username: admin
Password: <see .credentials file>
```

### Metrics Collected

- **System**: CPU, memory, disk, network
- **Containers**: Per-container resource usage
- **PostgreSQL**: Queries, connections, replication lag
- **Redis**: Commands, memory, keys
- **Network**: VPN status, bandwidth

### Prometheus

Direct access:
```
http://localhost:9090
```

## 🔒 Security

### Passwords

All passwords are auto-generated during bootstrap using cryptographically secure random values.

View credentials:
```bash
cat /opt/aurora-node/.credentials
```

**⚠️ Keep this file secure! Back it up securely.**

### VPN Security

- All inter-node traffic goes through WireGuard VPN
- Split tunnel: Only `10.0.0.0/24` routed through VPN
- Persistent keepalive ensures connection stability

### Network Security

- PostgreSQL only accepts connections from VPN mesh
- Services bound to localhost where possible
- Monitoring dashboards accessible only via VPN

## 🚨 Troubleshooting

### Services Won't Start

```bash
# Check logs
aurora-cli logs <service-name>

# Check Docker
docker ps -a

# Restart services
aurora-cli restart
```

### Database Replication Issues

```bash
# Check replication status
docker exec aurora-postgres psql -U robbie -d aurora -c "SELECT * FROM pg_stat_replication;"

# Check replication lag
aurora-cli sync-db

# Force re-sync (WARNING: drops local data)
cd /opt/aurora-node
docker-compose down postgres
docker volume rm aurora-postgres-$(cat .env | grep NODE_NAME | cut -d= -f2)
docker-compose up -d postgres
```

### VPN Not Connecting

```bash
# Check WireGuard status
docker exec aurora-wireguard wg show

# Restart VPN
aurora-cli restart wireguard

# Check firewall
# UDP port 51820 must be open
```

### Asset Sync Not Working

```bash
# Check sync service logs
aurora-cli logs asset-sync

# Check MinIO/S3 connectivity
docker exec aurora-asset-sync curl http://10.0.0.1:9000

# Force sync
aurora-cli sync-assets
```

## 🔄 CI/CD Deployment

Automated deployment via GitHub Actions:

```bash
# Trigger manual deployment
gh workflow run deploy-standard-node.yml \
  -f target_node=vengeance \
  -f node_role=compute
```

Or push to `main` branch to auto-deploy to Aurora lead node.

## 📚 Advanced Topics

### Custom Services

Add custom services to `docker-compose.yml`:

```yaml
my-service:
  image: my-org/my-service:latest
  container_name: aurora-my-service
  networks:
    - aurora-mesh
  depends_on:
    - postgres
    - redis
```

### GPU Support

Enable GPU support during bootstrap or manually:

```bash
# In .env
GPU_ENABLED=true

# Start with GPU profile
export COMPOSE_PROFILES=gpu
docker-compose up -d
```

### Multi-Region Deployment

For geo-distributed nodes:

1. Deploy lead node in primary region
2. Deploy backup node in secondary region
3. Deploy compute nodes near users
4. Use DNS geo-routing (external to Aurora)

## 🎯 Performance Tuning

### PostgreSQL

Edit `config/postgresql.conf`:
```
shared_buffers = 4GB          # 25% of RAM
effective_cache_size = 12GB   # 75% of RAM
work_mem = 32MB               # Per query
```

### Redis

Adjust memory in `docker-compose.yml`:
```yaml
command: redis-server --maxmemory 4gb --maxmemory-policy allkeys-lru
```

### Asset Sync

Change sync interval in `.env`:
```bash
ASSET_SYNC_INTERVAL=60  # Sync every minute
```

## 📖 Further Reading

- [GPU Mesh Architecture](/.cursor/rules/gpu-mesh-architecture.mdc)
- [Memory Persistence Model](/.cursor/rules/memory-persistence-model.mdc)
- [Risk Assessment Model](/.cursor/rules/risk-assessment-model.mdc)
- [Main Documentation](/DOCUMENTATION_INDEX.md)

## 🆘 Support

Issues? Questions?

1. Check logs: `aurora-cli logs`
2. Check health: `aurora-cli health`
3. Open GitHub issue: https://github.com/dark-red-one/aurora-ai-robbiverse/issues

## 🎉 Success Metrics

**Deploy a new node in under 5 minutes. That's the Robbie standard.** 🚀

---

*Built with 💜 by the Aurora AI Empire*
