#!/usr/bin/env python3
"""
Google Keep & Tasks Sync Service
Syncs sticky notes with Google Keep and tasks with Google Tasks
"""

import asyncio
import json
import logging
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional

import httpx
import redis
from fastapi import FastAPI, HTTPException, BackgroundTasks
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from pydantic import BaseModel

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(title="Google Keep & Tasks Sync", version="1.0.0")

# Database and Redis connections
POSTGRES_URL = os.getenv("POSTGRES_URL", "postgresql://aurora_app:aurora_password@aurora-postgres:5432/aurora_unified")
REDIS_URL = os.getenv("REDIS_URL", "redis://:aurora_password@redis-sentinel-aurora:26379")

# Google API scopes
SCOPES = [
    'https://www.googleapis.com/auth/keep',
    'https://www.googleapis.com/auth/tasks',
    'https://www.googleapis.com/auth/calendar'
]

# Redis client
redis_client = redis.from_url(REDIS_URL, decode_responses=True)

class GoogleKeepNote(BaseModel):
    id: str
    title: str
    text_content: str
    created_time: str
    updated_time: str
    labels: List[str] = []
    color: str = "DEFAULT"

class GoogleTask(BaseModel):
    id: str
    title: str
    notes: str = ""
    due: Optional[str] = None
    status: str = "needsAction"
    created: str
    updated: str

class SyncRequest(BaseModel):
    sync_type: str  # "keep", "tasks", or "both"
    force_full_sync: bool = False

class GoogleKeepTasksService:
    def __init__(self):
        self.keep_service = None
        self.tasks_service = None
        self.credentials = None
        self.last_sync = {
            "keep": None,
            "tasks": None
        }
        
    async def authenticate(self):
        """Authenticate with Google APIs"""
        try:
            creds_file = os.getenv("GOOGLE_CREDENTIALS_JSON")
            if not creds_file:
                logger.error("GOOGLE_CREDENTIALS_JSON not found")
                return False
                
            # Load credentials from JSON
            creds_data = json.loads(creds_file)
            self.credentials = Credentials.from_authorized_user_info(creds_data, SCOPES)
            
            # Refresh if needed
            if not self.credentials.valid:
                if self.credentials.expired and self.credentials.refresh_token:
                    self.credentials.refresh(Request())
                else:
                    logger.error("Invalid credentials")
                    return False
            
            # Build services
            self.keep_service = build('keep', 'v1', credentials=self.credentials)
            self.tasks_service = build('tasks', 'v1', credentials=self.credentials)
            
            logger.info("✅ Google API authentication successful")
            return True
            
        except Exception as e:
            logger.error(f"❌ Google API authentication failed: {e}")
            return False
    
    async def sync_keep_notes(self, force_full: bool = False):
        """Sync sticky notes with Google Keep"""
        try:
            if not self.keep_service:
                await self.authenticate()
            
            # Get last sync time
            last_sync_key = "google_keep_last_sync"
            if not force_full:
                last_sync_time = redis_client.get(last_sync_key)
                if last_sync_time:
                    self.last_sync["keep"] = datetime.fromisoformat(last_sync_time)
            
            # Fetch notes from Google Keep
            notes_result = self.keep_service.notes().list().execute()
            notes = notes_result.get('notes', [])
            
            synced_count = 0
            for note in notes:
                # Check if note was updated since last sync
                note_updated = datetime.fromisoformat(note['updated'].replace('Z', '+00:00'))
                if not force_full and self.last_sync["keep"] and note_updated <= self.last_sync["keep"]:
                    continue
                
                # Convert to our format
                keep_note = GoogleKeepNote(
                    id=note['name'].split('/')[-1],
                    title=note.get('title', ''),
                    text_content=note.get('text', ''),
                    created_time=note['created'],
                    updated_time=note['updated'],
                    labels=[label['name'] for label in note.get('labels', [])],
                    color=note.get('color', 'DEFAULT')
                )
                
                # Sync to our database
                await self._sync_note_to_database(keep_note)
                synced_count += 1
            
            # Update last sync time
            redis_client.set(last_sync_key, datetime.now().isoformat())
            self.last_sync["keep"] = datetime.now()
            
            logger.info(f"✅ Synced {synced_count} Google Keep notes")
            return {"synced_count": synced_count, "status": "success"}
            
        except Exception as e:
            logger.error(f"❌ Google Keep sync failed: {e}")
            return {"error": str(e), "status": "error"}
    
    async def sync_google_tasks(self, force_full: bool = False):
        """Sync tasks with Google Tasks"""
        try:
            if not self.tasks_service:
                await self.authenticate()
            
            # Get task lists
            tasklists_result = self.tasks_service.tasklists().list().execute()
            tasklists = tasklists_result.get('items', [])
            
            synced_count = 0
            for tasklist in tasklists:
                list_id = tasklist['id']
                
                # Get tasks from this list
                tasks_result = self.tasks_service.tasks().list(
                    tasklist=list_id,
                    showCompleted=False,
                    showHidden=False
                ).execute()
                
                tasks = tasks_result.get('items', [])
                
                for task in tasks:
                    # Convert to our format
                    google_task = GoogleTask(
                        id=task['id'],
                        title=task['title'],
                        notes=task.get('notes', ''),
                        due=task.get('due'),
                        status=task['status'],
                        created=task['created'],
                        updated=task['updated']
                    )
                    
                    # Sync to our database
                    await self._sync_task_to_database(google_task, list_id)
                    synced_count += 1
            
            # Update last sync time
            redis_client.set("google_tasks_last_sync", datetime.now().isoformat())
            self.last_sync["tasks"] = datetime.now()
            
            logger.info(f"✅ Synced {synced_count} Google Tasks")
            return {"synced_count": synced_count, "status": "success"}
            
        except Exception as e:
            logger.error(f"❌ Google Tasks sync failed: {e}")
            return {"error": str(e), "status": "error"}
    
    async def _sync_note_to_database(self, note: GoogleKeepNote):
        """Sync a Google Keep note to our database"""
        try:
            async with httpx.AsyncClient() as client:
                # Check if note exists
                response = await client.get(
                    f"http://memory-embeddings:8009/api/notes/search",
                    params={"query": note.title, "limit": 1}
                )
                
                if response.status_code == 200:
                    existing_notes = response.json().get("notes", [])
                    if existing_notes:
                        # Update existing note
                        note_id = existing_notes[0]["id"]
                        await client.put(
                            f"http://memory-embeddings:8009/api/notes/{note_id}",
                            json={
                                "title": note.title,
                                "content": note.text_content,
                                "source": "google_keep",
                                "external_id": note.id,
                                "labels": note.labels,
                                "metadata": {
                                    "color": note.color,
                                    "created_time": note.created_time,
                                    "updated_time": note.updated_time
                                }
                            }
                        )
                    else:
                        # Create new note
                        await client.post(
                            "http://memory-embeddings:8009/api/notes",
                            json={
                                "title": note.title,
                                "content": note.text_content,
                                "source": "google_keep",
                                "external_id": note.id,
                                "labels": note.labels,
                                "metadata": {
                                    "color": note.color,
                                    "created_time": note.created_time,
                                    "updated_time": note.updated_time
                                }
                            }
                        )
                        
        except Exception as e:
            logger.error(f"Error syncing note to database: {e}")
    
    async def _sync_task_to_database(self, task: GoogleTask, list_id: str):
        """Sync a Google Task to our database"""
        try:
            async with httpx.AsyncClient() as client:
                # Check if task exists
                response = await client.get(
                    f"http://task-manager:8005/api/tasks/search",
                    params={"query": task.title, "limit": 1}
                )
                
                if response.status_code == 200:
                    existing_tasks = response.json().get("tasks", [])
                    if existing_tasks:
                        # Update existing task
                        task_id = existing_tasks[0]["id"]
                        await client.put(
                            f"http://task-manager:8005/api/tasks/{task_id}",
                            json={
                                "title": task.title,
                                "description": task.notes,
                                "due_date": task.due,
                                "status": "completed" if task.status == "completed" else "pending",
                                "source": "google_tasks",
                                "external_id": task.id,
                                "metadata": {
                                    "list_id": list_id,
                                    "created": task.created,
                                    "updated": task.updated
                                }
                            }
                        )
                    else:
                        # Create new task
                        await client.post(
                            "http://task-manager:8005/api/tasks",
                            json={
                                "title": task.title,
                                "description": task.notes,
                                "due_date": task.due,
                                "status": "completed" if task.status == "completed" else "pending",
                                "source": "google_tasks",
                                "external_id": task.id,
                                "metadata": {
                                    "list_id": list_id,
                                    "created": task.created,
                                    "updated": task.updated
                                }
                            }
                        )
                        
        except Exception as e:
            logger.error(f"Error syncing task to database: {e}")

# Initialize service
google_service = GoogleKeepTasksService()

@app.on_event("startup")
async def startup():
    """Initialize service on startup"""
    await google_service.authenticate()

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "google-keep-tasks"}

@app.post("/api/sync/keep")
async def sync_keep_notes(request: SyncRequest, background_tasks: BackgroundTasks):
    """Sync Google Keep notes"""
    background_tasks.add_task(google_service.sync_keep_notes, request.force_full_sync)
    return {"message": "Google Keep sync started", "status": "accepted"}

@app.post("/api/sync/tasks")
async def sync_google_tasks(request: SyncRequest, background_tasks: BackgroundTasks):
    """Sync Google Tasks"""
    background_tasks.add_task(google_service.sync_google_tasks, request.force_full_sync)
    return {"message": "Google Tasks sync started", "status": "accepted"}

@app.post("/api/sync/both")
async def sync_both(request: SyncRequest, background_tasks: BackgroundTasks):
    """Sync both Google Keep and Tasks"""
    background_tasks.add_task(google_service.sync_keep_notes, request.force_full_sync)
    background_tasks.add_task(google_service.sync_google_tasks, request.force_full_sync)
    return {"message": "Full Google sync started", "status": "accepted"}

@app.get("/api/sync/status")
async def get_sync_status():
    """Get sync status"""
    return {
        "last_sync": google_service.last_sync,
        "keep_authenticated": google_service.keep_service is not None,
        "tasks_authenticated": google_service.tasks_service is not None
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8014)
