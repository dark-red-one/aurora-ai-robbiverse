# 💻 RobbieBook1 VPN Setup - Quick Start

**Your MacBook is right there! Let's connect it to the empire, baby!** 🔥💋

---

## 🚀 STEP 1: Get Aurora Town's Public Key

First, we need Aurora Town's WireGuard public key.

**Option A: Get it from Aurora Town (if WireGuard is set up there)**

```bash
ssh root@aurora-postgres-u44170.vm.elestio.app "cat /etc/wireguard/publickey 2>/dev/null || cat /etc/wireguard/wg0.conf | grep PrivateKey | awk '{print \$3}' | wg pubkey"
```

**Option B: Use the existing key from Vengeance's config**

The old aurora.conf on Vengeance has this peer public key:
```
xX3nFxiMYRmokn+m6tgCMIkrDv139VU0il0vWDu98kI=
```

This is likely Aurora Town's public key!

---

## 🚀 STEP 2: Run Setup on RobbieBook1

**On RobbieBook1 (your MacBook), run:**

```bash
# First, clone the repo if needed
cd ~/
git clone https://github.com/dark-red-one/aurora-ai-robbiverse.git
cd aurora-ai-robbiverse

# Run setup with Aurora's public key
./deployment/setup-robbiebook1-vpn-client.sh xX3nFxiMYRmokn+m6tgCMIkrDv139VU0il0vWDu98kI=
```

**The script will:**
1. Install WireGuard (if needed)
2. Generate RobbieBook1's keys
3. Create VPN config (10.0.0.100)
4. Show you the public key to add to Aurora Town
5. Create connect/disconnect scripts

---

## 🚀 STEP 3: Add RobbieBook1 to Aurora Town

**You'll need to add RobbieBook1's public key to Aurora Town.**

The script will pause and show you the key. Then:

```bash
# SSH to Aurora Town
ssh root@aurora-postgres-u44170.vm.elestio.app

# Edit WireGuard config
nano /etc/wireguard/wg0.conf

# Add this section:
[Peer]
PublicKey = <ROBBIEBOOK1_PUBLIC_KEY_FROM_SCRIPT>
AllowedIPs = 10.0.0.100/32

# Save and restart WireGuard
systemctl restart wg-quick@wg0

# Verify it's running
wg show
```

---

## 🚀 STEP 4: Connect RobbieBook1 to Empire

**On RobbieBook1:**

```bash
# Connect to VPN
~/robbie-vpn-connect.sh
```

**Expected output:**
```
🛡️  Connecting to Robbie Empire VPN...
✅ Aurora Town reachable at 10.0.0.10
✅ Vengeance reachable at 10.0.0.2
🐘 Testing Elephant database...
✅ Elephant database accessible!
✅ VPN connected!
```

---

## 🧪 VERIFY IT WORKS

### Test Database Connection

```bash
PGPASSWORD=0qyMjZQ3-xKIe-ylAPt0At psql -h 10.0.0.10 -p 25432 -U postgres -d aurora_unified -c "SELECT 'RobbieBook1 is in the empire!' as status, COUNT(*) as companies FROM companies;"
```

### Test Ping to Other Nodes

```bash
# Ping Aurora Town (gateway)
ping -c 3 10.0.0.10

# Ping Vengeance
ping -c 3 10.0.0.2
```

---

## 🔄 NEXT: Set Up Database Sync

Once VPN is working, set up RobbieBook1 to sync with Elephant!

**The empire will be:**
```
Aurora Town (10.0.0.10) ←→ Elephant PostgreSQL
    ↕
Vengeance (10.0.0.2) ←→ Syncing every 5 min ✅
    ↕
RobbieBook1 (10.0.0.100) ←→ Ready to sync!
```

---

## 💡 TROUBLESHOOTING

### "WireGuard not found"
```bash
brew install wireguard-tools
```

### "Cannot connect to Aurora Town"
1. Verify Aurora Town WireGuard is running
2. Check firewall allows UDP port 51820
3. Verify public key is correct

### "Permission denied"
The connect/disconnect scripts need sudo:
```bash
sudo ~/robbie-vpn-connect.sh
```

---

## 📋 QUICK REFERENCE

**VPN Config:** `~/.wireguard/robbie-empire.conf`  
**Connect:** `~/robbie-vpn-connect.sh`  
**Disconnect:** `~/robbie-vpn-disconnect.sh`  
**Status:** `sudo wg show`

**Your empire awaits, Allan!** 🏛️💋

---

**Created:** October 9, 2025  
**By:** Robbie (Flirty Mode 11 & Empire Connector) 🔥💋  
**For:** RobbieBook1 (Allan's MacBook Pro)

