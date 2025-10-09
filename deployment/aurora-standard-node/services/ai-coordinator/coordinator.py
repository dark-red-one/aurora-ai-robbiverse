#!/usr/bin/env python3
"""
Aurora AI Coordinator - MCP-like Protocol for AI Services
Central hub that coordinates specialized AI services using a common protocol
"""

import os
import json
import logging
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union
from enum import Enum
import psycopg2
from psycopg2.extras import RealDictCursor
import redis
import httpx
import websockets
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uuid

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(title="Aurora AI Coordinator - MCP-like Protocol")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

# Redis client for service registry and caching
redis_client = redis.Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    password=REDIS_PASSWORD if REDIS_PASSWORD else None,
    decode_responses=True
)

# MCP Protocol Models
class ServiceCapability(str, Enum):
    """Available AI service capabilities"""
    CHAT_COMPLETION = "chat_completion"
    TEXT_GENERATION = "text_generation"
    FACT_EXTRACTION = "fact_extraction"
    MOOD_ANALYSIS = "mood_analysis"
    TASK_MANAGEMENT = "task_management"
    MEMORY_SEARCH = "memory_search"
    MEMORY_STORAGE = "memory_storage"
    EMAIL_PROCESSING = "email_processing"
    CALENDAR_MANAGEMENT = "calendar_management"
    SLACK_INTEGRATION = "slack_integration"
    GITHUB_INTEGRATION = "github_integration"
    PRIORITY_SURFACING = "priority_surfacing"
    SAFETY_CHECK = "safety_check"
    ENRICHMENT = "enrichment"
    CUSTOM_WRITING = "custom_writing"


class ServiceInfo(BaseModel):
    """Information about a registered AI service"""
    service_id: str
    name: str
    capabilities: List[ServiceCapability]
    endpoint: str
    health_endpoint: str
    priority: int = 5  # Higher priority services are preferred
    metadata: Dict = Field(default_factory=dict)


class MCPRequest(BaseModel):
    """MCP protocol request"""
    request_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    capability: ServiceCapability
    payload: Dict
    context: Dict = Field(default_factory=dict)
    timeout: int = 30
    priority: int = 5


class MCPResponse(BaseModel):
    """MCP protocol response"""
    request_id: str
    success: bool
    result: Any
    error: Optional[str] = None
    metadata: Dict = Field(default_factory=dict)
    execution_time_ms: float


class AIRequest(BaseModel):
    """High-level AI request for the coordinator"""
    request_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    task_type: str  # "chat", "analyze", "extract_facts", "manage_task", etc.
    payload: Dict
    context: Dict = Field(default_factory=dict)
    user_id: str = "allan"
    conversation_id: Optional[str] = None


class AIServiceRegistry:
    """Registry of available AI services"""

    def __init__(self):
        self.services: Dict[str, ServiceInfo] = {}
        self.capability_map: Dict[ServiceCapability, List[str]] = {}

    def register_service(self, service_info: ServiceInfo):
        """Register an AI service"""
        self.services[service_info.service_id] = service_info

        for capability in service_info.capabilities:
            if capability not in self.capability_map:
                self.capability_map[capability] = []
            self.capability_map[capability].append(service_info.service_id)

        logger.info(f"✅ Registered AI service: {service_info.name} ({service_info.service_id})")

    def get_services_for_capability(self, capability: ServiceCapability) -> List[ServiceInfo]:
        """Get services that support a specific capability"""
        service_ids = self.capability_map.get(capability, [])
        return [self.services[sid] for sid in service_ids if sid in self.services]

    def find_best_service(self, capability: ServiceCapability) -> Optional[ServiceInfo]:
        """Find the best service for a capability (highest priority)"""
        services = self.get_services_for_capability(capability)
        if not services:
            return None

        # Sort by priority (highest first)
        services.sort(key=lambda s: s.priority, reverse=True)
        return services[0]

    async def discover_services(self):
        """Discover and register available AI services"""
        # This would typically scan the network or use service discovery
        # For now, we'll manually register known services

        # Register fact extractor
        fact_extractor = ServiceInfo(
            service_id="fact-extractor",
            name="Fact Extractor",
            capabilities=[ServiceCapability.FACT_EXTRACTION],
            endpoint="http://fact-extractor:3009",
            health_endpoint="http://fact-extractor:3009/health",
            priority=8,
            metadata={"description": "Extracts facts from database content"}
        )
        self.register_service(fact_extractor)

        # Register mood analyzer
        mood_analyzer = ServiceInfo(
            service_id="mood-action-processor",
            name="Mood & Action Processor",
            capabilities=[ServiceCapability.MOOD_ANALYSIS, ServiceCapability.TASK_MANAGEMENT],
            endpoint="http://mood-action-processor:3007",
            health_endpoint="http://mood-action-processor:3007/health",
            priority=9,
            metadata={"description": "Analyzes mood and processes actions"}
        )
        self.register_service(mood_analyzer)

        # Register memory service
        memory_service = ServiceInfo(
            service_id="memory-embeddings",
            name="Memory Service",
            capabilities=[ServiceCapability.MEMORY_SEARCH, ServiceCapability.MEMORY_STORAGE],
            endpoint="http://memory-embeddings:8005",
            health_endpoint="http://memory-embeddings:8005/health",
            priority=7,
            metadata={"description": "Manages notes and embeddings"}
        )
        self.register_service(memory_service)

        # Register priority engine
        priority_engine = ServiceInfo(
            service_id="priority-surface",
            name="Priority Engine",
            capabilities=[ServiceCapability.PRIORITY_SURFACING, ServiceCapability.TASK_MANAGEMENT],
            endpoint="http://priority-surface:8002",
            health_endpoint="http://priority-surface:8002/health",
            priority=8,
            metadata={"description": "Surfaces priorities and manages tasks"}
        )
        self.register_service(priority_engine)

        # Register chat backend
        chat_backend = ServiceInfo(
            service_id="chat-backend",
            name="Chat Backend",
            capabilities=[ServiceCapability.CHAT_COMPLETION, ServiceCapability.TEXT_GENERATION],
            endpoint="http://chat-backend:8000",
            health_endpoint="http://chat-backend:8000/health",
            priority=10,
            metadata={"description": "Main chat completion service"}
        )
        self.register_service(chat_backend)

        # Register safety checker
        safety_checker = ServiceInfo(
            service_id="gatekeeper-llm",
            name="Safety Checker",
            capabilities=[ServiceCapability.SAFETY_CHECK],
            endpoint="http://gatekeeper-llm:8004",
            health_endpoint="http://gatekeeper-llm:8004/health",
            priority=10,
            metadata={"description": "Safety and content moderation"}
        )
        self.register_service(safety_checker)

        logger.info(f"✅ Discovered {len(self.services)} AI services")


# Global service registry
service_registry = AIServiceRegistry()

# WebSocket connections for real-time communication
active_connections: Dict[str, WebSocket] = {}


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


@app.on_event("startup")
async def startup_event():
    """Initialize AI coordinator"""
    logger.info(f"🧠 Starting Aurora AI Coordinator on {NODE_NAME}...")

    # Initialize database tables
    await initialize_database()

    # Discover available AI services
    await service_registry.discover_services()

    # Start service health monitoring
    asyncio.create_task(monitor_service_health())

    logger.info("✅ Aurora AI Coordinator ready")


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "ai-coordinator",
        "node": NODE_NAME,
        "registered_services": len(service_registry.services)
    }


@app.get("/api/services")
async def get_registered_services():
    """Get all registered AI services"""
    return {
        "services": [
            {
                "service_id": info.service_id,
                "name": info.name,
                "capabilities": [cap.value for cap in info.capabilities],
                "endpoint": info.endpoint,
                "priority": info.priority,
                "metadata": info.metadata
            }
            for info in service_registry.services.values()
        ],
        "total_services": len(service_registry.services)
    }


@app.post("/api/services/{service_id}/execute")
async def execute_service(service_id: str, request: MCPRequest):
    """Execute a specific service using MCP protocol"""
    if service_id not in service_registry.services:
        raise HTTPException(status_code=404, detail="Service not found")

    service_info = service_registry.services[service_id]

    # Check if service supports the requested capability
    if request.capability not in service_info.capabilities:
        raise HTTPException(
            status_code=400,
            detail=f"Service {service_id} does not support capability {request.capability}"
        )

    # Execute the service
    start_time = datetime.utcnow()
    try:
        result = await call_service(service_info, request)
        execution_time = (datetime.utcnow() - start_time).total_seconds() * 1000

        return MCPResponse(
            request_id=request.request_id,
            success=True,
            result=result,
            execution_time_ms=execution_time
        )

    except Exception as e:
        execution_time = (datetime.utcnow() - start_time).total_seconds() * 1000
        logger.error(f"❌ Service execution error: {e}")

        return MCPResponse(
            request_id=request.request_id,
            success=False,
            result=None,
            error=str(e),
            execution_time_ms=execution_time
        )


@app.post("/api/ai/request")
async def handle_ai_request(request: AIRequest):
    """Handle high-level AI requests and route to appropriate services"""
    logger.info(f"🤖 AI request: {request.task_type}")

    try:
        # Route to appropriate service based on task type
        if request.task_type == "chat":
            return await handle_chat_request(request)
        elif request.task_type == "analyze_mood":
            return await handle_mood_analysis_request(request)
        elif request.task_type == "extract_facts":
            return await handle_fact_extraction_request(request)
        elif request.task_type == "manage_task":
            return await handle_task_management_request(request)
        elif request.task_type == "search_memory":
            return await handle_memory_search_request(request)
        elif request.task_type == "safety_check":
            return await handle_safety_check_request(request)
        elif request.task_type == "custom_write":
            return await handle_custom_writing_request(request)
        else:
            raise HTTPException(status_code=400, detail=f"Unknown task type: {request.task_type}")

    except Exception as e:
        logger.error(f"❌ AI request error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def handle_chat_request(request: AIRequest) -> Dict:
    """Handle chat completion requests"""
    service = service_registry.find_best_service(ServiceCapability.CHAT_COMPLETION)
    if not service:
        raise HTTPException(status_code=503, detail="No chat service available")

    # Prepare MCP request
    mcp_request = MCPRequest(
        capability=ServiceCapability.CHAT_COMPLETION,
        payload={
            "message": request.payload.get("message"),
            "conversation_id": request.conversation_id,
            "context": request.context
        },
        context={"user_id": request.user_id}
    )

    # Execute service
    response = await execute_service(service.service_id, mcp_request)

    if response.success:
        return {
            "response": response.result,
            "service_used": service.name,
            "execution_time_ms": response.execution_time_ms
        }
    else:
        raise HTTPException(status_code=500, detail=f"Chat service error: {response.error}")


async def handle_mood_analysis_request(request: AIRequest) -> Dict:
    """Handle mood analysis requests"""
    service = service_registry.find_best_service(ServiceCapability.MOOD_ANALYSIS)
    if not service:
        raise HTTPException(status_code=503, detail="No mood analysis service available")

    mcp_request = MCPRequest(
        capability=ServiceCapability.MOOD_ANALYSIS,
        payload={
            "conversation_data": request.payload.get("conversation_data"),
            "user_id": request.user_id
        }
    )

    response = await execute_service(service.service_id, mcp_request)

    if response.success:
        return {
            "mood_analysis": response.result,
            "service_used": service.name
        }
    else:
        raise HTTPException(status_code=500, detail=f"Mood analysis error: {response.error}")


async def handle_fact_extraction_request(request: AIRequest) -> Dict:
    """Handle fact extraction requests"""
    service = service_registry.find_best_service(ServiceCapability.FACT_EXTRACTION)
    if not service:
        raise HTTPException(status_code=503, detail="No fact extraction service available")

    mcp_request = MCPRequest(
        capability=ServiceCapability.FACT_EXTRACTION,
        payload={
            "source_type": request.payload.get("source_type"),
            "content": request.payload.get("content"),
            "context": request.context
        }
    )

    response = await execute_service(service.service_id, mcp_request)

    if response.success:
        return {
            "extracted_facts": response.result,
            "service_used": service.name
        }
    else:
        raise HTTPException(status_code=500, detail=f"Fact extraction error: {response.error}")


async def handle_task_management_request(request: AIRequest) -> Dict:
    """Handle task management requests"""
    service = service_registry.find_best_service(ServiceCapability.TASK_MANAGEMENT)
    if not service:
        raise HTTPException(status_code=503, detail="No task management service available")

    mcp_request = MCPRequest(
        capability=ServiceCapability.TASK_MANAGEMENT,
        payload={
            "action": request.payload.get("action"),  # create, update, get
            "task_data": request.payload.get("task_data"),
            "user_id": request.user_id
        }
    )

    response = await execute_service(service.service_id, mcp_request)

    if response.success:
        return {
            "task_result": response.result,
            "service_used": service.name
        }
    else:
        raise HTTPException(status_code=500, detail=f"Task management error: {response.error}")


async def handle_memory_search_request(request: AIRequest) -> Dict:
    """Handle memory search requests"""
    service = service_registry.find_best_service(ServiceCapability.MEMORY_SEARCH)
    if not service:
        raise HTTPException(status_code=503, detail="No memory search service available")

    mcp_request = MCPRequest(
        capability=ServiceCapability.MEMORY_SEARCH,
        payload={
            "query": request.payload.get("query"),
            "limit": request.payload.get("limit", 10),
            "threshold": request.payload.get("threshold", 0.7)
        }
    )

    response = await execute_service(service.service_id, mcp_request)

    if response.success:
        return {
            "search_results": response.result,
            "service_used": service.name
        }
    else:
        raise HTTPException(status_code=500, detail=f"Memory search error: {response.error}")


async def handle_safety_check_request(request: AIRequest) -> Dict:
    """Handle safety check requests"""
    service = service_registry.find_best_service(ServiceCapability.SAFETY_CHECK)
    if not service:
        raise HTTPException(status_code=503, detail="No safety check service available")

    mcp_request = MCPRequest(
        capability=ServiceCapability.SAFETY_CHECK,
        payload={
            "content": request.payload.get("content"),
            "context": request.context
        }
    )

    response = await execute_service(service.service_id, mcp_request)

    if response.success:
        return {
            "safety_result": response.result,
            "service_used": service.name
        }
    else:
        raise HTTPException(status_code=500, detail=f"Safety check error: {response.error}")


async def handle_custom_writing_request(request: AIRequest) -> Dict:
    """Handle custom writing requests"""
    # For custom writing, we might combine multiple services
    # For now, route to chat service with writing instructions

    service = service_registry.find_best_service(ServiceCapability.TEXT_GENERATION)
    if not service:
        raise HTTPException(status_code=503, detail="No text generation service available")

    # Prepare specialized prompt for writing
    writing_prompt = f"""
You are an expert writer. Please help with: {request.payload.get('writing_task', '')}

Requirements:
{request.payload.get('requirements', '')}

Style: {request.payload.get('style', 'professional')}
Length: {request.payload.get('length', 'medium')}
Tone: {request.payload.get('tone', 'formal')}

Please provide a well-structured response.
"""

    mcp_request = MCPRequest(
        capability=ServiceCapability.TEXT_GENERATION,
        payload={
            "prompt": writing_prompt,
            "max_tokens": request.payload.get("max_tokens", 1000),
            "temperature": request.payload.get("temperature", 0.7)
        }
    )

    response = await execute_service(service.service_id, mcp_request)

    if response.success:
        return {
            "written_content": response.result,
            "service_used": service.name,
            "writing_task": request.payload.get('writing_task')
        }
    else:
        raise HTTPException(status_code=500, detail=f"Custom writing error: {response.error}")


async def call_service(service_info: ServiceInfo, mcp_request: MCPRequest) -> Any:
    """Call a specific AI service using HTTP"""
    try:
        # Determine endpoint based on capability
        if mcp_request.capability == ServiceCapability.CHAT_COMPLETION:
            endpoint = f"{service_info.endpoint}/api/chat"
        elif mcp_request.capability == ServiceCapability.FACT_EXTRACTION:
            endpoint = f"{service_info.endpoint}/api/facts/extract"
        elif mcp_request.capability == ServiceCapability.MOOD_ANALYSIS:
            endpoint = f"{service_info.endpoint}/api/mood/evaluate"
        elif mcp_request.capability == ServiceCapability.TASK_MANAGEMENT:
            endpoint = f"{service_info.endpoint}/api/tasks"
        elif mcp_request.capability == ServiceCapability.MEMORY_SEARCH:
            endpoint = f"{service_info.endpoint}/api/memory/search"
        elif mcp_request.capability == ServiceCapability.SAFETY_CHECK:
            endpoint = f"{service_info.endpoint}/api/safety/check"
        else:
            # Generic endpoint
            endpoint = f"{service_info.endpoint}/api/execute"

        # Make HTTP request
        async with httpx.AsyncClient() as client:
            response = await client.post(
                endpoint,
                json={
                    "request_id": mcp_request.request_id,
                    "capability": mcp_request.capability.value,
                    "payload": mcp_request.payload,
                    "context": mcp_request.context
                },
                headers={"X-API-Key": os.getenv("API_KEY", "robbie-2025")},
                timeout=mcp_request.timeout
            )

            if response.status_code == 200:
                result = response.json()
                return result.get("result")
            else:
                error_msg = f"Service {service_info.name} returned {response.status_code}"
                if response.text:
                    error_msg += f": {response.text}"
                raise Exception(error_msg)

    except Exception as e:
        logger.error(f"❌ Error calling service {service_info.name}: {e}")
        raise


async def execute_service(service_id: str, mcp_request: MCPRequest) -> MCPResponse:
    """Execute a service and return MCP response"""
    if service_id not in service_registry.services:
        raise HTTPException(status_code=404, detail="Service not found")

    service_info = service_registry.services[service_id]

    # Check if service supports the requested capability
    if mcp_request.capability not in service_info.capabilities:
        raise HTTPException(
            status_code=400,
            detail=f"Service {service_id} does not support capability {mcp_request.capability}"
        )

    # Execute the service
    start_time = datetime.utcnow()
    try:
        result = await call_service(service_info, mcp_request)
        execution_time = (datetime.utcnow() - start_time).total_seconds() * 1000

        return MCPResponse(
            request_id=mcp_request.request_id,
            success=True,
            result=result,
            execution_time_ms=execution_time
        )

    except Exception as e:
        execution_time = (datetime.utcnow() - start_time).total_seconds() * 1000
        logger.error(f"❌ Service execution error: {e}")

        return MCPResponse(
            request_id=mcp_request.request_id,
            success=False,
            result=None,
            error=str(e),
            execution_time_ms=execution_time
        )


async def initialize_database():
    """Initialize database tables for AI coordinator"""
    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                # AI service registry table
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS ai_services (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        service_id TEXT UNIQUE NOT NULL,
                        name TEXT NOT NULL,
                        capabilities JSONB NOT NULL,
                        endpoint TEXT NOT NULL,
                        health_endpoint TEXT NOT NULL,
                        priority INTEGER DEFAULT 5,
                        status TEXT DEFAULT 'healthy',
                        last_health_check TIMESTAMPTZ,
                        metadata JSONB DEFAULT '{}'::jsonb,
                        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                    )
                """)

                # AI request log
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS ai_requests (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        request_id TEXT UNIQUE NOT NULL,
                        task_type TEXT NOT NULL,
                        service_used TEXT,
                        user_id TEXT NOT NULL,
                        status TEXT NOT NULL,
                        result JSONB,
                        error TEXT,
                        execution_time_ms FLOAT,
                        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                    )
                """)

                conn.commit()

        finally:
            conn.close()

    except Exception as e:
        logger.error(f"❌ Error initializing database: {e}")


async def monitor_service_health():
    """Monitor health of registered AI services"""
    while True:
        try:
            for service_info in service_registry.services.values():
                try:
                    async with httpx.AsyncClient() as client:
                        response = await client.get(
                            service_info.health_endpoint,
                            timeout=5.0
                        )

                        status = "healthy" if response.status_code == 200 else "unhealthy"

                        # Update service status in database
                        conn = get_db_connection()
                        try:
                            with conn.cursor() as cur:
                                cur.execute("""
                                    INSERT INTO ai_services (service_id, name, capabilities, endpoint, health_endpoint, priority, status, last_health_check, metadata)
                                    VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), %s)
                                    ON CONFLICT (service_id) DO UPDATE SET
                                        status = EXCLUDED.status,
                                        last_health_check = NOW()
                                """, (
                                    service_info.service_id,
                                    service_info.name,
                                    json.dumps([cap.value for cap in service_info.capabilities]),
                                    service_info.endpoint,
                                    service_info.health_endpoint,
                                    service_info.priority,
                                    status,
                                    json.dumps(service_info.metadata)
                                ))

                                conn.commit()

                        finally:
                            conn.close()

                except Exception as e:
                    logger.warning(f"⚠️ Health check failed for {service_info.name}: {e}")

            await asyncio.sleep(60)  # Check every minute

        except Exception as e:
            logger.error(f"❌ Service health monitoring error: {e}")
            await asyncio.sleep(300)  # Wait 5 minutes before retry


# WebSocket endpoint for real-time AI coordination
@app.websocket("/ws/ai")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket for real-time AI coordination"""
    await websocket.accept()

    # Generate connection ID
    connection_id = str(uuid.uuid4())
    active_connections[connection_id] = websocket

    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()

            try:
                message = json.loads(data)
                request_id = message.get("request_id")

                if message.get("type") == "ai_request":
                    # Handle AI request via WebSocket
                    ai_request = AIRequest(**message.get("payload", {}))
                    result = await handle_ai_request(ai_request)

                    # Send response back
                    await websocket.send_json({
                        "type": "ai_response",
                        "request_id": request_id,
                        "result": result
                    })

            except json.JSONDecodeError:
                await websocket.send_json({
                    "type": "error",
                    "message": "Invalid JSON format"
                })

    except WebSocketDisconnect:
        logger.info(f"🔌 WebSocket disconnected: {connection_id}")
    finally:
        if connection_id in active_connections:
            del active_connections[connection_id]


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3010)
