#!/usr/bin/env python3
"""
Priority Surface Engine
Surfaces the top 10 most important/urgent items, submerges the rest
"""

import os
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import redis

from eisenhower import EisenhowerEngine, Quadrant

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(title="Priority Surface Engine")

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


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "priority-surface"}


@app.get("/api/priorities/surface")
async def get_surface_priorities(top_n: int = 10, user: str = "allan"):
    """
    Get top N priority items (surfaced), submerge the rest
    
    Combines:
    - Emails (from inbox)
    - Tasks (from task system)
    - Meetings (from calendar)
    - Deals (from HubSpot)
    """
    try:
        all_items = []
        
        # Fetch emails
        emails = _fetch_emails(user)
        all_items.extend(emails)
        
        # Fetch tasks
        tasks = _fetch_tasks(user)
        all_items.extend(tasks)
        
        # Fetch meetings
        meetings = _fetch_meetings(user)
        all_items.extend(meetings)
        
        # Fetch deals
        deals = _fetch_deals(user)
        all_items.extend(deals)
        
        # Surface top priorities
        result = EisenhowerEngine.surface_priorities(all_items, top_n)
        
        # Cache result in Redis (5 min TTL)
        cache_key = f"priorities:surface:{user}:{top_n}"
        redis_client.setex(cache_key, 300, str(result))
        
        return result
        
    except Exception as e:
        logger.error(f"Error getting surface priorities: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/priorities/quadrant/{quadrant_name}")
async def get_by_quadrant(quadrant_name: str, user: str = "allan"):
    """Get all items in a specific Eisenhower quadrant"""
    try:
        # Validate quadrant
        valid_quadrants = ["Q1_DO_NOW", "Q2_SCHEDULE", "Q3_DELEGATE", "Q4_ELIMINATE"]
        if quadrant_name not in valid_quadrants:
            raise HTTPException(status_code=400, detail=f"Invalid quadrant. Use: {valid_quadrants}")
        
        # Get all items
        all_items = []
        all_items.extend(_fetch_emails(user))
        all_items.extend(_fetch_tasks(user))
        all_items.extend(_fetch_meetings(user))
        all_items.extend(_fetch_deals(user))
        
        # Filter by quadrant
        priority_items = [EisenhowerEngine.create_priority_item(item) for item in all_items]
        filtered = [
            {
                "id": item.id,
                "type": item.type,
                "title": item.title,
                "priority_score": round(item.priority_score, 1),
                "importance": round(item.importance_score, 1),
                "urgency": round(item.urgency_score, 1)
            }
            for item in priority_items
            if item.quadrant.name == quadrant_name
        ]
        
        return {
            "quadrant": quadrant_name,
            "count": len(filtered),
            "items": filtered
        }
        
    except Exception as e:
        logger.error(f"Error getting quadrant items: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/priorities/stats")
async def get_priority_stats(user: str = "allan"):
    """Get priority distribution statistics"""
    try:
        all_items = []
        all_items.extend(_fetch_emails(user))
        all_items.extend(_fetch_tasks(user))
        all_items.extend(_fetch_meetings(user))
        all_items.extend(_fetch_deals(user))
        
        result = EisenhowerEngine.surface_priorities(all_items, 10)
        
        return {
            "user": user,
            "stats": result["stats"],
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting stats: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


def _fetch_emails(user: str) -> List[Dict]:
    """Fetch emails from inbox"""
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT 
                    id,
                    'email' as type,
                    subject as title,
                    sender_email,
                    sender_score,
                    urgency_score,
                    revenue_potential,
                    deadline,
                    body,
                    received_at
                FROM emails
                WHERE recipient = %s
                  AND archived = FALSE
                  AND deleted = FALSE
                ORDER BY received_at DESC
                LIMIT 100
            """, (user,))
            
            emails = []
            for row in cur.fetchall():
                emails.append({
                    "id": f"email_{row['id']}",
                    "type": "email",
                    "title": row['title'],
                    "sender_score": row.get('sender_score', 50),
                    "revenue_potential": row.get('revenue_potential', 0),
                    "deadline": row.get('deadline'),
                    "subject": row['title'],
                    "body": row.get('body', ''),
                    "context": {
                        "sender": row.get('sender_email'),
                        "received_at": row.get('received_at').isoformat() if row.get('received_at') else None
                    }
                })
            
            return emails
            
    finally:
        conn.close()


def _fetch_tasks(user: str) -> List[Dict]:
    """Fetch tasks from task system with deduplication and surfacing"""
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                # Create tasks table if it doesn't exist
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS tasks (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        user_id TEXT NOT NULL,
                        title TEXT NOT NULL,
                        description TEXT,
                        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
                        priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
                        category TEXT DEFAULT 'general',
                        source_type TEXT, -- email, conversation, calendar, manual, etc.
                        source_id TEXT, -- ID of the source (email_id, conversation_id, etc.)
                        associated_people JSONB DEFAULT '[]'::jsonb,
                        associated_deals JSONB DEFAULT '[]'::jsonb,
                        associated_messages JSONB DEFAULT '[]'::jsonb,
                        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                        completed_at TIMESTAMPTZ,
                        metadata JSONB DEFAULT '{}'::jsonb
                    )
                """)

                # Create task deduplication index
                cur.execute("""
                    CREATE INDEX IF NOT EXISTS idx_tasks_deduplication
                    ON tasks(title, user_id, status)
                """)

                conn.commit()

                # Fetch recent tasks
                cur.execute("""
                    SELECT
                        id,
                        title,
                        description,
                        status,
                        priority,
                        category,
                        source_type,
                        source_id,
                        associated_people,
                        associated_deals,
                        associated_messages,
                        created_at,
                        updated_at,
                        completed_at,
                        metadata
                    FROM tasks
                    WHERE user_id = %s AND status != 'completed'
                    ORDER BY
                        CASE priority
                            WHEN 'critical' THEN 1
                            WHEN 'high' THEN 2
                            WHEN 'medium' THEN 3
                            WHEN 'low' THEN 4
                        END,
                        created_at DESC
                    LIMIT 50
                """, (user,))

                tasks = []
                for row in cur.fetchall():
                    # Calculate dynamic urgency based on context
                    urgency = calculate_task_urgency(row)
                    importance = calculate_task_importance(row)
                    effort = calculate_task_effort(row)

                    # Check for similar tasks (deduplication)
                    similar_tasks = check_task_similarity(row, cur)

                    tasks.append({
                        "id": f"task_{row['id']}",
                        "type": "task",
                        "title": row['title'],
                        "description": row['description'],
                        "status": row['status'],
                        "priority": row['priority'],
                        "category": row['category'],
                        "source_type": row['source_type'],
                        "source_id": row['source_id'],
                        "associated_people": row['associated_people'],
                        "associated_deals": row['associated_deals'],
                        "associated_messages": row['associated_messages'],
                        "created_at": row['created_at'],
                        "updated_at": row['updated_at'],
                        "metadata": row['metadata'],
                        "urgency": urgency,
                        "importance": importance,
                        "effort": effort,
                        "context_relevance": 0.8,
                        "dependencies": [],
                        "personality_alignment": {"gandhi": 7, "flirty": 5, "turbo": 6, "auto": 7},
                        "similar_tasks": similar_tasks
                    })

                return tasks

        finally:
            conn.close()

    except Exception as e:
        logger.error(f"Error fetching tasks: {e}")
        return []


def check_task_similarity(task_row, cursor) -> List[Dict]:
    """Check for similar tasks to enable deduplication"""
    try:
        # Simple similarity check based on title similarity
        cursor.execute("""
            SELECT id, title, status, created_at
            FROM tasks
            WHERE user_id = %s
            AND id != %s
            AND status != 'completed'
            AND (title ILIKE %s OR title ILIKE %s)
            ORDER BY created_at DESC
            LIMIT 5
        """, (
            task_row['user_id'],
            task_row['id'],
            f"%{task_row['title'][:30]}%",
            f"%{task_row['title'][-30:]}%"
        ))

        similar = []
        for row in cursor.fetchall():
            similar.append({
                "id": str(row['id']),
                "title": row['title'],
                "status": row['status'],
                "created_at": row['created_at'].isoformat() if row['created_at'] else None
            })

        return similar

    except Exception as e:
        logger.error(f"Error checking task similarity: {e}")
        return []


def calculate_task_urgency(task_row) -> int:
    """Calculate task urgency based on priority and context"""
    base_urgency = {
        'critical': 95,
        'high': 80,
        'medium': 60,
        'low': 40
    }

    urgency = base_urgency.get(task_row['priority'], 50)

    # Adjust based on source and associations
    if task_row['source_type'] == 'email':
        urgency += 10  # Emails need quicker response
    elif task_row['source_type'] == 'deadline':
        urgency += 15  # Deadlines are time-sensitive

    # Boost urgency if associated with important deals
    if task_row['associated_deals']:
        urgency += 10

    return min(100, urgency)


def calculate_task_importance(task_row) -> int:
    """Calculate task importance based on associations and context"""
    importance = 60  # Base importance

    # Boost importance based on associations
    if task_row['associated_people']:
        importance += 15  # People-related tasks are important

    if task_row['associated_deals']:
        # Deal value affects importance
        deals = task_row['associated_deals']
        if isinstance(deals, list):
            max_deal_value = 0
            for deal in deals:
                if isinstance(deal, dict) and 'amount' in deal:
                    try:
                        amount = float(deal['amount'])
                        max_deal_value = max(max_deal_value, amount)
                    except:
                        pass

            if max_deal_value > 100000:  # $100k+ deals
                importance += 25
            elif max_deal_value > 50000:  # $50k+ deals
                importance += 15

    # Category-based importance
    category_importance = {
        'deadline': 20,
        'meeting': 15,
        'opportunity': 25,
        'feedback': 10
    }

    importance += category_importance.get(task_row.get('category', ''), 0)

    return min(100, importance)


def calculate_task_effort(task_row) -> int:
    """Calculate estimated effort for task"""
    # Simple effort estimation based on description length and type
    description = task_row.get('description', '') or ''
    base_effort = min(60, len(description) / 10)  # Rough estimate based on length

    # Adjust based on category
    category_effort = {
        'email': 15,
        'meeting': 30,
        'analysis': 45,
        'planning': 40,
        'research': 35
    }

    base_effort += category_effort.get(task_row.get('category', ''), 20)

    return min(80, base_effort)


def _fetch_meetings(user: str) -> List[Dict]:
    """Fetch upcoming meetings from calendar"""
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT 
                    id,
                    'meeting' as type,
                    title,
                    start_time,
                    end_time,
                    attendees,
                    location,
                    description
                FROM calendar_events
                WHERE organizer = %s OR %s = ANY(attendees)
                  AND start_time >= NOW()
                  AND start_time <= NOW() + INTERVAL '7 days'
                ORDER BY start_time ASC
                LIMIT 20
            """, (user, user))
            
            meetings = []
            for row in cur.fetchall():
                # Meetings are urgent if starting soon
                start_time = row.get('start_time')
                urgency = 50
                if start_time:
                    hours_until = (start_time - datetime.now()).total_seconds() / 3600
                    if hours_until < 2:
                        urgency = 95
                    elif hours_until < 24:
                        urgency = 75
                    elif hours_until < 48:
                        urgency = 60
                
                meetings.append({
                    "id": f"meeting_{row['id']}",
                    "type": "meeting",
                    "title": row['title'],
                    "deadline": start_time,
                    "urgency_override": urgency,
                    "context": {
                        "start_time": start_time.isoformat() if start_time else None,
                        "attendees": row.get('attendees', []),
                        "location": row.get('location')
                    }
                })
            
            return meetings
            
    finally:
        conn.close()


def _fetch_deals(user: str) -> List[Dict]:
    """Fetch active deals from HubSpot"""
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT 
                    hubspot_id,
                    'deal' as type,
                    deal_name as title,
                    amount,
                    dealstage,
                    close_date,
                    hs_forecast_probability,
                    hs_deal_score
                FROM deals
                WHERE owner_id = %s
                  AND dealstage NOT IN ('closedwon', 'closedlost')
                ORDER BY amount DESC NULLS LAST
                LIMIT 30
            """, (user,))
            
            deals = []
            for row in cur.fetchall():
                amount = row.get('amount', 0) or 0
                probability = row.get('hs_forecast_probability', 50) or 50
                
                deals.append({
                    "id": f"deal_{row['hubspot_id']}",
                    "type": "deal",
                    "title": row['title'],
                    "revenue_potential": amount * (probability / 100),
                    "deadline": row.get('close_date'),
                    "is_strategic": amount > 50000,  # High-value deals are strategic
                    "context": {
                        "amount": amount,
                        "stage": row.get('dealstage'),
                        "probability": probability,
                        "deal_score": row.get('hs_deal_score')
                    }
                })
            
            return deals

    finally:
        conn.close()


@app.post("/api/priorities/task")
async def create_task(task: Dict):
    """Create a new task with associations"""
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                # Check for similar tasks before creating (deduplication)
                similar_tasks = check_task_similarity_for_creation(task, cur)

                if similar_tasks:
                    # Return existing similar task instead of creating duplicate
                    existing_task = similar_tasks[0]
                    return {
                        "status": "existing",
                        "task_id": str(existing_task["id"]),
                        "message": "Similar task already exists",
                        "similar_tasks": similar_tasks
                    }

                # Create new task
                cur.execute("""
                    INSERT INTO tasks (
                        user_id, title, description, status, priority, category,
                        source_type, source_id, associated_people, associated_deals,
                        associated_messages, metadata
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id
                """, (
                    task.get("user_id", "allan"),
                    task["title"],
                    task.get("description", ""),
                    task.get("status", "pending"),
                    task.get("priority", "medium"),
                    task.get("category", "general"),
                    task.get("source_type"),
                    task.get("source_id"),
                    json.dumps(task.get("associated_people", [])),
                    json.dumps(task.get("associated_deals", [])),
                    json.dumps(task.get("associated_messages", [])),
                    json.dumps(task.get("metadata", {}))
                ))

                new_task_id = cur.fetchone()["id"]
                conn.commit()

                return {
                    "status": "created",
                    "task_id": str(new_task_id),
                    "message": "Task created successfully"
                }

        finally:
            conn.close()

    except Exception as e:
        logger.error(f"❌ Error creating task: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def check_task_similarity_for_creation(task_data, cursor) -> List[Dict]:
    """Check for similar tasks before creating to prevent duplicates"""
    try:
        # Check for tasks with similar titles
        cursor.execute("""
            SELECT id, title, status, priority, created_at
            FROM tasks
            WHERE user_id = %s
            AND status != 'completed'
            AND (title ILIKE %s OR title ILIKE %s)
            ORDER BY created_at DESC
            LIMIT 3
        """, (
            task_data.get("user_id", "allan"),
            f"%{task_data['title'][:30]}%",
            f"%{task_data['title'][-30:]}%"
        ))

        similar = []
        for row in cursor.fetchall():
            # Calculate similarity score
            similarity = calculate_title_similarity(task_data["title"], row["title"])
            if similarity > 0.7:  # 70% similarity threshold
                similar.append({
                    "id": row["id"],
                    "title": row["title"],
                    "status": row["status"],
                    "priority": row["priority"],
                    "created_at": row["created_at"].isoformat() if row["created_at"] else None,
                    "similarity": similarity
                })

        return similar

    except Exception as e:
        logger.error(f"Error checking task similarity for creation: {e}")
        return []


def calculate_title_similarity(title1: str, title2: str) -> float:
    """Calculate similarity between two task titles"""
    # Simple similarity based on common words
    words1 = set(title1.lower().split())
    words2 = set(title2.lower().split())

    if not words1 or not words2:
        return 0.0

    intersection = words1.intersection(words2)
    union = words1.union(words2)

    return len(intersection) / len(union) if union else 0.0


@app.get("/api/tasks")
async def get_tasks(user_id: str = "allan", status: Optional[str] = None, category: Optional[str] = None):
    """Get tasks with filtering"""
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                query = """
                    SELECT * FROM tasks
                    WHERE user_id = %s
                """
                params = [user_id]

                if status:
                    query += " AND status = %s"
                    params.append(status)

                if category:
                    query += " AND category = %s"
                    params.append(category)

                query += " ORDER BY created_at DESC"

                cur.execute(query, params)
                tasks = cur.fetchall()

                return {
                    "tasks": [
                        {
                            **dict(task),
                            "id": str(task["id"]),
                            "created_at": task["created_at"].isoformat() if task["created_at"] else None,
                            "updated_at": task["updated_at"].isoformat() if task["updated_at"] else None,
                            "completed_at": task["completed_at"].isoformat() if task["completed_at"] else None
                        }
                        for task in tasks
                    ],
                    "total": len(tasks)
                }

        finally:
            conn.close()

    except Exception as e:
        logger.error(f"❌ Error getting tasks: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/tasks/{task_id}")
async def update_task(task_id: str, task_update: Dict):
    """Update a task"""
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                # Build dynamic update query
                update_fields = []
                params = []

                allowed_fields = [
                    "title", "description", "status", "priority", "category",
                    "associated_people", "associated_deals", "associated_messages"
                ]

                for field in allowed_fields:
                    if field in task_update:
                        update_fields.append(f"{field} = %s")
                        if field in ["associated_people", "associated_deals", "associated_messages"]:
                            params.append(json.dumps(task_update[field]))
                        else:
                            params.append(task_update[field])

                if not update_fields:
                    raise HTTPException(status_code=400, detail="No fields to update")

                params.append(task_id)
                query = f"UPDATE tasks SET {', '.join(update_fields)}, updated_at = NOW() WHERE id = %s"

                cur.execute(query, params)
                conn.commit()

                return {"status": "updated", "task_id": task_id}

        finally:
            conn.close()

    except Exception as e:
        logger.error(f"❌ Error updating task: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/execute")
async def execute_mcp_request(request: Dict):
    """MCP protocol endpoint for task management"""
    request_id = request.get("request_id")
    capability = request.get("capability")
    payload = request.get("payload", {})
    context = request.get("context", {})

    if capability not in ["task_management", "priority_surfacing"]:
        raise HTTPException(status_code=400, detail=f"Unsupported capability: {capability}")

    action = payload.get("action")

    if capability == "task_management":
        if action == "create":
            return await handle_task_creation(payload, context)
        elif action == "update":
            return await handle_task_update(payload, context)
        elif action == "get":
            return await handle_task_retrieval(payload, context)
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported task action: {action}")

    elif capability == "priority_surfacing":
        return await handle_priority_surfacing(payload, context)


async def handle_task_creation(payload: Dict, context: Dict) -> Dict:
    """Handle task creation via MCP"""
    task_data = payload.get("task_data", {})
    user_id = context.get("user_id", "allan")

    # Create task using existing endpoint
    result = await create_task({
        "user_id": user_id,
        "title": task_data.get("title"),
        "description": task_data.get("description"),
        "priority": task_data.get("priority", "medium"),
        "category": task_data.get("category", "general"),
        "source_type": task_data.get("source_type"),
        "source_id": task_data.get("source_id"),
        "associated_people": task_data.get("associated_people", []),
        "associated_deals": task_data.get("associated_deals", []),
        "associated_messages": task_data.get("associated_messages", []),
        "metadata": task_data.get("metadata", {})
    })

    return {"result": result}


async def handle_task_update(payload: Dict, context: Dict) -> Dict:
    """Handle task update via MCP"""
    task_id = payload.get("task_id")
    task_update = payload.get("task_update", {})

    if not task_id:
        raise HTTPException(status_code=400, detail="task_id required")

    # Update task using existing endpoint
    result = await update_task(task_id, task_update)

    return {"result": result}


async def handle_task_retrieval(payload: Dict, context: Dict) -> Dict:
    """Handle task retrieval via MCP"""
    user_id = payload.get("user_id", "allan")
    status_filter = payload.get("status")
    category_filter = payload.get("category")

    # Get tasks using existing endpoint
    result = await get_tasks(user_id, status_filter, category_filter)

    return {"result": result}


async def handle_priority_surfacing(payload: Dict, context: Dict) -> Dict:
    """Handle priority surfacing via MCP"""
    user_id = payload.get("user_id", "allan")

    # Get surface priorities using existing logic
    priorities = await surface_priorities(user_id)

    return {"result": {"priorities": priorities}}


async def surface_priorities(user: str) -> List[Dict]:
    """Surface top priorities (similar to existing logic)"""
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                # Get all priority items
                all_items = []

                # Fetch emails
                all_items.extend(_fetch_emails(user))

                # Fetch meetings
                all_items.extend(_fetch_meetings(user))

                # Fetch tasks
                all_items.extend(_fetch_tasks(user))

                # Fetch deals
                all_items.extend(_fetch_deals(user))

                # Apply Eisenhower Matrix sorting
                sorted_items = sorted(
                    all_items,
                    key=lambda x: (
                        -x.get('urgency', 0),  # Higher urgency first
                        -x.get('importance', 0)  # Higher importance first
                    )
                )

                # Return top 10
                return sorted_items[:10]

        finally:
            conn.close()

    except Exception as e:
        logger.error(f"❌ Error surfacing priorities: {e}")
        return []


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
