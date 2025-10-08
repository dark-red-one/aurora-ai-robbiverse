"""
System Stats API - CPU, Memory, GPU usage for RobbieBar
"""
from fastapi import APIRouter, HTTPException
import psutil
import subprocess
from typing import Dict

router = APIRouter(prefix="/api/system", tags=["system"])


def get_gpu_usage() -> float:
    """Get GPU usage percentage"""
    try:
        # Try nvidia-smi first
        result = subprocess.run(
            ['nvidia-smi', '--query-gpu=utilization.gpu', '--format=csv,noheader,nounits'],
            capture_output=True,
            text=True,
            timeout=2
        )
        if result.returncode == 0:
            gpu_usage = float(result.stdout.strip().split('\n')[0])
            return gpu_usage
    except (subprocess.TimeoutExpired, FileNotFoundError, ValueError):
        pass
    
    # Fallback: return 0 if no GPU
    return 0.0


@router.get("/stats")
def get_system_stats() -> Dict[str, float]:
    """Get current system resource usage"""
    try:
        cpu_percent = psutil.cpu_percent(interval=0.1)
        memory = psutil.virtual_memory()
        gpu_percent = get_gpu_usage()
        
        return {
            "cpu": round(cpu_percent, 1),
            "memory": round(memory.percent, 1),
            "gpu": round(gpu_percent, 1)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get system stats: {str(e)}")


@router.get("/detailed")
def get_detailed_stats() -> Dict:
    """Get detailed system information"""
    try:
        cpu_percent = psutil.cpu_percent(interval=0.1, percpu=True)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        return {
            "cpu": {
                "overall": round(sum(cpu_percent) / len(cpu_percent), 1),
                "per_core": [round(p, 1) for p in cpu_percent],
                "count": psutil.cpu_count()
            },
            "memory": {
                "percent": round(memory.percent, 1),
                "used_gb": round(memory.used / (1024**3), 2),
                "total_gb": round(memory.total / (1024**3), 2),
                "available_gb": round(memory.available / (1024**3), 2)
            },
            "disk": {
                "percent": round(disk.percent, 1),
                "used_gb": round(disk.used / (1024**3), 2),
                "total_gb": round(disk.total / (1024**3), 2),
                "free_gb": round(disk.free / (1024**3), 2)
            },
            "gpu": {
                "usage": round(get_gpu_usage(), 1)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get detailed stats: {str(e)}")
