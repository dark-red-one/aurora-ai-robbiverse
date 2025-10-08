#!/usr/bin/env python3
"""
Aurora AI - Unified GPU Mesh System
Complete production mesh with monitoring, keepalive, auto-recovery, and alerts
"""

import asyncio
import aiohttp
import json
import logging
import subprocess
import sys
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict
from enum import Enum

# Logging setup
LOG_DIR = Path("/tmp/aurora-gpu-mesh")
LOG_DIR.mkdir(exist_ok=True)
LOG_FILE = LOG_DIR / "gpu-mesh.log"

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(LOG_FILE)
    ]
)
logger = logging.getLogger('gpu_mesh')

class NodeStatus(Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"
    UNKNOWN = "unknown"
    OFFLINE = "offline"

@dataclass
class GPUNode:
    name: str
    url: str
    port: int
    status: NodeStatus = NodeStatus.UNKNOWN
    last_check: Optional[datetime] = None
    response_time: float = 0.0
    consecutive_failures: int = 0
    total_requests: int = 0
    successful_requests: int = 0
    models: List[str] = None
    error_message: str = ""
    
    def __post_init__(self):
        if self.models is None:
            self.models = []
    
    @property
    def success_rate(self) -> float:
        if self.total_requests == 0:
            return 0.0
        return (self.successful_requests / self.total_requests) * 100
    
    @property
    def uptime_score(self) -> float:
        """Calculate health score (0-100)"""
        if self.status == NodeStatus.HEALTHY:
            base_score = 100
        elif self.status == NodeStatus.DEGRADED:
            base_score = 60
        elif self.status == NodeStatus.UNHEALTHY:
            base_score = 30
        else:
            base_score = 0
        
        # Penalize for failures
        failure_penalty = min(self.consecutive_failures * 10, 50)
        return max(base_score - failure_penalty, 0)

class AlertLevel(Enum):
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"

@dataclass
class Alert:
    level: AlertLevel
    node_name: str
    message: str
    timestamp: datetime
    
    def __str__(self):
        icon = {
            AlertLevel.INFO: "ℹ️",
            AlertLevel.WARNING: "⚠️",
            AlertLevel.ERROR: "❌",
            AlertLevel.CRITICAL: "🚨"
        }
        return f"{icon[self.level]} [{self.level.value}] {self.node_name}: {self.message}"

class UnifiedGPUMesh:
    def __init__(self):
        self.nodes: Dict[str, GPUNode] = {
            'local': GPUNode(
                name='Local Ollama',
                url='http://localhost:11434',
                port=11434
            ),
            'tunnel': GPUNode(
                name='Iceland/RunPod (Tunnel)',
                url='http://localhost:8080',
                port=8080
            )
        }
        
        self.running = False
        self.session: Optional[aiohttp.ClientSession] = None
        self.alerts: List[Alert] = []
        self.check_interval = 30  # seconds
        self.keepalive_interval = 60  # seconds
        self.stats_interval = 300  # 5 minutes
        
        # Alert thresholds
        self.max_consecutive_failures = 3
        self.critical_failure_threshold = 5
        
    async def start(self):
        """Start the unified GPU mesh system"""
        logger.info("🚀 Starting Unified GPU Mesh System")
        logger.info(f"📊 Monitoring {len(self.nodes)} GPU nodes")
        logger.info(f"📝 Logs: {LOG_FILE}")
        
        self.running = True
        timeout = aiohttp.ClientTimeout(total=10, connect=5)
        self.session = aiohttp.ClientSession(timeout=timeout)
        
        try:
            # Start all monitoring tasks
            await asyncio.gather(
                self.health_monitor_loop(),
                self.keepalive_loop(),
                self.stats_reporter_loop(),
                self.alert_processor_loop(),
                self.dashboard_loop(),
                return_exceptions=True
            )
        finally:
            await self.session.close()
    
    async def health_monitor_loop(self):
        """Continuously monitor health of all GPU nodes"""
        logger.info("🔍 Health monitor started")
        
        while self.running:
            try:
                # Check all nodes in parallel
                await asyncio.gather(
                    *[self.check_node_health(node) for node in self.nodes.values()],
                    return_exceptions=True
                )
                
                await asyncio.sleep(self.check_interval)
                
            except Exception as e:
                logger.error(f"Health monitor error: {e}")
                await asyncio.sleep(5)
    
    async def check_node_health(self, node: GPUNode):
        """Check health of a single GPU node"""
        start_time = time.time()
        node.total_requests += 1
        
        try:
            async with self.session.get(f"{node.url}/api/tags") as resp:
                response_time = (time.time() - start_time) * 1000  # ms
                
                if resp.status == 200:
                    data = await resp.json()
                    models = [m['name'] for m in data.get('models', [])]
                    
                    # Update node status
                    old_status = node.status
                    node.status = NodeStatus.HEALTHY
                    node.last_check = datetime.now()
                    node.response_time = response_time
                    node.consecutive_failures = 0
                    node.successful_requests += 1
                    node.models = models
                    node.error_message = ""
                    
                    # Alert if recovered
                    if old_status in [NodeStatus.UNHEALTHY, NodeStatus.OFFLINE]:
                        await self.send_alert(
                            AlertLevel.INFO,
                            node.name,
                            f"Node recovered! Response time: {response_time:.0f}ms, Models: {len(models)}"
                        )
                    
                    logger.debug(f"✅ {node.name}: {response_time:.0f}ms, {len(models)} models")
                else:
                    await self.handle_node_failure(node, f"HTTP {resp.status}")
                    
        except asyncio.TimeoutError:
            await self.handle_node_failure(node, "Timeout (10s)")
        except aiohttp.ClientError as e:
            await self.handle_node_failure(node, f"Connection error: {type(e).__name__}")
        except Exception as e:
            await self.handle_node_failure(node, f"Error: {str(e)}")
    
    async def handle_node_failure(self, node: GPUNode, reason: str):
        """Handle node failure with graduated alerts"""
        node.consecutive_failures += 1
        node.error_message = reason
        old_status = node.status
        
        # Determine new status
        if node.consecutive_failures >= self.critical_failure_threshold:
            node.status = NodeStatus.OFFLINE
        elif node.consecutive_failures >= self.max_consecutive_failures:
            node.status = NodeStatus.UNHEALTHY
        else:
            node.status = NodeStatus.DEGRADED
        
        # Alert on status changes
        if old_status != node.status:
            if node.status == NodeStatus.OFFLINE:
                await self.send_alert(
                    AlertLevel.CRITICAL,
                    node.name,
                    f"Node OFFLINE after {node.consecutive_failures} failures: {reason}"
                )
            elif node.status == NodeStatus.UNHEALTHY:
                await self.send_alert(
                    AlertLevel.ERROR,
                    node.name,
                    f"Node UNHEALTHY: {reason}"
                )
            elif node.status == NodeStatus.DEGRADED:
                await self.send_alert(
                    AlertLevel.WARNING,
                    node.name,
                    f"Node degraded: {reason}"
                )
        
        logger.warning(f"⚠️  {node.name}: Failure #{node.consecutive_failures} - {reason}")
    
    async def keepalive_loop(self):
        """Maintain connections and attempt recovery"""
        logger.info("💓 Keepalive service started")
        await asyncio.sleep(30)  # Initial delay
        
        while self.running:
            try:
                for node in self.nodes.values():
                    if node.status in [NodeStatus.UNHEALTHY, NodeStatus.OFFLINE]:
                        await self.attempt_node_recovery(node)
                
                await asyncio.sleep(self.keepalive_interval)
                
            except Exception as e:
                logger.error(f"Keepalive error: {e}")
                await asyncio.sleep(10)
    
    async def attempt_node_recovery(self, node: GPUNode):
        """Attempt to recover a failed node"""
        logger.info(f"🔧 Attempting recovery for {node.name}")
        
        if node.name == 'Local Ollama':
            # Check if Ollama is running
            try:
                result = subprocess.run(
                    ['pgrep', '-f', 'ollama serve'],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                
                if result.returncode != 0:
                    logger.info(f"🔄 Restarting {node.name}")
                    subprocess.Popen(
                        ['ollama', 'serve'],
                        stdout=subprocess.DEVNULL,
                        stderr=subprocess.DEVNULL
                    )
                    await self.send_alert(
                        AlertLevel.INFO,
                        node.name,
                        "Attempted automatic restart"
                    )
                    await asyncio.sleep(5)  # Give it time to start
                else:
                    logger.info(f"ℹ️  {node.name} process is running, but not responding")
                    
            except Exception as e:
                logger.error(f"Recovery failed for {node.name}: {e}")
        
        elif 'Tunnel' in node.name:
            logger.info(f"ℹ️  {node.name} requires manual tunnel check")
            # Could add SSH tunnel restart logic here
    
    async def stats_reporter_loop(self):
        """Report periodic statistics"""
        logger.info("📊 Stats reporter started")
        await asyncio.sleep(60)  # Initial delay
        
        while self.running:
            try:
                await self.report_stats()
                await asyncio.sleep(self.stats_interval)
            except Exception as e:
                logger.error(f"Stats reporter error: {e}")
                await asyncio.sleep(30)
    
    async def report_stats(self):
        """Generate and log statistics report"""
        logger.info("=" * 80)
        logger.info("📊 GPU MESH STATISTICS REPORT")
        logger.info("=" * 80)
        
        for node in self.nodes.values():
            status_icon = {
                NodeStatus.HEALTHY: "🟢",
                NodeStatus.DEGRADED: "🟡",
                NodeStatus.UNHEALTHY: "🔴",
                NodeStatus.OFFLINE: "⚫",
                NodeStatus.UNKNOWN: "⚪"
            }
            
            icon = status_icon[node.status]
            logger.info(f"{icon} {node.name:25s} | Status: {node.status.value:10s} | "
                       f"Success: {node.success_rate:5.1f}% | "
                       f"Score: {node.uptime_score:5.1f} | "
                       f"RT: {node.response_time:6.0f}ms | "
                       f"Models: {len(node.models)}")
            
            if node.error_message:
                logger.info(f"  └─ Error: {node.error_message}")
        
        logger.info("=" * 80)
        
        # Overall mesh health
        healthy_nodes = sum(1 for n in self.nodes.values() if n.status == NodeStatus.HEALTHY)
        total_nodes = len(self.nodes)
        mesh_health = (healthy_nodes / total_nodes) * 100
        
        logger.info(f"🏥 Mesh Health: {mesh_health:.0f}% ({healthy_nodes}/{total_nodes} nodes healthy)")
        logger.info("=" * 80)
    
    async def alert_processor_loop(self):
        """Process and manage alerts"""
        logger.info("🚨 Alert processor started")
        
        while self.running:
            try:
                # Clean old alerts (keep last 100)
                if len(self.alerts) > 100:
                    self.alerts = self.alerts[-100:]
                
                await asyncio.sleep(60)
            except Exception as e:
                logger.error(f"Alert processor error: {e}")
    
    async def send_alert(self, level: AlertLevel, node_name: str, message: str):
        """Send an alert"""
        alert = Alert(
            level=level,
            node_name=node_name,
            message=message,
            timestamp=datetime.now()
        )
        
        self.alerts.append(alert)
        
        # Log with appropriate level
        if level == AlertLevel.CRITICAL:
            logger.critical(str(alert))
        elif level == AlertLevel.ERROR:
            logger.error(str(alert))
        elif level == AlertLevel.WARNING:
            logger.warning(str(alert))
        else:
            logger.info(str(alert))
    
    async def dashboard_loop(self):
        """Display live dashboard in console"""
        logger.info("📺 Dashboard started")
        await asyncio.sleep(45)  # Initial delay
        
        while self.running:
            try:
                self.display_dashboard()
                await asyncio.sleep(60)  # Update every minute
            except Exception as e:
                logger.error(f"Dashboard error: {e}")
                await asyncio.sleep(30)
    
    def display_dashboard(self):
        """Display current mesh status"""
        print("\n" + "=" * 80)
        print("🎯 AURORA GPU MESH - LIVE DASHBOARD")
        print(f"⏰ {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 80)
        
        for node in self.nodes.values():
            status_icon = {
                NodeStatus.HEALTHY: "🟢",
                NodeStatus.DEGRADED: "🟡",
                NodeStatus.UNHEALTHY: "🔴",
                NodeStatus.OFFLINE: "⚫",
                NodeStatus.UNKNOWN: "⚪"
            }
            
            icon = status_icon[node.status]
            print(f"{icon} {node.name}")
            print(f"   Status: {node.status.value:10s} | RT: {node.response_time:6.0f}ms | "
                  f"Success: {node.success_rate:5.1f}% | Score: {node.uptime_score:5.1f}")
            print(f"   Models: {len(node.models)} | Requests: {node.successful_requests}/{node.total_requests}")
            
            if node.last_check:
                age = (datetime.now() - node.last_check).total_seconds()
                print(f"   Last check: {age:.0f}s ago")
            
            if node.error_message:
                print(f"   ⚠️  {node.error_message}")
            print()
        
        # Recent alerts
        recent_alerts = [a for a in self.alerts if (datetime.now() - a.timestamp).seconds < 300]
        if recent_alerts:
            print("🚨 RECENT ALERTS (last 5 min):")
            for alert in recent_alerts[-5:]:
                print(f"   {alert}")
        
        print("=" * 80 + "\n")
    
    async def stop(self):
        """Stop the mesh system"""
        logger.info("🛑 Stopping GPU Mesh System...")
        self.running = False
        
        if self.session:
            await self.session.close()

async def main():
    """Main entry point"""
    mesh = UnifiedGPUMesh()
    
    try:
        logger.info("=" * 80)
        logger.info("🚀 AURORA AI - UNIFIED GPU MESH SYSTEM")
        logger.info("=" * 80)
        logger.info("")
        logger.info("Features:")
        logger.info("  ✅ Continuous health monitoring")
        logger.info("  ✅ Automatic keepalive and recovery")
        logger.info("  ✅ Real-time alerts and logging")
        logger.info("  ✅ Performance tracking")
        logger.info("  ✅ Live dashboard")
        logger.info("")
        logger.info(f"📝 Logs: {LOG_FILE}")
        logger.info("=" * 80)
        logger.info("")
        
        await mesh.start()
        
    except KeyboardInterrupt:
        logger.info("👋 Received shutdown signal")
    finally:
        await mesh.stop()
        logger.info("✅ GPU Mesh System stopped")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Shutdown complete")

