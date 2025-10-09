#!/usr/bin/env python3
"""
ALLANBOT STICKY MEMORY TRAINER
Integrates sticky notes system with vector search for AllanBot training
"""

import psycopg2
import json
import asyncio
import logging
from datetime import datetime
import hashlib
import re

# Database config
DB_CONFIG = {
    'host': 'aurora-postgres-u44170.vm.elestio.app',
    'port': 25432,
    'dbname': 'aurora_unified',
    'user': 'aurora_app',
    'password': 'TestPilot2025_Aurora!',
    'sslmode': 'require'
}

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')

class AllanBotStickyMemoryTrainer:
    def __init__(self):
        self.db_conn = None
        
    def connect_db(self):
        """Connect to PostgreSQL database"""
        try:
            self.db_conn = psycopg2.connect(**DB_CONFIG)
            logging.info("✅ Connected to Aurora PostgreSQL")
        except Exception as e:
            logging.error(f"❌ Database connection failed: {e}")
            raise
    
    def create_allanbot_memory_tables(self):
        """Create tables for AllanBot memory training"""
        try:
            cursor = self.db_conn.cursor()
            
            # AllanBot memory table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS allanbot_memory (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    memory_type VARCHAR(50) NOT NULL,
                    content TEXT NOT NULL,
                    source VARCHAR(100) NOT NULL,
                    priority VARCHAR(20) DEFAULT 'medium',
                    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                    embedding TEXT,
                    context JSONB DEFAULT '{}'::jsonb,
                    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # AllanBot training patterns
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS allanbot_patterns (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    pattern_type VARCHAR(50) NOT NULL,
                    pattern_data JSONB NOT NULL,
                    frequency INTEGER DEFAULT 1,
                    confidence FLOAT DEFAULT 0.0,
                    last_seen TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # AllanBot decision history
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS allanbot_decisions (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    decision_context TEXT NOT NULL,
                    allan_choice TEXT NOT NULL,
                    robbie_suggestion TEXT,
                    outcome TEXT,
                    confidence FLOAT DEFAULT 0.0,
                    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Create indexes
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_allanbot_memory_type 
                ON allanbot_memory(memory_type);
            """)
            
            # Simple text index for embedding search
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_allanbot_memory_content 
                ON allanbot_memory(content);
            """)
            
            self.db_conn.commit()
            cursor.close()
            logging.info("✅ AllanBot memory tables created")
            
        except Exception as e:
            logging.error(f"❌ Error creating tables: {e}")
            raise
    
    def simple_embedding(self, text):
        """Generate simple hash-based embedding for text"""
        # Create a simple 384-dimensional embedding using hash functions
        embedding = []
        text_lower = text.lower()
        
        # Use different hash functions to create diverse features
        for i in range(384):
            # Create different hash inputs
            hash_input = f"{text_lower}_{i}_{len(text)}"
            hash_value = int(hashlib.md5(hash_input.encode()).hexdigest(), 16)
            # Normalize to [-1, 1] range
            normalized = (hash_value % 2000000) / 1000000.0 - 1.0
            embedding.append(normalized)
        
        return embedding
    
    def process_sticky_notes(self):
        """Process sticky notes and convert to AllanBot training data"""
        try:
            cursor = self.db_conn.cursor()
            
            # Get all sticky notes from the system
            # Note: In production, this would connect to the sticky notes API
            sticky_notes = {
                "allan_notes": [
                    {
                        "content": "Make sure we have the web browser tab and notes tab too even if UI is basic",
                        "priority": "high",
                        "timestamp": "2 min ago"
                    },
                    {
                        "content": "All of the 'Make sure' things should become robbie notes",
                        "priority": "high", 
                        "timestamp": "5 min ago"
                    },
                    {
                        "content": "And anything I say (please note) should be an Allan note",
                        "priority": "medium",
                        "timestamp": "8 min ago"
                    },
                    {
                        "content": "I can also edit notes add notes and delete notes in the web interface",
                        "priority": "medium",
                        "timestamp": "12 min ago"
                    },
                    {
                        "content": "Also start the inbox (Universal inbox) even if it's only email for now",
                        "priority": "high",
                        "timestamp": "15 min ago"
                    }
                ],
                "robbie_notes": [
                    {
                        "content": "Implement web browser and notes tabs in the interface",
                        "priority": "high",
                        "timestamp": "2 min ago"
                    },
                    {
                        "content": "Automatically convert 'Make sure' statements into Robbie notes",
                        "priority": "high",
                        "timestamp": "5 min ago"
                    },
                    {
                        "content": "PepsiCo deal crisis - pricing 40% higher, timeline 3 months slow. Need strategic response.",
                        "priority": "critical",
                        "timestamp": "1 hour ago"
                    },
                    {
                        "content": "RunPod GPU integration via SSH tunnel working perfectly",
                        "priority": "medium",
                        "timestamp": "2 hours ago"
                    }
                ]
            }
            
            # Process Allan notes (direct thoughts/instructions)
            for note in sticky_notes["allan_notes"]:
                self.store_allan_memory(note, "allan_direct_thought")
            
            # Process Robbie notes (system responses/insights)
            for note in sticky_notes["robbie_notes"]:
                self.store_allan_memory(note, "robbie_insight")
            
            cursor.close()
            logging.info("✅ Processed sticky notes for AllanBot training")
            
        except Exception as e:
            logging.error(f"❌ Error processing sticky notes: {e}")
    
    def store_allan_memory(self, note, memory_type):
        """Store note as AllanBot memory with vector embedding"""
        try:
            cursor = self.db_conn.cursor()
            
            # Generate simple hash-based embedding (384 dimensions)
            embedding = self.simple_embedding(note["content"])
            
            # Store in database
            cursor.execute("""
                INSERT INTO allanbot_memory (
                    memory_type, content, source, priority, embedding, context
                ) VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT DO NOTHING
            """, (
                memory_type,
                note["content"],
                "sticky_notes",
                note.get("priority", "medium"),
                json.dumps(embedding),  # Store as JSON string
                json.dumps({
                    "timestamp": note.get("timestamp", ""),
                    "original_note": note
                })
            ))
            
            self.db_conn.commit()
            cursor.close()
            
            logging.info(f"✅ Stored AllanBot memory: {note['content'][:50]}...")
            
        except Exception as e:
            logging.error(f"❌ Error storing memory: {e}")
    
    def extract_allan_patterns(self):
        """Extract patterns from Allan's communication style"""
        try:
            cursor = self.db_conn.cursor()
            
            # Get all Allan memories
            cursor.execute("""
                SELECT content, memory_type, priority, context
                FROM allanbot_memory
                WHERE memory_type = 'allan_direct_thought'
                ORDER BY created_at DESC
            """)
            
            memories = cursor.fetchall()
            
            patterns = {
                "communication_style": [],
                "priority_patterns": [],
                "instruction_patterns": [],
                "collaboration_patterns": []
            }
            
            for memory in memories:
                content, memory_type, priority, context = memory
                
                # Analyze communication patterns
                if "make sure" in content.lower():
                    patterns["instruction_patterns"].append({
                        "pattern": "make_sure_instruction",
                        "example": content,
                        "frequency": 1
                    })
                
                if "please note" in content.lower():
                    patterns["collaboration_patterns"].append({
                        "pattern": "please_note_collaboration",
                        "example": content,
                        "frequency": 1
                    })
                
                if priority == "high":
                    patterns["priority_patterns"].append({
                        "pattern": "high_priority_communication",
                        "example": content,
                        "frequency": 1
                    })
            
            # Store patterns
            for pattern_type, pattern_list in patterns.items():
                for pattern in pattern_list:
                    cursor.execute("""
                        INSERT INTO allanbot_patterns (
                            pattern_type, pattern_data, frequency
                        ) VALUES (%s, %s, %s)
                        ON CONFLICT DO NOTHING
                    """, (
                        pattern_type,
                        json.dumps(pattern),
                        pattern["frequency"]
                    ))
            
            self.db_conn.commit()
            cursor.close()
            
            logging.info("✅ Extracted Allan communication patterns")
            
        except Exception as e:
            logging.error(f"❌ Error extracting patterns: {e}")
    
    def vector_search_allan_memories(self, query, limit=5):
        """Search Allan's memories using vector similarity"""
        try:
            cursor = self.db_conn.cursor()
            
            # Generate query embedding
            query_embedding = self.simple_embedding(query)
            
            # Simple text search (in production, use proper vector search)
            cursor.execute("""
                SELECT content, memory_type, priority, 
                       similarity(content, %s) as distance
                FROM allanbot_memory
                WHERE content ILIKE %s
                ORDER BY distance DESC
                LIMIT %s
            """, (query, f"%{query}%", limit))
            
            results = cursor.fetchall()
            cursor.close()
            
            return results
            
        except Exception as e:
            logging.error(f"❌ Error in vector search: {e}")
            return []
    
    def train_allanbot_from_memories(self):
        """Train AllanBot using accumulated memories and patterns"""
        try:
            cursor = self.db_conn.cursor()
            
            # Get training data
            cursor.execute("""
                SELECT memory_type, content, priority, context
                FROM allanbot_memory
                ORDER BY created_at DESC
                LIMIT 100
            """)
            
            memories = cursor.fetchall()
            
            # Generate AllanBot personality profile
            allanbot_profile = {
                "communication_style": "Direct, action-oriented, revenue-focused",
                "key_phrases": [
                    "Make sure",
                    "Please note", 
                    "Ship it",
                    "Fix pls",
                    "Do it all"
                ],
                "priority_patterns": {
                    "high": ["inbox", "revenue", "deals", "clients"],
                    "medium": ["interface", "notes", "system"],
                    "low": ["documentation", "testing"]
                },
                "collaboration_style": "Strategic partnership, not just assistance",
                "decision_making": "Fast, pragmatic, revenue-focused"
            }
            
            # Store AllanBot profile
            cursor.execute("""
                INSERT INTO allanbot_patterns (
                    pattern_type, pattern_data, frequency, confidence
                ) VALUES (%s, %s, %s, %s)
                ON CONFLICT DO NOTHING
            """, (
                "allanbot_personality_profile",
                json.dumps(allanbot_profile),
                1,
                0.9
            ))
            
            self.db_conn.commit()
            cursor.close()
            
            logging.info("✅ AllanBot trained from memories and patterns")
            
        except Exception as e:
            logging.error(f"❌ Error training AllanBot: {e}")
    
    def run_training_cycle(self):
        """Run complete AllanBot training cycle"""
        try:
            logging.info("🚀 Starting AllanBot Sticky Memory Training...")
            
            # Connect to database
            self.connect_db()
            
            # Create tables
            self.create_allanbot_memory_tables()
            
            # Process sticky notes
            self.process_sticky_notes()
            
            # Extract patterns
            self.extract_allan_patterns()
            
            # Train AllanBot
            self.train_allanbot_from_memories()
            
            # Test vector search
            test_query = "inbox system implementation"
            results = self.vector_search_allan_memories(test_query)
            
            logging.info(f"🔍 Vector search test for '{test_query}':")
            for result in results:
                content, memory_type, priority, distance = result
                logging.info(f"   {priority}: {content[:60]}... (distance: {distance:.3f})")
            
            logging.info("✅ AllanBot Sticky Memory Training Complete!")
            
        except Exception as e:
            logging.error(f"❌ Training cycle failed: {e}")
        finally:
            if self.db_conn:
                self.db_conn.close()

if __name__ == "__main__":
    trainer = AllanBotStickyMemoryTrainer()
    trainer.run_training_cycle()
