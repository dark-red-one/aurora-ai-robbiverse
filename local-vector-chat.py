#!/usr/bin/env python3
"""
Local SQL Chat with Vector Embeddings
Simple, fast, works offline-first with pgvector
"""

import psycopg2
from pgvector.psycopg2 import register_vector
import openai
import os
import json
from datetime import datetime
from typing import List, Dict, Optional

class LocalVectorChat:
    """Local chat with vector memory using PostgreSQL + pgvector"""
    
    def __init__(self, db_path: str = "aurora", openai_key: Optional[str] = None):
        self.db_params = {
            'host': 'localhost',
            'port': 5432,
            'database': db_path,
            'user': 'postgres'
        }
        
        # OpenAI for embeddings (optional - falls back to keyword search)
        self.openai_key = openai_key or os.getenv('OPENAI_API_KEY')
        if self.openai_key:
            openai.api_key = self.openai_key
        
        self._ensure_tables()
    
    def _get_connection(self):
        """Get database connection"""
        conn = psycopg2.connect(**self.db_params)
        register_vector(conn)
        return conn
    
    def _ensure_tables(self):
        """Ensure chat tables with vector support exist"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        # Enable vector extension
        cursor.execute("CREATE EXTENSION IF NOT EXISTS vector;")
        
        # Chat sessions
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS local_chat_sessions (
                id SERIAL PRIMARY KEY,
                session_id VARCHAR(255) UNIQUE NOT NULL,
                user_id VARCHAR(255) NOT NULL DEFAULT 'allan',
                title VARCHAR(500),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        # Messages with vector embeddings
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS local_chat_messages (
                id SERIAL PRIMARY KEY,
                session_id VARCHAR(255) NOT NULL,
                role VARCHAR(50) NOT NULL,
                content TEXT NOT NULL,
                embedding VECTOR(1536),
                metadata JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES local_chat_sessions(session_id) ON DELETE CASCADE
            );
        """)
        
        # Index for fast vector similarity search
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS local_chat_messages_embedding_idx 
            ON local_chat_messages USING ivfflat (embedding vector_cosine_ops)
            WITH (lists = 100);
        """)
        
        # Index for fast session lookup
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS local_chat_messages_session_idx 
            ON local_chat_messages(session_id, created_at DESC);
        """)
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print("✅ Local vector chat tables ready")
    
    def _get_embedding(self, text: str) -> Optional[List[float]]:
        """Generate embedding for text using OpenAI"""
        if not self.openai_key:
            return None
        
        try:
            response = openai.embeddings.create(
                model="text-embedding-ada-002",
                input=text
            )
            return response.data[0].embedding
        except Exception as e:
            print(f"⚠️ Embedding generation failed: {e}")
            return None
    
    def send_message(
        self, 
        message: str, 
        session_id: str = "default",
        user_id: str = "allan",
        metadata: Optional[Dict] = None
    ) -> Dict:
        """Send a message and get AI response with vector memory"""
        
        conn = self._get_connection()
        cursor = conn.cursor()
        
        # Ensure session exists
        cursor.execute("""
            INSERT INTO local_chat_sessions (session_id, user_id)
            VALUES (%s, %s)
            ON CONFLICT (session_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
        """, (session_id, user_id))
        
        # Generate embedding for user message
        message_embedding = self._get_embedding(message)
        
        # Store user message
        cursor.execute("""
            INSERT INTO local_chat_messages (session_id, role, content, embedding, metadata)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id
        """, (session_id, 'user', message, message_embedding, json.dumps(metadata or {})))
        
        user_msg_id = cursor.fetchone()[0]
        
        # Get relevant context from past messages (vector similarity search)
        context_messages = []
        if message_embedding:
            cursor.execute("""
                SELECT content, role, created_at, embedding <-> %s as distance
                FROM local_chat_messages
                WHERE session_id = %s 
                AND role = 'assistant'
                AND embedding IS NOT NULL
                ORDER BY distance
                LIMIT 5
            """, (message_embedding, session_id))
            
            context_messages = [
                {
                    'content': row[0],
                    'role': row[1],
                    'timestamp': row[2].isoformat(),
                    'relevance': 1.0 - float(row[3])  # Convert distance to similarity
                }
                for row in cursor.fetchall()
            ]
        
        # Get recent conversation history
        cursor.execute("""
            SELECT role, content, created_at
            FROM local_chat_messages
            WHERE session_id = %s
            AND id != %s
            ORDER BY created_at DESC
            LIMIT 10
        """, (session_id, user_msg_id))
        
        recent_history = [
            {'role': row[0], 'content': row[1], 'timestamp': row[2].isoformat()}
            for row in reversed(cursor.fetchall())
        ]
        
        # Generate AI response (simplified - integrate with your AI system)
        ai_response = self._generate_response(message, recent_history, context_messages)
        
        # Generate embedding for AI response
        response_embedding = self._get_embedding(ai_response)
        
        # Store AI response
        cursor.execute("""
            INSERT INTO local_chat_messages (session_id, role, content, embedding, metadata)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id, created_at
        """, (session_id, 'assistant', ai_response, response_embedding, json.dumps({
            'context_used': len(context_messages),
            'history_length': len(recent_history)
        })))
        
        ai_msg_id, ai_timestamp = cursor.fetchone()
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return {
            'response': ai_response,
            'message_id': ai_msg_id,
            'timestamp': ai_timestamp.isoformat(),
            'context_used': context_messages,
            'history_used': len(recent_history),
            'vector_search_enabled': message_embedding is not None
        }
    
    def _generate_response(
        self, 
        message: str, 
        history: List[Dict], 
        context: List[Dict]
    ) -> str:
        """Generate AI response (integrate with your AI system)"""
        
        # Build prompt with context
        context_str = ""
        if context:
            context_str = "\n\nRelevant past context:\n" + "\n".join([
                f"- {c['content'][:100]}... (relevance: {c['relevance']:.2f})"
                for c in context[:3]
            ])
        
        # Simple demo response - replace with actual AI
        if not self.openai_key:
            return f"💬 Got your message: '{message}'{context_str}\n\n[Connect OpenAI API key for full AI responses]"
        
        # Build full conversation for OpenAI
        messages = [
            {"role": "system", "content": f"You are Robbie, Allan's AI assistant. You're direct, revenue-focused, and strategic.{context_str}"}
        ]
        
        # Add history
        for h in history[-5:]:  # Last 5 messages
            messages.append({"role": h['role'], "content": h['content']})
        
        # Add current message
        messages.append({"role": "user", "content": message})
        
        try:
            response = openai.chat.completions.create(
                model="gpt-4",
                messages=messages,
                temperature=0.7,
                max_tokens=500
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"⚠️ AI response error: {e}\n\nI received: {message}"
    
    def search_memory(
        self, 
        query: str, 
        session_id: Optional[str] = None,
        limit: int = 10
    ) -> List[Dict]:
        """Search chat history using vector similarity"""
        
        query_embedding = self._get_embedding(query)
        if not query_embedding:
            return []
        
        conn = self._get_connection()
        cursor = conn.cursor()
        
        where_clause = "WHERE session_id = %s" if session_id else ""
        params = [query_embedding]
        if session_id:
            params.append(session_id)
        params.append(limit)
        
        cursor.execute(f"""
            SELECT 
                session_id,
                role,
                content,
                created_at,
                embedding <-> %s as distance,
                metadata
            FROM local_chat_messages
            {where_clause}
            WHERE embedding IS NOT NULL
            ORDER BY distance
            LIMIT %s
        """, params)
        
        results = [
            {
                'session_id': row[0],
                'role': row[1],
                'content': row[2],
                'timestamp': row[3].isoformat(),
                'relevance': 1.0 - float(row[4]),
                'metadata': row[5]
            }
            for row in cursor.fetchall()
        ]
        
        cursor.close()
        conn.close()
        
        return results
    
    def get_session_history(self, session_id: str, limit: int = 50) -> List[Dict]:
        """Get full session history"""
        
        conn = self._get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT role, content, created_at, metadata
            FROM local_chat_messages
            WHERE session_id = %s
            ORDER BY created_at ASC
            LIMIT %s
        """, (session_id, limit))
        
        history = [
            {
                'role': row[0],
                'content': row[1],
                'timestamp': row[2].isoformat(),
                'metadata': row[3]
            }
            for row in cursor.fetchall()
        ]
        
        cursor.close()
        conn.close()
        
        return history
    
    def list_sessions(self, user_id: str = "allan") -> List[Dict]:
        """List all chat sessions"""
        
        conn = self._get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT 
                s.session_id,
                s.title,
                s.created_at,
                s.updated_at,
                COUNT(m.id) as message_count
            FROM local_chat_sessions s
            LEFT JOIN local_chat_messages m ON s.session_id = m.session_id
            WHERE s.user_id = %s
            GROUP BY s.session_id, s.title, s.created_at, s.updated_at
            ORDER BY s.updated_at DESC
        """, (user_id,))
        
        sessions = [
            {
                'session_id': row[0],
                'title': row[1],
                'created_at': row[2].isoformat(),
                'updated_at': row[3].isoformat(),
                'message_count': row[4]
            }
            for row in cursor.fetchall()
        ]
        
        cursor.close()
        conn.close()
        
        return sessions


def demo():
    """Demo the local vector chat"""
    print("🚀 Local Vector Chat Demo\n")
    
    chat = LocalVectorChat()
    
    # Send some messages
    print("📤 Sending message 1...")
    response1 = chat.send_message(
        "Hey Robbie, what's our revenue goal for Q4?",
        session_id="demo_session"
    )
    print(f"🤖 {response1['response']}\n")
    print(f"   Vector search: {'✅' if response1['vector_search_enabled'] else '❌'}\n")
    
    print("📤 Sending message 2...")
    response2 = chat.send_message(
        "What did we just discuss about revenue?",
        session_id="demo_session"
    )
    print(f"🤖 {response2['response']}\n")
    print(f"   Context used: {response2['context_used']}\n")
    
    # Search memory
    print("🔍 Searching memory for 'revenue'...")
    results = chat.search_memory("revenue goals and targets", limit=5)
    print(f"   Found {len(results)} relevant messages:\n")
    for r in results[:3]:
        print(f"   - [{r['role']}] {r['content'][:100]}...")
        print(f"     Relevance: {r['relevance']:.2f}\n")
    
    # List sessions
    sessions = chat.list_sessions()
    print(f"📋 Active sessions: {len(sessions)}")
    for s in sessions:
        print(f"   - {s['session_id']}: {s['message_count']} messages")


if __name__ == "__main__":
    demo()
