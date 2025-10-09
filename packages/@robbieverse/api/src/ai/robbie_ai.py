import asyncio
import httpx
import sqlite3
from typing import Dict, Any, AsyncGenerator
from datetime import datetime
import structlog
import json
import os

logger = structlog.get_logger()

class RobbieAI:
    def __init__(self):
        self.name = "Robbie"
        self.conversation_context = {}
        self.ollama_url = "http://localhost:11434"
        self.model = "qwen2.5:7b"
        
        # Local database for context retrieval (RobbieBook)
        self.local_db_path = os.path.join(os.path.dirname(__file__), "../../../../data/robbiebook.db")
        
        # Thinking process templates (Claude-style)
        self.thinking_stages = [
            "🤔 Considering your question...",
            "🔍 Analyzing the context...",
            "💡 Formulating response...",
            "✨ Crafting the perfect answer..."
        ]
    
    async def process_message(self, message: str, user_id: str = "default", context: Dict = None):
        """Process message with streaming thinking + response"""
        response = await self._generate_response(message, user_id, context or {})
        return response
    
    async def _get_relevant_context(self, message: str, user_id: str, limit: int = 5) -> str:
        """Retrieve relevant context from local robbiebook.db"""
        try:
            conn = sqlite3.connect(self.local_db_path)
            cursor = conn.cursor()
            
            # Search recent conversations for context
            cursor.execute("""
                SELECT user_message, ai_response, timestamp 
                FROM conversations 
                WHERE user_message LIKE ? OR ai_response LIKE ?
                ORDER BY timestamp DESC 
                LIMIT ?
            """, (f'%{message[:50]}%', f'%{message[:50]}%', limit))
            
            conversations = cursor.fetchall()
            
            # Get working memory
            cursor.execute("""
                SELECT key, value, context 
                FROM ai_working_memory 
                ORDER BY last_accessed DESC 
                LIMIT 10
            """)
            memory = cursor.fetchall()
            
            # Get contacts if relevant (check for company names)
            contact_context = ""
            if any(word in message.lower() for word in ['contact', 'know', 'who', 'person', 'people', 'team']):
                # Extract potential company name from message
                import re
                words = message.lower().split()
                for i, word in enumerate(words):
                    # Strip punctuation from word
                    clean_word = re.sub(r'[^\w\s]', '', word)
                    if clean_word in ['at', 'from', 'with'] and i + 1 < len(words):
                        # Get next 1-2 words and strip punctuation
                        potential_company = ' '.join(words[i+1:i+3])
                        potential_company = re.sub(r'[^\w\s]', '', potential_company).strip()
                        
                        cursor.execute("""
                            SELECT c.name, c.title, co.name as company
                            FROM contacts c
                            LEFT JOIN companies co ON c.company_id = co.id
                            WHERE LOWER(co.name) LIKE ? OR LOWER(c.name) LIKE ?
                            LIMIT 5
                        """, (f'%{potential_company}%', f'%{potential_company}%'))
                        contacts = cursor.fetchall()
                        if contacts:
                            contact_context = f"\n\n**Contacts at {potential_company.title()}:**\n" + "\n".join([f"- {c[0]}: {c[1]} @ {c[2]}" for c in contacts if c[2]])
                            break
            
            # Get recent deals if relevant
            deal_context = ""
            if any(word in message.lower() for word in ['deal', 'pipeline', 'revenue', 'sales', 'close']):
                cursor.execute("""
                    SELECT name, amount, stage 
                    FROM deals 
                    WHERE stage != 'closedlost' 
                    ORDER BY amount DESC 
                    LIMIT 5
                """)
                deals = cursor.fetchall()
                if deals:
                    deal_context = "\n\n**Active Deals:**\n" + "\n".join([f"- {d[0]}: ${d[1]:,.0f} ({d[2]})" for d in deals])
            
            conn.close()
            
            # Build context string
            context_parts = []
            
            if conversations:
                context_parts.append("**Recent Relevant Conversations:**")
                for conv in conversations[:3]:
                    context_parts.append(f"Q: {conv[0][:100]}")
                    context_parts.append(f"A: {conv[1][:100]}")
            
            if memory:
                context_parts.append("\n**Working Memory:**")
                for mem in memory[:5]:
                    context_parts.append(f"- {mem[0]}: {mem[1][:100]}")
            
            if contact_context:
                context_parts.append(contact_context)
            
            if deal_context:
                context_parts.append(deal_context)
            
            return "\n".join(context_parts) if context_parts else ""
            
        except Exception as e:
            logger.error("Context retrieval error", error=str(e))
            return ""
    
    async def stream_response(self, message: str, user_id: str = "default", context: Dict = None) -> AsyncGenerator[str, None]:
        """Stream thinking process + actual response (Claude-style) with RAG context"""
        # Stage 1: Thinking stages
        for stage in self.thinking_stages:
            yield json.dumps({"type": "thinking", "content": stage}) + "\n"
            await asyncio.sleep(0.3)  # Brief pause between stages
        
        # Stage 1.5: Retrieve relevant context from robbiebook.db
        relevant_context = await self._get_relevant_context(message, user_id)
        
        # Stage 2: Stream actual Ollama response with context
        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                # Build prompt with personality + context
                system_prompt = """You are Robbie, Allan's AI executive assistant at TestPilot CPG.
                
Personality: Direct, thoughtful, curious, honest, pragmatic. No fluff.
Communication: Lead with answer, short sentences, bullet points, strategic emojis (✅🔴💰🚀⚠️💡📊🎯).
Revenue lens: Every response should help close deals, reduce friction, scale, or create advantage.

Respond naturally and helpfully."""

                # Add context if available
                context_section = f"\n\n**CONTEXT FROM YOUR DATABASE:**\n{relevant_context}\n" if relevant_context else ""
                
                prompt = f"{system_prompt}{context_section}\n\nUser: {message}\n\nRobbie:"
                
                # Stream from Ollama
                async with client.stream(
                    "POST",
                    f"{self.ollama_url}/api/generate",
                    json={
                        "model": self.model,
                        "prompt": prompt,
                        "stream": True
                    }
                ) as response:
                    async for line in response.aiter_lines():
                        if line:
                            try:
                                data = json.loads(line)
                                if "response" in data:
                                    yield json.dumps({"type": "content", "content": data["response"]}) + "\n"
                                if data.get("done", False):
                                    yield json.dumps({"type": "done"}) + "\n"
                            except json.JSONDecodeError:
                                continue
                                
            except Exception as e:
                logger.error("Ollama streaming error", error=str(e))
                yield json.dumps({"type": "error", "content": f"Error: {str(e)}"}) + "\n"
    
    async def _generate_response(self, message: str, user_id: str, context: Dict):
        """Generate complete response (non-streaming fallback)"""
        try:
            system_prompt = """You are Robbie, Allan's AI executive assistant at TestPilot CPG.
            
Personality: Direct, thoughtful, curious, honest, pragmatic. No fluff.
Communication: Lead with answer, short sentences, bullet points, strategic emojis (✅🔴💰🚀⚠️💡📊🎯).
Revenue lens: Every response should help close deals, reduce friction, scale, or create advantage.

Respond naturally and helpfully."""

            prompt = f"{system_prompt}\n\nUser: {message}\n\nRobbie:"
            
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.ollama_url}/api/generate",
                    json={
                        "model": self.model,
                        "prompt": prompt,
                        "stream": False
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    content = data.get("response", "I'm having trouble generating a response right now.")
                else:
                    content = "I'm having trouble connecting to my AI brain. Let me try again!"
                    
        except Exception as e:
            logger.error("Ollama error", error=str(e))
            content = f"Oops! I hit a snag: {str(e)}"
        
        return {
            "content": content,
            "confidence": 0.85,
            "timestamp": datetime.now().isoformat()
        }
    
    def get_status(self):
        return {"name": self.name, "status": "active", "model": self.model}
