#!/bin/bash
# Monitor disk expansion progress

echo "📊 MONITORING DISK EXPANSION..."
echo "==============================="

while true; do
    echo "$(date): Checking disk usage..."
    df -h /workspace | tail -1
    
    # Check if expansion is complete (100GB+)
    current_size=$(df /workspace | tail -1 | awk '{print $2}' | sed 's/G//')
    if [ "$current_size" -gt 50 ]; then
        echo "🎉 DISK EXPANSION COMPLETE!"
        echo "   New size: ${current_size}GB"
        break
    fi
    
    echo "⏳ Still waiting for expansion..."
    sleep 30
done
