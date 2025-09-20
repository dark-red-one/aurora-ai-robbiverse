#!/bin/bash
# Aurora AI Empire - GPU Node Connection Setup
# This script helps connect all 4 RTX 4090 GPUs across RunPod nodes

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'
BOLD='\033[1m'

echo -e "${BLUE}${BOLD}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}${BOLD}║         AURORA GPU MESH - NODE CONNECTION SETUP              ║${NC}"
echo -e "${BLUE}${BOLD}╚═══════════════════════════════════════════════════════════════╝${NC}"

# Aurora's public key
AURORA_PUBLIC_KEY="ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQCKdvrOexoyo8V4nXIsI2V65Q5P1C/Y0TVLPcakmGqn/UmiA2NvO/VlyiCjXSWkgJzDXZUC+rKisc2Eg6QNLOyO8izZu3M2ws67jkGY38vhGOpgswbS72VEwMWbrWXCa0MSXu30HelLqlXi57x1nRbcr3xQr2IjAiNbT7joCpIHOeElJn/YpIUoWzhPLF0Yvs7uGQCU9NyqIzG0GJvX51g4646gTuMEBmKuhk8nc2+JofLbCPBdS88SIKnFd+dl0ogOWvjWqVIbTS6HzDIZ4dn9XyBaoQD+mdy2rUzFbwP5H9nQgPsRzYigjzrvNm6iDchFliLM0XBlJgBG9YSKsbotFgqwYVAMUnzs2yzz3x9d5ESE6h90iSnkvmo6HILorB56FTIb2CNc7G6Byx0ruX7RgJIhaO3QugNr8Gp+WHCa6mZlOxUawTfHzOP4e/sUxT7y2RwNbYBdmAvFdeA20py3DzOybi0vsIlkqfim1jMP1Mysr93Su3NRmsADMann9HpLuOfH4D3qIEqGdS1xC7oVfwu8Jtopg22YLD2ukvbdSq9ifxbmljpH7iiA97I5shvBEo3LWpc1hc7fbe0ZOA4nx3u3/T5XLFLTGYvSH+uVy3bpSFLg6T6s6nV0uSIlg74l0m0VjLo2cSbhty1tjHT9Wz685GnarDCyzWOnRfLWcQ== root@54acac6cfcfe"

echo -e "\n${YELLOW}📋 Current GPU Infrastructure:${NC}"
echo -e "   ${GREEN}✅${NC} Aurora (Current): 2x RTX 4090 - ${GREEN}CONNECTED${NC}"
echo -e "   ${YELLOW}⏳${NC} Collaboration: 1x RTX 4090 - ${YELLOW}PENDING${NC}"
echo -e "   ${YELLOW}⏳${NC} Fluenti: 1x RTX 4090 - ${YELLOW}PENDING${NC}"
echo -e "   ${BLUE}📊${NC} Total: 4x RTX 4090 = 96GB VRAM"

echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}AUTOMATIC CONNECTION ATTEMPT${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

# Function to test node connection
test_node() {
    local name=$1
    local ip=$2
    local port=$3
    
    echo -ne "\n${YELLOW}Testing $name node...${NC} "
    
    if timeout 3 ssh -o StrictHostKeyChecking=no -o ConnectTimeout=2 -p $port root@$ip "nvidia-smi --query-gpu=name --format=csv,noheader" 2>/dev/null; then
        echo -e "${GREEN}✅ CONNECTED!${NC}"
        return 0
    else
        echo -e "${RED}❌ Need manual setup${NC}"
        return 1
    fi
}

# Test connections
echo -e "\n${BOLD}Testing Node Connections:${NC}"
test_node "Collaboration" "213.181.111.2" "43540" || COLLAB_NEEDS_SETUP=1
test_node "Fluenti" "103.196.86.56" "19777" || FLUENTI_NEEDS_SETUP=1

if [[ -z "${COLLAB_NEEDS_SETUP:-}" && -z "${FLUENTI_NEEDS_SETUP:-}" ]]; then
    echo -e "\n${GREEN}${BOLD}🎉 ALL NODES CONNECTED!${NC}"
    echo -e "${GREEN}All 4 RTX 4090 GPUs are accessible!${NC}"
else
    echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}MANUAL SETUP REQUIRED${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    
    echo -e "\n${YELLOW}To connect the other nodes, you need to:${NC}"
    echo -e "\n${BOLD}Option 1: Via RunPod Web Console${NC}"
    echo -e "1. Go to ${BLUE}https://runpod.io/console/pods${NC}"
    echo -e "2. Click on ${BOLD}Collaboration${NC} pod (ID: 7k1blgn8pa3k43)"
    echo -e "3. Go to 'Connect' tab → 'Connect to Web Terminal'"
    echo -e "4. Run this command in the web terminal:"
    echo -e "${BLUE}echo '$AURORA_PUBLIC_KEY' >> ~/.ssh/authorized_keys${NC}"
    echo -e "5. Repeat for ${BOLD}Fluenti${NC} pod (ID: n4zcnj47dy7q05)"
    
    echo -e "\n${BOLD}Option 2: Using RunPod API${NC}"
    echo -e "If you have RunPod API access, we can automate this."
    
    echo -e "\n${BOLD}Option 3: Password Authentication${NC}"
    echo -e "If the pods have password authentication enabled:"
    echo -e "${BLUE}ssh-copy-id -p 43540 root@213.181.111.2${NC}"
    echo -e "${BLUE}ssh-copy-id -p 19777 root@103.196.86.56${NC}"
fi

echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}GPU MESH VERIFICATION${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

# Create verification script
cat > /workspace/aurora/verify-gpu-mesh.sh << 'EOF'
#!/bin/bash
echo "🔍 Verifying GPU Mesh Network..."

# Aurora (local)
echo -e "\n📍 Aurora Node (Local):"
nvidia-smi --query-gpu=name,memory.total --format=csv,noheader | while read line; do
    echo "   • $line"
done

# Collaboration
if ssh -o ConnectTimeout=2 -p 43540 root@213.181.111.2 "exit" 2>/dev/null; then
    echo -e "\n📍 Collaboration Node:"
    ssh -p 43540 root@213.181.111.2 "nvidia-smi --query-gpu=name,memory.total --format=csv,noheader" | while read line; do
        echo "   • $line"
    done
else
    echo -e "\n❌ Collaboration Node: Not connected"
fi

# Fluenti
if ssh -o ConnectTimeout=2 -p 19777 root@103.196.86.56 "exit" 2>/dev/null; then
    echo -e "\n📍 Fluenti Node:"
    ssh -p 19777 root@103.196.86.56 "nvidia-smi --query-gpu=name,memory.total --format=csv,noheader" | while read line; do
        echo "   • $line"
    done
else
    echo -e "\n❌ Fluenti Node: Not connected"
fi

echo -e "\n✅ Verification complete!"
EOF

chmod +x /workspace/aurora/verify-gpu-mesh.sh

echo -e "\n${GREEN}Setup script created!${NC}"
echo -e "Run ${BOLD}./verify-gpu-mesh.sh${NC} after connecting nodes to verify."

# Create distributed training example
cat > /workspace/aurora/distributed-gpu-test.py << 'EOF'
#!/usr/bin/env python3
"""
Test distributed GPU access across all nodes
"""
import subprocess
import json

def test_all_nodes():
    nodes = {
        'aurora_local': {'command': 'nvidia-smi --query-gpu=name,memory.total --format=csv,noheader'},
        'collaboration': {'command': 'ssh -p 43540 root@213.181.111.2 "nvidia-smi --query-gpu=name,memory.total --format=csv,noheader"'},
        'fluenti': {'command': 'ssh -p 19777 root@103.196.86.56 "nvidia-smi --query-gpu=name,memory.total --format=csv,noheader"'}
    }
    
    total_gpus = 0
    print("🎮 Distributed GPU Network Status:\n")
    
    for node, config in nodes.items():
        try:
            result = subprocess.run(config['command'], shell=True, capture_output=True, text=True, timeout=5)
            if result.returncode == 0:
                gpus = result.stdout.strip().split('\n')
                print(f"✅ {node}: {len(gpus)} GPU(s)")
                for gpu in gpus:
                    print(f"   • {gpu}")
                total_gpus += len(gpus)
            else:
                print(f"❌ {node}: Not accessible")
        except:
            print(f"❌ {node}: Connection timeout")
    
    print(f"\n📊 Total GPUs accessible: {total_gpus}/4")
    if total_gpus == 4:
        print("🎉 Full GPU mesh operational!")
    
if __name__ == "__main__":
    test_all_nodes()
EOF

echo -e "\n${BLUE}${BOLD}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}${BOLD}NEXT STEPS:${NC}"
echo -e "${BLUE}${BOLD}═══════════════════════════════════════════════════════════════${NC}"
echo -e "\n1. Follow the manual setup instructions above"
echo -e "2. Run ${BOLD}./verify-gpu-mesh.sh${NC} to verify connections"
echo -e "3. Run ${BOLD}python3 distributed-gpu-test.py${NC} to test all GPUs"
echo -e "\n${YELLOW}Once connected, you'll have access to:${NC}"
echo -e "   • 4x RTX 4090 GPUs"
echo -e "   • 96GB total VRAM"
echo -e "   • 330.4 TFLOPS of compute power"
echo -e "   • Distributed AI training capability"

echo -e "\n${GREEN}${BOLD}Ready to connect your AI Empire! 🚀${NC}\n"
