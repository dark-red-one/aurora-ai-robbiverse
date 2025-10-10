#!/usr/bin/env python3
"""
Elephant Database Reconnaissance
Connect to old 'robbie' database and discover what valuable data exists
Read-only exploration - safe to run
"""

import psycopg2
import json
from datetime import datetime
from typing import Dict, List, Any

# Connection to ELEPHANT database (aurora_unified has all the data!)
ELEPHANT_CONFIG = {
    'host': 'aurora-postgres-u44170.vm.elestio.app',
    'port': 25432,
    'database': 'aurora_unified',
    'user': 'postgres',
    'password': '0qyMjZQ3-xKIe-ylAPt0At',
    'sslmode': 'require'
}

class ElephantRecon:
    def __init__(self):
        self.conn = None
        self.cursor = None
        self.findings = {
            'connection_time': datetime.now().isoformat(),
            'database': ELEPHANT_CONFIG['database'],
            'host': ELEPHANT_CONFIG['host'],
            'tables': {}
        }
    
    def connect(self) -> bool:
        """Connect to elephant database"""
        try:
            print(f"🔌 Connecting to {ELEPHANT_CONFIG['host']}:{ELEPHANT_CONFIG['port']}/{ELEPHANT_CONFIG['database']}...")
            self.conn = psycopg2.connect(**ELEPHANT_CONFIG)
            self.cursor = self.conn.cursor()
            print("✅ Connected successfully!")
            return True
        except Exception as e:
            print(f"❌ Connection failed: {e}")
            return False
    
    def list_all_tables(self) -> List[str]:
        """List all tables in the database"""
        print("\n📋 Discovering all tables...")
        query = """
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        """
        self.cursor.execute(query)
        tables = [row[0] for row in self.cursor.fetchall()]
        print(f"✅ Found {len(tables)} tables")
        return tables
    
    def count_rows(self, table: str) -> int:
        """Count rows in a table"""
        try:
            self.cursor.execute(f"SELECT COUNT(*) FROM {table};")
            count = self.cursor.fetchone()[0]
            return count
        except Exception as e:
            print(f"⚠️  Error counting {table}: {e}")
            return 0
    
    def get_table_schema(self, table: str) -> List[Dict[str, Any]]:
        """Get column information for a table"""
        query = """
            SELECT 
                column_name,
                data_type,
                character_maximum_length,
                is_nullable,
                column_default
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = %s
            ORDER BY ordinal_position;
        """
        self.cursor.execute(query, (table,))
        columns = []
        for row in self.cursor.fetchall():
            columns.append({
                'name': row[0],
                'type': row[1],
                'max_length': row[2],
                'nullable': row[3],
                'default': row[4]
            })
        return columns
    
    def sample_data(self, table: str, limit: int = 5) -> List[Dict]:
        """Get sample rows from a table"""
        try:
            self.cursor.execute(f"SELECT * FROM {table} LIMIT {limit};")
            columns = [desc[0] for desc in self.cursor.description]
            rows = self.cursor.fetchall()
            samples = []
            for row in rows:
                # Convert to dict, handling non-serializable types
                sample = {}
                for col, val in zip(columns, row):
                    if isinstance(val, (str, int, float, bool, type(None))):
                        sample[col] = val
                    else:
                        sample[col] = str(val)
                samples.append(sample)
            return samples
        except Exception as e:
            print(f"⚠️  Error sampling {table}: {e}")
            return []
    
    def analyze_all_tables(self) -> Dict:
        """Complete analysis of all tables"""
        tables = self.list_all_tables()
        
        print("\n🔍 Analyzing each table...\n")
        print("=" * 80)
        
        for table in tables:
            print(f"\n📊 TABLE: {table}")
            
            # Count rows
            row_count = self.count_rows(table)
            print(f"   Rows: {row_count:,}")
            
            # Get schema
            schema = self.get_table_schema(table)
            print(f"   Columns: {len(schema)}")
            
            # Sample data if table has rows
            samples = []
            if row_count > 0 and row_count < 100000:  # Don't sample huge tables
                samples = self.sample_data(table, limit=3)
                if samples:
                    print(f"   Sample: {list(samples[0].keys())[:5]}...")
            
            # Store findings
            self.findings['tables'][table] = {
                'row_count': row_count,
                'columns': schema,
                'sample_data': samples,
                'priority': self.assess_priority(table, row_count, schema)
            }
            
            print("   " + "-" * 76)
        
        return self.findings
    
    def assess_priority(self, table: str, row_count: int, schema: List[Dict]) -> str:
        """Assess extraction priority for this table"""
        # High priority tables - data not easily reproducible
        high_priority_keywords = ['interaction', 'meeting', 'transcript', 'chat', 'conversation', 
                                   'message', 'email', 'task', 'knowledge', 'note', 
                                   'drive', 'document', 'attachment', 'google_email',
                                   'allanbot', 'pattern', 'learning']
        
        # Medium priority tables
        medium_priority_keywords = ['activity', 'deal_contact', 'enrichment', 
                                     'intelligence', 'engagement', 'profile', 'user',
                                     'priority', 'execution']
        
        # Low priority (already synced or available via APIs)
        low_priority_keywords = ['company', 'companies', 'contact', 'contacts', 
                                  'deal', 'deals', 'payment', 'test', 'variation',
                                  'walmart', 'competitor']
        
        table_lower = table.lower()
        
        # Check high priority
        if any(keyword in table_lower for keyword in high_priority_keywords):
            if row_count > 0:
                return 'HIGH - Extract Now'
            else:
                return 'HIGH - Empty Table'
        
        # Check medium priority
        if any(keyword in table_lower for keyword in medium_priority_keywords):
            if row_count > 1000:
                return 'MEDIUM - Consider Extract'
            else:
                return 'MEDIUM - Small Dataset'
        
        # Check low priority
        if any(keyword in table_lower for keyword in low_priority_keywords):
            return 'LOW - API Available'
        
        # Default
        if row_count > 0:
            return 'UNKNOWN - Investigate'
        else:
            return 'EMPTY - Skip'
    
    def generate_report(self):
        """Generate a human-readable report"""
        print("\n" + "=" * 80)
        print("🎯 ELEPHANT DATABASE RECONNAISSANCE REPORT")
        print("=" * 80)
        
        print(f"\n📍 Database: {self.findings['database']}")
        print(f"🔗 Host: {self.findings['host']}")
        print(f"⏰ Scan Time: {self.findings['connection_time']}")
        print(f"📊 Total Tables: {len(self.findings['tables'])}")
        
        # Categorize by priority
        high_priority = []
        medium_priority = []
        low_priority = []
        empty_tables = []
        
        for table_name, data in self.findings['tables'].items():
            priority = data['priority']
            row_count = data['row_count']
            
            if 'HIGH' in priority and row_count > 0:
                high_priority.append((table_name, row_count, priority))
            elif 'MEDIUM' in priority:
                medium_priority.append((table_name, row_count, priority))
            elif row_count == 0:
                empty_tables.append(table_name)
            else:
                low_priority.append((table_name, row_count, priority))
        
        # High Priority Tables (THE GOLD!)
        if high_priority:
            print("\n🔥 HIGH PRIORITY - EXTRACT NOW:")
            print("=" * 80)
            for table, count, priority in sorted(high_priority, key=lambda x: x[1], reverse=True):
                print(f"  • {table:<30} {count:>10,} rows    [{priority}]")
        
        # Medium Priority Tables
        if medium_priority:
            print("\n⚡ MEDIUM PRIORITY - CONSIDER:")
            print("=" * 80)
            for table, count, priority in sorted(medium_priority, key=lambda x: x[1], reverse=True):
                print(f"  • {table:<30} {count:>10,} rows    [{priority}]")
        
        # Low Priority Tables
        if low_priority:
            print("\n📦 LOW PRIORITY - APIs Available:")
            print("=" * 80)
            for table, count, priority in sorted(low_priority, key=lambda x: x[1], reverse=True):
                print(f"  • {table:<30} {count:>10,} rows    [{priority}]")
        
        # Empty Tables
        if empty_tables:
            print(f"\n🗑️  EMPTY TABLES ({len(empty_tables)}):")
            print("=" * 80)
            print(f"  {', '.join(empty_tables)}")
        
        # Total row count
        total_rows = sum(data['row_count'] for data in self.findings['tables'].values())
        print(f"\n📊 TOTAL RECORDS IN DATABASE: {total_rows:,}")
        
        print("\n" + "=" * 80)
    
    def save_findings(self, filepath: str):
        """Save findings to JSON file"""
        with open(filepath, 'w') as f:
            json.dump(self.findings, f, indent=2, default=str)
        print(f"\n💾 Detailed findings saved to: {filepath}")
    
    def close(self):
        """Close database connection"""
        if self.cursor:
            self.cursor.close()
        if self.conn:
            self.conn.close()
        print("\n🔌 Disconnected from database")

def main():
    recon = ElephantRecon()
    
    try:
        # Connect
        if not recon.connect():
            return 1
        
        # Analyze all tables
        recon.analyze_all_tables()
        
        # Generate report
        recon.generate_report()
        
        # Save findings
        import os
        os.makedirs('data/elephant-exports', exist_ok=True)
        recon.save_findings('data/elephant-exports/recon-findings.json')
        
        print("\n✅ Reconnaissance complete!")
        print("🎯 Next: Review findings and extract high-priority tables")
        
        return 0
        
    except Exception as e:
        print(f"\n❌ Error during reconnaissance: {e}")
        import traceback
        traceback.print_exc()
        return 1
        
    finally:
        recon.close()

if __name__ == '__main__':
    exit(main())

