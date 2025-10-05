#!/usr/bin/env python3
"""
Universal Directive Capture Engine
Captures major directives from conversations across all interfaces
"""

import sqlite3
import re
import json
from datetime import datetime
from typing import List, Dict, Optional

DB_PATH = '/Users/allanperetz/aurora-ai-robbiverse/data/vengeance.db'

class DirectiveCaptureEngine:
    def __init__(self):
        self.db_path = DB_PATH
        self.directive_patterns = [
            # Direct commands
            r'(?:build|create|implement|add|make|develop)\s+(?:a\s+)?(.+?)(?:\.|$)',
            r'(?:automate|setup|configure|enable)\s+(.+?)(?:\.|$)',
            r'(?:focus\s+on|prioritize|emphasize)\s+(.+?)(?:\.|$)',
            r'(?:remove|delete|excise|eliminate)\s+(.+?)(?:\.|$)',
            r'(?:change|update|modify|fix)\s+(.+?)(?:\.|$)',
            r'(?:show|display|demonstrate)\s+(.+?)(?:\.|$)',
            r'(?:start|begin|launch)\s+(.+?)(?:\.|$)',
            r'(?:stop|halt|pause)\s+(.+?)(?:\.|$)',
            
            # Strategic directives
            r'(?:we\s+need|i\s+want|let\'s|we\s+should)\s+(.+?)(?:\.|$)',
            r'(?:this\s+is\s+critical|urgent|important)\s*:?\s*(.+?)(?:\.|$)',
            r'(?:goal|objective|mission)\s*:?\s*(.+?)(?:\.|$)',
            
            # Business priorities
            r'(?:revenue|sales|deals|closing)\s+(.+?)(?:\.|$)',
            r'(?:customer|client|user)\s+(.+?)(?:\.|$)',
            r'(?:scale|growth|expansion)\s+(.+?)(?:\.|$)',
            
            # Technical directives
            r'(?:architecture|system|platform|infrastructure)\s+(.+?)(?:\.|$)',
            r'(?:api|database|schema|table)\s+(.+?)(?:\.|$)',
            r'(?:ui|ux|interface|widget|component)\s+(.+?)(?:\.|$)',
        ]
        
        self.priority_keywords = {
            'critical': 10, 'urgent': 9, 'asap': 9, 'now': 8, 'immediately': 8,
            'important': 7, 'priority': 7, 'high': 7, 'soon': 6, 'next': 6,
            'revenue': 8, 'sales': 8, 'deals': 8, 'closing': 8, 'money': 8,
            'customer': 7, 'client': 7, 'user': 7, 'experience': 6,
            'scale': 7, 'growth': 7, 'expansion': 7, '100x': 8,
            'architecture': 6, 'system': 6, 'platform': 6, 'infrastructure': 6
        }
        
        self.source_mapping = {
            'cursor': 'cursor',
            'chat': 'chat', 
            'email': 'email',
            'phone': 'phone',
            'aurora-town': 'aurora-town',
            'slack': 'slack',
            'teams': 'teams',
            'discord': 'discord'
        }

    def extract_directives(self, text: str, source: str = 'cursor') -> List[Dict]:
        """Extract directives from conversation text"""
        directives = []
        
        # Clean and normalize text
        text = text.strip().lower()
        
        # Skip if too short or not directive-like
        if len(text) < 10 or not any(keyword in text for keyword in ['build', 'create', 'add', 'make', 'implement', 'automate', 'focus', 'need', 'want', 'should']):
            return directives
        
        # Extract directives using patterns
        for pattern in self.directive_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                directive_text = match.strip()
                if len(directive_text) > 5:  # Minimum length
                    priority = self.calculate_priority(directive_text, text)
                    directives.append({
                        'text': directive_text,
                        'priority': priority,
                        'source': source,
                        'context': text[:100] + '...' if len(text) > 100 else text
                    })
        
        return directives

    def calculate_priority(self, directive: str, context: str) -> int:
        """Calculate priority based on keywords and context"""
        base_priority = 5
        
        # Check for priority keywords in directive and context
        for keyword, priority in self.priority_keywords.items():
            if keyword in directive.lower() or keyword in context.lower():
                base_priority = max(base_priority, priority)
        
        # Boost priority for certain patterns
        if any(word in directive.lower() for word in ['revenue', 'sales', 'deals', 'money', 'closing']):
            base_priority = max(base_priority, 8)
        
        if any(word in directive.lower() for word in ['urgent', 'critical', 'asap', 'now']):
            base_priority = max(base_priority, 9)
        
        if any(word in directive.lower() for word in ['architecture', 'system', 'platform', 'infrastructure']):
            base_priority = max(base_priority, 6)
        
        return base_priority

    def save_directive(self, directive: Dict, personality_id: str = 'robbie') -> bool:
        """Save directive to database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO ai_directives (personality_id, directive_text, source, priority, status)
                VALUES (?, ?, ?, ?, 'active')
            """, (personality_id, directive['text'], directive['source'], directive['priority']))
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error saving directive: {e}")
            return False

    def process_conversation(self, text: str, source: str = 'cursor', personality_id: str = 'robbie') -> int:
        """Process conversation text and extract/save directives"""
        directives = self.extract_directives(text, source)
        saved_count = 0
        
        for directive in directives:
            if self.save_directive(directive, personality_id):
                saved_count += 1
                print(f"📝 Captured directive: {directive['text'][:50]}... (Priority: {directive['priority']}, Source: {directive['source']})")
        
        return saved_count

    def get_recent_directives(self, personality_id: str = 'robbie', limit: int = 10) -> List[Dict]:
        """Get recent directives from database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT directive_text, source, timestamp, priority, status
                FROM ai_directives 
                WHERE personality_id = ? 
                ORDER BY timestamp DESC 
                LIMIT ?
            """, (personality_id, limit))
            
            results = []
            for row in cursor.fetchall():
                results.append({
                    'text': row[0],
                    'source': row[1],
                    'timestamp': row[2],
                    'priority': row[3],
                    'status': row[4]
                })
            
            conn.close()
            return results
        except Exception as e:
            print(f"Error getting directives: {e}")
            return []

    def mark_directive_completed(self, directive_id: int) -> bool:
        """Mark a directive as completed"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                UPDATE ai_directives 
                SET status = 'completed' 
                WHERE id = ?
            """, (directive_id,))
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error marking directive completed: {e}")
            return False

def main():
    """Test the directive capture engine"""
    engine = DirectiveCaptureEngine()
    
    # Test with sample conversation
    test_conversation = """
    We need to build a universal AI personality state management system. 
    This is critical for our revenue goals. Let's automate mood transitions 
    and study human psychology to drive progress. I want to add an animated 
    tokens per minute trend chart with moving average curvilinear. 
    Focus on closing deals NOW - we have $200K loan discussion this week.
    """
    
    print("🚀 Testing Directive Capture Engine...")
    saved_count = engine.process_conversation(test_conversation, 'cursor')
    print(f"✅ Captured {saved_count} directives")
    
    # Show recent directives
    recent = engine.get_recent_directives()
    print(f"\n📋 Recent Directives ({len(recent)}):")
    for i, directive in enumerate(recent[:5], 1):
        print(f"{i}. {directive['text'][:60]}... (Priority: {directive['priority']}, Source: {directive['source']})")

if __name__ == "__main__":
    main()













