#!/usr/bin/env python3
"""
Test PostgreSQL connectivity and Aurora unified database
"""

import psycopg2
from psycopg2 import sql
import sys

def test_postgres():
    """Test PostgreSQL connection and database setup"""
    try:
        # Connection parameters
        conn_params = {
            'host': 'localhost',
            'port': 5432,
            'database': 'aurora_unified',
            'user': 'aurora_app',
            'password': 'aurora_secure_2025'
        }
        
        print("🔄 Connecting to PostgreSQL...")
        conn = psycopg2.connect(**conn_params)
        cursor = conn.cursor()
        
        print("✅ Connected successfully!")
        
        # Test query
        cursor.execute("SELECT version();")
        version = cursor.fetchone()[0]
        print(f"📊 PostgreSQL version: {version.split(',')[0]}")
        
        # Count tables
        cursor.execute("""
            SELECT COUNT(*) 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        """)
        table_count = cursor.fetchone()[0]
        print(f"📋 Tables in aurora_unified: {table_count}")
        
        # List tables
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
            LIMIT 10
        """)
        tables = cursor.fetchall()
        
        print("\n📊 Sample tables:")
        for table in tables:
            print(f"   • {table[0]}")
        
        # Check extensions
        cursor.execute("SELECT extname FROM pg_extension WHERE extname IN ('uuid-ossp', 'pgcrypto', 'vector');")
        extensions = cursor.fetchall()
        
        print(f"\n🔌 Extensions installed: {len(extensions)}")
        for ext in extensions:
            print(f"   • {ext[0]}")
        
        # Test insert
        cursor.execute("""
            INSERT INTO system_config (key, value, category, description) 
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
            RETURNING id
        """, ('test_connection', '{"status": "success"}', 'system', 'Test connection verification'))
        
        test_id = cursor.fetchone()[0]
        conn.commit()
        print(f"\n✅ Test insert successful (ID: {test_id})")
        
        cursor.close()
        conn.close()
        
        print("\n🎉 PostgreSQL is fully operational!")
        print("📍 Connection string: postgresql://aurora_app:****@localhost:5432/aurora_unified")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False

if __name__ == "__main__":
    success = test_postgres()
    sys.exit(0 if success else 1)
