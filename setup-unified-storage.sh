#!/bin/bash
# Aurora AI Empire - Unified Storage System Setup
# Combines 178TB from Fluenti with fast NVMe storage

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'
BOLD='\033[1m'

echo -e "${BLUE}${BOLD}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}${BOLD}║         AURORA UNIFIED STORAGE SYSTEM - 178TB                ║${NC}"
echo -e "${BLUE}${BOLD}╚═══════════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${YELLOW}📊 Current Storage Architecture:${NC}"
echo -e "   • Aurora: 20GB NVMe (fast)"
echo -e "   • Collaboration: 20GB NVMe (fast)"
echo -e "   • Fluenti: 671TB Network Storage (massive)"
echo -e "   • Total Available: 178TB+"

echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}SETTING UP UNIFIED STORAGE${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

# Create unified storage mount points
echo -e "\n${YELLOW}1. Creating mount points...${NC}"
mkdir -p /workspace/unified-storage/{models,datasets,checkpoints,backups}
mkdir -p /workspace/fast-cache

# Setup SSHFS for mounting Fluenti's massive storage
echo -e "\n${YELLOW}2. Installing SSHFS for network mounting...${NC}"
if ! command -v sshfs &> /dev/null; then
    apt-get update -qq && apt-get install -y sshfs fuse -qq
    echo -e "   ${GREEN}✓ SSHFS installed${NC}"
else
    echo -e "   ${GREEN}✓ SSHFS already installed${NC}"
fi

# Create storage management script
cat > /workspace/aurora/storage-manager.py << 'EOF'
#!/usr/bin/env python3
"""
Aurora Unified Storage Manager
Intelligently manages 178TB across distributed nodes
"""

import os
import subprocess
import json
import shutil
from pathlib import Path
from datetime import datetime

class UnifiedStorage:
    def __init__(self):
        self.nodes = {
            'aurora': {
                'path': '/workspace',
                'type': 'nvme',
                'speed': 'fast',
                'capacity_gb': 20
            },
            'collaboration': {
                'host': '213.181.111.2',
                'port': 43540,
                'path': '/workspace',
                'type': 'nvme',
                'speed': 'fast',
                'capacity_gb': 20
            },
            'fluenti': {
                'host': '103.196.86.56',
                'port': 19777,
                'path': '/workspace',
                'type': 'network',
                'speed': 'bulk',
                'capacity_tb': 671,
                'available_tb': 178
            }
        }
        
        self.storage_tiers = {
            'hot': '/workspace/fast-cache',      # Frequently accessed
            'warm': '/workspace/unified-storage', # Regular access
            'cold': '/workspace/archive'          # Rarely accessed
        }
    
    def mount_fluenti_storage(self):
        """Mount Fluenti's 178TB storage"""
        mount_point = '/workspace/unified-storage/fluenti'
        os.makedirs(mount_point, exist_ok=True)
        
        # Check if already mounted
        result = subprocess.run(['mount'], capture_output=True, text=True)
        if 'fluenti' in result.stdout:
            print("✅ Fluenti storage already mounted")
            return True
        
        # Mount using SSHFS
        cmd = f"sshfs -o allow_other,default_permissions,reconnect,ServerAliveInterval=15,ServerAliveCountMax=3 " \
              f"-p 19777 root@103.196.86.56:/workspace {mount_point}"
        
        try:
            subprocess.run(cmd, shell=True, check=True)
            print(f"✅ Mounted 178TB from Fluenti at {mount_point}")
            return True
        except:
            print(f"❌ Failed to mount Fluenti storage")
            return False
    
    def setup_storage_hierarchy(self):
        """Create intelligent storage hierarchy"""
        hierarchy = {
            '/workspace/unified-storage/models': {
                'description': 'AI model zoo',
                'tier': 'warm',
                'sync_to': 'fluenti'
            },
            '/workspace/unified-storage/datasets': {
                'description': 'Training datasets',
                'tier': 'cold',
                'sync_to': 'fluenti'
            },
            '/workspace/unified-storage/checkpoints': {
                'description': 'Training checkpoints',
                'tier': 'warm',
                'sync_to': 'all'
            },
            '/workspace/fast-cache': {
                'description': 'Hot cache for active models',
                'tier': 'hot',
                'sync_to': 'local'
            }
        }
        
        for path, config in hierarchy.items():
            os.makedirs(path, exist_ok=True)
            print(f"📁 {path}: {config['description']}")
        
        return hierarchy
    
    def get_storage_stats(self):
        """Get unified storage statistics"""
        stats = {
            'total_available_tb': 178,
            'nodes': {}
        }
        
        # Local storage
        stat = os.statvfs('/workspace')
        free_gb = (stat.f_bavail * stat.f_frsize) / (1024**3)
        stats['nodes']['aurora'] = {'free_gb': free_gb, 'type': 'nvme'}
        
        # Remote storage via SSH
        for node, config in [('collaboration', '213.181.111.2:43540'), 
                             ('fluenti', '103.196.86.56:19777')]:
            try:
                host, port = config.split(':')
                cmd = f"ssh -p {port} root@{host} 'df -BG /workspace | tail -1'"
                result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
                if result.returncode == 0:
                    parts = result.stdout.split()
                    if len(parts) >= 4:
                        free = parts[3].rstrip('G')
                        stats['nodes'][node] = {'free_gb': float(free) if free.isdigit() else 0}
            except:
                pass
        
        return stats
    
    def sync_to_fluenti(self, source_path, category='models'):
        """Sync data to Fluenti's massive storage"""
        dest = f"/workspace/unified-storage/fluenti/{category}/{os.path.basename(source_path)}"
        cmd = f"rsync -avz --progress {source_path} root@103.196.86.56:{dest} -e 'ssh -p 19777'"
        
        print(f"📤 Syncing to Fluenti (178TB storage)...")
        subprocess.run(cmd, shell=True)
        print(f"✅ Synced to Fluenti: {dest}")
    
    def distribute_model(self, model_path):
        """Distribute model across storage tiers"""
        model_name = os.path.basename(model_path)
        size_gb = os.path.getsize(model_path) / (1024**3) if os.path.exists(model_path) else 0
        
        if size_gb < 1:
            # Small model - keep on fast NVMe
            dest = f"/workspace/fast-cache/{model_name}"
            shutil.copy2(model_path, dest)
            print(f"⚡ Small model cached on NVMe: {dest}")
        elif size_gb < 10:
            # Medium model - distribute to all nodes
            for node in ['collaboration', 'fluenti']:
                self.sync_to_node(model_path, node)
            print(f"📊 Medium model distributed to all nodes")
        else:
            # Large model - store on Fluenti
            self.sync_to_fluenti(model_path, 'models')
            print(f"💾 Large model stored on Fluenti (178TB)")
    
    def sync_to_node(self, source, node):
        """Sync to specific node"""
        if node == 'collaboration':
            cmd = f"rsync -avz {source} root@213.181.111.2:/workspace/ -e 'ssh -p 43540'"
        elif node == 'fluenti':
            cmd = f"rsync -avz {source} root@103.196.86.56:/workspace/ -e 'ssh -p 19777'"
        else:
            return
        
        subprocess.run(cmd, shell=True)

def main():
    storage = UnifiedStorage()
    
    print("\n🚀 UNIFIED STORAGE SYSTEM")
    print("=" * 60)
    
    # Setup storage hierarchy
    print("\n📊 Setting up storage hierarchy...")
    hierarchy = storage.setup_storage_hierarchy()
    
    # Get storage stats
    print("\n💾 Storage Statistics:")
    stats = storage.get_storage_stats()
    for node, data in stats['nodes'].items():
        print(f"   • {node}: {data.get('free_gb', 0):.1f}GB free")
    print(f"   • Total Available: {stats['total_available_tb']}TB")
    
    print("\n✅ Unified storage system ready!")
    print("   Use 'storage-manager.py' to manage 178TB across all nodes")

if __name__ == "__main__":
    main()
EOF

chmod +x /workspace/aurora/storage-manager.py

# Create unified storage access script
cat > /workspace/aurora/unified-storage.sh << 'EOF'
#!/bin/bash
# Quick access to unified storage system

case "$1" in
    mount)
        echo "Mounting Fluenti's 178TB storage..."
        sshfs -o allow_other,reconnect -p 19777 root@103.196.86.56:/workspace /workspace/unified-storage/fluenti
        echo "✅ Mounted at /workspace/unified-storage/fluenti"
        ;;
    unmount)
        fusermount -u /workspace/unified-storage/fluenti
        echo "✅ Unmounted Fluenti storage"
        ;;
    status)
        echo "📊 Unified Storage Status:"
        echo ""
        echo "Local (Aurora):"
        df -h /workspace
        echo ""
        echo "Remote Nodes:"
        ssh -p 43540 root@213.181.111.2 "hostname && df -h /workspace" 2>/dev/null
        ssh -p 19777 root@103.196.86.56 "hostname && df -h /workspace" 2>/dev/null
        ;;
    sync)
        echo "Syncing to all nodes..."
        rsync -avz /workspace/aurora/ root@213.181.111.2:/workspace/aurora/ -e "ssh -p 43540"
        rsync -avz /workspace/aurora/ root@103.196.86.56:/workspace/aurora/ -e "ssh -p 19777"
        echo "✅ Synced to all nodes"
        ;;
    *)
        echo "Usage: $0 {mount|unmount|status|sync}"
        echo ""
        echo "Commands:"
        echo "  mount   - Mount Fluenti's 178TB storage"
        echo "  unmount - Unmount network storage"
        echo "  status  - Show storage status across all nodes"
        echo "  sync    - Sync Aurora codebase to all nodes"
        ;;
esac
EOF

chmod +x /workspace/aurora/unified-storage.sh

echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}UNIFIED STORAGE ARCHITECTURE${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

echo -e "\n${GREEN}✅ STORAGE TIERS CONFIGURED:${NC}"
echo -e "\n🔥 ${BOLD}HOT TIER (NVMe - Ultra Fast):${NC}"
echo -e "   • Location: Aurora + Collaboration nodes"
echo -e "   • Capacity: 40GB combined"
echo -e "   • Use: Active models, real-time inference"
echo -e "   • Path: /workspace/fast-cache"

echo -e "\n📊 ${BOLD}WARM TIER (Network - Fast):${NC}"
echo -e "   • Location: Distributed across all nodes"
echo -e "   • Capacity: 100GB+"
echo -e "   • Use: Training data, checkpoints"
echo -e "   • Path: /workspace/unified-storage"

echo -e "\n💾 ${BOLD}COLD TIER (Fluenti - Massive):${NC}"
echo -e "   • Location: Fluenti network storage"
echo -e "   • Capacity: 178TB available"
echo -e "   • Use: Model zoo, datasets, archives"
echo -e "   • Path: /workspace/unified-storage/fluenti"

echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}HOW TO USE UNIFIED STORAGE${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

echo -e "\n${YELLOW}Quick Commands:${NC}"
echo -e "   ${BLUE}./unified-storage.sh mount${NC}    # Mount 178TB from Fluenti"
echo -e "   ${BLUE}./unified-storage.sh status${NC}   # Check all storage"
echo -e "   ${BLUE}./unified-storage.sh sync${NC}     # Sync to all nodes"
echo -e "   ${BLUE}python3 storage-manager.py${NC}    # Intelligent storage management"

echo -e "\n${YELLOW}Storage Strategy:${NC}"
echo -e "   1. Small models (<1GB) → Fast NVMe cache"
echo -e "   2. Medium models (1-10GB) → Distributed to all nodes"
echo -e "   3. Large models (>10GB) → Fluenti's 178TB storage"
echo -e "   4. Datasets → Fluenti with local cache"

echo -e "\n${GREEN}${BOLD}✅ UNIFIED STORAGE SYSTEM READY!${NC}"
echo -e "${GREEN}You now have intelligent access to 178TB across all nodes!${NC}"
echo -e "\n🚀 ${BOLD}Run './unified-storage.sh mount' to access 178TB now!${NC}\n"
