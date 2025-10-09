# Aurora Standard Node - Quick Reference

## 🚀 One-Command Deploy

```bash
curl -sSL https://raw.githubusercontent.com/dark-red-one/aurora-ai-robbiverse/main/deployment/aurora-standard-node/bootstrap.sh | bash
```

## 🎯 Common Commands

```bash
# Status & Health
aurora-cli status          # Full node status
aurora-cli health          # Service health check
aurora-cli logs postgres   # View service logs

# Operations
aurora-cli restart         # Restart all services
aurora-cli update          # Update to latest version
aurora-cli backup          # Create full backup

# Database
aurora-cli sync-db         # Check replication status
aurora-cli promote         # Promote backup to lead (failover)

# Assets
aurora-cli sync-assets     # Force asset sync

# Debugging
aurora-cli ssh postgres    # SSH into container
docker ps                  # See running containers
docker logs aurora-postgres -f  # Follow logs
```

## 📊 Access Services

```bash
# Grafana
http://localhost:3000
Username: admin
Password: <see ~/.credentials>

# Prometheus
http://localhost:9090

# PostgreSQL
psql -h localhost -U robbie -d aurora

# Redis
redis-cli -a <password>
```

## 🔧 Node Roles

| Role | DNS | DB Mode | Asset | Purpose |
|------|-----|---------|-------|---------|
| **lead** | Primary | read-write | Origin | Aurora (Elestio) |
| **backup** | Standby | read-only | Mirror | Star (failover) |
| **compute** | Client | read-only | Cache | Vengeance, Iceland, RobbieBook1 |

## 🌐 VPN IPs

```
10.0.0.1 - Aurora (lead)
10.0.0.2 - Star (backup)
10.0.0.3 - Vengeance
10.0.0.4 - Iceland
10.0.0.5 - RobbieBook1
10.0.0.10+ - New nodes (auto-assigned)
```

## 📂 Directory Structure

```
/opt/aurora-node/              (Ubuntu)
$HOME/aurora-node/             (macOS)
├── .env                       # Node configuration
├── .credentials               # Passwords (KEEP SECURE!)
├── docker-compose.yml         # Service definitions
├── config/                    # Config files
│   ├── postgresql.conf
│   ├── pg_hba.conf
│   ├── Corefile
│   ├── prometheus.yml
│   └── zones/
├── services/                  # Custom services
│   ├── asset-sync/
│   └── health-monitor/
├── scripts/
│   └── postgres-init.sh
└── backups/                   # Local backups
```

## 🆘 Troubleshooting

### Service won't start
```bash
aurora-cli logs <service>
docker ps -a
aurora-cli restart <service>
```

### Database replication broken
```bash
aurora-cli sync-db
docker exec aurora-postgres psql -U robbie -d aurora -c "SELECT * FROM pg_stat_replication;"
```

### VPN not connecting
```bash
docker exec aurora-wireguard wg show
aurora-cli restart wireguard
# Check UDP port 51820 is open
```

### Out of disk space
```bash
docker system prune -a --volumes  # WARNING: removes unused data
aurora-cli backup                 # Before pruning!
```

## 🔄 Failover Procedure

If Aurora (lead) fails:

```bash
# 1. On Star (backup node)
aurora-cli promote

# 2. Update DNS (external)
# Point aurora.local to Star's public IP

# 3. Update application configs
# Change DB_PRIMARY_HOST to 10.0.0.2

# 4. On compute nodes, restart to pick up new primary
aurora-cli restart postgres
```

## 📈 Performance Tuning

```bash
# PostgreSQL - edit config/postgresql.conf
shared_buffers = 4GB          # 25% of RAM
effective_cache_size = 12GB   # 75% of RAM

# Redis - edit docker-compose.yml
--maxmemory 4gb

# Asset Sync - edit .env
ASSET_SYNC_INTERVAL=60  # Seconds
```

## 🎯 Success Checklist

After deployment, verify:

- [ ] `aurora-cli status` shows all services running
- [ ] `aurora-cli health` reports healthy
- [ ] Grafana accessible at http://localhost:3000
- [ ] PostgreSQL replication working (if replica)
- [ ] WireGuard VPN connected
- [ ] Asset sync running
- [ ] Credentials saved securely

---

**Deploy any node in under 5 minutes. That's the Robbie standard.** 🚀
