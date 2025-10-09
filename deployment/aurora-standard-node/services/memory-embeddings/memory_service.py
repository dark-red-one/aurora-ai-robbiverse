#!/usr/bin/env python3
"""
Memory & Embeddings Service
Manages sticky notes, long-term memory, and vector search
"""

import os
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
import redis
import numpy as np
from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import faiss

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(title="Memory & Embeddings Service")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "postgres")
POSTGRES_PORT = int(os.getenv("POSTGRES_PORT", "5432"))
POSTGRES_DB = os.getenv("POSTGRES_DB", "aurora_unified")
POSTGRES_USER = os.getenv("POSTGRES_USER", "aurora_app")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "")

REDIS_HOST = os.getenv("REDIS_HOST", "redis")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", "")

# Embedding model
embedding_model = None
faiss_index = None

# Redis client
redis_client = redis.Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    password=REDIS_PASSWORD if REDIS_PASSWORD else None,
    decode_responses=True
)


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


class StickyNoteCreate(BaseModel):
    title: str
    content: str
    category: str
    author: str = "Allan"
    is_locked: bool = False
    priority: str = "medium"
    tags: Optional[List[str]] = []


class StickyNoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    is_locked: Optional[bool] = None
    tags: Optional[List[str]] = None


class SemanticSearchRequest(BaseModel):
    query: str
    limit: int = 10
    threshold: float = 0.7


@app.on_event("startup")
async def startup_event():
    """Initialize embeddings model and FAISS index"""
    global embedding_model, faiss_index
    
    logger.info("🧠 Starting Memory & Embeddings Service...")
    
    # Load sentence transformer model
    logger.info("Loading embedding model...")
    embedding_model = SentenceTransformer('all-MiniLM-L6-v2')  # Fast, lightweight
    logger.info("✅ Embedding model loaded")
    
    # Initialize FAISS index
    await rebuild_faiss_index()
    
    logger.info("✅ Memory service ready")


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "memory-embeddings"}


# ==================== STICKY NOTES CRUD ====================

@app.post("/api/sticky-notes")
async def create_sticky_note(note: StickyNoteCreate):
    """Create a new sticky note"""
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO sticky_notes (
                        title, content, category, author, is_locked, priority, tags
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    RETURNING id, created_at
                """, (
                    note.title,
                    note.content,
                    note.category,
                    note.author,
                    note.is_locked,
                    note.priority,
                    json.dumps(note.tags)
                ))
                
                result = cur.fetchone()
                conn.commit()
                
                # Generate embedding for semantic search
                await add_to_embeddings(result['id'], note.title, note.content)
                
                # Publish event
                redis_client.publish("aurora:sticky:created", json.dumps({
                    "id": str(result['id']),
                    "title": note.title,
                    "author": note.author
                }))
                
                return {
                    "success": True,
                    "id": str(result['id']),
                    "created_at": result['created_at'].isoformat()
                }
                
        finally:
            conn.close()
            
    except Exception as e:
        logger.error(f"Error creating sticky note: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/sticky-notes")
async def get_sticky_notes(
    category: Optional[str] = None,
    author: Optional[str] = None,
    limit: int = 100
):
    """Get sticky notes with optional filters"""
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                query = "SELECT * FROM sticky_notes WHERE 1=1"
                params = []
                
                if category:
                    query += " AND category = %s"
                    params.append(category)
                
                if author:
                    query += " AND author = %s"
                    params.append(author)
                
                query += " ORDER BY created_at DESC LIMIT %s"
                params.append(limit)
                
                cur.execute(query, params)
                notes = cur.fetchall()
                
                return {
                    "sticky_notes": [
                        {
                            **dict(note),
                            "id": str(note['id']),
                            "created_at": note['created_at'].isoformat() if note['created_at'] else None,
                            "updated_at": note['updated_at'].isoformat() if note['updated_at'] else None
                        }
                        for note in notes
                    ],
                    "total": len(notes)
                }
                
        finally:
            conn.close()
            
    except Exception as e:
        logger.error(f"Error fetching sticky notes: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/sticky-notes/{note_id}")
async def update_sticky_note(note_id: str, update: StickyNoteUpdate):
    """Update a sticky note"""
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                # Build dynamic update query
                updates = []
                params = []
                
                if update.title is not None:
                    updates.append("title = %s")
                    params.append(update.title)
                
                if update.content is not None:
                    updates.append("content = %s")
                    params.append(update.content)
                
                if update.category is not None:
                    updates.append("category = %s")
                    params.append(update.category)
                
                if update.priority is not None:
                    updates.append("priority = %s")
                    params.append(update.priority)
                
                if update.is_locked is not None:
                    updates.append("is_locked = %s")
                    params.append(update.is_locked)
                
                if update.tags is not None:
                    updates.append("tags = %s")
                    params.append(json.dumps(update.tags))
                
                if not updates:
                    raise HTTPException(status_code=400, detail="No updates provided")
                
                params.append(note_id)
                
                cur.execute(f"""
                    UPDATE sticky_notes 
                    SET {', '.join(updates)}
                    WHERE id = %s
                    RETURNING id, title, content
                """, params)
                
                result = cur.fetchone()
                
                if not result:
                    raise HTTPException(status_code=404, detail="Note not found")
                
                conn.commit()
                
                # Update embeddings if content changed
                if update.title or update.content:
                    await update_embeddings(result['id'], result['title'], result['content'])
                
                return {"success": True, "id": str(result['id'])}
                
        finally:
            conn.close()
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating sticky note: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/sticky-notes/{note_id}")
async def delete_sticky_note(note_id: str):
    """Delete a sticky note"""
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM sticky_notes WHERE id = %s RETURNING id", (note_id,))
                result = cur.fetchone()
                
                if not result:
                    raise HTTPException(status_code=404, detail="Note not found")
                
                conn.commit()
                
                # Remove from embeddings
                await remove_from_embeddings(note_id)
                
                return {"success": True, "id": str(result['id'])}
                
        finally:
            conn.close()
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting sticky note: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== SEMANTIC SEARCH ====================

@app.post("/api/search/semantic")
async def semantic_search(request: SemanticSearchRequest):
    """Semantic search across sticky notes and conversations"""
    try:
        # Generate query embedding
        query_embedding = embedding_model.encode([request.query])[0]
        
        # Search FAISS index
        if faiss_index and faiss_index.ntotal > 0:
            D, I = faiss_index.search(np.array([query_embedding]), request.limit * 2)
            
            # Get IDs and scores
            results = []
            for i, (distance, idx) in enumerate(zip(D[0], I[0])):
                if idx == -1:
                    continue
                
                similarity = 1 / (1 + distance)  # Convert distance to similarity
                
                if similarity >= request.threshold:
                    results.append({
                        "idx": int(idx),
                        "similarity": float(similarity)
                    })
            
            # Fetch actual content from database
            conn = get_db_connection()
            try:
                with conn.cursor() as cur:
                    # Get sticky notes
                    cur.execute("""
                        SELECT id, title, content, category, author, created_at
                        FROM sticky_notes
                        ORDER BY created_at DESC
                        LIMIT %s
                    """, (request.limit * 2,))
                    
                    all_notes = list(cur.fetchall())
                    
                    # Match with results
                    matched_results = []
                    for result in results[:request.limit]:
                        if result['idx'] < len(all_notes):
                            note = all_notes[result['idx']]
                            matched_results.append({
                                **dict(note),
                                "id": str(note['id']),
                                "similarity": result['similarity'],
                                "created_at": note['created_at'].isoformat() if note['created_at'] else None
                            })
                    
                    return {
                        "results": matched_results,
                        "total": len(matched_results),
                        "query": request.query
                    }
                    
            finally:
                conn.close()
        else:
            return {"results": [], "total": 0, "query": request.query}
            
    except Exception as e:
        logger.error(f"Semantic search error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


async def add_to_embeddings(note_id: str, title: str, content: str):
    """Add note to embeddings index via queue"""
    try:
        # Combine title and content
        text = f"{title}\n{content}"
        
        # Queue embedding task
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "http://embedding-queue:8013/api/embedding/queue",
                json={
                    "id": f"note_{note_id}_{datetime.now().timestamp()}",
                    "content_type": "sticky_note",
                    "content_id": str(note_id),
                    "content": text,
                    "priority": "normal",
                    "status": "pending",
                    "created_at": datetime.now().isoformat(),
                    "updated_at": datetime.now().isoformat(),
                    "retry_count": 0,
                    "max_retries": 3,
                    "metadata": {}
                },
                timeout=10.0
            )
            
            if response.status_code == 200:
                logger.info(f"✅ Queued embedding for note {note_id}")
            else:
                logger.warning(f"⚠️ Failed to queue embedding for note {note_id}: {response.status_code}")
                # Fallback to direct embedding
                await add_to_embeddings_direct(note_id, title, content)
        
    except Exception as e:
        logger.error(f"Error queuing embedding: {e}")
        # Fallback to direct embedding
        await add_to_embeddings_direct(note_id, title, content)


async def add_to_embeddings_direct(note_id: str, title: str, content: str):
    """Direct embedding generation (fallback)"""
    try:
        # Combine title and content
        text = f"{title}\n{content}"
        
        # Generate embedding
        embedding = embedding_model.encode([text])[0]
        
        # Store in Redis for quick rebuilds
        redis_client.hset(
            "aurora:embeddings:sticky_notes",
            str(note_id),
            json.dumps({
                "embedding": embedding.tolist(),
                "text": text,
                "created_at": datetime.now().isoformat()
            })
        )
        
        # Rebuild FAISS index
        await rebuild_faiss_index()
        
    except Exception as e:
        logger.error(f"Error in direct embedding: {e}")


async def update_embeddings(note_id: str, title: str, content: str):
    """Update embeddings for a note via queue"""
    try:
        # Combine title and content
        text = f"{title}\n{content}"
        
        # Queue re-embedding task
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "http://embedding-queue:8013/api/embedding/reembed",
                params={
                    "content_type": "sticky_note",
                    "content_id": str(note_id),
                    "new_content": text,
                    "priority": "normal"
                },
                timeout=10.0
            )
            
            if response.status_code == 200:
                logger.info(f"✅ Queued re-embedding for note {note_id}")
            else:
                logger.warning(f"⚠️ Failed to queue re-embedding for note {note_id}: {response.status_code}")
                # Fallback to direct embedding
                await add_to_embeddings_direct(note_id, title, content)
        
    except Exception as e:
        logger.error(f"Error queuing re-embedding: {e}")
        # Fallback to direct embedding
        await add_to_embeddings_direct(note_id, title, content)


async def enhance_note_with_similar_content(note_id: str, new_content: str) -> List[Dict]:
    """Enhance a note by finding similar existing notes and suggesting improvements"""
    try:
        # Generate embedding for new content
        new_embedding = embedding_model.encode(new_content)

        # Find similar notes
        similar_notes = await search_similar_notes(new_content, limit=5, threshold=0.7)

        # Filter out the current note itself
        similar_notes = [note for note in similar_notes if note["id"] != note_id]

        if not similar_notes:
            return []

        # Generate enhancement suggestions
        enhancements = []
        for similar_note in similar_notes:
            enhancement = await generate_note_enhancement(new_content, similar_note)
            if enhancement:
                enhancements.append({
                    "similar_note_id": similar_note["id"],
                    "similar_note_title": similar_note["title"],
                    "enhancement": enhancement,
                    "confidence": 0.8  # Could be calculated based on similarity
                })

        return enhancements

    except Exception as e:
        logger.error(f"❌ Error enhancing note: {e}")
        return []


async def gather_intelligence_from_conversation(conversation_id: str, message_content: str) -> List[Dict]:
    """Extract interesting facts from conversation and enhance related notes"""
    try:
        # Check if content contains interesting patterns
        interesting_facts = await extract_interesting_facts(message_content)

        if not interesting_facts:
            return []

        # For each interesting fact, find or create related notes
        enhancements = []
        for fact in interesting_facts:
            # Find similar existing notes
            similar_notes = await search_similar_notes(fact["content"], limit=3, threshold=0.6)

            if similar_notes:
                # Enhance existing note
                note_id = similar_notes[0]["id"]
                note_enhancements = await enhance_note_with_similar_content(note_id, fact["content"])
                enhancements.extend([{
                    "type": "enhancement",
                    "note_id": note_id,
                    "fact": fact,
                    "enhancements": note_enhancements
                }])
            else:
                # Create new note
                new_note = await create_note_from_fact(fact, conversation_id)
                if new_note:
                    enhancements.append({
                        "type": "new_note",
                        "note_id": new_note["id"],
                        "fact": fact
                    })

        return enhancements

    except Exception as e:
        logger.error(f"❌ Error gathering intelligence: {e}")
        return []


async def extract_interesting_facts(content: str) -> List[Dict]:
    """Extract potentially interesting facts from content"""
    facts = []

    # Simple keyword-based extraction (could be enhanced with NLP)
    interesting_keywords = [
        "deal", "opportunity", "revenue", "pricing", "client", "prospect",
        "meeting", "deadline", "launch", "product", "feature", "bug",
        "feedback", "complaint", "praise", "idea", "insight", "strategy"
    ]

    content_lower = content.lower()

    for keyword in interesting_keywords:
        if keyword in content_lower:
            # Extract sentences containing the keyword
            sentences = content.split('.')
            relevant_sentences = [s.strip() for s in sentences if keyword in s.lower()]

            for sentence in relevant_sentences:
                if len(sentence) > 20:  # Filter very short sentences
                    facts.append({
                        "content": sentence,
                        "keyword": keyword,
                        "importance": "medium",  # Could be calculated
                        "category": "extracted_fact"
                    })

    return facts


async def create_note_from_fact(fact: Dict, conversation_id: str) -> Optional[Dict]:
    """Create a new note from an interesting fact"""
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                # Generate a title from the fact
                title = fact["content"][:50] + "..." if len(fact["content"]) > 50 else fact["content"]

                cur.execute("""
                    INSERT INTO sticky_notes (title, content, category, author, priority)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING *
                """, (
                    title,
                    fact["content"],
                    "intel",  # Intelligence category
                    "allan",
                    "medium"
                ))

                new_note = cur.fetchone()
                conn.commit()

                # Add to embeddings
                await add_to_embeddings(str(new_note["id"]), title, fact["content"])

                return dict(new_note)

        finally:
            conn.close()

    except Exception as e:
        logger.error(f"❌ Error creating note from fact: {e}")
        return None


async def generate_note_enhancement(new_content: str, similar_note: Dict) -> Optional[str]:
    """Generate enhancement suggestion for a note"""
    try:
        # Simple enhancement logic (could use LLM for better suggestions)
        if len(new_content) > len(similar_note["content"]):
            return f"Consider adding: {new_content[:100]}..."
        elif new_content.lower() not in similar_note["content"].lower():
            return f"Could expand on: {new_content[:100]}..."
        else:
            return None

    except Exception as e:
        logger.error(f"❌ Error generating enhancement: {e}")
        return None


async def remove_from_embeddings(note_id: str):
    """Remove note from embeddings"""
    try:
        redis_client.hdel("aurora:embeddings:sticky_notes", str(note_id))
        await rebuild_faiss_index()
    except Exception as e:
        logger.error(f"Error removing from embeddings: {e}")


async def rebuild_faiss_index():
    """Rebuild FAISS index from Redis"""
    global faiss_index
    
    try:
        # Get all embeddings from Redis
        embeddings_data = redis_client.hgetall("aurora:embeddings:sticky_notes")
        
        if not embeddings_data:
            logger.info("No embeddings to index yet")
            faiss_index = faiss.IndexFlatL2(384)  # 384 dimensions for MiniLM
            return
        
        # Extract embeddings
        embeddings = []
        for data in embeddings_data.values():
            parsed = json.loads(data)
            embeddings.append(parsed["embedding"])
        
        embeddings_array = np.array(embeddings, dtype='float32')
        
        # Create FAISS index
        dimension = embeddings_array.shape[1]
        faiss_index = faiss.IndexFlatL2(dimension)
        faiss_index.add(embeddings_array)
        
        logger.info(f"✅ FAISS index rebuilt with {len(embeddings)} vectors")
        
    except Exception as e:
        logger.error(f"Error rebuilding FAISS index: {e}")


@app.post("/api/memory/gather-intelligence")
async def gather_intelligence_endpoint(request: Dict):
    """API endpoint for gathering intelligence from conversations"""
    conversation_id = request.get("conversation_id")
    message_content = request.get("message_content")

    if not conversation_id or not message_content:
        raise HTTPException(status_code=400, detail="conversation_id and message_content required")

    # Gather intelligence and enhance notes
    intelligence_results = await gather_intelligence_from_conversation(conversation_id, message_content)

    return {
        "intelligence_gathered": len(intelligence_results),
        "results": intelligence_results
    }


@app.post("/api/memory/enhance-note")
async def enhance_note_endpoint(request: Dict):
    """API endpoint for enhancing notes with new content"""
    note_id = request.get("note_id")
    new_content = request.get("new_content")

    if not note_id or not new_content:
        raise HTTPException(status_code=400, detail="note_id and new_content required")

    # Enhance the note with similar content
    enhancements = await enhance_note_with_similar_content(note_id, new_content)

    return {
        "enhancements_found": len(enhancements),
        "enhancements": enhancements
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8005)
