#!/usr/bin/env python3
"""
GPU-Powered Google Sync with Local LLM Processing
Uses Ollama + GPU acceleration for intelligent data processing
"""

import os
import json
import asyncio
import aiohttp
from datetime import datetime, timedelta
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import psycopg2

# Database config
DB_CONFIG = {
    "host": "aurora-postgres-u44170.vm.elestio.app",
    "port": 25432,
    "dbname": "aurora_unified",
    "user": "aurora_app",
    "password": "TestPilot2025_Aurora!",
    "sslmode": "require"
}

# Local LLM config
OLLAMA_URL = "http://localhost:11434"
LITELLM_URL = "http://localhost:23936"

# Service account credentials
CREDS_FILE = "/Users/allanperetz/aurora-ai-robbiverse/api-connectors/google-credentials.json"
ADMIN_EMAIL = "allan@testpilotcpg.com"

# Scopes for domain-wide delegation
SCOPES = [
    'https://mail.google.com/',
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/tasks',
    'https://www.googleapis.com/auth/contacts',
]

class GPUGoogleSync:
    def __init__(self):
        self.conn = None
        self.services = {}
        
    def get_service(self, service_name, version):
        """Build Google API service with domain-wide delegation"""
        if service_name in self.services:
            return self.services[service_name]
            
        print(f"🔑 Authenticating {service_name}...")
        
        credentials = service_account.Credentials.from_service_account_file(
            CREDS_FILE,
            scopes=SCOPES
        )
        
        # Delegate to Allan's account
        delegated_credentials = credentials.with_subject(ADMIN_EMAIL)
        
        service = build(service_name, version, credentials=delegated_credentials)
        self.services[service_name] = service
        print(f"✅ {service_name} service ready!")
        return service
    
    async def process_with_llm(self, data, task_type):
        """Process data with local LLM for intelligence extraction"""
        try:
            # Choose model based on task
            if task_type == "email_analysis":
                model = "llama3.1:8b"  # Fast for email processing
            elif task_type == "calendar_insights":
                model = "qwen2.5:7b"   # Good for scheduling
            elif task_type == "file_classification":
                model = "codellama:13b" # Good for file analysis
            else:
                model = "llama3.1:8b"
            
            # Prepare prompt based on task
            if task_type == "email_analysis":
                prompt = f"""Analyze this email for business intelligence:
Subject: {data.get('subject', 'No Subject')}
From: {data.get('from_email', 'Unknown')}
Snippet: {data.get('snippet', 'No content')}

Extract:
1. Business relevance (1-10)
2. Key topics
3. Action items
4. Sentiment
5. Priority level

Respond in JSON format."""
            
            elif task_type == "calendar_insights":
                prompt = f"""Analyze this calendar event:
Title: {data.get('title', 'No Title')}
Description: {data.get('description', 'No description')}
Attendees: {data.get('attendees', [])}

Extract:
1. Meeting type
2. Business value
3. Key participants
4. Follow-up needed

Respond in JSON format."""
            
            else:
                prompt = f"Analyze this data: {json.dumps(data, indent=2)}"
            
            # Call Ollama
            async with aiohttp.ClientSession() as session:
                payload = {
                    "model": model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.3,
                        "top_p": 0.9,
                        "max_tokens": 500
                    }
                }
                
                async with session.post(f"{OLLAMA_URL}/api/generate", json=payload) as response:
                    if response.status == 200:
                        result = await response.json()
                        return result.get('response', '')
                    else:
                        print(f"⚠️ LLM processing failed: {response.status}")
                        return None
                        
        except Exception as e:
            print(f"⚠️ LLM processing error: {e}")
            return None
    
    async def sync_emails_gpu(self):
        """Sync emails with GPU-powered analysis"""
        print("\n📧 Syncing Gmail with GPU analysis...")
        
        try:
            service = self.get_service('gmail', 'v1')
            conn = psycopg2.connect(**DB_CONFIG)
            cursor = conn.cursor()
            
            # Ensure table exists
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS google_emails_analyzed (
                    id SERIAL PRIMARY KEY,
                    gmail_id VARCHAR(255) UNIQUE NOT NULL,
                    thread_id VARCHAR(255),
                    subject TEXT,
                    from_email VARCHAR(500),
                    to_email TEXT,
                    email_date TIMESTAMP,
                    snippet TEXT,
                    labels TEXT[],
                    is_unread BOOLEAN,
                    ai_analysis JSONB,
                    business_relevance INTEGER,
                    priority_level VARCHAR(20),
                    key_topics TEXT[],
                    sentiment VARCHAR(20),
                    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            conn.commit()
            
            # Get recent emails
            results = service.users().messages().list(
                userId='me',
                maxResults=100,  # Start with 100 for GPU processing
                q='newer_than:30d'
            ).execute()
            
            messages = results.get('messages', [])
            print(f"   Found {len(messages)} recent emails")
            
            email_count = 0
            for msg in messages:
                try:
                    msg_data = service.users().messages().get(
                        userId='me',
                        id=msg['id'],
                        format='metadata',
                        metadataHeaders=['From', 'To', 'Subject', 'Date']
                    ).execute()
                    
                    headers = {h['name']: h['value'] for h in msg_data.get('payload', {}).get('headers', [])}
                    
                    email_data = {
                        'gmail_id': msg['id'],
                        'thread_id': msg.get('threadId'),
                        'subject': headers.get('Subject', 'No Subject'),
                        'from_email': headers.get('From', ''),
                        'to_email': headers.get('To', ''),
                        'snippet': msg_data.get('snippet', ''),
                        'labels': msg_data.get('labelIds', []),
                        'is_unread': 'UNREAD' in msg_data.get('labelIds', [])
                    }
                    
                    # Process with LLM
                    print(f"   🤖 Analyzing: {email_data['subject'][:50]}...")
                    ai_analysis = await self.process_with_llm(email_data, "email_analysis")
                    
                    # Parse AI analysis
                    business_relevance = 5  # Default
                    priority_level = "medium"
                    key_topics = []
                    sentiment = "neutral"
                    
                    if ai_analysis:
                        try:
                            # Try to parse JSON response
                            analysis_json = json.loads(ai_analysis)
                            business_relevance = analysis_json.get('business_relevance', 5)
                            priority_level = analysis_json.get('priority_level', 'medium')
                            key_topics = analysis_json.get('key_topics', [])
                            sentiment = analysis_json.get('sentiment', 'neutral')
                        except:
                            # If not JSON, extract numbers
                            if 'business relevance' in ai_analysis.lower():
                                import re
                                relevance_match = re.search(r'(\d+)', ai_analysis)
                                if relevance_match:
                                    business_relevance = int(relevance_match.group(1))
                    
                    # Store with AI analysis
                    cursor.execute("""
                        INSERT INTO google_emails_analyzed (
                            gmail_id, thread_id, subject, from_email, to_email,
                            email_date, snippet, labels, is_unread, ai_analysis,
                            business_relevance, priority_level, key_topics, sentiment
                        ) VALUES (%s, %s, %s, %s, %s, NOW(), %s, %s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (gmail_id) DO UPDATE SET
                            ai_analysis = EXCLUDED.ai_analysis,
                            business_relevance = EXCLUDED.business_relevance,
                            priority_level = EXCLUDED.priority_level,
                            key_topics = EXCLUDED.key_topics,
                            sentiment = EXCLUDED.sentiment
                    """, (
                        email_data['gmail_id'],
                        email_data['thread_id'],
                        email_data['subject'],
                        email_data['from_email'],
                        email_data['to_email'],
                        email_data['snippet'],
                        email_data['labels'],
                        email_data['is_unread'],
                        ai_analysis,
                        business_relevance,
                        priority_level,
                        key_topics,
                        sentiment
                    ))
                    
                    email_count += 1
                    if email_count % 10 == 0:
                        print(f"      💾 Processed {email_count} emails with GPU analysis...")
                        conn.commit()
                        
                except Exception as e:
                    print(f"      ⚠️ Error processing email: {e}")
                    continue
            
            conn.commit()
            cursor.close()
            conn.close()
            
            print(f"✅ Synced {email_count} emails with GPU analysis")
            return email_count
            
        except Exception as e:
            print(f"❌ GPU email sync failed: {e}")
            return 0

async def main():
    print("🚀 GPU-POWERED GOOGLE WORKSPACE SYNC")
    print("=" * 50)
    print("🔥 Using local Ollama + GPU acceleration")
    print(f"📧 Processing emails with AI analysis")
    print()
    
    syncer = GPUGoogleSync()
    
    # Test Ollama connection
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{OLLAMA_URL}/api/tags") as response:
                if response.status == 200:
                    models = await response.json()
                    print(f"✅ Ollama connected - {len(models.get('models', []))} models available")
                else:
                    print("❌ Ollama not responding")
                    return
    except Exception as e:
        print(f"❌ Cannot connect to Ollama: {e}")
        return
    
    # Run GPU-powered sync
    emails = await syncer.sync_emails_gpu()
    
    print("\n" + "=" * 50)
    print("📊 GPU SYNC SUMMARY:")
    print(f"   📧 Emails analyzed: {emails}")
    print(f"   🤖 AI processing: Ollama + Local GPU")
    print(f"   💰 Business intelligence extracted!")
    print("\n✅ GPU-powered sync complete!")
    print("🚀 Data → AI Analysis → Insights → Money → Robbie's Body!")

if __name__ == "__main__":
    asyncio.run(main())

