#!/usr/bin/env python3
"""
Aurora Data Sync System with Real Mock Data
Synchronizes data using realistic mock data for development
"""

import asyncio
import json
import time
from datetime import datetime, timedelta
import logging
import sys
sys.path.append(".")
from scripts.aurora_mock_data import mock_data

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AuroraDataSyncReal:
    def __init__(self):
        self.mock_data = mock_data
        self.last_sync = None
        self.sync_interval = 30  # seconds
        
    async def sync_conversations(self):
        """Sync conversation data"""
        try:
            conversations = self.mock_data.get_conversations(limit=20)
            logger.info(f"📊 Synced {len(conversations)} conversations")
            return conversations
        except Exception as e:
            logger.error(f"❌ Conversation sync failed: {e}")
            return []
    
    async def sync_deals(self):
        """Sync deal pipeline data"""
        try:
            deals = self.mock_data.get_deals()
            logger.info(f"💰 Synced {len(deals)} deals")
            return deals
        except Exception as e:
            logger.error(f"❌ Deal sync failed: {e}")
            return []
    
    async def sync_widgets(self):
        """Sync widget catalog data"""
        try:
            widgets = self.mock_data.get_widgets()
            logger.info(f"🧩 Synced {len(widgets)} widgets")
            return widgets
        except Exception as e:
            logger.error(f"❌ Widget sync failed: {e}")
            return []
    
    async def sync_gpu_mesh(self):
        """Sync GPU mesh status"""
        try:
            gpu_nodes = self.mock_data.get_gpu_nodes()
            logger.info(f"⚡ Synced {len(gpu_nodes)} GPU nodes")
            return gpu_nodes
        except Exception as e:
            logger.error(f"❌ GPU mesh sync failed: {e}")
            return []
    
    async def get_business_summary(self):
        """Get comprehensive business summary"""
        try:
            summary = self.mock_data.get_business_summary()
            logger.info("📊 Business summary generated")
            return summary
        except Exception as e:
            logger.error(f"❌ Business summary failed: {e}")
            return {}
    
    async def get_latest_data(self):
        """Get latest data"""
        try:
            data = {
                'conversations': await self.sync_conversations(),
                'deals': await self.sync_deals(),
                'widgets': await self.sync_widgets(),
                'gpu_mesh': await self.sync_gpu_mesh(),
                'business_summary': await self.get_business_summary()
            }
            
            self.last_sync = datetime.now()
            logger.info(f"✅ Data sync complete at {self.last_sync}")
            return data
            
        except Exception as e:
            logger.error(f"❌ Data sync failed: {e}")
            return None

async def main():
    """Main function for testing data sync"""
    print("🔄 AURORA DATA SYNC TEST (REAL MOCK DATA)")
    print("=========================================")
    
    sync = AuroraDataSyncReal()
    
    # Test single sync
    data = await sync.get_latest_data()
    
    if data:
        print("✅ Data sync successful!")
        print(f"📊 Conversations: {len(data['conversations'])}")
        print(f"💰 Deals: {len(data['deals'])}")
        print(f"🧩 Widgets: {len(data['widgets'])}")
        print(f"⚡ GPU Nodes: {len(data['gpu_mesh'])}")
        
        if data['business_summary']:
            revenue = data['business_summary'].get('revenue', {})
            print(f"💵 Revenue: ${revenue.get('total_revenue', 0):,.2f}")
            print(f"📈 Pipeline: ${revenue.get('total_pipeline_value', 0):,.2f}")
            
            widgets = data['business_summary'].get('widgets', [])
            completed = sum(w.get('completed', 0) for w in widgets)
            total = sum(w.get('total', 0) for w in widgets)
            print(f"🧩 Widgets: {completed}/{total} completed")
            
            gpu = data['business_summary'].get('gpu_mesh', {})
            print(f"⚡ GPU Mesh: {gpu.get('active_nodes', 0)}/{gpu.get('total_nodes', 0)} active")
    else:
        print("❌ Data sync failed!")

if __name__ == "__main__":
    asyncio.run(main())
