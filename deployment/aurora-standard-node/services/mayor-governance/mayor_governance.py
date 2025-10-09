#!/usr/bin/env python3
"""
Mayor Governance Service
Handles democratic town governance, banishment votes, and citizen management
"""

import os
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from enum import Enum
import httpx
import redis
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel, Field
import uuid

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(title="Mayor Governance Service", version="1.0.0")

# Configuration
POSTGRES_URL = os.getenv("POSTGRES_URL", "postgresql://aurora_app:aurora_password@aurora-postgres:5432/aurora_unified")
REDIS_URL = os.getenv("REDIS_URL", "redis://:aurora_password@redis-sentinel-aurora:26379")

# Redis client
redis_client = redis.from_url(REDIS_URL, decode_responses=True)

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
    ends_at: datetime
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
    
    async def create_citizen(self, citizen: Citizen) -> Citizen:
        """Create a new citizen"""
        # Store in Redis
        redis_client.hset(
            f"citizen:{citizen.id}",
            mapping=citizen.dict()
        )
        
        self.citizens[citizen.id] = citizen
        logger.info(f"👤 Citizen created: {citizen.name} ({citizen.role}) in town {citizen.town_id}")
        return citizen
    
    async def get_citizen(self, citizen_id: str) -> Optional[Citizen]:
        """Get citizen by ID"""
        if citizen_id in self.citizens:
            return self.citizens[citizen_id]
        
        # Try to load from Redis
        citizen_data = redis_client.hgetall(f"citizen:{citizen_id}")
        if citizen_data:
            citizen = Citizen(**citizen_data)
            self.citizens[citizen_id] = citizen
            return citizen
        
        return None
    
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
        
        # Check for recent banishments (6 months rule)
        recent_banishments = await self.get_recent_banishments_for_target(banishment.target_citizen_id)
        if recent_banishments:
            raise HTTPException(status_code=409, detail="Recent banishment exists for this citizen")
        
        # Check for active banishment
        active_banishment = await self.get_active_banishment_for_target(banishment.target_citizen_id)
        if active_banishment:
            raise HTTPException(status_code=409, detail="Banishment already active for this citizen")
        
        # Set end time (72 hours from start)
        banishment.ends_at = banishment.started_at + timedelta(hours=72)
        
        # Store in Redis
        redis_client.hset(
            f"banishment:{banishment.id}",
            mapping=banishment.dict()
        )
        
        # Store in active banishments
        self.active_banishments[banishment.id] = banishment
        
        # Schedule reminders
        await self._schedule_banishment_reminders(banishment)
        
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
        
        # Check if citizen already voted
        existing_vote = await self.get_vote_by_citizen(vote.citizen_id, vote.banishment_id)
        if existing_vote:
            # Update existing vote
            existing_vote.vote = vote.vote
            existing_vote.voted_at = vote.voted_at
            vote = existing_vote
        else:
            # Store new vote
            redis_client.hset(
                f"vote:{vote.citizen_id}:{vote.banishment_id}",
                mapping=vote.dict()
            )
            self.votes[f"{vote.citizen_id}:{vote.banishment_id}"] = vote
        
        logger.info(f"🗳️ Vote cast: {vote.vote} by {citizen.name} for banishment {vote.banishment_id}")
        return vote
    
    async def get_banishment(self, banishment_id: str) -> Optional[BanishmentVote]:
        """Get banishment by ID"""
        if banishment_id in self.active_banishments:
            return self.active_banishments[banishment_id]
        
        # Try to load from Redis
        banishment_data = redis_client.hgetall(f"banishment:{banishment_id}")
        if banishment_data:
            banishment = BanishmentVote(**banishment_data)
            return banishment
        
        return None
    
    async def get_active_banishment_for_target(self, target_citizen_id: str) -> Optional[BanishmentVote]:
        """Get active banishment for a target citizen"""
        for banishment in self.active_banishments.values():
            if (banishment.target_citizen_id == target_citizen_id and 
                banishment.status == BanishmentStatus.ACTIVE):
                return banishment
        return None
    
    async def get_recent_banishments_for_target(self, target_citizen_id: str) -> List[BanishmentVote]:
        """Get recent banishments for a target citizen (last 6 months)"""
        six_months_ago = datetime.now() - timedelta(days=180)
        recent = []
        
        for banishment in self.active_banishments.values():
            if (banishment.target_citizen_id == target_citizen_id and 
                banishment.started_at > six_months_ago):
                recent.append(banishment)
        
        return recent
    
    async def get_vote_by_citizen(self, citizen_id: str, banishment_id: str) -> Optional[Vote]:
        """Get vote by citizen for specific banishment"""
        vote_key = f"{citizen_id}:{banishment_id}"
        if vote_key in self.votes:
            return self.votes[vote_key]
        
        # Try to load from Redis
        vote_data = redis_client.hgetall(f"vote:{citizen_id}:{banishment_id}")
        if vote_data:
            vote = Vote(**vote_data)
            self.votes[vote_key] = vote
            return vote
        
        return None
    
    async def get_banishment_tally(self, banishment_id: str) -> Dict[str, int]:
        """Get vote tally for a banishment"""
        yes_votes = 0
        no_votes = 0
        
        for vote in self.votes.values():
            if vote.banishment_id == banishment_id:
                if vote.vote == VoteChoice.YES:
                    yes_votes += 1
                elif vote.vote == VoteChoice.NO:
                    no_votes += 1
        
        return {"yes": yes_votes, "no": no_votes}
    
    async def close_banishment(self, banishment_id: str, mayor_id: str) -> Dict[str, Any]:
        """Close a banishment vote (mayor only)"""
        banishment = await self.get_banishment(banishment_id)
        if not banishment:
            raise HTTPException(status_code=404, detail="Banishment not found")
        
        # Verify mayor
        mayor = await self.get_citizen(mayor_id)
        if not mayor or mayor.role != CitizenRole.MAYOR or mayor.town_id != banishment.town_id:
            raise HTTPException(status_code=403, detail="Only mayor can close banishment")
        
        # Get final tally
        tally = await self.get_banishment_tally(banishment_id)
        
        # Determine outcome
        if tally["yes"] > tally["no"]:
            final_decision = "banished"
        elif tally["no"] > tally["yes"]:
            final_decision = "acquitted"
        else:
            final_decision = "tie"
        
        # Update banishment
        banishment.status = BanishmentStatus.CLOSED
        banishment.final_decision = final_decision
        banishment.closed_at = datetime.now()
        
        # Update in Redis
        redis_client.hset(
            f"banishment:{banishment_id}",
            mapping=banishment.dict()
        )
        
        # Remove from active banishments
        if banishment_id in self.active_banishments:
            del self.active_banishments[banishment_id]
        
        logger.info(f"🗳️ Banishment closed: {banishment_id} - Decision: {final_decision}")
        
        return {
            "banishment_id": banishment_id,
            "final_decision": final_decision,
            "tally": tally,
            "closed_at": banishment.closed_at
        }
    
    async def _schedule_banishment_reminders(self, banishment: BanishmentVote):
        """Schedule reminders for banishment vote"""
        # Schedule reminders at 24h, 6h, and 1h before end
        reminder_times = [24, 6, 1]
        
        for hours in reminder_times:
            reminder_time = banishment.ends_at - timedelta(hours=hours)
            if reminder_time > datetime.now():
                reminder_data = {
                    "banishment_id": banishment.id,
                    "reminder_time": reminder_time.isoformat(),
                    "message": f"{hours}h until banishment vote closes"
                }
                redis_client.hset(
                    f"reminder:{banishment.id}:{hours}h",
                    mapping=reminder_data
                )
    
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

@app.post("/api/banishments/{banishment_id}/close")
async def close_banishment(banishment_id: str, mayor_id: str):
    """Close a banishment vote (mayor only)"""
    result = await governance_service.close_banishment(banishment_id, mayor_id)
    return result

@app.get("/api/towns/{town_id}/governance")
async def get_town_governance(town_id: str):
    """Get governance status for a town"""
    status = await governance_service.get_town_governance_status(town_id)
    return status

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8022)
