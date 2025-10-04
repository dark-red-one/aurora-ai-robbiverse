#!/usr/bin/env python3
"""
Fireflies.ai API Connector for TestPilot Simulations
Pulls meeting transcripts and insights into Aurora-Postgres
"""

import os
import requests
import psycopg2
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional

class FirefliesConnector:
    def __init__(self, api_key: str, db_config: Dict):
        self.api_key = api_key
        self.base_url = "https://api.fireflies.ai/graphql"
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        self.db_config = db_config
        
    def get_db_connection(self):
        return psycopg2.connect(**self.db_config)
    
    def fetch_transcripts(self, days_back: int = 30) -> List[Dict]:
        """Fetch meeting transcripts from Fireflies"""
        query = """
        query GetTranscripts($filter: TranscriptFilter) {
          transcripts(filter: $filter) {
            id
            title
            date
            duration
            organizer_email
            participants {
              name
              email
            }
            sentences {
              text
              speaker_name
              start_time
            }
            summary {
              keywords
              action_items
              overview
              bullet_points
            }
            ai_insights {
              sentiment
              topics
              questions
            }
          }
        }
        """
        
        # Filter for recent meetings
        start_date = (datetime.now() - timedelta(days=days_back)).isoformat()
        
        variables = {
            "filter": {
                "date_range": {
                    "start_date": start_date
                }
            }
        }
        
        response = requests.post(
            self.base_url,
            headers=self.headers,
            json={"query": query, "variables": variables}
        )
        response.raise_for_status()
        
        data = response.json()
        return data.get("data", {}).get("transcripts", [])
    
    def import_transcripts(self, transcripts: List[Dict]) -> int:
        """Import meeting transcripts into Aurora-Postgres"""
        conn = self.get_db_connection()
        imported = 0
        
        # Create meetings table if not exists
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS meetings (
                    id SERIAL PRIMARY KEY,
                    fireflies_id VARCHAR(255) UNIQUE NOT NULL,
                    title VARCHAR(500),
                    meeting_date TIMESTAMP,
                    duration_minutes INTEGER,
                    organizer_email VARCHAR(255),
                    participants JSONB DEFAULT '[]',
                    transcript TEXT,
                    summary JSONB,
                    ai_insights JSONB,
                    keywords TEXT[],
                    action_items TEXT[],
                    owner_id VARCHAR(50) DEFAULT 'aurora',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
        
        try:
            with conn.cursor() as cur:
                for transcript in transcripts:
                    # Build full transcript text
                    transcript_text = "\n".join([
                        f"{sentence.get('speaker_name', 'Unknown')}: {sentence.get('text', '')}"
                        for sentence in transcript.get("sentences", [])
                    ])
                    
                    # Extract action items
                    action_items = []
                    if transcript.get("summary", {}).get("action_items"):
                        action_items = transcript["summary"]["action_items"]
                    
                    # Extract keywords
                    keywords = []
                    if transcript.get("summary", {}).get("keywords"):
                        keywords = transcript["summary"]["keywords"]
                    
                    meeting_data = {
                        "fireflies_id": transcript["id"],
                        "title": transcript.get("title"),
                        "meeting_date": transcript.get("date"),
                        "duration_minutes": transcript.get("duration"),
                        "organizer_email": transcript.get("organizer_email"),
                        "participants": json.dumps(transcript.get("participants", [])),
                        "transcript": transcript_text,
                        "summary": json.dumps(transcript.get("summary", {})),
                        "ai_insights": json.dumps(transcript.get("ai_insights", {})),
                        "keywords": keywords,
                        "action_items": action_items,
                        "owner_id": "aurora"
                    }
                    
                    cur.execute("""
                        INSERT INTO meetings (
                            fireflies_id, title, meeting_date, duration_minutes,
                            organizer_email, participants, transcript, summary,
                            ai_insights, keywords, action_items, owner_id
                        ) VALUES (
                            %(fireflies_id)s, %(title)s, %(meeting_date)s,
                            %(duration_minutes)s, %(organizer_email)s,
                            %(participants)s, %(transcript)s, %(summary)s,
                            %(ai_insights)s, %(keywords)s, %(action_items)s,
                            %(owner_id)s
                        ) ON CONFLICT (fireflies_id) DO UPDATE SET
                            title = EXCLUDED.title,
                            meeting_date = EXCLUDED.meeting_date,
                            duration_minutes = EXCLUDED.duration_minutes,
                            participants = EXCLUDED.participants,
                            transcript = EXCLUDED.transcript,
                            summary = EXCLUDED.summary,
                            ai_insights = EXCLUDED.ai_insights,
                            keywords = EXCLUDED.keywords,
                            action_items = EXCLUDED.action_items,
                            updated_at = CURRENT_TIMESTAMP
                    """, meeting_data)
                    imported += 1
                    
            conn.commit()
            
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()
            
        return imported

if __name__ == "__main__":
    # Configuration
    FIREFLIES_API_KEY = os.getenv("FIREFLIES_API_KEY")
    
    db_config = {
        "host": "aurora-postgres-u44170.vm.elestio.app",
        "port": 25432,
        "dbname": "aurora_unified",
        "user": "aurora_app", 
        "password": "TestPilot2025_Aurora!",
        "sslmode": "require"
    }
    
    if not FIREFLIES_API_KEY:
        print("❌ FIREFLIES_API_KEY environment variable required")
        exit(1)
    
    connector = FirefliesConnector(FIREFLIES_API_KEY, db_config)
    
    print("🚀 Starting Fireflies data import...")
    
    # Import transcripts from last 30 days
    print("📝 Fetching meeting transcripts...")
    transcripts = connector.fetch_transcripts(days_back=30)
    imported_transcripts = connector.import_transcripts(transcripts)
    print(f"✅ Imported {imported_transcripts} meeting transcripts")
    
    print("🎉 Fireflies import complete!")
