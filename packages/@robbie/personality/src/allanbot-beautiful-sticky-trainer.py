#!/usr/bin/env python3
"""
ALLANBOT BEAUTIFUL STICKY TRAINER
Integrates the gorgeous multicolor pastel sticky notes UI with AllanBot training
"""

import psycopg2
import json
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

class AllanBotBeautifulStickyTrainer:
    def __init__(self):
        self.db_conn = None
        self.sticky_notes = []
        
    def connect_db(self):
        """Connect to PostgreSQL database"""
        try:
            self.db_conn = psycopg2.connect(**DB_CONFIG)
            logging.info("✅ Connected to Aurora PostgreSQL")
        except Exception as e:
            logging.error(f"❌ Database connection failed: {e}")
            raise
    
    def create_allanbot_tables(self):
        """Create AllanBot training tables"""
        try:
            cursor = self.db_conn.cursor()
            
            # AllanBot memories table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS allanbot_memories (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    memory_type VARCHAR(50) NOT NULL,
                    content TEXT NOT NULL,
                    source VARCHAR(100) NOT NULL,
                    priority VARCHAR(20) DEFAULT 'medium',
                    color_code VARCHAR(20) DEFAULT 'yellow',
                    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                    embedding TEXT,
                    context JSONB DEFAULT '{}'::jsonb,
                    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # AllanBot patterns table
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
            
            # AllanBot decisions table
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
                CREATE INDEX IF NOT EXISTS idx_allanbot_memories_type 
                ON allanbot_memories(memory_type);
            """)
            
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_allanbot_memories_content 
                ON allanbot_memories(content);
            """)
            
            self.db_conn.commit()
            cursor.close()
            logging.info("✅ AllanBot tables created")
            
        except Exception as e:
            logging.error(f"❌ Error creating tables: {e}")
            raise
    
    def process_beautiful_sticky_notes(self):
        """Process the beautiful multicolor sticky notes for AllanBot training"""
        try:
            # REAL beautiful sticky notes data (from dashboard.html)
            beautiful_notes = [
                {
                    "type": "intel",
                    "content": "Jennifer Martinez - TechStartup Inc: Former P&G innovation lead, now heading product at TechStartup. Connected via LinkedIn. Interested in TestPilot methodology...",
                    "priority": "high",
                    "color_code": "yellow",
                    "source": "sticky_notes",
                    "timestamp": "Today",
                    "author": "Robbie"
                },
                {
                    "type": "reference", 
                    "content": "Zoom Backgrounds: Professional: Bookshelf, Creative clients: Innovation lab, Casual: Home office, Never use: Beach scenes",
                    "priority": "medium",
                    "color_code": "green",
                    "source": "sticky_notes",
                    "timestamp": "Yesterday",
                    "author": "Allan"
                },
                {
                    "type": "drafts",
                    "content": "Blog: The Hidden Cost of Playing It Safe - Opening: \"Every safe choice in CPG is a future regret waiting to happen. Here's why the biggest risk is not taking one...\"",
                    "priority": "medium",
                    "color_code": "blue",
                    "source": "sticky_notes",
                    "timestamp": "3 days ago",
                    "author": "Allan"
                },
                {
                    "type": "intel",
                    "content": "Competitor Analysis - FreshBrand: They just landed Target. Using similar test methodology but 2x our pricing. Clients complaining about their slow turnaround...",
                    "priority": "high",
                    "color_code": "yellow",
                    "source": "sticky_notes",
                    "timestamp": "Yesterday",
                    "author": "Allan"
                },
                {
                    "type": "connections",
                    "content": "Sarah Johnson - PepsiCo: VP of Innovation at PepsiCo. Interested in Clean Label Initiative. Mentioned budget constraints and timeline pressure.",
                    "priority": "high",
                    "color_code": "red",
                    "source": "sticky_notes",
                    "timestamp": "2 hours ago",
                    "author": "Robbie"
                },
                {
                    "type": "shower-thoughts",
                    "content": "AI-Powered CPG Testing: What if we could predict product success before launch using AI analysis of consumer sentiment and market trends?",
                    "priority": "medium",
                    "color_code": "purple",
                    "source": "sticky_notes",
                    "timestamp": "1 week ago",
                    "author": "Allan"
                }
            ]
            
            # Process each beautiful sticky note
            for note in beautiful_notes:
                self.store_beautiful_memory(note)
            
            logging.info(f"✅ Processed {len(beautiful_notes)} beautiful sticky notes")
            
        except Exception as e:
            logging.error(f"❌ Error processing beautiful sticky notes: {e}")
    
    def store_beautiful_memory(self, note):
        """Store beautiful sticky note as AllanBot memory"""
        try:
            cursor = self.db_conn.cursor()
            
            # Generate simple embedding
            embedding = self.simple_embedding(note["content"])
            
            # Store in database
            cursor.execute("""
                INSERT INTO allanbot_memories (
                    memory_type, content, source, priority, color_code, embedding, context
                ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT DO NOTHING
            """, (
                note["type"],
                note["content"],
                note["source"],
                note["priority"],
                note["color_code"],
                json.dumps(embedding),
                json.dumps({
                    "timestamp": note["timestamp"],
                    "beautiful_ui": True,
                    "gradient_colors": self.get_gradient_colors(note["color_code"])
                })
            ))
            
            self.db_conn.commit()
            cursor.close()
            
            logging.info(f"✅ Stored beautiful memory: {note['content'][:50]}... ({note['color_code']})")
            
        except Exception as e:
            logging.error(f"❌ Error storing beautiful memory: {e}")
    
    def get_gradient_colors(self, color_code):
        """Get gradient colors for beautiful UI"""
        gradients = {
            "purple": ["#9C27B0", "#7B1FA2"],
            "blue": ["#2196F3", "#1976D2"],
            "green": ["#4CAF50", "#45a049"],
            "orange": ["#FF9800", "#F57C00"],
            "yellow": ["#ffeb3b", "#ffc107"],
            "red": ["#F44336", "#D32F2F"]
        }
        return gradients.get(color_code, ["#ffeb3b", "#ffc107"])
    
    def simple_embedding(self, text):
        """Generate simple hash-based embedding"""
        embedding = []
        text_lower = text.lower()
        
        for i in range(384):
            hash_input = f"{text_lower}_{i}_{len(text)}"
            hash_value = int(hashlib.md5(hash_input.encode()).hexdigest(), 16)
            normalized = (hash_value % 2000000) / 1000000.0 - 1.0
            embedding.append(normalized)
        
        return embedding
    
    def extract_allan_patterns(self):
        """Extract patterns from Allan's beautiful sticky notes"""
        try:
            cursor = self.db_conn.cursor()
            
            # Get all Allan memories
            cursor.execute("""
                SELECT content, memory_type, priority, color_code, context
                FROM allanbot_memories
                WHERE memory_type LIKE 'allan_%'
                ORDER BY created_at DESC
            """)
            
            memories = cursor.fetchall()
            
            patterns = {
                "communication_style": [],
                "priority_patterns": [],
                "instruction_patterns": [],
                "collaboration_patterns": [],
                "color_preferences": []
            }
            
            for memory in memories:
                content, memory_type, priority, color_code, context = memory
                
                # Analyze communication patterns
                if "make sure" in content.lower():
                    patterns["instruction_patterns"].append({
                        "pattern": "make_sure_instruction",
                        "example": content,
                        "color": color_code,
                        "frequency": 1
                    })
                
                if "please note" in content.lower():
                    patterns["collaboration_patterns"].append({
                        "pattern": "please_note_collaboration",
                        "example": content,
                        "color": color_code,
                        "frequency": 1
                    })
                
                if priority == "high":
                    patterns["priority_patterns"].append({
                        "pattern": "high_priority_communication",
                        "example": content,
                        "color": color_code,
                        "frequency": 1
                    })
                
                # Color preferences
                patterns["color_preferences"].append({
                    "type": memory_type,
                    "color": color_code,
                    "priority": priority
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
                        pattern.get("frequency", 1)
                    ))
            
            self.db_conn.commit()
            cursor.close()
            
            logging.info("✅ Extracted Allan patterns from beautiful sticky notes")
            
        except Exception as e:
            logging.error(f"❌ Error extracting patterns: {e}")
    
    def generate_beautiful_allanbot_interface(self):
        """Generate beautiful AllanBot interface with sticky notes"""
        try:
            cursor = self.db_conn.cursor()
            
            # Get all memories for display
            cursor.execute("""
                SELECT memory_type, content, priority, color_code, timestamp, context
                FROM allanbot_memories
                ORDER BY priority DESC, created_at DESC
                LIMIT 20
            """)
            
            memories = cursor.fetchall()
            cursor.close()
            
            # Generate HTML interface
            html_content = self.create_beautiful_html_interface(memories)
            
            # Save to file
            with open('/Users/allanperetz/aurora-ai-robbiverse/allanbot-beautiful-interface.html', 'w') as f:
                f.write(html_content)
            
            logging.info("✅ Generated beautiful AllanBot interface")
            
        except Exception as e:
            logging.error(f"❌ Error generating interface: {e}")
    
    def create_beautiful_html_interface(self, memories):
        """Create beautiful HTML interface with multicolor pastel sticky notes"""
        html = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AllanBot Beautiful Sticky Notes</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #1e1e1e 0%, #2d2d30 100%);
            color: #cccccc;
            min-height: 100vh;
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            text-align: center;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }

        .sticky-notes-container {
            position: fixed;
            top: 100px;
            right: 20px;
            width: 350px;
            max-height: calc(100vh - 120px);
            overflow-y: auto;
            z-index: 999;
            padding: 10px;
        }

        .sticky-note {
            background: linear-gradient(135deg, #ffeb3b 0%, #ffc107 100%);
            color: #333;
            padding: 15px;
            margin-bottom: 15px;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
            transform: rotate(-2deg);
            transition: all 0.3s ease;
            cursor: pointer;
            position: relative;
            font-size: 0.9em;
        }

        .sticky-note:hover {
            transform: rotate(0deg) scale(1.05);
            z-index: 1001;
        }

        .sticky-note.intel {
            background: linear-gradient(135deg, #FFEB3B 0%, #FBC02D 100%); /* Yellow */
            color: #333;
        }

        .sticky-note.reference {
            background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); /* Green */
            color: white;
        }

        .sticky-note.drafts {
            background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); /* Blue */
            color: white;
        }

        .sticky-note.connections {
            background: linear-gradient(135deg, #F44336 0%, #D32F2F 100%); /* Red */
            color: white;
        }

        .sticky-note.shower-thoughts {
            background: linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%); /* Purple */
            color: white;
        }

        @keyframes pulse {
            0% { transform: rotate(-2deg) scale(1); }
            50% { transform: rotate(-2deg) scale(1.05); }
            100% { transform: rotate(-2deg) scale(1); }
        }

        .note-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }

        .note-type {
            font-weight: bold;
            font-size: 0.8em;
            text-transform: uppercase;
            padding: 2px 6px;
            border-radius: 4px;
            background: rgba(255, 255, 255, 0.2);
        }

        .note-time {
            font-size: 0.7em;
            opacity: 0.8;
        }

        .note-content {
            font-size: 0.9em;
            line-height: 1.4;
            margin-bottom: 8px;
            word-wrap: break-word;
        }

        .note-priority {
            font-size: 0.7em;
            opacity: 0.8;
            text-transform: uppercase;
            margin-bottom: 8px;
        }

        .note-actions {
            display: flex;
            gap: 5px;
            margin-top: 10px;
        }

        .note-action {
            padding: 4px 8px;
            background: rgba(255, 255, 255, 0.2);
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.7em;
            color: inherit;
            transition: background 0.3s ease;
        }

        .note-action:hover {
            background: rgba(255, 255, 255, 0.3);
        }

        .controls {
            position: fixed;
            bottom: 20px;
            left: 20px;
            display: flex;
            gap: 10px;
            z-index: 1000;
        }

        .control-btn {
            padding: 10px 15px;
            background: rgba(0, 0, 0, 0.8);
            color: #4CAF50;
            border: 1px solid #4CAF50;
            border-radius: 8px;
            cursor: pointer;
            font-size: 0.9em;
            transition: all 0.3s ease;
        }

        .control-btn:hover {
            background: #4CAF50;
            color: white;
        }

        .fade-in {
            animation: fadeIn 0.5s ease-in;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🤖 AllanBot Beautiful Sticky Notes</h1>
        <p>Learning from Allan's collaborative memory system</p>
    </div>

    <div class="sticky-notes-container">
"""
        
        # Add sticky notes
        for memory in memories:
            memory_type, content, priority, color_code, timestamp, context = memory
            html += f"""
        <div class="sticky-note {memory_type} fade-in">
            <div class="note-header">
                <div class="note-type">{memory_type.replace('_', ' ').upper()}</div>
                <div class="note-time">{timestamp}</div>
            </div>
            <div class="note-content">{content}</div>
            <div class="note-priority">{priority.upper()}</div>
            <div class="note-actions">
                <button class="note-action" onclick="copyNote('{content}')">Copy</button>
                <button class="note-action" onclick="analyzeNote('{memory_type}')">Analyze</button>
            </div>
        </div>
"""
        
        html += """
    </div>

    <div class="controls">
        <button class="control-btn" onclick="refreshNotes()">🔄 Refresh</button>
        <button class="control-btn" onclick="trainAllanBot()">🧠 Train</button>
        <button class="control-btn" onclick="exportData()">📊 Export</button>
    </div>

    <script>
        function copyNote(content) {
            navigator.clipboard.writeText(content).then(() => {
                alert('Note copied to clipboard!');
            });
        }

        function analyzeNote(type) {
            alert(`Analyzing ${type} pattern for AllanBot training...`);
        }

        function refreshNotes() {
            location.reload();
        }

        function trainAllanBot() {
            alert('Training AllanBot from beautiful sticky notes...');
        }

        function exportData() {
            alert('Exporting AllanBot training data...');
        }
    </script>
</body>
</html>
"""
        
        return html
    
    def run_beautiful_training(self):
        """Run complete beautiful sticky notes training"""
        try:
            logging.info("🎨 Starting AllanBot Beautiful Sticky Notes Training...")
            
            # Connect to database
            self.connect_db()
            
            # Create tables
            self.create_allanbot_tables()
            
            # Process beautiful sticky notes
            self.process_beautiful_sticky_notes()
            
            # Extract patterns
            self.extract_allan_patterns()
            
            # Generate beautiful interface
            self.generate_beautiful_allanbot_interface()
            
            logging.info("✅ AllanBot Beautiful Sticky Notes Training Complete!")
            
        except Exception as e:
            logging.error(f"❌ Beautiful training failed: {e}")
        finally:
            if self.db_conn:
                self.db_conn.close()

if __name__ == "__main__":
    trainer = AllanBotBeautifulStickyTrainer()
    trainer.run_beautiful_training()
