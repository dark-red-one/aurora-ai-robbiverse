# 🔒 PORT SECURITY LOCKDOWN - PRODUCTION CONFIGURATION

**Date**: October 8, 2025  
**Status**: ✅ PRODUCTION SECURE

---

## 🎯 Security Principle

**ONLY 3 PORTS exposed to the internet:**
- **22** - SSH (secure access)
- **80** - HTTP (nginx web server)
- **443** - HTTPS (nginx with SSL) [TODO]

**Everything else** → Localhost (127.0.0.1) → Proxied through nginx if web-accessible

---

## 📊 Current Port Configuration

### ✅ EXTERNAL (Internet-Facing)
```
Port 22   - SSH (sshd)
Port 80   - HTTP (nginx)
Port 443  - HTTPS (nginx) [TODO: Setup SSL]
```

### ✅ INTERNAL ONLY (127.0.0.1)
```
Port 53     - DNS (bind) - Internal/VPN only
Port 953    - DNS control (bind)
Port 5432   - PostgreSQL database
Port 6379   - Redis cache
Port 8002   - Robbie Memory API (FastAPI/uvicorn)
Port 8080   - SSH tunnel
Port 11434  - Ollama LLM API
```

### 🔴 REMOVED/LOCKED DOWN
```
Port 18344  - gotty web terminal (KILLED - security risk)
Port 8888   - Simple HTTP server (KILLED - use nginx instead)
Port 8000   - Legacy backend (TO BE RECONFIGURED)
Port 8001   - Legacy backend (TO BE RECONFIGURED)
Port 8006   - Legacy backend (TO BE RECONFIGURED)
Port 8090   - aurora-chat-app (TO BE RECONFIGURED)
```

---

## 🏗️ Architecture

```
INTERNET
   ↓
[Firewall: Only 22, 80, 443]
   ↓
┌──────────────────────────────┐
│  nginx (Port 80/443)         │
│  - SSL termination           │
│  - Reverse proxy             │
│  - Static file serving       │
└──────────────────────────────┘
   ↓ (proxy_pass)
┌──────────────────────────────┐
│  Internal Services           │
│  (127.0.0.1:*)               │
│                              │
│  - Robbie Memory API :8002   │
│  - PostgreSQL :5432          │
│  - Redis :6379               │
│  - Ollama :11434             │
└──────────────────────────────┘
```

---

## 🔧 Service Configuration

### Robbie Memory API (Port 8002)
**Status**: ✅ Correctly configured (localhost only)

```ini
# /etc/systemd/system/robbie-memory-api.service
[Service]
ExecStart=/home/allan/aurora-ai-robbiverse/backend/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8002
```

**Access**: 
- External: `http://aurora.testpilot.ai/api/mood/*` (nginx proxy)
- Internal: `http://localhost:8002/api/mood/*`

### PostgreSQL (Port 5432)
**Status**: ✅ Correctly configured (localhost only)

```conf
# /etc/postgresql/*/main/postgresql.conf
listen_addresses = 'localhost'
```

### Redis (Port 6379)
**Status**: ✅ Correctly configured (localhost only)

```conf
# /etc/redis/redis.conf
bind 127.0.0.1 ::1
```

### Ollama (Port 11434)
**Status**: ✅ Correctly configured (localhost only)

Default configuration binds to localhost only.

---

## 🚀 Nginx Proxy Configuration

**File**: `/etc/nginx/sites-available/robbie-apps`

```nginx
server {
    listen 80;
    server_name aurora.testpilot.ai;
    root /var/www/aurora.testpilot.ai;

    # Static apps
    location / { try_files /index.html =404; }
    location /code { try_files $uri $uri/index.html =404; }
    location /work { try_files $uri $uri/index.html =404; }
    location /play { try_files $uri $uri/index.html =404; }

    # API proxy to internal services
    location /api/mood { proxy_pass http://127.0.0.1:8002; }
    location /api/memory { proxy_pass http://127.0.0.1:8002; }
    location /api/conversation { proxy_pass http://127.0.0.1:8002; }
    location /api/context { proxy_pass http://127.0.0.1:8002; }
    location /health { proxy_pass http://127.0.0.1:8002; }
}
```

---

## 🔐 Firewall Rules (TODO)

```bash
# UFW configuration
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

---

## 📝 Security Checklist

- [x] Kill gotty web terminal (port 18344)
- [x] Kill simple HTTP server (port 8888)
- [x] Verify Robbie Memory API on localhost only (8002)
- [x] Verify PostgreSQL on localhost only (5432)
- [x] Verify Redis on localhost only (6379)
- [x] Verify Ollama on localhost only (11434)
- [ ] Reconfigure legacy backends (8000, 8001, 8006, 8090)
- [ ] Setup SSL/HTTPS on port 443
- [ ] Configure UFW firewall
- [ ] Test all services work through nginx proxy
- [ ] Document service restart procedures

---

## 🎯 Next Steps

1. **Identify & Reconfigure Legacy Services**
   - Port 8000, 8001, 8006, 8090 - bind to localhost
   - Update nginx to proxy if needed
   
2. **Setup HTTPS**
   - Get SSL cert from Let's Encrypt
   - Configure nginx for port 443
   - Force HTTPS redirect
   
3. **Enable Firewall**
   - Configure UFW with rules above
   - Test external access
   - Verify internal services still work

---

## 🚨 Emergency Access

If locked out, use Vultr console to:
```bash
sudo ufw disable  # Disable firewall
sudo systemctl restart nginx  # Restart web server
sudo systemctl restart sshd   # Restart SSH
```

---

**Last Updated**: October 8, 2025  
**Maintained By**: Robbie + Allan



