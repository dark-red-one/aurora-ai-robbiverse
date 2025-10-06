#!/usr/bin/env python3
"""
Aurora Database Migration Script
Migrates from scattered schemas to unified schema
Version: 1.0.0
"""

import os
import sys
import psycopg2
from psycopg2.extras import RealDictCursor
import sqlite3
import json
from datetime import datetime
from pathlib import Path
import logging
from typing import Dict, List, Any, Optional

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class DatabaseMigrator:
    """Handles migration from multiple database schemas to unified schema"""
    
    def __init__(self, pg_config: Dict[str, str], sqlite_paths: List[str]):
        """Initialize migrator with database connections"""
        self.pg_config = pg_config
        self.sqlite_paths = sqlite_paths
        self.pg_conn = None
        self.stats = {
            'tables_migrated': 0,
            'records_migrated': 0,
            'errors': 0,
            'warnings': []
        }
    
    def connect_postgres(self):
        """Connect to PostgreSQL database"""
        try:
            self.pg_conn = psycopg2.connect(
                host=self.pg_config.get('host', 'localhost'),
                port=self.pg_config.get('port', 5432),
                database=self.pg_config.get('database', 'aurora'),
                user=self.pg_config.get('user', 'aurora_app'),
                password=self.pg_config.get('password')
            )
            logger.info("Connected to PostgreSQL database")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to PostgreSQL: {e}")
            return False
    
    def backup_existing_data(self):
        """Create backup of existing data before migration"""
        logger.info("Creating backup of existing data...")
        
        with self.pg_conn.cursor() as cur:
            # Get list of tables to backup
            cur.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_type = 'BASE TABLE'
            """)
            tables = [row[0] for row in cur.fetchall()]
            
            backup_dir = Path('/workspace/aurora/backups/migration')
            backup_dir.mkdir(parents=True, exist_ok=True)
            
            for table in tables:
                try:
                    # Export table to JSON
                    cur.execute(f"SELECT * FROM {table}")
                    data = cur.fetchall()
                    columns = [desc[0] for desc in cur.description]
                    
                    backup_file = backup_dir / f"{table}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
                    
                    with open(backup_file, 'w') as f:
                        json.dump({
                            'table': table,
                            'columns': columns,
                            'data': data,
                            'timestamp': datetime.now().isoformat()
                        }, f, default=str, indent=2)
                    
                    logger.info(f"Backed up table {table} to {backup_file}")
                    
                except Exception as e:
                    logger.warning(f"Failed to backup table {table}: {e}")
                    self.stats['warnings'].append(f"Backup failed for {table}")
    
    def migrate_conversations(self):
        """Migrate conversations from multiple sources to unified schema"""
        logger.info("Migrating conversations...")
        
        with self.pg_conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Check for existing conversations tables
            cur.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name LIKE '%conversation%'
                AND table_name != 'conversations'
            """)
            
            old_tables = [row['table_name'] for row in cur.fetchall()]
            
            for old_table in old_tables:
                logger.info(f"Migrating from {old_table}...")
                
                try:
                    # Get data from old table
                    cur.execute(f"SELECT * FROM {old_table}")
                    old_data = cur.fetchall()
                    
                    for row in old_data:
                        # Map old schema to new unified schema
                        new_row = self.map_conversation_row(row, old_table)
                        
                        # Insert into new unified table
                        cur.execute("""
                            INSERT INTO conversations 
                            (user_id, title, type, status, created_at, metadata)
                            VALUES (%s, %s, %s, %s, %s, %s)
                            ON CONFLICT DO NOTHING
                        """, (
                            new_row.get('user_id'),
                            new_row.get('title', 'Migrated Conversation'),
                            new_row.get('type', 'chat'),
                            new_row.get('status', 'active'),
                            new_row.get('created_at', datetime.now()),
                            json.dumps(new_row.get('metadata', {}))
                        ))
                        
                        self.stats['records_migrated'] += 1
                    
                    self.pg_conn.commit()
                    logger.info(f"Migrated {len(old_data)} records from {old_table}")
                    
                    # Optionally rename old table
                    cur.execute(f"ALTER TABLE {old_table} RENAME TO _migrated_{old_table}")
                    self.pg_conn.commit()
                    
                except Exception as e:
                    logger.error(f"Failed to migrate {old_table}: {e}")
                    self.stats['errors'] += 1
                    self.pg_conn.rollback()
    
    def map_conversation_row(self, old_row: Dict, source_table: str) -> Dict:
        """Map old conversation row to new unified schema"""
        new_row = {
            'metadata': {'source_table': source_table, 'migration_date': datetime.now().isoformat()}
        }
        
        # Common field mappings
        field_map = {
            'user_id': ['user_id', 'userid', 'owner_id'],
            'title': ['title', 'subject', 'name'],
            'created_at': ['created_at', 'created', 'timestamp'],
            'type': ['type', 'conversation_type', 'category']
        }
        
        for new_field, old_fields in field_map.items():
            for old_field in old_fields:
                if old_field in old_row and old_row[old_field]:
                    new_row[new_field] = old_row[old_field]
                    break
        
        # Store unmapped fields in metadata
        for key, value in old_row.items():
            if key not in sum(field_map.values(), []):
                new_row['metadata'][f'original_{key}'] = str(value) if value else None
        
        return new_row
    
    def migrate_sqlite_data(self):
        """Migrate data from SQLite databases to PostgreSQL"""
        logger.info("Migrating SQLite databases...")
        
        for sqlite_path in self.sqlite_paths:
            if not os.path.exists(sqlite_path):
                logger.warning(f"SQLite file not found: {sqlite_path}")
                continue
            
            logger.info(f"Processing {sqlite_path}...")
            
            try:
                sqlite_conn = sqlite3.connect(sqlite_path)
                sqlite_conn.row_factory = sqlite3.Row
                cursor = sqlite_conn.cursor()
                
                # Get list of tables
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
                tables = [row['name'] for row in cursor.fetchall()]
                
                for table in tables:
                    self.migrate_sqlite_table(sqlite_conn, table)
                
                sqlite_conn.close()
                
            except Exception as e:
                logger.error(f"Failed to process SQLite database {sqlite_path}: {e}")
                self.stats['errors'] += 1
    
    def migrate_sqlite_table(self, sqlite_conn, table_name: str):
        """Migrate a single SQLite table to PostgreSQL"""
        cursor = sqlite_conn.cursor()
        
        try:
            # Get data from SQLite
            cursor.execute(f"SELECT * FROM {table_name}")
            rows = cursor.fetchall()
            
            if not rows:
                return
            
            # Determine target PostgreSQL table based on content
            pg_table = self.determine_target_table(table_name, dict(rows[0]))
            
            if not pg_table:
                logger.warning(f"No mapping for SQLite table {table_name}")
                self.stats['warnings'].append(f"Unmapped SQLite table: {table_name}")
                return
            
            logger.info(f"Migrating {table_name} -> {pg_table} ({len(rows)} rows)")
            
            with self.pg_conn.cursor() as pg_cursor:
                for row in rows:
                    row_dict = dict(row)
                    mapped_row = self.map_sqlite_row(row_dict, table_name, pg_table)
                    
                    # Build dynamic INSERT query
                    columns = list(mapped_row.keys())
                    values = list(mapped_row.values())
                    placeholders = ','.join(['%s'] * len(columns))
                    
                    query = f"""
                        INSERT INTO {pg_table} ({','.join(columns)})
                        VALUES ({placeholders})
                        ON CONFLICT DO NOTHING
                    """
                    
                    pg_cursor.execute(query, values)
                    self.stats['records_migrated'] += 1
                
                self.pg_conn.commit()
                self.stats['tables_migrated'] += 1
                
        except Exception as e:
            logger.error(f"Failed to migrate SQLite table {table_name}: {e}")
            self.stats['errors'] += 1
            self.pg_conn.rollback()
    
    def determine_target_table(self, sqlite_table: str, sample_row: Dict) -> Optional[str]:
        """Determine target PostgreSQL table based on SQLite table name and content"""
        
        # Table mapping rules
        if 'conversation' in sqlite_table.lower():
            return 'conversations'
        elif 'message' in sqlite_table.lower():
            return 'messages'
        elif 'memory' in sqlite_table.lower() or 'preference' in sqlite_table.lower():
            return 'ai_memories'
        elif 'user' in sqlite_table.lower() or 'citizen' in sqlite_table.lower():
            return 'users'
        elif 'embedding' in sqlite_table.lower() or 'vector' in sqlite_table.lower():
            return 'embeddings'
        
        # Check by column names
        columns = set(sample_row.keys())
        if {'email', 'username'} & columns:
            return 'users'
        elif {'content', 'embedding'} & columns:
            return 'embeddings'
        elif {'message', 'response'} & columns:
            return 'messages'
        
        return None
    
    def map_sqlite_row(self, row: Dict, source_table: str, target_table: str) -> Dict:
        """Map SQLite row to PostgreSQL schema"""
        mapped = {}
        
        # Add metadata
        mapped['metadata'] = json.dumps({
            'source': 'sqlite',
            'source_table': source_table,
            'migration_date': datetime.now().isoformat()
        })
        
        # Table-specific mappings
        if target_table == 'users':
            mapped['username'] = row.get('name') or row.get('username') or f"user_{row.get('id', 'unknown')}"
            mapped['email'] = row.get('email') or f"{mapped['username']}@migrated.local"
            mapped['password_hash'] = row.get('password_hash') or 'migrated_account'
            mapped['created_at'] = row.get('created_at') or datetime.now()
            
        elif target_table == 'conversations':
            mapped['title'] = row.get('title') or 'Migrated Conversation'
            mapped['created_at'] = row.get('created_at') or datetime.now()
            
        elif target_table == 'messages':
            mapped['content'] = row.get('content') or row.get('message') or ''
            mapped['role'] = row.get('role') or 'user'
            mapped['created_at'] = row.get('created_at') or datetime.now()
            
        # Copy over matching fields
        for key, value in row.items():
            if key not in mapped and key != 'id':  # Skip ID to let PostgreSQL generate new ones
                mapped[key] = value
        
        return mapped
    
    def consolidate_duplicate_tables(self):
        """Consolidate duplicate table definitions"""
        logger.info("Consolidating duplicate tables...")
        
        with self.pg_conn.cursor() as cur:
            # Find duplicate message tables
            cur.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name IN ('messages', 'message', 'chat_messages', 'robbie_messages')
            """)
            
            message_tables = [row[0] for row in cur.fetchall()]
            
            if len(message_tables) > 1:
                logger.info(f"Found {len(message_tables)} message tables to consolidate")
                
                # Keep 'messages' as the primary table
                for table in message_tables:
                    if table != 'messages':
                        try:
                            # Copy data to main table
                            cur.execute(f"""
                                INSERT INTO messages (content, role, created_at, metadata)
                                SELECT 
                                    COALESCE(content, message, text) as content,
                                    COALESCE(role, sender, 'user') as role,
                                    COALESCE(created_at, timestamp, NOW()) as created_at,
                                    jsonb_build_object('source_table', '{table}') as metadata
                                FROM {table}
                                ON CONFLICT DO NOTHING
                            """)
                            
                            rows_copied = cur.rowcount
                            self.stats['records_migrated'] += rows_copied
                            
                            # Rename old table
                            cur.execute(f"ALTER TABLE {table} RENAME TO _consolidated_{table}")
                            
                            logger.info(f"Consolidated {rows_copied} records from {table}")
                            
                        except Exception as e:
                            logger.error(f"Failed to consolidate {table}: {e}")
                            self.stats['errors'] += 1
                
                self.pg_conn.commit()
    
    def run_migration(self):
        """Run the complete migration process"""
        logger.info("Starting Aurora database migration...")
        logger.info("=" * 50)
        
        if not self.connect_postgres():
            logger.error("Cannot proceed without database connection")
            return False
        
        try:
            # Step 1: Backup existing data
            self.backup_existing_data()
            
            # Step 2: Run unified schema SQL files
            self.execute_schema_files()
            
            # Step 3: Migrate conversations
            self.migrate_conversations()
            
            # Step 4: Migrate SQLite databases
            self.migrate_sqlite_data()
            
            # Step 5: Consolidate duplicate tables
            self.consolidate_duplicate_tables()
            
            # Step 6: Clean up and optimize
            self.cleanup_and_optimize()
            
            logger.info("=" * 50)
            logger.info("Migration completed successfully!")
            logger.info(f"Tables migrated: {self.stats['tables_migrated']}")
            logger.info(f"Records migrated: {self.stats['records_migrated']}")
            logger.info(f"Errors: {self.stats['errors']}")
            
            if self.stats['warnings']:
                logger.warning(f"Warnings: {len(self.stats['warnings'])}")
                for warning in self.stats['warnings']:
                    logger.warning(f"  - {warning}")
            
            return True
            
        except Exception as e:
            logger.error(f"Migration failed: {e}")
            return False
        
        finally:
            if self.pg_conn:
                self.pg_conn.close()
    
    def execute_schema_files(self):
        """Execute unified schema SQL files"""
        logger.info("Executing unified schema files...")
        
        schema_dir = Path('/workspace/aurora/database/unified-schema')
        schema_files = sorted(schema_dir.glob('*.sql'))
        
        with self.pg_conn.cursor() as cur:
            for schema_file in schema_files:
                logger.info(f"Executing {schema_file.name}...")
                
                try:
                    with open(schema_file, 'r') as f:
                        sql = f.read()
                        cur.execute(sql)
                        self.pg_conn.commit()
                        logger.info(f"  ✓ {schema_file.name} executed successfully")
                        
                except Exception as e:
                    logger.error(f"  ✗ Failed to execute {schema_file.name}: {e}")
                    self.stats['errors'] += 1
                    self.pg_conn.rollback()
    
    def cleanup_and_optimize(self):
        """Clean up after migration and optimize database"""
        logger.info("Cleaning up and optimizing...")
        
        with self.pg_conn.cursor() as cur:
            try:
                # Update statistics
                cur.execute("ANALYZE")
                
                # Reindex tables
                cur.execute("""
                    SELECT 'REINDEX TABLE ' || tablename || ';' 
                    FROM pg_tables 
                    WHERE schemaname = 'public'
                """)
                
                reindex_commands = cur.fetchall()
                for cmd in reindex_commands:
                    cur.execute(cmd[0])
                
                # Clean up old migration tables
                cur.execute("""
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND (table_name LIKE '_migrated_%' OR table_name LIKE '_consolidated_%')
                """)
                
                old_tables = cur.fetchall()
                if old_tables:
                    logger.info(f"Found {len(old_tables)} old tables to remove")
                    # Note: In production, you might want to keep these for a while
                    # for table in old_tables:
                    #     cur.execute(f"DROP TABLE IF EXISTS {table[0]}")
                
                self.pg_conn.commit()
                logger.info("Cleanup and optimization completed")
                
            except Exception as e:
                logger.error(f"Cleanup failed: {e}")
                self.pg_conn.rollback()

def main():
    """Main migration entry point"""
    
    # Configuration
    pg_config = {
        'host': os.getenv('DB_HOST', 'localhost'),
        'port': os.getenv('DB_PORT', 5432),
        'database': os.getenv('DB_NAME', 'aurora'),
        'user': os.getenv('DB_USER', 'aurora_app'),
        'password': os.getenv('DB_PASSWORD', 'password')
    }
    
    # SQLite databases to migrate
    sqlite_paths = [
        '/workspace/aurora/robbiebook.db',
        '/workspace/aurora/data/local.db',
        '/workspace/aurora/src/robbie.db'
    ]
    
    # Run migration
    migrator = DatabaseMigrator(pg_config, sqlite_paths)
    success = migrator.run_migration()
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()



