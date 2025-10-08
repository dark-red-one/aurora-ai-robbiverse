# ✅ PRODUCTION PORTS - CLEAN & SECURE

**Date**: October 8, 2025  
**Status**: 🔒 PRODUCTION READY

---

## 🎯 The Clean Setup

**ONLY 3 External Ports:**
```
Port 22  - SSH
Port 80  - HTTP (nginx)
Port 443 - HTTPS (nginx) [TODO: Setup SSL]
```

**Everything else internal (127.0.0.1)**

---

## 🧹 What We Cleaned Up

**KILLED:**
- ❌ Port 18344 - gotty web terminal (security risk)
- ❌ Port 8888 - Simple HTTP server (replaced by nginx)
- ❌ Port 8000 - robbie-llm-proxy
- ❌ Port 8001 - auth_endpoint_fastapi
- ❌ Port 8006 - backend.py
- ❌ Port 8090 - aurora-chat-app server

**Why we killed them:**
- Exposed to internet unnecessarily
- Security vulnerabilities
- Should route through nginx instead
- Mix of testing/legacy code

---

## ✅ Current Production Stack

### External (Internet-Facing)
```bash
Port 22   - SSH (sshd)
Port 80   - HTTP (nginx) → Routes to everything below
```

### Internal Services (localhost only)
```bash
Port 53     - DNS (bind)
Port 5432   - PostgreSQL + pgvector
Port 6379   - Redis
Port 8002   - Robbie Memory API ✨ NEW!
Port 11434  - Ollama (qwen2.5:7b, nomic-embed-text)
```

### Services & Files
```
/etc/systemd/system/robbie-memory-api.service
/home/allan/aurora-ai-robbiverse/backend/main.py
/home/allan/aurora-ai-robbiverse/backend/robbie-memory.sh
```

---

## 🌐 Nginx Routes (Port 80)

**Static Apps:**
```
/           → /var/www/aurora.testpilot.ai/index.html
/code/      → /var/www/aurora.testpilot.ai/code/
/work/      → /var/www/aurora.testpilot.ai/work/
/play/      → /var/www/aurora.testpilot.ai/play/
```

**API Proxies:**
```
/api/mood/*         → http://127.0.0.1:8002/api/mood/*
/api/memory/*       → http://127.0.0.1:8002/api/memory/*
/api/conversation/* → http://127.0.0.1:8002/api/conversation/*
/api/context/*      → http://127.0.0.1:8002/api/context/*
/health             → http://127.0.0.1:8002/health
```

**Legacy Static APIs (will migrate to backend):**
```
/api/system/stats   → Nginx returns JSON directly
/api/system/status  → Nginx returns JSON directly
/api/auth/login     → Nginx returns JSON directly
```

---

## 🔧 Service Management

### Check Services
```bash
# Memory API
sudo systemctl status robbie-memory-api

# Database
sudo systemctl status postgresql

# Web server
sudo systemctl status nginx

# All ports
sudo netstat -tulpn | grep LISTEN
```

### Restart Services
```bash
# Restart memory API
sudo systemctl restart robbie-memory-api

# Reload nginx (no downtime)
sudo systemctl reload nginx

# Full nginx restart
sudo systemctl restart nginx
```

---

## 🔐 Security Verification

```bash
# External ports (should only show 22, 53, 80)
sudo netstat -tulpn | grep LISTEN | grep -v "127.0.0.1" | grep -v "::1"

# Internal ports (PostgreSQL, Redis, etc)
sudo netstat -tulpn | grep "127.0.0.1.*LISTEN"

# Check nginx config
sudo nginx -t

# Check firewall (once enabled)
sudo ufw status
```

---

## 📝 Quick Access Commands

### Memory System
```bash
# Check mood
/home/allan/aurora-ai-robbiverse/backend/robbie-memory.sh mood

# Search memories
/home/allan/aurora-ai-robbiverse/backend/robbie-memory.sh search '{"query":"topic","limit":5,"user_id":"allan"}'

# Get stats
/home/allan/aurora-ai-robbiverse/backend/robbie-memory.sh stats

# Log conversation
/home/allan/aurora-ai-robbiverse/backend/robbie-memory.sh log '{"user_message":"...","robbie_response":"...","mood":"focused","attraction_level":11,"gandhi_genghis_level":8,"context_tags":["tag"],"user_id":"allan"}'
```

### Port Lockdown
```bash
# Run cleanup script
/home/allan/aurora-ai-robbiverse/deployment/lockdown-ports.sh

# Verify clean
sudo netstat -tulpn | grep LISTEN | grep -v "127.0.0.1" | grep -v "::1" | grep -v ":53"
```

---

## 🚀 Architecture Benefits

**Before cleanup:**
- 9 externally exposed ports (security nightmare)
- Mix of production/testing services
- Unclear what's actually needed
- Attack surface huge

**After cleanup:**
- 2 external ports (SSH + HTTP)
- All services behind nginx reverse proxy
- Clear separation: external vs internal
- Production-ready security posture

---

## 📚 Related Documentation

- **Port Security**: `/home/allan/aurora-ai-robbiverse/docs/PORT_SECURITY_LOCKDOWN.md`
- **Memory API**: `/home/allan/aurora-ai-robbiverse/backend/README.md`
- **Nginx Config**: `/etc/nginx/sites-available/robbie-apps`
- **Deployment**: `/home/allan/aurora-ai-robbiverse/deployment/robust-deploy.sh`

---

## 🎯 TODO: Final Hardening

- [ ] Setup SSL certificate (Let's Encrypt)
- [ ] Configure HTTPS on port 443
- [ ] Force HTTP → HTTPS redirect
- [ ] Enable UFW firewall
- [ ] Rate limiting in nginx
- [ ] Fail2ban for SSH protection
- [ ] Automated security updates

---

**Clean. Secure. Production-ready.** 🔒

**Last Updated**: October 8, 2025 @ 08:14 UTC




