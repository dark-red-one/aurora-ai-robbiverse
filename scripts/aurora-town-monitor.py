#!/usr/bin/env python3
"""
Aurora-Town Monitor - Run this ON Aurora-Town
Monitors GPU workers and provides control plane interface
"""

import psycopg2
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional

class AuroraTownMonitor:
    def __init__(self):
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
    
    def get_gpu_workers_status(self) -> List[Dict]:
        """Get status of all GPU workers"""
        try:
            conn = self.get_db_connection()
            
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT DISTINCT ON (gpu_host) 
                        gpu_host, status, timestamp
                    FROM gpu_status
                    WHERE owner_id = 'aurora'
                    ORDER BY gpu_host, timestamp DESC
                """)
                
                workers = []
                for row in cur.fetchall():
                    workers.append({
                        "host": row[0],
                        "status": row[1],
                        "last_seen": row[2].isoformat(),
                        "age_minutes": (datetime.utcnow() - row[2]).total_seconds() / 60
                    })
            
            conn.close()
            return workers
            
        except Exception as e:
            print(f"❌ Error getting GPU workers: {e}")
            return []
    
    def get_town_analytics(self) -> Dict:
        """Get Aurora town analytics"""
        try:
            conn = self.get_db_connection()
            
            with conn.cursor() as cur:
                # Get town data
                cur.execute("SELECT * FROM cross_town_analytics WHERE town_name = 'aurora'")
                town_data = cur.fetchone()
                
                # Get recent GPU status count
                cur.execute("""
                    SELECT COUNT(*) FROM gpu_status 
                    WHERE timestamp > NOW() - INTERVAL '1 hour'
                    AND owner_id = 'aurora'
                """)
                recent_reports = cur.fetchone()[0]
                
                analytics = {
                    "town_name": town_data[0] if town_data else "aurora",
                    "display_name": town_data[1] if town_data else "Aurora (Capital)",
                    "region": town_data[2] if town_data else "austin",
                    "company_count": town_data[3] if town_data else 0,
                    "contact_count": town_data[4] if town_data else 0,
                    "deal_count": town_data[5] if town_data else 0,
                    "total_deal_value": float(town_data[6]) if town_data else 0,
                    "won_deal_value": float(town_data[7]) if town_data else 0,
                    "activity_count": town_data[8] if town_data else 0,
                    "gpu_reports_last_hour": recent_reports,
                    "last_updated": datetime.utcnow().isoformat()
                }
            
            conn.close()
            return analytics
            
        except Exception as e:
            print(f"❌ Error getting town analytics: {e}")
            return {}
    
    def generate_status_report(self) -> Dict:
        """Generate comprehensive status report"""
        report = {
            "timestamp": datetime.utcnow().isoformat(),
            "town": "aurora",
            "status": "operational"
        }
        
        # Get GPU workers
        gpu_workers = self.get_gpu_workers_status()
        report["gpu_workers"] = gpu_workers
        
        # Check if any workers are stale
        stale_workers = [w for w in gpu_workers if w["age_minutes"] > 5]
        if stale_workers:
            report["status"] = "degraded"
            report["alerts"] = [f"GPU worker {w['host']} not reporting (last seen {w['age_minutes']:.1f}m ago)" for w in stale_workers]
        
        # Get town analytics
        analytics = self.get_town_analytics()
        report["analytics"] = analytics
        
        return report
    
    def display_dashboard(self):
        """Display Aurora-Town dashboard"""
        print("🏛️ AURORA-TOWN CONTROL PLANE DASHBOARD")
        print("=" * 45)
        
        report = self.generate_status_report()
        
        print(f"🏙️ Town: {report['town'].title()}")
        print(f"📊 Status: {report['status'].upper()}")
        print(f"⏰ Last Updated: {report['timestamp']}")
        print("")
        
        # GPU Workers
        print("🔥 GPU WORKERS:")
        if report["gpu_workers"]:
            for worker in report["gpu_workers"]:
                age = worker["age_minutes"]
                status_icon = "✅" if age < 2 else "⚠️" if age < 5 else "❌"
                print(f"  {status_icon} {worker['host']} - {worker['status'].get('status', 'unknown')} ({age:.1f}m ago)")
                
                # Show GPU details if available
                gpu_info = worker["status"].get("gpu", {})
                if gpu_info and "name" in gpu_info:
                    print(f"     GPU: {gpu_info['name']} ({gpu_info.get('count', 0)} devices)")
        else:
            print("  ❌ No GPU workers reporting")
        
        print("")
        
        # Town Analytics
        print("📈 TOWN ANALYTICS:")
        analytics = report.get("analytics", {})
        if analytics:
            print(f"  • Companies: {analytics.get('company_count', 0)}")
            print(f"  • Contacts: {analytics.get('contact_count', 0)}")
            print(f"  • Deals: {analytics.get('deal_count', 0)}")
            print(f"  • Deal Value: ${analytics.get('total_deal_value', 0):,.2f}")
            print(f"  • Activities: {analytics.get('activity_count', 0)}")
        else:
            print("  📊 No analytics data available")
        
        print("")
        
        # Alerts
        if "alerts" in report:
            print("🚨 ALERTS:")
            for alert in report["alerts"]:
                print(f"  ⚠️ {alert}")
        else:
            print("✅ No alerts")

if __name__ == "__main__":
    monitor = AuroraTownMonitor()
    
    print("🚀 Starting Aurora-Town monitoring...")
    
    try:
        while True:
            monitor.display_dashboard()
            print("\n" + "="*45)
            print("Press Ctrl+C to stop monitoring")
            time.sleep(30)
            print("\033[2J\033[H")  # Clear screen
            
    except KeyboardInterrupt:
        print("\n🛑 Monitoring stopped by user")
    except Exception as e:
        print(f"\n❌ Monitoring error: {e}")
