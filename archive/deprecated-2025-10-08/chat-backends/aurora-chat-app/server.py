#!/usr/bin/env python3
"""
Simple HTTP Server for Aurora Chat App
Serves the chat interface at aurora.testpilot.ai
"""

import http.server
import socketserver
import os
import sys
from pathlib import Path

# Get the directory of this script
script_dir = Path(__file__).parent
os.chdir(script_dir)

class ChatHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def do_GET(self):
        # Serve index.html for root path
        if self.path == '/' or self.path == '':
            self.path = '/index.html'
        return super().do_GET()

def start_server(port=8000):
    """Start the HTTP server"""
    try:
        with socketserver.TCPServer(("", port), ChatHTTPRequestHandler) as httpd:
            print(f"🌐 Aurora Chat App server started at http://localhost:{port}")
            print(f"📱 Chat interface available at: http://aurora.testpilot.ai:{port}")
            print("🛑 Press Ctrl+C to stop the server")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Server stopped")
    except Exception as e:
        print(f"❌ Server error: {e}")

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    start_server(port)
