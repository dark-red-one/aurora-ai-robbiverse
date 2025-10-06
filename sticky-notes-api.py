#!/usr/bin/env python3
"""
STICKY NOTES API
FastAPI backend for beautiful sticky notes system
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import logging
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import the database class directly
import psycopg2
import json
from datetime import datetime
from typing import List, Dict, Optional

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
    
    def close(self):
        """Close database connection"""
        if self.db_conn:
            self.db_conn.close()

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')

app = FastAPI(title="Sticky Notes API", version="1.0.0")

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database
db = StickyNotesDatabase()

# Pydantic models
class StickyNoteCreate(BaseModel):
    title: str
    content: str
    category: str
    author: str
    is_locked: bool = False
    priority: str = "medium"
    tags: List[str] = []

class StickyNoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    author: Optional[str] = None
    is_locked: Optional[bool] = None
    priority: Optional[str] = None
    tags: Optional[List[str]] = None

class StickyNoteResponse(BaseModel):
    id: str
    title: str
    content: str
    category: str
    author: str
    is_locked: bool
    priority: str
    color_code: str
    created_at: str
    updated_at: str
    tags: List[str]
    metadata: dict

# API Routes
@app.get("/")
async def root():
    return {"message": "Sticky Notes API", "status": "running"}

@app.get("/stickies", response_model=List[StickyNoteResponse])
async def get_all_stickies():
    """Get all sticky notes"""
    try:
        stickies = db.get_all_stickies()
        return stickies
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/stickies/category/{category}", response_model=List[StickyNoteResponse])
async def get_stickies_by_category(category: str):
    """Get stickies by category"""
    try:
        stickies = db.get_stickies_by_category(category)
        return stickies
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/stickies/search", response_model=List[StickyNoteResponse])
async def search_stickies(q: str):
    """Search stickies by title and content"""
    try:
        stickies = db.search_stickies(q)
        return stickies
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/stickies", response_model=dict)
async def create_sticky(sticky: StickyNoteCreate):
    """Create a new sticky note"""
    try:
        sticky_id = db.create_sticky(
            title=sticky.title,
            content=sticky.content,
            category=sticky.category,
            author=sticky.author,
            is_locked=sticky.is_locked,
            priority=sticky.priority,
            tags=sticky.tags
        )
        
        if sticky_id:
            return {"id": sticky_id, "message": "Sticky note created successfully"}
        else:
            raise HTTPException(status_code=400, detail="Failed to create sticky note")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/stickies/{sticky_id}", response_model=dict)
async def update_sticky(sticky_id: str, sticky: StickyNoteUpdate):
    """Update an existing sticky note"""
    try:
        success = db.update_sticky(
            sticky_id=sticky_id,
            title=sticky.title,
            content=sticky.content,
            category=sticky.category,
            author=sticky.author,
            is_locked=sticky.is_locked,
            priority=sticky.priority
        )
        
        if success:
            return {"message": "Sticky note updated successfully"}
        else:
            raise HTTPException(status_code=400, detail="Failed to update sticky note")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/stickies/{sticky_id}", response_model=dict)
async def delete_sticky(sticky_id: str):
    """Delete a sticky note (only if not locked)"""
    try:
        success = db.delete_sticky(sticky_id)
        
        if success:
            return {"message": "Sticky note deleted successfully"}
        else:
            raise HTTPException(status_code=400, detail="Failed to delete sticky note (may be locked)")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/categories")
async def get_categories():
    """Get all available categories"""
    return [
        {"name": "intel", "display_name": "Intel", "color": "#FFE082", "icon": "🧠"},
        {"name": "reference", "display_name": "Reference", "color": "#A5D6A7", "icon": "📚"},
        {"name": "drafts", "display_name": "Drafts", "color": "#BBDEFB", "icon": "📝"},
        {"name": "connections", "display_name": "Connections", "color": "#FFCDD2", "icon": "🤝"},
        {"name": "shower-thoughts", "display_name": "Shower Thoughts", "color": "#E1BEE7", "icon": "🚿"}
    ]

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "sticky-notes-api"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")
