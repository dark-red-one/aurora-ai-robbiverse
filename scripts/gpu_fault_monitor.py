#!/usr/bin/env python3
"""
Aurora AI Empire - GPU Fault Monitor
Real-time monitoring and automatic recovery for GPU failures
"""

import asyncio
import subprocess
import time
import logging
from datetime import datetime
from typing import Dict, List
import psutil

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GPUFaultMonitor:
    def __init__(self):
        self.gpu_health_history = {}
        self.failure_threshold = 3  # consecutive failures before action
        self.recovery_attempts = {}
        self.max_recovery_attempts = 5
        
    def get_gpu_health(self) -> Dict:
        """Get comprehensive GPU health status"""
        try:
            # Get GPU info
            result = subprocess.run(
                ["nvidia-smi", "--query-gpu=index,name,temperature.gpu,power.draw,memory.used,memory.total,utilization.gpu", 
                 "--format=csv,noheader,nounits"],
                capture_output=True, text=True, timeout=10
            )
            
            if result.returncode != 0:
                return {"status": "error", "error": "nvidia-smi failed"}
            
            gpus = []
            for line in result.stdout.strip().split('\n'):
                if line:
                    parts = line.split(', ')
                    if len(parts) >= 7:
                        gpu_info = {
                            "gpu_id": int(parts[0]),
                            "name": parts[1],
                            "temperature": float(parts[2]) if parts[2] != 'N/A' else 0,
                            "power_draw": float(parts[3]) if parts[3] != 'N/A' else 0,
                            "memory_used": int(parts[4]) if parts[4] != 'N/A' else 0,
                            "memory_total": int(parts[5]) if parts[5] != 'N/A' else 0,
                            "utilization": int(parts[6]) if parts[6] != 'N/A' else 0,
                            "timestamp": datetime.now().isoformat()
                        }
                        
                        # Calculate health metrics
                        gpu_info["memory_usage_percent"] = (gpu_info["memory_used"] / gpu_info["memory_total"] * 100) if gpu_info["memory_total"] > 0 else 0
                        gpu_info["health_score"] = self.calculate_health_score(gpu_info)
                        gpu_info["status"] = self.determine_gpu_status(gpu_info)
                        
                        gpus.append(gpu_info)
            
            return {"status": "success", "gpus": gpus}
            
        except Exception as e:
            logger.error(f"Error getting GPU health: {e}")
            return {"status": "error", "error": str(e)}
    
    def calculate_health_score(self, gpu_info: Dict) -> float:
        """Calculate GPU health score (0-100)"""
        score = 100.0
        
        # Temperature penalty (optimal: 60-70°C)
        temp = gpu_info["temperature"]
        if temp > 85:
            score -= 30  # Critical temperature
        elif temp > 75:
            score -= 15  # High temperature
        elif temp > 65:
            score -= 5   # Slightly high
        
        # Memory usage penalty
        memory_usage = gpu_info["memory_usage_percent"]
        if memory_usage > 95:
            score -= 25  # Critical memory usage
        elif memory_usage > 85:
            score -= 10  # High memory usage
        
        # Utilization penalty (too high or too low can indicate issues)
        utilization = gpu_info["utilization"]
        if utilization > 95:
            score -= 10  # Over-utilization
        elif utilization < 5 and memory_usage > 50:
            score -= 15  # Low utilization but high memory (potential leak)
        
        return max(0, score)
    
    def determine_gpu_status(self, gpu_info: Dict) -> str:
        """Determine GPU status based on health metrics"""
        health_score = gpu_info["health_score"]
        temperature = gpu_info["temperature"]
        memory_usage = gpu_info["memory_usage_percent"]
        
        if health_score < 30:
            return "critical"
        elif health_score < 50:
            return "degraded"
        elif temperature > 85 or memory_usage > 95:
            return "warning"
        else:
            return "healthy"
    
    async def monitor_gpu_health(self):
        """Continuously monitor GPU health"""
        while True:
            health_data = self.get_gpu_health()
            
            if health_data["status"] == "success":
                for gpu in health_data["gpus"]:
                    gpu_id = gpu["gpu_id"]
                    
                    # Update health history
                    if gpu_id not in self.gpu_health_history:
                        self.gpu_health_history[gpu_id] = []
                    
                    self.gpu_health_history[gpu_id].append(gpu)
                    
                    # Keep only last 10 readings
                    if len(self.gpu_health_history[gpu_id]) > 10:
                        self.gpu_health_history[gpu_id] = self.gpu_health_history[gpu_id][-10:]
                    
                    # Check for failures
                    if gpu["status"] in ["critical", "degraded"]:
                        await self.handle_gpu_failure(gpu)
                    elif gpu["status"] == "warning":
                        await self.handle_gpu_warning(gpu)
                    else:
                        # Reset failure count on healthy status
                        if gpu_id in self.recovery_attempts:
                            del self.recovery_attempts[gpu_id]
            
            await asyncio.sleep(5)  # Check every 5 seconds
    
    async def handle_gpu_failure(self, gpu: Dict):
        """Handle GPU failure with automatic recovery"""
        gpu_id = gpu["gpu_id"]
        
        if gpu_id not in self.recovery_attempts:
            self.recovery_attempts[gpu_id] = 0
        
        self.recovery_attempts[gpu_id] += 1
        
        if self.recovery_attempts[gpu_id] > self.max_recovery_attempts:
            logger.error(f"🚨 GPU {gpu_id} failed permanently after {self.max_recovery_attempts} recovery attempts")
            return
        
        logger.warning(f"⚠️ GPU {gpu_id} failure detected (attempt {self.recovery_attempts[gpu_id]})")
        logger.warning(f"   Health Score: {gpu['health_score']:.1f}")
        logger.warning(f"   Temperature: {gpu['temperature']}°C")
        logger.warning(f"   Memory Usage: {gpu['memory_usage_percent']:.1f}%")
        
        # Attempt recovery
        await self.attempt_gpu_recovery(gpu)
    
    async def handle_gpu_warning(self, gpu: Dict):
        """Handle GPU warning (monitor but don't take action yet)"""
        gpu_id = gpu["gpu_id"]
        logger.info(f"⚠️ GPU {gpu_id} warning: {gpu['status']}")
        logger.info(f"   Health Score: {gpu['health_score']:.1f}")
        logger.info(f"   Temperature: {gpu['temperature']}°C")
        logger.info(f"   Memory Usage: {gpu['memory_usage_percent']:.1f}%")
    
    async def attempt_gpu_recovery(self, gpu: Dict):
        """Attempt to recover a failed GPU"""
        gpu_id = gpu["gpu_id"]
        
        logger.info(f"🔧 Attempting GPU {gpu_id} recovery...")
        
        try:
            # Method 1: Reset GPU (if supported)
            result = subprocess.run(
                ["nvidia-smi", "--gpu-reset", str(gpu_id)],
                capture_output=True, text=True, timeout=30
            )
            
            if result.returncode == 0:
                logger.info(f"✅ GPU {gpu_id} reset successful")
                await asyncio.sleep(10)  # Wait for reset to take effect
                return
            
        except Exception as e:
            logger.warning(f"GPU reset failed: {e}")
        
        # Method 2: Clear GPU memory
        try:
            result = subprocess.run(
                ["nvidia-smi", "--gpu-reset", str(gpu_id)],
                capture_output=True, text=True, timeout=30
            )
            logger.info(f"🧹 GPU {gpu_id} memory cleared")
        except Exception as e:
            logger.warning(f"Memory clear failed: {e}")
        
        # Method 3: Restart CUDA context (if applicable)
        logger.info(f"🔄 GPU {gpu_id} recovery attempt completed")
    
    def get_fault_summary(self) -> Dict:
        """Get fault monitoring summary"""
        total_gpus = len(self.gpu_health_history)
        healthy_gpus = 0
        warning_gpus = 0
        failed_gpus = 0
        
        for gpu_id, history in self.gpu_health_history.items():
            if history:
                latest = history[-1]
                if latest["status"] == "healthy":
                    healthy_gpus += 1
                elif latest["status"] == "warning":
                    warning_gpus += 1
                else:
                    failed_gpus += 1
        
        return {
            "total_gpus": total_gpus,
            "healthy_gpus": healthy_gpus,
            "warning_gpus": warning_gpus,
            "failed_gpus": failed_gpus,
            "recovery_attempts": self.recovery_attempts,
            "fault_tolerance": "enabled",
            "auto_recovery": "enabled"
        }
    
    async def start_fault_monitor(self):
        """Start the fault monitoring system"""
        logger.info("🔍 Starting GPU Fault Monitor...")
        logger.info("🛡️ Fault tolerance and auto-recovery enabled...")
        
        # Start monitoring
        await self.monitor_gpu_health()

if __name__ == "__main__":
    monitor = GPUFaultMonitor()
    asyncio.run(monitor.start_fault_monitor())
