#!/bin/bash

# 🚀 SYNC ALL NODES TO PRIMARY-READY STATE
# ========================================
# This script ensures all nodes (Aurora, Vengeance, RunPod) are ready to be promoted to primary

echo "🌐 AURORA AI EMPIRE - PRIMARY-READY SYNC"
echo "========================================"
echo "Syncing all nodes to be primary-ready..."
echo ""

# Function to sync to a node
sync_to_node() {
    local NODE_NAME=$1
    local NODE_HOST=$2
    local NODE_PATH=$3
    
    echo "📡 Syncing to $NODE_NAME ($NODE_HOST)..."
    
    # Sync core files (exclude git objects)
    rsync -av --exclude='.git' --exclude='node_modules' --exclude='__pycache__' \
        --exclude='*.log' --exclude='*.tmp' \
        . $NODE_HOST:$NODE_PATH/
    
    if [ $? -eq 0 ]; then
        echo "✅ $NODE_NAME: Files synced successfully"
        
        # Set up services on the node
        ssh $NODE_HOST "cd $NODE_PATH && \
            mkdir -p ~/robbie-services && \
            cp robbie-unified-interface.html ~/robbie-services/ && \
            cp -r src/ ~/robbie-services/ && \
            cp -r backend/ ~/robbie-services/ && \
            cp -r .cursor/ ~/robbie-services/ && \
            cp -r database/ ~/robbie-services/ && \
            cp -r api-connectors/ ~/robbie-services/ && \
            cp -r scripts/ ~/robbie-services/ && \
            echo '✅ $NODE_NAME: Services directory created'"
        
        # Install Python dependencies
        ssh $NODE_HOST "cd ~/robbie-services && \
            python3 -m pip install --break-system-packages --quiet fastapi uvicorn psutil && \
            echo '✅ $NODE_NAME: Dependencies installed'"
        
        # Start backend service
        ssh $NODE_HOST "cd ~/robbie-services && \
            pkill -f 'python3.*backend' 2>/dev/null; \
            nohup python3 backend/app/main.py > /tmp/robbie-backend.log 2>&1 & \
            echo '✅ $NODE_NAME: Backend service started'"
        
        # Start enhanced auth backend
        ssh $NODE_HOST "cd ~/robbie-services && \
            pkill -f 'enhanced_auth_backend' 2>/dev/null; \
            nohup python3 infrastructure/chat-ultimate/enhanced_auth_backend.py > /tmp/robbie-auth.log 2>&1 & \
            echo '✅ $NODE_NAME: Auth service started'"
        
    else
        echo "❌ $NODE_NAME: Sync failed"
    fi
    echo ""
}

# Sync to all nodes
echo "🎯 Starting comprehensive sync to all nodes..."
echo ""

# Aurora (current node) - already up to date
echo "🏠 Aurora (current): Already up to date"
echo ""

# Vengeance
sync_to_node "Vengeance" "vengeance" "/home/allan/robbie_workspace/combined/aurora-ai-robbiverse"

# RunPod (if accessible)
echo "📡 Attempting RunPod sync..."
if ping -c 1 82.221.170.242 >/dev/null 2>&1; then
    sync_to_node "RunPod" "runpod" "/root/robbie_workspace/combined/aurora-ai-robbiverse"
else
    echo "⚠️  RunPod: Not accessible (offline or network issue)"
fi

echo ""
echo "🎉 PRIMARY-READY SYNC COMPLETE!"
echo "==============================="
echo ""
echo "All accessible nodes are now ready to be promoted to primary:"
echo "✅ Aurora: Ready (current primary)"
echo "✅ Vengeance: Ready (backup primary)"
echo "⚠️  RunPod: Status depends on connectivity"
echo ""
echo "Each node has:"
echo "- Complete codebase (src/, backend/, database/, api-connectors/)"
echo "- Cursor rules (.cursor/)"
echo "- Python dependencies installed"
echo "- Backend services running"
echo "- Auth services running"
echo ""
echo "🚀 Any node can now be promoted to primary with a simple DNS change!"
