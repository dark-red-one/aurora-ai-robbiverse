#!/bin/bash
# Install Aurora GPU Mesh as systemd user service

set -e

echo "🚀 Installing Aurora GPU Mesh Service"
echo "======================================"
echo ""

SERVICE_FILE="aurora-gpu-mesh.service"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Ensure user systemd directory exists
mkdir -p ~/.config/systemd/user/

# Copy service file
echo "📋 Installing service file..."
cp "$SCRIPT_DIR/$SERVICE_FILE" ~/.config/systemd/user/

# Reload systemd
echo "🔄 Reloading systemd..."
systemctl --user daemon-reload

# Enable service (auto-start)
echo "✅ Enabling service..."
systemctl --user enable aurora-gpu-mesh

# Start service
echo "🚀 Starting service..."
systemctl --user start aurora-gpu-mesh

# Wait a moment
sleep 2

# Check status
echo ""
echo "📊 Service Status:"
systemctl --user status aurora-gpu-mesh --no-pager || true

echo ""
echo "======================================"
echo "✅ Installation complete!"
echo ""
echo "Useful commands:"
echo "  Status:  systemctl --user status aurora-gpu-mesh"
echo "  Logs:    journalctl --user -u aurora-gpu-mesh -f"
echo "  Stop:    systemctl --user stop aurora-gpu-mesh"
echo "  Start:   systemctl --user start aurora-gpu-mesh"
echo "  Restart: systemctl --user restart aurora-gpu-mesh"
echo "  Disable: systemctl --user disable aurora-gpu-mesh"
echo ""
echo "Quick check: bash check-mesh-status.sh"
echo "======================================"

