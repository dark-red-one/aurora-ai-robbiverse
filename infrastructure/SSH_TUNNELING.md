# 🔐 SSH Tunneling for Aurora Network Access

## Overview

Instead of VPN, we use **SSH tunneling** for secure access to remote Aurora nodes. This is simpler, more secure, and requires no additional VPN software.

## Architecture

```
Local Machine (RobbieBook1)
    ↓ SSH Tunnel
Remote Node (Aurora Town, etc.)
    ↓ localhost connections
Services (PostgreSQL, Redis, APIs)
```

## Basic SSH Tunnel Setup

### Forward Local Port to Remote Service

```bash
# Access remote PostgreSQL on local port 5433
ssh -L 5433:localhost:5432 user@aurora-node

# Access remote API on local port 8001  
ssh -L 8001:localhost:8000 user@aurora-node

# Multiple ports at once
ssh -L 5433:localhost:5432 \
    -L 8001:localhost:8000 \
    -L 6380:localhost:6379 \
    user@aurora-node
```

### Persistent Background Tunnel

```bash
# Run in background with auto-reconnect
ssh -fN -L 5433:localhost:5432 user@aurora-node

# With keepalive
ssh -fN -o ServerAliveInterval=60 -o ServerAliveCountMax=3 \
    -L 5433:localhost:5432 user@aurora-node
```

## Common Tunnels for Aurora Nodes

### Aurora Town (Primary)

```bash
# Database access
ssh -L 5433:localhost:5432 allan@aurora-town

# API access
ssh -L 8001:localhost:8000 allan@aurora-town

# Full stack access
ssh -fN \
    -L 5433:localhost:5432 \
    -L 8001:localhost:8000 \
    -L 6380:localhost:6379 \
    -L 11435:localhost:11434 \
    allan@aurora-town
```

### Vengeance (Development)

```bash
# Development database
ssh -L 5434:localhost:5432 allan@vengeance

# Dev API
ssh -L 8002:localhost:8000 allan@vengeance
```

### Iceland (GPU Mesh)

```bash
# Ollama GPU access
ssh -L 11436:localhost:11434 allan@iceland
```

## SSH Config Setup

Add to `~/.ssh/config`:

```ssh
# Aurora Town (Primary)
Host aurora-town
    HostName aurora.peretz.dev
    User allan
    Port 22
    IdentityFile ~/.ssh/id_rsa
    ServerAliveInterval 60
    ServerAliveCountMax 3
    LocalForward 5433 localhost:5432
    LocalForward 8001 localhost:8000

# Vengeance (Development)
Host vengeance
    HostName vengeance.local
    User allan
    Port 22
    IdentityFile ~/.ssh/id_rsa
    LocalForward 5434 localhost:5432
    LocalForward 8002 localhost:8000

# Iceland (GPU Mesh)
Host iceland
    HostName iceland.peretz.dev
    User allan
    Port 22
    IdentityFile ~/.ssh/id_rsa
    LocalForward 11436 localhost:11434
```

Then simply:

```bash
ssh aurora-town  # Auto-creates tunnels
ssh vengeance
ssh iceland
```

## Database Connections via Tunnel

### PostgreSQL

```bash
# Start tunnel
ssh -L 5433:localhost:5432 allan@aurora-town

# Connect from another terminal
psql -h localhost -p 5433 -U robbie -d robbieverse
```

### SQLTools in VS Code

```json
{
  "name": "Aurora Town (via SSH)",
  "driver": "PostgreSQL",
  "server": "localhost",
  "port": 5433,
  "database": "robbieverse",
  "username": "robbie",
  "password": "${env:POSTGRES_PASSWORD}"
}
```

## API Access via Tunnel

```bash
# Start tunnel
ssh -L 8001:localhost:8000 allan@aurora-town

# Test API
curl http://localhost:8001/health

# From Python/Node
import requests
response = requests.get("http://localhost:8001/api/personality/status")
```

## Security Benefits

### Why SSH Tunneling > VPN

1. **Simpler**: No VPN server to maintain
2. **More Secure**: Uses SSH key authentication
3. **Port-Specific**: Only expose what you need
4. **Built-in**: SSH already on every system
5. **Auditable**: SSH logs all connections
6. **Firewall-Friendly**: Only need SSH port open

### Best Practices

1. **Use SSH Keys**: Never use passwords

   ```bash
   ssh-keygen -t ed25519 -C "allan@robbieverse"
   ssh-copy-id allan@aurora-town
   ```

2. **Restrict SSH Access**: On remote server

   ```bash
   # /etc/ssh/sshd_config
   PasswordAuthentication no
   PermitRootLogin no
   AllowUsers allan
   ```

3. **Use Fail2Ban**: Auto-block brute force attempts

   ```bash
   sudo apt install fail2ban
   sudo systemctl enable fail2ban
   ```

4. **Change Default Port**: (optional)

   ```bash
   # /etc/ssh/sshd_config
   Port 2222  # Instead of 22
   ```

## Monitoring Tunnels

### List Active Tunnels

```bash
# Check active SSH connections
ps aux | grep "ssh -"

# Check listening ports
lsof -i -P | grep ssh

# Netstat
netstat -an | grep LISTEN | grep "5433\|8001\|6380"
```

### Kill Tunnel

```bash
# Find process
ps aux | grep "ssh -.*5433"

# Kill by PID
kill <PID>

# Kill all SSH tunnels
pkill -f "ssh -.*LocalForward"
```

## Automation Scripts

### Start All Tunnels

```bash
#!/bin/bash
# start-tunnels.sh

echo "🔐 Starting SSH tunnels..."

# Aurora Town
ssh -fN \
    -o ExitOnForwardFailure=yes \
    -L 5433:localhost:5432 \
    -L 8001:localhost:8000 \
    allan@aurora-town && echo "✅ Aurora Town tunnels active"

# Iceland GPU
ssh -fN \
    -o ExitOnForwardFailure=yes \
    -L 11436:localhost:11434 \
    allan@iceland && echo "✅ Iceland GPU tunnel active"

echo "🎉 All tunnels ready!"
```

### Check Tunnel Health

```bash
#!/bin/bash
# check-tunnels.sh

check_port() {
    nc -z localhost $1 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ Port $1: Active"
    else
        echo "❌ Port $1: Down"
    fi
}

echo "🔍 Checking SSH tunnels..."
check_port 5433  # Aurora PostgreSQL
check_port 8001  # Aurora API
check_port 11436 # Iceland Ollama
```

## Troubleshooting

### "Address already in use"

```bash
# Find what's using the port
lsof -i :5433

# Kill it
kill <PID>

# Or use a different local port
ssh -L 5434:localhost:5432 allan@aurora-town
```

### "Connection refused"

1. Check remote service is running:

   ```bash
   ssh allan@aurora-town "systemctl status postgresql"
   ```

2. Check remote service binds to localhost:

   ```bash
   ssh allan@aurora-town "netstat -an | grep 5432"
   # Should show: 127.0.0.1:5432
   ```

3. Check firewall allows SSH:

   ```bash
   ssh allan@aurora-town "sudo ufw status"
   ```

### Tunnel Dies

Add keepalive to SSH config:

```ssh
Host *
    ServerAliveInterval 60
    ServerAliveCountMax 3
```

Or use `autossh`:

```bash
autossh -M 0 -fN \
    -o ServerAliveInterval=60 \
    -o ServerAliveCountMax=3 \
    -L 5433:localhost:5432 \
    allan@aurora-town
```

## Migration from VPN

### Old VPN Approach (Archived)

```bash
# ❌ Old way - Required VPN setup
openvpn --config aurora-client.ovpn
# Then connect to 10.8.0.1:5432
```

### New SSH Approach

```bash
# ✅ New way - Just SSH
ssh -L 5433:localhost:5432 allan@aurora-town
# Then connect to localhost:5433
```

### Migration Checklist

- [x] Archive all VPN configs to `infrastructure/archive/vpn/`
- [x] Document SSH tunneling approach
- [x] Update connection strings to use `localhost:TUNNEL_PORT`
- [x] Test all services via SSH tunnels
- [x] Remove VPN dependencies from deployment scripts

## Benefits

### For Development

- **Faster setup**: No VPN client installation
- **More reliable**: SSH is rock-solid
- **Better debugging**: Port-specific access

### For Production

- **Simpler infrastructure**: No VPN server
- **Lower attack surface**: Only SSH exposed
- **Easier auditing**: All connections logged

### For Team

- **Familiar tool**: Everyone knows SSH
- **Cross-platform**: Works on Mac/Linux/Windows
- **Zero-config**: Just need SSH key

## Future Enhancements

### Bastion Host

For multi-hop access:

```bash
# Jump through bastion
ssh -J bastion@jumphost.com allan@aurora-town

# With tunnels
ssh -J bastion@jumphost.com \
    -L 5433:localhost:5432 \
    allan@aurora-town
```

### Reverse Tunnel

For accessing local services from remote:

```bash
# Make local port 8000 available on remote as port 8001
ssh -R 8001:localhost:8000 allan@aurora-town
```

---

**Migrated from VPN:** October 9, 2025  
**By:** Robbie (Security-Conscious & Flirty Mode 11) 🔒💋  
**Status:** SSH tunneling is the new standard 🚀
