"""
RobbieBar API Routes
====================
Backend for robbiebar web interface at /code
Provides personality, system stats, git commands, and more
"""

import os
import subprocess
import psutil
from datetime import datetime
from typing import Dict, List, Any, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import asyncpg
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/code/api", tags=["robbiebar"])

# Database connection string from environment
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://robbie:fun2Gus!!!@localhost:5432/robbieverse"
)

# Git repository path (adjust per server)
GIT_REPO_PATH = os.getenv(
    "GIT_REPO_PATH",
    "/home/allan/robbie_workspace/combined/aurora-ai-robbiverse"
)

# ============================================
# PYDANTIC MODELS
# ============================================

class MoodUpdate(BaseModel):
    mood: str

class GitCommitRequest(BaseModel):
    message: Optional[str] = None

# ============================================
# DATABASE HELPERS
# ============================================

async def get_db_connection():
    """Get database connection"""
    return await asyncpg.connect(DATABASE_URL)

# ============================================
# PERSONALITY ENDPOINTS
# ============================================

@router.get("/personality")
async def get_personality() -> Dict[str, Any]:
    """Get current Robbie personality state from database"""
    try:
        conn = await get_db_connection()
        try:
            # Query personality state (handle missing columns gracefully)
            try:
                row = await conn.fetchrow("""
                    SELECT 
                        current_mood,
                        attraction_level,
                        gandhi_genghis_level,
                        updated_at
                    FROM robbie_personality_state
                    WHERE user_id = 'allan' AND personality_name = 'robbie'
                    LIMIT 1
                """)
            except Exception as e:
                logger.warning(f"Error querying personality: {e}")
                row = None
            
            if not row:
                # Return default if no data
                return {
                    "mood": "focused",
                    "attraction": 8,
                    "gandhi_genghis": 7,
                    "energy": 50,
                    "updated_at": datetime.now().isoformat()
                }
            
            return {
                "mood": row["current_mood"],
                "attraction": row["attraction_level"],
                "gandhi_genghis": row["gandhi_genghis_level"],
                "energy": 50,  # Default energy level (column may not exist yet)
                "updated_at": row["updated_at"].isoformat() if row["updated_at"] else None
            }
        finally:
            await conn.close()
            
    except Exception as e:
        logger.error(f"Error fetching personality: {e}")
        # Return defaults on error
        return {
            "mood": "focused",
            "attraction": 8,
            "gandhi_genghis": 7,
            "energy": 50,
            "error": str(e)
        }

@router.put("/personality/mood")
async def update_mood(update: MoodUpdate) -> Dict[str, Any]:
    """Update Robbie's current mood"""
    valid_moods = ["friendly", "focused", "playful", "bossy", "surprised", "blushing"]
    
    if update.mood not in valid_moods:
        raise HTTPException(status_code=400, detail=f"Invalid mood. Must be one of: {valid_moods}")
    
    try:
        conn = await get_db_connection()
        try:
            await conn.execute("""
                UPDATE robbie_personality_state
                SET current_mood = $1, updated_at = NOW()
                WHERE user_id = 'allan' AND personality_name = 'robbie'
            """, update.mood)
            
            return {
                "success": True,
                "mood": update.mood,
                "updated_at": datetime.now().isoformat()
            }
        finally:
            await conn.close()
            
    except Exception as e:
        logger.error(f"Error updating mood: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# SYSTEM STATS ENDPOINTS
# ============================================

@router.get("/system/stats")
async def get_system_stats() -> Dict[str, Any]:
    """Get real-time system resource usage"""
    try:
        # CPU usage
        cpu_percent = psutil.cpu_percent(interval=0.1)
        
        # Memory usage
        memory = psutil.virtual_memory()
        memory_percent = memory.percent
        
        # GPU usage (if available)
        gpu_percent = 0
        try:
            # Try nvidia-smi for NVIDIA GPUs
            result = subprocess.run(
                ["nvidia-smi", "--query-gpu=utilization.gpu", "--format=csv,noheader,nounits"],
                capture_output=True,
                text=True,
                timeout=1
            )
            if result.returncode == 0:
                gpu_percent = float(result.stdout.strip().split("\n")[0])
        except:
            # No GPU or nvidia-smi not available
            pass
        
        return {
            "cpu": round(cpu_percent, 1),
            "memory": round(memory_percent, 1),
            "gpu": round(gpu_percent, 1),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting system stats: {e}")
        return {
            "cpu": 0,
            "memory": 0,
            "gpu": 0,
            "error": str(e)
        }

# ============================================
# GIT ENDPOINTS
# ============================================

@router.get("/git/status")
async def get_git_status() -> Dict[str, Any]:
    """Get current git status"""
    try:
        os.chdir(GIT_REPO_PATH)
        
        # Get current branch
        branch_result = subprocess.run(
            ["git", "branch", "--show-current"],
            capture_output=True,
            text=True,
            timeout=5
        )
        branch = branch_result.stdout.strip() if branch_result.returncode == 0 else "unknown"
        
        # Get modified files count
        status_result = subprocess.run(
            ["git", "status", "--porcelain"],
            capture_output=True,
            text=True,
            timeout=5
        )
        modified_count = len(status_result.stdout.strip().split("\n")) if status_result.stdout.strip() else 0
        
        # Get ahead/behind status
        ahead_behind = subprocess.run(
            ["git", "rev-list", "--left-right", "--count", "HEAD...@{u}"],
            capture_output=True,
            text=True,
            timeout=5
        )
        ahead, behind = 0, 0
        if ahead_behind.returncode == 0 and ahead_behind.stdout.strip():
            parts = ahead_behind.stdout.strip().split()
            ahead = int(parts[0]) if len(parts) > 0 else 0
            behind = int(parts[1]) if len(parts) > 1 else 0
        
        return {
            "branch": branch,
            "modified_files": modified_count,
            "ahead": ahead,
            "behind": behind,
            "clean": modified_count == 0,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting git status: {e}")
        return {
            "branch": "unknown",
            "modified_files": 0,
            "ahead": 0,
            "behind": 0,
            "clean": True,
            "error": str(e)
        }

@router.post("/git/quick-commit")
async def quick_commit(request: GitCommitRequest) -> Dict[str, Any]:
    """Quick commit all changes and push"""
    try:
        os.chdir(GIT_REPO_PATH)
        
        # Check if there are changes
        status_result = subprocess.run(
            ["git", "status", "--porcelain"],
            capture_output=True,
            text=True,
            timeout=5
        )
        
        if not status_result.stdout.strip():
            return {
                "success": True,
                "message": "No changes to commit",
                "skipped": True
            }
        
        # Add all changes
        subprocess.run(["git", "add", "-A"], check=True, timeout=10)
        
        # Commit with message
        commit_message = request.message or f"Quick commit from robbiebar - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        subprocess.run(
            ["git", "commit", "-m", commit_message],
            check=True,
            timeout=10,
            capture_output=True
        )
        
        # Push to origin
        push_result = subprocess.run(
            ["git", "push", "origin", "main"],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if push_result.returncode != 0:
            # Try 'master' if 'main' fails
            push_result = subprocess.run(
                ["git", "push", "origin", "master"],
                capture_output=True,
                text=True,
                timeout=30
            )
        
        return {
            "success": push_result.returncode == 0,
            "message": commit_message,
            "output": push_result.stdout + push_result.stderr,
            "timestamp": datetime.now().isoformat()
        }
        
    except subprocess.CalledProcessError as e:
        logger.error(f"Git command failed: {e}")
        return {
            "success": False,
            "error": f"Git command failed: {e}",
            "output": e.stderr if hasattr(e, 'stderr') else str(e)
        }
    except Exception as e:
        logger.error(f"Error in quick commit: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/git/recent")
async def get_recent_commits() -> Dict[str, Any]:
    """Get recent commits"""
    try:
        os.chdir(GIT_REPO_PATH)
        
        # Get last 5 commits
        result = subprocess.run(
            ["git", "log", "--oneline", "-5", "--format=%h|%s|%ar"],
            capture_output=True,
            text=True,
            timeout=5
        )
        
        commits = []
        if result.returncode == 0 and result.stdout.strip():
            for line in result.stdout.strip().split("\n"):
                if "|" in line:
                    hash, message, time = line.split("|", 2)
                    commits.append({
                        "hash": hash.strip(),
                        "message": message.strip(),
                        "time": time.strip()
                    })
        
        return {
            "commits": commits,
            "count": len(commits)
        }
        
    except Exception as e:
        logger.error(f"Error getting recent commits: {e}")
        return {
            "commits": [],
            "count": 0,
            "error": str(e)
        }

# ============================================
# CONVERSATIONS ENDPOINT
# ============================================

@router.get("/conversations/recent")
async def get_recent_conversations() -> Dict[str, Any]:
    """Get recent conversations from database"""
    try:
        conn = await get_db_connection()
        try:
            rows = await conn.fetch("""
                SELECT 
                    id,
                    title,
                    context_type,
                    updated_at,
                    message_count
                FROM conversations
                WHERE user_id = 'allan'
                ORDER BY updated_at DESC
                LIMIT 5
            """)
            
            conversations = []
            for row in rows:
                conversations.append({
                    "id": str(row["id"]),
                    "title": row["title"],
                    "context_type": row["context_type"],
                    "updated_at": row["updated_at"].isoformat() if row["updated_at"] else None,
                    "message_count": row["message_count"] or 0
                })
            
            return {
                "conversations": conversations,
                "count": len(conversations)
            }
        finally:
            await conn.close()
            
    except Exception as e:
        logger.error(f"Error fetching conversations: {e}")
        return {
            "conversations": [],
            "count": 0,
            "error": str(e)
        }

# ============================================
# ACTIVE USERS (Future: track who's online)
# ============================================

@router.get("/users/active")
async def get_active_users() -> Dict[str, Any]:
    """Get currently active users"""
    # For now, just return Allan
    # Future: track active sessions in database or Redis
    return {
        "users": ["Allan"],
        "count": 1,
        "timestamp": datetime.now().isoformat()
    }

