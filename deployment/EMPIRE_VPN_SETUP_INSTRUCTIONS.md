# 🏛️ Robbieverse Empire VPN Setup Instructions

## Overview

Setting up WireGuard VPN mesh to connect:
- **Aurora Town** (10.0.0.10) - VPN Gateway + Elephant PostgreSQL
- **Vengeance** (10.0.0.2) - Gaming PC
- **RobbieBook1** (10.0.0.100) - MacBook Pro

## Step 1: Setup Aurora Town (VPN Gateway)

### Connect to Aurora Town

```bash
# SSH to Aurora Town
ssh root@aurora-postgres-u44170.vm.elestio.app

# Password: (use the postgres password)
```

### Run Setup Script

```bash
# Download and run setup script
curl https://raw.githubusercontent.com/dark-red-one/aurora-ai-robbiverse/main/deployment/setup-aurora-vpn-gateway-MANUAL.sh > /tmp/setup-vpn.sh
chmod +x /tmp/setup-vpn.sh
/tmp/setup-vpn.sh
```

**OR** manually copy/paste the script content from `deployment/setup-aurora-vpn-gateway-MANUAL.sh`

###Important: SAVE THE PUBLIC KEY!

The script will output:
```
✅ Aurora Town Public Key: <SOME_KEY_HERE>
```

**Copy this key!** You'll need it for Vengeance and RobbieBook1!

## Step 2: Setup Vengeance (This Machine!)

### Update VPN Config

The script `deployment/setup-vengeance-vpn-client.sh` will:
1. Use your existing Vengeance private key
2. Update config with Aurora Town's public key
3. Connect to Aurora Town VPN

### Run It

```bash
cd /home/allan/robbie_workspace/combined/aurora-ai-robbiverse
sudo ./deployment/setup-vengeance-vpn-client.sh <AURORA_PUBLIC_KEY>
```

Replace `<AURORA_PUBLIC_KEY>` with the key from Step 1!

### Test Connection

```bash
# Should see 10.0.0.10 responding
ping -c 3 10.0.0.10

# Test database connection via VPN
PGPASSWORD=0qyMjZQ3-xKIe-ylAPt0At psql -h 10.0.0.10 -p 25432 -U postgres -d robbieverse -c "SELECT NOW();"
```

## Step 3: Setup RobbieBook1 (MacBook)

### Generate Keys

```bash
mkdir -p ~/.wireguard
wg genkey | tee ~/.wireguard/privatekey | wg pubkey > ~/.wireguard/publickey
chmod 600 ~/.wireguard/privatekey
```

### Create VPN Config

```bash
# Get your private key
PRIVATE_KEY=$(cat ~/.wireguard/privatekey)
ROBBIEBOOK_PUBLIC_KEY=$(cat ~/.wireguard/publickey)

# Create config
cat > ~/.wireguard/robbie-empire.conf << EOF
[Interface]
PrivateKey = ${PRIVATE_KEY}
Address = 10.0.0.100/24
DNS = 8.8.8.8

[Peer]
PublicKey = <AURORA_PUBLIC_KEY_FROM_STEP_1>
Endpoint = aurora-postgres-u44170.vm.elestio.app:51820
AllowedIPs = 10.0.0.0/24
PersistentKeepalive = 25
EOF

chmod 600 ~/.wireguard/robbie-empire.conf
```

### Add RobbieBook1 to Aurora Town

SSH back to Aurora Town and add RobbieBook1 as a peer:

```bash
ssh root@aurora-postgres-u44170.vm.elestio.app

# Edit VPN config
nano /etc/wireguard/wg0.conf

# Add this section (uncomment and replace key):
#[Peer]
#PublicKey = <ROBBIEBOOK_PUBLIC_KEY>
#AllowedIPs = 10.0.0.100/32

# Restart WireGuard
systemctl restart wg-quick@wg0
```

### Connect from RobbieBook1

```bash
# Create connection script
cat > ~/robbie-vpn-connect.sh << 'EOF'
#!/bin/bash
sudo wg-quick up ~/.wireguard/robbie-empire.conf
echo "✅ VPN connected - testing..."
ping -c 3 10.0.0.10
EOF

chmod +x ~/robbie-vpn-connect.sh

# Connect!
~/robbie-vpn-connect.sh
```

## Verification

### Check VPN Status

**On Aurora Town:**
```bash
wg show
# Should show 2 peers (Vengeance + RobbieBook1)
```

**On Vengeance:**
```bash
sudo wg show
# Should show connection to Aurora Town
ping -c 3 10.0.0.10
```

**On RobbieBook1:**
```bash
sudo wg show
# Should show connection to Aurora Town
ping -c 3 10.0.0.10
ping -c 3 10.0.0.2  # Should reach Vengeance through VPN!
```

### Test Database Connectivity

```bash
# From Vengeance
PGPASSWORD=0qyMjZQ3-xKIe-ylAPt0At psql -h 10.0.0.10 -p 25432 -U postgres -d robbieverse -c "SELECT 'Vengeance connected!' as status;"

# From RobbieBook1
PGPASSWORD=0qyMjZQ3-xKIe-ylAPt0At psql -h 10.0.0.10 -p 25432 -U postgres -d robbieverse -c "SELECT 'RobbieBook1 connected!' as status;"
```

## Troubleshooting

### VPN Not Connecting

1. Check firewall on Aurora Town:
   ```bash
   ufw status
   # Should show 51820/udp ALLOW
   ```

2. Check WireGuard is running:
   ```bash
   systemctl status wg-quick@wg0
   ```

3. Check logs:
   ```bash
   journalctl -u wg-quick@wg0 -n 50
   ```

### Database Connection Fails

1. Verify VPN is connected first (ping 10.0.0.10)
2. Check PostgreSQL is listening:
   ```bash
   ssh root@aurora-postgres-u44170.vm.elestio.app "netstat -an | grep 25432"
   ```

3. Verify credentials (password might have changed)

## Next Steps

Once VPN is working:
1. ✅ All nodes can reach Elephant database at 10.0.0.10:25432
2. ✅ Ready to set up database sync!
3. ✅ Proceed to Phase 2 of the plan!

---

**Your VPN Network:**
```
Aurora Town (10.0.0.10)  ←→  Elephant PostgreSQL :25432
    ↕
Vengeance (10.0.0.2)     ←→  Local PostgreSQL :5432
    ↕  
RobbieBook1 (10.0.0.100) ←→  Local PostgreSQL :5432
```

**All nodes sync bidirectionally to Elephant! 🐘**

---
**Created:** October 9, 2025  
**By:** Robbie (Flirty Mode 11 & Empire Builder) 💋🔥

