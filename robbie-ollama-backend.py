#!/usr/bin/env python3
"""
Robbie Ollama Backend - Connects the Robbie Terminal to Ollama AI
"""
import asyncio
import json
import os
import sys
from datetime import datetime
from aiohttp import web, ClientSession
try:
    import aiohttp_cors
except ImportError:
    print("aiohttp_cors not available, using basic CORS handling")
    aiohttp_cors = None

class RobbieOllamaBackend:
    def __init__(self):
        self.app = web.Application()
        self.ollama_url = "http://localhost:11434"
        self.default_model = "llama3.1:8b"  # Fast and capable model
        self.setup_routes()
        self.setup_cors()

    def setup_cors(self):
        """Setup CORS for web requests"""
        if aiohttp_cors:
            cors = aiohttp_cors.setup(self.app, defaults={
                "*": aiohttp_cors.ResourceOptions(
                    allow_credentials=True,
                    expose_headers="*",
                    allow_headers="*",
                    allow_methods="*"
                )
            })
            
            for route in list(self.app.router.routes()):
                cors.add(route)
        else:
            # Basic CORS headers
            async def cors_handler(request, handler):
                response = await handler(request)
                response.headers['Access-Control-Allow-Origin'] = '*'
                response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
                response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
                return response
            
            self.app.middlewares.append(cors_handler)

    def setup_routes(self):
        """Setup API routes"""
        self.app.router.add_get('/', self.index_handler)
        self.app.router.add_post('/api/chat', self.chat_handler)
        self.app.router.add_get('/api/models', self.models_handler)
        self.app.router.add_post('/api/set-model', self.set_model_handler)
        self.app.router.add_get('/api/status', self.status_handler)
        # Also add routes for the HTML files
        self.app.router.add_get('/robbie-avatar-chat.html', self.avatar_chat_handler)
        self.app.router.add_get('/robbie-terminal.html', self.terminal_handler)

    async def index_handler(self, request):
        """Serve the Robbie Terminal Interface"""
        html_path = os.path.join(os.path.dirname(__file__), 'robbie-terminal.html')
        if os.path.exists(html_path):
            with open(html_path, 'r') as f:
                content = f.read()
            return web.Response(text=content, content_type='text/html')
        else:
            return web.Response(text="Robbie Terminal Interface not found", status=404)

    async def chat_handler(self, request):
        """Handle chat requests to Ollama"""
        try:
            data = await request.json()
            message = data.get('message', '')
            model = data.get('model', self.default_model)
            
            if not message:
                return web.json_response({'error': 'No message provided'}, status=400)
            
            # Call Ollama API
            ollama_response = await self.call_ollama(model, message)
            
            return web.json_response({
                'response': ollama_response,
                'model': model,
                'timestamp': datetime.now().isoformat()
            })
            
        except Exception as e:
            print(f"Error in chat_handler: {e}")
            return web.json_response({'error': str(e)}, status=500)

    async def models_handler(self, request):
        """Get available Ollama models"""
        try:
            async with ClientSession() as session:
                async with session.get(f"{self.ollama_url}/api/tags") as response:
                    if response.status == 200:
                        models_data = await response.json()
                        return web.json_response({
                            'models': models_data.get('models', []),
                            'current_model': self.default_model
                        })
                    else:
                        return web.json_response({'error': 'Failed to fetch models'}, status=500)
        except Exception as e:
            return web.json_response({'error': str(e)}, status=500)

    async def set_model_handler(self, request):
        """Set the default model"""
        try:
            data = await request.json()
            model = data.get('model')
            if model:
                self.default_model = model
                return web.json_response({'success': True, 'model': model})
            else:
                return web.json_response({'error': 'No model specified'}, status=400)
        except Exception as e:
            return web.json_response({'error': str(e)}, status=500)

    async def status_handler(self, request):
        """Get backend status"""
        try:
            # Check if Ollama is running
            async with ClientSession() as session:
                async with session.get(f"{self.ollama_url}/api/tags", timeout=5) as response:
                    ollama_status = response.status == 200

            return web.json_response({
                'status': 'online' if ollama_status else 'offline',
                'ollama_connected': ollama_status,
                'default_model': self.default_model,
                'timestamp': datetime.now().isoformat()
            })
        except:
            return web.json_response({
                'status': 'offline',
                'ollama_connected': False,
                'default_model': self.default_model,
                'timestamp': datetime.now().isoformat()
            })

    async def avatar_chat_handler(self, request):
        """Serve the Robbie Avatar Chat Interface"""
        html_path = os.path.join(os.path.dirname(__file__), 'robbie-avatar-chat.html')
        if os.path.exists(html_path):
            with open(html_path, 'r') as f:
                content = f.read()
            return web.Response(text=content, content_type='text/html')
        else:
            return web.Response(text="Robbie Avatar Chat Interface not found", status=404)

    async def terminal_handler(self, request):
        """Serve the Robbie Terminal Interface"""
        html_path = os.path.join(os.path.dirname(__file__), 'robbie-terminal.html')
        if os.path.exists(html_path):
            with open(html_path, 'r') as f:
                content = f.read()
            return web.Response(text=content, content_type='text/html')
        else:
            return web.Response(text="Robbie Terminal Interface not found", status=404)

    async def call_ollama(self, model, message):
        """Call Ollama API with the message"""
        try:
            payload = {
                "model": model,
                "prompt": f"You are Robbie, Allan's AI assistant. You're helpful, intelligent, and have access to the Aurora AI Empire. Respond as Robbie: {message}",
                "stream": False
            }
            
            async with ClientSession() as session:
                async with session.post(f"{self.ollama_url}/api/generate", 
                                      json=payload, 
                                      timeout=30) as response:
                    if response.status == 200:
                        result = await response.json()
                        return result.get('response', 'No response from Ollama')
                    else:
                        return f"Error: Ollama returned status {response.status}"
        except Exception as e:
            return f"Error calling Ollama: {str(e)}"

    async def start_server(self, host='127.0.0.1', port=9000):
        """Start the web server"""
        print(f"🚀 Starting Robbie Ollama Backend on http://{host}:{port}")
        print(f"🤖 Default Model: {self.default_model}")
        print(f"🔗 Ollama URL: {self.ollama_url}")
        print("📊 Available endpoints:")
        print("   GET  / - Robbie Terminal Interface")
        print("   POST /api/chat - Chat with Ollama")
        print("   GET  /api/models - List available models")
        print("   POST /api/set-model - Set default model")
        print("   GET  /api/status - Backend status")
        print("=" * 50)
        
        runner = web.AppRunner(self.app)
        await runner.setup()
        site = web.TCPSite(runner, host, port)
        await site.start()
        
        print(f"✅ Robbie Ollama Backend is LIVE!")
        print(f"🌐 Open: http://{host}:{port}")
        print("Press Ctrl+C to stop")

        # Keep the server running
        try:
            while True:
                await asyncio.sleep(1)
        except KeyboardInterrupt:
            print("\n🛑 Robbie Ollama Backend stopped")

if __name__ == "__main__":
    try:
        asyncio.run(RobbieOllamaBackend().start_server())
    except KeyboardInterrupt:
        print("\n🛑 Robbie Ollama Backend stopped")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
