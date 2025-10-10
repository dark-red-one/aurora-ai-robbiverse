#!/bin/bash
# Setup comprehensive health monitoring with auto-restart
# Monitors all Aurora Town services and auto-recovers from failures

set -e

echo "🏥 Setting up Aurora Town Health Monitoring"
echo "============================================"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root (sudo)"
    exit 1
fi

# Create scripts directory
mkdir -p /home/allan/robbie-ai/scripts
mkdir -p /var/log/aurora

echo "📝 Creating health check script..."

# Create comprehensive health check script
cat > /home/allan/robbie-ai/scripts/health-check.sh << 'HEALTHEOF'
#!/bin/bash
# Aurora Town Comprehensive Health Check
# Runs every 5 minutes via cron

LOG_FILE="/var/log/aurora/health-check.log"
ALERT_FILE="/var/log/aurora/alerts.log"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a $LOG_FILE
}

alert() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - ALERT: $1" | tee -a $LOG_FILE $ALERT_FILE
}

log "🏥 Starting health check..."

# Check AI Router
if ! curl -f -s http://localhost:8000/health > /dev/null 2>&1; then
    alert "AI Router down - restarting..."
    systemctl restart ai-router
    sleep 5
    if curl -f -s http://localhost:8000/health > /dev/null 2>&1; then
        log "✅ AI Router restarted successfully"
    else
        alert "❌ AI Router failed to restart!"
    fi
else
    log "✅ AI Router healthy"
fi

# Check Ollama
if ! curl -f -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    alert "Ollama down - restarting..."
    systemctl restart ollama || systemctl start ollama
    sleep 5
    if curl -f -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        log "✅ Ollama restarted successfully"
    else
        alert "❌ Ollama failed to restart!"
    fi
else
    log "✅ Ollama healthy"
fi

# Check Nginx
if ! systemctl is-active --quiet nginx; then
    alert "Nginx down - restarting..."
    systemctl restart nginx
    sleep 2
    if systemctl is-active --quiet nginx; then
        log "✅ Nginx restarted successfully"
    else
        alert "❌ Nginx failed to restart!"
    fi
else
    log "✅ Nginx healthy"
fi

# Check GPU
if ! nvidia-smi > /dev/null 2>&1; then
    alert "❌ GPU not responding! Manual intervention required."
else
    GPU_TEMP=$(nvidia-smi --query-gpu=temperature.gpu --format=csv,noheader)
    GPU_UTIL=$(nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader | tr -d '%')
    GPU_MEM=$(nvidia-smi --query-gpu=memory.used --format=csv,noheader | awk '{print $1}')
    
    log "✅ GPU: ${GPU_TEMP}°C, ${GPU_UTIL}% utilization, ${GPU_MEM}MB used"
    
    if [ $GPU_TEMP -gt 85 ]; then
        alert "⚠️  GPU temperature high: ${GPU_TEMP}°C"
    fi
fi

# Check PostgreSQL (if installed)
if systemctl list-units --all | grep -q postgresql; then
    if ! systemctl is-active --quiet postgresql; then
        alert "PostgreSQL down - restarting..."
        systemctl restart postgresql
        sleep 5
        if systemctl is-active --quiet postgresql; then
            log "✅ PostgreSQL restarted successfully"
        else
            alert "❌ PostgreSQL failed to restart!"
        fi
    else
        log "✅ PostgreSQL healthy"
    fi
fi

# Check Redis (if installed)
if systemctl list-units --all | grep -q redis; then
    if ! systemctl is-active --quiet redis-server; then
        alert "Redis down - restarting..."
        systemctl restart redis-server
        sleep 2
        if systemctl is-active --quiet redis-server; then
            log "✅ Redis restarted successfully"
        else
            alert "❌ Redis failed to restart!"
        fi
    else
        log "✅ Redis healthy"
    fi
fi

# Check disk space
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | tr -d '%')
if [ $DISK_USAGE -gt 80 ]; then
    alert "⚠️  Disk space critical: ${DISK_USAGE}% used"
elif [ $DISK_USAGE -gt 70 ]; then
    log "⚠️  Disk space warning: ${DISK_USAGE}% used"
else
    log "✅ Disk space: ${DISK_USAGE}% used"
fi

# Check memory usage
MEM_USAGE=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100)}')
if [ $MEM_USAGE -gt 90 ]; then
    alert "⚠️  Memory usage critical: ${MEM_USAGE}%"
else
    log "✅ Memory usage: ${MEM_USAGE}%"
fi

# Check WireGuard VPN (if configured)
if systemctl list-units --all | grep -q "wg-quick@wg0"; then
    if ! systemctl is-active --quiet wg-quick@wg0; then
        alert "WireGuard VPN down - restarting..."
        systemctl restart wg-quick@wg0
        sleep 2
        if systemctl is-active --quiet wg-quick@wg0; then
            log "✅ WireGuard VPN restarted successfully"
        else
            alert "❌ WireGuard VPN failed to restart!"
        fi
    else
        VPN_PEERS=$(wg show wg0 peers | wc -l)
        log "✅ WireGuard VPN healthy (${VPN_PEERS} peers)"
    fi
fi

log "🏥 Health check complete"
echo ""
HEALTHEOF

chmod +x /home/allan/robbie-ai/scripts/health-check.sh

echo "✅ Health check script created"

# Create cron job
echo "⏰ Setting up cron job..."

cat > /etc/cron.d/aurora-health << 'CRONEOF'
# Aurora Town Health Monitoring
# Runs every 5 minutes
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin

*/5 * * * * root /home/allan/robbie-ai/scripts/health-check.sh
CRONEOF

chmod 644 /etc/cron.d/aurora-health

echo "✅ Cron job installed"

# Create log rotation config
echo "📜 Setting up log rotation..."

cat > /etc/logrotate.d/aurora << 'LOGROTEOF'
/var/log/aurora/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0640 root root
}
LOGROTEOF

echo "✅ Log rotation configured"

# Create monitoring dashboard script
cat > /home/allan/robbie-ai/scripts/status-dashboard.sh << 'DASHEOF'
#!/bin/bash
# Aurora Town Status Dashboard
# Quick overview of all services

clear
echo "╔═══════════════════════════════════════════════════╗"
echo "║       Aurora Town Status Dashboard                ║"
echo "╚═══════════════════════════════════════════════════╝"
echo ""

# GPU Status
if nvidia-smi > /dev/null 2>&1; then
    GPU_NAME=$(nvidia-smi --query-gpu=name --format=csv,noheader)
    GPU_TEMP=$(nvidia-smi --query-gpu=temperature.gpu --format=csv,noheader)
    GPU_UTIL=$(nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader)
    GPU_MEM=$(nvidia-smi --query-gpu=memory.used,memory.total --format=csv,noheader)
    echo "🎮 GPU: $GPU_NAME"
    echo "   Temperature: ${GPU_TEMP}°C | Utilization: $GPU_UTIL | Memory: $GPU_MEM"
else
    echo "❌ GPU: Not detected"
fi

echo ""

# Service Status
check_service() {
    SERVICE=$1
    DISPLAY_NAME=$2
    PORT=$3
    
    if systemctl is-active --quiet $SERVICE; then
        if [ -n "$PORT" ]; then
            if curl -f -s http://localhost:$PORT > /dev/null 2>&1; then
                echo "✅ $DISPLAY_NAME: Running (port $PORT)"
            else
                echo "⚠️  $DISPLAY_NAME: Service up but not responding on port $PORT"
            fi
        else
            echo "✅ $DISPLAY_NAME: Running"
        fi
    else
        echo "❌ $DISPLAY_NAME: Down"
    fi
}

check_service "ai-router" "AI Router" "8000"
check_service "nginx" "Nginx" "80"

# Check Ollama
if curl -f -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    MODELS=$(curl -s http://localhost:11434/api/tags | grep -o '"name"' | wc -l)
    echo "✅ Ollama: Running ($MODELS models)"
else
    echo "❌ Ollama: Down"
fi

# PostgreSQL
if systemctl list-units --all | grep -q postgresql; then
    check_service "postgresql" "PostgreSQL" ""
fi

# Redis
if systemctl list-units --all | grep -q redis; then
    check_service "redis-server" "Redis" ""
fi

# WireGuard VPN
if systemctl list-units --all | grep -q "wg-quick@wg0"; then
    if systemctl is-active --quiet wg-quick@wg0; then
        PEERS=$(wg show wg0 peers 2>/dev/null | wc -l)
        echo "✅ WireGuard VPN: Running ($PEERS peers connected)"
    else
        echo "❌ WireGuard VPN: Down"
    fi
fi

echo ""

# System Resources
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}')
MEM_USAGE=$(free -h | grep Mem | awk '{print $3"/"$2}')
CPU_LOAD=$(uptime | awk -F'load average:' '{print $2}')

echo "💻 System Resources:"
echo "   Disk: $DISK_USAGE used | Memory: $MEM_USAGE | Load:$CPU_LOAD"

echo ""

# Network
EXTERNAL_IP=$(curl -s https://api.ipify.org 2>/dev/null || echo "N/A")
echo "🌐 Network:"
echo "   External IP: $EXTERNAL_IP"
echo "   API Endpoint: http://$EXTERNAL_IP:10002"

echo ""

# Recent Alerts
if [ -f /var/log/aurora/alerts.log ]; then
    ALERT_COUNT=$(wc -l < /var/log/aurora/alerts.log)
    if [ $ALERT_COUNT -gt 0 ]; then
        echo "⚠️  Recent Alerts ($ALERT_COUNT):"
        tail -5 /var/log/aurora/alerts.log | sed 's/^/   /'
    else
        echo "✅ No recent alerts"
    fi
else
    echo "✅ No alerts logged"
fi

echo ""
echo "Last updated: $(date)"
echo "Run 'sudo /home/allan/robbie-ai/scripts/status-dashboard.sh' to refresh"
DASHEOF

chmod +x /home/allan/robbie-ai/scripts/status-dashboard.sh

echo "✅ Status dashboard script created"

# Run initial health check
echo ""
echo "🧪 Running initial health check..."
bash /home/allan/robbie-ai/scripts/health-check.sh

echo ""
echo "✅ Health Monitoring Setup Complete!"
echo ""
echo "📋 What's Configured:"
echo "===================="
echo "✅ Health checks every 5 minutes"
echo "✅ Auto-restart for failed services"
echo "✅ GPU temperature monitoring"
echo "✅ Disk space monitoring"
echo "✅ Memory usage monitoring"
echo "✅ Alert logging"
echo "✅ Log rotation (7 days)"
echo ""
echo "📋 Commands:"
echo "============"
echo "View status:        sudo /home/allan/robbie-ai/scripts/status-dashboard.sh"
echo "Manual health check: sudo /home/allan/robbie-ai/scripts/health-check.sh"
echo "View health logs:   sudo tail -f /var/log/aurora/health-check.log"
echo "View alerts:        sudo cat /var/log/aurora/alerts.log"
echo ""
echo "📊 Status Dashboard:"
echo "===================="
/home/allan/robbie-ai/scripts/status-dashboard.sh

