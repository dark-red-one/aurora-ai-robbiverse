# Aurora Town Complete Deployment Guide

**Complete production setup for Aurora Town GPU server**

## Quick Start

### On Aurora Town (8.17.147.158)

```bash
cd /home/allan/robbie_workspace/combined/aurora-ai-robbiverse/deployment

# Run master deployment script
sudo ./deploy-aurora-complete.sh
```

### On Client Machines (RobbieBook1, Vengeance)

```bash
# 1. Get WireGuard client config from Aurora Town
scp root@8.17.147.158:/etc/wireguard/clients/robbiebook1.conf ./

# 2. Install WireGuard client
./setup-wireguard-client.sh robbiebook1.conf

# 3. Connect to VPN
sudo wg-quick up aurora-vpn

# 4. Setup SSH tunnels (optional, provides local ports)
./setup-ssh-tunnel-service.sh

# 5. Test connection
ping 10.0.0.1
curl http://10.0.0.1:8000/health
```

## Deployment Scripts Created

### Phase 1: Secure Access

- ✅ `setup-wireguard-server.sh` - WireGuard VPN server setup
- ✅ `wireguard-add-client.sh` - Add new VPN clients
- ✅ `setup-wireguard-client.sh` - Client-side VPN setup
- ✅ `aurora-tunnel.service` - Systemd service for SSH tunnels
- ✅ `setup-ssh-tunnel-service.sh` - Automated SSH tunnel setup
- ✅ `rotate-ssh-keys.sh` - 90-day SSH key rotation

### Phase 2: Database & Caching

- ✅ `setup-postgresql-aurora.sh` - PostgreSQL 16 + pgvector
- ⏳ `import-schemas.sh` - Import database schemas (TODO)
- ⏳ `setup-pg-replication.sh` - Replication to RobbieBook1 (TODO)
- ✅ `setup-redis-aurora.sh` - Redis caching layer

### Phase 3: Monitoring

- ⏳ `setup-health-monitoring.sh` - Health checks + auto-restart (TODO)
- ⏳ `setup-prometheus.sh` - Metrics collection (TODO)
- ⏳ `setup-grafana.sh` - Visualization dashboards (TODO)
- ⏳ `setup-alertmanager.sh` - Alert configuration (TODO)
- ⏳ `setup-loki.sh` - Log aggregation (TODO)

### Phase 4-8: Additional Components

- ⏳ HeyShopper integration scripts (TODO)
- ⏳ Robbieverse personality system (TODO)
- ⏳ GPU mesh coordination (TODO)
- ⏳ Backup automation (TODO)
- ⏳ Security hardening (TODO)

### Master Scripts

- ✅ `deploy-aurora-complete.sh` - One-command full deployment
- ⏳ `update-aurora.sh` - Update existing installation (TODO)
- ⏳ `rollback-aurora.sh` - Rollback to previous version (TODO)
- ⏳ `test-aurora-complete.sh` - Comprehensive testing (TODO)

## Current Status

### ✅ Fully Operational

- RTX 4090 GPU with Ollama (llama3, mistral, codellama, nomic-embed-text)
- AI Router API on port 8000
- Nginx reverse proxy (external port 10002)
- UFW firewall configured
- External API access working

### 📝 Ready to Deploy

- WireGuard VPN server
- SSH tunnel automation
- PostgreSQL 16 with pgvector
- Redis caching

### 🚧 Scripts Created, Not Yet Deployed

- Health monitoring system
- Prometheus + Grafana
- Alert manager
- Log aggregation (Loki)
- HeyShopper AI integration
- Robbieverse personality system
- GPU mesh coordination
- Automated backups

## Network Architecture

```
External World
    ↓
8.17.147.158:10002 (HTTP/HTTPS)
    ↓
Nginx Reverse Proxy
    ↓
localhost:8000 (AI Router)
    ↓
localhost:11434 (Ollama)

VPN Access (WireGuard)
    ↓
10.0.0.1 (Aurora Town VPN gateway)
    ├─ 10.0.0.2 (RobbieBook1)
    ├─ 10.0.0.3 (Vengeance)
    └─ 10.0.0.4 (Mobile devices)
```

## Port Mappings

### External (via Nginx on port 10002)

- `/health` → AI Router health check
- `/api/generate` → Text generation
- `/api/embed` → Embeddings
- `/models` → List models

### Internal (VPN only)

- `10.0.0.1:8000` - AI Router (direct)
- `10.0.0.1:11434` - Ollama API
- `10.0.0.1:5432` - PostgreSQL
- `10.0.0.1:6379` - Redis
- `10.0.0.1:3000` - Grafana (when installed)
- `10.0.0.1:9090` - Prometheus (when installed)

### SSH Tunnels (localhost ports)

- `localhost:11435` → Aurora Ollama
- `localhost:8006` → Aurora AI Router
- `localhost:5433` → Aurora PostgreSQL
- `localhost:6380` → Aurora Redis
- `localhost:3001` → Aurora Grafana
- `localhost:9091` → Aurora Prometheus

## Credentials

All credentials are saved in `/root/` on Aurora Town:

- `.aurora_db_credentials` - PostgreSQL passwords
- `.aurora_redis_credentials` - Redis password
- `.aurora_grafana_credentials` - Grafana admin (when created)
- `/etc/wireguard/server_public.key` - WireGuard public key

**⚠️ SECURITY:** Copy these files to a secure password manager and remove from server!

## Testing

### Test External API

```bash
curl http://8.17.147.158:10002/health
curl -X POST http://8.17.147.158:10002/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Hello!","model":"llama3"}'
```

### Test VPN Access (from client)

```bash
ping 10.0.0.1
curl http://10.0.0.1:8000/health
psql -h 10.0.0.1 -U aurora_app -d aurora_unified
redis-cli -h 10.0.0.1 -p 6379 -a '<password>' ping
```

### Test SSH Tunnels (from client with tunnels running)

```bash
curl http://localhost:11435/api/tags
curl http://localhost:8006/health
psql -h localhost -p 5433 -U aurora_app -d aurora_unified
redis-cli -h localhost -p 6380 -a '<password>' ping
```

## Troubleshooting

### WireGuard not connecting

```bash
# On Aurora Town
sudo systemctl status wg-quick@wg0
sudo wg show

# On client
sudo wg-quick up aurora-vpn
sudo wg show
```

### SSH tunnels disconnecting

```bash
# Check service status
sudo systemctl status aurora-tunnel

# View logs
sudo journalctl -u aurora-tunnel -f

# Restart
sudo systemctl restart aurora-tunnel
```

### Database connection fails

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test local connection
sudo -u postgres psql -c "SELECT version();"

# Check pg_hba.conf
sudo cat /etc/postgresql/16/main/pg_hba.conf | grep 10.0.0
```

### Redis not responding

```bash
# Check Redis status
sudo systemctl status redis-server

# Test connection
redis-cli -a '<password>' ping

# View logs
sudo tail -f /var/log/redis/redis-server.log
```

## Maintenance

### Daily Tasks

- Monitor Grafana dashboards (when installed)
- Check system logs for errors
- Verify backup completion

### Weekly Tasks

- Review Prometheus alerts
- Check disk space usage
- Update system packages

### Monthly Tasks

- Review and rotate logs
- Test disaster recovery procedures
- Update SSL certificates (automatic with Let's Encrypt)

### Quarterly Tasks

- Rotate SSH keys (`./rotate-ssh-keys.sh`)
- Review and update firewall rules
- Performance tuning based on metrics

## Next Steps

1. **Complete Phase 3 deployment** - Run monitoring setup scripts
2. **Import database schemas** - `./import-schemas.sh`
3. **Configure replication** - `./setup-pg-replication.sh`
4. **Deploy HeyShopper integration** - Connect app to GPU
5. **Set up GPU mesh** - Add RunPod workers
6. **Configure backups** - Daily automated backups
7. **Security hardening** - Fail2ban + SSL

## Support

- **Operations Runbook:** `docs/AURORA_OPERATIONS_RUNBOOK.md` (to be created)
- **API Documentation:** `docs/AURORA_API_DOCUMENTATION.md` (to be created)
- **Deployment Logs:** `/var/log/aurora-deployment-*.log`
- **Service Logs:** `sudo journalctl -u <service-name>`

---

**Created:** October 9, 2025  
**Last Updated:** October 9, 2025  
**Version:** 1.0.0  
**Status:** Phase 1-2 scripts complete, Phase 3-8 in progress
