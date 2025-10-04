#!/usr/bin/env python3
"""
Integrate Existing Aurora System with New Infrastructure
Updates the running Aurora system to use Aurora-Postgres and RunPod GPU
"""

import requests
import psycopg2
import json
from datetime import datetime

class AuroraIntegrator:
    def __init__(self):
        # Existing Aurora backend
        self.aurora_backend = "http://localhost:8000"
        
        # New Aurora-Postgres
        self.db_config = {
            "host": "aurora-postgres-u44170.vm.elestio.app",
            "port": 25432,
            "dbname": "aurora_unified",
            "user": "aurora_app", 
            "password": "TestPilot2025_Aurora!",
            "sslmode": "require"
        }
    
    def get_db_connection(self):
        return psycopg2.connect(**self.db_config)
    
    def test_existing_backend(self) -> bool:
        """Test connection to existing Aurora backend"""
        try:
            response = requests.get(f"{self.aurora_backend}/", timeout=5)
            data = response.json()
            print(f"✅ Aurora backend: {data.get('message', 'Unknown')}")
            print(f"📊 Status: {data.get('status', 'Unknown')}")
            print(f"🧠 Intelligence: {data.get('intelligence_level', 'Unknown')}")
            print(f"👥 Personalities: {data.get('personalities', 0)}")
            return True
        except Exception as e:
            print(f"❌ Aurora backend error: {e}")
            return False
    
    def get_gpu_worker_status(self) -> dict:
        """Get latest GPU worker status from database"""
        try:
            conn = self.get_db_connection()
            
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT gpu_host, status, timestamp
                    FROM gpu_status
                    WHERE owner_id = 'aurora'
                    ORDER BY timestamp DESC
                    LIMIT 1
                """)
                
                result = cur.fetchone()
                if result:
                    return {
                        "gpu_host": result[0],
                        "status": result[1],
                        "timestamp": result[2].isoformat(),
                        "connected": True
                    }
                else:
                    return {"connected": False, "error": "No GPU status found"}
            
            conn.close()
            
        except Exception as e:
            return {"connected": False, "error": str(e)}
    
    def create_integration_endpoint(self):
        """Create integration endpoint for Aurora backend"""
        integration_data = {
            "aurora_postgres": {
                "host": self.db_config["host"],
                "port": self.db_config["port"],
                "database": self.db_config["dbname"],
                "status": "connected"
            },
            "gpu_worker": self.get_gpu_worker_status(),
            "towns": ["aurora", "fluenti", "collaboration"],
            "integration_status": "active"
        }
        
        # Save integration config to database
        try:
            conn = self.get_db_connection()
            
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO system_config (key, value, category, description)
                    VALUES ('aurora.integration', %s, 'system', 'Aurora system integration status')
                    ON CONFLICT (key) DO UPDATE SET
                        value = EXCLUDED.value,
                        updated_at = CURRENT_TIMESTAMP
                """, (json.dumps(integration_data),))
            
            conn.commit()
            conn.close()
            
            print("✅ Integration config saved to database")
            return integration_data
            
        except Exception as e:
            print(f"❌ Error saving integration config: {e}")
            return integration_data
    
    def show_integration_status(self):
        """Show complete integration status"""
        print("🏛️ AURORA SYSTEM INTEGRATION STATUS")
        print("=" * 40)
        
        # Test existing backend
        backend_ok = self.test_existing_backend()
        
        # Test database
        try:
            conn = self.get_db_connection()
            with conn.cursor() as cur:
                cur.execute("SELECT COUNT(*) FROM towns")
                town_count = cur.fetchone()[0]
            conn.close()
            print(f"✅ Aurora-Postgres: {town_count} towns configured")
            db_ok = True
        except Exception as e:
            print(f"❌ Aurora-Postgres: {e}")
            db_ok = False
        
        # Test GPU worker
        gpu_status = self.get_gpu_worker_status()
        if gpu_status.get("connected"):
            gpu_info = gpu_status["status"]["gpu"]
            print(f"✅ GPU Worker: {gpu_info.get('name', 'Unknown')} ({gpu_info.get('count', 0)} GPUs)")
        else:
            print(f"❌ GPU Worker: {gpu_status.get('error', 'Not connected')}")
        
        print("")
        
        if backend_ok and db_ok and gpu_status.get("connected"):
            print("🎉 COMPLETE INTEGRATION SUCCESSFUL!")
            print("")
            print("📊 System Components:")
            print("• Robbie Chat: http://localhost:5173/chat")
            print("• Aurora Backend: http://localhost:8000")
            print("• Aurora-Postgres: aurora-postgres-u44170.vm.elestio.app:25432")
            print("• GPU Worker: RunPod RTX 4090")
            print("")
            print("🏛️ TestPilot Simulations AI Empire is fully operational!")
        else:
            print("⚠️ Integration incomplete - some components not connected")
        
        return backend_ok and db_ok and gpu_status.get("connected")

if __name__ == "__main__":
    integrator = AuroraIntegrator()
    
    print("🚀 INTEGRATING EXISTING AURORA WITH NEW INFRASTRUCTURE")
    print("=" * 55)
    
    # Show integration status
    success = integrator.show_integration_status()
    
    if success:
        # Create integration config
        print("\n📝 Creating integration configuration...")
        config = integrator.create_integration_endpoint()
        print(f"✅ Integration complete!")
    else:
        print("\n❌ Integration failed - check component status")
