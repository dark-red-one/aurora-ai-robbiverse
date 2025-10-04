#!/bin/bash
set -euo pipefail

echo "🚀 DEPLOYING AURORA BUSINESS INTELLIGENCE DASHBOARD"
echo "=================================================="

# Configuration
DASHBOARD_DIR="/opt/aurora-dashboard"
VENV_DIR="$DASHBOARD_DIR/venv"
SERVICE_NAME="aurora-dashboard"
PORT=5000

# Create dashboard directory
sudo mkdir -p "$DASHBOARD_DIR"
sudo chown -R $(whoami):$(whoami) "$DASHBOARD_DIR"

# Copy dashboard files
echo "📁 Copying dashboard files..."
cp -r /opt/aurora-dev/aurora/web-dashboard/* "$DASHBOARD_DIR/"

# Create Python virtual environment
echo "🐍 Setting up Python environment..."
cd "$DASHBOARD_DIR"
python3 -m venv "$VENV_DIR"
source "$VENV_DIR/bin/activate"

# Install dependencies
echo "📦 Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Create systemd service
echo "⚙️ Creating systemd service..."
sudo tee /etc/systemd/system/${SERVICE_NAME}.service > /dev/null <<EOF
[Unit]
Description=Aurora Business Intelligence Dashboard
After=network.target

[Service]
Type=exec
User=$(whoami)
Group=$(whoami)
WorkingDirectory=$DASHBOARD_DIR
Environment=PATH=$VENV_DIR/bin
ExecStart=$VENV_DIR/bin/gunicorn --bind 0.0.0.0:$PORT --workers 2 --timeout 120 app:app
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

# Configure firewall
echo "🔥 Configuring firewall..."
sudo ufw allow $PORT/tcp

# Start and enable service
echo "🚀 Starting dashboard service..."
sudo systemctl daemon-reload
sudo systemctl enable $SERVICE_NAME
sudo systemctl start $SERVICE_NAME

# Check status
echo "📊 Service status:"
sudo systemctl status $SERVICE_NAME --no-pager

echo ""
echo "✅ Aurora Dashboard deployed successfully!"
echo "🌐 Access at: http://$(curl -s ifconfig.me):$PORT"
echo "📊 Local access: http://localhost:$PORT"
echo ""
echo "🔧 Management commands:"
echo "sudo systemctl status $SERVICE_NAME"
echo "sudo systemctl restart $SERVICE_NAME"
echo "sudo journalctl -u $SERVICE_NAME -f"
