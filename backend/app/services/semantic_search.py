"""
Aurora RobbieVerse - Semantic Search System
Advanced search for conversations, templates, and content
"""
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
import json
import uuid
import re
import math
from collections import defaultdict, Counter

from app.db.database import database
from app.services.conversation_context import ConversationContextManager

class SemanticSearchManager:
    """Manages semantic search across conversations and templates"""
    
    def __init__(self):
        self.context_manager = ConversationContextManager()
        self.stopwords = {
            "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", 
            "by", "is", "are", "was", "were", "be", "been", "have", "has", "had", "do", "does", 
            "did", "will", "would", "could", "should", "may", "might", "can", "this", "that", 
            "these", "those", "i", "you", "he", "she", "it", "we", "they", "me", "him", "her", 
            "us", "them", "my", "your", "his", "its", "our", "their"
        }
    
    async def search_conversations(
        self,
        user_id: str,
        query: str,
        filters: Optional[Dict[str, Any]] = None,
        limit: int = 20,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Search conversations using semantic matching"""
        
        # Parse and analyze query
        query_analysis = self._analyze_search_query(query)
        
        # Build search conditions
        where_conditions = ["c.user_id = :user_id"]
        params = {
            "user_id": user_id,
            "limit": limit,
            "offset": offset
        }
        
        # Apply filters
        if filters:
            if "date_from" in filters:
                where_conditions.append("c.created_at >= :date_from")
                params["date_from"] = filters["date_from"]
            
            if "date_to" in filters:
                where_conditions.append("c.created_at <= :date_to")
                params["date_to"] = filters["date_to"]
            
            if "personality" in filters:
                where_conditions.append("c.metadata->>'current_personality' = :personality")
                params["personality"] = filters["personality"]
            
            if "template_category" in filters:
                where_conditions.append("c.metadata->>'template_category' = :template_category")
                params["template_category"] = filters["template_category"]
        
        # Execute semantic search
        search_results = await self._execute_conversation_search(
            query_analysis, 
            where_conditions, 
            params, 
            limit, 
            offset
        )
        
        return {
            "query": query,
            "query_analysis": query_analysis,
            "results": search_results,
            "total_results": len(search_results),
            "filters_applied": filters or {},
            "search_time": datetime.utcnow().isoformat()
        }
    
    async def search_templates(
        self,
        query: str,
        user_id: Optional[str] = None,
        include_community: bool = True,
        category: Optional[str] = None,
        limit: int = 20
    ) -> Dict[str, Any]:
        """Search conversation templates semantically"""
        
        query_analysis = self._analyze_search_query(query)
        
        # Build base query
        where_conditions = []
        params = {"limit": limit}
        
        if user_id:
            if include_community:
                where_conditions.append("""(
                    ct.user_id = :user_id OR 
                    ts.visibility IN ('public', 'community')
                )""")
            else:
                where_conditions.append("ct.user_id = :user_id")
            params["user_id"] = user_id
        elif include_community:
            where_conditions.append("ts.visibility IN ('public', 'community')")
        
        if category:
            where_conditions.append("ct.category = :category")
            params["category"] = category
        
        # Search templates
        template_results = await self._execute_template_search(
            query_analysis,
            where_conditions,
            params,
            limit
        )
        
        return {
            "query": query,
            "query_analysis": query_analysis,
            "results": template_results,
            "total_results": len(template_results),
            "include_community": include_community,
            "category_filter": category,
            "search_time": datetime.utcnow().isoformat()
        }
    
    async def search_messages(
        self,
        user_id: str,
        query: str,
        conversation_id: Optional[str] = None,
        role_filter: Optional[str] = None,
        limit: int = 50
    ) -> Dict[str, Any]:
        """Search individual messages within conversations"""
        
        query_analysis = self._analyze_search_query(query)
        
        where_conditions = []
        params = {"user_id": user_id, "limit": limit}
        
        if conversation_id:
            where_conditions.append("m.conversation_id = :conversation_id")
            params["conversation_id"] = conversation_id
        else:
            # Search across all user's conversations
            where_conditions.append("c.user_id = :user_id")
        
        if role_filter:
            where_conditions.append("m.role = :role_filter")
            params["role_filter"] = role_filter
        
        # Search messages
        message_results = await self._execute_message_search(
            query_analysis,
            where_conditions,
            params,
            limit
        )
        
        return {
            "query": query,
            "query_analysis": query_analysis,
            "results": message_results,
            "total_results": len(message_results),
            "conversation_filter": conversation_id,
            "role_filter": role_filter,
            "search_time": datetime.utcnow().isoformat()
        }
    
    async def get_search_suggestions(
        self,
        user_id: str,
        partial_query: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get search suggestions based on partial query"""
        
        if len(partial_query) < 2:
            return []
        
        # Get suggestions from conversation titles
        title_suggestions = await database.fetch_all("""
            SELECT DISTINCT title, 'conversation' as type, updated_at
            FROM conversations
            WHERE user_id = :user_id 
            AND title ILIKE :partial_query
            AND title IS NOT NULL
            ORDER BY updated_at DESC
            LIMIT :limit
        """, {
            "user_id": user_id,
            "partial_query": f"%{partial_query}%",
            "limit": limit // 2
        })
        
        # Get suggestions from message content keywords
        content_suggestions = await database.fetch_all("""
            SELECT DISTINCT 
                SUBSTRING(content FROM POSITION(UPPER(:partial_query) IN UPPER(content)) FOR 50) as suggestion,
                'message' as type
            FROM messages m
            JOIN conversations c ON m.conversation_id = c.id
            WHERE c.user_id = :user_id
            AND UPPER(m.content) LIKE UPPER(:partial_query)
            ORDER BY m.created_at DESC
            LIMIT :limit
        """, {
            "user_id": user_id,
            "partial_query": f"%{partial_query}%",
            "limit": limit // 2
        })
        
        suggestions = []
        
        # Process title suggestions
        for suggestion in title_suggestions:
            suggestions.append({
                "text": suggestion["title"],
                "type": suggestion["type"],
                "confidence": 0.9
            })
        
        # Process content suggestions
        for suggestion in content_suggestions:
            text = suggestion["suggestion"].strip()
            if text and len(text) > len(partial_query):
                suggestions.append({
                    "text": text,
                    "type": suggestion["type"],
                    "confidence": 0.7
                })
        
        # Remove duplicates and sort by confidence
        unique_suggestions = {}
        for s in suggestions:
            key = s["text"].lower()
            if key not in unique_suggestions or unique_suggestions[key]["confidence"] < s["confidence"]:
                unique_suggestions[key] = s
        
        return sorted(unique_suggestions.values(), key=lambda x: x["confidence"], reverse=True)[:limit]
    
    async def create_search_index(
        self,
        user_id: Optional[str] = None,
        rebuild: bool = False
    ) -> Dict[str, Any]:
        """Create or update search indexes for better performance"""
        
        index_id = str(uuid.uuid4())
        
        # Build conversation index
        conversation_index = await self._build_conversation_index(user_id)
        
        # Build message index
        message_index = await self._build_message_index(user_id)
        
        # Build template index
        template_index = await self._build_template_index(user_id)
        
        # Store indexes
        await database.execute("""
            INSERT INTO search_indexes (
                id, user_id, conversation_index, message_index, template_index,
                created_at, is_global
            ) VALUES (
                :id, :user_id, :conversation_index, :message_index, :template_index,
                :created_at, :is_global
            )
        """, {
            "id": index_id,
            "user_id": user_id,
            "conversation_index": json.dumps(conversation_index),
            "message_index": json.dumps(message_index),
            "template_index": json.dumps(template_index),
            "created_at": datetime.utcnow(),
            "is_global": user_id is None
        })
        
        return {
            "index_id": index_id,
            "user_id": user_id,
            "conversation_terms": len(conversation_index),
            "message_terms": len(message_index),
            "template_terms": len(template_index),
            "created_at": datetime.utcnow().isoformat()
        }
    
    def _analyze_search_query(self, query: str) -> Dict[str, Any]:
        """Analyze search query to extract intent and terms"""
        
        query = query.strip().lower()
        
        # Extract quoted phrases
        quoted_phrases = re.findall(r'"([^"]*)"', query)
        query_without_quotes = re.sub(r'"[^"]*"', '', query)
        
        # Extract terms
        terms = [
            term for term in re.findall(r'\b\w+\b', query_without_quotes)
            if term not in self.stopwords and len(term) > 2
        ]
        
        # Detect query intent
        intent = "general"
        if any(word in query for word in ["when", "what time", "date"]):
            intent = "temporal"
        elif any(word in query for word in ["who", "person", "user"]):
            intent = "person"
        elif any(word in query for word in ["how", "tutorial", "guide"]):
            intent = "instructional"
        elif any(word in query for word in ["error", "problem", "issue", "bug"]):
            intent = "troubleshooting"
        
        return {
            "original_query": query,
            "terms": terms,
            "quoted_phrases": quoted_phrases,
            "intent": intent,
            "term_count": len(terms),
            "has_phrases": len(quoted_phrases) > 0
        }
    
    async def _execute_conversation_search(
        self,
        query_analysis: Dict[str, Any],
        where_conditions: List[str],
        params: Dict[str, Any],
        limit: int,
        offset: int
    ) -> List[Dict[str, Any]]:
        """Execute semantic search on conversations"""
        
        terms = query_analysis["terms"]
        phrases = query_analysis["quoted_phrases"]
        
        if not terms and not phrases:
            return []
        
        # Build search conditions
        search_conditions = []
        
        # Term matching
        if terms:
            term_conditions = []
            for i, term in enumerate(terms):
                param_name = f"term_{i}"
                term_conditions.append(f"""(
                    UPPER(c.title) LIKE UPPER(:{param_name}) OR
                    EXISTS (
                        SELECT 1 FROM messages m 
                        WHERE m.conversation_id = c.id 
                        AND UPPER(m.content) LIKE UPPER(:{param_name})
                        LIMIT 1
                    )
                )""")
                params[param_name] = f"%{term}%"
            
            search_conditions.append(f"({' AND '.join(term_conditions)})")
        
        # Phrase matching
        if phrases:
            phrase_conditions = []
            for i, phrase in enumerate(phrases):
                param_name = f"phrase_{i}"
                phrase_conditions.append(f"""(
                    UPPER(c.title) LIKE UPPER(:{param_name}) OR
                    EXISTS (
                        SELECT 1 FROM messages m 
                        WHERE m.conversation_id = c.id 
                        AND UPPER(m.content) LIKE UPPER(:{param_name})
                        LIMIT 1
                    )
                )""")
                params[param_name] = f"%{phrase}%"
            
            search_conditions.append(f"({' AND '.join(phrase_conditions)})")
        
        # Combine all conditions
        all_conditions = where_conditions + search_conditions
        
        # Execute search query
        search_query = f"""
        SELECT 
            c.id,
            c.title,
            c.created_at,
            c.updated_at,
            c.metadata,
            COUNT(m.id) as message_count,
            MAX(m.created_at) as last_message_at
        FROM conversations c
        LEFT JOIN messages m ON c.id = m.conversation_id AND m.is_deleted = false
        WHERE {' AND '.join(all_conditions)}
        GROUP BY c.id, c.title, c.created_at, c.updated_at, c.metadata
        ORDER BY c.updated_at DESC
        LIMIT :limit OFFSET :offset
        """
        
        results = await database.fetch_all(search_query, params)
        
        # Calculate relevance scores and format results
        formatted_results = []
        for result in results:
            relevance_score = await self._calculate_conversation_relevance(
                result, query_analysis, terms, phrases
            )
            
            formatted_results.append({
                "conversation_id": result["id"],
                "title": result["title"],
                "message_count": result["message_count"],
                "created_at": result["created_at"].isoformat(),
                "updated_at": result["updated_at"].isoformat(),
                "last_message_at": result["last_message_at"].isoformat() if result["last_message_at"] else None,
                "relevance_score": relevance_score,
                "metadata": json.loads(result["metadata"]) if result["metadata"] else {}
            })
        
        # Sort by relevance score
        formatted_results.sort(key=lambda x: x["relevance_score"], reverse=True)
        
        return formatted_results
    
    async def _execute_template_search(
        self,
        query_analysis: Dict[str, Any],
        where_conditions: List[str],
        params: Dict[str, Any],
        limit: int
    ) -> List[Dict[str, Any]]:
        """Execute semantic search on templates"""
        
        terms = query_analysis["terms"]
        
        if not terms:
            return []
        
        # Build search conditions for templates
        search_conditions = []
        for i, term in enumerate(terms):
            param_name = f"term_{i}"
            search_conditions.append(f"""(
                UPPER(ct.name) LIKE UPPER(:{param_name}) OR
                UPPER(ct.description) LIKE UPPER(:{param_name}) OR
                UPPER(ct.category) LIKE UPPER(:{param_name}) OR
                EXISTS (
                    SELECT 1 FROM jsonb_array_elements_text(ct.suggested_topics) as topic
                    WHERE UPPER(topic) LIKE UPPER(:{param_name})
                )
            )""")
            params[param_name] = f"%{term}%"
        
        all_conditions = where_conditions + [f"({' AND '.join(search_conditions)})"]
        
        # Execute template search
        template_query = f"""
        SELECT 
            ct.*,
            ts.visibility,
            ts.allow_forking,
            u.username as owner_name,
            COALESCE(usage_stats.usage_count, 0) as usage_count,
            COALESCE(rating_stats.avg_rating, 0) as avg_rating
        FROM conversation_templates ct
        LEFT JOIN template_shares ts ON ct.id = ts.template_id
        LEFT JOIN users u ON ct.user_id = u.id
        LEFT JOIN (
            SELECT template_id, COUNT(*) as usage_count
            FROM template_usage_stats
            WHERE created_at >= :recent_date
            GROUP BY template_id
        ) usage_stats ON ct.id = usage_stats.template_id
        LEFT JOIN (
            SELECT template_id, AVG(rating) as avg_rating
            FROM template_ratings
            GROUP BY template_id
        ) rating_stats ON ct.id = rating_stats.template_id
        WHERE {' AND '.join(all_conditions)}
        ORDER BY usage_count DESC, avg_rating DESC NULLS LAST
        LIMIT :limit
        """
        
        params["recent_date"] = datetime.utcnow() - timedelta(days=30)
        
        results = await database.fetch_all(template_query, params)
        
        # Format results
        formatted_results = []
        for result in results:
            relevance_score = self._calculate_template_relevance(result, query_analysis, terms)
            
            formatted_results.append({
                "template_id": result["id"],
                "name": result["name"],
                "description": result["description"],
                "category": result["category"],
                "personality": result["personality"],
                "owner_name": result["owner_name"],
                "usage_count": result["usage_count"],
                "avg_rating": float(result["avg_rating"]) if result["avg_rating"] else 0.0,
                "relevance_score": relevance_score,
                "suggested_topics": json.loads(result["suggested_topics"]) if result["suggested_topics"] else []
            })
        
        return sorted(formatted_results, key=lambda x: x["relevance_score"], reverse=True)
    
    async def _execute_message_search(
        self,
        query_analysis: Dict[str, Any],
        where_conditions: List[str],
        params: Dict[str, Any],
        limit: int
    ) -> List[Dict[str, Any]]:
        """Execute semantic search on messages"""
        
        terms = query_analysis["terms"]
        phrases = query_analysis["quoted_phrases"]
        
        if not terms and not phrases:
            return []
        
        search_conditions = []
        
        # Term matching
        if terms:
            term_conditions = []
            for i, term in enumerate(terms):
                param_name = f"term_{i}"
                term_conditions.append(f"UPPER(m.content) LIKE UPPER(:{param_name})")
                params[param_name] = f"%{term}%"
            search_conditions.append(f"({' AND '.join(term_conditions)})")
        
        # Phrase matching
        if phrases:
            for i, phrase in enumerate(phrases):
                param_name = f"phrase_{i}"
                search_conditions.append(f"UPPER(m.content) LIKE UPPER(:{param_name})")
                params[param_name] = f"%{phrase}%"
        
        # Build query
        join_clause = "JOIN conversations c ON m.conversation_id = c.id" if "c.user_id" in ' '.join(where_conditions) else ""
        all_conditions = where_conditions + search_conditions
        
        message_query = f"""
        SELECT 
            m.id,
            m.conversation_id,
            m.role,
            m.content,
            m.created_at,
            m.context_importance,
            c.title as conversation_title
        FROM messages m
        {join_clause}
        WHERE m.is_deleted = false
        AND {' AND '.join(all_conditions)}
        ORDER BY m.context_importance DESC, m.created_at DESC
        LIMIT :limit
        """
        
        results = await database.fetch_all(message_query, params)
        
        # Format results with relevance scoring
        formatted_results = []
        for result in results:
            relevance_score = self._calculate_message_relevance(result, query_analysis, terms, phrases)
            
            # Create snippet with highlighted terms
            snippet = self._create_message_snippet(result["content"], terms, phrases)
            
            formatted_results.append({
                "message_id": result["id"],
                "conversation_id": result["conversation_id"],
                "conversation_title": result["conversation_title"],
                "role": result["role"],
                "snippet": snippet,
                "full_content": result["content"],
                "created_at": result["created_at"].isoformat(),
                "context_importance": result["context_importance"],
                "relevance_score": relevance_score
            })
        
        return sorted(formatted_results, key=lambda x: x["relevance_score"], reverse=True)
    
    async def _calculate_conversation_relevance(
        self,
        conversation: Dict[str, Any],
        query_analysis: Dict[str, Any],
        terms: List[str],
        phrases: List[str]
    ) -> float:
        """Calculate relevance score for conversation search result"""
        
        score = 0.0
        title = conversation["title"] or ""
        
        # Title matching (high weight)
        for term in terms:
            if term.lower() in title.lower():
                score += 0.3
        
        for phrase in phrases:
            if phrase.lower() in title.lower():
                score += 0.5
        
        # Recent activity boost
        if conversation["last_message_at"]:
            last_activity = conversation["last_message_at"]
            # Ensure both datetimes are timezone-naive for comparison
            if last_activity.tzinfo is not None:
                last_activity = last_activity.replace(tzinfo=None)
            current_time = datetime.utcnow()
            if current_time.tzinfo is not None:
                current_time = current_time.replace(tzinfo=None)
            days_since_activity = (current_time - last_activity).days
            recency_boost = max(0, (30 - days_since_activity) / 30 * 0.2)
            score += recency_boost
        
        # Message count consideration
        message_count = conversation["message_count"] or 0
        if message_count > 10:
            score += 0.1
        
        return min(1.0, score)
    
    def _calculate_template_relevance(
        self,
        template: Dict[str, Any],
        query_analysis: Dict[str, Any],
        terms: List[str]
    ) -> float:
        """Calculate relevance score for template search result"""
        
        score = 0.0
        
        # Name matching
        name = template["name"] or ""
        for term in terms:
            if term.lower() in name.lower():
                score += 0.4
        
        # Description matching
        description = template["description"] or ""
        for term in terms:
            if term.lower() in description.lower():
                score += 0.3
        
        # Category matching
        category = template["category"] or ""
        for term in terms:
            if term.lower() in category.lower():
                score += 0.2
        
        # Usage and rating boost
        usage_count = template["usage_count"] or 0
        if usage_count > 5:
            score += 0.1
        
        avg_rating = template["avg_rating"] or 0
        if avg_rating > 4.0:
            score += 0.1
        
        return min(1.0, score)
    
    def _calculate_message_relevance(
        self,
        message: Dict[str, Any],
        query_analysis: Dict[str, Any],
        terms: List[str],
        phrases: List[str]
    ) -> float:
        """Calculate relevance score for message search result"""
        
        score = 0.0
        content = message["content"].lower()
        
        # Term frequency scoring
        for term in terms:
            term_count = content.count(term.lower())
            score += min(0.3, term_count * 0.1)
        
        # Phrase matching (exact matches get higher score)
        for phrase in phrases:
            if phrase.lower() in content:
                score += 0.5
        
        # Context importance boost
        importance = message["context_importance"] or 5
        score += (importance / 10) * 0.2
        
        # Role consideration (user questions often more relevant)
        if message["role"] == "user" and "?" in message["content"]:
            score += 0.1
        
        return min(1.0, score)
    
    def _create_message_snippet(
        self,
        content: str,
        terms: List[str],
        phrases: List[str],
        max_length: int = 200
    ) -> str:
        """Create a snippet of message content with search terms highlighted"""
        
        # Find the best position to start the snippet
        all_search_items = terms + phrases
        best_pos = 0
        best_score = 0
        
        for item in all_search_items:
            pos = content.lower().find(item.lower())
            if pos >= 0:
                # Count nearby search terms
                nearby_score = sum(1 for other_item in all_search_items 
                                 if abs(content.lower().find(other_item.lower()) - pos) < 100)
                if nearby_score > best_score:
                    best_score = nearby_score
                    best_pos = max(0, pos - 50)
        
        # Extract snippet
        snippet = content[best_pos:best_pos + max_length]
        if best_pos > 0:
            snippet = "..." + snippet
        if len(content) > best_pos + max_length:
            snippet += "..."
        
        return snippet.strip()
    
    async def _build_conversation_index(self, user_id: Optional[str]) -> Dict[str, List[str]]:
        """Build search index for conversations"""
        
        where_clause = "WHERE c.user_id = :user_id" if user_id else ""
        params = {"user_id": user_id} if user_id else {}
        
        conversations = await database.fetch_all(f"""
            SELECT c.id, c.title, STRING_AGG(m.content, ' ') as all_content
            FROM conversations c
            LEFT JOIN messages m ON c.id = m.conversation_id AND m.is_deleted = false
            {where_clause}
            GROUP BY c.id, c.title
        """, params)
        
        index = defaultdict(list)
        
        for conv in conversations:
            # Index title terms
            if conv["title"]:
                title_terms = [
                    term for term in re.findall(r'\b\w+\b', conv["title"].lower())
                    if term not in self.stopwords and len(term) > 2
                ]
                for term in title_terms:
                    index[term].append(conv["id"])
            
            # Index content terms (sample to avoid huge indexes)
            if conv["all_content"]:
                content_terms = [
                    term for term in re.findall(r'\b\w+\b', conv["all_content"].lower())
                    if term not in self.stopwords and len(term) > 2
                ]
                # Use most frequent terms
                term_counts = Counter(content_terms)
                top_terms = [term for term, count in term_counts.most_common(20)]
                for term in top_terms:
                    if conv["id"] not in index[term]:
                        index[term].append(conv["id"])
        
        return dict(index)
    
    async def _build_message_index(self, user_id: Optional[str]) -> Dict[str, List[str]]:
        """Build search index for messages"""
        
        join_clause = "JOIN conversations c ON m.conversation_id = c.id" if user_id else ""
        where_clause = "WHERE c.user_id = :user_id AND m.is_deleted = false" if user_id else "WHERE m.is_deleted = false"
        params = {"user_id": user_id} if user_id else {}
        
        messages = await database.fetch_all(f"""
            SELECT m.id, m.content
            FROM messages m
            {join_clause}
            {where_clause}
            ORDER BY m.created_at DESC
            LIMIT 10000
        """, params)
        
        index = defaultdict(list)
        
        for msg in messages:
            if msg["content"]:
                terms = [
                    term for term in re.findall(r'\b\w+\b', msg["content"].lower())
                    if term not in self.stopwords and len(term) > 2
                ]
                for term in terms:
                    index[term].append(msg["id"])
        
        return dict(index)
    
    async def _build_template_index(self, user_id: Optional[str]) -> Dict[str, List[str]]:
        """Build search index for templates"""
        
        where_clause = "WHERE ct.user_id = :user_id" if user_id else ""
        params = {"user_id": user_id} if user_id else {}
        
        templates = await database.fetch_all(f"""
            SELECT ct.id, ct.name, ct.description, ct.category,
                   ct.suggested_topics
            FROM conversation_templates ct
            {where_clause}
        """, params)
        
        index = defaultdict(list)
        
        for template in templates:
            # Index all template fields
            text_fields = [
                template["name"] or "",
                template["description"] or "",
                template["category"] or ""
            ]
            
            # Add suggested topics
            if template["suggested_topics"]:
                try:
                    topics = json.loads(template["suggested_topics"])
                    text_fields.extend(topics)
                except json.JSONDecodeError:
                    pass
            
            # Extract terms from all fields
            all_text = " ".join(text_fields).lower()
            terms = [
                term for term in re.findall(r'\b\w+\b', all_text)
                if term not in self.stopwords and len(term) > 2
            ]
            
            for term in terms:
                index[term].append(template["id"])
        
        return dict(index)

# Global instance
semantic_search_manager = SemanticSearchManager()
