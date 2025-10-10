"""
Vector Search Service
=====================
Performs semantic search using pgvector for context retrieval.
Returns 90%+ similarity matches for AI context.
"""

import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)


class VectorSearchService:
    """Semantic search using pgvector"""
    
    def __init__(self, db_connection_string: str = None):
        self.db_conn_string = db_connection_string or os.getenv(
            "DATABASE_URL",
            "postgresql://allan:fun2Gus!!!@localhost:5432/aurora"
        )
        self.similarity_threshold = float(os.getenv("VECTOR_SIMILARITY_THRESHOLD", "0.90"))
    
    def _get_db_connection(self):
        """Get database connection"""
        return psycopg2.connect(self.db_conn_string)
    
    async def search(
        self,
        query_embedding: List[float],
        limit: int = 10,
        min_similarity: float = None,
        source_type: str = None,
        user_id: str = None
    ) -> List[Dict[str, Any]]:
        """
        Search for similar embeddings
        
        Args:
            query_embedding: 1536-dim vector from OpenAI
            limit: Max number of results
            min_similarity: Minimum similarity (default 0.90)
            source_type: Filter by source type (chat, document, etc.)
            user_id: Filter by user
            
        Returns:
            List of matching embeddings with content and metadata
        """
        min_sim = min_similarity or self.similarity_threshold
        
        try:
            conn = self._get_db_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            # Build query with filters
            query = """
                SELECT 
                    id,
                    content,
                    metadata,
                    source_type,
                    source_url,
                    created_at,
                    1 - (embedding <=> %s::vector) AS similarity
                FROM embeddings
                WHERE 1 - (embedding <=> %s::vector) > %s
            """
            params = [query_embedding, query_embedding, min_sim]
            
            if source_type:
                query += " AND source_type = %s"
                params.append(source_type)
            
            if user_id:
                query += " AND user_id = %s"
                params.append(user_id)
            
            query += " ORDER BY similarity DESC LIMIT %s"
            params.append(limit)
            
            cursor.execute(query, params)
            results = cursor.fetchall()
            
            # Convert to list of dicts
            matches = []
            for row in results:
                matches.append({
                    'id': str(row['id']),
                    'content': row['content'],
                    'metadata': row['metadata'],
                    'source_type': row['source_type'],
                    'source_url': row['source_url'],
                    'similarity': float(row['similarity']),
                    'created_at': row['created_at'].isoformat() if row['created_at'] else None
                })
            
            cursor.close()
            conn.close()
            
            logger.info(f"Vector search found {len(matches)} matches with >={min_sim} similarity")
            return matches
            
        except Exception as e:
            logger.error(f"Vector search failed: {e}")
            return []
    
    async def search_chat_history(
        self,
        query_embedding: List[float],
        session_id: str = None,
        limit: int = 5,
        min_similarity: float = 0.85
    ) -> List[Dict[str, Any]]:
        """
        Search chat history for relevant context
        
        Args:
            query_embedding: 1536-dim vector
            session_id: Optional session filter
            limit: Max results
            min_similarity: Minimum similarity
            
        Returns:
            List of relevant chat messages
        """
        try:
            conn = self._get_db_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            query = """
                SELECT 
                    id,
                    session_id,
                    role,
                    content,
                    metadata,
                    created_at,
                    1 - (embedding <=> %s::vector) AS similarity
                FROM messages
                WHERE embedding IS NOT NULL
                AND 1 - (embedding <=> %s::vector) > %s
            """
            params = [query_embedding, query_embedding, min_similarity]
            
            if session_id:
                query += " AND session_id = %s"
                params.append(session_id)
            
            query += " ORDER BY similarity DESC LIMIT %s"
            params.append(limit)
            
            cursor.execute(query, params)
            results = cursor.fetchall()
            
            messages = []
            for row in results:
                messages.append({
                    'id': str(row['id']),
                    'session_id': row['session_id'],
                    'role': row['role'],
                    'content': row['content'],
                    'metadata': row['metadata'],
                    'similarity': float(row['similarity']),
                    'created_at': row['created_at'].isoformat() if row['created_at'] else None
                })
            
            cursor.close()
            conn.close()
            
            return messages
            
        except Exception as e:
            logger.error(f"Chat history search failed: {e}")
            return []
    
    async def search_knowledge_base(
        self,
        query_embedding: List[float],
        category: str = None,
        limit: int = 5,
        min_similarity: float = 0.80
    ) -> List[Dict[str, Any]]:
        """
        Search knowledge base for relevant information
        
        Args:
            query_embedding: 1536-dim vector
            category: Optional category filter
            limit: Max results
            min_similarity: Minimum similarity
            
        Returns:
            List of relevant knowledge base entries
        """
        try:
            conn = self._get_db_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            query = """
                SELECT 
                    id,
                    topic,
                    title,
                    content,
                    summary,
                    category,
                    importance_score,
                    1 - (embedding <=> %s::vector) AS similarity
                FROM knowledge_base
                WHERE embedding IS NOT NULL
                AND 1 - (embedding <=> %s::vector) > %s
                AND is_public = TRUE
            """
            params = [query_embedding, query_embedding, min_similarity]
            
            if category:
                query += " AND category = %s"
                params.append(category)
            
            query += " ORDER BY similarity DESC, importance_score DESC LIMIT %s"
            params.append(limit)
            
            cursor.execute(query, params)
            results = cursor.fetchall()
            
            knowledge = []
            for row in results:
                knowledge.append({
                    'id': str(row['id']),
                    'topic': row['topic'],
                    'title': row['title'],
                    'content': row['content'],
                    'summary': row['summary'],
                    'category': row['category'],
                    'importance_score': row['importance_score'],
                    'similarity': float(row['similarity'])
                })
            
            cursor.close()
            conn.close()
            
            return knowledge
            
        except Exception as e:
            logger.error(f"Knowledge base search failed: {e}")
            return []
    
    async def get_context_for_request(
        self,
        query_embedding: List[float],
        source: str,
        max_results: int = 10
    ) -> Dict[str, Any]:
        """
        Get comprehensive context for an AI request
        
        Searches multiple sources and combines results
        
        Args:
            query_embedding: 1536-dim vector
            source: Request source (for weighting)
            max_results: Max total results
            
        Returns:
            Combined context from multiple sources
        """
        # Search different sources in parallel (simplified for now)
        chat_context = await self.search_chat_history(
            query_embedding, 
            limit=min(5, max_results // 2)
        )
        
        knowledge_context = await self.search_knowledge_base(
            query_embedding,
            limit=min(5, max_results // 2)
        )
        
        # Combine and rank by similarity
        all_context = []
        
        for msg in chat_context:
            all_context.append({
                'type': 'chat_history',
                'content': msg['content'],
                'similarity': msg['similarity'],
                'metadata': msg.get('metadata', {})
            })
        
        for kb in knowledge_context:
            all_context.append({
                'type': 'knowledge_base',
                'content': kb['summary'] or kb['content'],
                'title': kb['title'],
                'similarity': kb['similarity'],
                'importance': kb['importance_score']
            })
        
        # Sort by similarity
        all_context.sort(key=lambda x: x['similarity'], reverse=True)
        
        # Take top results
        top_context = all_context[:max_results]
        
        return {
            'context_items': top_context,
            'total_found': len(all_context),
            'sources': {
                'chat_history': len(chat_context),
                'knowledge_base': len(knowledge_context)
            },
            'avg_similarity': sum(c['similarity'] for c in top_context) / len(top_context) if top_context else 0.0
        }


# Global instance
vector_search_service = VectorSearchService()


