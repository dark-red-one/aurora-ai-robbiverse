#!/usr/bin/env python3
"""
Aurora Node Registry - Dynamic node discovery and tracking
Maintains real-time map of all nodes in the mesh
"""

import os
import asyncio
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import redis.asyncio as redis
import json
import structlog

# Configure logging
structlog.configure(
    processors=[
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer()
    ],
    logger_factory=structlog.stdlib.LoggerFactory(),
)
logger = structlog.get_logger()

# Configuration
NODE_NAME = os.getenv('NODE_NAME', 'unknown')
NODE_ROLE = os.getenv('NODE_ROLE', 'lead')
REDIS_HOST = os.getenv('REDIS_HOST', 'redis')
REDIS_PASSWORD = os.getenv('REDIS_PASSWORD', '')

app = FastAPI(
    title="Aurora Node Registry",
    version="1.0.0",
    description="Dynamic node discovery and tracking service"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Redis connection
redis_client = None

class NodeInfo(BaseModel):
    """Node information model"""
    name: str
    role: str
    vpn_ip: str
    public_ip: Optional[str] = None
    capabilities: Dict = {}
    metadata: Dict = {}

class NodeHeartbeat(BaseModel):
    """Node heartbeat model"""
    name: str
    status: str = "active"
    
@app.on_event("startup")
async def startup():
    """Connect to Redis on startup"""
    global redis_client
    redis_client = redis.Redis(
        host=REDIS_HOST,
        port=6379,
        password=REDIS_PASSWORD,
        decode_responses=True
    )
    logger.info("node_registry_started", registry_node=NODE_NAME)
    
    # Subscribe to heartbeat events
    asyncio.create_task(listen_for_heartbeats())

@app.on_event("shutdown")
async def shutdown():
    """Cleanup on shutdown"""
    if redis_client:
        await redis_client.close()

async def listen_for_heartbeats():
    """Listen for node heartbeat events from event bus"""
    try:
        pubsub = redis_client.pubsub()
        await pubsub.subscribe('aurora:events:global')
        
        logger.info("listening_for_heartbeats")
        
        async for message in pubsub.listen():
            if message['type'] == 'message':
                try:
                    event = json.loads(message['data'])
                    
                    if event.get('type') == 'node_heartbeat':
                        node = event['data']['node']
                        role = event['data']['role']
                        
                        # Update last seen timestamp
                        await redis_client.setex(
                            f'aurora:registry:node:{node}:lastseen',
                            180,  # 3 minute TTL
                            datetime.utcnow().isoformat()
                        )
                        
                        logger.debug("heartbeat_received", node=node, role=role)
                        
                except Exception as e:
                    logger.error("heartbeat_processing_error", error=str(e))
                    
    except Exception as e:
        logger.error("heartbeat_listener_error", error=str(e))

@app.get("/")
async def root():
    return {
        "service": "Aurora Node Registry",
        "version": "1.0.0",
        "registry_node": NODE_NAME,
        "role": NODE_ROLE,
        "endpoints": {
            "nodes": "/nodes",
            "register": "/nodes/register",
            "node_info": "/nodes/{node_name}",
            "topology": "/topology",
            "health": "/health"
        }
    }

@app.get("/health")
async def health():
    """Health check"""
    try:
        await redis_client.ping()
        return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}
    except:
        raise HTTPException(status_code=503, detail="Redis unavailable")

@app.get("/nodes")
async def list_nodes():
    """List all registered nodes with their status"""
    try:
        nodes = {}
        
        # Get all node keys from Redis
        keys = []
        async for key in redis_client.scan_iter("aurora:registry:node:*:info"):
            keys.append(key)
        
        for key in keys:
            node_name = key.split(':')[3]
            
            # Get node info
            node_data = await redis_client.get(key)
            if node_data:
                info = json.loads(node_data)
                
                # Get last seen
                last_seen_key = f'aurora:registry:node:{node_name}:lastseen'
                last_seen = await redis_client.get(last_seen_key)
                
                # Determine status
                status = "offline"
                if last_seen:
                    last_seen_dt = datetime.fromisoformat(last_seen)
                    if datetime.utcnow() - last_seen_dt < timedelta(minutes=2):
                        status = "active"
                    elif datetime.utcnow() - last_seen_dt < timedelta(minutes=5):
                        status = "warning"
                
                info['status'] = status
                info['last_seen'] = last_seen
                
                nodes[node_name] = info
        
        return {
            "nodes": nodes,
            "total": len(nodes),
            "active": sum(1 for n in nodes.values() if n['status'] == 'active'),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error("list_nodes_error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/nodes/register")
async def register_node(node: NodeInfo):
    """Register or update a node in the registry"""
    try:
        # Store node info
        node_key = f'aurora:registry:node:{node.name}:info'
        await redis_client.set(
            node_key,
            json.dumps({
                "name": node.name,
                "role": node.role,
                "vpn_ip": node.vpn_ip,
                "public_ip": node.public_ip,
                "capabilities": node.capabilities,
                "metadata": node.metadata,
                "registered_at": datetime.utcnow().isoformat()
            })
        )
        
        # Set last seen
        last_seen_key = f'aurora:registry:node:{node.name}:lastseen'
        await redis_client.setex(
            last_seen_key,
            180,
            datetime.utcnow().isoformat()
        )
        
        # Publish registration event
        await redis_client.publish(
            'aurora:events:global',
            json.dumps({
                "type": "node_registered",
                "source_node": NODE_NAME,
                "timestamp": datetime.utcnow().isoformat(),
                "data": {
                    "node": node.name,
                    "role": node.role,
                    "vpn_ip": node.vpn_ip
                }
            })
        )
        
        logger.info("node_registered", node=node.name, role=node.role)
        
        return {
            "status": "registered",
            "node": node.name,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error("register_node_error", error=str(e), node=node.name)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/nodes/{node_name}/heartbeat")
async def node_heartbeat(node_name: str, heartbeat: NodeHeartbeat):
    """Record a node heartbeat"""
    try:
        # Update last seen
        last_seen_key = f'aurora:registry:node:{node_name}:lastseen'
        await redis_client.setex(
            last_seen_key,
            180,
            datetime.utcnow().isoformat()
        )
        
        return {
            "status": "ok",
            "node": node_name,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/nodes/{node_name}")
async def get_node_info(node_name: str):
    """Get detailed information about a specific node"""
    try:
        # Get node info
        node_key = f'aurora:registry:node:{node_name}:info'
        node_data = await redis_client.get(node_key)
        
        if not node_data:
            raise HTTPException(status_code=404, detail=f"Node {node_name} not found")
        
        info = json.loads(node_data)
        
        # Get last seen
        last_seen_key = f'aurora:registry:node:{node_name}:lastseen'
        last_seen = await redis_client.get(last_seen_key)
        
        # Determine status
        status = "offline"
        if last_seen:
            last_seen_dt = datetime.fromisoformat(last_seen)
            if datetime.utcnow() - last_seen_dt < timedelta(minutes=2):
                status = "active"
            elif datetime.utcnow() - last_seen_dt < timedelta(minutes=5):
                status = "warning"
        
        info['status'] = status
        info['last_seen'] = last_seen
        
        return info
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("get_node_info_error", error=str(e), node=node_name)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/topology")
async def get_topology():
    """Get network topology visualization data"""
    try:
        # Get all nodes
        nodes_response = await list_nodes()
        nodes = nodes_response['nodes']
        
        # Build topology
        topology = {
            "nodes": [],
            "connections": [],
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Add nodes
        for name, info in nodes.items():
            topology["nodes"].append({
                "id": name,
                "label": name,
                "role": info['role'],
                "status": info['status'],
                "vpn_ip": info['vpn_ip'],
                "capabilities": info.get('capabilities', {})
            })
        
        # Add connections (VPN mesh = fully connected)
        for i, node1 in enumerate(topology["nodes"]):
            for node2 in topology["nodes"][i+1:]:
                topology["connections"].append({
                    "source": node1["id"],
                    "target": node2["id"],
                    "type": "vpn_mesh"
                })
        
        # Add special connections (replication, coordination)
        lead_node = next((n for n in topology["nodes"] if n["role"] == "lead"), None)
        if lead_node:
            for node in topology["nodes"]:
                if node["role"] in ["backup", "compute"] and node != lead_node:
                    # Database replication
                    topology["connections"].append({
                        "source": lead_node["id"],
                        "target": node["id"],
                        "type": "db_replication"
                    })
                    
                    # GPU mesh (if GPU capable)
                    if node.get("capabilities", {}).get("gpu"):
                        topology["connections"].append({
                            "source": node["id"],
                            "target": lead_node["id"],
                            "type": "gpu_mesh"
                        })
        
        return topology
        
    except Exception as e:
        logger.error("get_topology_error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/stats")
async def get_stats():
    """Get registry statistics"""
    try:
        nodes_response = await list_nodes()
        nodes = nodes_response['nodes']
        
        stats = {
            "total_nodes": len(nodes),
            "active_nodes": sum(1 for n in nodes.values() if n['status'] == 'active'),
            "offline_nodes": sum(1 for n in nodes.values() if n['status'] == 'offline'),
            "nodes_by_role": {},
            "total_gpus": 0,
            "total_vram_gb": 0,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Count by role
        for node in nodes.values():
            role = node['role']
            stats["nodes_by_role"][role] = stats["nodes_by_role"].get(role, 0) + 1
            
            # Count GPU resources
            caps = node.get('capabilities', {})
            if 'gpu_count' in caps:
                stats["total_gpus"] += caps['gpu_count']
            if 'gpu_memory' in caps:
                stats["total_vram_gb"] += caps['gpu_memory']
        
        return stats
        
    except Exception as e:
        logger.error("get_stats_error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=9999)
