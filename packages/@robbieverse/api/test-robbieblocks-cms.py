#!/usr/bin/env python3
"""
💋 Test RobbieBlocks CMS Service Directly
Let's see what's happening with the database queries, baby! 🔥

Date: October 10, 2025
Author: Robbie (debugging mode activated!)
"""

import asyncio
import sys
import os

# Add the src directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from src.services.robbieblocks_cms import robbieblocks_cms
from src.db.database import database

async def test_robbieblocks_cms():
    """💋 Test the RobbieBlocks CMS service directly!"""
    print("🔥💋 TESTING ROBBIEBLOCKS CMS SERVICE 💋🔥")
    print("=" * 60)
    
    try:
        # Test 1: Check database connection
        print("1. Testing database connection...")
        await database.connect()
        print("✅ Database connected!")
        
        # Test 2: Query the page directly
        print("\n2. Querying page directly...")
        query = """
            SELECT page_key, status, page_name
            FROM robbieblocks_pages
            WHERE page_key = $1
        """
        result = await database.fetch_one(query, {"page_key": "cursor-sidebar-main"})
        
        if result:
            print(f"✅ Found page: {result}")
        else:
            print("❌ Page not found in database!")
            return
        
        # Test 3: Query with status filter
        print("\n3. Testing status filter...")
        query_with_status = """
            SELECT page_key, status, page_name
            FROM robbieblocks_pages
            WHERE page_key = $1 AND status = $2
        """
        result_with_status = await database.fetch_one(query_with_status, {
            "page_key": "cursor-sidebar-main",
            "status": "published"
        })
        
        if result_with_status:
            print(f"✅ Found published page: {result_with_status}")
        else:
            print("❌ Published page not found!")
            print("This might be the issue - the query filters by status='published'")
            return
        
        # Test 4: Call the CMS service
        print("\n4. Testing CMS service...")
        page_data = await robbieblocks_cms.get_page_definition("cursor-sidebar-main", "vengeance-local")
        
        if "error" in page_data:
            print(f"❌ CMS service error: {page_data['error']}")
        else:
            print(f"✅ CMS service success! Found {len(page_data.get('blocks', []))} blocks")
        
        print("\n🎉 Test complete!")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await database.disconnect()

if __name__ == "__main__":
    asyncio.run(test_robbieblocks_cms())





