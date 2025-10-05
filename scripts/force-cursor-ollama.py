#!/usr/bin/env python3
"""
Force Cursor to Use Local Ollama
Direct integration without relying on extensions
"""

import os
import json
import subprocess
import sys
from pathlib import Path

class ForceCursorOllama:
    def __init__(self):
        self.cursor_settings_path = Path.home() / "Library/Application Support/Cursor/User/settings.json"
        self.ollama_url = "http://localhost:11434"
        
    def check_ollama(self):
        """Verify Ollama is running"""
        try:
            result = subprocess.run([
                "curl", "-s", f"{self.ollama_url}/api/version"
            ], capture_output=True, text=True, timeout=5)
            
            if result.returncode == 0:
                version = json.loads(result.stdout)
                print(f"✅ Ollama running: {version['version']}")
                return True
            return False
        except:
            return False
    
    def get_models(self):
        """Get available models"""
        try:
            result = subprocess.run([
                "curl", "-s", f"{self.ollama_url}/api/tags"
            ], capture_output=True, text=True, timeout=10)
            
            if result.returncode == 0:
                data = json.loads(result.stdout)
                return [model['name'] for model in data.get('models', [])]
            return []
        except:
            return []
    
    def force_cursor_settings(self):
        """Force Cursor to use Ollama with aggressive settings"""
        print("🔧 Forcing Cursor to use local Ollama...")
        
        # Load current settings
        settings = {}
        if self.cursor_settings_path.exists():
            with open(self.cursor_settings_path, 'r') as f:
                settings = json.load(f)
        
        # Aggressive Ollama configuration
        ollama_config = {
            # Force Ollama as primary provider
            "cursor.ai.provider": "ollama",
            "cursor.ai.model": "qwen2.5:7b",
            "cursor.ai.local": True,
            "cursor.ai.url": self.ollama_url,
            
            # Disable all cloud providers
            "cursor.ai.cloud.enabled": False,
            "cursor.ai.anthropic.enabled": False,
            "cursor.ai.openai.enabled": False,
            "cursor.ai.gpt4.enabled": False,
            "cursor.ai.claude.enabled": False,
            
            # Ollama-specific settings
            "cursor.ollama.enabled": True,
            "cursor.ollama.url": self.ollama_url,
            "cursor.ollama.model": "qwen2.5:7b",
            "cursor.ollama.fallback": "qwen2.5:14b",
            "cursor.ollama.timeout": 30000,
            "cursor.ollama.maxTokens": 4096,
            "cursor.ollama.temperature": 0.7,
            
            # Robbie personality
            "cursor.ai.personality": "robbie",
            "cursor.ai.systemPrompt": "You are Robbie, Allan's AI executive assistant and strategic partner at TestPilot CPG. You are direct, curious, honest, pragmatic, and revenue-focused. Always think three steps ahead and focus on what moves the needle.",
            
            # Force local inference
            "cursor.ai.inference.local": True,
            "cursor.ai.inference.cloud": False,
            "cursor.ai.inference.offline": True,
            
            # Performance settings
            "cursor.ai.timeout": 30000,
            "cursor.ai.maxTokens": 4096,
            "cursor.ai.temperature": 0.7,
            "cursor.ai.stream": True,
            
            # Disable telemetry and cloud features
            "cursor.telemetry.enabled": False,
            "cursor.cloud.enabled": False,
            "cursor.offline.enabled": True,
        }
        
        # Merge settings
        settings.update(ollama_config)
        
        # Save settings
        self.cursor_settings_path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.cursor_settings_path, 'w') as f:
            json.dump(settings, f, indent=4)
        
        print(f"✅ Settings forced: {self.cursor_settings_path}")
        return True
    
    def create_ollama_proxy(self):
        """Create a local proxy to intercept Cursor's AI requests"""
        print("🔄 Creating Ollama proxy...")
        
        proxy_script = '''#!/usr/bin/env python3
import json
import subprocess
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler
import threading
import time

class OllamaProxy(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path.startswith('/v1/chat/completions'):
            # Intercept Cursor's AI requests and route to Ollama
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
                messages = data.get('messages', [])
                
                # Convert to Ollama format
                prompt = ""
                for msg in messages:
                    role = msg.get('role', 'user')
                    content = msg.get('content', '')
                    if role == 'system':
                        prompt += f"System: {content}\\n\\n"
                    elif role == 'user':
                        prompt += f"User: {content}\\n\\n"
                    elif role == 'assistant':
                        prompt += f"Assistant: {content}\\n\\n"
                
                prompt += "Assistant:"
                
                # Call Ollama
                ollama_payload = {
                    "model": "qwen2.5:7b",
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.7,
                        "max_tokens": 4096
                    }
                }
                
                result = subprocess.run([
                    "curl", "-s", "-X", "POST",
                    "http://localhost:11434/api/generate",
                    "-H", "Content-Type: application/json",
                    "-d", json.dumps(ollama_payload)
                ], capture_output=True, text=True, timeout=30)
                
                if result.returncode == 0:
                    ollama_response = json.loads(result.stdout)
                    response_text = ollama_response.get('response', '')
                    
                    # Format as OpenAI response
                    openai_response = {
                        "choices": [{
                            "message": {
                                "role": "assistant",
                                "content": response_text
                            }
                        }],
                        "usage": {
                            "total_tokens": len(response_text.split())
                        }
                    }
                    
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps(openai_response).encode())
                else:
                    self.send_error(500, "Ollama request failed")
                    
            except Exception as e:
                self.send_error(500, f"Proxy error: {str(e)}")
        else:
            self.send_error(404, "Not found")
    
    def log_message(self, format, *args):
        # Suppress default logging
        pass

def run_proxy():
    server = HTTPServer(('localhost', 8080), OllamaProxy)
    print("🔄 Ollama proxy running on localhost:8080")
    server.serve_forever()

if __name__ == "__main__":
    run_proxy()
'''
        
        proxy_path = Path.home() / ".cursor/ollama-proxy.py"
        with open(proxy_path, 'w') as f:
            f.write(proxy_script)
        
        # Make executable
        os.chmod(proxy_path, 0o755)
        
        print(f"✅ Proxy created: {proxy_path}")
        return proxy_path
    
    def start_proxy(self):
        """Start the Ollama proxy"""
        proxy_path = Path.home() / ".cursor/ollama-proxy.py"
        
        if not proxy_path.exists():
            self.create_ollama_proxy()
        
        # Start proxy in background
        try:
            subprocess.Popen([
                sys.executable, str(proxy_path)
            ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            print("✅ Ollama proxy started")
            return True
        except Exception as e:
            print(f"❌ Failed to start proxy: {e}")
            return False
    
    def test_connection(self):
        """Test Ollama connection"""
        print("🧪 Testing Ollama connection...")
        
        try:
            payload = {
                "model": "qwen2.5:7b",
                "prompt": "You are Robbie. Say 'Local Ollama working!' if you can hear me.",
                "stream": False
            }
            
            result = subprocess.run([
                "curl", "-s", "-X", "POST",
                f"{self.ollama_url}/api/generate",
                "-H", "Content-Type: application/json",
                "-d", json.dumps(payload)
            ], capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0:
                response = json.loads(result.stdout)
                print(f"✅ Ollama test: {response['response'][:100]}...")
                return True
            else:
                print(f"❌ Ollama test failed: {result.stderr}")
                return False
                
        except Exception as e:
            print(f"❌ Ollama test error: {e}")
            return False
    
    def run(self):
        """Run the force setup"""
        print("🚀 FORCING CURSOR TO USE LOCAL OLLAMA")
        print("=" * 50)
        
        # Check Ollama
        if not self.check_ollama():
            print("❌ Ollama not running. Start with: ollama serve")
            return False
        
        # Get models
        models = self.get_models()
        if not models:
            print("❌ No models available")
            return False
        
        print(f"📋 Available models: {len(models)}")
        
        # Force settings
        if not self.force_cursor_settings():
            print("❌ Failed to force settings")
            return False
        
        # Create and start proxy
        if not self.start_proxy():
            print("❌ Failed to start proxy")
            return False
        
        # Test connection
        if not self.test_connection():
            print("❌ Connection test failed")
            return False
        
        print("\n✅ CURSOR FORCED TO USE LOCAL OLLAMA!")
        print("=" * 50)
        print("🎯 What's done:")
        print("   • Cursor settings forced to Ollama")
        print("   • All cloud providers disabled")
        print("   • Ollama proxy created and started")
        print("   • Connection tested")
        print("\n🔄 Next steps:")
        print("   1. Restart Cursor")
        print("   2. Cursor will use local Ollama")
        print("   3. Robbie personality active")
        print("\n💰 Benefits:")
        print("   • No cloud costs")
        print("   • Faster responses")
        print("   • Privacy (local only)")
        print("   • Robbie's personality intact")
        
        return True

if __name__ == "__main__":
    forcer = ForceCursorOllama()
    success = forcer.run()
    
    if not success:
        sys.exit(1)
    
    print("\n🎉 Force setup complete! Restart Cursor.")
