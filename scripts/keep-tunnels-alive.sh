#!/bin/bash
"""
Keep Dual RTX 4090 Tunnels Alive
Simple script to restart tunnels when they drop
"""

while true; do
    echo "🔧 Checking tunnel status..."
    
    # Check Vengeance 4090
    if ! curl -s http://localhost:8080/api/tags > /dev/null 2>&1; then
        echo "❌ Vengeance 4090 tunnel down, restarting..."
        pkill -f "ssh.*8080"
        sleep 2
        ssh -i ~/.ssh/id_ed25519 -p 13323 -L 8080:localhost:80 \
            -o ServerAliveInterval=60 \
            -o ServerAliveCountMax=3 \
            -o TCPKeepAlive=yes \
            root@209.170.80.132 "echo 'Vengeance 4090 SSH tunnel established' && sleep 10" &
    else
        echo "✅ Vengeance 4090 tunnel up"
    fi
    
    # Check RunPod 4090
    if ! curl -s http://localhost:8081/api/tags > /dev/null 2>&1; then
        echo "❌ RunPod 4090 tunnel down, restarting..."
        pkill -f "ssh.*8081"
        sleep 2
        ssh -i ~/.ssh/id_ed25519 -p 13323 -L 8081:localhost:80 \
            -o ServerAliveInterval=60 \
            -o ServerAliveCountMax=3 \
            -o TCPKeepAlive=yes \
            root@209.170.80.132 "echo 'RunPod 4090 SSH tunnel established' && sleep 10" &
    else
        echo "✅ RunPod 4090 tunnel up"
    fi
    
    echo "🔧 Waiting 30 seconds before next check..."
    sleep 30
done
