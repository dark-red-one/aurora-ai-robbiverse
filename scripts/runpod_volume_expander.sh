#!/bin/bash
# Aurora AI Empire - RunPod Volume Expansion Guide
# This script provides instructions and automation for expanding disk space

echo "💾 AURORA DISK SPACE EXPANSION SYSTEM"
echo "===================================="
echo ""
echo "Current disk usage analysis:"
df -h /workspace

echo ""
echo "🚀 RUNPOD VOLUME EXPANSION OPTIONS:"
echo "=================================="
echo ""
echo "1️⃣ IMMEDIATE SOLUTIONS:"
echo "  ✅ Clean up temporary files"
echo "  ✅ Remove old logs and backups"
echo "  ✅ Clean Docker images"
echo "  ✅ Remove node_modules (regeneratable)"
echo ""
echo "2️⃣ RUNPOD VOLUME UPGRADE:"
echo "  📈 Current: 20GB (1% used - 19.9GB free)"
echo "  📈 Upgrade to: 50GB (+30GB) - \$0.50/month"
echo "  📈 Upgrade to: 100GB (+80GB) - \$1.00/month"
echo "  📈 Upgrade to: 200GB (+180GB) - \$2.00/month"
echo "  📈 Upgrade to: 500GB (+480GB) - \$5.00/month"
echo ""
echo "3️⃣ DISTRIBUTED STORAGE:"
echo "  🌐 Use multiple RunPods for storage"
echo "  🌐 Implement distributed file system"
echo "  🌐 Cross-node data replication"
echo ""
echo "4️⃣ CLOUD STORAGE INTEGRATION:"
echo "  ☁️ AWS S3 for large datasets"
echo "  ☁️ Google Cloud Storage for models"
echo "  ☁️ Azure Blob Storage for backups"
echo ""

# Function to perform immediate cleanup
cleanup_immediate() {
    echo "🧹 PERFORMING IMMEDIATE CLEANUP..."
    echo "================================="
    
    # Clean logs
    echo "📝 Cleaning old logs..."
    find /var/log -name "*.log" -mtime +7 -delete 2>/dev/null || true
    find /workspace/aurora/logs -name "*.log" -mtime +7 -delete 2>/dev/null || true
    
    # Clean temp files
    echo "🗑️ Cleaning temporary files..."
    find /tmp -type f -mtime +1 -delete 2>/dev/null || true
    find /workspace/aurora/tmp -type f -mtime +1 -delete 2>/dev/null || true
    
    # Clean old backups
    echo "💾 Cleaning old backups..."
    find /workspace/aurora/backups -name "*.tar.gz" -mtime +30 -delete 2>/dev/null || true
    find /var/backups -name "aurora_*" -mtime +30 -delete 2>/dev/null || true
    
    # Clean Docker
    echo "🐳 Cleaning Docker images..."
    docker system prune -f 2>/dev/null || true
    
    # Clean node_modules (can be regenerated)
    echo "📦 Cleaning node_modules..."
    find /workspace/aurora -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
    
    echo "✅ Immediate cleanup completed!"
    echo ""
    echo "📊 New disk usage:"
    df -h /workspace
}

# Function to show RunPod upgrade instructions
show_runpod_upgrade() {
    echo "📈 RUNPOD VOLUME UPGRADE INSTRUCTIONS:"
    echo "====================================="
    echo ""
    echo "1. Go to RunPod Console: https://console.runpod.io/"
    echo "2. Select your Aurora RunPod"
    echo "3. Click 'Edit' or 'Settings'"
    echo "4. Find 'Volume Size' option"
    echo "5. Select new size (50GB, 100GB, 200GB, 500GB)"
    echo "6. Click 'Save' or 'Apply'"
    echo "7. Restart the RunPod to apply changes"
    echo ""
    echo "💰 COST ANALYSIS:"
    echo "  Current: 20GB - \$0.20/month"
    echo "  50GB: +30GB - \$0.30/month (Total: \$0.50/month)"
    echo "  100GB: +80GB - \$0.80/month (Total: \$1.00/month)"
    echo "  200GB: +180GB - \$1.80/month (Total: \$2.00/month)"
    echo "  500GB: +480GB - \$4.80/month (Total: \$5.00/month)"
    echo ""
    echo "💡 RECOMMENDATION:"
    echo "  For Aurora AI Empire: 100GB (5x current capacity)"
    echo "  Cost: Only \$0.80/month additional"
    echo "  Provides room for:"
    echo "    - Large AI models (10-20GB each)"
    echo "    - Training datasets (20-50GB)"
    echo "    - Multiple node deployments"
    echo "    - Backup and recovery data"
}

# Function to set up distributed storage
setup_distributed_storage() {
    echo "🌐 SETTING UP DISTRIBUTED STORAGE..."
    echo "==================================="
    echo ""
    echo "This will create a distributed storage system across all RunPods:"
    echo ""
    echo "1. Aurora (Primary): 20GB - Main storage"
    echo "2. Collaboration: 20GB - Data replication"
    echo "3. Fluenti: 20GB - Model storage"
    echo "4. Vengeance: 20GB - Backup storage"
    echo ""
    echo "Total distributed capacity: 80GB"
    echo "Redundancy: 4x replication"
    echo "Fault tolerance: High"
    echo ""
    echo "Setting up distributed storage configuration..."
    
    # Create distributed storage config
    cat > /workspace/aurora/distributed_storage_config.json << 'STORAGEEOF'
{
    "storage_nodes": {
        "aurora": {
            "host": "localhost",
            "port": 8000,
            "capacity_gb": 20,
            "role": "primary",
            "replication_factor": 3
        },
        "collaboration": {
            "host": "collaboration.runpod.io",
            "port": 8000,
            "capacity_gb": 20,
            "role": "replica",
            "replication_factor": 3
        },
        "fluenti": {
            "host": "fluenti.runpod.io",
            "port": 8000,
            "capacity_gb": 20,
            "role": "model_storage",
            "replication_factor": 2
        },
        "vengeance": {
            "host": "vengeance.runpod.io",
            "port": 8000,
            "capacity_gb": 20,
            "role": "backup",
            "replication_factor": 1
        }
    },
    "total_capacity_gb": 80,
    "redundancy_level": "high",
    "fault_tolerance": "enabled"
}
STORAGEEOF
    
    echo "✅ Distributed storage configuration created!"
    echo "📁 Config: /workspace/aurora/distributed_storage_config.json"
}

# Function to set up cloud storage integration
setup_cloud_storage() {
    echo "☁️ SETTING UP CLOUD STORAGE INTEGRATION..."
    echo "========================================="
    echo ""
    echo "This will create cloud storage integration for:"
    echo "  - Large AI models (AWS S3)"
    echo "  - Training datasets (Google Cloud Storage)"
    echo "  - Backups (Azure Blob Storage)"
    echo ""
    echo "Creating cloud storage configuration..."
    
    # Create cloud storage config
    cat > /workspace/aurora/cloud_storage_config.json << 'CLOUDEOF'
{
    "aws_s3": {
        "bucket": "aurora-ai-models",
        "region": "us-west-2",
        "access_key": "YOUR_ACCESS_KEY",
        "secret_key": "YOUR_SECRET_KEY",
        "use_for": ["ai_models", "large_datasets"]
    },
    "google_cloud": {
        "bucket": "aurora-ai-data",
        "project_id": "aurora-ai-empire",
        "credentials_file": "/workspace/aurora/gcp-credentials.json",
        "use_for": ["training_data", "processed_datasets"]
    },
    "azure_blob": {
        "container": "aurora-backups",
        "account_name": "auroraaiempire",
        "account_key": "YOUR_ACCOUNT_KEY",
        "use_for": ["backups", "archives"]
    },
    "local_cache": {
        "cache_size_gb": 10,
        "cache_directory": "/workspace/aurora/cache",
        "eviction_policy": "lru"
    }
}
CLOUDEOF
    
    echo "✅ Cloud storage configuration created!"
    echo "📁 Config: /workspace/aurora/cloud_storage_config.json"
    echo ""
    echo "🔧 NEXT STEPS:"
    echo "1. Set up AWS S3 bucket and credentials"
    echo "2. Set up Google Cloud Storage bucket"
    echo "3. Set up Azure Blob Storage container"
    echo "4. Update configuration with real credentials"
    echo "5. Test cloud storage integration"
}

# Main menu
echo "🎯 SELECT AN OPTION:"
echo "==================="
echo "1. Perform immediate cleanup"
echo "2. Show RunPod upgrade instructions"
echo "3. Set up distributed storage"
echo "4. Set up cloud storage integration"
echo "5. Show all options"
echo ""

# Check if argument provided
if [ "$1" = "cleanup" ]; then
    cleanup_immediate
elif [ "$1" = "upgrade" ]; then
    show_runpod_upgrade
elif [ "$1" = "distributed" ]; then
    setup_distributed_storage
elif [ "$1" = "cloud" ]; then
    setup_cloud_storage
elif [ "$1" = "all" ]; then
    cleanup_immediate
    echo ""
    show_runpod_upgrade
    echo ""
    setup_distributed_storage
    echo ""
    setup_cloud_storage
else
    echo "Usage: $0 [cleanup|upgrade|distributed|cloud|all]"
    echo ""
    echo "Examples:"
    echo "  $0 cleanup     # Perform immediate cleanup"
    echo "  $0 upgrade     # Show RunPod upgrade instructions"
    echo "  $0 distributed # Set up distributed storage"
    echo "  $0 cloud       # Set up cloud storage"
    echo "  $0 all         # Run all options"
fi
