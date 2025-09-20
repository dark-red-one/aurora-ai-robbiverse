#!/usr/bin/env python3
"""
Aurora System Monitor - Enterprise-grade monitoring
Linus approved monitoring system
"""

import psutil
import time
import json
from datetime import datetime
import subprocess

class AuroraSystemMonitor:
    def __init__(self):
        self.metrics = {}
        
    def get_system_metrics(self):
        """Get comprehensive system metrics"""
        return {
            "timestamp": datetime.now().isoformat(),
            "cpu": {
                "usage_percent": psutil.cpu_percent(interval=1),
                "count": psutil.cpu_count(),
                "load_avg": psutil.getloadavg()
            },
            "memory": {
                "total": psutil.virtual_memory().total,
                "available": psutil.virtual_memory().available,
                "percent": psutil.virtual_memory().percent
            },
            "disk": {
                "total": psutil.disk_usage('/').total,
                "used": psutil.disk_usage('/').used,
                "free": psutil.disk_usage('/').free,
                "percent": psutil.disk_usage('/').percent
            },
            "gpu": self.get_gpu_metrics(),
            "network": self.get_network_metrics(),
            "services": self.get_service_status()
        }
    
    def get_gpu_metrics(self):
        """Get GPU metrics using nvidia-smi"""
        try:
            result = subprocess.run(['nvidia-smi', '--query-gpu=index,name,memory.used,memory.total,utilization.gpu,temperature.gpu', '--format=csv,noheader,nounits'], 
                                  capture_output=True, text=True)
            gpus = []
            for line in result.stdout.strip().split('\n'):
                if line:
                    parts = line.split(', ')
                    gpus.append({
                        "index": int(parts[0]),
                        "name": parts[1],
                        "memory_used": int(parts[2]),
                        "memory_total": int(parts[3]),
                        "utilization": int(parts[4]),
                        "temperature": int(parts[5])
                    })
            return gpus
        except:
            return []
    
    def get_network_metrics(self):
        """Get network interface metrics"""
        net_io = psutil.net_io_counters()
        return {
            "bytes_sent": net_io.bytes_sent,
            "bytes_recv": net_io.bytes_recv,
            "packets_sent": net_io.packets_sent,
            "packets_recv": net_io.packets_recv
        }
    
    def get_service_status(self):
        """Check status of Aurora services"""
        services = {
            "aurora_backend": self.check_service("python3 -m uvicorn backend.main:app"),
            "gpu_coordinator": self.check_service("python3 gpu_mesh/coordinator.py"),
            "gpu_dashboard": self.check_service("python3 gpu-mesh-dashboard.py"),
            "nginx": self.check_service("nginx"),
            "postgresql": self.check_service("postgresql")
        }
        return services
    
    def check_service(self, service_cmd):
        """Check if a service is running"""
        try:
            result = subprocess.run(['pgrep', '-f', service_cmd], capture_output=True)
            return result.returncode == 0
        except:
            return False
    
    def save_metrics(self):
        """Save metrics to log file"""
        metrics = self.get_system_metrics()
        with open('/workspace/aurora/logs/system_metrics.json', 'a') as f:
            f.write(json.dumps(metrics) + '\n')

if __name__ == "__main__":
    monitor = AuroraSystemMonitor()
    monitor.save_metrics()
    print("✅ System metrics saved - Linus approved!")
