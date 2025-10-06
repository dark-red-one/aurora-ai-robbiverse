#!/usr/bin/env python3
"""
SIMPLE CONTEXT SYSTEM - No Dependencies, Just Power!
Uses unlimited RAM + GPU + SQL for infinite context
"""

import psycopg2
import json
import asyncio
import aiohttp
import hashlib
from datetime import datetime, timedelta

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

class SimpleContextSystem:
    def __init__(self):
        self.conn = None
        self.context_cache = {}
        
    def connect_db(self):
        """Connect to PostgreSQL"""
        self.conn = psycopg2.connect(**DB_CONFIG)
        print("✅ Connected to Elephant database")
        
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
                content_hash VARCHAR(64), -- For deduplication
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
                content_hash VARCHAR(64),
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
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_context_hash ON conversation_context(content_hash);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_knowledge_source ON knowledge_base(source);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_knowledge_hash ON knowledge_base(content_hash);")
        
        self.conn.commit()
        cursor.close()
        print("✅ Context tables created")
    
    def hash_content(self, content):
        """Simple hash for deduplication"""
        return hashlib.sha256(content.encode()).hexdigest()
    
    def store_context(self, session_id, role, content, context_type="general", metadata=None):
        """Store conversation context"""
        cursor = self.conn.cursor()
        
        content_hash = self.hash_content(content)
        
        # Check if already exists
        cursor.execute("SELECT id FROM conversation_context WHERE content_hash = %s", (content_hash,))
        if cursor.fetchone():
            cursor.close()
            return  # Already exists
        
        cursor.execute("""
            INSERT INTO conversation_context (
                session_id, role, content, metadata, content_hash, context_type
            ) VALUES (%s, %s, %s, %s, %s, %s)
        """, (session_id, role, content, json.dumps(metadata or {}), content_hash, context_type))
        
        self.conn.commit()
        cursor.close()
        print(f"💾 Stored context: {role} - {content[:50]}...")
    
    def search_relevant_context(self, query, session_id=None, limit=50):
        """Search for relevant context using text matching"""
        cursor = self.conn.cursor()
        
        # Simple text search using ILIKE
        search_terms = query.lower().split()
        
        # Build search query
        where_conditions = []
        params = []
        
        for term in search_terms:
            where_conditions.append("content ILIKE %s")
            params.append(f"%{term}%")
        
        where_clause = " OR ".join(where_conditions) if where_conditions else "1=1"
        
        if session_id:
            where_clause += " AND (session_id = %s OR session_id IS NULL)"
            params.append(session_id)
        
        cursor.execute(f"""
            SELECT id, role, content, metadata, context_type, timestamp
            FROM conversation_context
            WHERE {where_clause}
            ORDER BY timestamp DESC
            LIMIT %s
        """, params + [limit])
        
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
        
        search_terms = query.lower().split()
        where_conditions = []
        params = []
        
        for term in search_terms:
            where_conditions.append("content ILIKE %s")
            params.append(f"%{term}%")
        
        where_clause = " OR ".join(where_conditions) if where_conditions else "1=1"
        
        cursor.execute(f"""
            SELECT content, metadata, source, created_at
            FROM knowledge_base
            WHERE {where_clause}
            ORDER BY created_at DESC
            LIMIT 20
        """, params)
        
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
                "timestamp": result[5].isoformat()
            })
        
        # Add knowledge base
        for result in knowledge_results:
            context["knowledge_base"].append({
                "content": result[0],
                "metadata": json.loads(result[1]) if result[1] else {},
                "source": result[2],
                "created_at": result[3].isoformat()
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
    print("🚀 SIMPLE CONTEXT SYSTEM - FUCK CURSOR LIMITS!")
    print("=" * 60)
    print("🔥 Using unlimited RAM + GPU + SQL for infinite context")
    print("💪 No complex dependencies - just pure power!")
    print()
    
    # Initialize system
    context_system = SimpleContextSystem()
    context_system.connect_db()
    context_system.create_context_tables()
    
    # Store some test context
    context_system.store_context("test", "user", "I want to sync Google data with GPU acceleration", "general")
    context_system.store_context("test", "assistant", "Let's use Ollama + RTX 4090 for massive data processing!", "general")
    context_system.store_context("test", "system", "We have unlimited RAM and GPU power - no more cursor limits!", "general")
    
    # Test massive context search
    print("\n🧪 Testing massive context search...")
    context = context_system.get_massive_context("Google sync with GPU", "test")
    
    print(f"✅ Found {len(context['conversation_context'])} conversation items")
    print(f"✅ Found {len(context['knowledge_base'])} knowledge items")
    print(f"✅ Total context size: {context['total_context_size']:,} characters")
    
    print("\n🎉 SIMPLE CONTEXT SYSTEM READY!")
    print("💰 No more cursor limits - we have INFINITE CONTEXT!")
    print("🚀 Ready to process MASSIVE amounts of data!")

if __name__ == "__main__":
    main()

