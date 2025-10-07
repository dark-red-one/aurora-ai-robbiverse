#!/usr/bin/env python3
"""
Aurora Data Sync System
Synchronizes data between Aurora Town and local systems
"""

import asyncio
import aiohttp
import json
import time
import psycopg2
import psycopg2.extras
from datetime import datetime, timedelta
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AuroraDataSync:
    def __init__(self):
        # Aurora Town configuration
        self.aurora_config = {
            'host': '45.32.194.172',
            'port': 5432,
            'database': 'aurora_unified',
            'user': 'postgres',
            'password': 'fun2Gus!!!'
        }
        
        # Local database configuration (fallback)
        self.local_config = {
            'host': 'localhost',
            'port': 5432,
            'database': 'aurora_unified',
            'user': 'aurora_user',
            'password': 'aurora_password'
        }
        
        self.connection = None
        self.last_sync = None
        self.sync_interval = 30  # seconds
        
    async def connect_to_aurora(self):
        """Connect to Aurora Town database"""
        try:
            logger.info("🔗 Connecting to Aurora Town database...")
            self.connection = psycopg2.connect(**self.aurora_config)
            logger.info("✅ Connected to Aurora Town")
            return True
        except Exception as e:
            logger.warning(f"⚠️ Aurora Town connection failed: {e}")
            return False
    
    async def connect_to_local(self):
        """Connect to local database"""
        try:
            logger.info("🔗 Connecting to local database...")
            self.connection = psycopg2.connect(**self.local_config)
            logger.info("✅ Connected to local database")
            return True
        except Exception as e:
            logger.error(f"❌ Local database connection failed: {e}")
            return False
    
    async def sync_conversations(self):
        """Sync conversation data"""
        try:
            cursor = self.connection.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            # Get recent conversations
            query = """
            SELECT c.*, p.name as personality_name, u.name as user_name
            FROM conversations c
            LEFT JOIN ai_personalities p ON c.personality_id = p.id
            LEFT JOIN users u ON c.user_id = u.id
            WHERE c.created_at > %s
            ORDER BY c.created_at DESC
            """
            
            since = self.last_sync or (datetime.now() - timedelta(hours=1))
            cursor.execute(query, (since,))
            conversations = cursor.fetchall()
            
            logger.info(f"📊 Synced {len(conversations)} conversations")
            return conversations
            
        except Exception as e:
            logger.error(f"❌ Conversation sync failed: {e}")
            return []
    
    async def sync_deals(self):
        """Sync deal pipeline data"""
        try:
            cursor = self.connection.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            # Get all deals
            query = """
            SELECT d.*, 
                   COUNT(r.id) as revenue_count,
                   SUM(r.amount) as total_revenue
            FROM deals d
            LEFT JOIN revenue r ON d.id = r.deal_id
            GROUP BY d.id
            ORDER BY d.created_at DESC
            """
            
            cursor.execute(query)
            deals = cursor.fetchall()
            
            logger.info(f"💰 Synced {len(deals)} deals")
            return deals
            
        except Exception as e:
            logger.error(f"❌ Deal sync failed: {e}")
            return []
    
    async def sync_widgets(self):
        """Sync widget catalog data"""
        try:
            cursor = self.connection.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            # Get widget status
            query = """
            SELECT w.*, s.name as site_name
            FROM widgets w
            LEFT JOIN widget_deployments wd ON w.id = wd.widget_id
            LEFT JOIN sites s ON wd.site_id = s.id
            ORDER BY w.priority, w.name
            """
            
            cursor.execute(query)
            widgets = cursor.fetchall()
            
            logger.info(f"🧩 Synced {len(widgets)} widgets")
            return widgets
            
        except Exception as e:
            logger.error(f"❌ Widget sync failed: {e}")
            return []
    
    async def sync_gpu_mesh(self):
        """Sync GPU mesh status"""
        try:
            cursor = self.connection.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            # Get GPU nodes and tasks
            query = """
            SELECT n.*, 
                   COUNT(t.id) as active_tasks,
                   COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks
            FROM gpu_nodes n
            LEFT JOIN gpu_tasks t ON n.id = t.node_id AND t.status IN ('pending', 'running')
            GROUP BY n.id
            ORDER BY n.priority
            """
            
            cursor.execute(query)
            gpu_nodes = cursor.fetchall()
            
            logger.info(f"⚡ Synced {len(gpu_nodes)} GPU nodes")
            return gpu_nodes
            
        except Exception as e:
            logger.error(f"❌ GPU mesh sync failed: {e}")
            return []
    
    async def get_business_summary(self):
        """Get comprehensive business summary"""
        try:
            cursor = self.connection.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            # Revenue summary
            revenue_query = "SELECT * FROM revenue_summary"
            cursor.execute(revenue_query)
            revenue = cursor.fetchone()
            
            # Widget status
            widget_query = "SELECT * FROM widget_status"
            cursor.execute(widget_query)
            widgets = cursor.fetchall()
            
            # GPU mesh status
            gpu_query = "SELECT * FROM gpu_mesh_status"
            cursor.execute(gpu_query)
            gpu = cursor.fetchone()
            
            summary = {
                'revenue': dict(revenue) if revenue else {},
                'widgets': [dict(w) for w in widgets],
                'gpu_mesh': dict(gpu) if gpu else {},
                'last_sync': datetime.now().isoformat()
            }
            
            return summary
            
        except Exception as e:
            logger.error(f"❌ Business summary failed: {e}")
            return {}
    
    async def start_sync_loop(self):
        """Start continuous data synchronization"""
        logger.info("🚀 Starting Aurora data sync loop...")
        
        while True:
            try:
                # Try Aurora Town first
                if not await self.connect_to_aurora():
                    # Fallback to local
                    if not await self.connect_to_local():
                        logger.error("❌ No database connection available")
                        await asyncio.sleep(60)
                        continue
                
                # Sync all data
                conversations = await self.sync_conversations()
                deals = await self.sync_deals()
                widgets = await self.sync_widgets()
                gpu_mesh = await self.sync_gpu_mesh()
                business_summary = await self.get_business_summary()
                
                # Update last sync time
                self.last_sync = datetime.now()
                
                # Log sync status
                logger.info(f"✅ Sync complete at {self.last_sync}")
                logger.info(f"📊 Data: {len(conversations)} conversations, {len(deals)} deals, {len(widgets)} widgets, {len(gpu_mesh)} GPU nodes")
                
                # Close connection
                if self.connection:
                    self.connection.close()
                    self.connection = None
                
                # Wait for next sync
                await asyncio.sleep(self.sync_interval)
                
            except Exception as e:
                logger.error(f"❌ Sync loop error: {e}")
                await asyncio.sleep(30)
    
    async def get_latest_data(self):
        """Get latest data without starting sync loop"""
        if not await self.connect_to_aurora():
            if not await self.connect_to_local():
                return None
        
        data = {
            'conversations': await self.sync_conversations(),
            'deals': await self.sync_deals(),
            'widgets': await self.sync_widgets(),
            'gpu_mesh': await self.sync_gpu_mesh(),
            'business_summary': await self.get_business_summary()
        }
        
        if self.connection:
            self.connection.close()
        
        return data

async def main():
    """Main function for testing data sync"""
    print("🔄 AURORA DATA SYNC TEST")
    print("========================")
    
    sync = AuroraDataSync()
    
    # Test single sync
    data = await sync.get_latest_data()
    
    if data:
        print("✅ Data sync successful!")
        print(f"📊 Conversations: {len(data['conversations'])}")
        print(f"💰 Deals: {len(data['deals'])}")
        print(f"🧩 Widgets: {len(data['widgets'])}")
        print(f"⚡ GPU Nodes: {len(data['gpu_mesh'])}")
        
        if data['business_summary']:
            print(f"💵 Revenue: ${data['business_summary'].get('revenue', {}).get('total_revenue', 0):,.2f}")
    else:
        print("❌ Data sync failed!")

if __name__ == "__main__":
    asyncio.run(main())
