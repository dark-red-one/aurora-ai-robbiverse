#!/usr/bin/env python3
"""
Embedding Queue Service
Manages embedding generation, re-embeddings, and batch processing
"""

import os
import json
import logging
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union
from enum import Enum
import httpx
import psycopg2
from psycopg2.extras import RealDictCursor
import redis
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import numpy as np
import faiss
from celery import Celery

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(title="Embedding Queue Service")

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

# Celery configuration
CELERY_BROKER_URL = f"redis://:{REDIS_PASSWORD}@{REDIS_HOST}:{REDIS_PORT}/0"
CELERY_RESULT_BACKEND = f"redis://:{REDIS_PASSWORD}@{REDIS_HOST}:{REDIS_PORT}/1"

# Initialize Celery
celery_app = Celery(
    "embedding_queue",
    broker=CELERY_BROKER_URL,
    backend=CELERY_RESULT_BACKEND
)

# Redis client
redis_client = redis.Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    password=REDIS_PASSWORD,
    decode_responses=True
)

# Database connection
def get_db_connection():
    return psycopg2.connect(
        host=POSTGRES_HOST,
        port=POSTGRES_PORT,
        database=POSTGRES_DB,
        user=POSTGRES_USER,
        password=POSTGRES_PASSWORD
    )

# Enums
class EmbeddingType(str, Enum):
    STICKY_NOTE = "sticky_note"
    CONVERSATION = "conversation"
    MESSAGE = "message"
    CALENDAR_EVENT = "calendar_event"
    TASK = "task"
    CONTACT = "contact"
    COMPANY = "company"
    POST = "post"
    EMAIL = "email"

class EmbeddingPriority(str, Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"

class EmbeddingStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

# Pydantic models
class EmbeddingTask(BaseModel):
    id: str
    content_type: EmbeddingType
    content_id: str
    content: str
    priority: EmbeddingPriority = EmbeddingPriority.NORMAL
    status: EmbeddingStatus = EmbeddingStatus.PENDING
    created_at: datetime
    updated_at: datetime
    retry_count: int = 0
    max_retries: int = 3
    metadata: Dict[str, Any] = {}

class EmbeddingResult(BaseModel):
    task_id: str
    content_id: str
    embedding: List[float]
    model_name: str
    created_at: datetime
    processing_time_ms: int

class BatchEmbeddingRequest(BaseModel):
    content_type: EmbeddingType
    content_items: List[Dict[str, Any]]  # [{"id": "123", "content": "text"}]
    priority: EmbeddingPriority = EmbeddingPriority.NORMAL
    force_reembed: bool = False

# Global variables
embedding_model = None
faiss_index = None
task_queue = []

# Initialize embedding model
async def initialize_embedding_model():
    """Initialize the embedding model"""
    global embedding_model
    try:
        logger.info("🧠 Loading embedding model...")
        embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        logger.info("✅ Embedding model loaded")
    except Exception as e:
        logger.error(f"❌ Failed to load embedding model: {e}")
        raise

# Celery tasks
@celery_app.task(bind=True, max_retries=3)
def generate_embedding_task(self, task_data: Dict[str, Any]):
    """Celery task to generate embeddings"""
    try:
        # Initialize model if not already done
        if not embedding_model:
            global embedding_model
            embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Generate embedding
        content = task_data["content"]
        embedding = embedding_model.encode([content])[0]
        
        # Store result
        result = {
            "task_id": task_data["id"],
            "content_id": task_data["content_id"],
            "embedding": embedding.tolist(),
            "model_name": "all-MiniLM-L6-v2",
            "created_at": datetime.now().isoformat(),
            "processing_time_ms": 0  # Would calculate actual time
        }
        
        # Store in Redis
        redis_client.hset(
            f"aurora:embeddings:{task_data['content_type']}",
            task_data["content_id"],
            json.dumps(result)
        )
        
        # Update task status
        redis_client.hset(
            "aurora:embedding_tasks",
            task_data["id"],
            json.dumps({
                **task_data,
                "status": "completed",
                "updated_at": datetime.now().isoformat()
            })
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Embedding generation failed: {e}")
        # Retry with exponential backoff
        raise self.retry(countdown=60 * (2 ** self.request.retries))

# Queue management
async def add_to_queue(task: EmbeddingTask) -> str:
    """Add task to embedding queue"""
    try:
        # Store task in Redis
        redis_client.hset(
            "aurora:embedding_tasks",
            task.id,
            json.dumps(task.dict())
        )
        
        # Add to priority queue
        priority_score = {
            EmbeddingPriority.URGENT: 1,
            EmbeddingPriority.HIGH: 2,
            EmbeddingPriority.NORMAL: 3,
            EmbeddingPriority.LOW: 4
        }[task.priority]
        
        redis_client.zadd(
            "aurora:embedding_queue",
            {task.id: priority_score}
        )
        
        # Trigger Celery task
        generate_embedding_task.delay(task.dict())
        
        logger.info(f"📝 Added embedding task {task.id} to queue")
        return task.id
        
    except Exception as e:
        logger.error(f"Failed to add task to queue: {e}")
        raise

async def get_queue_status() -> Dict[str, Any]:
    """Get current queue status"""
    try:
        # Get queue length
        queue_length = redis_client.zcard("aurora:embedding_queue")
        
        # Get task counts by status
        all_tasks = redis_client.hgetall("aurora:embedding_tasks")
        status_counts = {}
        
        for task_data in all_tasks.values():
            task = json.loads(task_data)
            status = task.get("status", "unknown")
            status_counts[status] = status_counts.get(status, 0) + 1
        
        # Get processing stats
        processing_stats = {
            "total_tasks": len(all_tasks),
            "queue_length": queue_length,
            "status_counts": status_counts,
            "active_workers": celery_app.control.inspect().active() or {},
            "completed_today": 0,  # Would calculate from completed tasks
            "failed_today": 0     # Would calculate from failed tasks
        }
        
        return processing_stats
        
    except Exception as e:
        logger.error(f"Failed to get queue status: {e}")
        return {"error": str(e)}

# Re-embedding logic
async def schedule_reembedding(content_type: EmbeddingType, content_id: str, new_content: str, priority: EmbeddingPriority = EmbeddingPriority.NORMAL):
    """Schedule re-embedding for updated content"""
    try:
        # Check if content actually changed
        existing_embedding = redis_client.hget(f"aurora:embeddings:{content_type}", content_id)
        if existing_embedding:
            existing_data = json.loads(existing_embedding)
            if existing_data.get("content") == new_content:
                logger.info(f"No content change for {content_id}, skipping re-embedding")
                return None
        
        # Create re-embedding task
        task = EmbeddingTask(
            id=f"reembed_{content_type}_{content_id}_{datetime.now().timestamp()}",
            content_type=content_type,
            content_id=content_id,
            content=new_content,
            priority=priority,
            metadata={"is_reembedding": True, "original_content_id": content_id}
        )
        
        # Add to queue
        task_id = await add_to_queue(task)
        
        logger.info(f"🔄 Scheduled re-embedding for {content_type}:{content_id}")
        return task_id
        
    except Exception as e:
        logger.error(f"Failed to schedule re-embedding: {e}")
        raise

async def batch_embedding(content_type: EmbeddingType, content_items: List[Dict[str, Any]], priority: EmbeddingPriority = EmbeddingPriority.NORMAL):
    """Schedule batch embedding for multiple items"""
    try:
        task_ids = []
        
        for item in content_items:
            task = EmbeddingTask(
                id=f"batch_{content_type}_{item['id']}_{datetime.now().timestamp()}",
                content_type=content_type,
                content_id=item["id"],
                content=item["content"],
                priority=priority,
                metadata={"is_batch": True, "batch_size": len(content_items)}
            )
            
            task_id = await add_to_queue(task)
            task_ids.append(task_id)
        
        logger.info(f"📦 Scheduled batch embedding for {len(content_items)} {content_type} items")
        return task_ids
        
    except Exception as e:
        logger.error(f"Failed to schedule batch embedding: {e}")
        raise

# API endpoints
@app.post("/api/embedding/queue")
async def queue_embedding_task(task: EmbeddingTask):
    """Queue a single embedding task"""
    try:
        task_id = await add_to_queue(task)
        return {"task_id": task_id, "status": "queued"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/embedding/batch")
async def queue_batch_embedding(request: BatchEmbeddingRequest):
    """Queue batch embedding tasks"""
    try:
        task_ids = await batch_embedding(
            request.content_type,
            request.content_items,
            request.priority
        )
        return {"task_ids": task_ids, "count": len(task_ids), "status": "queued"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/embedding/reembed")
async def queue_reembedding(
    content_type: EmbeddingType,
    content_id: str,
    new_content: str,
    priority: EmbeddingPriority = EmbeddingPriority.NORMAL
):
    """Queue re-embedding for updated content"""
    try:
        task_id = await schedule_reembedding(content_type, content_id, new_content, priority)
        if task_id:
            return {"task_id": task_id, "status": "queued"}
        else:
            return {"message": "No re-embedding needed", "status": "skipped"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/embedding/queue/status")
async def get_queue_status_endpoint():
    """Get embedding queue status"""
    try:
        status = await get_queue_status()
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/embedding/queue/tasks")
async def get_queue_tasks(
    status: Optional[EmbeddingStatus] = None,
    content_type: Optional[EmbeddingType] = None,
    limit: int = 100
):
    """Get tasks from the queue"""
    try:
        all_tasks = redis_client.hgetall("aurora:embedding_tasks")
        tasks = []
        
        for task_data in all_tasks.values():
            task = json.loads(task_data)
            
            # Filter by status
            if status and task.get("status") != status.value:
                continue
                
            # Filter by content type
            if content_type and task.get("content_type") != content_type.value:
                continue
            
            tasks.append(task)
            
            if len(tasks) >= limit:
                break
        
        # Sort by created_at
        tasks.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        
        return {"tasks": tasks, "count": len(tasks)}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/embedding/results/{content_type}/{content_id}")
async def get_embedding_result(content_type: EmbeddingType, content_id: str):
    """Get embedding result for specific content"""
    try:
        result = redis_client.hget(f"aurora:embeddings:{content_type}", content_id)
        if result:
            return json.loads(result)
        else:
            raise HTTPException(status_code=404, detail="Embedding not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/embedding/rebuild-index")
async def rebuild_embedding_index(content_type: EmbeddingType):
    """Rebuild FAISS index for a content type"""
    try:
        # Get all embeddings for this content type
        embeddings_data = redis_client.hgetall(f"aurora:embeddings:{content_type}")
        
        if not embeddings_data:
            return {"message": f"No embeddings found for {content_type}", "count": 0}
        
        # Extract embeddings
        embeddings = []
        for data in embeddings_data.values():
            parsed = json.loads(data)
            embeddings.append(parsed["embedding"])
        
        embeddings_array = np.array(embeddings, dtype='float32')
        
        # Create new FAISS index
        dimension = embeddings_array.shape[1]
        index = faiss.IndexFlatIP(dimension)  # Inner product for cosine similarity
        index.add(embeddings_array)
        
        # Store index in Redis
        redis_client.set(
            f"aurora:faiss_index:{content_type}",
            faiss.serialize_index(index).tobytes()
        )
        
        logger.info(f"✅ Rebuilt FAISS index for {content_type} with {len(embeddings)} vectors")
        
        return {
            "message": f"Index rebuilt for {content_type}",
            "count": len(embeddings),
            "dimension": dimension
        }
        
    except Exception as e:
        logger.error(f"Failed to rebuild index: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/embedding/search")
async def search_embeddings(
    content_type: EmbeddingType,
    query: str,
    limit: int = 10,
    threshold: float = 0.7
):
    """Search embeddings using vector similarity"""
    try:
        # Generate query embedding
        if not embedding_model:
            await initialize_embedding_model()
        
        query_embedding = embedding_model.encode([query])[0]
        
        # Load FAISS index
        index_data = redis_client.get(f"aurora:faiss_index:{content_type}")
        if not index_data:
            raise HTTPException(status_code=404, detail="Index not found, rebuild first")
        
        index = faiss.deserialize_index(np.frombuffer(index_data, dtype=np.uint8))
        
        # Search
        query_vector = np.array([query_embedding], dtype='float32')
        scores, indices = index.search(query_vector, limit)
        
        # Get results
        results = []
        embeddings_data = redis_client.hgetall(f"aurora:embeddings:{content_type}")
        
        for i, (score, idx) in enumerate(zip(scores[0], indices[0])):
            if score >= threshold:
                # Get content data
                content_ids = list(embeddings_data.keys())
                if idx < len(content_ids):
                    content_id = content_ids[idx]
                    result_data = json.loads(embeddings_data[content_id])
                    results.append({
                        "content_id": content_id,
                        "score": float(score),
                        "content": result_data.get("content", ""),
                        "created_at": result_data.get("created_at")
                    })
        
        return {
            "query": query,
            "results": results,
            "count": len(results),
            "threshold": threshold
        }
        
    except Exception as e:
        logger.error(f"Search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "embedding-queue",
        "timestamp": datetime.now().isoformat(),
        "model_loaded": embedding_model is not None,
        "queue_length": redis_client.zcard("aurora:embedding_queue")
    }

# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize the service"""
    await initialize_embedding_model()
    logger.info("🚀 Embedding Queue Service started")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8013)
