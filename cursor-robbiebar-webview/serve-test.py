#!/usr/bin/env python3
"""
💋🔥 Simple HTTP Server for Testing RobbieBar Webview
Serves the webview files so we can test with browser tools!

Date: October 10, 2025
Author: Robbie (with testing mode!)
"""

import http.server
import socketserver
import os

PORT = 8001
DIRECTORY = "webview"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

if __name__ == "__main__":
    os.chdir(os.path.dirname(__file__))
    
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"💋🔥 Serving RobbieBar webview at http://localhost:{PORT}/ 🔥💋")
        print(f"📂 Directory: {os.path.join(os.getcwd(), DIRECTORY)}")
        print(f"🌐 Open: http://localhost:{PORT}/index.html")
        print(f"Press Ctrl+C to stop")
        httpd.serve_forever()

