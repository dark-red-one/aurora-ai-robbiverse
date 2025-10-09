#!/usr/bin/env python3
"""
Simple Ollama Mock - No Flask Required
Uses built-in Python HTTP server
"""

import http.server
import socketserver
import json
import time
import random
import urllib.parse

# Mock responses for different personalities
MOCK_RESPONSES = {
    "robbie": [
        "Hey Allan! I'm here and ready to help you build this empire! 🚀",
        "I can see you're working on the Aurora chat system - let's get this working! 💡",
        "The frontend looks amazing! Now let's make sure the AI backend is solid. ✅",
        "I'm excited to be your strategic partner in this venture! What's our next move? 🎯",
        "Revenue first, everything else second. That's how we build something that matters! 💰"
    ],
    "allanbot": [
        "Based on my analysis, we should focus on the core functionality first.",
        "I recommend prioritizing the chat interface over advanced features.",
        "The technical debt is manageable - let's ship this iteration.",
        "From a business perspective, this has strong market potential.",
        "I'm confident this approach will yield positive ROI."
    ],
    "kristina": [
        "As a VA expert, I'd suggest streamlining the user experience first.",
        "Let me help you organize the workflow for maximum efficiency.",
        "I've seen this pattern before - we can definitely optimize this process.",
        "The client will appreciate the clean, professional interface.",
        "I'll make sure everything runs smoothly on the operational side."
    ],
    "marketing": [
        "This is going to be a game-changer for our marketing efforts!",
        "I can already see the viral potential of this chat interface.",
        "Let's position this as the premium AI copilot experience.",
        "The branding is on point - Robbie's personality really shines through.",
        "We're going to dominate the AI copilot market with this! 🎯"
    ],
    "tech": [
        "The architecture is solid - we're using the right tech stack.",
        "I can optimize the performance once we get the core working.",
        "The microservices approach will scale beautifully.",
        "Let me review the code and suggest some improvements.",
        "This is exactly the kind of innovative tech that changes everything."
    ]
}

class OllamaMockHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {"status": "healthy", "service": "mock-ollama"}
            self.wfile.write(json.dumps(response).encode())
        elif self.path == '/api/tags':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {
                "models": [{
                    "name": "qwen2.5:7b",
                    "modified_at": "2025-10-07T03:30:00.000Z",
                    "size": 4294967296,
                    "digest": "sha256:abc123...",
                    "details": {
                        "parent_model": "",
                        "format": "gguf",
                        "family": "qwen",
                        "families": ["qwen"],
                        "parameter_size": "7B",
                        "quantization_level": "Q4_0"
                    }
                }]
            }
            self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        if self.path == '/api/generate':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
                model = data.get('model', 'qwen2.5:7b')
                prompt = data.get('prompt', '')
                
                # Extract personality from prompt
                personality = 'robbie'
                for p in MOCK_RESPONSES.keys():
                    if p.lower() in prompt.lower():
                        personality = p
                        break
                
                # Get a random response
                response_text = random.choice(MOCK_RESPONSES[personality])
                
                # Simulate processing time
                time.sleep(0.5)
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                
                response = {
                    "model": model,
                    "created_at": int(time.time()),
                    "response": response_text,
                    "done": True
                }
                self.wfile.write(json.dumps(response).encode())
                
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                error_response = {"error": str(e)}
                self.wfile.write(json.dumps(error_response).encode())
        else:
            self.send_response(404)
            self.end_headers()

if __name__ == '__main__':
    PORT = 11434
    print(f"🚀 Starting Simple Ollama Mock on port {PORT}...")
    print("✅ This will make Aurora chat work immediately!")
    
    with socketserver.TCPServer(("", PORT), OllamaMockHandler) as httpd:
        print(f"🎯 Mock Ollama running at http://localhost:{PORT}")
        httpd.serve_forever()