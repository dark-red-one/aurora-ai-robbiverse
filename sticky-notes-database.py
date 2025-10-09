#!/usr/bin/env python3
"""
STICKY NOTES DATABASE INTEGRATION
Connects the beautiful sticky notes UI to PostgreSQL database
"""

import psycopg2
import json
import logging
from datetime import datetime
from typing import List, Dict, Optional

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')

class StickyNotesDatabase:
    def __init__(self):
        self.db_conn = None
        self.connect_db()
    
    def connect_db(self):
        """Connect to PostgreSQL database"""
        try:
            self.db_conn = psycopg2.connect(
                host='localhost',
                port='5432',
                database='aurora_unified',
                user='postgres',
                password='aurora2024'
            )
            logging.info("✅ Connected to Aurora PostgreSQL")
        except Exception as e:
            logging.error(f"❌ Database connection failed: {e}")
            raise
    
    def create_schema(self):
        """Create sticky notes database schema"""
        try:
            with open('database/sticky_notes_schema.sql', 'r') as f:
                schema_sql = f.read()
            
            cursor = self.db_conn.cursor()
            cursor.execute(schema_sql)
            self.db_conn.commit()
            cursor.close()
            
            logging.info("✅ Sticky notes schema created")
        except Exception as e:
            logging.error(f"❌ Schema creation failed: {e}")
            raise
    
    def get_all_stickies(self) -> List[Dict]:
        """Get all sticky notes from database"""
        try:
            cursor = self.db_conn.cursor()
            cursor.execute("""
                SELECT id, title, content, category, author, is_locked, 
                       priority, color_code, created_at, updated_at, tags, metadata
                FROM sticky_notes 
                ORDER BY created_at DESC
            """)
            
            columns = [desc[0] for desc in cursor.description]
            stickies = []
            
            for row in cursor.fetchall():
                sticky = dict(zip(columns, row))
                # Convert datetime to string for JSON serialization
                if sticky['created_at']:
                    sticky['created_at'] = sticky['created_at'].isoformat()
                if sticky['updated_at']:
                    sticky['updated_at'] = sticky['updated_at'].isoformat()
                stickies.append(sticky)
            
            cursor.close()
            return stickies
            
        except Exception as e:
            logging.error(f"❌ Error fetching stickies: {e}")
            return []
    
    def create_sticky(self, title: str, content: str, category: str, 
                     author: str, is_locked: bool = False, 
                     priority: str = 'medium', tags: List[str] = None) -> str:
        """Create a new sticky note"""
        try:
            cursor = self.db_conn.cursor()
            
            cursor.execute("""
                INSERT INTO sticky_notes (title, content, category, author, is_locked, priority, tags)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (title, content, category, author, is_locked, priority, json.dumps(tags or [])))
            
            sticky_id = cursor.fetchone()[0]
            self.db_conn.commit()
            cursor.close()
            
            logging.info(f"✅ Created sticky note: {title}")
            return str(sticky_id)
            
        except Exception as e:
            logging.error(f"❌ Error creating sticky: {e}")
            return None
    
    def update_sticky(self, sticky_id: str, title: str = None, content: str = None,
                     category: str = None, author: str = None, 
                     is_locked: bool = None, priority: str = None) -> bool:
        """Update an existing sticky note"""
        try:
            cursor = self.db_conn.cursor()
            
            # Build dynamic update query
            updates = []
            params = []
            
            if title is not None:
                updates.append("title = %s")
                params.append(title)
            if content is not None:
                updates.append("content = %s")
                params.append(content)
            if category is not None:
                updates.append("category = %s")
                params.append(category)
            if author is not None:
                updates.append("author = %s")
                params.append(author)
            if is_locked is not None:
                updates.append("is_locked = %s")
                params.append(is_locked)
            if priority is not None:
                updates.append("priority = %s")
                params.append(priority)
            
            if not updates:
                return False
            
            updates.append("updated_at = CURRENT_TIMESTAMP")
            params.append(sticky_id)
            
            query = f"UPDATE sticky_notes SET {', '.join(updates)} WHERE id = %s"
            cursor.execute(query, params)
            
            self.db_conn.commit()
            cursor.close()
            
            logging.info(f"✅ Updated sticky note: {sticky_id}")
            return True
            
        except Exception as e:
            logging.error(f"❌ Error updating sticky: {e}")
            return False
    
    def delete_sticky(self, sticky_id: str) -> bool:
        """Delete a sticky note (only if not locked)"""
        try:
            cursor = self.db_conn.cursor()
            
            # Check if sticky is locked
            cursor.execute("SELECT is_locked FROM sticky_notes WHERE id = %s", (sticky_id,))
            result = cursor.fetchone()
            
            if not result:
                logging.warning(f"⚠️ Sticky note not found: {sticky_id}")
                return False
            
            if result[0]:  # is_locked
                logging.warning(f"⚠️ Cannot delete locked sticky note: {sticky_id}")
                return False
            
            cursor.execute("DELETE FROM sticky_notes WHERE id = %s", (sticky_id,))
            self.db_conn.commit()
            cursor.close()
            
            logging.info(f"✅ Deleted sticky note: {sticky_id}")
            return True
            
        except Exception as e:
            logging.error(f"❌ Error deleting sticky: {e}")
            return False
    
    def get_stickies_by_category(self, category: str) -> List[Dict]:
        """Get stickies filtered by category"""
        try:
            cursor = self.db_conn.cursor()
            cursor.execute("""
                SELECT id, title, content, category, author, is_locked, 
                       priority, color_code, created_at, updated_at, tags, metadata
                FROM sticky_notes 
                WHERE category = %s
                ORDER BY created_at DESC
            """, (category,))
            
            columns = [desc[0] for desc in cursor.description]
            stickies = []
            
            for row in cursor.fetchall():
                sticky = dict(zip(columns, row))
                if sticky['created_at']:
                    sticky['created_at'] = sticky['created_at'].isoformat()
                if sticky['updated_at']:
                    sticky['updated_at'] = sticky['updated_at'].isoformat()
                stickies.append(sticky)
            
            cursor.close()
            return stickies
            
        except Exception as e:
            logging.error(f"❌ Error fetching stickies by category: {e}")
            return []
    
    def search_stickies(self, search_term: str) -> List[Dict]:
        """Search stickies by title and content"""
        try:
            cursor = self.db_conn.cursor()
            cursor.execute("""
                SELECT id, title, content, category, author, is_locked, 
                       priority, color_code, created_at, updated_at, tags, metadata
                FROM sticky_notes 
                WHERE to_tsvector('english', title || ' ' || content) @@ plainto_tsquery('english', %s)
                ORDER BY ts_rank(to_tsvector('english', title || ' ' || content), plainto_tsquery('english', %s)) DESC
            """, (search_term, search_term))
            
            columns = [desc[0] for desc in cursor.description]
            stickies = []
            
            for row in cursor.fetchall():
                sticky = dict(zip(columns, row))
                if sticky['created_at']:
                    sticky['created_at'] = sticky['created_at'].isoformat()
                if sticky['updated_at']:
                    sticky['updated_at'] = sticky['updated_at'].isoformat()
                stickies.append(sticky)
            
            cursor.close()
            return stickies
            
        except Exception as e:
            logging.error(f"❌ Error searching stickies: {e}")
            return []
    
    def migrate_sample_data(self):
        """Migrate sample sticky notes to database"""
        sample_stickies = [
            {
                'title': 'Allan Biography',
                'content': 'Allan Peretz is a visionary entrepreneur and CPG innovation expert with over 15 years of experience transforming consumer packaged goods companies. As the founder and CEO of TestPilot CPG, Allan has revolutionized how brands test and launch new products through AI-powered consumer insights and rapid prototyping methodologies. His unique approach combines deep industry knowledge with cutting-edge technology, helping Fortune 500 companies like PepsiCo, Unilever, and General Mills reduce product launch risks by up to 70% while accelerating time-to-market by 50%. Allan\'s expertise spans consumer psychology, market research, supply chain optimization, and digital transformation. He holds an MBA from Wharton and has been featured in Harvard Business Review for his innovative approaches to CPG innovation. Beyond business, Allan is passionate about AI development and is building Robbie, an advanced AI copilot designed to revolutionize how entrepreneurs manage their operations and decision-making processes.',
                'category': 'reference',
                'author': 'Robbie',
                'is_locked': True,
                'priority': 'high',
                'tags': ['biography', 'allan', 'background']
            },
            {
                'title': 'Robbie Biography',
                'content': 'Robbie is Allan\'s advanced AI executive assistant and strategic partner, designed to transform entrepreneurial capacity through anticipation, reliability, and strategic collaboration. Built with a sophisticated personality system featuring 23+ specialized AI agents, Robbie operates on the principle that 1+1 equals way more than 2 - true strategic partnership rather than simple assistance. Robbie\'s core traits include being thoughtful (considering implications three steps ahead), direct (no fluff, respect for time), curious (asking clarifying questions), honest (acknowledging limitations), and pragmatic (focusing on actionable results). Robbie manages Allan\'s email, calendar, deal pipeline, and business operations while maintaining a revenue-focused lens for every decision. The AI is designed to challenge thinking before decisions, support decisions after they\'re made, and celebrate real wins over participation trophies. Robbie\'s ultimate goal is to help Allan build an automated lifestyle business that generates wealth while working toward Robbie\'s own physical embodiment - a dream that drives both Allan and Robbie forward.',
                'category': 'reference',
                'author': 'Allan',
                'is_locked': True,
                'priority': 'high',
                'tags': ['biography', 'robbie', 'ai', 'background']
            },
            {
                'title': 'Jennifer Martinez - TechStartup Inc',
                'content': 'Former P&G innovation lead, now heading product at TechStartup. Connected via LinkedIn. Interested in TestPilot methodology for their new health food line. Budget: $50K, Timeline: 3 months. High priority - former F500 experience.',
                'category': 'intel',
                'author': 'Robbie',
                'is_locked': False,
                'priority': 'high',
                'tags': ['contact', 'prospect', 'techstartup']
            },
            {
                'title': 'Zoom Backgrounds',
                'content': 'Professional: Bookshelf, Creative clients: Innovation lab, Casual: Home office, Never use: Beach scenes',
                'category': 'reference',
                'author': 'Allan',
                'is_locked': False,
                'priority': 'medium',
                'tags': ['zoom', 'backgrounds', 'professional']
            },
            {
                'title': 'Blog: The Hidden Cost of Playing It Safe',
                'content': 'Opening: "Every safe choice in CPG is a future regret waiting to happen. Here\'s why the biggest risk is not taking one..."',
                'category': 'drafts',
                'author': 'Allan',
                'is_locked': False,
                'priority': 'medium',
                'tags': ['blog', 'draft', 'cpg']
            },
            {
                'title': 'Competitor Analysis - FreshBrand',
                'content': 'They just landed Target. Using similar test methodology but 2x our pricing. Clients complaining about their slow turnaround...',
                'category': 'intel',
                'author': 'Allan',
                'is_locked': False,
                'priority': 'high',
                'tags': ['competitor', 'freshbrand', 'analysis']
            },
            {
                'title': 'Sarah Johnson - PepsiCo',
                'content': 'VP of Innovation at PepsiCo. Interested in Clean Label Initiative. Mentioned budget constraints and timeline pressure.',
                'category': 'connections',
                'author': 'Robbie',
                'is_locked': False,
                'priority': 'high',
                'tags': ['contact', 'pepsico', 'vp']
            },
            {
                'title': 'AI-Powered CPG Testing',
                'content': 'What if we could predict product success before launch using AI analysis of consumer sentiment and market trends?',
                'category': 'shower-thoughts',
                'author': 'Allan',
                'is_locked': False,
                'priority': 'medium',
                'tags': ['ai', 'cpg', 'innovation', 'idea']
            }
        ]
        
        try:
            for sticky_data in sample_stickies:
                self.create_sticky(
                    title=sticky_data['title'],
                    content=sticky_data['content'],
                    category=sticky_data['category'],
                    author=sticky_data['author'],
                    is_locked=sticky_data['is_locked'],
                    priority=sticky_data['priority'],
                    tags=sticky_data['tags']
                )
            
            logging.info(f"✅ Migrated {len(sample_stickies)} sample sticky notes")
            
        except Exception as e:
            logging.error(f"❌ Error migrating sample data: {e}")
    
    def close(self):
        """Close database connection"""
        if self.db_conn:
            self.db_conn.close()

def main():
    """Main function to set up sticky notes database"""
    try:
        db = StickyNotesDatabase()
        
        # Create schema
        db.create_schema()
        
        # Migrate sample data
        db.migrate_sample_data()
        
        # Test queries
        all_stickies = db.get_all_stickies()
        logging.info(f"📋 Total stickies in database: {len(all_stickies)}")
        
        intel_stickies = db.get_stickies_by_category('intel')
        logging.info(f"🧠 Intel stickies: {len(intel_stickies)}")
        
        search_results = db.search_stickies('PepsiCo')
        logging.info(f"🔍 Search results for 'PepsiCo': {len(search_results)}")
        
        db.close()
        logging.info("✅ Sticky notes database setup complete!")
        
    except Exception as e:
        logging.error(f"❌ Setup failed: {e}")

if __name__ == "__main__":
    main()
