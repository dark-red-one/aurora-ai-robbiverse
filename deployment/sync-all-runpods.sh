#!/bin/bash
# SYNC ALL 3 RUNPODS - Aurora AI Empire Network Sync
# Aurora = Authority, Collaboration + Fluenti = Backups

echo "🌐 AURORA 3-RUNPOD SYNC INITIATED"
echo "================================="
echo "Authority: Aurora (where we are now)"
echo "Backup 1: Collaboration pod" 
echo "Backup 2: Fluenti pod"
echo ""

# Pod connection details
COLLABORATION_HOST="213.181.111.2"
COLLABORATION_PORT="43540"
FLUENTI_HOST="103.196.86.56"
FLUENTI_PORT="19777"

# Function to test SSH connection
test_connection() {
    local host=$1
    local port=$2
    local name=$3
    
    echo "🔍 Testing connection to $name..."
    if timeout 10 ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no root@$host -p $port "echo 'Connected to $name!'" 2>/dev/null; then
        echo "✅ $name: Connected successfully"
        return 0
    else
        echo "❌ $name: Connection failed"
        return 1
    fi
}

# Function to get pod info
get_pod_info() {
    local host=$1
    local port=$2
    local name=$3
    
    echo "📊 Getting $name pod information..."
    ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no root@$host -p $port << 'EOF'
echo "Hostname: $(hostname)"
echo "GPU Info:"
nvidia-smi --query-gpu=name,memory.total --format=csv,noheader 2>/dev/null || echo "No GPU info available"
echo "Disk Space:"
df -h /workspace 2>/dev/null || echo "No /workspace directory"
echo "Current Aurora Status:"
ls -la /workspace/aurora 2>/dev/null || echo "No Aurora directory found"
EOF
}

# Function to sync Aurora to a pod
sync_to_pod() {
    local host=$1
    local port=$2
    local name=$3
    
    echo "🔄 Syncing Aurora to $name pod..."
    
    # First, ensure workspace directory exists
    ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no root@$host -p $port "mkdir -p /workspace"
    
    # Sync Aurora directory
    if rsync -avz --delete -e "ssh -p $port -o ConnectTimeout=5 -o StrictHostKeyChecking=no" /workspace/aurora/ root@$host:/workspace/aurora/; then
        echo "✅ $name: Aurora sync successful"
        
        # Verify sync
        echo "🔍 Verifying sync to $name..."
        ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no root@$host -p $port << 'EOF'
cd /workspace/aurora
echo "Files synced: $(find . -type f | wc -l)"
echo "Key files present:"
ls -la src/allanBotTraining.js 2>/dev/null && echo "  ✅ AllanBot training system"
ls -la INFRASTRUCTURE_STATUS_REPORT.md 2>/dev/null && echo "  ✅ Infrastructure docs"
ls -la META_CREATION_MANIFESTO.md 2>/dev/null && echo "  ✅ Meta-creation manifesto"
ls -la package.json 2>/dev/null && echo "  ✅ Node.js config"
EOF
        return 0
    else
        echo "❌ $name: Aurora sync failed"
        return 1
    fi
}

# Main sync process
echo "🎯 STEP 1: Testing all pod connections"
echo "======================================"

collaboration_online=0
fluenti_online=0

if test_connection $COLLABORATION_HOST $COLLABORATION_PORT "Collaboration"; then
    collaboration_online=1
fi

if test_connection $FLUENTI_HOST $FLUENTI_PORT "Fluenti"; then
    fluenti_online=1
fi

echo ""
echo "🎯 STEP 2: Gathering pod information"
echo "===================================="

if [ $collaboration_online -eq 1 ]; then
    echo ""
    echo "🤝 COLLABORATION POD INFO:"
    echo "-------------------------"
    get_pod_info $COLLABORATION_HOST $COLLABORATION_PORT "Collaboration"
fi

if [ $fluenti_online -eq 1 ]; then
    echo ""
    echo "📈 FLUENTI POD INFO:"
    echo "-------------------"
    get_pod_info $FLUENTI_HOST $FLUENTI_PORT "Fluenti"
fi

echo ""
echo "🎯 STEP 3: Syncing Aurora to backup pods"
echo "========================================"

sync_success=0

if [ $collaboration_online -eq 1 ]; then
    echo ""
    if sync_to_pod $COLLABORATION_HOST $COLLABORATION_PORT "Collaboration"; then
        ((sync_success++))
    fi
fi

if [ $fluenti_online -eq 1 ]; then
    echo ""
    if sync_to_pod $FLUENTI_HOST $FLUENTI_PORT "Fluenti"; then
        ((sync_success++))
    fi
fi

echo ""
echo "🎯 SYNC RESULTS"
echo "==============="
echo "Aurora Authority: ✅ $(hostname) (this machine)"
echo "Collaboration Pod: $([ $collaboration_online -eq 1 ] && echo "✅ Online & Synced" || echo "❌ Offline")"
echo "Fluenti Pod: $([ $fluenti_online -eq 1 ] && echo "✅ Online & Synced" || echo "❌ Offline")"
echo ""
echo "Total pods synced: $sync_success/2"

if [ $sync_success -eq 2 ]; then
    echo "🎉 ALL RUNPODS SYNCHRONIZED!"
    echo "Aurora AI Empire network is fully operational!"
elif [ $sync_success -gt 0 ]; then
    echo "⚠️  PARTIAL SUCCESS"
    echo "Some pods synced, others need attention"
else
    echo "❌ SYNC FAILED"
    echo "Need to investigate connection issues"
fi

echo ""
echo "🚀 Next steps:"
echo "- Set up automated daily sync"
echo "- Configure health monitoring"  
echo "- Test AllanBot training across pods"
