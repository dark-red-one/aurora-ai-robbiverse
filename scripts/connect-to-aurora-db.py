#!/usr/bin/env python3
"""
Aurora Database Connection Script
Connects to Aurora Town PostgreSQL database
"""

import psycopg2
import psycopg2.extras
import os
from pathlib import Path
import json

class AuroraDatabase:
    def __init__(self):
        self.connection = None
        self.cursor = None
        
        # Aurora Town database configuration
        self.db_config = {
            'host': '45.32.194.172',
            'port': 5432,
            'database': 'aurora_unified',
            'user': 'postgres',
            'password': 'fun2Gus!!!'
        }
    
    def connect(self):
        """Connect to Aurora database"""
        try:
            print("🔗 Connecting to Aurora database...")
            self.connection = psycopg2.connect(**self.db_config)
            self.cursor = self.connection.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            print("✅ Connected to Aurora database successfully!")
            return True
        except Exception as e:
            print(f"❌ Database connection failed: {e}")
            return False
    
    def disconnect(self):
        """Disconnect from database"""
        if self.cursor:
            self.cursor.close()
        if self.connection:
            self.connection.close()
        print("👋 Disconnected from Aurora database")
    
    def execute_query(self, query, params=None):
        """Execute a query and return results"""
        try:
            self.cursor.execute(query, params)
            if query.strip().upper().startswith('SELECT'):
                return self.cursor.fetchall()
            else:
                self.connection.commit()
                return self.cursor.rowcount
        except Exception as e:
            print(f"❌ Query execution failed: {e}")
            return None
    
    def get_database_status(self):
        """Get database status and statistics"""
        try:
            # Get table counts
            tables = ['users', 'ai_personalities', 'conversations', 'deals', 'widgets', 'sites', 'gpu_nodes']
            status = {}
            
            for table in tables:
                result = self.execute_query(f"SELECT COUNT(*) as count FROM {table}")
                if result:
                    status[table] = result[0]['count']
            
            # Get revenue summary
            revenue = self.execute_query("SELECT * FROM revenue_summary")
            if revenue:
                status['revenue'] = dict(revenue[0])
            
            # Get widget status
            widgets = self.execute_query("SELECT * FROM widget_status")
            if widgets:
                status['widgets'] = [dict(row) for row in widgets]
            
            # Get GPU mesh status
            gpu = self.execute_query("SELECT * FROM gpu_mesh_status")
            if gpu:
                status['gpu_mesh'] = dict(gpu[0])
            
            return status
        except Exception as e:
            print(f"❌ Status query failed: {e}")
            return None
    
    def insert_conversation(self, user_id, message, response, personality_id=None, context=None):
        """Insert a conversation record"""
        query = """
        INSERT INTO conversations (user_id, message, response, personality_id, context)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING id
        """
        params = (user_id, message, response, personality_id, json.dumps(context) if context else None)
        result = self.execute_query(query, params)
        return result[0]['id'] if result else None
    
    def get_user_conversations(self, user_id, limit=10):
        """Get recent conversations for a user"""
        query = """
        SELECT c.*, p.name as personality_name
        FROM conversations c
        LEFT JOIN ai_personalities p ON c.personality_id = p.id
        WHERE c.user_id = %s
        ORDER BY c.created_at DESC
        LIMIT %s
        """
        return self.execute_query(query, (user_id, limit))
    
    def search_memories(self, user_id, query_text, limit=5):
        """Search memories using vector similarity"""
        # This would use pgvector for semantic search
        # For now, return text-based search
        query = """
        SELECT content, metadata, created_at
        FROM memory_vectors
        WHERE user_id = %s
        AND content ILIKE %s
        ORDER BY created_at DESC
        LIMIT %s
        """
        search_term = f"%{query_text}%"
        return self.execute_query(query, (user_id, search_term, limit))
    
    def get_deal_pipeline(self):
        """Get current deal pipeline"""
        query = """
        SELECT company, deal_value, probability, stage, created_at
        FROM deals
        ORDER BY deal_value DESC
        """
        return self.execute_query(query)
    
    def get_widget_status(self):
        """Get widget implementation status"""
        query = """
        SELECT name, category, implementation_status, priority
        FROM widgets
        ORDER BY priority, name
        """
        return self.execute_query(query)
    
    def test_connection(self):
        """Test database connection and basic functionality"""
        print("🧪 Testing Aurora database connection...")
        
        if not self.connect():
            return False
        
        # Test basic query
        result = self.execute_query("SELECT NOW() as current_time")
        if result:
            print(f"✅ Database time: {result[0]['current_time']}")
        
        # Get status
        status = self.get_database_status()
        if status:
            print("📊 Database Status:")
            for table, count in status.items():
                if isinstance(count, int):
                    print(f"   • {table}: {count} records")
        
        self.disconnect()
        return True

def main():
    """Main function to test database connection"""
    print("🚀 AURORA DATABASE CONNECTION TEST")
    print("==================================")
    
    db = AuroraDatabase()
    
    if db.test_connection():
        print("\n✅ Aurora database is ready!")
        print("🎯 Features available:")
        print("   • User management")
        print("   • AI personality tracking")
        print("   • Conversation memory")
        print("   • Deal pipeline management")
        print("   • Widget catalog")
        print("   • GPU mesh coordination")
        print("   • Analytics and metrics")
    else:
        print("\n❌ Aurora database connection failed!")
        print("🔧 Check Aurora Town server status")

if __name__ == "__main__":
    main()
