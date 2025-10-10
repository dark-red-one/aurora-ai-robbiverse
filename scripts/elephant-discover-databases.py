#!/usr/bin/env python3
"""
Discover all databases on elephant server
See what databases exist on aurora-postgres-u44170.vm.elestio.app
"""

import psycopg2

# Try current elephant server
ELEPHANT_CONFIG = {
    'host': 'aurora-postgres-u44170.vm.elestio.app',
    'port': 25432,
    'database': 'postgres',  # Connect to default postgres db first
    'user': 'postgres',
    'password': '0qyMjZQ3-xKIe-ylAPt0At',
    'sslmode': 'require'
}

def discover_databases():
    """List all databases on the server"""
    try:
        print(f"🔌 Connecting to {ELEPHANT_CONFIG['host']}...")
        conn = psycopg2.connect(**ELEPHANT_CONFIG)
        cursor = conn.cursor()
        print("✅ Connected!\n")
        
        # List all databases
        print("📚 Databases on server:")
        print("=" * 80)
        cursor.execute("""
            SELECT datname, pg_size_pretty(pg_database_size(datname)) as size
            FROM pg_database 
            WHERE datistemplate = false
            ORDER BY datname;
        """)
        
        databases = []
        for row in cursor.fetchall():
            db_name = row[0]
            db_size = row[1]
            databases.append(db_name)
            print(f"  • {db_name:<30} {db_size:>15}")
        
        print("=" * 80)
        print(f"\n✅ Found {len(databases)} databases")
        
        # Now check each database for tables
        print("\n🔍 Checking each database for tables...")
        print("=" * 80)
        
        for db_name in databases:
            if db_name in ['template0', 'template1']:
                continue
            
            try:
                # Connect to this database
                db_config = ELEPHANT_CONFIG.copy()
                db_config['database'] = db_name
                db_conn = psycopg2.connect(**db_config)
                db_cursor = db_conn.cursor()
                
                # Count tables
                db_cursor.execute("""
                    SELECT COUNT(*) 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public';
                """)
                table_count = db_cursor.fetchone()[0]
                
                # Count total rows (rough estimate)
                db_cursor.execute("""
                    SELECT SUM(n_live_tup) 
                    FROM pg_stat_user_tables;
                """)
                row_result = db_cursor.fetchone()[0]
                total_rows = row_result if row_result else 0
                
                print(f"\n📊 {db_name}:")
                print(f"   Tables: {table_count}")
                print(f"   Est. Rows: {total_rows:,}")
                
                # List tables if there are any
                if table_count > 0:
                    db_cursor.execute("""
                        SELECT 
                            schemaname || '.' || relname as table_name,
                            n_live_tup as estimated_rows
                        FROM pg_stat_user_tables 
                        ORDER BY n_live_tup DESC
                        LIMIT 15;
                    """)
                    print(f"   Top Tables:")
                    for table_row in db_cursor.fetchall():
                        print(f"      • {table_row[0]:<40} ~{table_row[1]:>10,} rows")
                
                db_cursor.close()
                db_conn.close()
                
            except Exception as e:
                print(f"   ⚠️  Could not access {db_name}: {e}")
        
        print("\n" + "=" * 80)
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    discover_databases()

