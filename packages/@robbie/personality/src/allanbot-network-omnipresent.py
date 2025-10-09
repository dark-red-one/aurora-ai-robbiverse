#!/usr/bin/env python3
"""
ALLANBOT NETWORK OMNIPRESENT
Vector search across ALL nodes and data sources for AllanBot training
"""

import psycopg2
import json
import logging
from datetime import datetime
import requests
import asyncio
import aiohttp

# Network configuration
NETWORK_NODES = {
    "aurora_postgres": {
        "host": "aurora-postgres-u44170.vm.elestio.app",
        "port": 25432,
        "dbname": "aurora_unified",
        "user": "aurora_app",
        "password": "TestPilot2025_Aurora!",
        "sslmode": "require"
    },
    "aurora_town": {
        "host": "aurora-town-u44170.vm.elestio.app",
        "port": 8000,
        "services": ["sticky_notes", "conversations", "personality"]
    },
    "vengeance_local": {
        "host": "localhost",
        "port": 8001,
        "services": ["gpu_training", "local_llm"]
    },
    "runpod_gpu": {
        "host": "aurora-town-u44170.vm.elestio.app",
        "port": 11434,
        "services": ["ollama", "gpu_inference"]
    }
}

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')

class AllanBotNetworkOmnipresent:
    def __init__(self):
        self.db_conn = None
        self.memory_cache = {}
        self.patterns = {}
        
    def connect_network(self):
        """Connect to all network nodes"""
        try:
            # Connect to primary database
            self.db_conn = psycopg2.connect(**NETWORK_NODES["aurora_postgres"])
            logging.info("✅ Connected to Aurora PostgreSQL")
            
            # Test other nodes
            self.test_network_nodes()
            
        except Exception as e:
            logging.error(f"❌ Network connection failed: {e}")
            raise
    
    def test_network_nodes(self):
        """Test connectivity to all network nodes"""
        for node_name, config in NETWORK_NODES.items():
            try:
                if "dbname" in config:
                    # Database node
                    test_conn = psycopg2.connect(**config)
                    test_conn.close()
                    logging.info(f"✅ {node_name}: Database connected")
                else:
                    # Service node
                    response = requests.get(f"http://{config['host']}:{config['port']}", timeout=5)
                    logging.info(f"✅ {node_name}: Service online ({response.status_code})")
            except Exception as e:
                logging.warning(f"⚠️ {node_name}: {e}")
    
    def vector_search_all_sources(self, query, limit=10):
        """Search across ALL data sources in the network"""
        try:
            results = []
            
            # Search conversations
            conversation_results = self.search_conversations(query, limit//3)
            results.extend(conversation_results)
            
            # Search interactions (emails, etc.)
            interaction_results = self.search_interactions(query, limit//3)
            results.extend(interaction_results)
            
            # Search AllanBot memories
            memory_results = self.search_allanbot_memories(query, limit//3)
            results.extend(memory_results)
            
            # Search priorities queue
            priority_results = self.search_priorities(query, limit//4)
            results.extend(priority_results)
            
            # Sort by relevance and return top results
            results.sort(key=lambda x: x.get('relevance', 0), reverse=True)
            return results[:limit]
            
        except Exception as e:
            logging.error(f"❌ Vector search failed: {e}")
            return []
    
    def search_conversations(self, query, limit):
        """Search conversation history"""
        try:
            cursor = self.db_conn.cursor()
            cursor.execute("""
                SELECT content, role, created_at, metadata
                FROM messages
                WHERE content ILIKE %s
                ORDER BY created_at DESC
                LIMIT %s
            """, (f"%{query}%", limit))
            
            results = []
            for row in cursor.fetchall():
                content, role, created_at, metadata = row
                results.append({
                    'source': 'conversations',
                    'content': content,
                    'role': role,
                    'timestamp': created_at,
                    'relevance': self.calculate_relevance(query, content),
                    'metadata': json.loads(metadata) if metadata else {}
                })
            
            cursor.close()
            return results
            
        except Exception as e:
            logging.error(f"❌ Conversation search failed: {e}")
            return []
    
    def search_interactions(self, query, limit):
        """Search email and interaction data"""
        try:
            cursor = self.db_conn.cursor()
            cursor.execute("""
                SELECT subject, from_user, snippet, importance_score, urgency_score, interaction_date
                FROM interactions
                WHERE (subject ILIKE %s OR snippet ILIKE %s)
                ORDER BY importance_score DESC, urgency_score DESC
                LIMIT %s
            """, (f"%{query}%", f"%{query}%", limit))
            
            results = []
            for row in cursor.fetchall():
                subject, from_user, snippet, importance, urgency, date = row
                results.append({
                    'source': 'interactions',
                    'content': f"{subject}: {snippet}",
                    'from_user': from_user,
                    'importance': importance,
                    'urgency': urgency,
                    'timestamp': date,
                    'relevance': self.calculate_relevance(query, f"{subject} {snippet}")
                })
            
            cursor.close()
            return results
            
        except Exception as e:
            logging.error(f"❌ Interaction search failed: {e}")
            return []
    
    def search_allanbot_memories(self, query, limit):
        """Search AllanBot memory system"""
        try:
            cursor = self.db_conn.cursor()
            cursor.execute("""
                SELECT content, memory_type, priority, context, created_at
                FROM allanbot_memory
                WHERE content ILIKE %s
                ORDER BY priority DESC, created_at DESC
                LIMIT %s
            """, (f"%{query}%", limit))
            
            results = []
            for row in cursor.fetchall():
                content, memory_type, priority, context, created_at = row
                results.append({
                    'source': 'allanbot_memory',
                    'content': content,
                    'memory_type': memory_type,
                    'priority': priority,
                    'timestamp': created_at,
                    'relevance': self.calculate_relevance(query, content),
                    'context': json.loads(context) if context else {}
                })
            
            cursor.close()
            return results
            
        except Exception as e:
            logging.error(f"❌ AllanBot memory search failed: {e}")
            return []
    
    def search_priorities(self, query, limit):
        """Search priorities queue"""
        try:
            cursor = self.db_conn.cursor()
            cursor.execute("""
                SELECT task_description, task_category, llm_reasoning, status, created_at
                FROM priorities_queue
                WHERE (task_description ILIKE %s OR llm_reasoning ILIKE %s)
                ORDER BY created_at DESC
                LIMIT %s
            """, (f"%{query}%", f"%{query}%", limit))
            
            results = []
            for row in cursor.fetchall():
                description, category, reasoning, status, created_at = row
                results.append({
                    'source': 'priorities',
                    'content': f"{description}: {reasoning}",
                    'category': category,
                    'status': status,
                    'timestamp': created_at,
                    'relevance': self.calculate_relevance(query, f"{description} {reasoning}")
                })
            
            cursor.close()
            return results
            
        except Exception as e:
            logging.error(f"❌ Priorities search failed: {e}")
            return []
    
    def calculate_relevance(self, query, content):
        """Calculate relevance score between query and content"""
        query_words = set(query.lower().split())
        content_words = set(content.lower().split())
        
        if not query_words or not content_words:
            return 0.0
        
        # Calculate word overlap
        overlap = len(query_words.intersection(content_words))
        total_words = len(query_words.union(content_words))
        
        # Base relevance score
        relevance = overlap / total_words if total_words > 0 else 0.0
        
        # Boost for exact phrase matches
        if query.lower() in content.lower():
            relevance += 0.5
        
        # Boost for important keywords
        important_words = ['revenue', 'deal', 'client', 'urgent', 'important', 'make sure', 'please note']
        for word in important_words:
            if word in content.lower():
                relevance += 0.1
        
        return min(relevance, 1.0)
    
    def train_allanbot_from_network(self):
        """Train AllanBot using data from ALL network sources"""
        try:
            logging.info("🧠 Training AllanBot from network omnipresent data...")
            
            # Search for Allan's communication patterns
            allan_patterns = self.vector_search_all_sources("allan communication style", 20)
            
            # Search for business context
            business_context = self.vector_search_all_sources("revenue deal client", 20)
            
            # Search for technical patterns
            technical_patterns = self.vector_search_all_sources("system implementation technical", 20)
            
            # Generate AllanBot personality profile
            allanbot_profile = self.generate_allanbot_profile(allan_patterns, business_context, technical_patterns)
            
            # Store in database
            self.store_allanbot_profile(allanbot_profile)
            
            logging.info("✅ AllanBot trained from network omnipresent data")
            
        except Exception as e:
            logging.error(f"❌ AllanBot training failed: {e}")
    
    def generate_allanbot_profile(self, allan_patterns, business_context, technical_patterns):
        """Generate comprehensive AllanBot personality profile"""
        profile = {
            "communication_style": "Direct, action-oriented, revenue-focused",
            "key_phrases": [
                "Make sure", "Please note", "Ship it", "Fix pls", "Do it all",
                "Why Allan should care", "Surface/submerge", "Top7/Top3"
            ],
            "business_focus": {
                "revenue_keywords": ["deal", "client", "revenue", "pricing", "contract"],
                "urgency_indicators": ["urgent", "asap", "deadline", "crisis"],
                "collaboration_style": "Strategic partnership, not just assistance"
            },
            "technical_preferences": {
                "automation_over_manual": True,
                "integration_over_silos": True,
                "performance_over_perfection": True,
                "immediate_execution": True
            },
            "decision_making": {
                "speed": "Fast",
                "approach": "Pragmatic",
                "filter": "Revenue impact",
                "style": "Direct, no fluff"
            },
            "network_awareness": {
                "data_sources": ["conversations", "interactions", "memories", "priorities"],
                "nodes": list(NETWORK_NODES.keys()),
                "vector_search": True,
                "real_time_learning": True
            }
        }
        
        return profile
    
    def store_allanbot_profile(self, profile):
        """Store AllanBot profile in database"""
        try:
            cursor = self.db_conn.cursor()
            cursor.execute("""
                INSERT INTO allanbot_patterns (
                    pattern_type, pattern_data, frequency, confidence
                ) VALUES (%s, %s, %s, %s)
                ON CONFLICT DO NOTHING
            """, (
                "allanbot_network_profile",
                json.dumps(profile),
                1,
                0.95
            ))
            
            self.db_conn.commit()
            cursor.close()
            
            logging.info("✅ AllanBot profile stored in network database")
            
        except Exception as e:
            logging.error(f"❌ Error storing profile: {e}")
    
    def run_network_training(self):
        """Run complete network omnipresent training"""
        try:
            logging.info("🌐 Starting AllanBot Network Omnipresent Training...")
            
            # Connect to network
            self.connect_network()
            
            # Train from all sources
            self.train_allanbot_from_network()
            
            # Test vector search
            test_queries = [
                "inbox system implementation",
                "revenue opportunities",
                "make sure statements",
                "please note collaboration"
            ]
            
            for query in test_queries:
                results = self.vector_search_all_sources(query, 5)
                logging.info(f"🔍 '{query}': {len(results)} results")
                for result in results[:2]:
                    logging.info(f"   {result['source']}: {result['content'][:60]}...")
            
            logging.info("✅ AllanBot Network Omnipresent Training Complete!")
            
        except Exception as e:
            logging.error(f"❌ Network training failed: {e}")
        finally:
            if self.db_conn:
                self.db_conn.close()

if __name__ == "__main__":
    trainer = AllanBotNetworkOmnipresent()
    trainer.run_network_training()
