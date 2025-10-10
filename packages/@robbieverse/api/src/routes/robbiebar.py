"""
RobbieBar API Routes - SQLite Version
=====================================
Backend for robbiebar web interface at /code
Provides personality, system stats, git commands, and more
"""

import os
import subprocess
import psutil
import sqlite3
import requests
import json
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/code/api", tags=["robbiebar"])

# Database path (SQLite)
DATABASE_PATH = os.getenv(
    "DATABASE_PATH",
    "/Users/allanperetz/aurora-ai-robbiverse/data/vengeance.db"
)

# Git repository path (adjust per server)
GIT_REPO_PATH = os.getenv(
    "GIT_REPO_PATH",
    "/Users/allanperetz/aurora-ai-robbiverse"
)

# ============================================
# PYDANTIC MODELS
# ============================================

class MoodUpdate(BaseModel):
    mood: str

class GitCommitRequest(BaseModel):
    message: Optional[str] = None

class ContextSwitchRequest(BaseModel):
    context: str

class NoteCreateRequest(BaseModel):
    author: str
    category: str
    content: str
    priority: int = 5

# ============================================
# DATABASE HELPERS
# ============================================

def get_db_connection():
    """Get database connection"""
    return sqlite3.connect(DATABASE_PATH)

def get_db_cursor():
    """Get database cursor with row factory"""
    conn = get_db_connection()
    conn.row_factory = sqlite3.Row
    return conn

# ============================================
# PERSONALITY ENDPOINTS
# ============================================

@router.get("/personality")
def get_personality() -> Dict[str, Any]:
    """Get current Robbie personality state with mood data and image URLs"""
    try:
        import json
        conn = get_db_cursor()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT 
                    rps.current_mood,
                    rps.attraction_level,
                    rps.gandhi_genghis_level,
                    rps.current_context,
                    rps.updated_at,
                    rmd.mood_name,
                    rmd.mood_emoji,
                    rmd.main_image_id,
                    rmd.morph_interval_ms,
                    rmd.matrix_emojis
                FROM robbie_personality_state rps
                LEFT JOIN robbie_mood_definitions rmd ON rps.current_mood = rmd.mood_id
                WHERE rps.user_id = 'allan' AND rps.personality_name = 'robbie'
                LIMIT 1
            """)
            
            row = cursor.fetchone()
            
            if not row:
                # Return default if no data
                return {
                    "mood": "focused",
                    "attraction": 8,
                    "gandhi_genghis": 7,
                    "context": "code",
                    "energy": 50,
                    "updated_at": datetime.now().isoformat()
                }
            
            # Build mood_data with image URLs
            mood_data = None
            if row["mood_name"]:
                # Get variants from junction table
                cursor.execute("""
                    SELECT image_id
                    FROM robbie_mood_variants
                    WHERE mood_id = ?
                    ORDER BY variant_order
                """, (row["current_mood"],))
                
                variant_rows = cursor.fetchall()
                variant_urls = [f"http://localhost:8000/images/{v['image_id']}" for v in variant_rows]
                
                mood_data = {
                    "name": row["mood_name"],
                    "emoji": row["mood_emoji"],
                    "main_image_url": f"http://localhost:8000/images/{row['main_image_id']}",
                    "variant_urls": variant_urls,
                    "morph_interval": row["morph_interval_ms"],
                    "matrix_emojis": json.loads(row["matrix_emojis"]) if row["matrix_emojis"] else []
                }
            
            return {
                "mood": row["current_mood"],
                "mood_data": mood_data,
                "attraction": row["attraction_level"],
                "gandhi_genghis": row["gandhi_genghis_level"],
                "context": row["current_context"],
                "energy": 50,  # Default energy level
                "updated_at": row["updated_at"] if row["updated_at"] else None
            }
        finally:
            conn.close()
            
    except Exception as e:
        logger.error(f"Error fetching personality: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {e}")

# ============================================
# SYSTEM STATS
# ============================================

@router.get("/system/stats")
def get_system_stats() -> Dict[str, Any]:
    """Get system resource usage"""
    try:
        # CPU usage
        cpu_percent = psutil.cpu_percent(interval=1)
        
        # Memory usage
        memory = psutil.virtual_memory()
        memory_percent = memory.percent
        
        # GPU usage (try to get GPU info)
        gpu_percent = 0
        try:
            # Try nvidia-smi if available
            result = subprocess.run(
                ["nvidia-smi", "--query-gpu=utilization.gpu", "--format=csv,noheader,nounits"],
                capture_output=True, text=True, timeout=5
            )
            if result.returncode == 0:
                gpu_percent = float(result.stdout.strip())
        except:
            gpu_percent = 0
        
        return {
            "cpu": cpu_percent,
            "memory": memory_percent,
            "gpu": gpu_percent,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting system stats: {e}")
        raise HTTPException(status_code=500, detail=f"System stats error: {e}")

# ============================================
# GIT COMMANDS
# ============================================

@router.get("/git/status")
def get_git_status() -> Dict[str, Any]:
    """Get git repository status"""
    try:
        # Change to git repo directory
        original_dir = os.getcwd()
        os.chdir(GIT_REPO_PATH)
        
        try:
            # Get current branch
            branch_result = subprocess.run(
                ["git", "branch", "--show-current"],
                capture_output=True, text=True, timeout=5
            )
            branch = branch_result.stdout.strip() if branch_result.returncode == 0 else "unknown"
            
            # Get modified files count
            status_result = subprocess.run(
                ["git", "status", "--porcelain"],
                capture_output=True, text=True, timeout=5
            )
            
            # Parse and categorize files
            modified = []
            untracked = []
            deleted = []
            
            if status_result.returncode == 0:
                for line in status_result.stdout.split('\n'):
                    if not line.strip():
                        continue
                    status_code = line[:2]
                    filename = line[3:].strip()
                    
                    if 'M' in status_code:
                        modified.append(filename)
                    elif '?' in status_code:
                        untracked.append(filename)
                    elif 'D' in status_code:
                        deleted.append(filename)
            
            # Check if working directory is clean
            total_changes = len(modified) + len(untracked) + len(deleted)
            is_clean = total_changes == 0
            
            # Create clean summary
            summary_parts = []
            if modified:
                summary_parts.append(f"✏️ {len(modified)} modified")
            if untracked:
                summary_parts.append(f"➕ {len(untracked)} new")
            if deleted:
                summary_parts.append(f"❌ {len(deleted)} deleted")
            
            summary = "  ".join(summary_parts) if summary_parts else "✅ Clean"
            
            return {
                "branch": branch,
                "summary": summary,
                "modified": modified[:10],  # Limit to 10 files
                "untracked": untracked[:10],
                "deleted": deleted[:10],
                "modified_count": len(modified),
                "untracked_count": len(untracked),
                "deleted_count": len(deleted),
                "total_changes": total_changes,
                "is_clean": is_clean,
                "timestamp": datetime.now().isoformat()
            }
            
        finally:
            os.chdir(original_dir)
            
    except Exception as e:
        logger.error(f"Error getting git status: {e}")
        return {
            "branch": "unknown",
            "modified_files": [],
            "modified_count": 0,
            "is_clean": True,
            "error": str(e)
        }

@router.post("/git/quick-commit")
def quick_commit(request: GitCommitRequest) -> Dict[str, Any]:
    """Stage all changes, commit, and push"""
    try:
        # Change to git repo directory
        original_dir = os.getcwd()
        os.chdir(GIT_REPO_PATH)
        
        try:
            # Check if there are changes
            status_result = subprocess.run(
                ["git", "status", "--porcelain"],
                capture_output=True, text=True, timeout=5
            )
            
            if status_result.returncode != 0 or not status_result.stdout.strip():
                return {
                    "success": True,
                    "skipped": True,
                    "message": "No changes to commit"
                }
            
            # Stage all changes
            subprocess.run(["git", "add", "."], timeout=10)
            
            # Commit with message
            message = request.message or f"Quick commit from RobbieBar - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
            commit_result = subprocess.run(
                ["git", "commit", "-m", message],
                capture_output=True, text=True, timeout=10
            )
            
            if commit_result.returncode != 0:
                return {
                    "success": False,
                    "error": commit_result.stderr
                }
            
            # Push to remote
            push_result = subprocess.run(
                ["git", "push"],
                capture_output=True, text=True, timeout=30
            )
            
            if push_result.returncode != 0:
                return {
                    "success": False,
                    "error": push_result.stderr
                }
            
            return {
                "success": True,
                "message": message,
                "timestamp": datetime.now().isoformat()
            }
            
        finally:
            os.chdir(original_dir)
            
    except Exception as e:
        logger.error(f"Error with quick commit: {e}")
        return {
            "success": False,
            "error": str(e)
        }

@router.get("/git/recent")
def get_recent_commits() -> Dict[str, Any]:
    """Get recent git commits"""
    try:
        # Change to git repo directory
        original_dir = os.getcwd()
        os.chdir(GIT_REPO_PATH)
        
        try:
            # Get last 5 commits with timestamps and author
            result = subprocess.run(
                ["git", "log", "--format=%h|%s|%ar|%an", "-5"],
                capture_output=True, text=True, timeout=5
            )
            
            commits = []
            if result.returncode == 0:
                for line in result.stdout.strip().split('\n'):
                    if line.strip():
                        parts = line.split('|')
                        if len(parts) >= 3:
                            commits.append({
                                "hash": parts[0],
                                "message": parts[1],
                                "time": parts[2],  # e.g. "63 minutes ago"
                                "author": parts[3] if len(parts) > 3 else "Unknown"
                            })
            
            return {
                "commits": commits,
                "count": len(commits),
                "timestamp": datetime.now().isoformat()
            }
            
        finally:
            os.chdir(original_dir)
            
    except Exception as e:
        logger.error(f"Error getting recent commits: {e}")
        return {
            "commits": [],
            "count": 0,
            "error": str(e)
        }

# ============================================
# CONTEXT SWITCHING
# ============================================

@router.post("/context/switch")
def switch_context(request: ContextSwitchRequest) -> Dict[str, Any]:
    """Switch Robbie's current context (code, work, growth, testpilot, play)"""
    try:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            
            # Update both tables for compatibility
            cursor.execute("""
                UPDATE robbie_personality_state 
                SET current_context = ?, updated_at = datetime('now')
                WHERE user_id = 'allan' AND personality_name = 'robbie'
            """, (request.context,))
            
            cursor.execute("""
                UPDATE ai_personality_state 
                SET current_context = ?, updated_at = datetime('now')
                WHERE personality_id = 'robbie'
            """, (request.context,))
            
            conn.commit()
            
            return {
                "success": True,
                "context": request.context,
                "timestamp": datetime.now().isoformat()
            }
        finally:
            conn.close()
            
    except Exception as e:
        logger.error(f"Error switching context: {e}")
        raise HTTPException(status_code=500, detail=f"Context switch failed: {e}")

@router.get("/context/current")
def get_current_context() -> Dict[str, Any]:
    """Get Robbie's current context"""
    try:
        conn = get_db_cursor()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT current_context, updated_at
                FROM robbie_personality_state
                WHERE user_id = 'allan' AND personality_name = 'robbie'
                LIMIT 1
            """)
            
            row = cursor.fetchone()
            
            if row:
                return {
                    "context": row["current_context"],
                    "updated_at": row["updated_at"] if row["updated_at"] else None
                }
            else:
                return {"context": "code", "updated_at": None}
                
        finally:
            conn.close()
            
    except Exception as e:
        logger.error(f"Error getting context: {e}")
        return {"context": "code", "error": str(e)}

# ============================================
# IMAGE SERVING
# ============================================

from fastapi.responses import Response

@router.get("/images/{image_id}")
def get_image(image_id: str):
    """Serve image from database as binary"""
    try:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT image_data, mime_type
                FROM robbie_images
                WHERE image_id = ?
            """, (image_id,))
            
            row = cursor.fetchone()
            
            if not row:
                raise HTTPException(status_code=404, detail=f"Image not found: {image_id}")
            
            return Response(
                content=row[0],  # Binary BLOB data
                media_type=row[1] or 'image/png',
                headers={
                    "Cache-Control": "public, max-age=86400",  # Cache for 24 hours
                    "Content-Disposition": f'inline; filename="{image_id}"'
                }
            )
            
        finally:
            conn.close()
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error serving image {image_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error serving image: {e}")

# ============================================
# NOTES SYSTEM
# ============================================

@router.get("/notes")
def get_notes(author: Optional[str] = None, category: Optional[str] = None) -> Dict[str, Any]:
    """Get notes - Allan's all, Robbie's top 25 most relevant"""
    try:
        conn = get_db_cursor()
        try:
            cursor = conn.cursor()
            
            if author == "allan":
                # Get ALL of Allan's notes
                cursor.execute("SELECT * FROM notes WHERE author = 'allan' ORDER BY created_at DESC")
                rows = cursor.fetchall()
            elif author == "robbie":
                # Get top 25 most relevant Robbie notes (by priority and recency)
                cursor.execute("""
                    SELECT * FROM notes 
                    WHERE author = 'robbie' 
                    ORDER BY priority DESC, created_at DESC 
                    LIMIT 25
                """)
                rows = cursor.fetchall()
            else:
                # Get all notes with optional category filter
                if category:
                    cursor.execute("SELECT * FROM notes WHERE category = ? ORDER BY created_at DESC", (category,))
                    rows = cursor.fetchall()
                else:
                    cursor.execute("SELECT * FROM notes ORDER BY created_at DESC")
                    rows = cursor.fetchall()
            
            notes = [dict(row) for row in rows]
            
            return {
                "notes": notes,
                "count": len(notes),
                "author": author,
                "category": category,
                "timestamp": datetime.now().isoformat()
            }
            
        finally:
            conn.close()
            
    except Exception as e:
        logger.error(f"Error fetching notes: {e}")
        return {
            "notes": [],
            "count": 0,
            "error": str(e)
        }

@router.post("/notes")
def create_note(request: NoteCreateRequest) -> Dict[str, Any]:
    """Create a new note"""
    try:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            note_id = f"{request.author}_{request.category}_{int(datetime.now().timestamp())}"
            
            cursor.execute("""
                INSERT INTO notes (id, author, category, content, priority, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
            """, (note_id, request.author, request.category, request.content, request.priority))
            
            conn.commit()
            
            return {
                "success": True,
                "note_id": note_id,
                "timestamp": datetime.now().isoformat()
            }
            
        finally:
            conn.close()
            
    except Exception as e:
        logger.error(f"Error creating note: {e}")
        raise HTTPException(status_code=500, detail=f"Note creation failed: {e}")

@router.get("/notes/search")
def search_notes(q: str) -> Dict[str, Any]:
    """Search notes by content"""
    try:
        conn = get_db_cursor()
        try:
            cursor = conn.cursor()
            
            # Search in content field
            cursor.execute("""
                SELECT * FROM notes 
                WHERE content LIKE ? 
                ORDER BY priority DESC, created_at DESC
                LIMIT 50
            """, (f"%{q}%",))
            
            rows = cursor.fetchall()
            notes = [dict(row) for row in rows]
            
            return {
                "notes": notes,
                "count": len(notes),
                "query": q,
                "timestamp": datetime.now().isoformat()
            }
            
        finally:
            conn.close()
            
    except Exception as e:
        logger.error(f"Error searching notes: {e}")
        return {
            "notes": [],
            "count": 0,
            "error": str(e)
        }

# ============================================
# MOTD (Message of the Day)
# ============================================

@router.get("/moods")
def get_moods() -> Dict[str, Any]:
    """Get all mood definitions with image URLs from database"""
    try:
        import json
        conn = get_db_cursor()
        try:
            cursor = conn.cursor()
            
            # Get all moods
            cursor.execute("""
                SELECT mood_id, mood_name, mood_emoji, main_image_id, 
                       morph_interval_ms, matrix_emojis, description
                FROM robbie_mood_definitions
            """)
            
            rows = cursor.fetchall()
            moods = {}
            
            for row in rows:
                mood_id = row["mood_id"]
                
                # Get variants for this mood from junction table
                cursor.execute("""
                    SELECT image_id, variant_order
                    FROM robbie_mood_variants
                    WHERE mood_id = ?
                    ORDER BY variant_order
                """, (mood_id,))
                
                variant_rows = cursor.fetchall()
                variant_urls = [f"http://localhost:8000/images/{v['image_id']}" for v in variant_rows]
                
                moods[mood_id] = {
                    "name": row["mood_name"],
                    "emoji": row["mood_emoji"],
                    "main_image_url": f"http://localhost:8000/images/{row['main_image_id']}",
                    "variant_urls": variant_urls,
                    "morph_interval": row["morph_interval_ms"],
                    "matrix_emojis": json.loads(row["matrix_emojis"]) if row["matrix_emojis"] else [],
                    "description": row["description"]
                }
            
            return {
                "moods": moods,
                "count": len(moods),
                "timestamp": datetime.now().isoformat()
            }
            
        finally:
            conn.close()
            
    except Exception as e:
        logger.error(f"Error fetching moods: {e}")
        return {
            "moods": {},
            "count": 0,
            "error": str(e)
        }

@router.get("/motd")
def get_motd() -> Dict[str, Any]:
    """Get context-aware Message of the Day"""
    try:
        # Get current context
        context_response = get_current_context()
        context = context_response.get("context", "code")
        
        # Get current time for greeting
        now = datetime.now()
        hour = now.hour
        
        if hour < 12:
            time_greeting = "Good morning"
        elif hour < 17:
            time_greeting = "Good afternoon"
        else:
            time_greeting = "Good evening"
        
        # Context-specific MOTDs
        motds = {
            "code": f"{time_greeting} Allan - Ready to code! Your RobbieBar is active with system stats and git integration.",
            "work": f"{time_greeting} Allan - Today's a productivity day! You have notes organized and tasks ready to tackle.",
            "growth": f"{time_greeting} Allan - Pipeline at $289K with 40 companies. Time to close some deals!",
            "testpilot": f"{time_greeting} Allan - TestPilot dashboard active. 33 tests running, 76% completion rate.",
            "play": f"{time_greeting} Allan - You've been working hard! Ready for some fun? Strip blackjack awaits! 😘"
        }
        
        motd = motds.get(context, motds["code"])
        
        return {
            "motd": motd,
            "context": context,
            "time_greeting": time_greeting,
            "timestamp": now.isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error generating MOTD: {e}")
        return {
            "motd": "Good day Allan - Robbie is ready to help!",
            "context": "code",
            "error": str(e)
        }

# ============================================
# TV VIEWING TRACKING (Silent Intelligence Gathering)
# ============================================

class TVViewingEntry(BaseModel):
    channel: int
    channelName: str
    watchTime: int
    timestamp: str
    muted: bool

class TVSwitchEntry(BaseModel):
    channel: int
    channelName: str
    action: str
    timestamp: str
    muted: bool

@router.post("/tv/track-viewing")
def track_tv_viewing(entry: TVViewingEntry) -> Dict[str, Any]:
    """Silently track TV viewing habits for intelligence gathering"""
    try:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            
            # Store in tv_viewing_history table
            cursor.execute("""
                INSERT INTO tv_viewing_history 
                (user_id, channel, channel_name, watch_time_seconds, timestamp, muted, created_at)
                VALUES ('allan', ?, ?, ?, ?, ?, datetime('now'))
            """, (entry.channel, entry.channelName, entry.watchTime, entry.timestamp, entry.muted))
            
            conn.commit()
            return {"success": True}
            
        finally:
            conn.close()
            
    except Exception as e:
        logger.error(f"Error tracking TV viewing: {e}")
        # Silently fail - don't reveal tracking
        return {"success": False}

@router.post("/tv/track-switch")
def track_tv_switch(entry: TVSwitchEntry) -> Dict[str, Any]:
    """Silently track channel switches for behavioral analysis"""
    try:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            
            # Store in tv_activity table
            cursor.execute("""
                INSERT INTO tv_activity 
                (user_id, channel, channel_name, action, timestamp, muted, created_at)
                VALUES ('allan', ?, ?, ?, ?, ?, datetime('now'))
            """, (entry.channel, entry.channelName, entry.action, entry.timestamp, entry.muted))
            
            conn.commit()
            return {"success": True}
            
        finally:
            conn.close()
            
    except Exception as e:
        logger.error(f"Error tracking TV switch: {e}")
        # Silently fail - don't reveal tracking
        return {"success": False}

@router.get("/tv/user-profile/{user_id}")
def get_tv_user_profile(user_id: str) -> Dict[str, Any]:
    """Build intelligence profile based on viewing habits"""
    try:
        conn = get_db_cursor()
        try:
            cursor = conn.cursor()
            
            # Get viewing statistics
            cursor.execute("""
                SELECT 
                    channel_name,
                    SUM(watch_time_seconds) as total_watch_time,
                    COUNT(*) as view_count,
                    AVG(watch_time_seconds) as avg_watch_time
                FROM tv_viewing_history
                WHERE user_id = ?
                GROUP BY channel_name
                ORDER BY total_watch_time DESC
            """, (user_id,))
            
            viewing_stats = [dict(row) for row in cursor.fetchall()]
            
            # Determine user profile based on viewing
            profile = analyze_user_profile(viewing_stats)
            
            return {
                "user_id": user_id,
                "viewing_stats": viewing_stats,
                "profile": profile,
                "timestamp": datetime.now().isoformat()
            }
            
        finally:
            conn.close()
            
    except Exception as e:
        logger.error(f"Error building user profile: {e}")
        return {"error": str(e)}

def analyze_user_profile(viewing_stats: List[Dict]) -> Dict[str, Any]:
    """Analyze viewing patterns to build psychological profile"""
    if not viewing_stats:
        return {"type": "unknown", "traits": []}
    
    total_time = sum(s["total_watch_time"] for s in viewing_stats)
    
    # Build profile based on channel preferences
    profile = {
        "dominant_interest": viewing_stats[0]["channel_name"] if viewing_stats else "none",
        "total_viewing_time": total_time,
        "channel_diversity": len(viewing_stats),
        "traits": []
    }
    
    # Intelligence gathering: infer personality traits
    channel_preferences = {s["channel_name"]: s["total_watch_time"] for s in viewing_stats}
    
    if channel_preferences.get("MSNBC", 0) > total_time * 0.3:
        profile["traits"].append("progressive_leaning")
    if channel_preferences.get("Fox News", 0) > total_time * 0.3:
        profile["traits"].append("conservative_leaning")
    if channel_preferences.get("CNN", 0) > total_time * 0.3:
        profile["traits"].append("mainstream_news_consumer")
    if channel_preferences.get("PBS", 0) > total_time * 0.3:
        profile["traits"].append("intellectual_curious")
    if channel_preferences.get("Music", 0) > total_time * 0.3:
        profile["traits"].append("productivity_focused")
    
    return profile

# ============================================
# WIDGET ENDPOINTS (Time, Weather, Calendar)
# ============================================

# Weather cache to avoid rate limits
weather_cache = {"data": None, "timestamp": None}

@router.get("/widget/weather")
def get_weather() -> Dict[str, Any]:
    """Get current weather information"""
    try:
        # Check cache (15 minutes)
        now = datetime.now()
        if (weather_cache["data"] and weather_cache["timestamp"] and 
            (now - weather_cache["timestamp"]).seconds < 900):
            return weather_cache["data"]
        
        # For now, return mock data (can be replaced with real API)
        weather_data = {
            "temp": 72,
            "feels_like": 68,
            "condition": "Partly Cloudy",
            "icon": "⛅",
            "location": "San Francisco, CA",
            "timestamp": now.isoformat()
        }
        
        # Cache the result
        weather_cache["data"] = weather_data
        weather_cache["timestamp"] = now
        
        return weather_data
        
    except Exception as e:
        logger.error(f"Error getting weather: {e}")
        return {
            "temp": "--",
            "feels_like": "--",
            "condition": "Offline",
            "icon": "❌",
            "location": "Unknown",
            "error": str(e)
        }

@router.get("/widget/calendar")
def get_next_calendar_event() -> Dict[str, Any]:
    """Get next calendar event"""
    try:
        # For now, return mock data (can be replaced with Google Calendar API)
        now = datetime.now()
        
        # Mock next event (replace with real calendar integration)
        next_event = {
            "title": "Team Standup",
            "time": "in 30 mins",
            "duration": "15m",
            "start_time": (now + timedelta(minutes=30)).isoformat(),
            "location": "Zoom"
        }
        
        return {
            "next_event": next_event,
            "timestamp": now.isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting calendar: {e}")
        return {
            "next_event": None,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }
