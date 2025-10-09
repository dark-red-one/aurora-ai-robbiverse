#!/usr/bin/env python3
"""
Training Scheduler - Distributed Fine-Tuning for Allan Maverick Model
Manages fine-tuning jobs across GPU nodes (RunPod TX, Vengeance)
"""

import os
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
import redis
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(title="Training Scheduler - Distributed Fine-Tuning")

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

GPU_NODES = os.getenv("GPU_NODES", "runpod-tx,vengeance").split(",")

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


class TrainingJob(BaseModel):
    id: str
    model_name: str
    base_model: str
    training_data: str
    epochs: int
    learning_rate: float
    status: str
    progress: float
    current_epoch: int
    loss: float
    eta_minutes: int
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class TrainingJobCreate(BaseModel):
    model_name: str
    base_model: str = "llama3.1:8b"
    training_data: str
    epochs: int = 3
    learning_rate: float = 0.0001


@app.on_event("startup")
async def startup_event():
    """Initialize Training Scheduler"""
    logger.info(f"🎓 Starting Training Scheduler on {NODE_NAME}...")
    
    # Ensure training jobs table exists
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS training_jobs (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    model_name VARCHAR(100) NOT NULL,
                    base_model VARCHAR(100) NOT NULL,
                    training_data TEXT NOT NULL,
                    epochs INTEGER NOT NULL,
                    learning_rate FLOAT NOT NULL,
                    status VARCHAR(20) DEFAULT 'pending',
                    progress FLOAT DEFAULT 0.0,
                    current_epoch INTEGER DEFAULT 0,
                    loss FLOAT DEFAULT 0.0,
                    eta_minutes INTEGER DEFAULT 0,
                    assigned_node VARCHAR(50),
                    created_at TIMESTAMP DEFAULT NOW(),
                    started_at TIMESTAMP,
                    completed_at TIMESTAMP,
                    metadata JSONB DEFAULT '{}'
                )
            """)
            
            conn.commit()
            
        logger.info("✅ Training Scheduler ready")
    finally:
        conn.close()


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "training-scheduler", "node": NODE_NAME}


@app.post("/api/training/start", response_model=TrainingJob)
async def start_training_job(job: TrainingJobCreate, background_tasks: BackgroundTasks):
    """Start a new training job"""
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                # Create training job
                cur.execute("""
                    INSERT INTO training_jobs (model_name, base_model, training_data, epochs, learning_rate)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING *
                """, (
                    job.model_name,
                    job.base_model,
                    job.training_data,
                    job.epochs,
                    job.learning_rate
                ))
                
                new_job = cur.fetchone()
                conn.commit()
                
                # Start training in background
                background_tasks.add_task(execute_training_job, str(new_job["id"]))
                
                # Publish event
                redis_client.publish("aurora:training:started", json.dumps({
                    "job_id": str(new_job["id"]),
                    "model_name": job.model_name,
                    "node": NODE_NAME,
                    "timestamp": datetime.utcnow().isoformat()
                }))
                
                return TrainingJob(**dict(new_job))
                
        finally:
            conn.close()
            
    except Exception as e:
        logger.error(f"Start training error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/training/status/{job_id}", response_model=TrainingJob)
async def get_training_status(job_id: str):
    """Get training job status"""
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT * FROM training_jobs WHERE id = %s
                """, (job_id,))
                
                job = cur.fetchone()
                
                if not job:
                    raise HTTPException(status_code=404, detail="Training job not found")
                
                return TrainingJob(**dict(job))
                
        finally:
            conn.close()
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get status error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/training/jobs", response_model=List[TrainingJob])
async def get_training_jobs(status: Optional[str] = None):
    """Get all training jobs"""
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                query = "SELECT * FROM training_jobs"
                params = []
                
                if status:
                    query += " WHERE status = %s"
                    params.append(status)
                
                query += " ORDER BY created_at DESC"
                
                cur.execute(query, params)
                jobs = cur.fetchall()
                
                return [TrainingJob(**dict(job)) for job in jobs]
                
        finally:
            conn.close()
            
    except Exception as e:
        logger.error(f"Get jobs error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def execute_training_job(job_id: str):
    """Execute training job on available GPU node"""
    try:
        # Find available GPU node
        available_node = await find_available_gpu_node()
        
        if not available_node:
            # Update job status to failed
            await update_job_status(job_id, "failed", "No available GPU nodes")
            return
        
        # Update job status to running
        await update_job_status(job_id, "running", assigned_node=available_node)
        
        # Simulate training (in real implementation, this would call Ollama fine-tuning API)
        await simulate_training(job_id)
        
        # Update job status to completed
        await update_job_status(job_id, "completed")
        
    except Exception as e:
        logger.error(f"Training execution error: {e}")
        await update_job_status(job_id, "failed", str(e))


async def find_available_gpu_node():
    """Find available GPU node for training"""
    # In real implementation, check GPU utilization and queue
    # For now, return first available node
    return GPU_NODES[0] if GPU_NODES else None


async def update_job_status(job_id: str, status: str, error_message: str = None, assigned_node: str = None):
    """Update training job status"""
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                update_fields = ["status = %s"]
                params = [status]
                
                if status == "running":
                    update_fields.append("started_at = NOW()")
                    if assigned_node:
                        update_fields.append("assigned_node = %s")
                        params.append(assigned_node)
                elif status == "completed":
                    update_fields.append("completed_at = NOW()")
                    update_fields.append("progress = 100.0")
                elif status == "failed":
                    update_fields.append("completed_at = NOW()")
                    if error_message:
                        update_fields.append("metadata = %s")
                        params.append(json.dumps({"error": error_message}))
                
                params.append(job_id)
                
                query = f"UPDATE training_jobs SET {', '.join(update_fields)} WHERE id = %s"
                cur.execute(query, params)
                conn.commit()
                
        finally:
            conn.close()
            
    except Exception as e:
        logger.error(f"Update status error: {e}")


async def simulate_training(job_id: str):
    """Simulate training progress"""
    # In real implementation, this would monitor actual training progress
    # For now, simulate progress updates
    
    for epoch in range(3):
        await update_training_progress(job_id, epoch + 1, (epoch + 1) * 33.33, 0.5 - (epoch * 0.1))
        await asyncio.sleep(2)  # Simulate training time


async def update_training_progress(job_id: str, current_epoch: int, progress: float, loss: float):
    """Update training progress"""
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE training_jobs 
                    SET current_epoch = %s, progress = %s, loss = %s, eta_minutes = %s
                    WHERE id = %s
                """, (current_epoch, progress, loss, 30, job_id))
                
                conn.commit()
                
        finally:
            conn.close()
            
    except Exception as e:
        logger.error(f"Update progress error: {e}")


if __name__ == "__main__":
    import uvicorn
    import asyncio
    uvicorn.run(app, host="0.0.0.0", port=8010)
