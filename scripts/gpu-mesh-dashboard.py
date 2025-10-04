#!/usr/bin/env python3
"""
Aurora GPU Mesh Dashboard
Real-time monitoring of distributed GPU resources across all nodes
"""

import asyncio
import json
import time
from datetime import datetime
from fastapi import FastAPI, WebSocket
from fastapi.responses import HTMLResponse
import uvicorn

app = FastAPI(title="Aurora GPU Mesh Dashboard")

# GPU Mesh Status
gpu_mesh_status = {
    "aurora": {
        "status": "active",
        "gpus": 2,
        "vram_total": 48,
        "vram_used": 0,
        "vram_available": 48,
        "tasks_active": 0,
        "last_update": datetime.now().isoformat()
    },
    "collaboration": {
        "status": "offline",
        "gpus": 1,
        "vram_total": 24,
        "vram_used": 0,
        "vram_available": 24,
        "tasks_active": 0,
        "last_update": None
    },
    "fluenti": {
        "status": "offline", 
        "gpus": 1,
        "vram_total": 24,
        "vram_used": 0,
        "vram_available": 24,
        "tasks_active": 0,
        "last_update": None
    },
    "vengeance": {
        "status": "offline",
        "gpus": 1, 
        "vram_total": 24,
        "vram_used": 0,
        "vram_available": 24,
        "tasks_active": 0,
        "last_update": None
    }
}

@app.get("/")
async def dashboard():
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Aurora GPU Mesh Dashboard</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; background: #1a1a1a; color: #fff; }
            .header { text-align: center; margin-bottom: 30px; }
            .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
            .node-card { background: #2a2a2a; padding: 20px; border-radius: 10px; border-left: 5px solid #00ff00; }
            .node-card.offline { border-left-color: #ff0000; }
            .node-card.warning { border-left-color: #ffaa00; }
            .status { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
            .status.active { color: #00ff00; }
            .status.offline { color: #ff0000; }
            .gpu-info { margin: 10px 0; }
            .progress-bar { background: #333; height: 20px; border-radius: 10px; overflow: hidden; margin: 5px 0; }
            .progress-fill { background: linear-gradient(90deg, #00ff00, #ffff00, #ff0000); height: 100%; transition: width 0.3s; }
            .stats { display: flex; justify-content: space-between; margin-top: 20px; }
            .stat { text-align: center; }
            .stat-value { font-size: 24px; font-weight: bold; color: #00ff00; }
            .stat-label { font-size: 12px; color: #aaa; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🔥 Aurora GPU Mesh Dashboard</h1>
            <p>Distributed GPU Computing Across AI Empire</p>
        </div>
        
        <div class="grid" id="nodes-grid">
            <!-- Nodes will be populated by JavaScript -->
        </div>
        
        <div class="stats">
            <div class="stat">
                <div class="stat-value" id="total-gpus">0</div>
                <div class="stat-label">Total GPUs</div>
            </div>
            <div class="stat">
                <div class="stat-value" id="total-vram">0</div>
                <div class="stat-label">Total VRAM (GB)</div>
            </div>
            <div class="stat">
                <div class="stat-value" id="active-nodes">0</div>
                <div class="stat-label">Active Nodes</div>
            </div>
            <div class="stat">
                <div class="stat-value" id="active-tasks">0</div>
                <div class="stat-label">Active Tasks</div>
            </div>
        </div>

        <script>
            async function updateDashboard() {
                try {
                    const response = await fetch('/api/gpu_status');
                    const data = await response.json();
                    
                    const grid = document.getElementById('nodes-grid');
                    grid.innerHTML = '';
                    
                    let totalGpus = 0;
                    let totalVram = 0;
                    let activeNodes = 0;
                    let activeTasks = 0;
                    
                    for (const [nodeName, nodeData] of Object.entries(data.nodes)) {
                        const card = document.createElement('div');
                        card.className = `node-card ${nodeData.status}`;
                        
                        const vramPercent = (nodeData.vram_used / nodeData.vram_total) * 100;
                        
                        card.innerHTML = `
                            <div class="status ${nodeData.status}">${nodeName.toUpperCase()}</div>
                            <div class="gpu-info">
                                <div>GPUs: ${nodeData.gpus}</div>
                                <div>VRAM: ${nodeData.vram_used}GB / ${nodeData.vram_total}GB</div>
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${vramPercent}%"></div>
                                </div>
                                <div>Tasks: ${nodeData.tasks_active}</div>
                                <div>Last Update: ${nodeData.last_update || 'Never'}</div>
                            </div>
                        `;
                        
                        grid.appendChild(card);
                        
                        totalGpus += nodeData.gpus;
                        totalVram += nodeData.vram_total;
                        if (nodeData.status === 'active') activeNodes++;
                        activeTasks += nodeData.tasks_active;
                    }
                    
                    document.getElementById('total-gpus').textContent = totalGpus;
                    document.getElementById('total-vram').textContent = totalVram;
                    document.getElementById('active-nodes').textContent = activeNodes;
                    document.getElementById('active-tasks').textContent = activeTasks;
                    
                } catch (error) {
                    console.error('Error updating dashboard:', error);
                }
            }
            
            // Update every 2 seconds
            setInterval(updateDashboard, 2000);
            updateDashboard(); // Initial load
        </script>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)

@app.get("/api/gpu_status")
async def gpu_status():
    return {"nodes": gpu_mesh_status}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            await websocket.send_text(json.dumps(gpu_mesh_status))
            await asyncio.sleep(2)
    except:
        pass

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8002)
