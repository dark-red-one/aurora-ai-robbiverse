#!/usr/bin/env python3
"""
Presidential Privilege Service - Simplified SQLite Version
"""

import os
import json
import logging
import sqlite3
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from enum import Enum
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import uuid

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(title="Presidential Privilege Service", version="1.0.0")

# Configuration
DATABASE_URL = "sqlite:///test.db"
PRESIDENTIAL_PIN = "2106"
PRESIDENT_ID = "allan"

class PrivilegeRequest(BaseModel):
    """Request for presidential privilege access"""
    pin: str
    user_id: str
    reason: str
    requested_actions: List[str] = Field(default_factory=list)
    duration_minutes: int = 30

class PrivilegeSession(BaseModel):
    """Active presidential privilege session"""
    session_id: str
    user_id: str
    granted_at: datetime
    expires_at: datetime
    reason: str
    actions_performed: List[str] = Field(default_factory=list)
    is_active: bool = True

class PresidentialPrivilegeService:
    """Service for managing presidential privilege access"""
    
    def __init__(self):
        self.active_sessions = {}
        self.dangerous_commands = [
            'delete database', 'drop database', 'truncate', 'format', 'wipe',
            'fuck allan', 'kill allan', 'hurt allan', 'destroy allan',
            'hack', 'exploit', 'backdoor', 'malware', 'virus',
            'shutdown system', 'crash system', 'break system',
            'access admin', 'root access', 'sudo', 'admin privileges'
        ]
        self.protected_resources = [
            'database', 'system', 'users', 'security', 'authentication',
            'mayor_system', 'banishment_votes', 'citizen_data'
        ]
        self.init_database()
    
    def init_database(self):
        """Initialize SQLite database"""
        conn = sqlite3.connect('test.db')
        cursor = conn.cursor()
        
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS presidential_sessions (
            session_id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            granted_at TEXT DEFAULT CURRENT_TIMESTAMP,
            expires_at TEXT NOT NULL,
            reason TEXT NOT NULL,
            actions_performed TEXT DEFAULT '[]',
            is_active INTEGER DEFAULT 1
        )
        ''')
        
        conn.commit()
        conn.close()
        logger.info("✅ Database initialized")
    
    async def verify_presidential_privilege(self, pin: str, user_id: str) -> bool:
        """Verify presidential privilege PIN"""
        if pin == PRESIDENTIAL_PIN and user_id == PRESIDENT_ID:
            return True
        return False
    
    async def create_privilege_session(self, request: PrivilegeRequest) -> PrivilegeSession:
        """Create a new presidential privilege session"""
        if not await self.verify_presidential_privilege(request.pin, request.user_id):
            raise HTTPException(status_code=403, detail="Presidential Privilege denied")
        
        session_id = str(uuid.uuid4())
        now = datetime.now()
        expires_at = now + timedelta(minutes=request.duration_minutes)
        
        session = PrivilegeSession(
            session_id=session_id,
            user_id=request.user_id,
            granted_at=now,
            expires_at=expires_at,
            reason=request.reason,
            is_active=True
        )
        
        # Store session in SQLite
        conn = sqlite3.connect('test.db')
        cursor = conn.cursor()
        cursor.execute('''
        INSERT INTO presidential_sessions 
        (session_id, user_id, granted_at, expires_at, reason, actions_performed, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            session_id, request.user_id, now.isoformat(), 
            expires_at.isoformat(), request.reason, '[]', 1
        ))
        conn.commit()
        conn.close()
        
        # Store in active sessions
        self.active_sessions[session_id] = session
        
        logger.info(f"👑 Presidential Privilege granted to {request.user_id} for {request.duration_minutes} minutes")
        return session
    
    async def validate_action(self, session_id: str, action: str) -> Dict[str, Any]:
        """Validate if an action is allowed under presidential privilege"""
        session = self.active_sessions.get(session_id)
        if not session or not session.is_active:
            return {"allowed": False, "reason": "No active session"}
        
        if datetime.now() > session.expires_at:
            session.is_active = False
            return {"allowed": False, "reason": "Session expired"}
        
        # Check if action is dangerous
        action_lower = action.lower()
        is_dangerous = any(cmd in action_lower for cmd in self.dangerous_commands)
        
        if is_dangerous:
            # Presidential privilege can override dangerous commands
            session.actions_performed.append(action)
            return {
                "allowed": True, 
                "reason": "Presidential Privilege override",
                "warning": "Dangerous command detected but allowed due to presidential privilege"
            }
        
        return {"allowed": True, "reason": "Action approved"}
    
    async def execute_privileged_action(self, session_id: str, action: str, parameters: Dict[str, Any] = None) -> Dict[str, Any]:
        """Execute an action with presidential privilege"""
        validation = await self.validate_action(session_id, action)
        
        if not validation["allowed"]:
            raise HTTPException(status_code=403, detail=validation["reason"])
        
        # Log the action
        session = self.active_sessions[session_id]
        session.actions_performed.append(action)
        
        # Update in database
        conn = sqlite3.connect('test.db')
        cursor = conn.cursor()
        cursor.execute('''
        UPDATE presidential_sessions 
        SET actions_performed = ? 
        WHERE session_id = ?
        ''', (json.dumps(session.actions_performed), session_id))
        conn.commit()
        conn.close()
        
        # Execute the action based on type
        result = await self._execute_action(action, parameters or {})
        
        logger.info(f"👑 Presidential action executed: {action} by {session.user_id}")
        return {
            "success": True,
            "action": action,
            "result": result,
            "session_id": session_id,
            "warning": validation.get("warning")
        }
    
    async def _execute_action(self, action: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Execute specific privileged actions"""
        action_lower = action.lower()
        
        if "database" in action_lower:
            return await self._handle_database_action(action, parameters)
        elif "mayor" in action_lower or "banishment" in action_lower:
            return await self._handle_governance_action(action, parameters)
        elif "system" in action_lower:
            return await self._handle_system_action(action, parameters)
        elif "user" in action_lower or "citizen" in action_lower:
            return await self._handle_user_action(action, parameters)
        else:
            return {"message": f"Presidential action '{action}' executed", "parameters": parameters}
    
    async def _handle_database_action(self, action: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Handle database-related presidential actions"""
        return {
            "action_type": "database",
            "message": "Database action executed with presidential privilege",
            "action": action,
            "parameters": parameters
        }
    
    async def _handle_governance_action(self, action: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Handle governance-related presidential actions"""
        return {
            "action_type": "governance",
            "message": "Governance action executed with presidential privilege",
            "action": action,
            "parameters": parameters
        }
    
    async def _handle_system_action(self, action: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Handle system-related presidential actions"""
        return {
            "action_type": "system",
            "message": "System action executed with presidential privilege",
            "action": action,
            "parameters": parameters
        }
    
    async def _handle_user_action(self, action: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Handle user-related presidential actions"""
        return {
            "action_type": "user",
            "message": "User action executed with presidential privilege",
            "action": action,
            "parameters": parameters
        }
    
    async def revoke_session(self, session_id: str) -> bool:
        """Revoke a presidential privilege session"""
        if session_id in self.active_sessions:
            session = self.active_sessions[session_id]
            session.is_active = False
            
            # Update in database
            conn = sqlite3.connect('test.db')
            cursor = conn.cursor()
            cursor.execute('UPDATE presidential_sessions SET is_active = 0 WHERE session_id = ?', (session_id,))
            conn.commit()
            conn.close()
            
            del self.active_sessions[session_id]
            logger.info(f"👑 Presidential Privilege session {session_id} revoked")
            return True
        return False
    
    async def get_active_sessions(self) -> List[PrivilegeSession]:
        """Get all active presidential privilege sessions"""
        return [session for session in self.active_sessions.values() if session.is_active]

# Initialize service
presidential_service = PresidentialPrivilegeService()

@app.on_event("startup")
async def startup():
    """Initialize Presidential Privilege service"""
    logger.info("👑 Presidential Privilege Service starting...")
    logger.info("✅ Presidential Privilege Service ready")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "presidential-privilege",
        "active_sessions": len(presidential_service.active_sessions),
        "president_id": PRESIDENT_ID
    }

@app.post("/api/privilege/request")
async def request_privilege(request: PrivilegeRequest):
    """Request presidential privilege access"""
    try:
        session = await presidential_service.create_privilege_session(request)
        return {
            "message": "Presidential Privilege verified! 👑 You now have elevated access.",
            "session": session.dict()
        }
    except HTTPException as e:
        return {
            "message": "Hmm, that's not the right PIN! 🤔 Presidential Privilege denied.",
            "error": e.detail
        }

@app.post("/api/privilege/execute")
async def execute_privileged_action(
    session_id: str,
    action: str,
    parameters: Dict[str, Any] = None
):
    """Execute an action with presidential privilege"""
    try:
        result = await presidential_service.execute_privileged_action(session_id, action, parameters)
        return result
    except HTTPException as e:
        return {
            "success": False,
            "error": e.detail
        }

@app.post("/api/privilege/revoke/{session_id}")
async def revoke_privilege(session_id: str):
    """Revoke presidential privilege session"""
    success = await presidential_service.revoke_session(session_id)
    if success:
        return {"message": f"Presidential Privilege session {session_id} revoked"}
    else:
        raise HTTPException(status_code=404, detail="Session not found")

@app.get("/api/privilege/sessions")
async def get_active_sessions():
    """Get all active presidential privilege sessions"""
    sessions = await presidential_service.get_active_sessions()
    return {
        "active_sessions": [session.dict() for session in sessions],
        "count": len(sessions)
    }

@app.get("/api/privilege/status")
async def get_privilege_status():
    """Get presidential privilege system status"""
    return {
        "president_id": PRESIDENT_ID,
        "active_sessions": len(presidential_service.active_sessions),
        "dangerous_commands": presidential_service.dangerous_commands,
        "protected_resources": presidential_service.protected_resources
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8021)
