#!/usr/bin/env python3
"""
Mayor Governance Service - Simplified SQLite Version
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
app = FastAPI(title="Mayor Governance Service", version="1.0.0")

class CitizenRole(str, Enum):
    """Citizen roles in the system"""
    CITIZEN = "citizen"
    MAYOR = "mayor"
    PRESIDENT = "president"

class BanishmentStatus(str, Enum):
    """Banishment vote status"""
    ACTIVE = "active"
    CLOSED = "closed"
    EXPIRED = "expired"

class VoteChoice(str, Enum):
    """Vote choices for banishment"""
    YES = "yes"
    NO = "no"

class Citizen(BaseModel):
    """Citizen model"""
    id: str
    name: str
    email: str
    role: CitizenRole
    town_id: str
    created_at: datetime = Field(default_factory=datetime.now)
    is_active: bool = True

class BanishmentVote(BaseModel):
    """Banishment vote model"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    target_citizen_id: str
    mayor_id: str
    town_id: str
    reason_summary: str
    status: BanishmentStatus = BanishmentStatus.ACTIVE
    started_at: datetime = Field(default_factory=datetime.now)
    ends_at: Optional[datetime] = None
    final_decision: Optional[str] = None
    closed_at: Optional[datetime] = None

class Vote(BaseModel):
    """Individual vote model"""
    citizen_id: str
    banishment_id: str
    vote: VoteChoice
    voted_at: datetime = Field(default_factory=datetime.now)

class MayorGovernanceService:
    """Service for managing mayor governance and banishment votes"""
    
    def __init__(self):
        self.active_banishments = {}
        self.citizens = {}
        self.votes = {}
        self.init_database()
        self.create_sample_data()
    
    def init_database(self):
        """Initialize SQLite database"""
        conn = sqlite3.connect('test.db')
        cursor = conn.cursor()
        
        # Create citizens table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS citizens (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            role TEXT NOT NULL CHECK (role IN ('citizen', 'mayor', 'president')),
            town_id TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            is_active INTEGER DEFAULT 1
        )
        ''')
        
        # Create banishments table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS banishments (
            id TEXT PRIMARY KEY,
            target_citizen_id TEXT NOT NULL,
            mayor_id TEXT NOT NULL,
            town_id TEXT NOT NULL,
            reason_summary TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'active',
            started_at TEXT DEFAULT CURRENT_TIMESTAMP,
            ends_at TEXT NOT NULL,
            final_decision TEXT,
            closed_at TEXT
        )
        ''')
        
        # Create votes table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS banishment_votes (
            id TEXT PRIMARY KEY,
            citizen_id TEXT NOT NULL,
            banishment_id TEXT NOT NULL,
            vote TEXT NOT NULL CHECK (vote IN ('yes', 'no')),
            voted_at TEXT DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(citizen_id, banishment_id)
        )
        ''')
        
        conn.commit()
        conn.close()
        logger.info("✅ Database initialized")
    
    def create_sample_data(self):
        """Create sample data for testing"""
        conn = sqlite3.connect('test.db')
        cursor = conn.cursor()
        
        # Insert Allan as President
        cursor.execute('''
        INSERT OR IGNORE INTO citizens (id, name, email, role, town_id) 
        VALUES (?, ?, ?, ?, ?)
        ''', ('550e8400-e29b-41d4-a716-446655440000', 'Allan Peretz', 'allan@testpilotcpg.com', 'president', 'aurora'))
        
        # Insert Mayor Johnson
        cursor.execute('''
        INSERT OR IGNORE INTO citizens (id, name, email, role, town_id) 
        VALUES (?, ?, ?, ?, ?)
        ''', ('550e8400-e29b-41d4-a716-446655440001', 'Mayor Johnson', 'mayor.johnson@aurora.local', 'mayor', 'aurora'))
        
        # Insert sample citizens
        cursor.execute('''
        INSERT OR IGNORE INTO citizens (id, name, email, role, town_id) 
        VALUES (?, ?, ?, ?, ?)
        ''', ('550e8400-e29b-41d4-a716-446655440002', 'Alice Citizen', 'alice@aurora.local', 'citizen', 'aurora'))
        
        cursor.execute('''
        INSERT OR IGNORE INTO citizens (id, name, email, role, town_id) 
        VALUES (?, ?, ?, ?, ?)
        ''', ('550e8400-e29b-41d4-a716-446655440003', 'Bob Resident', 'bob@aurora.local', 'citizen', 'aurora'))
        
        conn.commit()
        conn.close()
        
        # Load citizens into memory
        self.load_citizens()
        logger.info("✅ Sample data created")
    
    def load_citizens(self):
        """Load citizens from database into memory"""
        conn = sqlite3.connect('test.db')
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM citizens WHERE is_active = 1')
        
        for row in cursor.fetchall():
            citizen = Citizen(
                id=row[0],
                name=row[1],
                email=row[2],
                role=row[3],
                town_id=row[4],
                created_at=datetime.fromisoformat(row[5]) if row[5] else datetime.now(),
                is_active=bool(row[6])
            )
            self.citizens[citizen.id] = citizen
        
        conn.close()
    
    async def create_citizen(self, citizen: Citizen) -> Citizen:
        """Create a new citizen"""
        # Store in SQLite
        conn = sqlite3.connect('test.db')
        cursor = conn.cursor()
        cursor.execute('''
        INSERT INTO citizens (id, name, email, role, town_id, created_at, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (citizen.id, citizen.name, citizen.email, citizen.role, citizen.town_id, 
              citizen.created_at.isoformat(), 1 if citizen.is_active else 0))
        conn.commit()
        conn.close()
        
        self.citizens[citizen.id] = citizen
        logger.info(f"👤 Citizen created: {citizen.name} ({citizen.role}) in town {citizen.town_id}")
        return citizen
    
    async def get_citizen(self, citizen_id: str) -> Optional[Citizen]:
        """Get citizen by ID"""
        return self.citizens.get(citizen_id)
    
    async def get_town_citizens(self, town_id: str) -> List[Citizen]:
        """Get all citizens in a town"""
        citizens = []
        for citizen in self.citizens.values():
            if citizen.town_id == town_id:
                citizens.append(citizen)
        return citizens
    
    async def create_banishment_vote(self, banishment: BanishmentVote) -> BanishmentVote:
        """Create a new banishment vote (mayor only)"""
        # Verify mayor
        mayor = await self.get_citizen(banishment.mayor_id)
        if not mayor or mayor.role != CitizenRole.MAYOR or mayor.town_id != banishment.town_id:
            raise HTTPException(status_code=403, detail="Only mayor of town can initiate banishment")
        
        # Verify target exists
        target = await self.get_citizen(banishment.target_citizen_id)
        if not target or target.town_id != banishment.town_id:
            raise HTTPException(status_code=404, detail="Target citizen not found in town")
        
        # Cannot target mayors or president
        if target.role in [CitizenRole.MAYOR, CitizenRole.PRESIDENT]:
            raise HTTPException(status_code=403, detail="Cannot target mayor or president")
        
        # Set end time (72 hours from start)
        banishment.ends_at = banishment.started_at + timedelta(hours=72)
        
        # Store in SQLite
        conn = sqlite3.connect('test.db')
        cursor = conn.cursor()
        cursor.execute('''
        INSERT INTO banishments 
        (id, target_citizen_id, mayor_id, town_id, reason_summary, status, started_at, ends_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (banishment.id, banishment.target_citizen_id, banishment.mayor_id, 
              banishment.town_id, banishment.reason_summary, banishment.status.value,
              banishment.started_at.isoformat(), banishment.ends_at.isoformat()))
        conn.commit()
        conn.close()
        
        # Store in active banishments
        self.active_banishments[banishment.id] = banishment
        
        logger.info(f"🗳️ Banishment vote created: {banishment.target_citizen_id} by mayor {banishment.mayor_id}")
        return banishment
    
    async def cast_vote(self, vote: Vote) -> Vote:
        """Cast a vote in a banishment"""
        # Verify citizen exists
        citizen = await self.get_citizen(vote.citizen_id)
        if not citizen:
            raise HTTPException(status_code=404, detail="Citizen not found")
        
        # Verify banishment exists and is active
        banishment = await self.get_banishment(vote.banishment_id)
        if not banishment:
            raise HTTPException(status_code=404, detail="Banishment not found")
        
        if banishment.status != BanishmentStatus.ACTIVE:
            raise HTTPException(status_code=400, detail="Banishment is not active")
        
        if datetime.now() > banishment.ends_at:
            raise HTTPException(status_code=400, detail="Voting period has ended")
        
        # Verify citizen is in same town
        if citizen.town_id != banishment.town_id:
            raise HTTPException(status_code=403, detail="Citizen not in same town as banishment")
        
        # Store vote in SQLite
        conn = sqlite3.connect('test.db')
        cursor = conn.cursor()
        cursor.execute('''
        INSERT OR REPLACE INTO banishment_votes 
        (id, citizen_id, banishment_id, vote, voted_at)
        VALUES (?, ?, ?, ?, ?)
        ''', (str(uuid.uuid4()), vote.citizen_id, vote.banishment_id, 
              vote.vote.value, vote.voted_at.isoformat()))
        conn.commit()
        conn.close()
        
        # Store in memory
        vote_key = f"{vote.citizen_id}:{vote.banishment_id}"
        self.votes[vote_key] = vote
        
        logger.info(f"🗳️ Vote cast: {vote.vote} by {citizen.name} for banishment {vote.banishment_id}")
        return vote
    
    async def get_banishment(self, banishment_id: str) -> Optional[BanishmentVote]:
        """Get banishment by ID"""
        if banishment_id in self.active_banishments:
            return self.active_banishments[banishment_id]
        
        # Try to load from database
        conn = sqlite3.connect('test.db')
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM banishments WHERE id = ?', (banishment_id,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            banishment = BanishmentVote(
                id=row[0],
                target_citizen_id=row[1],
                mayor_id=row[2],
                town_id=row[3],
                reason_summary=row[4],
                status=BanishmentStatus(row[5]),
                started_at=datetime.fromisoformat(row[6]),
                ends_at=datetime.fromisoformat(row[7]),
                final_decision=row[8],
                closed_at=datetime.fromisoformat(row[9]) if row[9] else None
            )
            return banishment
        
        return None
    
    async def get_banishment_tally(self, banishment_id: str) -> Dict[str, int]:
        """Get vote tally for a banishment"""
        conn = sqlite3.connect('test.db')
        cursor = conn.cursor()
        cursor.execute('''
        SELECT vote, COUNT(*) as count 
        FROM banishment_votes 
        WHERE banishment_id = ? 
        GROUP BY vote
        ''', (banishment_id,))
        
        yes_votes = 0
        no_votes = 0
        
        for row in cursor.fetchall():
            if row[0] == 'yes':
                yes_votes = row[1]
            elif row[0] == 'no':
                no_votes = row[1]
        
        conn.close()
        return {"yes": yes_votes, "no": no_votes}
    
    async def get_town_governance_status(self, town_id: str) -> Dict[str, Any]:
        """Get governance status for a town"""
        citizens = await self.get_town_citizens(town_id)
        active_banishments = [b for b in self.active_banishments.values() if b.town_id == town_id]
        
        return {
            "town_id": town_id,
            "total_citizens": len(citizens),
            "mayors": len([c for c in citizens if c.role == CitizenRole.MAYOR]),
            "active_banishments": len(active_banishments),
            "citizens": [citizen.dict() for citizen in citizens]
        }

# Initialize service
governance_service = MayorGovernanceService()

@app.on_event("startup")
async def startup():
    """Initialize Mayor Governance service"""
    logger.info("🏛️ Mayor Governance Service starting...")
    logger.info("✅ Mayor Governance Service ready")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "mayor-governance",
        "active_banishments": len(governance_service.active_banishments),
        "total_citizens": len(governance_service.citizens)
    }

@app.post("/api/citizens")
async def create_citizen(citizen: Citizen):
    """Create a new citizen"""
    created_citizen = await governance_service.create_citizen(citizen)
    return {"message": "Citizen created", "citizen": created_citizen.dict()}

@app.get("/api/citizens/{citizen_id}")
async def get_citizen(citizen_id: str):
    """Get citizen by ID"""
    citizen = await governance_service.get_citizen(citizen_id)
    if citizen:
        return citizen.dict()
    else:
        raise HTTPException(status_code=404, detail="Citizen not found")

@app.get("/api/towns/{town_id}/citizens")
async def get_town_citizens(town_id: str):
    """Get all citizens in a town"""
    citizens = await governance_service.get_town_citizens(town_id)
    return {"citizens": [citizen.dict() for citizen in citizens]}

@app.post("/api/banishments")
async def create_banishment(banishment: BanishmentVote):
    """Create a banishment vote (mayor only)"""
    created_banishment = await governance_service.create_banishment_vote(banishment)
    return {"message": "Banishment vote created", "banishment": created_banishment.dict()}

@app.get("/api/banishments/{banishment_id}")
async def get_banishment(banishment_id: str):
    """Get banishment by ID"""
    banishment = await governance_service.get_banishment(banishment_id)
    if banishment:
        return banishment.dict()
    else:
        raise HTTPException(status_code=404, detail="Banishment not found")

@app.post("/api/votes")
async def cast_vote(vote: Vote):
    """Cast a vote in a banishment"""
    casted_vote = await governance_service.cast_vote(vote)
    return {"message": "Vote cast", "vote": casted_vote.dict()}

@app.get("/api/banishments/{banishment_id}/tally")
async def get_banishment_tally(banishment_id: str):
    """Get vote tally for a banishment"""
    tally = await governance_service.get_banishment_tally(banishment_id)
    return {"banishment_id": banishment_id, "tally": tally}

@app.get("/api/towns/{town_id}/governance")
async def get_town_governance(town_id: str):
    """Get governance status for a town"""
    status = await governance_service.get_town_governance_status(town_id)
    return status

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8022)
