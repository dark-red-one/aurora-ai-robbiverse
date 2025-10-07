#!/bin/bash
"""
Robust Tunnel Persistence for Dual RTX 4090
Better keepalive and monitoring
"""

# Function to start tunnel with robust settings
start_tunnel() {
    local port=$1
    local name=$2
    
    echo "🔧 Starting $name tunnel on port $port..."
    ssh -i ~/.ssh/id_ed25519 -p 13323 \
        -L $port:localhost:80 \
        -o ServerAliveInterval=30 \
        -o ServerAliveCountMax=6 \
        -o TCPKeepAlive=yes \
        -o ExitOnForwardFailure=yes \
        -o StrictHostKeyChecking=no \
        -o UserKnownHostsFile=/dev/null \
        -o LogLevel=ERROR \
        root@209.170.80.132 "echo '$name SSH tunnel established' && sleep 10" &
    
    sleep 3
}

# Function to check tunnel health
check_tunnel() {
    local port=$1
    local name=$2
    
    if curl -s --connect-timeout 5 http://localhost:$port/api/tags > /dev/null 2>&1; then
        echo "✅ $name tunnel healthy"
        return 0
    else
        echo "❌ $name tunnel unhealthy"
        return 1
    fi
}

# Main loop
while true; do
    echo "🔧 Checking tunnel health..."
    
    # Check Vengeance 4090
    if ! check_tunnel 8080 "Vengeance 4090"; then
        echo "🔧 Restarting Vengeance 4090 tunnel..."
        pkill -f "ssh.*8080"
        sleep 2
        start_tunnel 8080 "Vengeance 4090"
    fi
    
    # Check RunPod 4090
    if ! check_tunnel 8081 "RunPod 4090"; then
        echo "🔧 Restarting RunPod 4090 tunnel..."
        pkill -f "ssh.*8081"
        sleep 2
        start_tunnel 8081 "RunPod 4090"
    fi
    
    echo "🔧 Waiting 15 seconds before next check..."
    sleep 15
done
