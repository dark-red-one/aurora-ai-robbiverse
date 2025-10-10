#!/bin/bash
# 🚀 Aurora AI Empire Deployment Script
# Deploys to RunPod nodes with proper error handling

set -e

NODE_TYPE=${1:-"aurora"}

echo "🚀 Deploying Aurora AI Empire to $NODE_TYPE..."

# Function to deploy to a specific node
deploy_to_node() {
    local node_name=$1
    local host=$2
    local port=$3
    local ssh_key=$4
    
    echo "📡 Connecting to $node_name ($host:$port)..."
    
    # Create temporary SSH key file
    echo "$ssh_key" > /tmp/${node_name}_key
    chmod 600 /tmp/${node_name}_key
    
    # Test connection
    if ssh -i /tmp/${node_name}_key -p $port -o StrictHostKeyChecking=no -o ConnectTimeout=10 root@$host "echo 'Connection successful'"; then
        echo "✅ Connected to $node_name"
        
        # Deploy application
        echo "📦 Deploying application to $node_name..."
        ssh -i /tmp/${node_name}_key -p $port -o StrictHostKeyChecking=no root@$host << 'EOF'
            # Update system
            apt-get update -y
            
            # Install Docker if not present
            if ! command -v docker &> /dev/null; then
                curl -fsSL https://get.docker.com -o get-docker.sh
                sh get-docker.sh
            fi
            
            # Create application directory
            mkdir -p /opt/aurora-ai
            
            # Pull latest image (if available)
            docker pull ghcr.io/dark-red-one/aurora-ai-robbiverse:latest || echo "No image available yet"
            
            # Start application
            docker run -d --name aurora-ai \
                -p 8000:8000 \
                -e NODE_ENV=production \
                ghcr.io/dark-red-one/aurora-ai-robbiverse:latest || echo "Using local build"
            
            echo "✅ Aurora AI deployed on $node_name"
        EOF
        
        echo "🎉 Successfully deployed to $node_name"
    else
        echo "❌ Failed to connect to $node_name"
        return 1
    fi
    
    # Clean up
    rm -f /tmp/${node_name}_key
}

# Deploy based on node type
case $NODE_TYPE in
    "aurora")
        echo "🚀 Deploying to Aurora RunPod (Primary)..."
        # Note: These would be actual secrets in GitHub
        deploy_to_node "aurora" "82.221.170.242" "24505" "$RUNPOD_AURORA_SSH_KEY"
        ;;
    "collaboration")
        echo "🚀 Deploying to Collaboration RunPod..."
        deploy_to_node "collaboration" "213.181.111.2" "43540" "$RUNPOD_COLLABORATION_SSH_KEY"
        ;;
    "fluenti")
        echo "🚀 Deploying to Fluenti RunPod..."
        deploy_to_node "fluenti" "103.196.86.56" "19777" "$RUNPOD_FLUENTI_SSH_KEY"
        ;;
    *)
        echo "❌ Unknown node type: $NODE_TYPE"
        echo "Usage: $0 [aurora|collaboration|fluenti]"
        exit 1
        ;;
esac

echo "🎉 Aurora AI Empire deployment completed!"
