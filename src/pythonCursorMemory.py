#!/usr/bin/env python3
"""
Python Cursor Memory System
Saves and searches our Cursor conversation history
"""

import sqlite3
import json
import hashlib
import re
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional, Any
import asyncio

class PythonCursorMemory:
    def __init__(self, db_path: str = "./data/cursor_chat_memory.db"):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(exist_ok=True)
        self.conn = None
        self.is_initialized = False
        
        # Message types
        self.message_types = {
            'USER_QUERY': 'user_query',
            'ASSISTANT_RESPONSE': 'assistant_response',
            'CODE_BLOCK': 'code_block',
            'SYSTEM_MESSAGE': 'system_message'
        }
        
        # Current session
        self.current_session_id = self._generate_session_id()
        
    async def initialize(self):
        """Initialize the memory system"""
        try:
            print('🧠 Initializing Python Cursor Memory System...')
            
            self.conn = sqlite3.connect(str(self.db_path))
            self.conn.row_factory = sqlite3.Row  # Enable column access by name
            
            await self._setup_database()
            
            self.is_initialized = True
            print('✅ Python Cursor Memory System initialized successfully')
            
        except Exception as error:
            print(f'❌ Failed to initialize Python cursor memory: {error}')
            raise error
    
    async def _setup_database(self):
        """Set up the database schema"""
        cursor = self.conn.cursor()
        
        # Create cursor conversations table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS cursor_conversations (
                id TEXT PRIMARY KEY,
                session_id TEXT NOT NULL,
                message_type TEXT NOT NULL,
                content TEXT NOT NULL,
                content_hash TEXT UNIQUE,
                
                -- Context information
                file_context TEXT,
                code_blocks TEXT,
                metadata TEXT,
                
                -- Conversation flow
                parent_message_id TEXT,
                response_to TEXT,
                
                -- Timestamps
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                
                -- Search optimization
                searchable_text TEXT,
                keywords TEXT,
                topics TEXT,
                
                -- Importance and relevance
                importance_score REAL DEFAULT 0.5,
                access_count INTEGER DEFAULT 0,
                last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create conversation sessions table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS cursor_sessions (
                id TEXT PRIMARY KEY,
                session_name TEXT,
                start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                end_time DATETIME,
                total_messages INTEGER DEFAULT 0,
                key_topics TEXT,
                session_summary TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create indexes
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_cursor_session ON cursor_conversations (session_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_cursor_type ON cursor_conversations (message_type)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_cursor_created ON cursor_conversations (created_at)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_cursor_importance ON cursor_conversations (importance_score)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_cursor_searchable ON cursor_conversations (searchable_text)')
        
        self.conn.commit()
        cursor.close()
        print('📊 Database schema ready')
    
    def _generate_session_id(self) -> str:
        """Generate a session ID"""
        date = datetime.now()
        date_str = date.strftime('%Y-%m-%d')
        time_str = date.strftime('%H%M%S')
        return f'cursor_session_{date_str}_{time_str}'
    
    def _generate_message_id(self, msg_type: str, content: str) -> str:
        """Generate a message ID"""
        hash_obj = hashlib.sha256()
        hash_obj.update(f"{msg_type}{content}{datetime.now().isoformat()}".encode())
        return f'cursor_{msg_type}_{hash_obj.hexdigest()[:12]}'
    
    def _generate_content_hash(self, content: str) -> str:
        """Generate content hash"""
        return hashlib.sha256(content.encode()).hexdigest()
    
    def _extract_searchable_text(self, content: str) -> str:
        """Extract searchable text from content"""
        # Remove code blocks, markdown formatting
        searchable = content
        searchable = re.sub(r'```[\s\S]*?```', '', searchable)  # Remove code blocks
        searchable = re.sub(r'`[^`]*`', '', searchable)  # Remove inline code
        searchable = re.sub(r'[#*_~]', '', searchable)  # Remove markdown
        searchable = re.sub(r'\s+', ' ', searchable)  # Normalize whitespace
        return searchable.strip()
    
    def _extract_keywords(self, content: str) -> str:
        """Extract keywords from content"""
        # Simple keyword extraction
        words = re.findall(r'\b[a-zA-Z]{4,}\b', content.lower())
        
        # Filter out common words
        stop_words = {'this', 'that', 'with', 'from', 'they', 'have', 'will', 'been', 
                     'were', 'said', 'each', 'which', 'their', 'time', 'would', 'there', 
                     'could', 'other', 'some', 'what', 'when', 'where', 'why', 'how'}
        
        words = [word for word in words if word not in stop_words]
        
        # Count word frequency
        word_counts = {}
        for word in words:
            word_counts[word] = word_counts.get(word, 0) + 1
        
        # Get top 10 keywords
        top_keywords = sorted(word_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        return ','.join([word for word, count in top_keywords])
    
    def _extract_topics(self, content: str) -> str:
        """Extract topics from content"""
        topics = []
        
        # Topic patterns
        topic_patterns = {
            'gpu_architecture': r'gpu|mesh|coordinator|node',
            'memory_system': r'memory|vector|embedding|search',
            'customer_management': r'customer|dossier|relationship',
            'opportunity_tracking': r'sticky|note|opportunity',
            'personality_system': r'personality|mood|trait',
            'risk_management': r'risk|assessment|protection',
            'business_operations': r'business|deal|revenue|sales',
            'development': r'code|programming|development',
            'database': r'database|sql|postgres',
            'system_integration': r'api|integration|system'
        }
        
        content_lower = content.lower()
        for topic, pattern in topic_patterns.items():
            if re.search(pattern, content_lower):
                topics.append(topic)
        
        return ','.join(topics)
    
    def _calculate_importance_score(self, content: str, context: Dict = None) -> float:
        """Calculate importance score for content"""
        score = 0.5  # Base score
        
        # Boost for business-related content
        if re.search(r'revenue|deal|customer|business|sales', content, re.IGNORECASE):
            score += 0.3
        
        # Boost for technical architecture
        if re.search(r'architecture|system|integration|api', content, re.IGNORECASE):
            score += 0.2
        
        # Boost for decisions
        if re.search(r'decision|important|critical|priority', content, re.IGNORECASE):
            score += 0.2
        
        # Boost for code blocks
        if context and context.get('is_code'):
            score += 0.2
        
        # Boost for file references
        if context and context.get('file_context'):
            score += 0.1
        
        return min(1.0, score)
    
    async def save_user_query(self, query: str, context: Dict = None) -> str:
        """Save a user query"""
        try:
            if not self.is_initialized:
                raise Exception('Memory system not initialized')
            
            message_id = self._generate_message_id('user', query)
            content_hash = self._generate_content_hash(query)
            
            # Check if already saved
            cursor = self.conn.cursor()
            cursor.execute('SELECT id FROM cursor_conversations WHERE content_hash = ?', (content_hash,))
            existing = cursor.fetchone()
            
            if existing:
                print('📝 Query already saved, updating access count')
                await self._update_access_count(existing['id'])
                cursor.close()
                return existing['id']
            
            # Extract metadata
            searchable_text = self._extract_searchable_text(query)
            keywords = self._extract_keywords(query)
            topics = self._extract_topics(query)
            importance_score = self._calculate_importance_score(query, context)
            
            # Save to database
            cursor.execute('''
                INSERT INTO cursor_conversations (
                    id, session_id, message_type, content, content_hash,
                    file_context, metadata, searchable_text, keywords, topics, importance_score
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                message_id, self.current_session_id, self.message_types['USER_QUERY'],
                query, content_hash, json.dumps(context.get('file_context', {})) if context else None,
                json.dumps(context or {}), searchable_text, keywords, topics, importance_score
            ))
            
            self.conn.commit()
            cursor.close()
            
            print(f'💾 Saved user query: {query[:50]}...')
            return message_id
            
        except Exception as error:
            print(f'❌ Error saving user query: {error}')
            raise error
    
    async def save_assistant_response(self, response: str, user_query_id: str = None, context: Dict = None) -> str:
        """Save an assistant response"""
        try:
            if not self.is_initialized:
                raise Exception('Memory system not initialized')
            
            message_id = self._generate_message_id('assistant', response)
            content_hash = self._generate_content_hash(response)
            
            # Check if already saved
            cursor = self.conn.cursor()
            cursor.execute('SELECT id FROM cursor_conversations WHERE content_hash = ?', (content_hash,))
            existing = cursor.fetchone()
            
            if existing:
                print('📝 Response already saved, updating access count')
                await self._update_access_count(existing['id'])
                cursor.close()
                return existing['id']
            
            # Extract metadata
            searchable_text = self._extract_searchable_text(response)
            keywords = self._extract_keywords(response)
            topics = self._extract_topics(response)
            importance_score = self._calculate_importance_score(response, context)
            
            # Save to database
            cursor.execute('''
                INSERT INTO cursor_conversations (
                    id, session_id, message_type, content, content_hash,
                    file_context, metadata, searchable_text, keywords, topics, importance_score,
                    response_to
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                message_id, self.current_session_id, self.message_types['ASSISTANT_RESPONSE'],
                response, content_hash, json.dumps(context.get('file_context', {})) if context else None,
                json.dumps(context or {}), searchable_text, keywords, topics, importance_score,
                user_query_id
            ))
            
            self.conn.commit()
            cursor.close()
            
            print(f'💾 Saved assistant response: {response[:50]}...')
            return message_id
            
        except Exception as error:
            print(f'❌ Error saving assistant response: {error}')
            raise error
    
    async def search_conversations(self, query: str, limit: int = 10) -> List[Dict]:
        """Search conversations"""
        try:
            if not self.is_initialized:
                raise Exception('Memory system not initialized')
            
            cursor = self.conn.cursor()
            
            # Search in searchable text, keywords, and topics
            cursor.execute('''
                SELECT 
                    id, session_id, message_type, content, content_hash,
                    file_context, metadata, searchable_text, keywords, topics, importance_score,
                    created_at, access_count, last_accessed
                FROM cursor_conversations
                WHERE searchable_text LIKE ? OR keywords LIKE ? OR topics LIKE ?
                ORDER BY 
                    importance_score DESC,
                    CASE WHEN searchable_text LIKE ? THEN 1 ELSE 0 END DESC,
                    created_at DESC
                LIMIT ?
            ''', (f'%{query}%', f'%{query}%', f'%{query}%', f'%{query}%', limit))
            
            results = cursor.fetchall()
            
            # Update access counts
            for result in results:
                await self._update_access_count(result['id'])
            
            cursor.close()
            
            # Convert to list of dictionaries
            return [dict(result) for result in results]
            
        except Exception as error:
            print(f'❌ Error searching conversations: {error}')
            raise error
    
    async def get_conversation_history(self, session_id: str = None, limit: int = 50) -> List[Dict]:
        """Get conversation history"""
        try:
            if not self.is_initialized:
                raise Exception('Memory system not initialized')
            
            cursor = self.conn.cursor()
            
            if session_id:
                cursor.execute('''
                    SELECT 
                        id, session_id, message_type, content, file_context, metadata,
                        created_at, importance_score
                    FROM cursor_conversations
                    WHERE session_id = ?
                    ORDER BY created_at DESC
                    LIMIT ?
                ''', (session_id, limit))
            else:
                cursor.execute('''
                    SELECT 
                        id, session_id, message_type, content, file_context, metadata,
                        created_at, importance_score
                    FROM cursor_conversations
                    ORDER BY created_at DESC
                    LIMIT ?
                ''', (limit,))
            
            results = cursor.fetchall()
            cursor.close()
            
            return [dict(result) for result in results]
            
        except Exception as error:
            print(f'❌ Error getting conversation history: {error}')
            raise error
    
    async def get_memory_stats(self) -> Dict:
        """Get memory statistics"""
        try:
            if not self.is_initialized:
                raise Exception('Memory system not initialized')
            
            cursor = self.conn.cursor()
            
            # Total messages
            cursor.execute('SELECT COUNT(*) as count FROM cursor_conversations')
            total_messages = cursor.fetchone()['count']
            
            # Message types
            cursor.execute('''
                SELECT message_type, COUNT(*) as count
                FROM cursor_conversations
                GROUP BY message_type
                ORDER BY count DESC
            ''')
            message_types = [dict(row) for row in cursor.fetchall()]
            
            # Top topics
            cursor.execute('''
                SELECT topics, COUNT(*) as count
                FROM cursor_conversations
                WHERE topics IS NOT NULL AND topics != ''
                GROUP BY topics
                ORDER BY count DESC
                LIMIT 10
            ''')
            top_topics = [dict(row) for row in cursor.fetchall()]
            
            cursor.close()
            
            return {
                'total_messages': total_messages,
                'message_types': message_types,
                'top_topics': top_topics,
                'current_session': self.current_session_id
            }
            
        except Exception as error:
            print(f'❌ Error getting memory stats: {error}')
            raise error
    
    async def _update_access_count(self, message_id: str):
        """Update access count for a message"""
        try:
            cursor = self.conn.cursor()
            cursor.execute('''
                UPDATE cursor_conversations 
                SET access_count = access_count + 1, last_accessed = CURRENT_TIMESTAMP
                WHERE id = ?
            ''', (message_id,))
            self.conn.commit()
            cursor.close()
        except Exception as error:
            print(f'❌ Error updating access count: {error}')
    
    async def shutdown(self):
        """Shutdown the memory system"""
        print('🛑 Shutting down Python Cursor Memory System...')
        
        if self.conn:
            self.conn.close()
        
        self.is_initialized = False
        print('✅ Python Cursor Memory System shutdown complete')

# Global instance
memory_system = None

async def initialize_memory():
    """Initialize the global memory system"""
    global memory_system
    if not memory_system:
        memory_system = PythonCursorMemory()
        await memory_system.initialize()
    return memory_system

# Convenience functions
async def remember(query: str, limit: int = 10):
    """Search our conversations"""
    memory = await initialize_memory()
    return await memory.search_conversations(query, limit)

async def save_user_message(message: str, context: Dict = None):
    """Save a user message"""
    memory = await initialize_memory()
    return await memory.save_user_query(message, context)

async def save_assistant_message(message: str, user_message_id: str = None, context: Dict = None):
    """Save an assistant message"""
    memory = await initialize_memory()
    return await memory.save_assistant_response(message, user_message_id, context)

async def show_stats():
    """Show memory statistics"""
    memory = await initialize_memory()
    return await memory.get_memory_stats()

if __name__ == '__main__':
    # Test the memory system
    async def test_memory():
        memory = PythonCursorMemory()
        await memory.initialize()
        
        # Test saving messages
        user_id = await memory.save_user_query("Let's build the GPU mesh system")
        assistant_id = await memory.save_assistant_response("Perfect! Let me build the GPU mesh coordinator...", user_id)
        
        # Test searching
        results = await memory.search_conversations("GPU mesh")
        print(f"Found {len(results)} results")
        
        # Test stats
        stats = await memory.get_memory_stats()
        print(f"Memory stats: {stats}")
        
        await memory.shutdown()
    
    asyncio.run(test_memory())
