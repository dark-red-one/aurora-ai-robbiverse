#!/bin/bash
# Install GPU Mesh as systemd service

echo "📦 Installing GPU Mesh Keepalive as systemd service..."

# Copy service file
sudo cp gpu-keepalive.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable service
sudo systemctl enable gpu-keepalive.service

echo "✅ Service installed!"
echo ""
echo "Commands:"
echo "  Start:   sudo systemctl start gpu-keepalive"
echo "  Stop:    sudo systemctl stop gpu-keepalive"
echo "  Status:  sudo systemctl status gpu-keepalive"
echo "  Logs:    sudo journalctl -u gpu-keepalive -f"
