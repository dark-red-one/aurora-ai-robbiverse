#!/bin/bash
# Set up log rotation for GPU mesh logs

set -e

echo "📝 Setting up log rotation for GPU Mesh"
echo "========================================"

LOG_DIR="/tmp/aurora-gpu-mesh"
mkdir -p "$LOG_DIR"

# Create logrotate config
LOGROTATE_CONF="/etc/logrotate.d/aurora-gpu-mesh"

cat << 'EOF' | sudo tee "$LOGROTATE_CONF" > /dev/null
/tmp/aurora-gpu-mesh/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 allan allan
    maxsize 100M
}
EOF

echo "✅ Logrotate config created: $LOGROTATE_CONF"
echo ""
echo "Log rotation settings:"
echo "  - Daily rotation"
echo "  - Keep 7 days of logs"
echo "  - Compress old logs"
echo "  - Max size: 100MB per log"
echo ""
echo "Test rotation: sudo logrotate -f $LOGROTATE_CONF"
echo "========================================"



