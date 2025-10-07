#!/usr/bin/env python3
"""
Aurora AI GPU Fault Monitor
Real-time GPU health monitoring with automatic failover detection
"""

import asyncio
import json
import logging
import psutil
import subprocess
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import aiohttp
import redis
from dataclasses import dataclass

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class GPUHealthMetrics:
    gpu_id: str
    utilization: float
    memory_used: float
    memory_total: float
    temperature: float
    power_draw: float
    clock_speed: float
    status: str
    last_check: datetime

class GPUFaultMonitor:
    def __init__(self, node_id: str, redis_host="localhost", redis_port=6379):
        self.node_id = node_id
        self.redis_client = redis.Redis(host=redis_host, port=redis_port, decode_responses=True)
        self.gpu_metrics: List[GPUHealthMetrics] = []
        self.running = False
        
        # Health thresholds
        self.thresholds = {
            "utilization_warning": 85.0,
            "utilization_critical": 95.0,
            "temperature_warning": 80.0,
            "temperature_critical": 90.0,
            "memory_warning": 85.0,
            "memory_critical": 95.0,
            "power_warning": 90.0,
            "power_critical": 95.0
        }
        
        # Fault detection
        self.fault_history: Dict[str, List[datetime]] = {}
        self.consecutive_failures = 0
        self.last_successful_check = datetime.now()

    async def start(self):
        """Start the GPU fault monitor"""
        logger.info(f"🔍 Starting GPU Fault Monitor for node {self.node_id}")
        self.running = True
        
        # Start monitoring tasks
        asyncio.create_task(self._continuous_monitoring())
        asyncio.create_task(self._health_reporter())
        asyncio.create_task(self._fault_analyzer())
        
        logger.info("✅ GPU Fault Monitor started successfully")

    async def _continuous_monitoring(self):
        """Continuously monitor GPU health"""
        while self.running:
            try:
                await self._check_gpu_health()
                self.consecutive_failures = 0
                self.last_successful_check = datetime.now()
                
            except Exception as e:
                logger.error(f"❌ GPU health check failed: {e}")
                self.consecutive_failures += 1
                
                # Report failure to coordinator
                await self._report_fault("health_check_failure", str(e))
            
            await asyncio.sleep(10)  # Check every 10 seconds

    async def _check_gpu_health(self):
        """Check health of all GPUs on this node"""
        try:
            # Get GPU information using nvidia-smi
            gpu_info = await self._get_nvidia_smi_info()
            
            if not gpu_info:
                logger.warning("⚠️ No GPU information available")
                return
            
            # Process each GPU
            current_metrics = []
            for gpu_data in gpu_info:
                metrics = GPUHealthMetrics(
                    gpu_id=gpu_data["id"],
                    utilization=gpu_data["utilization"],
                    memory_used=gpu_data["memory_used"],
                    memory_total=gpu_data["memory_total"],
                    temperature=gpu_data["temperature"],
                    power_draw=gpu_data["power_draw"],
                    clock_speed=gpu_data["clock_speed"],
                    status="healthy",
                    last_check=datetime.now()
                )
                
                # Check for issues
                await self._evaluate_gpu_health(metrics)
                current_metrics.append(metrics)
            
            self.gpu_metrics = current_metrics
            
            # Store metrics in Redis
            await self._store_metrics(current_metrics)
            
        except Exception as e:
            logger.error(f"❌ Error checking GPU health: {e}")
            raise

    async def _get_nvidia_smi_info(self) -> List[Dict]:
        """Get GPU information from nvidia-smi"""
        try:
            # Use nvidia-smi with JSON output
            cmd = [
                "nvidia-smi",
                "--query-gpu=index,utilization.gpu,memory.used,memory.total,temperature.gpu,power.draw,clocks.current.graphics",
                "--format=csv,noheader,nounits"
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
            
            if result.returncode != 0:
                logger.error(f"❌ nvidia-smi failed: {result.stderr}")
                return []
            
            gpu_info = []
            for line in result.stdout.strip().split('\n'):
                if line.strip():
                    parts = [p.strip() for p in line.split(',')]
                    if len(parts) >= 7:
                        gpu_info.append({
                            "id": parts[0],
                            "utilization": float(parts[1]) if parts[1] != "N/A" else 0.0,
                            "memory_used": float(parts[2]) if parts[2] != "N/A" else 0.0,
                            "memory_total": float(parts[3]) if parts[3] != "N/A" else 0.0,
                            "temperature": float(parts[4]) if parts[4] != "N/A" else 0.0,
                            "power_draw": float(parts[5]) if parts[5] != "N/A" else 0.0,
                            "clock_speed": float(parts[6]) if parts[6] != "N/A" else 0.0
                        })
            
            return gpu_info
            
        except subprocess.TimeoutExpired:
            logger.error("❌ nvidia-smi command timed out")
            return []
        except Exception as e:
            logger.error(f"❌ Error running nvidia-smi: {e}")
            return []

    async def _evaluate_gpu_health(self, metrics: GPUHealthMetrics):
        """Evaluate GPU health against thresholds"""
        issues = []
        
        # Check utilization
        if metrics.utilization >= self.thresholds["utilization_critical"]:
            issues.append(f"CRITICAL: GPU {metrics.gpu_id} utilization {metrics.utilization}%")
            metrics.status = "critical"
        elif metrics.utilization >= self.thresholds["utilization_warning"]:
            issues.append(f"WARNING: GPU {metrics.gpu_id} utilization {metrics.utilization}%")
            metrics.status = "warning"
        
        # Check temperature
        if metrics.temperature >= self.thresholds["temperature_critical"]:
            issues.append(f"CRITICAL: GPU {metrics.gpu_id} temperature {metrics.temperature}°C")
            metrics.status = "critical"
        elif metrics.temperature >= self.thresholds["temperature_warning"]:
            issues.append(f"WARNING: GPU {metrics.gpu_id} temperature {metrics.temperature}°C")
            if metrics.status == "healthy":
                metrics.status = "warning"
        
        # Check memory usage
        memory_percent = (metrics.memory_used / metrics.memory_total) * 100
        if memory_percent >= self.thresholds["memory_critical"]:
            issues.append(f"CRITICAL: GPU {metrics.gpu_id} memory {memory_percent:.1f}%")
            metrics.status = "critical"
        elif memory_percent >= self.thresholds["memory_warning"]:
            issues.append(f"WARNING: GPU {metrics.gpu_id} memory {memory_percent:.1f}%")
            if metrics.status == "healthy":
                metrics.status = "warning"
        
        # Check power draw
        if metrics.power_draw >= self.thresholds["power_critical"]:
            issues.append(f"CRITICAL: GPU {metrics.gpu_id} power {metrics.power_draw}W")
            metrics.status = "critical"
        elif metrics.power_draw >= self.thresholds["power_warning"]:
            issues.append(f"WARNING: GPU {metrics.gpu_id} power {metrics.power_draw}W")
            if metrics.status == "healthy":
                metrics.status = "warning"
        
        # Report issues
        if issues:
            for issue in issues:
                logger.warning(f"⚠️ {issue}")
                await self._report_fault("gpu_issue", issue)

    async def _store_metrics(self, metrics: List[GPUHealthMetrics]):
        """Store GPU metrics in Redis"""
        try:
            metrics_data = {
                "node_id": self.node_id,
                "timestamp": datetime.now().isoformat(),
                "gpus": []
            }
            
            for gpu in metrics:
                gpu_data = {
                    "gpu_id": gpu.gpu_id,
                    "utilization": gpu.utilization,
                    "memory_used": gpu.memory_used,
                    "memory_total": gpu.memory_total,
                    "memory_percent": (gpu.memory_used / gpu.memory_total) * 100,
                    "temperature": gpu.temperature,
                    "power_draw": gpu.power_draw,
                    "clock_speed": gpu.clock_speed,
                    "status": gpu.status,
                    "last_check": gpu.last_check.isoformat()
                }
                metrics_data["gpus"].append(gpu_data)
            
            # Store in Redis with expiration
            key = f"gpu_metrics:{self.node_id}"
            self.redis_client.setex(key, 300, json.dumps(metrics_data))  # 5 minute expiration
            
        except Exception as e:
            logger.error(f"❌ Error storing metrics: {e}")

    async def _health_reporter(self):
        """Report health status to the coordinator"""
        while self.running:
            try:
                # Calculate overall node health
                if not self.gpu_metrics:
                    overall_status = "unknown"
                elif any(gpu.status == "critical" for gpu in self.gpu_metrics):
                    overall_status = "critical"
                elif any(gpu.status == "warning" for gpu in self.gpu_metrics):
                    overall_status = "warning"
                else:
                    overall_status = "healthy"
                
                # Calculate performance score
                performance_score = await self._calculate_performance_score()
                
                # Report to coordinator
                health_report = {
                    "node_id": self.node_id,
                    "status": overall_status,
                    "gpu_count": len(self.gpu_metrics),
                    "performance_score": performance_score,
                    "gpu_utilization": sum(gpu.utilization for gpu in self.gpu_metrics) / len(self.gpu_metrics) if self.gpu_metrics else 0,
                    "memory_used": sum(gpu.memory_used for gpu in self.gpu_metrics) / len(self.gpu_metrics) if self.gpu_metrics else 0,
                    "timestamp": datetime.now().isoformat(),
                    "consecutive_failures": self.consecutive_failures,
                    "last_successful_check": self.last_successful_check.isoformat()
                }
                
                # Store health report
                self.redis_client.hset("node_health", self.node_id, json.dumps(health_report))
                
                await asyncio.sleep(30)  # Report every 30 seconds
                
            except Exception as e:
                logger.error(f"❌ Error reporting health: {e}")

    async def _calculate_performance_score(self) -> float:
        """Calculate overall node performance score"""
        if not self.gpu_metrics:
            return 0.0
        
        total_score = 0.0
        for gpu in self.gpu_metrics:
            # Base score
            score = 1.0
            
            # Penalize high utilization
            if gpu.utilization > 90:
                score *= 0.5
            elif gpu.utilization > 80:
                score *= 0.8
            
            # Penalize high temperature
            if gpu.temperature > 85:
                score *= 0.7
            elif gpu.temperature > 75:
                score *= 0.9
            
            # Penalize high memory usage
            memory_percent = (gpu.memory_used / gpu.memory_total) * 100
            if memory_percent > 90:
                score *= 0.6
            elif memory_percent > 80:
                score *= 0.8
            
            total_score += score
        
        return total_score / len(self.gpu_metrics)

    async def _fault_analyzer(self):
        """Analyze fault patterns and trends"""
        while self.running:
            try:
                # Check for consecutive failures
                if self.consecutive_failures >= 5:
                    await self._report_fault("consecutive_failures", f"{self.consecutive_failures} consecutive failures")
                
                # Check for stale metrics
                if self.gpu_metrics:
                    oldest_check = min(gpu.last_check for gpu in self.gpu_metrics)
                    if datetime.now() - oldest_check > timedelta(minutes=5):
                        await self._report_fault("stale_metrics", "GPU metrics are stale")
                
                await asyncio.sleep(60)  # Analyze every minute
                
            except Exception as e:
                logger.error(f"❌ Error in fault analyzer: {e}")

    async def _report_fault(self, fault_type: str, fault_description: str):
        """Report a fault to the coordinator"""
        try:
            fault_report = {
                "node_id": self.node_id,
                "fault_type": fault_type,
                "description": fault_description,
                "timestamp": datetime.now().isoformat(),
                "severity": self._determine_severity(fault_type)
            }
            
            # Store fault report
            fault_key = f"fault:{self.node_id}:{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            self.redis_client.setex(fault_key, 3600, json.dumps(fault_report))  # 1 hour expiration
            
            # Add to fault history
            if fault_type not in self.fault_history:
                self.fault_history[fault_type] = []
            
            self.fault_history[fault_type].append(datetime.now())
            
            # Keep only recent faults (last 24 hours)
            cutoff = datetime.now() - timedelta(hours=24)
            self.fault_history[fault_type] = [
                fault_time for fault_time in self.fault_history[fault_type]
                if fault_time > cutoff
            ]
            
            logger.error(f"🚨 FAULT REPORTED: {fault_type} - {fault_description}")
            
        except Exception as e:
            logger.error(f"❌ Error reporting fault: {e}")

    def _determine_severity(self, fault_type: str) -> str:
        """Determine fault severity"""
        critical_faults = ["consecutive_failures", "stale_metrics", "health_check_failure"]
        warning_faults = ["gpu_issue"]
        
        if fault_type in critical_faults:
            return "critical"
        elif fault_type in warning_faults:
            return "warning"
        else:
            return "info"

    async def stop(self):
        """Stop the GPU fault monitor"""
        logger.info("🛑 Stopping GPU Fault Monitor...")
        self.running = False

# Health endpoint for coordinator
async def health_endpoint(request):
    """HTTP health endpoint for the coordinator to check"""
    try:
        monitor = request.app['monitor']
        
        # Get current metrics
        health_data = {
            "node_id": monitor.node_id,
            "status": "healthy" if monitor.consecutive_failures < 3 else "degraded",
            "gpu_count": len(monitor.gpu_metrics),
            "performance_score": await monitor._calculate_performance_score(),
            "gpu_utilization": sum(gpu.utilization for gpu in monitor.gpu_metrics) / len(monitor.gpu_metrics) if monitor.gpu_metrics else 0,
            "memory_used": sum(gpu.memory_used for gpu in monitor.gpu_metrics) / len(monitor.gpu_metrics) if monitor.gpu_metrics else 0,
            "timestamp": datetime.now().isoformat()
        }
        
        return aiohttp.web.json_response(health_data)
        
    except Exception as e:
        logger.error(f"❌ Health endpoint error: {e}")
        return aiohttp.web.json_response({"error": str(e)}, status=500)

# Main execution
async def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="Aurora AI GPU Fault Monitor")
    parser.add_argument("--node-id", required=True, help="Unique node identifier")
    parser.add_argument("--redis-host", default="localhost", help="Redis host")
    parser.add_argument("--redis-port", type=int, default=6379, help="Redis port")
    args = parser.parse_args()
    
    monitor = GPUFaultMonitor(
        node_id=args.node_id,
        redis_host=args.redis_host,
        redis_port=args.redis_port
    )
    
    try:
        await monitor.start()
        
        # Keep running
        while True:
            await asyncio.sleep(60)
            
    except KeyboardInterrupt:
        logger.info("🛑 Received shutdown signal")
    finally:
        await monitor.stop()

if __name__ == "__main__":
    asyncio.run(main())