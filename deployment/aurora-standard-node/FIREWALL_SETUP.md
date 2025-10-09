# 🔥 Firewall Setup - Aurora Security

## Critical Security Configuration

### Ubuntu/Debian Firewall Rules

```bash
#!/bin/bash
# scripts/configure-firewall.sh

# Reset firewall
ufw --force reset

# Default policies
ufw default deny incoming
ufw default allow outgoing

# Essential services
ufw allow 22/tcp     # SSH
ufw allow 51820/udp  # WireGuard VPN
ufw allow 443/tcp    # HTTPS (future)

# Docker network access
ufw allow from 172.20.0.0/16
ufw allow from 10.0.0.0/24

# Local development (macOS)
if [ "$(uname)" == "Darwin" ]; then
    echo "macOS detected - allowing local access"
    ufw allow from 192.168.0.0/16
    ufw allow from 10.0.0.0/8
fi

# Enable firewall
ufw --force enable

# Install fail2ban
apt-get update
apt-get install -y fail2ban

# Configure fail2ban
cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 3
EOF

# Start fail2ban
systemctl enable fail2ban
systemctl start fail2ban

echo "✅ Firewall configured successfully"
```

### macOS Firewall Rules

```bash
#!/bin/bash
# scripts/configure-firewall-macos.sh

# Enable firewall
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate on

# Allow Docker
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /Applications/Docker.app/Contents/MacOS/Docker

# Allow Node.js (for development)
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/node

# Block incoming connections by default
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setblockall on

echo "✅ macOS Firewall configured"
```

### Docker Network Security

```yaml
# docker-compose.yml - Network isolation
networks:
  aurora-mesh:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
    driver_opts:
      com.docker.network.bridge.enable_icc: "false"
      com.docker.network.bridge.enable_ip_masquerade: "true"
      com.docker.network.bridge.host_binding_ipv4: "0.0.0.0"
```

### Service-Specific Security

#### 1. PostgreSQL Security
```sql
-- config/pg_hba.conf
# Aurora VPN network
host    all             all             10.0.0.0/24            md5
host    all             all             172.20.0.0/16          md5

# Local connections
local   all             all                                     trust
host    all             all             127.0.0.1/32            md5

# Deny all other connections
host    all             all             0.0.0.0/0               reject
```

#### 2. Redis Security
```bash
# Redis configuration
requirepass ${REDIS_PASSWORD}
bind 127.0.0.1 172.20.0.10
protected-mode yes
```

#### 3. Nginx Security Headers
```nginx
# nginx.conf - Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;
```

### API Key Authentication

#### Environment Variables
```bash
# .env
API_KEYS=robbie-2025,allan-maverick,testpilot-cpg
JWT_SECRET_KEY=your-super-secret-jwt-key-change-in-production
REDIS_PASSWORD=your-redis-password
DB_PASSWORD=your-db-password
ENCRYPTION_KEY=your-encryption-key-for-secrets
```

#### API Key Validation
```python
# services/*/main.py
import os
from fastapi import Header, HTTPException

API_KEYS = os.getenv("API_KEYS", "").split(",")

async def verify_api_key(x_api_key: str = Header(...)):
    if x_api_key not in API_KEYS:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return x_api_key

# Protect endpoints
@app.get("/api/secrets", dependencies=[Depends(verify_api_key)])
async def get_secrets():
    ...
```

### SSL/TLS Setup (Future)

#### Let's Encrypt Configuration
```bash
#!/bin/bash
# scripts/setup-ssl.sh

# Install Certbot
apt-get install -y certbot python3-certbot-nginx

# Get certificate
certbot --nginx -d aurora.testpilotcpg.com --non-interactive --agree-tos \
    -m allan@testpilotcpg.com

# Auto-renewal cron
echo "0 0 * * * certbot renew --quiet" | crontab -

echo "✅ SSL configured"
```

### Monitoring Security

#### Security Monitoring
```python
# services/security-monitor/monitor.py
import logging
from datetime import datetime

def log_security_event(event_type, details):
    """Log security events"""
    logger.warning(f"SECURITY: {event_type} - {details}")
    
    # Send to Redis for real-time monitoring
    redis_client.publish("aurora:security:events", json.dumps({
        "event_type": event_type,
        "details": details,
        "timestamp": datetime.utcnow().isoformat(),
        "node": NODE_NAME
    }))

# Monitor for:
# - Failed login attempts
# - Unauthorized API access
# - Suspicious network activity
# - Resource exhaustion attacks
```

### Backup Security

#### Encrypted Backups
```bash
#!/bin/bash
# scripts/secure-backup.sh

BACKUP_DIR="/backups/aurora-secure"
ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY}"

# Create encrypted backup
docker exec aurora-postgres pg_dump -U aurora_app aurora_unified \
    | gpg --symmetric --cipher-algo AES256 --passphrase "$ENCRYPTION_KEY" \
    | gzip > "$BACKUP_DIR/aurora_$(date +%Y%m%d_%H%M%S).sql.gz.gpg"

# Upload to secure storage
aws s3 cp "$BACKUP_DIR/aurora_$(date +%Y%m%d_%H%M%S).sql.gz.gpg" \
    s3://testpilot-secure-backups/aurora-db/ \
    --sse aws:kms

echo "✅ Secure backup completed"
```

### Security Checklist

#### Pre-Deployment
- [ ] Firewall rules configured
- [ ] API keys set
- [ ] Database passwords changed
- [ ] Redis password set
- [ ] JWT secret key set
- [ ] Encryption keys set
- [ ] Fail2ban installed
- [ ] SSL certificates (if needed)

#### Post-Deployment
- [ ] Test firewall rules
- [ ] Verify API authentication
- [ ] Check security headers
- [ ] Monitor failed login attempts
- [ ] Test backup encryption
- [ ] Verify network isolation

#### Ongoing Security
- [ ] Regular security updates
- [ ] Monitor access logs
- [ ] Review failed authentications
- [ ] Update API keys quarterly
- [ ] Test disaster recovery
- [ ] Security audit monthly

---

## 🚨 Security Incident Response

### If Compromised
1. **Immediate**: Block suspicious IPs
2. **Contain**: Isolate affected services
3. **Assess**: Determine scope of breach
4. **Recover**: Restore from clean backups
5. **Prevent**: Update security measures

### Emergency Contacts
- **Allan**: allan@testpilotcpg.com
- **Robbie**: robbie@testpilotcpg.com
- **Security**: security@testpilotcpg.com

---

**Security is not optional. It's essential. 🔒**
