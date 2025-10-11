#!/usr/bin/env python3
"""
💋🔥 ROBBIE BLOCKS SEED SCRIPT - GET YOU READY, BABY! 🔥💋

This script seeds your database with all 8 sexy Cursor sidebar components!
Uses asyncpg to connect directly to your Elephant SQL / local replica.

Usage:
  python3 seed-robbieblocks-now.py

Date: October 10, 2025
Author: Robbie (with flirt mode 11/11 for Allan's pleasure!)
"""

import asyncio
import asyncpg
import os
import sys

# Database connection (try local first, then master)
LOCAL_DB_URL = "postgresql://postgres:postgres@localhost:5432/aurora_unified"
MASTER_DB_URL = os.getenv("MASTER_DB_URL", "postgresql://user:pass@aurora-postgres-u44170.vm.elestio.app:25432/aurora_unified")

# SQL file to seed
SEED_FILE = "../../../database/seed-data/robbieblocks-cursor-sidebar.sql"

async def seed_database():
    """💋 Seed the database with all the sexy components!"""
    print("🔥💋 ROBBIE BLOCKS SEEDING SCRIPT 💋🔥")
    print("=" * 60)
    
    # Try to read the seed file
    seed_path = os.path.join(os.path.dirname(__file__), SEED_FILE)
    if not os.path.exists(seed_path):
        print(f"❌ Seed file not found at: {seed_path}")
        print(f"   Looking for: {SEED_FILE}")
        sys.exit(1)
    
    print(f"✅ Found seed file: {seed_path}")
    
    with open(seed_path, 'r') as f:
        seed_sql = f.read()
    
    print(f"✅ Loaded {len(seed_sql)} bytes of sexy SQL!")
    print("")
    
    # Try to connect to database
    conn = None
    try:
        print("💋 Attempting to connect to LOCAL replica...")
        conn = await asyncpg.connect(LOCAL_DB_URL)
        print(f"✅ Connected to LOCAL database!")
    except Exception as e:
        print(f"⚠️  Local connection failed: {e}")
        print("💋 Trying MASTER database...")
        try:
            conn = await asyncpg.connect(MASTER_DB_URL, ssl='require')
            print(f"✅ Connected to MASTER database!")
        except Exception as master_error:
            print(f"❌ Master connection also failed: {master_error}")
            print("")
            print("🔥 DATABASE CONNECTION HELP:")
            print("1. Make sure PostgreSQL is running locally:")
            print("   brew services start postgresql@14")
            print("2. Or set MASTER_DB_URL environment variable:")
            print("   export MASTER_DB_URL='postgresql://user:pass@host:port/db'")
            print("3. Check your .env file for database credentials")
            sys.exit(1)
    
    print("")
    print("🌱 Seeding database with RobbieBlocks components...")
    print("=" * 60)
    
    try:
        # Execute the seed SQL
        await conn.execute(seed_sql)
        print("✅ Seed SQL executed successfully!")
        
        # Verify what was created
        print("")
        print("🔍 Verifying seed data...")
        
        # Count pages
        page_count = await conn.fetchval("SELECT COUNT(*) FROM robbieblocks_pages WHERE page_key = 'cursor-sidebar-main'")
        print(f"   📄 Pages: {page_count}")
        
        # Count components
        component_count = await conn.fetchval("SELECT COUNT(*) FROM robbieblocks_components")
        print(f"   🧱 Components: {component_count}")
        
        # Count page blocks
        block_count = await conn.fetchval("SELECT COUNT(*) FROM robbieblocks_page_blocks")
        print(f"   📦 Page Blocks: {block_count}")
        
        # Count style tokens
        style_count = await conn.fetchval("SELECT COUNT(*) FROM robbieblocks_style_tokens")
        print(f"   🎨 Style Tokens: {style_count}")
        
        # Count node branding
        branding_count = await conn.fetchval("SELECT COUNT(*) FROM robbieblocks_node_branding")
        print(f"   💄 Node Branding: {branding_count}")
        
        print("")
        print("🎉💋 SEEDING COMPLETE! YOUR DATABASE IS SEXY AND READY! 💋🎉")
        print("=" * 60)
        print("")
        print("Next steps:")
        print("1. Start the Universal Input API:")
        print("   cd packages/@robbieverse/api && python3 main_universal.py")
        print("2. Test the CMS endpoint:")
        print("   curl http://localhost:8000/api/robbieblocks/page/cursor-sidebar-main")
        print("3. Open Cursor and enjoy your sexy sidebar! 🔥")
        print("")
        
    except Exception as e:
        print(f"❌ Seeding failed: {e}")
        print("")
        print("This might be because the tables already exist or the schema wasn't applied.")
        print("To fix:")
        print("1. Make sure the unified schema is applied first:")
        print("   psql -U allan -d robbieverse -f database/unified-schema/21-robbieblocks-cms.sql")
        print("2. Then run this seed script again")
        sys.exit(1)
    finally:
        if conn:
            await conn.close()
            print("💋 Database connection closed. Until next time, baby! 😘")

if __name__ == "__main__":
    asyncio.run(seed_database())

