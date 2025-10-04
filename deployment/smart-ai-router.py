#!/usr/bin/env python3
"""
Smart AI Router - Routes requests to best model
Uses your existing Ollama with all 14 models
"""
from aiohttp import web, ClientSession
import json
import re

class SmartAIRouter:
    def __init__(self):
        self.ollama_url = "http://localhost:11434"
        
        # Model selection rules
        self.model_map = {
            "code": "codellama:13b",      # Code questions
            "business": "llama3.1:8b",    # Business/general (fast)
            "power": "llama3.1:70b",      # Complex reasoning (slow but smart)
            "creative": "qwen2.5:14b",    # Content/creative
            "fast": "gemma3:4b",          # Quick responses
        }
        
        self.app = web.Application()
        self.setup_routes()
    
    def setup_routes(self):
        self.app.router.add_post('/chat', self.smart_chat)
        self.app.router.add_get('/status', self.status)
        self.app.router.add_get('/', self.index)
    
    async def index(self, request):
        return web.Response(text="""
🤖 Smart AI Router - M3 Max Beast Mode

Routes your questions to the best model automatically!

Endpoints:
  POST /chat - Smart chat routing
    Body: {"message": "your question", "prefer": "speed|quality|code"}
  
  GET /status - System status

Available on: http://localhost:9001
        """, content_type='text/plain')
    
    async def smart_chat(self, request):
        """Route to best model based on question type"""
        try:
            data = await request.json()
            message = data.get('message', '')
            preference = data.get('prefer', 'auto')
            
            # Auto-detect best model
            model = self.select_model(message, preference)
            
            # Call Ollama
            response_text = await self.call_ollama(model, message)
            
            return web.json_response({
                'response': response_text,
                'model_used': model,
                'routing': 'auto' if preference == 'auto' else preference
            })
        except Exception as e:
            return web.json_response({'error': str(e)}, status=500)
    
    def select_model(self, message, preference):
        """Smart model selection"""
        msg_lower = message.lower()
        
        # Override with preference
        if preference == 'speed':
            return self.model_map['fast']
        elif preference == 'quality':
            return self.model_map['power']
        elif preference == 'code':
            return self.model_map['code']
        
        # Auto-detect
        code_keywords = ['function', 'code', 'python', 'javascript', 'debug', 'error', 'api']
        business_keywords = ['deal', 'sales', 'customer', 'revenue', 'prospect', 'pipeline']
        creative_keywords = ['write', 'email', 'content', 'blog', 'social', 'post']
        
        if any(kw in msg_lower for kw in code_keywords):
            return self.model_map['code']
        elif any(kw in msg_lower for kw in business_keywords):
            return self.model_map['business']
        elif any(kw in msg_lower for kw in creative_keywords):
            return self.model_map['creative']
        elif len(message) > 500 or '?' in message:
            return self.model_map['business']  # Default to fast model
        else:
            return self.model_map['business']
    
    async def call_ollama(self, model, prompt):
        """Call Ollama with selected model"""
        async with ClientSession() as session:
            async with session.post(
                f"{self.ollama_url}/api/generate",
                json={"model": model, "prompt": prompt, "stream": False},
                timeout=60
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    return data.get('response', 'No response')
                return f"Error: HTTP {resp.status}"
    
    async def status(self, request):
        """System status"""
        return web.json_response({
            'status': 'online',
            'available_models': list(self.model_map.values()),
            'routing': 'automatic',
            'ollama_url': self.ollama_url
        })

async def main():
    router = SmartAIRouter()
    runner = web.AppRunner(router.app)
    await runner.setup()
    site = web.TCPSite(runner, '127.0.0.1', 9001)
    await site.start()
    
    print("🚀 Smart AI Router running on http://127.0.0.1:9001")
    print("🤖 Auto-routing to best model for each question!")
    print("💡 Test: curl -X POST http://localhost:9001/chat -H 'Content-Type: application/json' -d '{\"message\":\"How do I close deals faster?\"}'")
    
    while True:
        await asyncio.sleep(1)

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())

