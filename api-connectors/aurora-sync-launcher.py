#!/usr/bin/env python3
"""
Aurora Sync Launcher - Real Data Integration
Orchestrates sync from Google, Fireflies, HubSpot, and other sources
"""

import os
import sys
import asyncio
import logging
from datetime import datetime
from typing import Dict, List
import subprocess
import json

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/Users/allanperetz/aurora-ai-robbiverse/logs/aurora-sync.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class AuroraSyncLauncher:
    def __init__(self):
        self.base_path = '/Users/allanperetz/aurora-ai-robbiverse'
        self.data_path = f'{self.base_path}/data'
        self.logs_path = f'{self.base_path}/logs'
        
        # Ensure directories exist
        os.makedirs(self.data_path, exist_ok=True)
        os.makedirs(self.logs_path, exist_ok=True)
        
        # Database configuration
        self.db_config = {
            "host": "aurora-postgres-u44170.vm.elestio.app",
            "port": 25432,
            "dbname": "aurora_unified",
            "user": "aurora_app", 
            "password": "TestPilot2025_Aurora!",
            "sslmode": "require"
        }
        
        # API Keys from environment
        self.api_keys = {
            "hubspot": os.getenv("HUBSPOT_API_KEY"),
            "fireflies": os.getenv("FIREFLIES_API_KEY"),
            "clay": os.getenv("CLAY_API_KEY"),
            "apollo": os.getenv("APOLLO_API_KEY"),
            "openai": os.getenv("OPENAI_API_KEY")
        }
        
        # Google OAuth paths
        self.google_credentials = os.getenv("GOOGLE_CREDENTIALS_PATH", f"{self.base_path}/api-connectors/google-credentials.json")
        self.google_token = os.getenv("GOOGLE_TOKEN_PATH", f"{self.base_path}/api-connectors/google-token.json")
        
        # Storage configuration (unlimited)
        self.storage_config = {
            "path": self.data_path,
            "max_gb": int(os.getenv("MAX_STORAGE_GB", "0")),  # 0 = unlimited
            "compression": True,
            "backup": True
        }
    
    def check_disk_space(self) -> Dict:
        """Check available disk space"""
        try:
            import shutil
            total, used, free = shutil.disk_usage(self.data_path)
            
            return {
                "total_gb": round(total / (1024**3), 2),
                "used_gb": round(used / (1024**3), 2),
                "free_gb": round(free / (1024**3), 2),
                "free_percent": round((free / total) * 100, 2)
            }
        except Exception as e:
            logger.error(f"❌ Disk space check failed: {e}")
            return {"error": str(e)}
    
    def check_database_connection(self) -> bool:
        """Test database connection"""
        try:
            import psycopg2
            conn = psycopg2.connect(**self.db_config)
            with conn.cursor() as cur:
                cur.execute("SELECT 1")
            conn.close()
            logger.info("✅ Database connection verified")
            return True
        except Exception as e:
            logger.error(f"❌ Database connection failed: {e}")
            return False
    
    def check_api_keys(self) -> Dict:
        """Check which API keys are available"""
        available = {}
        missing = []
        
        for service, key in self.api_keys.items():
            if key:
                available[service] = "✅ Available"
            else:
                missing.append(service)
                available[service] = "❌ Missing"
        
        return {
            "available": available,
            "missing": missing,
            "total_available": len([k for k in self.api_keys.values() if k])
        }
    
    def run_google_workspace_sync(self) -> Dict:
        """Run Google Workspace sync"""
        if not os.path.exists(self.google_credentials):
            logger.warning("⚠️ Google credentials not found - skipping Google Workspace sync")
            return {"status": "skipped", "reason": "No credentials"}
        
        try:
            logger.info("🚀 Starting Google Workspace sync...")
            
            # Run Google Workspace connector
            result = subprocess.run([
                sys.executable, 
                f"{self.base_path}/api-connectors/google-workspace-connector.py"
            ], capture_output=True, text=True, cwd=f"{self.base_path}/api-connectors")
            
            if result.returncode == 0:
                logger.info("✅ Google Workspace sync completed")
                return {"status": "success", "output": result.stdout}
            else:
                logger.error(f"❌ Google Workspace sync failed: {result.stderr}")
                return {"status": "failed", "error": result.stderr}
                
        except Exception as e:
            logger.error(f"❌ Google Workspace sync error: {e}")
            return {"status": "error", "error": str(e)}
    
    def run_hubspot_sync(self) -> Dict:
        """Run HubSpot sync"""
        if not self.api_keys["hubspot"]:
            logger.warning("⚠️ HubSpot API key not found - skipping HubSpot sync")
            return {"status": "skipped", "reason": "No API key"}
        
        try:
            logger.info("🚀 Starting HubSpot sync...")
            
            # Set environment variable
            env = os.environ.copy()
            env["HUBSPOT_API_KEY"] = self.api_keys["hubspot"]
            
            # Run HubSpot connector
            result = subprocess.run([
                sys.executable, 
                f"{self.base_path}/api-connectors/hubspot-connector.py"
            ], capture_output=True, text=True, cwd=f"{self.base_path}/api-connectors", env=env)
            
            if result.returncode == 0:
                logger.info("✅ HubSpot sync completed")
                return {"status": "success", "output": result.stdout}
            else:
                logger.error(f"❌ HubSpot sync failed: {result.stderr}")
                return {"status": "failed", "error": result.stderr}
                
        except Exception as e:
            logger.error(f"❌ HubSpot sync error: {e}")
            return {"status": "error", "error": str(e)}
    
    def run_fireflies_sync(self) -> Dict:
        """Run Fireflies sync"""
        if not self.api_keys["fireflies"]:
            logger.warning("⚠️ Fireflies API key not found - skipping Fireflies sync")
            return {"status": "skipped", "reason": "No API key"}
        
        try:
            logger.info("🚀 Starting Fireflies sync...")
            
            # Set environment variable
            env = os.environ.copy()
            env["FIREFLIES_API_KEY"] = self.api_keys["fireflies"]
            
            # Run Fireflies connector
            result = subprocess.run([
                sys.executable, 
                f"{self.base_path}/api-connectors/fireflies-connector.py"
            ], capture_output=True, text=True, cwd=f"{self.base_path}/api-connectors", env=env)
            
            if result.returncode == 0:
                logger.info("✅ Fireflies sync completed")
                return {"status": "success", "output": result.stdout}
            else:
                logger.error(f"❌ Fireflies sync failed: {result.stderr}")
                return {"status": "failed", "error": result.stderr}
                
        except Exception as e:
            logger.error(f"❌ Fireflies sync error: {e}")
            return {"status": "error", "error": str(e)}
    
    def run_master_import(self) -> Dict:
        """Run master import script"""
        try:
            logger.info("🚀 Starting master data import...")
            
            # Run master import
            result = subprocess.run([
                sys.executable, 
                f"{self.base_path}/api-connectors/master-import.py"
            ], capture_output=True, text=True, cwd=f"{self.base_path}/api-connectors")
            
            if result.returncode == 0:
                logger.info("✅ Master import completed")
                return {"status": "success", "output": result.stdout}
            else:
                logger.error(f"❌ Master import failed: {result.stderr}")
                return {"status": "failed", "error": result.stderr}
                
        except Exception as e:
            logger.error(f"❌ Master import error: {e}")
            return {"status": "error", "error": str(e)}
    
    def generate_sync_report(self, results: Dict) -> str:
        """Generate sync report"""
        report = []
        report.append("=" * 60)
        report.append("🚀 AURORA SYNC REPORT")
        report.append("=" * 60)
        report.append(f"📅 Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report.append("")
        
        # Disk space
        disk_space = self.check_disk_space()
        if "error" not in disk_space:
            report.append("💾 DISK SPACE:")
            report.append(f"   Total: {disk_space['total_gb']} GB")
            report.append(f"   Used: {disk_space['used_gb']} GB")
            report.append(f"   Free: {disk_space['free_gb']} GB ({disk_space['free_percent']}%)")
            report.append("")
        
        # API Keys
        api_status = self.check_api_keys()
        report.append("🔑 API KEYS:")
        for service, status in api_status["available"].items():
            report.append(f"   {service.title()}: {status}")
        report.append(f"   Total Available: {api_status['total_available']}/5")
        report.append("")
        
        # Sync Results
        report.append("📊 SYNC RESULTS:")
        for service, result in results.items():
            status = result.get("status", "unknown")
            if status == "success":
                report.append(f"   ✅ {service.title()}: SUCCESS")
            elif status == "skipped":
                reason = result.get("reason", "Unknown")
                report.append(f"   ⏭️ {service.title()}: SKIPPED ({reason})")
            elif status == "failed":
                report.append(f"   ❌ {service.title()}: FAILED")
            else:
                report.append(f"   ❓ {service.title()}: {status.upper()}")
        report.append("")
        
        # Summary
        total_syncs = len(results)
        successful_syncs = len([r for r in results.values() if r.get("status") == "success"])
        report.append("📈 SUMMARY:")
        report.append(f"   Total Services: {total_syncs}")
        report.append(f"   Successful: {successful_syncs}")
        report.append(f"   Success Rate: {(successful_syncs/total_syncs*100):.1f}%")
        report.append("")
        report.append("🎯 Aurora sync complete!")
        report.append("=" * 60)
        
        return "\n".join(report)
    
    def run_full_sync(self) -> Dict:
        """Run full sync from all sources"""
        logger.info("🚀 Starting Aurora full sync...")
        
        # Check prerequisites
        if not self.check_database_connection():
            return {"status": "failed", "error": "Database connection failed"}
        
        # Run all syncs
        results = {}
        
        # Google Workspace
        results["google_workspace"] = self.run_google_workspace_sync()
        
        # HubSpot
        results["hubspot"] = self.run_hubspot_sync()
        
        # Fireflies
        results["fireflies"] = self.run_fireflies_sync()
        
        # Master Import
        results["master_import"] = self.run_master_import()
        
        # Generate report
        report = self.generate_sync_report(results)
        
        # Save report
        report_path = f"{self.logs_path}/aurora-sync-report-{datetime.now().strftime('%Y%m%d-%H%M%S')}.txt"
        with open(report_path, 'w') as f:
            f.write(report)
        
        logger.info(f"📊 Sync report saved to: {report_path}")
        print(report)
        
        return {
            "status": "completed",
            "results": results,
            "report_path": report_path
        }

if __name__ == "__main__":
    print("🚀 AURORA SYNC LAUNCHER")
    print("=" * 50)
    
    launcher = AuroraSyncLauncher()
    result = launcher.run_full_sync()
    
    if result["status"] == "completed":
        print("\n✅ Aurora sync completed successfully!")
        print(f"📊 Report saved to: {result['report_path']}")
    else:
        print(f"\n❌ Aurora sync failed: {result.get('error', 'Unknown error')}")
        sys.exit(1)











