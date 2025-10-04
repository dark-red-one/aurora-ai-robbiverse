#!/usr/bin/env python3
"""
Aurora Deployment Dashboard
Real-time monitoring and control of the Aurora AI Empire deployment
"""

import asyncio
import aiohttp
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import logging
from dataclasses import dataclass, asdict
from flask import Flask, render_template, jsonify, request
import threading

logger = logging.getLogger(__name__)

@dataclass
class NodeInfo:
    name: str
    host: str
    port: int
    role: str
    gpu_config: str
    status: str
    last_deployment: Optional[datetime]
    uptime: Optional[float]
    response_time: Optional[float]
    services: Dict[str, bool]
    resource_usage: Dict[str, float]

class AuroraDeploymentDashboard:
    def __init__(self):
        self.app = Flask(__name__)
        self.nodes = {
            "aurora": {"host": "82.221.170.242", "port": 24505, "role": "primary", "gpu_config": "dual-rtx4090"},
            "collaboration": {"host": "213.181.111.2", "port": 43540, "role": "secondary", "gpu_config": "single-rtx4090"},
            "fluenti": {"host": "103.196.86.56", "port": 19777, "role": "marketing", "gpu_config": "single-rtx4090"}
        }
        
        self.node_status: Dict[str, NodeInfo] = {}
        self.deployment_history: List[Dict] = []
        self.alerts: List[Dict] = []
        
        self.setup_routes()
        self.start_monitoring()
    
    def setup_routes(self):
        """Setup Flask routes for the dashboard"""
        
        @self.app.route('/')
        def dashboard():
            return render_template('dashboard.html', nodes=self.nodes)
        
        @self.app.route('/api/status')
        def api_status():
            return jsonify({
                'nodes': {name: asdict(info) for name, info in self.node_status.items()},
                'timestamp': datetime.now().isoformat()
            })
        
        @self.app.route('/api/deploy', methods=['POST'])
        def api_deploy():
            data = request.get_json()
            node_name = data.get('node')
            environment = data.get('environment', 'production')
            
            # Trigger deployment
            result = self.trigger_deployment(node_name, environment)
            return jsonify(result)
        
        @self.app.route('/api/rollback', methods=['POST'])
        def api_rollback():
            data = request.get_json()
            node_name = data.get('node')
            
            # Trigger rollback
            result = self.trigger_rollback(node_name)
            return jsonify(result)
        
        @self.app.route('/api/history')
        def api_history():
            return jsonify(self.deployment_history[-50:])  # Last 50 deployments
        
        @self.app.route('/api/alerts')
        def api_alerts():
            return jsonify(self.alerts[-20:])  # Last 20 alerts
    
    def start_monitoring(self):
        """Start background monitoring thread"""
        def monitor_loop():
            asyncio.run(self.monitor_nodes())
        
        monitor_thread = threading.Thread(target=monitor_loop, daemon=True)
        monitor_thread.start()
    
    async def monitor_nodes(self):
        """Monitor all nodes continuously"""
        while True:
            try:
                await self.check_all_nodes()
                await asyncio.sleep(30)  # Check every 30 seconds
            except Exception as e:
                logger.error(f"Monitoring error: {e}")
                await asyncio.sleep(60)
    
    async def check_all_nodes(self):
        """Check status of all nodes"""
        tasks = []
        
        for node_name, config in self.nodes.items():
            task = asyncio.create_task(self.check_node(node_name, config))
            tasks.append(task)
        
        await asyncio.gather(*tasks, return_exceptions=True)
    
    async def check_node(self, node_name: str, config: Dict):
        """Check status of a single node"""
        start_time = time.time()
        
        try:
            # Check API health
            async with aiohttp.ClientSession() as session:
                api_url = f"http://{config['host']}:8000/health"
                async with session.get(api_url, timeout=10) as response:
                    if response.status == 200:
                        api_healthy = True
                        response_time = time.time() - start_time
                    else:
                        api_healthy = False
                        response_time = 999.0
        except Exception as e:
            logger.warning(f"Node {node_name} check failed: {e}")
            api_healthy = False
            response_time = 999.0
        
        # Check other services
        services = {
            "api": api_healthy,
            "database": await self.check_service(config['host'], 8000, '/health/database'),
            "redis": await self.check_service(config['host'], 8000, '/health/redis')
        }
        
        # Determine overall status
        if api_healthy:
            status = "healthy"
        elif any(services.values()):
            status = "degraded"
        else:
            status = "down"
        
        # Update node status
        self.node_status[node_name] = NodeInfo(
            name=node_name,
            host=config['host'],
            port=config['port'],
            role=config['role'],
            gpu_config=config['gpu_config'],
            status=status,
            last_deployment=self.node_status.get(node_name, NodeInfo("", "", 0, "", "", "", None, None, None, {}, {})).last_deployment,
            uptime=time.time() - start_time if api_healthy else 0,
            response_time=response_time,
            services=services,
            resource_usage={}  # Would be populated by actual monitoring
        )
        
        # Check for alerts
        if status == "down":
            self.add_alert(f"Node {node_name} is down", "critical")
        elif status == "degraded":
            self.add_alert(f"Node {node_name} is degraded", "warning")
    
    async def check_service(self, host: str, port: int, path: str) -> bool:
        """Check if a specific service is healthy"""
        try:
            async with aiohttp.ClientSession() as session:
                url = f"http://{host}:{port}{path}"
                async with session.get(url, timeout=5) as response:
                    return response.status == 200
        except:
            return False
    
    def add_alert(self, message: str, severity: str):
        """Add an alert to the dashboard"""
        alert = {
            "timestamp": datetime.now().isoformat(),
            "message": message,
            "severity": severity
        }
        self.alerts.append(alert)
        
        # Keep only last 100 alerts
        if len(self.alerts) > 100:
            self.alerts = self.alerts[-100:]
    
    def trigger_deployment(self, node_name: str, environment: str) -> Dict:
        """Trigger deployment to a specific node"""
        try:
            # This would integrate with the actual deployment script
            deployment = {
                "id": f"deploy_{int(time.time())}",
                "node": node_name,
                "environment": environment,
                "status": "started",
                "timestamp": datetime.now().isoformat()
            }
            
            self.deployment_history.append(deployment)
            
            # Update node last deployment time
            if node_name in self.node_status:
                self.node_status[node_name].last_deployment = datetime.now()
            
            return {
                "success": True,
                "deployment": deployment
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def trigger_rollback(self, node_name: str) -> Dict:
        """Trigger rollback for a specific node"""
        try:
            rollback = {
                "id": f"rollback_{int(time.time())}",
                "node": node_name,
                "status": "started",
                "timestamp": datetime.now().isoformat()
            }
            
            self.deployment_history.append(rollback)
            
            return {
                "success": True,
                "rollback": rollback
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def run(self, host='0.0.0.0', port=5000, debug=False):
        """Run the dashboard server"""
        logger.info(f"🚀 Starting Aurora Deployment Dashboard on {host}:{port}")
        self.app.run(host=host, port=port, debug=debug)

# HTML template for the dashboard
DASHBOARD_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aurora AI Empire Dashboard</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            color: white;
            margin-bottom: 30px;
        }
        .header h1 {
            font-size: 2.5em;
            margin: 0;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .header p {
            font-size: 1.2em;
            margin: 10px 0;
            opacity: 0.9;
        }
        .nodes-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .node-card {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            transition: transform 0.2s;
        }
        .node-card:hover {
            transform: translateY(-2px);
        }
        .node-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        .node-name {
            font-size: 1.3em;
            font-weight: bold;
        }
        .status {
            padding: 5px 10px;
            border-radius: 20px;
            font-size: 0.9em;
            font-weight: bold;
        }
        .status.healthy { background: #d4edda; color: #155724; }
        .status.degraded { background: #fff3cd; color: #856404; }
        .status.down { background: #f8d7da; color: #721c24; }
        .node-info {
            margin-bottom: 10px;
        }
        .node-info strong {
            color: #666;
        }
        .services {
            margin-top: 15px;
        }
        .service {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
            padding: 5px;
            background: #f8f9fa;
            border-radius: 5px;
        }
        .service.healthy { border-left: 4px solid #28a745; }
        .service.unhealthy { border-left: 4px solid #dc3545; }
        .controls {
            display: flex;
            gap: 10px;
            margin-top: 15px;
        }
        .btn {
            padding: 8px 16px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 0.9em;
            transition: background 0.2s;
        }
        .btn-primary { background: #007bff; color: white; }
        .btn-primary:hover { background: #0056b3; }
        .btn-danger { background: #dc3545; color: white; }
        .btn-danger:hover { background: #c82333; }
        .alerts {
            background: white;
            border-radius: 10px;
            padding: 20px;
            margin-top: 20px;
        }
        .alert {
            padding: 10px;
            margin: 5px 0;
            border-radius: 5px;
            border-left: 4px solid;
        }
        .alert.critical { background: #f8d7da; border-color: #dc3545; }
        .alert.warning { background: #fff3cd; border-color: #ffc107; }
        .alert.info { background: #d1ecf1; border-color: #17a2b8; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Aurora AI Empire Dashboard</h1>
            <p>Real-time monitoring and control of Robbie's consciousness across all RunPods</p>
        </div>
        
        <div class="nodes-grid" id="nodesGrid">
            <!-- Nodes will be populated by JavaScript -->
        </div>
        
        <div class="alerts">
            <h3>🚨 Recent Alerts</h3>
            <div id="alertsList">
                <!-- Alerts will be populated by JavaScript -->
            </div>
        </div>
    </div>

    <script>
        async function loadStatus() {
            try {
                const response = await fetch('/api/status');
                const data = await response.json();
                updateNodes(data.nodes);
            } catch (error) {
                console.error('Failed to load status:', error);
            }
        }
        
        async function loadAlerts() {
            try {
                const response = await fetch('/api/alerts');
                const alerts = await response.json();
                updateAlerts(alerts);
            } catch (error) {
                console.error('Failed to load alerts:', error);
            }
        }
        
        function updateNodes(nodes) {
            const grid = document.getElementById('nodesGrid');
            grid.innerHTML = '';
            
            for (const [name, node] of Object.entries(nodes)) {
                const card = document.createElement('div');
                card.className = 'node-card';
                
                const services = Object.entries(node.services || {})
                    .map(([service, healthy]) => 
                        `<div class="service ${healthy ? 'healthy' : 'unhealthy'}">
                            <span>${service}</span>
                            <span>${healthy ? '✅' : '❌'}</span>
                        </div>`
                    ).join('');
                
                card.innerHTML = `
                    <div class="node-header">
                        <div class="node-name">${name.toUpperCase()}</div>
                        <div class="status ${node.status}">${node.status.toUpperCase()}</div>
                    </div>
                    <div class="node-info">
                        <div><strong>Role:</strong> ${node.role}</div>
                        <div><strong>GPU:</strong> ${node.gpu_config}</div>
                        <div><strong>Response Time:</strong> ${node.response_time ? node.response_time.toFixed(2) + 's' : 'N/A'}</div>
                        <div><strong>Last Deployment:</strong> ${node.last_deployment || 'Never'}</div>
                    </div>
                    <div class="services">
                        <h4>Services</h4>
                        ${services}
                    </div>
                    <div class="controls">
                        <button class="btn btn-primary" onclick="deploy('${name}')">Deploy</button>
                        <button class="btn btn-danger" onclick="rollback('${name}')">Rollback</button>
                    </div>
                `;
                
                grid.appendChild(card);
            }
        }
        
        function updateAlerts(alerts) {
            const alertsList = document.getElementById('alertsList');
            alertsList.innerHTML = '';
            
            if (alerts.length === 0) {
                alertsList.innerHTML = '<div class="alert info">No recent alerts</div>';
                return;
            }
            
            alerts.slice(-10).reverse().forEach(alert => {
                const alertDiv = document.createElement('div');
                alertDiv.className = `alert ${alert.severity}`;
                alertDiv.innerHTML = `
                    <strong>${new Date(alert.timestamp).toLocaleString()}</strong><br>
                    ${alert.message}
                `;
                alertsList.appendChild(alertDiv);
            });
        }
        
        async function deploy(nodeName) {
            try {
                const response = await fetch('/api/deploy', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({node: nodeName, environment: 'production'})
                });
                const result = await response.json();
                if (result.success) {
                    alert(`Deployment started for ${nodeName}`);
                } else {
                    alert(`Deployment failed: ${result.error}`);
                }
            } catch (error) {
                alert(`Deployment error: ${error.message}`);
            }
        }
        
        async function rollback(nodeName) {
            if (!confirm(`Are you sure you want to rollback ${nodeName}?`)) return;
            
            try {
                const response = await fetch('/api/rollback', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({node: nodeName})
                });
                const result = await response.json();
                if (result.success) {
                    alert(`Rollback started for ${nodeName}`);
                } else {
                    alert(`Rollback failed: ${result.error}`);
                }
            } catch (error) {
                alert(`Rollback error: ${error.message}`);
            }
        }
        
        // Load initial data
        loadStatus();
        loadAlerts();
        
        // Refresh every 30 seconds
        setInterval(() => {
            loadStatus();
            loadAlerts();
        }, 30000);
    </script>
</body>
</html>
"""

def main():
    """Main entry point"""
    dashboard = AuroraDeploymentDashboard()
    
    # Create templates directory and save template
    import os
    os.makedirs('templates', exist_ok=True)
    with open('templates/dashboard.html', 'w') as f:
        f.write(DASHBOARD_TEMPLATE)
    
    dashboard.run(host='0.0.0.0', port=5000, debug=False)

if __name__ == "__main__":
    main()



