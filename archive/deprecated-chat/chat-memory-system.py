#!/usr/bin/env python3
"""
Chat Memory Vectorization System
Captures, embeds, and stores all Allan ↔ Robbie conversations
Uses MLX for fast embedding generation on M3 Max
"""

import asyncio
import os
import sys
sys.path.insert(0, '/Library/PostgreSQL/16/lib/python')
import psycopg2
import psycopg2.extras
from datetime import datetime
import json
import hashlib
import chromadb
from chromadb.config import Settings

class ChatMemorySystem:
    def __init__(self):
        self.chroma_client = chromadb.PersistentClient(
            path="/Users/allanperetz/aurora-ai-robbiverse/data/chat_vectors"
        )
        
        # Get or create collection
        self.collection = self.chroma_client.get_or_create_collection(
            name="allan_robbie_conversations",
            metadata={"description": "All conversations between Allan and Robbie"}
        )
        
        # PostgreSQL connection
        self.pg_conn = psycopg2.connect(
            host="localhost",
            port=5432,
            user="postgres",
            database="aurora_unified"
        )
        
        self.setup_schema()
    
    def setup_schema(self):
        """Create conversation memory tables"""
        cur = self.pg_conn.cursor()
        
        # Conversation messages table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS conversation_messages (
                id SERIAL PRIMARY KEY,
                conversation_id VARCHAR(100),
                speaker VARCHAR(50) NOT NULL,  -- 'allan' or 'robbie'
                message TEXT NOT NULL,
                message_hash VARCHAR(64) UNIQUE,
                context JSONB,  -- mood, topic, etc
                created_at TIMESTAMP DEFAULT NOW(),
                embedding_id VARCHAR(100),  -- ChromaDB ID
                vectorized BOOLEAN DEFAULT false
            );
            
            CREATE INDEX IF NOT EXISTS idx_conv_messages_speaker ON conversation_messages(speaker);
            CREATE INDEX IF NOT EXISTS idx_conv_messages_created ON conversation_messages(created_at);
            CREATE INDEX IF NOT EXISTS idx_conv_messages_vectorized ON conversation_messages(vectorized);
        """)
        
        # Conversation summary table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS conversation_summaries (
                id SERIAL PRIMARY KEY,
                conversation_id VARCHAR(100) UNIQUE,
                session_date DATE,
                total_messages INTEGER,
                key_topics JSONB,
                decisions_made JSONB,
                action_items JSONB,
                mood_progression JSONB,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        """)
        
        self.pg_conn.commit()
        cur.close()
        print("✅ Chat memory schema ready")
    
    def save_message(self, speaker, message, context=None):
        """Save a single message"""
        # Create message hash to avoid duplicates
        msg_hash = hashlib.sha256(f"{speaker}:{message}".encode()).hexdigest()
        
        cur = self.pg_conn.cursor()
        
        try:
            cur.execute("""
                INSERT INTO conversation_messages 
                (speaker, message, message_hash, context, conversation_id)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (message_hash) DO NOTHING
                RETURNING id
            """, (
                speaker, 
                message, 
                msg_hash, 
                json.dumps(context or {}),
                datetime.now().strftime('%Y-%m-%d')
            ))
            
            result = cur.fetchone()
            self.pg_conn.commit()
            
            if result:
                msg_id = result[0]
                print(f"✅ Saved message {msg_id} from {speaker}")
                return msg_id
            else:
                print(f"ℹ️  Message already exists (duplicate)")
                return None
                
        except Exception as e:
            print(f"❌ Error saving message: {e}")
            self.pg_conn.rollback()
            return None
        finally:
            cur.close()
    
    async def vectorize_unprocessed_messages(self):
        """Vectorize any messages that don't have embeddings yet"""
        cur = self.pg_conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        cur.execute("""
            SELECT id, speaker, message, context, created_at
            FROM conversation_messages
            WHERE vectorized = false
            ORDER BY created_at
            LIMIT 100
        """)
        
        messages = cur.fetchall()
        
        if not messages:
            print("ℹ️  No new messages to vectorize")
            return
        
        print(f"🧠 Vectorizing {len(messages)} messages...")
        
        for msg in messages:
            # Create searchable text combining speaker, message, context
            searchable_text = f"{msg['speaker']}: {msg['message']}"
            if msg['context']:
                context_str = json.dumps(msg['context'])
                searchable_text += f" [Context: {context_str}]"
            
            # Add to ChromaDB
            embedding_id = f"msg_{msg['id']}"
            
            try:
                self.collection.add(
                    documents=[searchable_text],
                    metadatas=[{
                        "speaker": msg['speaker'],
                        "created_at": msg['created_at'].isoformat(),
                        "message_id": msg['id']
                    }],
                    ids=[embedding_id]
                )
                
                # Mark as vectorized in PostgreSQL
                update_cur = self.pg_conn.cursor()
                update_cur.execute("""
                    UPDATE conversation_messages
                    SET vectorized = true, embedding_id = %s
                    WHERE id = %s
                """, (embedding_id, msg['id']))
                self.pg_conn.commit()
                update_cur.close()
                
                print(f"  ✅ Vectorized message {msg['id']}")
                
            except Exception as e:
                print(f"  ❌ Error vectorizing message {msg['id']}: {e}")
        
        cur.close()
        print(f"✅ Vectorization complete - {len(messages)} messages processed")
    
    def search_memory(self, query, n_results=5):
        """Search conversation history"""
        results = self.collection.query(
            query_texts=[query],
            n_results=n_results
        )
        
        print(f"\n🔍 Search: '{query}'")
        print(f"📊 Found {len(results['documents'][0])} relevant conversations:")
        print("")
        
        for i, (doc, metadata) in enumerate(zip(results['documents'][0], results['metadatas'][0])):
            print(f"{i+1}. [{metadata['created_at']}] {metadata['speaker']}:")
            print(f"   {doc[:200]}...")
            print("")
        
        return results
    
    def __del__(self):
        if hasattr(self, 'pg_conn'):
            self.pg_conn.close()

# Create global instance
chat_memory = ChatMemorySystem()

# CLI Interface
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "save":
            # Save a test message
            speaker = sys.argv[2] if len(sys.argv) > 2 else "allan"
            message = " ".join(sys.argv[3:]) if len(sys.argv) > 3 else "Test message"
            chat_memory.save_message(speaker, message, {"source": "cli"})
            
        elif command == "vectorize":
            # Vectorize unprocessed messages
            asyncio.run(chat_memory.vectorize_unprocessed_messages())
            
        elif command == "search":
            # Search memory
            query = " ".join(sys.argv[2:])
            chat_memory.search_memory(query)
            
        elif command == "test":
            # Full test
            print("🧪 Testing Chat Memory System")
            print("=" * 50)
            
            # Save test messages
            chat_memory.save_message("allan", "I want to close the PepsiCo deal faster", {"mood": "determined"})
            chat_memory.save_message("robbie", "Let's analyze the deal momentum and create a sprint plan", {"mood": "focused"})
            chat_memory.save_message("allan", "What did we discuss about pricing last week?", {"mood": "curious"})
            
            # Vectorize
            asyncio.run(chat_memory.vectorize_unprocessed_messages())
            
            # Search
            print("\n" + "=" * 50)
            chat_memory.search_memory("PepsiCo deal strategy")
            
    else:
        print("""
🧠 Chat Memory System - Usage:

  python3 chat-memory-system.py save <speaker> <message>
  python3 chat-memory-system.py vectorize
  python3 chat-memory-system.py search <query>
  python3 chat-memory-system.py test

Examples:
  python3 chat-memory-system.py save allan "Close PepsiCo deal"
  python3 chat-memory-system.py vectorize
  python3 chat-memory-system.py search "What did Allan say about deals?"
        """)

