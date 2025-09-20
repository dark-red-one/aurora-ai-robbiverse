#!/usr/bin/env python3
"""
Aurora AI Empire Health Monitoring System
Continuously monitors all RunPods and services for optimal performance
"""

import asyncio
import aiohttp
import json
import time
import logging
import smtplib
from email.mime.text import MimeText
from email.mime.multipart import MimeMultipart
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import psutil
import docker
from dataclasses import dataclass

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/app/logs/health_monitor.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

@dataclass
class NodeStatus:
    name: str
    host: str
    port: int
    role: str
    gpu_config: str
    status: str
    last_check: datetime
    response_time: float
    error_count: int = 0
    services: Dict[str, bool] = None

class AuroraHealthMonitor:
    def __init__(self):
        self.nodes = {
            "aurora": {"host": "82.221.170.242", "port": 24505, "role": "primary", "gpu_config": "dual-rtx4090"},
            "collaboration": {"host": "213.181.111.2", "port": 43540, "role": "secondary", "gpu_config": "single-rtx4090"},
            "fluenti": {"host": "103.196.86.56", "port": 19777, "role": "marketing", "gpu_config": "single-rtx4090"}
        }
        
        self.node_status: Dict[str, NodeStatus] = {}
        self.alert_thresholds = {
            "response_time": 5.0,  # seconds
            "error_rate": 0.1,     # 10%
            "memory_usage": 85,    # percentage
            "disk_usage": 80,      # percentage
            "gpu_usage": 95        # percentage
        }
        
        self.docker_client = docker.from_env()
        self.session = None
        
    async def start_monitoring(self):
        """Start the health monitoring loop"""
        logger.info("🏥 Starting Aurora Health Monitoring System")
        
        async with aiohttp.ClientSession() as session:
            self.session = session
            
            while True:
                try:
                    await self.check_all_nodes()
                    await self.check_local_services()
                    await self.generate_health_report()
                    
                    # Wait 30 seconds before next check
                    await asyncio.sleep(30)
                    
                except Exception as e:
                    logger.error(f"❌ Health monitoring error: {e}")
                    await asyncio.sleep(60)  # Wait longer on error
    
    async def check_all_nodes(self):
        """Check health of all RunPod nodes"""
        tasks = []
        
        for node_name, config in self.nodes.items():
            task = asyncio.create_task(self.check_node_health(node_name, config))
            tasks.append(task)
        
        await asyncio.gather(*tasks, return_exceptions=True)
    
    async def check_node_health(self, node_name: str, config: Dict):
        """Check health of a single node"""
        start_time = time.time()
        
        try:
            # Check API health
            api_url = f"http://{config['host']}:8000/health"
            async with self.session.get(api_url, timeout=10) as response:
                if response.status == 200:
                    api_healthy = True
                    response_time = time.time() - start_time
                else:
                    api_healthy = False
                    response_time = 999.0
        except Exception as e:
            logger.warning(f"❌ {node_name} API check failed: {e}")
            api_healthy = False
            response_time = 999.0
        
        # Check database health
        try:
            db_url = f"http://{config['host']}:8000/health/database"
            async with self.session.get(db_url, timeout=5) as response:
                db_healthy = response.status == 200
        except:
            db_healthy = False
        
        # Check Redis health
        try:
            redis_url = f"http://{config['host']}:8000/health/redis"
            async with self.session.get(redis_url, timeout=5) as response:
                redis_healthy = response.status == 200
        except:
            redis_healthy = False
        
        # Update node status
        services = {
            "api": api_healthy,
            "database": db_healthy,
            "redis": redis_healthy
        }
        
        overall_status = "healthy" if all(services.values()) else "degraded"
        if not api_healthy:
            overall_status = "down"
        
        self.node_status[node_name] = NodeStatus(
            name=node_name,
            host=config['host'],
            port=config['port'],
            role=config['role'],
            gpu_config=config['gpu_config'],
            status=overall_status,
            last_check=datetime.now(),
            response_time=response_time,
            error_count=self.node_status.get(node_name, NodeStatus("", "", 0, "", "", "", datetime.now(), 0.0)).error_count + (0 if api_healthy else 1),
            services=services
        )
        
        # Check for alerts
        await self.check_alerts(node_name, self.node_status[node_name])
    
    async def check_local_services(self):
        """Check health of local services"""
        try:
            # Check Docker containers
            containers = self.docker_client.containers.list()
            for container in containers:
                if container.name.startswith('aurora'):
                    status = container.status
                    logger.info(f"🐳 Container {container.name}: {status}")
            
            # Check system resources
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            if memory.percent > self.alert_thresholds['memory_usage']:
                await self.send_alert("High Memory Usage", f"Memory usage: {memory.percent}%")
            
            if disk.percent > self.alert_thresholds['disk_usage']:
                await self.send_alert("High Disk Usage", f"Disk usage: {disk.percent}%")
                
        except Exception as e:
            logger.error(f"❌ Local service check failed: {e}")
    
    async def check_alerts(self, node_name: str, status: NodeStatus):
        """Check if alerts should be sent for a node"""
        alerts = []
        
        if status.response_time > self.alert_thresholds['response_time']:
            alerts.append(f"Slow response time: {status.response_time:.2f}s")
        
        if status.error_count > 5:
            alerts.append(f"High error count: {status.error_count}")
        
        if status.status == "down":
            alerts.append("Node is completely down")
        
        if alerts:
            await self.send_alert(f"Aurora {node_name} Issues", "\n".join(alerts))
    
    async def send_alert(self, subject: str, message: str):
        """Send alert notification"""
        logger.warning(f"🚨 ALERT: {subject} - {message}")
        
        # In production, you would send actual emails/SMS here
        # For now, just log the alert
        alert_data = {
            "timestamp": datetime.now().isoformat(),
            "subject": subject,
            "message": message,
            "severity": "warning"
        }
        
        # Save alert to file
        with open('/app/logs/alerts.jsonl', 'a') as f:
            f.write(json.dumps(alert_data) + '\n')
    
    async def generate_health_report(self):
        """Generate comprehensive health report"""
        report = {
            "timestamp": datetime.now().isoformat(),
            "overall_status": "healthy",
            "nodes": {}
        }
        
        healthy_nodes = 0
        total_nodes = len(self.node_status)
        
        for node_name, status in self.node_status.items():
            node_report = {
                "status": status.status,
                "response_time": status.response_time,
                "error_count": status.error_count,
                "services": status.services,
                "last_check": status.last_check.isoformat()
            }
            
            report["nodes"][node_name] = node_report
            
            if status.status == "healthy":
                healthy_nodes += 1
        
        # Determine overall status
        if healthy_nodes == total_nodes:
            report["overall_status"] = "healthy"
        elif healthy_nodes > 0:
            report["overall_status"] = "degraded"
        else:
            report["overall_status"] = "down"
        
        # Save report
        with open('/app/logs/health_report.json', 'w') as f:
            json.dump(report, f, indent=2)
        
        # Log summary
        logger.info(f"📊 Health Report: {report['overall_status'].upper()} - {healthy_nodes}/{total_nodes} nodes healthy")

async def main():
    """Main entry point"""
    monitor = AuroraHealthMonitor()
    await monitor.start_monitoring()

if __name__ == "__main__":
    asyncio.run(main())



