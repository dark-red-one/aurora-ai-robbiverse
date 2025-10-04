#!/usr/bin/env python3
"""
Aurora AI Empire - PGvector Database Setup
"""

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import numpy as np
from pgvector.psycopg2 import register_vector

class PGvectorSetup:
    def __init__(self):
        self.connection_params = {
            'host': 'localhost',
            'port': 5432,
            'database': 'aurora',
            'user': 'robbie',
            'password': 'secure_aurora_password_123'
        }
    
    def setup_database(self):
        """Set up PGvector database"""
        try:
            # Connect to PostgreSQL
            conn = psycopg2.connect(**self.connection_params)
            conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
            cursor = conn.cursor()
            
            # Enable vector extension
            cursor.execute("CREATE EXTENSION IF NOT EXISTS vector;")
            print("✅ Vector extension enabled")
            
            # Create embeddings table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS embeddings (
                    id SERIAL PRIMARY KEY,
                    content TEXT NOT NULL,
                    embedding VECTOR(1536),
                    metadata JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            print("✅ Embeddings table created")
            
            # Create index for vector similarity search
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS embeddings_vector_idx 
                ON embeddings USING ivfflat (embedding vector_cosine_ops);
            """)
            print("✅ Vector index created")
            
            # Create chat sessions table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS chat_sessions (
                    id SERIAL PRIMARY KEY,
                    session_id VARCHAR(255) UNIQUE NOT NULL,
                    user_id VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            print("✅ Chat sessions table created")
            
            # Create messages table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS messages (
                    id SERIAL PRIMARY KEY,
                    session_id VARCHAR(255) NOT NULL,
                    role VARCHAR(50) NOT NULL,
                    content TEXT NOT NULL,
                    embedding VECTOR(1536),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (session_id) REFERENCES chat_sessions(session_id)
                );
            """)
            print("✅ Messages table created")
            
            cursor.close()
            conn.close()
            
            print("✅ PGvector database setup complete!")
            return True
            
        except Exception as e:
            print(f"❌ Error setting up database: {e}")
            return False
    
    def test_vector_operations(self):
        """Test vector operations"""
        try:
            conn = psycopg2.connect(**self.connection_params)
            register_vector(conn)
            cursor = conn.cursor()
            
            # Test vector insertion
            test_embedding = np.random.rand(1536).tolist()
            cursor.execute(
                "INSERT INTO embeddings (content, embedding) VALUES (%s, %s)",
                ("Test content", test_embedding)
            )
            
            # Test vector similarity search
            cursor.execute(
                "SELECT content, embedding <-> %s as distance FROM embeddings ORDER BY distance LIMIT 5",
                (test_embedding,)
            )
            results = cursor.fetchall()
            
            print(f"✅ Vector operations test successful - {len(results)} results")
            
            cursor.close()
            conn.close()
            return True
            
        except Exception as e:
            print(f"❌ Error testing vector operations: {e}")
            return False

if __name__ == "__main__":
    pgvector = PGvectorSetup()
    print("📊 Setting up PGvector database...")
    pgvector.setup_database()
    print("🧪 Testing vector operations...")
    pgvector.test_vector_operations()
