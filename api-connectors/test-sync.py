#!/usr/bin/env python3
"""
Test Sync Script for RobbieBook1
Tests database connectivity and basic sync functionality
"""

import os
import json
import logging
from datetime import datetime
import psycopg2

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def test_elephant_connection():
    """Test connection to Elephant database"""
    logger.info("🧪 Testing Elephant database connection...")
    
    db_config = {
        "host": "aurora-postgres-u44170.vm.elestio.app",
        "port": 25432,
        "dbname": "aurora_unified",
        "user": "aurora_app",
        "password": "TestPilot2025_Aurora!",
        "sslmode": "require"
    }
    
    try:
        conn = psycopg2.connect(**db_config)
        with conn.cursor() as cur:
            # Test basic query
            cur.execute("SELECT version()")
            version = cur.fetchone()[0]
            logger.info(f"✅ Connected to PostgreSQL: {version}")
            
            # Check existing tables
            cur.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name
            """)
            tables = [row[0] for row in cur.fetchall()]
            logger.info(f"📊 Found {len(tables)} tables: {', '.join(tables[:5])}{'...' if len(tables) > 5 else ''}")
            
            # Test if Google tables exist
            google_tables = [t for t in tables if 'google' in t.lower()]
            if google_tables:
                logger.info(f"📧 Google tables found: {', '.join(google_tables)}")
                
                # Count records in each Google table
                for table in google_tables:
                    cur.execute(f"SELECT COUNT(*) FROM {table}")
                    count = cur.fetchone()[0]
                    logger.info(f"  • {table}: {count} records")
            else:
                logger.info("📧 No Google tables found yet")
            
        conn.close()
        return True
        
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
        return False

def create_sample_sync_data():
    """Create sample data to test sync functionality"""
    logger.info("📊 Creating sample sync data...")
    
    db_config = {
        "host": "aurora-postgres-u44170.vm.elestio.app",
        "port": 25432,
        "dbname": "aurora_unified",
        "user": "aurora_app",
        "password": "TestPilot2025_Aurora!",
        "sslmode": "require"
    }
    
    try:
        conn = psycopg2.connect(**db_config)
        
        with conn.cursor() as cur:
            # Create Google emails table if not exists
            cur.execute("""
                CREATE TABLE IF NOT EXISTS google_emails (
                    id SERIAL PRIMARY KEY,
                    gmail_id VARCHAR(255) UNIQUE NOT NULL,
                    subject TEXT,
                    from_email VARCHAR(255),
                    to_email VARCHAR(255),
                    body_preview TEXT,
                    is_business BOOLEAN DEFAULT FALSE,
                    email_date TIMESTAMP,
                    owner_id VARCHAR(50) DEFAULT 'robbiebook1',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Insert sample email
            sample_email = {
                'gmail_id': f'robbiebook-test-{datetime.now().strftime("%Y%m%d%H%M%S")}',
                'subject': 'RobbieBook1 Sync Test',
                'from_email': 'allan@testpilot.ai',
                'to_email': 'robbie@aurora.ai',
                'body_preview': 'Testing sync functionality from RobbieBook1',
                'is_business': True,
                'email_date': datetime.now(),
                'owner_id': 'robbiebook1'
            }
            
            cur.execute("""
                INSERT INTO google_emails (
                    gmail_id, subject, from_email, to_email, 
                    body_preview, is_business, email_date, owner_id
                ) VALUES (
                    %(gmail_id)s, %(subject)s, %(from_email)s, %(to_email)s,
                    %(body_preview)s, %(is_business)s, %(email_date)s, %(owner_id)s
                ) ON CONFLICT (gmail_id) DO NOTHING
            """, sample_email)
            
            logger.info(f"✅ Sample email created: {sample_email['gmail_id']}")
            
        conn.commit()
        conn.close()
        return True
        
    except Exception as e:
        logger.error(f"❌ Sample data creation failed: {e}")
        return False

def test_sync_state():
    """Test sync state management"""
    logger.info("📁 Testing sync state management...")
    
    sync_state_file = "/Users/allanperetz/aurora-ai-robbiverse/data/last-sync.json"
    
    # Create data directory if not exists
    os.makedirs(os.path.dirname(sync_state_file), exist_ok=True)
    
    # Test sync state
    sync_state = {
        "last_sync": datetime.now().isoformat(),
        "source": "robbiebook1",
        "sync_count": 1
    }
    
    try:
        with open(sync_state_file, 'w') as f:
            json.dump(sync_state, f, indent=2)
        
        logger.info(f"✅ Sync state saved: {sync_state_file}")
        
        # Verify read
        with open(sync_state_file, 'r') as f:
            loaded_state = json.load(f)
        
        logger.info(f"✅ Sync state loaded: {loaded_state}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Sync state test failed: {e}")
        return False

def main():
    """Run all sync tests"""
    logger.info("🚀 Starting RobbieBook1 sync tests...")
    
    tests = [
        ("Database Connection", test_elephant_connection),
        ("Sync State Management", test_sync_state),
        ("Sample Data Creation", create_sample_sync_data)
    ]
    
    results = {}
    for test_name, test_func in tests:
        logger.info(f"\n🧪 Running: {test_name}")
        results[test_name] = test_func()
    
    # Summary
    logger.info("\n📊 TEST RESULTS:")
    logger.info("=" * 30)
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        logger.info(f"• {test_name}: {status}")
    
    all_passed = all(results.values())
    
    if all_passed:
        logger.info("\n🎉 All tests passed! RobbieBook1 sync ready!")
        logger.info("\n📋 Next steps:")
        logger.info("1. Set up Google OAuth: cd api-connectors && python3 setup-google-oauth.py")
        logger.info("2. Run full sync: python3 robbiebook-sync.py --once")
        logger.info("3. Start continuous sync: python3 robbiebook-sync.py --continuous")
    else:
        logger.info("\n⚠️ Some tests failed. Check logs above.")
    
    return all_passed

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
