#!/usr/bin/env python3
"""
GPU-Town Bridge for TestPilot Simulations
Connects Aurora-GPU (RunPod) with Aurora-Town control plane
"""

import asyncio
import aiohttp
import psycopg2
import json
import time
from datetime import datetime
from typing import Dict, Optional

class GPUTownBridge:
    def __init__(self):
        # Aurora-Town connection (will be Elestio VM)
        self.town_host = "aurora-town.testpilot.ai"  # Future Elestio VM
        self.town_port = 3000
        
        # Aurora-GPU connection (RunPod)
        self.gpu_host = "209.170.80.132"
        self.gpu_port = 8000
        
        # Database connection
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
    
    async def check_gpu_health(self) -> Optional[Dict]:
        """Check GPU worker health"""
        try:
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=5)) as session:
                async with session.get(f"http://{self.gpu_host}:{self.gpu_port}/status.json") as response:
                    if response.status == 200:
                        return await response.json()
                    else:
                        return {"error": f"HTTP {response.status}"}
        except Exception as e:
            return {"error": str(e)}
    
    async def send_gpu_status_to_town(self, gpu_status: Dict) -> bool:
        """Send GPU status to Aurora-Town"""
        try:
            # For now, store in database (later will send to Aurora-Town API)
            conn = self.get_db_connection()
            
            with conn.cursor() as cur:
                # Create GPU status table if not exists
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS gpu_status (
                        id SERIAL PRIMARY KEY,
                        gpu_host VARCHAR(255) NOT NULL,
                        status JSONB NOT NULL,
                        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        owner_id VARCHAR(50) DEFAULT 'aurora'
                    );
                """)
                
                # Insert current status
                cur.execute("""
                    INSERT INTO gpu_status (gpu_host, status, owner_id)
                    VALUES (%s, %s, %s)
                """, (self.gpu_host, json.dumps(gpu_status), "aurora"))
                
                # Keep only last 100 status records
                cur.execute("""
                    DELETE FROM gpu_status 
                    WHERE id NOT IN (
                        SELECT id FROM gpu_status 
                        ORDER BY timestamp DESC 
                        LIMIT 100
                    )
                """)
                
            conn.commit()
            conn.close()
            return True
            
        except Exception as e:
            print(f"❌ Error sending status to town: {e}")
            return False
    
    async def monitor_gpu(self, interval: int = 30):
        """Monitor GPU and report to Aurora-Town"""
        print(f"🔄 Starting GPU monitoring (every {interval}s)...")
        
        while True:
            try:
                # Check GPU health
                gpu_status = await self.check_gpu_health()
                
                if gpu_status:
                    print(f"📊 GPU Status: {gpu_status.get('status', 'unknown')}")
                    
                    # Send to Aurora-Town
                    success = await self.send_gpu_status_to_town(gpu_status)
                    if success:
                        print("✅ Status sent to Aurora-Town")
                    else:
                        print("❌ Failed to send status to Aurora-Town")
                else:
                    print("❌ Failed to get GPU status")
                
                await asyncio.sleep(interval)
                
            except KeyboardInterrupt:
                print("🛑 Monitoring stopped by user")
                break
            except Exception as e:
                print(f"❌ Monitoring error: {e}")
                await asyncio.sleep(interval)
    
    def get_latest_gpu_status(self) -> Optional[Dict]:
        """Get latest GPU status from database"""
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
                        "timestamp": result[2].isoformat()
                    }
            
            conn.close()
            return None
            
        except Exception as e:
            print(f"❌ Error getting GPU status: {e}")
            return None
    
    def test_connection(self):
        """Test all connections"""
        print("🔍 Testing GPU-Town Bridge connections...")
        
        # Test database
        try:
            conn = self.get_db_connection()
            with conn.cursor() as cur:
                cur.execute("SELECT 'Database OK' as status")
                result = cur.fetchone()[0]
            conn.close()
            print(f"✅ Database: {result}")
        except Exception as e:
            print(f"❌ Database: {e}")
        
        # Test GPU (async)
        async def test_gpu():
            gpu_status = await self.check_gpu_health()
            if gpu_status and "error" not in gpu_status:
                print(f"✅ GPU: {gpu_status.get('status', 'healthy')}")
                return True
            else:
                print(f"❌ GPU: {gpu_status}")
                return False
        
        # Run async test
        return asyncio.run(test_gpu())

if __name__ == "__main__":
    bridge = GPUTownBridge()
    
    print("🚀 AURORA GPU-TOWN BRIDGE")
    print("=" * 30)
    
    # Test connections
    gpu_ok = bridge.test_connection()
    
    if gpu_ok:
        print("\n🔄 Starting continuous monitoring...")
        print("Press Ctrl+C to stop")
        asyncio.run(bridge.monitor_gpu())
    else:
        print("\n❌ Connection test failed - check configuration")
        
        # Show latest status anyway
        latest = bridge.get_latest_gpu_status()
        if latest:
            print(f"\n📊 Latest GPU status: {latest}")
        else:
            print("\n📊 No GPU status available")
