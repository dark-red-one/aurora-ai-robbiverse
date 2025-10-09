#!/usr/bin/env python3
"""
Fact Extractor Service - SQL-Based Intelligence Gathering
Scans database using SQL queries to extract interesting facts and enhance notes
"""

import os
import json
import logging
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
import psycopg2
from psycopg2.extras import RealDictCursor
import redis
import httpx
import numpy as np
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sentence_transformers import SentenceTransformer
import faiss

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
fastapi_app = FastAPI(title="Fact Extractor Service - SQL-Based Intelligence")

# Configuration
NODE_NAME = os.getenv("NODE_NAME", "unknown")
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "postgres")
POSTGRES_PORT = int(os.getenv("POSTGRES_PORT", "5432"))
POSTGRES_DB = os.getenv("POSTGRES_DB", "aurora_unified")
POSTGRES_USER = os.getenv("POSTGRES_USER", "aurora_app")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "")

REDIS_HOST = os.getenv("REDIS_HOST", "redis")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", "")

MEMORY_SERVICE_URL = os.getenv("MEMORY_SERVICE_URL", "http://memory-embeddings:8005")
PRIORITY_ENGINE_URL = os.getenv("PRIORITY_ENGINE_URL", "http://priority-surface:8002")

# Redis client
redis_client = redis.Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    password=REDIS_PASSWORD if REDIS_PASSWORD else None,
    decode_responses=True
)

# Initialize embedding model
embedding_model = None
faiss_index = None
note_embeddings = {}

def get_db_connection():
    """Get PostgreSQL connection"""
    return psycopg2.connect(
        host=POSTGRES_HOST,
        port=POSTGRES_PORT,
        database=POSTGRES_DB,
        user=POSTGRES_USER,
        password=POSTGRES_PASSWORD,
        cursor_factory=RealDictCursor
    )


class ExtractedFact(BaseModel):
    content: str
    source_type: str  # email, conversation, sticky_note, task, deal, etc.
    source_id: str
    importance: str  # high, medium, low
    category: str  # deal, opportunity, deadline, meeting, feedback, etc.
    keywords: List[str]
    created_at: datetime


class FactEnhancement(BaseModel):
    fact_id: str
    note_id: str
    enhancement_type: str  # enhance_existing, create_new
    confidence: float
    reasoning: str


@fastapi_app.on_event("startup")
async def startup_event():
    """Initialize fact extractor"""
    logger.info(f"🔍 Starting Fact Extractor on {NODE_NAME}...")

    global embedding_model
    try:
        # Initialize embedding model
        embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        logger.info("✅ Embedding model loaded")

        # Initialize FAISS index for similarity search
        await initialize_similarity_index()

    except Exception as e:
        logger.error(f"❌ Failed to initialize embedding model: {e}")

    # Start fact extraction scheduler
    scheduler = AsyncIOScheduler()

    # Run fact extraction every hour
    scheduler.add_job(extract_facts_from_database, 'interval', hours=1)

    scheduler.start()

    logger.info("✅ Fact Extractor ready - scanning database hourly")


@fastapi_app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "fact-extractor", "node": NODE_NAME}


@fastapi_app.post("/api/facts/extract")
async def extract_facts_endpoint(background_tasks: BackgroundTasks):
    """Trigger fact extraction from database"""
    background_tasks.add_task(extract_facts_from_database)
    return {"status": "extraction_started"}


@fastapi_app.get("/api/facts/recent")
async def get_recent_facts(limit: int = 50):
    """Get recently extracted facts"""
    try:
        # For now, return mock data - in production this would query a facts table
        facts = [
            {
                "content": "New deal opportunity with Acme Corp for $120k",
                "source_type": "email",
                "source_id": "email_123",
                "importance": "high",
                "category": "opportunity",
                "keywords": ["deal", "opportunity", "revenue"],
                "created_at": datetime.utcnow().isoformat()
            }
        ]

        return {"facts": facts}

    except Exception as e:
        logger.error(f"❌ Error getting recent facts: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/facts/process")
async def process_fact_endpoint(request: Dict):
    """Process a single fact and enhance/create notes"""
    fact = request.get("fact")
    email_id = request.get("email_id")

    if not fact:
        raise HTTPException(status_code=400, detail="fact required")

    # Process the fact
    enhancements = await process_single_fact(fact, email_id)

    return {
        "processed": True,
        "enhancements": enhancements
    }


@app.post("/api/execute")
async def execute_mcp_request(request: Dict):
    """MCP protocol endpoint for fact extraction"""
    request_id = request.get("request_id")
    capability = request.get("capability")
    payload = request.get("payload", {})
    context = request.get("context", {})

    if capability != "fact_extraction":
        raise HTTPException(status_code=400, detail=f"Unsupported capability: {capability}")

    # Extract facts from the provided content
    content = payload.get("content", "")
    source_type = payload.get("source_type", "unknown")

    if not content:
        raise HTTPException(status_code=400, detail="content required for fact extraction")

    # Extract facts from the content
    facts = await extract_facts_from_text(content, source_type, "unknown")

    # Process the facts
    enhancements = []
    for fact in facts:
        fact_dict = {
            "content": fact.content,
            "category": fact.category,
            "source_type": fact.source_type,
            "source_id": fact.source_id,
            "importance": fact.importance
        }
        fact_enhancements = await process_single_fact(fact_dict)
        enhancements.extend(fact_enhancements)

    return {
        "result": {
            "extracted_facts": [
                {
                    "content": fact.content,
                    "category": fact.category,
                    "importance": fact.importance,
                    "source_type": fact.source_type
                }
                for fact in facts
            ],
            "enhancements": enhancements
        }
    }


async def process_single_fact(fact: Dict, email_id: Optional[str] = None) -> List[Dict]:
    """Process a single fact and return enhancements"""
    enhancements = []

    try:
        # Find similar existing notes
        similar_notes = await find_similar_notes(fact["content"])

        if similar_notes:
            # Enhance existing note
            note_id = similar_notes[0]["id"]
            enhancement = await enhance_existing_note(note_id, fact)
            if enhancement:
                enhancements.append(enhancement)
        else:
            # Create new intelligence note
            new_note = await create_intelligence_note(fact)
            if new_note:
                enhancements.append({
                    "type": "new_note",
                    "note_id": new_note["id"],
                    "fact": fact
                })

        # Also create a task if it's an important fact
        if fact.get("importance") == "high":
            await create_task_from_fact(fact, email_id)

    except Exception as e:
        logger.error(f"❌ Error processing single fact: {e}")

    return enhancements


async def create_task_from_fact(fact: Dict, email_id: Optional[str] = None):
    """Create a task from an important fact"""
    try:
        # Determine task priority based on fact category
        priority_map = {
            "opportunity": "high",
            "deadline": "critical",
            "meeting": "medium",
            "feedback": "medium",
            "technical": "high"
        }

        priority = priority_map.get(fact.get("category", "general"), "medium")

        # Create task via priority engine
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{PRIORITY_ENGINE_URL}/api/priorities/task",
                json={
                    "title": f"Action: {fact['category'].title()} from {fact['source_type']}",
                    "description": fact["content"],
                    "category": fact["category"],
                    "priority": priority,
                    "urgency": 80 if priority in ["high", "critical"] else 60,
                    "importance": 75,
                    "effort": 30,
                    "context_relevance": 90,
                    "source_type": fact["source_type"],
                    "source_id": fact["source_id"],
                    "associated_people": [],
                    "associated_deals": [],
                    "associated_messages": [email_id] if email_id else [],
                    "metadata": {"fact_category": fact["category"]}
                },
                headers={"X-API-Key": os.getenv("API_KEY", "robbie-2025")},
                timeout=10.0
            )

    except Exception as e:
        logger.error(f"❌ Error creating task from fact: {e}")


async def extract_facts_from_database():
    """Extract facts from entire database using SQL queries"""
    logger.info("🔍 Starting comprehensive database fact extraction...")

    all_facts = []

    # Extract facts from different sources
    email_facts = await extract_facts_from_emails()
    conversation_facts = await extract_facts_from_conversations()
    sticky_note_facts = await extract_facts_from_sticky_notes()
    task_facts = await extract_facts_from_tasks()
    deal_facts = await extract_facts_from_deals()

    all_facts.extend(email_facts)
    all_facts.extend(conversation_facts)
    all_facts.extend(sticky_note_facts)
    all_facts.extend(task_facts)
    all_facts.extend(deal_facts)

    # Process and enhance facts
    processed_facts = await process_extracted_facts(all_facts)

    logger.info(f"✅ Extracted {len(processed_facts)} facts from database")


async def extract_facts_from_emails() -> List[ExtractedFact]:
    """Extract interesting facts from emails using SQL"""
    facts = []

    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                # Query recent emails for interesting content
                cur.execute("""
                    SELECT id, subject, content, sender_email, sent_at
                    FROM emails
                    WHERE sent_at > NOW() - INTERVAL '24 hours'
                    AND (LOWER(subject) LIKE '%deal%' OR LOWER(subject) LIKE '%opportunity%'
                         OR LOWER(subject) LIKE '%meeting%' OR LOWER(subject) LIKE '%deadline%'
                         OR LOWER(content) LIKE '%revenue%' OR LOWER(content) LIKE '%pricing%'
                         OR LOWER(content) LIKE '%client%' OR LOWER(content) LIKE '%prospect%')
                    ORDER BY sent_at DESC
                    LIMIT 100
                """)

                emails = cur.fetchall()

                for email in emails:
                    # Extract facts from email content
                    email_facts = await extract_facts_from_text(
                        email["content"] or "",
                        source_type="email",
                        source_id=str(email["id"]),
                        additional_context=f"Subject: {email['subject']} From: {email['sender_email']}"
                    )

                    facts.extend(email_facts)

        finally:
            conn.close()

    except Exception as e:
        logger.error(f"❌ Error extracting facts from emails: {e}")

    return facts


async def extract_facts_from_conversations() -> List[ExtractedFact]:
    """Extract interesting facts from conversations using SQL"""
    facts = []

    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                # Query recent conversation messages for interesting content
                cur.execute("""
                    SELECT m.id, m.content, m.role, m.created_at, c.user_id
                    FROM messages m
                    JOIN conversations c ON m.conversation_id = c.id
                    WHERE m.created_at > NOW() - INTERVAL '24 hours'
                    AND (LOWER(m.content) LIKE '%deal%' OR LOWER(m.content) LIKE '%opportunity%'
                         OR LOWER(m.content) LIKE '%revenue%' OR LOWER(m.content) LIKE '%meeting%'
                         OR LOWER(m.content) LIKE '%deadline%' OR LOWER(m.content) LIKE '%pricing%'
                         OR LOWER(m.content) LIKE '%client%' OR LOWER(m.content) LIKE '%feedback%')
                    ORDER BY m.created_at DESC
                    LIMIT 200
                """)

                messages = cur.fetchall()

                for msg in messages:
                    # Extract facts from message content
                    message_facts = await extract_facts_from_text(
                        msg["content"],
                        source_type="conversation",
                        source_id=str(msg["id"]),
                        additional_context=f"User: {msg['user_id']} Role: {msg['role']}"
                    )

                    facts.extend(message_facts)

        finally:
            conn.close()

    except Exception as e:
        logger.error(f"❌ Error extracting facts from conversations: {e}")

    return facts


async def extract_facts_from_sticky_notes() -> List[ExtractedFact]:
    """Extract interesting facts from sticky notes using SQL"""
    facts = []

    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                # Query sticky notes for interesting content
                cur.execute("""
                    SELECT id, title, content, category, author, created_at, updated_at
                    FROM sticky_notes
                    WHERE updated_at > NOW() - INTERVAL '7 days'
                    AND (LOWER(content) LIKE '%deal%' OR LOWER(content) LIKE '%opportunity%'
                         OR LOWER(content) LIKE '%revenue%' OR LOWER(content) LIKE '%meeting%'
                         OR LOWER(content) LIKE '%deadline%' OR LOWER(content) LIKE '%client%'
                         OR LOWER(content) LIKE '%insight%' OR LOWER(content) LIKE '%strategy%')
                    ORDER BY updated_at DESC
                    LIMIT 100
                """)

                notes = cur.fetchall()

                for note in notes:
                    # Extract facts from note content
                    note_facts = await extract_facts_from_text(
                        note["content"],
                        source_type="sticky_note",
                        source_id=str(note["id"]),
                        additional_context=f"Category: {note['category']} Author: {note['author']}"
                    )

                    facts.extend(note_facts)

        finally:
            conn.close()

    except Exception as e:
        logger.error(f"❌ Error extracting facts from sticky notes: {e}")

    return facts


async def extract_facts_from_tasks() -> List[ExtractedFact]:
    """Extract interesting facts from tasks using SQL"""
    facts = []

    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                # Query tasks for interesting content (if tasks table exists)
                try:
                    cur.execute("""
                        SELECT id, title, description, status, priority, created_at
                        FROM tasks
                        WHERE created_at > NOW() - INTERVAL '24 hours'
                        AND (LOWER(title) LIKE '%deal%' OR LOWER(title) LIKE '%opportunity%'
                             OR LOWER(description) LIKE '%revenue%' OR LOWER(description) LIKE '%meeting%'
                             OR LOWER(description) LIKE '%deadline%' OR LOWER(description) LIKE '%client%')
                        ORDER BY created_at DESC
                        LIMIT 50
                    """)

                    tasks = cur.fetchall()

                    for task in tasks:
                        # Extract facts from task content
                        task_facts = await extract_facts_from_text(
                            f"{task['title']} {task['description'] or ''}",
                            source_type="task",
                            source_id=str(task["id"]),
                            additional_context=f"Status: {task['status']} Priority: {task['priority']}"
                        )

                        facts.extend(task_facts)

                except psycopg2.errors.UndefinedTable:
                    # Tasks table doesn't exist yet
                    logger.info("ℹ️ Tasks table not found - skipping task extraction")

        finally:
            conn.close()

    except Exception as e:
        logger.error(f"❌ Error extracting facts from tasks: {e}")

    return facts


async def extract_facts_from_deals() -> List[ExtractedFact]:
    """Extract interesting facts from deals using SQL"""
    facts = []

    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                # Query deals for interesting content (if deals table exists)
                try:
                    cur.execute("""
                        SELECT id, name, amount, stage, close_date, created_at, updated_at
                        FROM deals
                        WHERE updated_at > NOW() - INTERVAL '7 days'
                        ORDER BY updated_at DESC
                        LIMIT 50
                    """)

                    deals = cur.fetchall()

                    for deal in deals:
                        # Extract facts from deal information
                        deal_content = f"Deal: {deal['name']} Amount: {deal['amount']} Stage: {deal['stage']}"
                        if deal['close_date']:
                            deal_content += f" Close Date: {deal['close_date']}"

                        deal_facts = await extract_facts_from_text(
                            deal_content,
                            source_type="deal",
                            source_id=str(deal["id"]),
                            additional_context=f"Stage: {deal['stage']} Amount: {deal['amount']}"
                        )

                        facts.extend(deal_facts)

                except psycopg2.errors.UndefinedTable:
                    # Deals table doesn't exist yet
                    logger.info("ℹ️ Deals table not found - skipping deal extraction")

        finally:
            conn.close()

    except Exception as e:
        logger.error(f"❌ Error extracting facts from deals: {e}")

    return facts


async def extract_facts_from_text(content: str, source_type: str, source_id: str, additional_context: str = "") -> List[ExtractedFact]:
    """Extract facts from text content using keyword analysis"""
    facts = []

    if not content or len(content.strip()) < 20:
        return facts

    # Define interesting fact patterns and keywords
    fact_patterns = {
        "opportunity": {
            "keywords": ["opportunity", "deal", "revenue", "contract", "sale", "business"],
            "importance": "high",
            "category": "opportunity"
        },
        "deadline": {
            "keywords": ["deadline", "due", "urgent", "asap", "emergency", "critical"],
            "importance": "high",
            "category": "deadline"
        },
        "meeting": {
            "keywords": ["meeting", "call", "discussion", "review", "sync", "standup"],
            "importance": "medium",
            "category": "meeting"
        },
        "feedback": {
            "keywords": ["feedback", "review", "comment", "suggestion", "improvement"],
            "importance": "medium",
            "category": "feedback"
        },
        "technical": {
            "keywords": ["bug", "issue", "problem", "error", "fix", "solution"],
            "importance": "medium",
            "category": "technical"
        },
        "strategy": {
            "keywords": ["strategy", "plan", "approach", "methodology", "framework"],
            "importance": "medium",
            "category": "strategy"
        }
    }

    content_lower = content.lower()
    full_content = f"{content} {additional_context}".lower()

    for pattern_name, pattern_config in fact_patterns.items():
        # Check if any keywords are present
        matching_keywords = [kw for kw in pattern_config["keywords"] if kw in content_lower]

        if matching_keywords:
            # Extract relevant sentences
            sentences = content.split('.')
            relevant_sentences = []

            for sentence in sentences:
                sentence_lower = sentence.lower()
                if any(kw in sentence_lower for kw in pattern_config["keywords"]):
                    if len(sentence.strip()) > 20:  # Filter very short sentences
                        relevant_sentences.append(sentence.strip())

            for sentence in relevant_sentences:
                facts.append(ExtractedFact(
                    content=sentence,
                    source_type=source_type,
                    source_id=source_id,
                    importance=pattern_config["importance"],
                    category=pattern_config["category"],
                    keywords=matching_keywords,
                    created_at=datetime.utcnow()
                ))

    return facts


async def process_extracted_facts(facts: List[ExtractedFact]) -> List[FactEnhancement]:
    """Process extracted facts and enhance existing notes or create new ones"""
    enhancements = []

    for fact in facts:
        # Find similar existing notes using vector similarity
        similar_notes = await find_similar_notes(fact.content)

        if similar_notes:
            # Enhance existing note
            note_id = similar_notes[0]["id"]
            enhancement = await enhance_existing_note(note_id, fact)
            if enhancement:
                enhancements.append(enhancement)
        else:
            # Create new intelligence note
            new_note = await create_intelligence_note(fact)
            if new_note:
                enhancements.append(FactEnhancement(
                    fact_id=f"fact_{fact.source_type}_{fact.source_id}",
                    note_id=new_note["id"],
                    enhancement_type="create_new",
                    confidence=0.8,
                    reasoning=f"New fact extracted from {fact.source_type}: {fact.category}"
                ))

    return enhancements


async def find_similar_notes(content: str, threshold: float = 0.7) -> List[Dict]:
    """Find similar notes using vector similarity"""
    try:
        if not embedding_model:
            return []

        # Generate embedding for the content
        query_embedding = embedding_model.encode(content)

        # Search in FAISS index
        if faiss_index is not None:
            query_embedding = np.array([query_embedding], dtype=np.float32)
            D, I = faiss_index.search(query_embedding, k=5)

            similar_notes = []
            for i, (distance, idx) in enumerate(zip(D[0], I[0])):
                if idx != -1 and distance < (1 - threshold):  # Convert threshold to distance
                    note_id = list(note_embeddings.keys())[idx]
                    note_data = note_embeddings[note_id]

                    similar_notes.append({
                        "id": note_id,
                        "title": note_data.get("title", ""),
                        "content": note_data.get("content", ""),
                        "similarity": 1 - distance  # Convert back to similarity
                    })

            return similar_notes

        return []

    except Exception as e:
        logger.error(f"❌ Error finding similar notes: {e}")
        return []


async def enhance_existing_note(note_id: str, fact: ExtractedFact) -> Optional[FactEnhancement]:
    """Enhance an existing note with new fact"""
    try:
        # Call memory service to enhance note
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{MEMORY_SERVICE_URL}/api/memory/enhance-note",
                json={
                    "note_id": note_id,
                    "new_content": fact.content
                },
                headers={"X-API-Key": os.getenv("API_KEY", "robbie-2025")},
                timeout=10.0
            )

            if response.status_code == 200:
                result = response.json()
                if result.get("enhancements_found", 0) > 0:
                    return FactEnhancement(
                        fact_id=f"fact_{fact.source_type}_{fact.source_id}",
                        note_id=note_id,
                        enhancement_type="enhance_existing",
                        confidence=result.get("enhancements", [{}])[0].get("confidence", 0.8),
                        reasoning=f"Enhanced note with {fact.category} fact from {fact.source_type}"
                    )

    except Exception as e:
        logger.error(f"❌ Error enhancing note {note_id}: {e}")

    return None


async def create_intelligence_note(fact: ExtractedFact) -> Optional[Dict]:
    """Create a new intelligence note from a fact"""
    try:
        # Call memory service to create note
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{MEMORY_SERVICE_URL}/api/sticky-notes",
                json={
                    "title": f"Intelligence: {fact.category.title()}",
                    "content": fact.content,
                    "category": "intel",
                    "author": "allan",
                    "priority": "medium"
                },
                headers={"X-API-Key": os.getenv("API_KEY", "robbie-2025")},
                timeout=10.0
            )

            if response.status_code == 200:
                return response.json()

    except Exception as e:
        logger.error(f"❌ Error creating intelligence note: {e}")

    return None


async def initialize_similarity_index():
    """Initialize FAISS index for similarity search"""
    global faiss_index, note_embeddings

    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                # Get all sticky notes for indexing
                cur.execute("""
                    SELECT id, title, content
                    FROM sticky_notes
                    WHERE content IS NOT NULL AND LENGTH(content) > 50
                    ORDER BY updated_at DESC
                    LIMIT 1000
                """)

                notes = cur.fetchall()

                if not notes:
                    logger.info("ℹ️ No notes found for similarity indexing")
                    return

                # Generate embeddings for all notes
                note_texts = [f"{note['title']} {note['content']}" for note in notes]
                embeddings = embedding_model.encode(note_texts)

                # Create FAISS index
                dimension = embeddings.shape[1]
                faiss_index = faiss.IndexFlatL2(dimension)
                faiss_index.add(embeddings)

                # Store note data for retrieval
                for i, note in enumerate(notes):
                    note_embeddings[str(note['id'])] = {
                        "title": note['title'],
                        "content": note['content'],
                        "embedding": embeddings[i]
                    }

                logger.info(f"✅ Initialized similarity index with {len(notes)} notes")

        finally:
            conn.close()

    except Exception as e:
        logger.error(f"❌ Error initializing similarity index: {e}")


async def run_hourly_fact_extraction():
    """Background task for hourly fact extraction"""
    while True:
        try:
            await extract_facts_from_database()
            await asyncio.sleep(3600)  # Every hour

        except Exception as e:
            logger.error(f"❌ Fact extraction error: {e}")
            await asyncio.sleep(3600)  # Wait 1 hour before retry


async def main():
    """Main entry point"""
    # Start fact extraction in background
    extraction_task = asyncio.create_task(run_hourly_fact_extraction())

    # Start FastAPI server
    import uvicorn
    config = uvicorn.Config(fastapi_app, host="0.0.0.0", port=3009)
    server = uvicorn.Server(config)

    try:
        await server.serve()
    except KeyboardInterrupt:
        logger.info("🛑 Shutting down fact extractor...")
    finally:
        extraction_task.cancel()
        await server.shutdown()


if __name__ == "__main__":
    asyncio.run(main())
