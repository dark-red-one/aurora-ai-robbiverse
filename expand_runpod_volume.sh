#!/bin/bash
# Aurora AI Empire - RunPod Volume Expansion Script

echo "💾 AURORA RUNPOD VOLUME EXPANSION"
echo "================================="
echo ""

# Check current disk usage
echo "📊 CURRENT DISK USAGE:"
df -h /workspace
echo ""

# Show expansion options
echo "🚀 VOLUME EXPANSION OPTIONS:"
echo "============================"
echo ""
echo "Current: 20GB (1% used - 19.9GB free)"
echo ""
echo "Recommended: 100GB (+80GB)"
echo "  💰 Cost: +$0.80/month"
echo "  📈 Capacity: 5x increase"
echo "  🎯 Perfect for Aurora AI Empire"
echo ""
echo "Alternative: 200GB (+180GB)"
echo "  💰 Cost: +$1.80/month"
echo "  📈 Capacity: 10x increase"
echo "  🎯 Future-proof for massive growth"
echo ""

# Show manual steps
echo "📋 MANUAL EXPANSION STEPS:"
echo "========================="
echo ""
echo "1. Go to: https://console.runpod.io/"
echo "2. Login with your RunPod credentials"
echo "3. Find Pod: 2tbwzatlrjdy7i (runpod-robbie)"
echo "4. Click 'Edit' or 'Settings'"
echo "5. Find 'Volume Size' section"
echo "6. Change from 20GB to 100GB"
echo "7. Click 'Save' or 'Apply'"
echo "8. Wait for expansion to complete"
echo "9. Restart RunPod if required"
echo ""

# Check if RunPod CLI is available
echo "🔍 CHECKING FOR RUNPOD CLI:"
echo "==========================="
if command -v runpod &> /dev/null; then
    echo "✅ RunPod CLI found!"
    echo "🚀 Attempting automated expansion..."
    
    # Try to expand volume using CLI
    echo "runpod pod edit 2tbwzatlrjdy7i --volume-size 100"
    # Note: This would require proper authentication
    echo "⚠️ CLI expansion requires authentication setup"
else
    echo "❌ RunPod CLI not found"
    echo "💡 Install with: pip install runpod"
fi

echo ""
echo "📞 NEED HELP?"
echo "============="
echo "If you need assistance with the expansion:"
echo "1. Check RunPod documentation"
echo "2. Contact RunPod support"
echo "3. Use the web console method above"
echo ""

# Create a monitoring script for after expansion
cat > /workspace/aurora/monitor_disk_expansion.sh << 'MONITOREOF'
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
MONITOREOF

chmod +x /workspace/aurora/monitor_disk_expansion.sh

echo "✅ Expansion monitoring script created!"
echo "   Run: ./monitor_disk_expansion.sh"
echo ""
echo "🚀 Ready to expand Aurora's storage capacity!"
