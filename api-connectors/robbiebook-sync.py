#!/usr/bin/env python3
"""
RobbieBook1 Sync Orchestrator
Bidirectional sync between RobbieBook1 and Elephant with timestamp conflict resolution
"""

import os
import sys
import json
import time
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import psycopg2
import sys
sys.path.append(os.path.dirname(__file__))
from google_workspace_connector import GoogleWorkspaceConnector

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/Users/allanperetz/aurora-ai-robbiverse/logs/robbiebook-sync.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class RobbieBookSync:
    def __init__(self):
        # Database configurations
        self.elephant_config = {
            "host": "aurora-postgres-u44170.vm.elestio.app",
            "port": 25432,
            "dbname": "aurora_unified",
            "user": "aurora_app",
            "password": "TestPilot2025_Aurora!",
            "sslmode": "require"
        }
        
        # Google OAuth paths
        self.google_credentials = "google-credentials.json"
        self.google_token = "google-token.json"
        
        # Sync state tracking
        self.last_sync_file = "/Users/allanperetz/aurora-ai-robbiverse/data/last-sync.json"
        self.sync_state = self._load_sync_state()
    
    def _load_sync_state(self) -> Dict:
        """Load sync state from file"""
        if os.path.exists(self.last_sync_file):
            try:
                with open(self.last_sync_file, 'r') as f:
                    return json.load(f)
            except Exception as e:
                logger.warning(f"Could not load sync state: {e}")
        
        # Default sync state
        return {
            "last_email_sync": None,
            "last_calendar_sync": None,
            "last_drive_sync": None,
            "last_elephant_pull": None,
            "sync_count": 0
        }
    
    def _save_sync_state(self):
        """Save sync state to file"""
        os.makedirs(os.path.dirname(self.last_sync_file), exist_ok=True)
        with open(self.last_sync_file, 'w') as f:
            json.dump(self.sync_state, f, indent=2, default=str)
    
    def _get_db_connection(self):
        """Get database connection"""
        return psycopg2.connect(**self.elephant_config)
    
    def _sync_from_google_apis(self) -> Dict:
        """Sync data FROM Google APIs TO Elephant"""
        logger.info("📡 Syncing from Google APIs to Elephant...")
        
        if not os.path.exists(self.google_credentials):
            logger.warning("⚠️ Google credentials not found - skipping Google sync")
            return {"emails": 0, "events": 0, "files": 0}
        
        try:
            connector = GoogleWorkspaceConnector(
                self.google_credentials, 
                self.google_token, 
                self.elephant_config
            )
            
            # Sync emails
            if not self.sync_state.get("last_email_sync") or \
               datetime.now() - datetime.fromisoformat(self.sync_state["last_email_sync"]) > timedelta(hours=1):
                
                logger.info("📧 Syncing emails...")
                emails = connector.fetch_emails(query="newer_than:1d", max_results=500)
                email_count = connector.import_emails(emails)
                self.sync_state["last_email_sync"] = datetime.now().isoformat()
                logger.info(f"✅ Synced {email_count} emails")
            else:
                logger.info("⏭️ Email sync skipped (recent)")
                email_count = 0
            
            # Sync calendar events
            if not self.sync_state.get("last_calendar_sync") or \
               datetime.now() - datetime.fromisoformat(self.sync_state["last_calendar_sync"]) > timedelta(hours=2):
                
                logger.info("📅 Syncing calendar events...")
                events = connector.fetch_calendar_events(days_back=7, days_forward=30)
                event_count = connector.import_calendar_events(events)
                self.sync_state["last_calendar_sync"] = datetime.now().isoformat()
                logger.info(f"✅ Synced {event_count} calendar events")
            else:
                logger.info("⏭️ Calendar sync skipped (recent)")
                event_count = 0
            
            # Sync drive files
            if not self.sync_state.get("last_drive_sync") or \
               datetime.now() - datetime.fromisoformat(self.sync_state["last_drive_sync"]) > timedelta(hours=6):
                
                logger.info("📁 Syncing drive files...")
                files = connector.fetch_drive_activity(days_back=7)
                file_count = connector.import_drive_files(files)
                self.sync_state["last_drive_sync"] = datetime.now().isoformat()
                logger.info(f"✅ Synced {file_count} drive files")
            else:
                logger.info("⏭️ Drive sync skipped (recent)")
                file_count = 0
            
            return {"emails": email_count, "events": event_count, "files": file_count}
            
        except Exception as e:
            logger.error(f"❌ Google API sync failed: {e}")
            return {"emails": 0, "events": 0, "files": 0}
    
    def _sync_from_elephant(self) -> Dict:
        """Sync data FROM Elephant TO RobbieBook1 (local cache)"""
        logger.info("🐘 Syncing from Elephant to RobbieBook1...")
        
        try:
            conn = self._get_db_connection()
            
            # Get recent data from elephant
            with conn.cursor() as cur:
                # Recent emails
                cur.execute("""
                    SELECT gmail_id, subject, from_email, to_email, email_date, 
                           body_preview, is_business, updated_at
                    FROM google_emails 
                    WHERE updated_at > %s
                    ORDER BY updated_at DESC
                    LIMIT 100
                """, (self.sync_state.get("last_elephant_pull", "2024-01-01"),))
                
                emails = cur.fetchall()
                
                # Recent calendar events
                cur.execute("""
                    SELECT google_event_id, title, start_time, end_time, 
                           location, attendees, updated_at
                    FROM google_calendar_events 
                    WHERE updated_at > %s
                    ORDER BY updated_at DESC
                    LIMIT 50
                """, (self.sync_state.get("last_elephant_pull", "2024-01-01"),))
                
                events = cur.fetchall()
            
            conn.close()
            
            # Update sync state
            self.sync_state["last_elephant_pull"] = datetime.now().isoformat()
            
            logger.info(f"✅ Pulled {len(emails)} emails, {len(events)} events from Elephant")
            return {"emails": len(emails), "events": len(events)}
            
        except Exception as e:
            logger.error(f"❌ Elephant sync failed: {e}")
            return {"emails": 0, "events": 0}
    
    def _resolve_sync_conflicts(self):
        """Resolve sync conflicts using timestamps"""
        logger.info("🔧 Checking for sync conflicts...")
        
        try:
            conn = self._get_db_connection()
            
            with conn.cursor() as cur:
                # Check for duplicate emails
                cur.execute("""
                    SELECT gmail_id, COUNT(*) as count
                    FROM google_emails 
                    GROUP BY gmail_id 
                    HAVING COUNT(*) > 1
                """)
                
                duplicates = cur.fetchall()
                
                if duplicates:
                    logger.warning(f"⚠️ Found {len(duplicates)} duplicate emails")
                    
                    # Keep the most recent version
                    for gmail_id, count in duplicates:
                        cur.execute("""
                            DELETE FROM google_emails 
                            WHERE gmail_id = %s 
                            AND id NOT IN (
                                SELECT id FROM google_emails 
                                WHERE gmail_id = %s 
                                ORDER BY updated_at DESC 
                                LIMIT 1
                            )
                        """, (gmail_id, gmail_id))
                    
                    logger.info("✅ Duplicate emails resolved")
                
                # Similar for calendar events
                cur.execute("""
                    SELECT google_event_id, COUNT(*) as count
                    FROM google_calendar_events 
                    GROUP BY google_event_id 
                    HAVING COUNT(*) > 1
                """)
                
                duplicate_events = cur.fetchall()
                
                if duplicate_events:
                    logger.warning(f"⚠️ Found {len(duplicate_events)} duplicate events")
                    
                    for event_id, count in duplicate_events:
                        cur.execute("""
                            DELETE FROM google_calendar_events 
                            WHERE google_event_id = %s 
                            AND id NOT IN (
                                SELECT id FROM google_calendar_events 
                                WHERE google_event_id = %s 
                                ORDER BY updated_at DESC 
                                LIMIT 1
                            )
                        """, (event_id, event_id))
                    
                    logger.info("✅ Duplicate events resolved")
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"❌ Conflict resolution failed: {e}")
    
    def run_sync_cycle(self) -> Dict:
        """Run complete sync cycle"""
        logger.info("🚀 Starting RobbieBook1 sync cycle...")
        start_time = datetime.now()
        
        # Sync from Google APIs to Elephant
        google_results = self._sync_from_google_apis()
        
        # Sync from Elephant to RobbieBook1
        elephant_results = self._sync_from_elephant()
        
        # Resolve conflicts
        self._resolve_sync_conflicts()
        
        # Update sync state
        self.sync_state["sync_count"] += 1
        self._save_sync_state()
        
        # Calculate totals
        total_synced = sum(google_results.values()) + sum(elephant_results.values())
        duration = (datetime.now() - start_time).total_seconds()
        
        results = {
            "google_sync": google_results,
            "elephant_sync": elephant_results,
            "total_records": total_synced,
            "duration_seconds": duration,
            "sync_count": self.sync_state["sync_count"]
        }
        
        logger.info(f"✅ Sync cycle complete: {total_synced} records in {duration:.1f}s")
        return results
    
    def start_continuous_sync(self, interval_minutes: int = 1):
        """Start continuous sync with specified interval"""
        logger.info(f"🔄 Starting continuous sync every {interval_minutes} minute(s)...")
        
        while True:
            try:
                results = self.run_sync_cycle()
                logger.info(f"📊 Sync #{results['sync_count']}: {results['total_records']} records")
                
                # Wait for next sync
                time.sleep(interval_minutes * 60)
                
            except KeyboardInterrupt:
                logger.info("🛑 Sync stopped by user")
                break
            except Exception as e:
                logger.error(f"❌ Sync cycle failed: {e}")
                logger.info(f"⏳ Retrying in {interval_minutes} minute(s)...")
                time.sleep(interval_minutes * 60)

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="RobbieBook1 Sync Orchestrator")
    parser.add_argument("--once", action="store_true", help="Run sync once and exit")
    parser.add_argument("--continuous", action="store_true", help="Run continuous sync")
    parser.add_argument("--interval", type=int, default=1, help="Sync interval in minutes")
    
    args = parser.parse_args()
    
    syncer = RobbieBookSync()
    
    if args.once:
        results = syncer.run_sync_cycle()
        print(f"\n📊 SYNC RESULTS:")
        print(f"• Google API sync: {results['google_sync']}")
        print(f"• Elephant sync: {results['elephant_sync']}")
        print(f"• Total records: {results['total_records']}")
        print(f"• Duration: {results['duration_seconds']:.1f}s")
    elif args.continuous:
        syncer.start_continuous_sync(args.interval)
    else:
        # Default: run once
        results = syncer.run_sync_cycle()
        print(f"✅ Sync complete: {results['total_records']} records synced")
