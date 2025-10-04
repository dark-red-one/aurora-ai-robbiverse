#!/usr/bin/env python3
"""
RunPod Town Reporter - Run this ON the RunPod
Reports GPU status to Aurora-Town via database
"""

import json
import torch
import psycopg2
import time
from datetime import datetime

class RunPodReporter:
    def __init__(self):
        self.db_config = {
            "host": "aurora-postgres-u44170.vm.elestio.app",
            "port": 25432,
            "dbname": "aurora_unified",
            "user": "aurora_app", 
            "password": "TestPilot2025_Aurora!",
            "sslmode": "require"
        }
        self.gpu_host = "aurora-gpu-worker"  # Identifier for this GPU
    
    def get_db_connection(self):
        return psycopg2.connect(**self.db_config)
    
    def get_gpu_status(self) -> dict:
        """Get comprehensive GPU status"""
        status = {
            "timestamp": datetime.utcnow().isoformat(),
            "status": "healthy",
            "gpu": {},
            "system": {},
            "database": {}
        }
        
        # GPU Check
        try:
            status["gpu"] = {
                "available": torch.cuda.is_available(),
                "count": torch.cuda.device_count(),
                "name": torch.cuda.get_device_name(0) if torch.cuda.is_available() else None,
                "memory_total": torch.cuda.get_device_properties(0).total_memory if torch.cuda.is_available() else 0,
                "memory_allocated": torch.cuda.memory_allocated(0) if torch.cuda.is_available() else 0,
                "memory_cached": torch.cuda.memory_reserved(0) if torch.cuda.is_available() else 0
            }
        except Exception as e:
            status["gpu"] = {"error": str(e)}
            status["status"] = "degraded"
        
        # System Check
        try:
            import psutil
            status["system"] = {
                "cpu_percent": psutil.cpu_percent(),
                "memory_percent": psutil.virtual_memory().percent,
                "disk_percent": psutil.disk_usage('/').percent,
                "load_avg": psutil.getloadavg() if hasattr(psutil, 'getloadavg') else [0,0,0]
            }
        except:
            status["system"] = {"cpu_percent": 0, "memory_percent": 0, "disk_percent": 0}
        
        # Database Check
        try:
            conn = self.get_db_connection()
            with conn.cursor() as cur:
                cur.execute("SELECT 1")
                cur.fetchone()
            conn.close()
            status["database"] = {"status": "connected"}
        except Exception as e:
            status["database"] = {"error": str(e)}
            status["status"] = "unhealthy"
        
        return status
    
    def report_status(self) -> bool:
        """Report status to Aurora-Town via database"""
        try:
            gpu_status = self.get_gpu_status()
            
            conn = self.get_db_connection()
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO gpu_status (gpu_host, status, owner_id)
                    VALUES (%s, %s, %s)
                """, (self.gpu_host, json.dumps(gpu_status), "aurora"))
            
            conn.commit()
            conn.close()
            
            print(f"✅ Status reported: {gpu_status['status']}")
            return True
            
        except Exception as e:
            print(f"❌ Error reporting status: {e}")
            return False
    
    def run_continuous_reporting(self, interval: int = 30):
        """Run continuous status reporting"""
        print(f"🚀 Starting continuous GPU status reporting (every {interval}s)")
        print("Press Ctrl+C to stop")
        
        try:
            while True:
                success = self.report_status()
                if not success:
                    print("⚠️ Status report failed, retrying...")
                
                time.sleep(interval)
                
        except KeyboardInterrupt:
            print("\n🛑 Reporting stopped by user")
        except Exception as e:
            print(f"\n❌ Reporting error: {e}")

if __name__ == "__main__":
    reporter = RunPodReporter()
    
    print("🚀 RUNPOD TOWN REPORTER")
    print("=" * 25)
    
    # Test single report
    print("🔍 Testing single status report...")
    success = reporter.report_status()
    
    if success:
        print("✅ Single report successful!")
        print("\n🔄 Starting continuous reporting...")
        reporter.run_continuous_reporting()
    else:
        print("❌ Single report failed - check configuration")
