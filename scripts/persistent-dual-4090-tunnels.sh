#!/bin/bash
"""
Persistent Dual RTX 4090 SSH Tunnels
Keeps tunnels alive with keepalive settings
"""

# Kill existing tunnels
echo "🔧 Killing existing tunnels..."
pkill -f "ssh.*808[01]"
sleep 2

# Vengeance 4090 tunnel with keepalive
echo "🔧 Starting Vengeance 4090 SSH tunnel with keepalive..."
ssh -i ~/.ssh/id_ed25519 -p 13323 -L 8080:localhost:80 \
    -o ServerAliveInterval=60 \
    -o ServerAliveCountMax=3 \
    -o TCPKeepAlive=yes \
    -o ExitOnForwardFailure=yes \
    root@209.170.80.132 "echo 'Vengeance 4090 SSH tunnel established' && sleep 10" &

# RunPod 4090 tunnel with keepalive  
echo "🔧 Starting RunPod 4090 SSH tunnel with keepalive..."
ssh -i ~/.ssh/id_ed25519 -p 13323 -L 8081:localhost:80 \
    -o ServerAliveInterval=60 \
    -o ServerAliveCountMax=3 \
    -o TCPKeepAlive=yes \
    -o ExitOnForwardFailure=yes \
    root@209.170.80.132 "echo 'RunPod 4090 SSH tunnel established' && sleep 10" &

echo "✅ Persistent SSH tunnels started!"
echo "• Vengeance 4090: localhost:8080"
echo "• RunPod 4090: localhost:8081"
echo "• Keepalive: 60s interval, 3 retries"
echo "• TCP KeepAlive: Enabled"
