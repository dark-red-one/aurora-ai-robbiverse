#!/bin/bash
# FIND VENGEANCE - Multi-Subnet Hunter
# Scans both Starlink networks to find the GPU beast

echo "🔥🔥🔥 HUNTING FOR VENGEANCE ACROSS DUAL STARLINKS 🔥🔥🔥"
echo ""

# Check if nmap is installed
if ! command -v nmap &> /dev/null; then
    echo "📦 Installing nmap..."
    brew install nmap
fi

echo "🎯 Target: Vengeance (RTX 4090 Gaming Rig)"
echo "📡 Scanning both Starlink networks..."
echo ""

# Common Starlink subnets
SUBNETS=("192.168.0" "192.168.1" "192.168.2" "10.0.0" "10.128.0" "172.16.0")

# Try .local hostname first (fastest if it works)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  Trying .local hostnames (cross-subnet)..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

for hostname in "vengeance.local" "VENGEANCE.local" "vengeance-pc.local" "Vengeance.local"; do
    echo -n "   Testing $hostname: "
    if ping -c 1 -W 2 "$hostname" > /dev/null 2>&1; then
        IP=$(ping -c 1 "$hostname" | grep "PING" | awk -F'[()]' '{print $2}')
        echo "✅ FOUND! IP: $IP"
        echo ""
        echo "🎉 VENGEANCE LOCATED: $IP"
        echo ""
        echo "Test Ollama: curl http://$IP:11434/api/tags"
        echo "Or SSH: ssh allan@$IP"
        exit 0
    else
        echo "❌"
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  Scanning subnets (this takes ~30 seconds)..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

FOUND_HOSTS=()

for subnet in "${SUBNETS[@]}"; do
    echo "🔍 Scanning $subnet.0/24..."
    
    # Fast ping scan
    HOSTS=$(nmap -sn $subnet.0/24 --min-rate 5000 2>/dev/null | grep "Nmap scan report for" | awk '{print $NF}' | tr -d '()')
    
    if [ -n "$HOSTS" ]; then
        while IFS= read -r host; do
            # Skip if it's our own IP
            if [ "$host" = "192.168.1.199" ]; then
                continue
            fi
            
            FOUND_HOSTS+=("$host")
            echo "   ✅ Found: $host"
        done <<< "$HOSTS"
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  Testing found hosts for GPU/Ollama..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ ${#FOUND_HOSTS[@]} -eq 0 ]; then
    echo "❌ No hosts found on common subnets"
    echo ""
    echo "💡 Manual options:"
    echo "   1. Walk to Vengeance (300 feet)"
    echo "   2. Run: ipconfig (Windows) or hostname -I (Linux)"
    echo "   3. Text yourself the IP"
    echo "   4. Come back and run: curl http://THAT_IP:11434/api/tags"
    exit 1
fi

for host in "${FOUND_HOSTS[@]}"; do
    echo -n "   Testing $host for Ollama: "
    
    # Quick Ollama check
    if curl -s --connect-timeout 1 "http://$host:11434/api/tags" > /dev/null 2>&1; then
        echo "🔥🔥🔥 JACKPOT! 🔥🔥🔥"
        echo ""
        echo "   VENGEANCE FOUND WITH OLLAMA RUNNING!"
        echo "   IP: $host"
        echo "   Ollama: http://$host:11434"
        echo ""
        
        # Get models
        MODELS=$(curl -s "http://$host:11434/api/tags" | jq -r '.models[].name' 2>/dev/null)
        if [ -n "$MODELS" ]; then
            echo "   Models available:"
            echo "$MODELS" | while read model; do
                echo "      - $model"
            done
        fi
        
        echo ""
        echo "🎯 NEXT STEPS:"
        echo "   1. Test it: curl http://$host:11434/api/tags"
        echo "   2. Update config with IP: $host"
        echo "   3. Run inference!"
        exit 0
    else
        # Try SSH ping
        if timeout 1 bash -c "</dev/tcp/$host/22" 2>/dev/null; then
            echo "SSH open (might be Vengeance)"
        else
            echo "❌"
        fi
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Found ${#FOUND_HOSTS[@]} hosts but Ollama not detected"
echo ""
echo "Hosts found:"
for host in "${FOUND_HOSTS[@]}"; do
    echo "   - $host"
done
echo ""
echo "💡 Try SSHing to these IPs to find Vengeance:"
echo "   ssh allan@IP_ADDRESS"
echo ""
echo "Or walk to Vengeance and grab the IP directly! 🚶‍♂️"

