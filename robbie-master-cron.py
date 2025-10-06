#!/usr/bin/env python3
"""
Robbie Master Cron Job
Single unified cron job for all Robbie tasks including:
- Inbox analysis and Top 10 emails
- Personality state monitoring
- Conversational priority updates
- System health checks
"""

import asyncio
import psycopg2
import logging
import subprocess
import sys
import os
from datetime import datetime

# Add the project root to the path
sys.path.append('/Users/allanperetz/aurora-ai-robbiverse')

# Configuration
DB_CONFIG = {
    'host': 'aurora-postgres-u44170.vm.elestio.app',
    'port': 25432,
    'dbname': 'aurora_unified',
    'user': 'aurora_app',
    'password': 'TestPilot2025_Aurora!',
    'sslmode': 'require'
}

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/Users/allanperetz/aurora-ai-robbiverse/logs/robbie-master-cron.log'),
        logging.StreamHandler()
    ]
)

class RobbieMasterCron:
    def __init__(self):
        self.db_conn = None
        self.tasks_completed = 0
        self.tasks_failed = 0
        
    async def initialize(self):
        """Initialize database connection"""
        try:
            self.db_conn = psycopg2.connect(**DB_CONFIG)
            logging.info("🤖 Robbie Master Cron initialized!")
        except Exception as e:
            logging.error(f"❌ Database connection error: {e}")
            raise
    
    async def run_inbox_analysis(self):
        """Run Robbie's intelligent inbox analysis"""
        try:
            logging.info("📧 Running inbox analysis...")
            
            # Import and run the inbox analysis
            import importlib.util
            spec = importlib.util.spec_from_file_location("robbie_intelligent_inbox", "/Users/allanperetz/aurora-ai-robbiverse/robbie-intelligent-inbox.py")
            robbie_intelligent_inbox = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(robbie_intelligent_inbox)
            RobbieIntelligentInbox = robbie_intelligent_inbox.RobbieIntelligentInbox
            
            inbox = RobbieIntelligentInbox()
            await inbox.run_inbox_analysis()
            
            self.tasks_completed += 1
            logging.info("✅ Inbox analysis completed!")
            
        except Exception as e:
            self.tasks_failed += 1
            logging.error(f"❌ Inbox analysis failed: {e}")
    
    async def check_personality_state(self):
        """Check and log Robbie's current personality state"""
        try:
            logging.info("🎭 Checking personality state...")
            
            cursor = self.db_conn.cursor()
            
            # Get current personality state
            cursor.execute("""
                SELECT gandhi, flirty, turbo, auto, updated_at
                FROM user_personality_state 
                WHERE user_id = 'allan'
            """)
            personality = cursor.fetchone()
            
            if personality:
                logging.info(f"🎭 Personality: Gandhi:{personality[0]}, Flirty:{personality[1]}, "
                           f"Turbo:{personality[2]}, Auto:{personality[3]} (Updated: {personality[4]})")
            else:
                logging.warning("⚠️ No personality state found for Allan")
            
            cursor.close()
            self.tasks_completed += 1
            
        except Exception as e:
            self.tasks_failed += 1
            logging.error(f"❌ Personality check failed: {e}")
    
    async def update_conversational_priorities(self):
        """Update conversational priorities based on recent activity"""
        try:
            logging.info("🎯 Updating conversational priorities...")
            
            cursor = self.db_conn.cursor()
            
            # Check for new priorities or updates
            cursor.execute("""
                SELECT COUNT(*) FROM conversational_priorities 
                WHERE user_id = 'allan' AND active = true
            """)
            active_priorities = cursor.fetchone()[0]
            
            logging.info(f"🎯 Active priorities: {active_priorities}")
            
            # Log priority activity
            cursor.execute("""
                INSERT INTO full_auto_sync_log (sync_type, status, message)
                VALUES (%s, %s, %s)
            """, ('robbie_priority_check', 'completed', f'Robbie Master Cron: Checked {active_priorities} active conversational priorities'))
            
            self.db_conn.commit()
            cursor.close()
            self.tasks_completed += 1
            
        except Exception as e:
            self.tasks_failed += 1
            logging.error(f"❌ Priority update failed: {e}")
    
    async def system_health_check(self):
        """Perform system health checks"""
        try:
            logging.info("🏥 Running system health check...")
            
            # Check database connection
            cursor = self.db_conn.cursor()
            cursor.execute("SELECT 1")
            cursor.close()
            
            # Check log files
            log_dir = '/Users/allanperetz/aurora-ai-robbiverse/logs'
            if os.path.exists(log_dir):
                log_files = os.listdir(log_dir)
                logging.info(f"📁 Log files: {len(log_files)} found")
            
            # Check Robbie files
            robbie_files = [
                'robbie-intelligent-inbox.py',
                'robbie-master-cron.py',
                'robbie-unified-interface.html'
            ]
            
            for file in robbie_files:
                if os.path.exists(f'/Users/allanperetz/aurora-ai-robbiverse/{file}'):
                    logging.info(f"✅ {file} exists")
                else:
                    logging.warning(f"⚠️ {file} missing")
            
            self.tasks_completed += 1
            
        except Exception as e:
            self.tasks_failed += 1
            logging.error(f"❌ Health check failed: {e}")
    
    async def run_all_tasks(self):
        """Run all Robbie tasks"""
        try:
            await self.initialize()
            
            logging.info("🚀 Starting Robbie Master Cron - All Tasks")
            logging.info("=" * 60)
            
            start_time = datetime.now()
            
            # Run all tasks
            await self.run_inbox_analysis()
            await self.check_personality_state()
            await self.update_conversational_priorities()
            await self.system_health_check()
            
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            
            # Log summary
            logging.info("=" * 60)
            logging.info(f"🎉 Robbie Master Cron Complete!")
            logging.info(f"✅ Tasks completed: {self.tasks_completed}")
            logging.info(f"❌ Tasks failed: {self.tasks_failed}")
            logging.info(f"⏱️ Duration: {duration:.2f} seconds")
            logging.info(f"🕐 Finished at: {end_time.strftime('%Y-%m-%d %H:%M:%S')}")
            
            # Log to database
            cursor = self.db_conn.cursor()
            cursor.execute("""
                INSERT INTO full_auto_sync_log (sync_type, status, message)
                VALUES (%s, %s, %s)
            """, ('robbie_master_cron', 'completed', 
                  f'Robbie Master Cron: {self.tasks_completed} completed, {self.tasks_failed} failed, {duration:.2f}s'))
            self.db_conn.commit()
            cursor.close()
            
        except Exception as e:
            logging.error(f"❌ Master cron error: {e}")
        finally:
            if self.db_conn:
                self.db_conn.close()

async def main():
    """Main function"""
    cron = RobbieMasterCron()
    await cron.run_all_tasks()

if __name__ == "__main__":
    asyncio.run(main())
