#!/bin/bash
# Automatic failover if Aurora goes down

echo "🔄 Checking Aurora status..."

# Check if Aurora is responding
if ! curl -f http://localhost:8000/health >/dev/null 2>&1; then
    echo "❌ Aurora not responding - initiating failover..."
    
    # Promote this node to Aurora
    ./promotion/promote-to-aurora.sh
    
    # Notify other nodes
    echo "📢 Notifying other nodes of Aurora promotion..."
    # This would notify other RunPods in a real implementation
    
    echo "✅ Failover complete - this node is now Aurora"
else
    echo "✅ Aurora is healthy"
fi
