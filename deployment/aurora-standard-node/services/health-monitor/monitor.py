#!/usr/bin/env python3
"""
Aurora Node Health Monitor
Reports node health status to lead node
"""

import os
import time
import logging
import psutil
import docker
import requests
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('health-monitor')

# Configuration
NODE_NAME = os.getenv('NODE_NAME', 'unknown')
NODE_ROLE = os.getenv('NODE_ROLE', 'compute')
LEAD_NODE_URL = os.getenv('LEAD_NODE_URL', 'http://10.0.0.1:9091')
REPORT_INTERVAL = int(os.getenv('HEALTH_REPORT_INTERVAL', '30'))

def get_system_metrics():
    """Collect system-level metrics"""
    try:
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        return {
            'cpu_percent': cpu_percent,
            'memory_total_gb': round(memory.total / (1024**3), 2),
            'memory_used_gb': round(memory.used / (1024**3), 2),
            'memory_percent': memory.percent,
            'disk_total_gb': round(disk.total / (1024**3), 2),
            'disk_used_gb': round(disk.used / (1024**3), 2),
            'disk_percent': disk.percent,
            'load_average': os.getloadavg() if hasattr(os, 'getloadavg') else [0, 0, 0]
        }
    except Exception as e:
        logger.error(f"Failed to get system metrics: {e}")
        return {}

def get_container_health():
    """Check health of Docker containers"""
    try:
        client = docker.from_env()
        containers = client.containers.list()
        
        health_status = {}
        for container in containers:
            name = container.name
            status = container.status
            health = container.attrs.get('State', {}).get('Health', {}).get('Status', 'unknown')
            
            health_status[name] = {
                'status': status,
                'health': health
            }
        
        return health_status
    except Exception as e:
        logger.error(f"Failed to get container health: {e}")
        return {}

def get_postgres_status():
    """Check PostgreSQL replication status"""
    try:
        import psycopg2
        
        conn = psycopg2.connect(
            host='localhost',
            port=5432,
            user='robbie',
            password=os.getenv('DB_PASSWORD'),
            database='aurora'
        )
        
        with conn.cursor() as cur:
            # Check if this is a replica
            cur.execute("SELECT pg_is_in_recovery()")
            is_replica = cur.fetchone()[0]
            
            status = {
                'mode': 'replica' if is_replica else 'primary',
                'connected': True
            }
            
            if is_replica:
                # Get replication lag
                cur.execute("SELECT EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp()))")
                lag = cur.fetchone()[0]
                status['replication_lag_seconds'] = float(lag) if lag else 0
        
        conn.close()
        return status
        
    except Exception as e:
        logger.error(f"Failed to get PostgreSQL status: {e}")
        return {'connected': False, 'error': str(e)}

def calculate_health_score(system_metrics, container_health, postgres_status):
    """Calculate overall health score (0-100)"""
    score = 100
    
    # CPU penalty (over 80%)
    if system_metrics.get('cpu_percent', 0) > 80:
        score -= 10
    
    # Memory penalty (over 85%)
    if system_metrics.get('memory_percent', 0) > 85:
        score -= 15
    
    # Disk penalty (over 90%)
    if system_metrics.get('disk_percent', 0) > 90:
        score -= 20
    
    # Container health penalty
    for name, health in container_health.items():
        if health['status'] != 'running':
            score -= 5
        if health['health'] == 'unhealthy':
            score -= 10
    
    # PostgreSQL penalty
    if not postgres_status.get('connected'):
        score -= 30
    elif postgres_status.get('mode') == 'replica':
        lag = postgres_status.get('replication_lag_seconds', 0)
        if lag > 10:
            score -= 15
        elif lag > 5:
            score -= 5
    
    return max(0, min(100, score))

def report_health():
    """Collect and report health to lead node"""
    logger.info(f"Collecting health metrics for {NODE_NAME}")
    
    try:
        # Collect metrics
        system_metrics = get_system_metrics()
        container_health = get_container_health()
        postgres_status = get_postgres_status()
        
        # Calculate health score
        health_score = calculate_health_score(system_metrics, container_health, postgres_status)
        
        # Build report
        report = {
            'node_name': NODE_NAME,
            'node_role': NODE_ROLE,
            'timestamp': datetime.utcnow().isoformat(),
            'health_score': health_score,
            'system': system_metrics,
            'containers': container_health,
            'postgres': postgres_status
        }
        
        # Log locally
        logger.info(f"Health score: {health_score}/100")
        
        # Report to lead node (if not the lead node)
        if NODE_ROLE != 'lead':
            try:
                response = requests.post(
                    f"{LEAD_NODE_URL}/api/health-report",
                    json=report,
                    timeout=5
                )
                
                if response.status_code == 200:
                    logger.debug(f"Health report sent successfully")
                else:
                    logger.warning(f"Health report failed: {response.status_code}")
                    
            except requests.exceptions.RequestException as e:
                logger.warning(f"Cannot reach lead node: {e}")
        
        return report
        
    except Exception as e:
        logger.error(f"Failed to collect health metrics: {e}")
        return None

def main():
    """Main monitoring loop"""
    logger.info(f"Aurora Health Monitor starting for node: {NODE_NAME} ({NODE_ROLE})")
    logger.info(f"Report interval: {REPORT_INTERVAL}s")
    
    if NODE_ROLE != 'lead':
        logger.info(f"Reporting to lead node: {LEAD_NODE_URL}")
    
    # Initial health check
    report_health()
    
    # Continuous monitoring loop
    while True:
        try:
            time.sleep(REPORT_INTERVAL)
            report_health()
        except KeyboardInterrupt:
            logger.info("Shutting down...")
            break
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            time.sleep(60)

if __name__ == '__main__':
    main()
