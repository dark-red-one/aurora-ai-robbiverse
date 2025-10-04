#!/bin/bash
# RunPod Storage Expansion & Management Script
# Prevents drive crashes and manages expandable storage

GREEN='\033[38;2;59;182;126m'
YELLOW='\033[1;33m' 
RED='\033[1;31m'
NC='\033[0m'

echo -e "${GREEN}💾 RUNPOD STORAGE EXPANSION SYSTEM${NC}"
echo "=================================="
echo ""

# Check current storage situation
check_current_storage() {
    echo -e "${YELLOW}📊 Current Storage Analysis:${NC}"
    echo ""
    
    # Show disk usage
    echo "Current disk usage:"
    df -h
    echo ""
    
    # Show large directories
    echo "Largest directories:"
    du -sh /* 2>/dev/null | sort -hr | head -10
    echo ""
    
    # Calculate usage percentage
    local usage_percent=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [ "$usage_percent" -gt 80 ]; then
        echo -e "${RED}⚠️ Storage is ${usage_percent}% full - expansion recommended!${NC}"
        return 1
    else
        echo -e "${GREEN}✅ Storage is ${usage_percent}% full - currently healthy${NC}"
        return 0
    fi
}

# Explain RunPod storage options
explain_runpod_storage() {
    echo -e "${GREEN}🎯 RUNPOD STORAGE OPTIONS (The Good News!)${NC}"
    echo "=========================================="
    echo ""
    echo -e "${GREEN}✅ YES - RunPod storage is expandable!${NC}"
    echo ""
    echo "📁 Container Storage (Current):"
    echo "  • What you have: 40-50GB container disk"
    echo "  • Purpose: OS, software, temporary files"
    echo "  • Limitation: Gets wiped when pod restarts"
    echo ""
    echo "💾 Network Volumes (Expandable!):"
    echo "  • Purpose: Persistent data storage"
    echo "  • Size: 10GB to 1TB+ (you choose!)"
    echo "  • Cost: ~$0.10/GB/month"
    echo "  • Persistence: Survives pod restarts"
    echo "  • Expansion: Instant via RunPod console"
    echo ""
    echo "🚀 Recommended Setup for Aurora:"
    echo "  • 200GB Network Volume = $20/month"
    echo "  • 500GB Network Volume = $50/month" 
    echo "  • 1TB Network Volume = $100/month"
    echo ""
    echo -e "${GREEN}💡 Best Practice:${NC}"
    echo "  1. Keep code and databases on Network Volume"
    echo "  2. Use container disk for cache and temp files"
    echo "  3. Set up automatic cleanup (this script does it!)"
    echo ""
}

# Set up network volume
setup_network_volume() {
    echo -e "${BLUE}📁 Setting up Network Volume...${NC}"
    echo ""
    
    # Check if network volume is already mounted
    if mountpoint -q /workspace/aurora-data 2>/dev/null; then
        echo -e "${GREEN}✅ Network volume already mounted at /workspace/aurora-data${NC}"
        df -h /workspace/aurora-data
    else
        echo -e "${YELLOW}⚠️ No network volume detected${NC}"
        echo ""
        echo "To add a network volume:"
        echo "1. Go to your RunPod console"
        echo "2. Click 'Edit' on your pod"
        echo "3. Add 'Network Volume' (recommend 200GB minimum)"
        echo "4. Mount path: /workspace/aurora-data"
        echo "5. Restart pod"
        echo ""
        echo "Cost: ~$20/month for 200GB (expandable anytime!)"
        return 1
    fi
}

# Move critical data to network volume
migrate_to_network_volume() {
    local network_volume="/workspace/aurora-data"
    
    if [ ! -d "$network_volume" ]; then
        echo -e "${RED}❌ Network volume not found. Set up network volume first.${NC}"
        return 1
    fi
    
    echo -e "${BLUE}🔄 Migrating critical data to network volume...${NC}"
    echo ""
    
    # Create directory structure on network volume
    mkdir -p "$network_volume"/{database,logs,uploads,models,backups}
    
    # Move databases
    if [ -d "/app/data" ]; then
        echo "  📊 Moving database files..."
        mv /app/data/* "$network_volume/database/" 2>/dev/null || true
        ln -sf "$network_volume/database" /app/data
    fi
    
    # Move logs  
    if [ -d "/app/logs" ]; then
        echo "  📋 Moving log files..."
        mv /app/logs/* "$network_volume/logs/" 2>/dev/null || true
        ln -sf "$network_volume/logs" /app/logs
    fi
    
    # Move models (AI models can be huge!)
    if [ -d "/app/models" ]; then
        echo "  🤖 Moving AI models..."
        mv /app/models/* "$network_volume/models/" 2>/dev/null || true
        ln -sf "$network_volume/models" /app/models
    fi
    
    echo -e "${GREEN}✅ Critical data migrated to persistent storage${NC}"
}

# Set up automatic cleanup
setup_auto_cleanup() {
    echo -e "${BLUE}🧹 Setting up automatic cleanup...${NC}"
    
    # Create cleanup cron job
    cat > /tmp/aurora-cleanup.sh << 'EOF'
#!/bin/bash
# Aurora Storage Cleanup - Runs every hour

# Clean temporary files older than 1 day
find /tmp -type f -mtime +1 -delete 2>/dev/null || true

# Clean Docker logs older than 7 days  
docker system prune -f --filter "until=168h" 2>/dev/null || true

# Clean application logs older than 30 days
find /app/logs -name "*.log" -mtime +30 -delete 2>/dev/null || true

# Clean npm cache
npm cache clean --force 2>/dev/null || true

# Log cleanup activity
echo "$(date): Aurora cleanup completed" >> /workspace/aurora-data/cleanup.log
EOF
    
    chmod +x /tmp/aurora-cleanup.sh
    
    # Install cron job
    (crontab -l 2>/dev/null; echo "0 * * * * /tmp/aurora-cleanup.sh") | crontab -
    
    echo -e "${GREEN}✅ Automatic cleanup scheduled (hourly)${NC}"
}

# Monitor storage in real-time
monitor_storage() {
    echo -e "${BLUE}📊 Starting real-time storage monitoring...${NC}"
    echo "Press Ctrl+C to stop"
    echo ""
    
    while true; do
        clear
        echo -e "${GREEN}🔍 AURORA STORAGE MONITOR${NC}"
        echo "========================"
        echo ""
        
        # Container storage
        echo "Container Storage:"
        df -h / | tail -n +2
        echo ""
        
        # Network volume (if available)
        if mountpoint -q /workspace/aurora-data 2>/dev/null; then
            echo "Network Volume:"
            df -h /workspace/aurora-data | tail -n +2
            echo ""
        fi
        
        # Large files/directories
        echo "Top 5 largest directories in /app:"
        du -sh /app/* 2>/dev/null | sort -hr | head -5
        echo ""
        
        # Docker usage
        echo "Docker storage usage:"
        docker system df 2>/dev/null || echo "Docker not available"
        echo ""
        
        echo "$(date) - Monitoring... (Ctrl+C to exit)"
        sleep 30
    done
}

# Main function
main() {
    case "${1:-}" in
        --storage-only)
            explain_runpod_storage
            check_current_storage
            setup_network_volume
            ;;
        --monitor)
            monitor_storage
            ;;
        --deploy)
            if check_current_storage; then
                deploy_all_nodes
            else
                echo -e "${YELLOW}💡 Consider expanding storage before deployment${NC}"
                read -p "Continue anyway? (y/N): " -n 1 -r
                echo ""
                if [[ $REPLY =~ ^[Yy]$ ]]; then
                    deploy_all_nodes
                fi
            fi
            ;;
        *)
            explain_runpod_storage
            check_current_storage
            echo ""
            echo -e "${YELLOW}Commands:${NC}"
            echo "  $0 --storage-only   # Just storage setup"
            echo "  $0 --deploy         # Full deployment to all nodes"
            echo "  $0 --monitor        # Real-time storage monitoring"
            ;;
    esac
}

main "$@"
