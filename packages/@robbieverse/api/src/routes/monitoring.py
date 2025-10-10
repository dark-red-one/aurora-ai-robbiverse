"""
Monitoring Dashboard Routes
============================
System, service, and security monitoring.
Tracks CPU, RAM, GPU, API health, security events.
"""

import os
import psutil
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import logging
import subprocess

from ..services.universal_logger import universal_logger

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/code/api/monitoring", tags=["monitoring"])


# ============================================
# DATABASE CONNECTION
# ============================================

def get_db_connection():
    """Get database connection"""
    db_url = os.getenv(
        "DATABASE_URL",
        "postgresql://allan:fun2Gus!!!@localhost:5432/aurora"
    )
    return psycopg2.connect(db_url)


# ============================================
# SYSTEM METRICS
# ============================================

@router.get("/system/current")
async def get_current_system_metrics():
    """Get current system resource usage"""
    try:
        # CPU
        cpu_percent = psutil.cpu_percent(interval=1)
        cpu_count = psutil.cpu_count()
        
        # Memory
        memory = psutil.virtual_memory()
        memory_percent = memory.percent
        memory_used_gb = memory.used / (1024 ** 3)
        memory_total_gb = memory.total / (1024 ** 3)
        
        # Disk
        disk = psutil.disk_usage('/')
        disk_percent = disk.percent
        disk_used_gb = disk.used / (1024 ** 3)
        disk_total_gb = disk.total / (1024 ** 3)
        
        # GPU (try nvidia-smi)
        gpu_percent = 0
        gpu_memory_used = 0
        gpu_memory_total = 0
        
        try:
            result = subprocess.run(
                ["nvidia-smi", "--query-gpu=utilization.gpu,memory.used,memory.total", 
                 "--format=csv,noheader,nounits"],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0:
                gpu_data = result.stdout.strip().split(',')
                gpu_percent = float(gpu_data[0])
                gpu_memory_used = float(gpu_data[1])
                gpu_memory_total = float(gpu_data[2])
        except:
            pass
        
        # Network
        net_io = psutil.net_io_counters()
        
        metrics = {
            "timestamp": datetime.now().isoformat(),
            "cpu": {
                "percent": round(cpu_percent, 1),
                "count": cpu_count,
                "status": _get_status_color(cpu_percent)
            },
            "memory": {
                "percent": round(memory_percent, 1),
                "used_gb": round(memory_used_gb, 2),
                "total_gb": round(memory_total_gb, 2),
                "status": _get_status_color(memory_percent)
            },
            "disk": {
                "percent": round(disk_percent, 1),
                "used_gb": round(disk_used_gb, 2),
                "total_gb": round(disk_total_gb, 2),
                "status": _get_status_color(disk_percent)
            },
            "gpu": {
                "percent": round(gpu_percent, 1),
                "memory_used_mb": round(gpu_memory_used, 0),
                "memory_total_mb": round(gpu_memory_total, 0),
                "available": gpu_memory_total > 0,
                "status": _get_status_color(gpu_percent) if gpu_memory_total > 0 else "unknown"
            },
            "network": {
                "bytes_sent": net_io.bytes_sent,
                "bytes_recv": net_io.bytes_recv,
                "packets_sent": net_io.packets_sent,
                "packets_recv": net_io.packets_recv
            }
        }
        
        # Log metrics to database
        universal_logger.log_monitoring_metric("system", "cpu_percent", cpu_percent, "percent")
        universal_logger.log_monitoring_metric("system", "memory_percent", memory_percent, "percent")
        universal_logger.log_monitoring_metric("system", "disk_percent", disk_percent, "percent")
        if gpu_memory_total > 0:
            universal_logger.log_monitoring_metric("system", "gpu_percent", gpu_percent, "percent")
        
        return metrics
        
    except Exception as e:
        logger.error(f"Failed to get system metrics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/system/history")
async def get_system_metrics_history(
    hours: int = 1,
    metric_name: Optional[str] = None
):
    """
    Get historical system metrics
    
    Args:
        hours: Number of hours of history (default 1)
        metric_name: Optional filter for specific metric
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Query monitoring_metrics table
        query = """
            SELECT 
                timestamp, metric_name, metric_value, metric_unit
            FROM monitoring_metrics
            WHERE metric_type = 'system'
            AND timestamp >= NOW() - INTERVAL '%s hours'
        """
        params = [hours]
        
        if metric_name:
            query += " AND metric_name = %s"
            params.append(metric_name)
        
        query += " ORDER BY timestamp ASC"
        
        cursor.execute(query, params)
        results = cursor.fetchall()
        
        # Format results
        history = []
        for row in results:
            history.append({
                'timestamp': row['timestamp'].isoformat(),
                'metric_name': row['metric_name'],
                'value': float(row['metric_value']),
                'unit': row['metric_unit']
            })
        
        cursor.close()
        conn.close()
        
        return {
            "history": history,
            "count": len(history),
            "hours": hours,
            "metric_name": metric_name
        }
        
    except Exception as e:
        logger.error(f"Failed to get metrics history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# SERVICE HEALTH
# ============================================

@router.get("/services/health")
async def get_services_health():
    """Get health status of all services"""
    try:
        # Check each service
        services = {
            "api": await _check_api_health(),
            "database": await _check_database_health(),
            "ollama": await _check_ollama_health(),
            "gatekeeper": await _check_gatekeeper_health()
        }
        
        # Overall status
        all_healthy = all(s['status'] == 'healthy' for s in services.values())
        
        return {
            "overall_status": "healthy" if all_healthy else "degraded",
            "services": services,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to check services health: {e}")
        return {
            "overall_status": "error",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }


async def _check_api_health() -> Dict[str, Any]:
    """Check API health"""
    return {
        "status": "healthy",
        "uptime_seconds": int(psutil.boot_time()),
        "response_time_ms": 0  # Placeholder
    }


async def _check_database_health() -> Dict[str, Any]:
    """Check database connectivity"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        cursor.close()
        conn.close()
        
        return {
            "status": "healthy",
            "connected": True
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "connected": False,
            "error": str(e)
        }


async def _check_ollama_health() -> Dict[str, Any]:
    """Check Ollama service"""
    try:
        import httpx
        ollama_url = os.getenv("OLLAMA_URL", "http://localhost:11434")
        
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{ollama_url}/api/tags")
            
            if response.status_code == 200:
                models = response.json().get('models', [])
                return {
                    "status": "healthy",
                    "available": True,
                    "models_loaded": len(models)
                }
            else:
                return {
                    "status": "degraded",
                    "available": False
                }
                
    except Exception as e:
        return {
            "status": "unhealthy",
            "available": False,
            "error": str(e)
        }


async def _check_gatekeeper_health() -> Dict[str, Any]:
    """Check gatekeeper service"""
    # Simple check - could be enhanced
    return {
        "status": "healthy",
        "active": True
    }


# ============================================
# SECURITY EVENTS
# ============================================

@router.get("/security/recent-blocks")
async def get_recent_security_blocks(limit: int = 20):
    """Get recent gatekeeper security blocks"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute("""
            SELECT 
                id, request_id, timestamp, block_reason,
                block_category, severity, source,
                triggered_killswitch
            FROM gatekeeper_blocks
            ORDER BY timestamp DESC
            LIMIT %s
        """, (limit,))
        
        results = cursor.fetchall()
        
        blocks = []
        for row in results:
            blocks.append({
                'id': str(row['id']),
                'request_id': str(row['request_id']) if row['request_id'] else None,
                'timestamp': row['timestamp'].isoformat(),
                'reason': row['block_reason'],
                'category': row['block_category'],
                'severity': row['severity'],
                'source': row['source'],
                'triggered_killswitch': row['triggered_killswitch']
            })
        
        cursor.close()
        conn.close()
        
        return {
            "blocks": blocks,
            "count": len(blocks),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to get security blocks: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/security/stats")
async def get_security_stats(hours: int = 24):
    """Get security statistics for the last N hours"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get block counts by category
        cursor.execute("""
            SELECT 
                block_category,
                COUNT(*) as count,
                MAX(severity) as max_severity
            FROM gatekeeper_blocks
            WHERE timestamp >= NOW() - INTERVAL '%s hours'
            GROUP BY block_category
            ORDER BY count DESC
        """, (hours,))
        
        category_counts = cursor.fetchall()
        
        # Get total blocks
        cursor.execute("""
            SELECT COUNT(*) as total
            FROM gatekeeper_blocks
            WHERE timestamp >= NOW() - INTERVAL '%s hours'
        """, (hours,))
        
        total_blocks = cursor.fetchone()['total']
        
        # Get killswitch activations
        cursor.execute("""
            SELECT COUNT(*) as count
            FROM gatekeeper_blocks
            WHERE triggered_killswitch = TRUE
            AND timestamp >= NOW() - INTERVAL '%s hours'
        """, (hours,))
        
        killswitch_triggers = cursor.fetchone()['count']
        
        cursor.close()
        conn.close()
        
        return {
            "total_blocks": total_blocks,
            "killswitch_triggers": killswitch_triggers,
            "blocks_by_category": [dict(row) for row in category_counts],
            "hours": hours,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to get security stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# AI PERFORMANCE
# ============================================

@router.get("/ai/stats")
async def get_ai_stats(hours: int = 1):
    """Get AI service statistics"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get request counts by service
        cursor.execute("""
            SELECT 
                ai_service,
                COUNT(*) as count,
                AVG(processing_time_ms) as avg_time_ms,
                MAX(processing_time_ms) as max_time_ms,
                SUM(COALESCE(tokens_used, 0)) as total_tokens
            FROM ai_request_logs
            WHERE timestamp >= NOW() - INTERVAL '%s hours'
            GROUP BY ai_service
            ORDER BY count DESC
        """, (hours,))
        
        service_stats = cursor.fetchall()
        
        # Get gatekeeper approval rate
        cursor.execute("""
            SELECT 
                gatekeeper_status,
                COUNT(*) as count
            FROM ai_request_logs
            WHERE timestamp >= NOW() - INTERVAL '%s hours'
            AND gatekeeper_status IS NOT NULL
            GROUP BY gatekeeper_status
        """, (hours,))
        
        gatekeeper_stats = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return {
            "service_stats": [dict(row) for row in service_stats],
            "gatekeeper_stats": [dict(row) for row in gatekeeper_stats],
            "hours": hours,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to get AI stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# HELPER FUNCTIONS
# ============================================

def _get_status_color(percent: float) -> str:
    """Get status color based on percentage"""
    if percent < 70:
        return "green"
    elif percent < 85:
        return "yellow"
    else:
        return "red"


