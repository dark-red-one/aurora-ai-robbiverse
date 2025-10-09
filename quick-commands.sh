#!/bin/bash
# Quick Commands for GPU Mesh

# Add these to your ~/.bashrc:
# source ~/robbie_workspace/combined/aurora-ai-robbiverse/quick-commands.sh

alias gpu-status='bash ~/robbie_workspace/combined/aurora-ai-robbiverse/cursor-gpu-power-status.sh'
alias gpu-restart='bash ~/robbie_workspace/combined/aurora-ai-robbiverse/start-cursor-proxy.sh'
alias gpu-logs='tail -f /tmp/cursor-proxy.log'
alias gpu-test='curl http://localhost:11435/api/tags'

# Quick status function
gpu() {
    case "$1" in
        status)
            bash ~/robbie_workspace/combined/aurora-ai-robbiverse/cursor-gpu-power-status.sh
            ;;
        restart)
            bash ~/robbie_workspace/combined/aurora-ai-robbiverse/start-cursor-proxy.sh
            ;;
        logs)
            tail -f /tmp/cursor-proxy.log
            ;;
        test)
            curl http://localhost:11435/api/tags
            ;;
        *)
            echo "GPU Mesh Quick Commands:"
            echo "  gpu status   - Show power status"
            echo "  gpu restart  - Restart proxy"
            echo "  gpu logs     - View live logs"
            echo "  gpu test     - Test connection"
            ;;
    esac
}

echo "✅ GPU Quick Commands loaded. Type 'gpu' for help."







