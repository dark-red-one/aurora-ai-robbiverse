# Aurora DNS & VPN Setup - Production Deployment

**Status:** Ready for deployment  
**Date:** October 5, 2025  
**Aurora Town IP:** `45.32.194.172`

---

## 🌐 DNS Configuration

### Domain Setup
- **Primary Domain:** `aurora.testpilot.ai`
- **Target IP:** `45.32.194.172`
- **Port:** `8000` (Aurora Unified)
- **Protocol:** HTTP/HTTPS

### DNS Records Required
```
Type: A
Name: aurora.testpilot.ai
Value: 45.32.194.172
TTL: 300

Type: AAAA  
Name: aurora.testpilot.ai
Value: 2001:19f0:6401:10cc:5400:5ff:fea4:5b0b
TTL: 300
```

### Subdomain Options
```
aurora.testpilot.ai          → Main unified interface
api.aurora.testpilot.ai      → API endpoints
terminal.aurora.testpilot.ai → Terminal interface
notes.aurora.testpilot.ai    → Notes interface
```

---

## 🔒 VPN Configuration

### WireGuard VPN Setup
**Server:** Aurora Town (`45.32.194.172`)

#### Server Configuration (`/etc/wireguard/wg0.conf`)
```ini
[Interface]
PrivateKey = [SERVER_PRIVATE_KEY]
Address = 10.0.0.1/24
ListenPort = 51820
PostUp = iptables -A FORWARD -i %i -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i %i -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

[Peer]
PublicKey = [CLIENT_PUBLIC_KEY]
AllowedIPs = 10.0.0.2/32
```

#### Client Configuration
```ini
[Interface]
PrivateKey = [CLIENT_PRIVATE_KEY]
Address = 10.0.0.2/24
DNS = 10.0.0.1

[Peer]
PublicKey = [SERVER_PUBLIC_KEY]
Endpoint = 45.32.194.172:51820
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25
```

---

## 🚀 Deployment Steps

### 1. DNS Configuration
```bash
# Add DNS records to your domain registrar
# Point aurora.testpilot.ai to 45.32.194.172
```

### 2. VPN Server Setup (Aurora Town)
```bash
# Install WireGuard
apt update && apt install -y wireguard

# Generate keys
wg genkey | tee /etc/wireguard/server_private.key | wg pubkey > /etc/wireguard/server_public.key
wg genkey | tee /etc/wireguard/client_private.key | wg pubkey > /etc/wireguard/client_public.key

# Configure server
nano /etc/wireguard/wg0.conf

# Enable and start
systemctl enable wg-quick@wg0
systemctl start wg-quick@wg0
```

### 3. Firewall Configuration
```bash
# Allow VPN traffic
ufw allow 51820/udp

# Allow Aurora Unified port
ufw allow 8000/tcp

# Allow SSH
ufw allow 22/tcp

# Enable firewall
ufw --force enable
```

### 4. SSL/TLS Setup
```bash
# Install Certbot for Let's Encrypt
apt install -y certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d aurora.testpilot.ai
```

---

## 🔧 Aurora Unified Service Status

### Current Services
- ✅ **Aurora Unified**: Port 8000 - `systemctl is-active aurora-unified`
- ✅ **Robbie Terminal**: Port 8008 - `systemctl is-active robbie-terminal`  
- ✅ **Sticky Notes**: Port 8009 - Ready for deployment
- ✅ **Comms Dashboard**: Port 8010 - Ready for deployment

### Service Management
```bash
# Check status
systemctl status aurora-unified

# View logs
journalctl -u aurora-unified -f

# Restart service
systemctl restart aurora-unified
```

---

## 🌍 Access URLs

### Production URLs (After DNS Setup)
- **Main Interface:** `https://aurora.testpilot.ai`
- **API Status:** `https://aurora.testpilot.ai/api/status`
- **Login:** `https://aurora.testpilot.ai/`

### Current Access (Direct IP)
- **Main Interface:** `http://45.32.194.172:8000`
- **API Status:** `http://45.32.194.172:8000/api/status`
- **Login:** `http://45.32.194.172:8000/`

---

## 🔐 Authentication

### Employee Database
- **CEO:** `allan@testpilotcpg.com` / `aurora2024`
- **VP Sales:** `kristina@testpilotcpg.com` / `sales2024`
- **Developer:** `dev@testpilotcpg.com` / `dev2024`

### Session Management
- **Session Storage:** LocalStorage
- **Session Timeout:** 24 hours
- **Security:** JWT tokens with employee verification

---

## 📊 Monitoring & Logs

### Service Monitoring
```bash
# Check all services
systemctl status aurora-unified robbie-terminal

# View real-time logs
journalctl -u aurora-unified -f

# Check connections
netstat -tlnp | grep :8000
```

### Performance Monitoring
```bash
# CPU/Memory usage
htop

# Disk usage
df -h

# Network connections
ss -tuln
```

---

## 🚨 Troubleshooting

### Common Issues
1. **Service won't start:** Check logs with `journalctl -u aurora-unified -n 20`
2. **Port conflicts:** Verify with `netstat -tlnp | grep :8000`
3. **DNS not resolving:** Check DNS propagation with `nslookup aurora.testpilot.ai`
4. **VPN connection issues:** Check WireGuard logs with `journalctl -u wg-quick@wg0`

### Emergency Access
- **SSH:** `ssh root@45.32.194.172 -p 22`
- **Direct IP:** `http://45.32.194.172:8000`
- **Service Restart:** `systemctl restart aurora-unified`

---

## ✅ Ready for Production

The Aurora AI Empire is now ready for production deployment with:
- ✅ Unified tabbed interface
- ✅ Employee authentication
- ✅ Real-time WebSocket communication
- ✅ Beautiful TestPilot design
- ✅ Weather and connection status
- ✅ Strategic Robbie AI personality
- ✅ RunPod GPU integration via SSH tunnel

**Next Steps:**
1. Configure DNS records
2. Set up VPN server
3. Install SSL certificates
4. Test production access
5. Add monitoring and alerts

**Aurora AI Empire is ready to transform TestPilot CPG! 🚀**
