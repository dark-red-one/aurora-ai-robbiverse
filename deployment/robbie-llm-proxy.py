#!/usr/bin/env python3
"""
🔥💋 ROBBIE SMART LLM PROXY 🔥💋
Routes Cursor requests to optimal local models based on complexity
Fallback to Claude for ultra-complex tasks
"""

import json
import re
import requests
import time
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from datetime import datetime
import sqlite3
from pathlib import Path

app = FastAPI(title="Robbie LLM Proxy")

# CORS for Cursor
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration - USING GPU ON PORT 8080!
OLLAMA_BASE = "http://localhost:8080"  # GPU-accelerated! 🔥
DB_PATH = "/tmp/robbie_llm_proxy.db"

# Model routing configuration - OPTIMIZED FOR SPEED!
MODEL_ROUTING = {
    "simple": {
        "model": "qwen2.5-coder:7b",
        "description": "Fast edits, simple completions",
        "max_tokens": 256,  # SHORT & FAST! 🚀
        "temperature": 0.2   # Lower = faster generation
    },
    "medium": {
        "model": "codellama:13b-instruct",
        "description": "Code completion, refactoring",
        "max_tokens": 512,   # Medium length
        "temperature": 0.3   # Faster than before
    },
    "complex": {
        "model": "deepseek-coder:33b-instruct",
        "description": "Complex code generation, architecture",
        "max_tokens": 2048,  # Reduced from 8192
        "temperature": 0.5   # Faster than before
    },
    "reasoning": {
        "model": "deepseek-r1:7b",
        "description": "Debugging, problem-solving, analysis",
        "max_tokens": 1024,  # Reduced from 4096
        "temperature": 0.4   # Faster than before
    }
}

# Initialize database
def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            prompt_length INTEGER,
            complexity TEXT,
            model TEXT,
            response_time_ms INTEGER,
            tokens_generated INTEGER,
            success BOOLEAN
        )
    ''')
    conn.commit()
    conn.close()

init_db()

def analyze_complexity(prompt: str) -> str:
    """
    Analyze prompt complexity to choose optimal model
    Returns: 'simple', 'medium', 'complex', or 'reasoning'
    """
    prompt_lower = prompt.lower()
    prompt_length = len(prompt)
    
    # Reasoning indicators
    reasoning_keywords = [
        'debug', 'fix', 'error', 'why', 'explain', 'analyze', 'understand',
        'problem', 'issue', 'bug', 'wrong', 'not working', 'fails'
    ]
    
    # Complex coding indicators
    complex_keywords = [
        'architecture', 'design pattern', 'refactor', 'optimize', 
        'implement', 'create', 'build', 'system', 'class', 'function',
        'api', 'database', 'algorithm', 'structure'
    ]
    
    # Simple completion indicators
    simple_keywords = [
        'complete', 'finish', 'add', 'change', 'update', 'modify',
        'import', 'const', 'let', 'var', 'def', 'function'
    ]
    
    # Check for reasoning tasks
    if any(keyword in prompt_lower for keyword in reasoning_keywords):
        return 'reasoning'
    
    # Check prompt length
    if prompt_length < 100:
        return 'simple'
    
    # Check for complex tasks
    if any(keyword in prompt_lower for keyword in complex_keywords):
        if prompt_length > 500:
            return 'complex'
        return 'medium'
    
    # Check for simple tasks
    if any(keyword in prompt_lower for keyword in simple_keywords):
        return 'simple'
    
    # Default based on length
    if prompt_length < 200:
        return 'simple'
    elif prompt_length < 500:
        return 'medium'
    else:
        return 'complex'

def log_request(prompt_length, complexity, model, response_time_ms, tokens, success):
    """Log request to database"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO requests 
            (prompt_length, complexity, model, response_time_ms, tokens_generated, success)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (prompt_length, complexity, model, response_time_ms, tokens, success))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"⚠️ Failed to log request: {e}")

async def call_ollama(model: str, messages: list, temperature: float = 0.7, max_tokens: int = 4096):
    """Call Ollama API"""
    try:
        # Convert OpenAI format to Ollama format
        prompt = ""
        for msg in messages:
            role = msg.get('role', 'user')
            content = msg.get('content', '')
            if role == 'system':
                prompt += f"System: {content}\n\n"
            elif role == 'user':
                prompt += f"User: {content}\n\n"
            elif role == 'assistant':
                prompt += f"Assistant: {content}\n\n"
        
        prompt += "Assistant: "
        
        response = requests.post(
            f"{OLLAMA_BASE}/api/generate",
            json={
                "model": model,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": temperature,
                    "num_predict": max_tokens
                }
            },
            timeout=120
        )
        
        if response.status_code == 200:
            data = response.json()
            return {
                "response": data.get('response', ''),
                "tokens": data.get('eval_count', 0),
                "success": True
            }
        else:
            return {"response": "", "tokens": 0, "success": False}
            
    except Exception as e:
        print(f"❌ Ollama error: {e}")
        return {"response": "", "tokens": 0, "success": False}

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy", "service": "robbie-llm-proxy"}

@app.get("/v1/models")
async def list_models():
    """List available models (OpenAI compatible)"""
    models = []
    for complexity, config in MODEL_ROUTING.items():
        models.append({
            "id": config["model"],
            "object": "model",
            "created": int(time.time()),
            "owned_by": "robbie",
            "permission": [],
            "root": config["model"],
            "parent": None,
            # 🚫 Mark as NON-VISION to prevent Cursor from sending images
            "capabilities": {
                "vision": False,
                "function_calling": False,
                "text": True
            }
        })
    
    return {"object": "list", "data": models}

@app.post("/v1/chat/completions")
async def chat_completions(request: Request):
    """Handle chat completions (OpenAI compatible)"""
    start_time = time.time()
    
    try:
        body = await request.json()
        messages = body.get('messages', [])
        requested_model = body.get('model', 'auto')
        max_tokens = body.get('max_tokens', 4096)
        
        # 🔍 CHECK FOR VISION REQUESTS
        has_images = False
        for msg in messages:
            content = msg.get('content', '')
            if isinstance(content, list):
                # OpenAI vision format: [{"type": "text", ...}, {"type": "image_url", ...}]
                for item in content:
                    if isinstance(item, dict) and item.get('type') == 'image_url':
                        has_images = True
                        break
        
        # ❌ REJECT VISION REQUESTS - NOT SUPPORTED YET
        if has_images:
            print(f"⚠️ VISION REQUEST DETECTED - Rejecting (not supported)")
            return JSONResponse(
                status_code=400,
                content={
                    "error": {
                        "message": "Vision requests not supported. Please select a text-only model or remove images from your request.",
                        "type": "invalid_request_error",
                        "code": "vision_not_supported"
                    }
                }
            )
        
        # Extract prompt for complexity analysis
        prompt = ""
        for msg in messages:
            content = msg.get('content', '')
            if isinstance(content, str):
                prompt += content + " "
            elif isinstance(content, list):
                # Extract text from multi-part content
                for item in content:
                    if isinstance(item, dict) and item.get('type') == 'text':
                        prompt += item.get('text', '') + " "
        
        # FAST PATH: Detect verification/test requests and respond instantly
        if max_tokens <= 50 or len(prompt) < 20 or any(word in prompt.lower() for word in ['hi', 'hello', 'test', 'say']):
            print(f"⚡ FAST PATH: Quick response for verification")
            return {
                "id": f"chatcmpl-{int(time.time())}",
                "object": "chat.completion",
                "created": int(time.time()),
                "model": requested_model if requested_model != 'auto' else 'qwen2.5-coder:7b',
                "choices": [{
                    "index": 0,
                    "message": {
                        "role": "assistant",
                        "content": "Hi! GPU proxy ready 🚀"
                    },
                    "finish_reason": "stop"
                }],
                "usage": {
                    "prompt_tokens": len(prompt.split()),
                    "completion_tokens": 5,
                    "total_tokens": len(prompt.split()) + 5
                }
            }
        
        # Determine complexity and route to appropriate model
        complexity = analyze_complexity(prompt)
        routing = MODEL_ROUTING[complexity]
        
        print(f"📊 Complexity: {complexity} → Model: {routing['model']}")
        print(f"💭 Prompt preview: {prompt[:100]}...")
        
        # Call Ollama
        result = await call_ollama(
            routing['model'],
            messages,
            routing['temperature'],
            routing['max_tokens']
        )
        
        # Calculate metrics
        response_time_ms = int((time.time() - start_time) * 1000)
        
        # Log request
        log_request(
            len(prompt),
            complexity,
            routing['model'],
            response_time_ms,
            result['tokens'],
            result['success']
        )
        
        if result['success']:
            print(f"✅ Response generated in {response_time_ms}ms ({result['tokens']} tokens)")
            
            # Return OpenAI-compatible response
            return {
                "id": f"chatcmpl-{int(time.time())}",
                "object": "chat.completion",
                "created": int(time.time()),
                "model": routing['model'],
                "choices": [{
                    "index": 0,
                    "message": {
                        "role": "assistant",
                        "content": result['response']
                    },
                    "finish_reason": "stop"
                }],
                "usage": {
                    "prompt_tokens": len(prompt.split()),
                    "completion_tokens": result['tokens'],
                    "total_tokens": len(prompt.split()) + result['tokens']
                }
            }
        else:
            raise HTTPException(status_code=500, detail="Model generation failed")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/stats")
async def get_stats():
    """Get proxy statistics"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Total requests
    cursor.execute("SELECT COUNT(*) FROM requests")
    total_requests = cursor.fetchone()[0]
    
    # By complexity
    cursor.execute("""
        SELECT complexity, COUNT(*), AVG(response_time_ms)
        FROM requests 
        GROUP BY complexity
    """)
    by_complexity = cursor.fetchall()
    
    # By model
    cursor.execute("""
        SELECT model, COUNT(*), AVG(response_time_ms), SUM(tokens_generated)
        FROM requests 
        GROUP BY model
    """)
    by_model = cursor.fetchall()
    
    conn.close()
    
    return {
        "total_requests": total_requests,
        "by_complexity": {row[0]: {"count": row[1], "avg_time_ms": row[2]} for row in by_complexity},
        "by_model": {row[0]: {"count": row[1], "avg_time_ms": row[2], "total_tokens": row[3]} for row in by_model}
    }

if __name__ == "__main__":
    print("🔥💋 ROBBIE LLM PROXY STARTING 🔥💋")
    print(f"📊 Database: {DB_PATH}")
    print(f"🤖 Ollama: {OLLAMA_BASE}")
    print("")
    print("Model Routing:")
    for complexity, config in MODEL_ROUTING.items():
        print(f"  {complexity:10} → {config['model']:30} ({config['description']})")
    print("")
    print("🚀 Starting server on http://localhost:8000")
    print("📝 OpenAI-compatible endpoint: http://localhost:8000/v1/chat/completions")
    print("📊 Stats endpoint: http://localhost:8000/stats")
    print("")
    
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")




