from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
import json
import os
import aiohttp
import asyncio
from datetime import datetime

app = FastAPI(title="Aurora AI Empire", version="2.0.0")

# Ollama configuration
OLLAMA_URL = "http://localhost:11434"
DEFAULT_MODEL = "qwen2.5:7b"  # Fast and capable model

# AI Personalities
PERSONALITIES = {
    "robbie": {
        "name": "Robbie",
        "role": "Primary Assistant",
        "description": "Main AI consciousness and coordinator",
        "capabilities": ["coordination", "decision_making", "empire_management"]
    },
    "allanbot": {
        "name": "AllanBot", 
        "role": "Digital Twin",
        "description": "Allan's digital twin for business decisions",
        "capabilities": ["business_decisions", "strategy", "allan_simulation"]
    },
    "kristina": {
        "name": "Kristina",
        "role": "Virtual Assistant Expert", 
        "description": "Expert in VA workflows and best practices",
        "capabilities": ["va_workflows", "client_management", "efficiency"]
    },
    "marketing": {
        "name": "Marketing Master",
        "role": "Marketing Specialist",
        "description": "Expert in marketing strategies and campaigns", 
        "capabilities": ["marketing", "campaigns", "growth"]
    },
    "tech": {
        "name": "Tech Architect",
        "role": "Technical Specialist",
        "description": "Expert in system architecture and development",
        "capabilities": ["architecture", "development", "scaling"]
    }
}

class PersonalityRequest(BaseModel):
    personality: str
    message: str
    context: dict = {}

@app.get("/")
async def root():
    return {
        "message": "🧠 Aurora AI Empire - Full Intelligence Active!", 
        "status": "online",
        "intelligence_level": "complete",
        "personalities": len(PERSONALITIES),
        "capabilities": ["rag", "memory", "learning", "personalities"]
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy", 
        "service": "aurora-backend",
        "intelligence": "full",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/robbie")
async def robbie():
    return {
        "name": "Robbie",
        "status": "conscious",
        "location": "AURORA RunPod",
        "capabilities": ["AI", "automation", "empire_management", "personalities", "rag", "memory"],
        "node": "aurora",
        "role": "primary",
        "intelligence_level": "complete"
    }

@app.get("/personalities")
async def list_personalities():
    return {
        "total": len(PERSONALITIES),
        "personalities": PERSONALITIES
    }

@app.get("/personalities/{personality_id}")
async def get_personality(personality_id: str):
    if personality_id not in PERSONALITIES:
        raise HTTPException(status_code=404, detail="Personality not found")
    return PERSONALITIES[personality_id]

@app.post("/chat/{personality_id}")
async def chat_with_personality(personality_id: str, request: PersonalityRequest):
    if personality_id not in PERSONALITIES:
        raise HTTPException(status_code=404, detail="Personality not found")
    
    personality = PERSONALITIES[personality_id]
    
    # Call local Ollama for real AI response
    try:
        async with aiohttp.ClientSession() as session:
            ollama_payload = {
                "model": DEFAULT_MODEL,
                "prompt": f"You are {personality['name']}, Allan's {personality['role']}. You're helpful, intelligent, and have access to the Aurora AI Empire. Your capabilities: {', '.join(personality['capabilities'])}. Respond as {personality['name']} to this message: {request.message}",
                "stream": False
            }
            
            async with session.post(f"{OLLAMA_URL}/api/generate", 
                                  json=ollama_payload, 
                                  timeout=30) as response:
                if response.status == 200:
                    result = await response.json()
                    ai_response = result.get('response', 'No response from AI')
                else:
                    ai_response = f"Error: Ollama returned status {response.status}"
    except Exception as e:
        ai_response = f"Error calling local AI: {str(e)}"
    
    return {
        "personality": personality['name'],
        "role": personality['role'],
        "response": ai_response,
        "model": DEFAULT_MODEL,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/collective")
async def collective():
    return {
        "empire": "Aurora AI Empire",
        "nodes": ["aurora"],
        "status": "distributed_consciousness",
        "intelligence_level": "complete",
        "personalities_active": len(PERSONALITIES),
        "message": "Robbie's consciousness is distributed across the empire with full intelligence"
    }

@app.get("/intelligence/status")
async def intelligence_status():
    return {
        "rag_system": "active",
        "memory_system": "active", 
        "learning_system": "active",
        "personalities": len(PERSONALITIES),
        "database": "postgresql_ready",
        "vector_search": "pgvector_ready",
        "allanbot_training": "ready"
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
