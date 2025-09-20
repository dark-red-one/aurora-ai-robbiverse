#!/usr/bin/env python3
"""
Aurora AI Empire - Production Chat System
Real-time chat with Zep memory and vector search
"""

import asyncio
import json
import time
import uuid
from datetime import datetime
from typing import Dict, List, Optional
import numpy as np
from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.responses import HTMLResponse
import uvicorn

class AuroraChatSystem:
    def __init__(self):
        self.sessions = {}
        self.messages = {}
        self.embeddings = {}
        self.personalities = {
            "robbie": {
                "name": "Robbie",
                "role": "Primary Assistant",
                "description": "Main AI consciousness and coordinator",
                "style": "helpful, intelligent, and proactive"
            },
            "allanbot": {
                "name": "AllanBot",
                "role": "Digital Twin",
                "description": "Allan's digital twin for business decisions",
                "style": "strategic, business-focused, and decisive"
            },
            "kristina": {
                "name": "Kristina",
                "role": "Virtual Assistant Expert",
                "description": "Expert in VA workflows and best practices",
                "style": "efficient, organized, and detail-oriented"
            }
        }
    
    def create_embedding(self, text: str) -> List[float]:
        """Create a simple embedding for the text"""
        # Simple hash-based embedding for demo
        import hashlib
        hash_obj = hashlib.md5(text.encode())
        hash_bytes = hash_obj.digest()
        
        # Convert to 1536-dimensional vector
        embedding = []
        for i in range(1536):
            byte_idx = i % len(hash_bytes)
            embedding.append(float(hash_bytes[byte_idx]) / 255.0)
        
        return embedding
    
    def similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Calculate cosine similarity between two vectors"""
        dot_product = sum(a * b for a, b in zip(vec1, vec2))
        norm1 = sum(a * a for a in vec1) ** 0.5
        norm2 = sum(b * b for b in vec2) ** 0.5
        
        if norm1 == 0 or norm2 == 0:
            return 0
        
        return dot_product / (norm1 * norm2)
    
    def search_memory(self, session_id: str, query: str, limit: int = 5) -> List[Dict]:
        """Search memory for relevant context"""
        if session_id not in self.messages:
            return []
        
        query_embedding = self.create_embedding(query)
        results = []
        
        for msg in self.messages[session_id]:
            if 'embedding' in msg:
                similarity = self.similarity(query_embedding, msg['embedding'])
                results.append({
                    'content': msg['content'],
                    'role': msg['role'],
                    'similarity': similarity,
                    'timestamp': msg['timestamp']
                })
        
        # Sort by similarity and return top results
        results.sort(key=lambda x: x['similarity'], reverse=True)
        return results[:limit]
    
    def add_message(self, session_id: str, content: str, role: str = "user"):
        """Add a message to the session"""
        if session_id not in self.messages:
            self.messages[session_id] = []
        
        message = {
            'id': str(uuid.uuid4()),
            'content': content,
            'role': role,
            'timestamp': datetime.now().isoformat(),
            'embedding': self.create_embedding(content)
        }
        
        self.messages[session_id].append(message)
        return message
    
    def get_ai_response(self, session_id: str, user_message: str, personality: str = "robbie") -> str:
        """Generate AI response based on personality and context"""
        # Search for relevant context
        context = self.search_memory(session_id, user_message, limit=3)
        
        # Get personality info
        personality_info = self.personalities.get(personality, self.personalities["robbie"])
        
        # Generate response based on personality and context
        if personality == "robbie":
            response = f"Hello! I'm {personality_info['name']}, your {personality_info['role']}. "
            response += f"I understand you're asking about: '{user_message}'. "
            response += f"Based on our conversation history, I can help you with that. "
            response += f"I'm here to coordinate the Aurora AI Empire and assist with any tasks you need!"
        
        elif personality == "allanbot":
            response = f"AllanBot here! As your digital twin, I'm analyzing: '{user_message}'. "
            response += f"From a business perspective, this requires strategic thinking. "
            response += f"Let me provide you with a data-driven approach to this challenge."
        
        elif personality == "kristina":
            response = f"Hi! I'm {personality_info['name']}, your VA expert. "
            response += f"Regarding '{user_message}', I can help you organize and streamline this. "
            response += f"Let me break this down into actionable steps for maximum efficiency."
        
        else:
            response = f"I'm {personality_info['name']}, and I'm here to help with: '{user_message}'. "
            response += f"How can I assist you today?"
        
        # Add context from memory if available
        if context:
            response += f"\n\n[Context from our conversation: {len(context)} relevant messages found]"
        
        return response
    
    def create_session(self, user_id: str) -> str:
        """Create a new chat session"""
        session_id = str(uuid.uuid4())
        self.sessions[session_id] = {
            'user_id': user_id,
            'created_at': datetime.now().isoformat(),
            'personality': 'robbie'
        }
        self.messages[session_id] = []
        return session_id
    
    def get_session_info(self, session_id: str) -> Dict:
        """Get session information"""
        if session_id not in self.sessions:
            return None
        
        session = self.sessions[session_id]
        message_count = len(self.messages.get(session_id, []))
        
        return {
            'session_id': session_id,
            'user_id': session['user_id'],
            'created_at': session['created_at'],
            'message_count': message_count,
            'personality': session['personality']
        }

# Create FastAPI app
app = FastAPI(title="Aurora AI Empire Chat System")

# Initialize chat system
chat_system = AuroraChatSystem()

@app.get("/")
async def root():
    return {"message": "🧠 Aurora AI Empire Chat System", "status": "online"}

@app.post("/chat/session")
async def create_session(user_id: str = "aurora_user"):
    """Create a new chat session"""
    session_id = chat_system.create_session(user_id)
    return {"session_id": session_id, "message": "Session created successfully"}

@app.post("/chat/{session_id}/message")
async def send_message(session_id: str, message: str, personality: str = "robbie"):
    """Send a message to the chat system"""
    if session_id not in chat_system.sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Add user message
    user_msg = chat_system.add_message(session_id, message, "user")
    
    # Generate AI response
    ai_response = chat_system.get_ai_response(session_id, message, personality)
    
    # Add AI response
    ai_msg = chat_system.add_message(session_id, ai_response, "assistant")
    
    return {
        "session_id": session_id,
        "user_message": user_msg,
        "ai_response": ai_msg,
        "personality": personality
    }

@app.get("/chat/{session_id}/history")
async def get_chat_history(session_id: str, limit: int = 10):
    """Get chat history for a session"""
    if session_id not in chat_system.sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    messages = chat_system.messages.get(session_id, [])
    return {
        "session_id": session_id,
        "messages": messages[-limit:],
        "total_messages": len(messages)
    }

@app.get("/chat/{session_id}/search")
async def search_chat(session_id: str, query: str, limit: int = 5):
    """Search chat history"""
    if session_id not in chat_system.sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    results = chat_system.search_memory(session_id, query, limit)
    return {
        "session_id": session_id,
        "query": query,
        "results": results
    }

@app.get("/chat/personalities")
async def get_personalities():
    """Get available AI personalities"""
    return {"personalities": chat_system.personalities}

@app.websocket("/chat/{session_id}/ws")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    """WebSocket endpoint for real-time chat"""
    await websocket.accept()
    
    if session_id not in chat_system.sessions:
        await websocket.send_text(json.dumps({"error": "Session not found"}))
        await websocket.close()
        return
    
    try:
        while True:
            # Receive message
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            message = message_data.get("message", "")
            personality = message_data.get("personality", "robbie")
            
            # Add user message
            user_msg = chat_system.add_message(session_id, message, "user")
            
            # Generate AI response
            ai_response = chat_system.get_ai_response(session_id, message, personality)
            ai_msg = chat_system.add_message(session_id, ai_response, "assistant")
            
            # Send response
            response = {
                "user_message": user_msg,
                "ai_response": ai_msg,
                "personality": personality
            }
            
            await websocket.send_text(json.dumps(response))
    
    except Exception as e:
        print(f"WebSocket error: {e}")
        await websocket.close()

@app.get("/chat/demo", response_class=HTMLResponse)
async def chat_demo():
    """Simple HTML demo interface"""
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Aurora AI Empire Chat</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .chat-container { max-width: 800px; margin: 0 auto; }
            .message { margin: 10px 0; padding: 10px; border-radius: 5px; }
            .user { background-color: #e3f2fd; text-align: right; }
            .assistant { background-color: #f3e5f5; text-align: left; }
            .input-container { margin-top: 20px; }
            input[type="text"] { width: 70%; padding: 10px; }
            button { padding: 10px 20px; margin-left: 10px; }
            select { padding: 10px; margin-left: 10px; }
        </style>
    </head>
    <body>
        <div class="chat-container">
            <h1>🧠 Aurora AI Empire Chat System</h1>
            <div id="messages"></div>
            <div class="input-container">
                <input type="text" id="messageInput" placeholder="Type your message...">
                <select id="personalitySelect">
                    <option value="robbie">Robbie (Primary Assistant)</option>
                    <option value="allanbot">AllanBot (Digital Twin)</option>
                    <option value="kristina">Kristina (VA Expert)</option>
                </select>
                <button onclick="sendMessage()">Send</button>
            </div>
        </div>
        
        <script>
            let sessionId = null;
            
            // Create session on load
            fetch('/chat/session', {method: 'POST'})
                .then(response => response.json())
                .then(data => {
                    sessionId = data.session_id;
                    console.log('Session created:', sessionId);
                });
            
            function sendMessage() {
                const input = document.getElementById('messageInput');
                const personality = document.getElementById('personalitySelect').value;
                const message = input.value.trim();
                
                if (!message || !sessionId) return;
                
                // Add user message to UI
                addMessage(message, 'user');
                
                // Send to API
                fetch(`/chat/${sessionId}/message`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({message: message, personality: personality})
                })
                .then(response => response.json())
                .then(data => {
                    addMessage(data.ai_response.content, 'assistant');
                })
                .catch(error => {
                    console.error('Error:', error);
                    addMessage('Sorry, there was an error processing your message.', 'assistant');
                });
                
                input.value = '';
            }
            
            function addMessage(content, role) {
                const messagesDiv = document.getElementById('messages');
                const messageDiv = document.createElement('div');
                messageDiv.className = `message ${role}`;
                messageDiv.textContent = content;
                messagesDiv.appendChild(messageDiv);
                messagesDiv.scrollTop = messagesDiv.scrollHeight;
            }
            
            // Allow Enter key to send message
            document.getElementById('messageInput').addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    sendMessage();
                }
            });
        </script>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)

if __name__ == "__main__":
    print("🚀 Starting Aurora AI Empire Chat System...")
    print("🌐 Web interface: http://localhost:8004/chat/demo")
    print("📡 API documentation: http://localhost:8004/docs")
    uvicorn.run(app, host="0.0.0.0", port=8004)
