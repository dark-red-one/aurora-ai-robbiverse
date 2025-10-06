#!/usr/bin/env python3
"""
MASSIVE CONTEXT SYSTEM - Fuck Cursor Limits!
Uses unlimited RAM + GPU + SQL for infinite context
"""

import psycopg2
import json
import asyncio
import aiohttp
from datetime import datetime, timedelta
from sentence_transformers import SentenceTransformer
import numpy as np

# Database config
DB_CONFIG = {
    "host": "aurora-postgres-u44170.vm.elestio.app",
    "port": 25432,
    "dbname": "aurora_unified",
    "user": "aurora_app",
    "password": "TestPilot2025_Aurora!",
    "sslmode": "require"
}

# Local LLM config
OLLAMA_URL = "http://localhost:11434"

class MassiveContextSystem:
    def __init__(self):
        self.conn = None
        self.embedding_model = None
        self.context_cache = {}
        
    def connect_db(self):
        """Connect to PostgreSQL with vector support"""
        self.conn = psycopg2.connect(**DB_CONFIG)
        print("✅ Connected to Elephant database")
        
    def load_embedding_model(self):
        """Load sentence transformer for vector search"""
        try:
            self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
            print("✅ Embedding model loaded")
        except:
            print("⚠️ Using simple embedding fallback")
            self.embedding_model = None
    
    def create_context_tables(self):
        """Create massive context storage tables"""
        cursor = self.conn.cursor()
        
        # Conversation context table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS conversation_context (
                id SERIAL PRIMARY KEY,
                session_id VARCHAR(255),
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                role VARCHAR(20), -- 'user', 'assistant', 'system'
                content TEXT,
                metadata JSONB,
                embedding VECTOR(384), -- For semantic search
                importance_score FLOAT DEFAULT 1.0,
                context_type VARCHAR(50) -- 'email', 'calendar', 'code', 'general'
            )
        """)
        
        # Knowledge base table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS knowledge_base (
                id SERIAL PRIMARY KEY,
                source VARCHAR(255), -- 'gmail', 'calendar', 'drive', 'code'
                content TEXT,
                metadata JSONB,
                embedding VECTOR(384),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Context relationships
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS context_relationships (
                id SERIAL PRIMARY KEY,
                source_id INTEGER REFERENCES conversation_context(id),
                target_id INTEGER REFERENCES knowledge_base(id),
                relationship_type VARCHAR(50), -- 'mentions', 'relates_to', 'contradicts'
                strength FLOAT DEFAULT 1.0
            )
        """)
        
        # Create indexes for performance
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_context_session ON conversation_context(session_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_context_timestamp ON conversation_context(timestamp);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_context_type ON conversation_context(context_type);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_knowledge_source ON knowledge_base(source);")
        
        # Enable vector similarity search
        try:
            cursor.execute("CREATE EXTENSION IF NOT EXISTS vector;")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_context_embedding ON conversation_context USING ivfflat (embedding vector_cosine_ops);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_knowledge_embedding ON knowledge_base USING ivfflat (embedding vector_cosine_ops);")
            print("✅ Vector search enabled")
        except Exception as e:
            print(f"⚠️ Vector search not available: {e}")
        
        self.conn.commit()
        cursor.close()
        print("✅ Context tables created")
    
    def embed_text(self, text):
        """Generate embedding for text"""
        if self.embedding_model:
            return self.embedding_model.encode(text).tolist()
        else:
            # Simple fallback - just use word count as embedding
            words = text.lower().split()
            return [len(words)] + [words.count(word) for word in set(words)][:383]
    
    def store_context(self, session_id, role, content, context_type="general", metadata=None):
        """Store conversation context with embedding"""
        cursor = self.conn.cursor()
        
        embedding = self.embed_text(content)
        
        cursor.execute("""
            INSERT INTO conversation_context (
                session_id, role, content, metadata, embedding, context_type
            ) VALUES (%s, %s, %s, %s, %s, %s)
        """, (session_id, role, content, json.dumps(metadata or {}), embedding, context_type))
        
        self.conn.commit()
        cursor.close()
        print(f"💾 Stored context: {role} - {content[:50]}...")
    
    def search_relevant_context(self, query, session_id=None, limit=50):
        """Search for relevant context using vector similarity"""
        cursor = self.conn.cursor()
        
        query_embedding = self.embed_text(query)
        
        # Search conversation context
        cursor.execute("""
            SELECT id, role, content, metadata, context_type, timestamp,
                   embedding <=> %s as distance
            FROM conversation_context
            WHERE session_id = %s OR session_id IS NULL
            ORDER BY embedding <=> %s
            LIMIT %s
        """, (query_embedding, session_id, query_embedding, limit))
        
        results = cursor.fetchall()
        cursor.close()
        
        return results
    
    def get_massive_context(self, query, session_id=None):
        """Get massive context for any query"""
        print(f"🔍 Searching massive context for: {query[:50]}...")
        
        # Get relevant conversation context
        context_results = self.search_relevant_context(query, session_id, 30)
        
        # Get relevant knowledge base
        cursor = self.conn.cursor()
        query_embedding = self.embed_text(query)
        
        cursor.execute("""
            SELECT content, metadata, source, created_at,
                   embedding <=> %s as distance
            FROM knowledge_base
            ORDER BY embedding <=> %s
            LIMIT 20
        """, (query_embedding, query_embedding))
        
        knowledge_results = cursor.fetchall()
        cursor.close()
        
        # Build massive context
        context = {
            "query": query,
            "timestamp": datetime.now().isoformat(),
            "conversation_context": [],
            "knowledge_base": [],
            "total_context_size": 0
        }
        
        # Add conversation context
        for result in context_results:
            context["conversation_context"].append({
                "role": result[1],
                "content": result[2],
                "metadata": json.loads(result[3]) if result[3] else {},
                "context_type": result[4],
                "timestamp": result[5].isoformat(),
                "relevance": 1 - result[6]  # Convert distance to relevance
            })
        
        # Add knowledge base
        for result in knowledge_results:
            context["knowledge_base"].append({
                "content": result[0],
                "metadata": json.loads(result[1]) if result[1] else {},
                "source": result[2],
                "created_at": result[3].isoformat(),
                "relevance": 1 - result[4]
            })
        
        # Calculate total context size
        total_chars = sum(len(item["content"]) for item in context["conversation_context"])
        total_chars += sum(len(item["content"]) for item in context["knowledge_base"])
        context["total_context_size"] = total_chars
        
        print(f"📊 Massive context: {len(context['conversation_context'])} conv items, {len(context['knowledge_base'])} knowledge items, {total_chars:,} chars")
        
        return context
    
    async def process_with_massive_context(self, query, session_id=None):
        """Process query with massive context using local LLM"""
        # Get massive context
        context = self.get_massive_context(query, session_id)
        
        # Build context prompt
        context_prompt = f"""You are Robbie, Allan's AI executive assistant. Use this MASSIVE context to answer:

QUERY: {query}

CONVERSATION CONTEXT:
"""
        
        for item in context["conversation_context"][:10]:  # Top 10 most relevant
            context_prompt += f"\n[{item['role'].upper()}] {item['content']}\n"
        
        context_prompt += "\nKNOWLEDGE BASE:\n"
        
        for item in context["knowledge_base"][:10]:  # Top 10 most relevant
            context_prompt += f"\n[{item['source'].upper()}] {item['content']}\n"
        
        context_prompt += f"\n\nTotal context: {context['total_context_size']:,} characters\n"
        context_prompt += "Answer with full context awareness. Be direct, revenue-focused, and strategic."
        
        # Call Ollama with massive context
        try:
            async with aiohttp.ClientSession() as session:
                payload = {
                    "model": "llama3.1:8b",
                    "prompt": context_prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.7,
                        "top_p": 0.9,
                        "max_tokens": 2000
                    }
                }
                
                async with session.post(f"{OLLAMA_URL}/api/generate", json=payload) as response:
                    if response.status == 200:
                        result = await response.json()
                        response_text = result.get('response', '')
                        
                        # Store the response in context
                        self.store_context(session_id or "default", "assistant", response_text, "general")
                        
                        return response_text
                    else:
                        return f"Error: Ollama returned status {response.status}"
        except Exception as e:
            return f"Error calling Ollama: {e}"

def main():
    print("🚀 MASSIVE CONTEXT SYSTEM - FUCK CURSOR LIMITS!")
    print("=" * 60)
    print("🔥 Using unlimited RAM + GPU + SQL for infinite context")
    print()
    
    # Initialize system
    context_system = MassiveContextSystem()
    context_system.connect_db()
    context_system.load_embedding_model()
    context_system.create_context_tables()
    
    # Store some test context
    context_system.store_context("test", "user", "I want to sync Google data with GPU acceleration", "general")
    context_system.store_context("test", "assistant", "Let's use Ollama + RTX 4090 for massive data processing!", "general")
    
    # Test massive context search
    print("\n🧪 Testing massive context search...")
    context = context_system.get_massive_context("Google sync with GPU", "test")
    
    print(f"✅ Found {len(context['conversation_context'])} conversation items")
    print(f"✅ Found {len(context['knowledge_base'])} knowledge items")
    print(f"✅ Total context size: {context['total_context_size']:,} characters")
    
    print("\n🎉 MASSIVE CONTEXT SYSTEM READY!")
    print("💰 No more cursor limits - we have INFINITE CONTEXT!")

if __name__ == "__main__":
    main()

