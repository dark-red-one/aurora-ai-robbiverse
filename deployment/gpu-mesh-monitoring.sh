#!/bin/bash
# GPU Mesh Monitoring and Alerting System
# Monitors GPU mesh health and sends alerts

set -e

echo "📊 SETTING UP GPU MESH MONITORING"
echo "================================="

# Configuration
GPU_MESH_ENDPOINT="http://209.170.80.132:8002"
AURORA_TOWN_IP="45.32.194.172"
ALERT_EMAIL="allan@testpilotcpg.com"

# Create monitoring script
cat > /tmp/gpu-mesh-monitor.py << 'PYEOF'
#!/usr/bin/env python3
"""
GPU Mesh Monitoring System
Monitors GPU mesh health and performance
"""

import requests
import json
import time
import smtplib
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

class GPUMeshMonitor:
    def __init__(self, mesh_endpoint, alert_email):
        self.mesh_endpoint = mesh_endpoint
        self.alert_email = alert_email
        self.last_alert = {}
        self.alert_cooldown = 300  # 5 minutes
    
    def get_mesh_status(self):
        """Get current mesh status"""
        try:
            response = requests.get(f"{self.mesh_endpoint}/mesh/status", timeout=10)
            return response.json()
        except Exception as e:
            return {"error": str(e), "status": "offline"}
    
    def check_health(self):
        """Check mesh health and return status"""
        status = self.get_mesh_status()
        
        if "error" in status:
            return {
                "status": "critical",
                "message": f"Mesh unreachable: {status['error']}",
                "details": status
            }
        
        # Check if mesh is active
        if status.get("mesh_status") != "active":
            return {
                "status": "critical",
                "message": "Mesh status is not active",
                "details": status
            }
        
        # Check active nodes
        active_nodes = status.get("active_nodes", 0)
        if active_nodes == 0:
            return {
                "status": "critical",
                "message": "No active GPU nodes",
                "details": status
            }
        
        # Check GPU utilization
        available_vram = status.get("available_vram_gb", 0)
        total_vram = status.get("total_vram_gb", 0)
        
        if total_vram > 0:
            utilization = ((total_vram - available_vram) / total_vram) * 100
            
            if utilization > 90:
                return {
                    "status": "warning",
                    "message": f"High GPU utilization: {utilization:.1f}%",
                    "details": status
                }
            elif utilization > 95:
                return {
                    "status": "critical",
                    "message": f"Critical GPU utilization: {utilization:.1f}%",
                    "details": status
                }
        
        return {
            "status": "healthy",
            "message": f"Mesh healthy - {active_nodes} nodes, {available_vram}GB VRAM available",
            "details": status
        }
    
    def send_alert(self, alert_type, message, details):
        """Send alert notification"""
        current_time = time.time()
        
        # Check cooldown
        if alert_type in self.last_alert:
            if current_time - self.last_alert[alert_type] < self.alert_cooldown:
                return False
        
        self.last_alert[alert_type] = current_time
        
        # Create email content
        subject = f"🚨 GPU Mesh Alert: {alert_type.upper()}"
        body = f"""
GPU Mesh Alert - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

Status: {alert_type.upper()}
Message: {message}

Details:
{json.dumps(details, indent=2)}

Mesh Endpoint: {self.mesh_endpoint}
        """
        
        # Send email (simplified - would need SMTP config)
        print(f"ALERT: {subject}")
        print(body)
        
        return True
    
    def run_monitoring_cycle(self):
        """Run one monitoring cycle"""
        health = self.check_health()
        
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {health['status'].upper()}: {health['message']}")
        
        if health['status'] in ['warning', 'critical']:
            self.send_alert(health['status'], health['message'], health['details'])
        
        return health
    
    def start_monitoring(self, interval=60):
        """Start continuous monitoring"""
        print(f"🚀 Starting GPU mesh monitoring (every {interval}s)")
        print(f"🔗 Mesh endpoint: {self.mesh_endpoint}")
        print("Press Ctrl+C to stop")
        
        try:
            while True:
                self.run_monitoring_cycle()
                time.sleep(interval)
        except KeyboardInterrupt:
            print("\n🛑 Monitoring stopped")

if __name__ == "__main__":
    import sys
    
    mesh_endpoint = sys.argv[1] if len(sys.argv) > 1 else "http://209.170.80.132:8002"
    alert_email = sys.argv[2] if len(sys.argv) > 2 else "allan@testpilotcpg.com"
    
    monitor = GPUMeshMonitor(mesh_endpoint, alert_email)
    
    if len(sys.argv) > 3 and sys.argv[3] == "once":
        # Single check
        health = monitor.run_monitoring_cycle()
        exit(0 if health['status'] == 'healthy' else 1)
    else:
        # Continuous monitoring
        monitor.start_monitoring()
PYEOF

# Create monitoring dashboard
cat > /tmp/gpu-mesh-dashboard.html << 'DASHBOARDEOF'
<!DOCTYPE html>
<html>
<head>
    <title>GPU Mesh Dashboard</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .card { background: white; padding: 20px; margin: 10px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .status-healthy { border-left: 4px solid #4CAF50; }
        .status-warning { border-left: 4px solid #FF9800; }
        .status-critical { border-left: 4px solid #F44336; }
        .metric { display: inline-block; margin: 10px 20px 10px 0; }
        .metric-value { font-size: 24px; font-weight: bold; color: #333; }
        .metric-label { font-size: 14px; color: #666; }
        .refresh-btn { background: #2196F3; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; }
        .refresh-btn:hover { background: #1976D2; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 GPU Mesh Dashboard</h1>
        
        <div class="card">
            <h2>Mesh Status</h2>
            <div id="mesh-status">Loading...</div>
            <button class="refresh-btn" onclick="refreshStatus()">Refresh</button>
        </div>
        
        <div class="card">
            <h2>GPU Resources</h2>
            <div id="gpu-resources">Loading...</div>
        </div>
        
        <div class="card">
            <h2>Node Status</h2>
            <div id="node-status">Loading...</div>
        </div>
    </div>

    <script>
        function refreshStatus() {
            fetch('http://209.170.80.132:8002/mesh/status')
                .then(response => response.json())
                .then(data => {
                    updateDashboard(data);
                })
                .catch(error => {
                    document.getElementById('mesh-status').innerHTML = 
                        '<div class="status-critical">❌ Error: ' + error.message + '</div>';
                });
        }
        
        function updateDashboard(data) {
            // Update mesh status
            const statusClass = data.mesh_status === 'active' ? 'status-healthy' : 'status-critical';
            document.getElementById('mesh-status').innerHTML = 
                `<div class="${statusClass}">
                    <div class="metric">
                        <div class="metric-value">${data.mesh_status.toUpperCase()}</div>
                        <div class="metric-label">Mesh Status</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">${data.active_nodes}/${data.total_nodes}</div>
                        <div class="metric-label">Active Nodes</div>
                    </div>
                </div>`;
            
            // Update GPU resources
            document.getElementById('gpu-resources').innerHTML = 
                `<div class="metric">
                    <div class="metric-value">${data.total_gpus}</div>
                    <div class="metric-label">Total GPUs</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${data.available_vram_gb}GB</div>
                    <div class="metric-label">Available VRAM</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${data.utilization_percent.toFixed(1)}%</div>
                    <div class="metric-label">Utilization</div>
                </div>`;
            
            // Update node status
            let nodeHtml = '';
            for (const [name, node] of Object.entries(data.nodes)) {
                const nodeClass = node.status === 'active' ? 'status-healthy' : 'status-critical';
                nodeHtml += `<div class="${nodeClass}">
                    <strong>${name}</strong>: ${node.status} 
                    (${node.gpus} GPUs, ${node.vram_total}GB VRAM)
                </div>`;
            }
            document.getElementById('node-status').innerHTML = nodeHtml;
        }
        
        // Auto-refresh every 30 seconds
        setInterval(refreshStatus, 30000);
        
        // Initial load
        refreshStatus();
    </script>
</body>
</html>
DASHBOARDEOF

echo "✅ Monitoring system created"

# Create cron job for monitoring
cat > /tmp/gpu-mesh-cron << 'CRONEOF'
# GPU Mesh Monitoring - Every 5 minutes
*/5 * * * * root /usr/bin/python3 /opt/aurora-dev/aurora/gpu-mesh-monitor.py http://209.170.80.132:8002 allan@testpilotcpg.com once >> /var/log/gpu-mesh-monitor.log 2>&1
CRONEOF

echo "✅ Cron job created"

echo ""
echo "🎯 GPU MESH MONITORING SETUP COMPLETE!"
echo "====================================="
echo ""
echo "📋 Files created:"
echo "• /tmp/gpu-mesh-monitor.py - Monitoring script"
echo "• /tmp/gpu-mesh-dashboard.html - Web dashboard"
echo "• /tmp/gpu-mesh-cron - Cron job"
echo ""
echo "🚀 Next steps:"
echo "1. Copy files to Aurora Town:"
echo "   scp /tmp/gpu-mesh-monitor.py root@$AURORA_TOWN_IP:/opt/aurora-dev/aurora/"
echo "   scp /tmp/gpu-mesh-dashboard.html root@$AURORA_TOWN_IP:/var/www/html/"
echo "   scp /tmp/gpu-mesh-cron root@$AURORA_TOWN_IP:/etc/cron.d/"
echo ""
echo "2. Start monitoring:"
echo "   python3 /opt/aurora-dev/aurora/gpu-mesh-monitor.py"
echo ""
echo "3. View dashboard:"
echo "   http://$AURORA_TOWN_IP/gpu-mesh-dashboard.html"
echo ""
echo "📊 Monitoring features:"
echo "• Health checks every 5 minutes"
echo "• Alert on high utilization (>90%)"
echo "• Alert on node failures"
echo "• Web dashboard with real-time status"
echo "• Email notifications (configure SMTP)"


