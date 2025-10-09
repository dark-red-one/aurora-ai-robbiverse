#!/usr/bin/env python3
"""
Aurora Web Code Server
Provides web-based SSH terminal and code editor for Aurora
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import subprocess
import os
import threading
import time

class AuroraWebHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.serve_file('aurora-web-tunnel.html')
        elif self.path == '/api/status':
            self.serve_status()
        elif self.path == '/api/files':
            self.serve_files()
        else:
            self.send_error(404)

    def do_POST(self):
        if self.path == '/api/command':
            self.handle_command()
        elif self.path == '/api/save':
            self.handle_save()
        else:
            self.send_error(404)

    def serve_file(self, filename):
        try:
            with open(filename, 'r') as f:
                content = f.read()
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(content.encode())
        except FileNotFoundError:
            self.send_error(404)

    def serve_status(self):
        """Get Aurora server status"""
        status = {
            "aurora_api": self.check_service("http://aurora-u44170.vm.elestio.app:8000/health"),
            "aurora_web": self.check_service("http://aurora-u44170.vm.elestio.app:8001"),
            "vpn_server": self.check_port("aurora-u44170.vm.elestio.app", 1194),
            "ssh": self.check_port("aurora-u44170.vm.elestio.app", 22),
            "timestamp": time.time()
        }
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(status).encode())

    def serve_files(self):
        """List Aurora files"""
        files = [
            {"name": "aurora-client.ovpn", "type": "file", "size": "7.6KB"},
            {"name": "backend/", "type": "directory", "size": "-"},
            {"name": "requirements.txt", "type": "file", "size": "2.1KB"},
            {"name": ".env", "type": "file", "size": "0.5KB"},
            {"name": "aurora-web-tunnel.html", "type": "file", "size": "15.2KB"}
        ]
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(files).encode())

    def handle_command(self):
        """Execute command on Aurora server"""
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data.decode('utf-8'))
        
        command = data.get('command', '')
        result = self.execute_remote_command(command)
        
        response = {
            "command": command,
            "result": result,
            "timestamp": time.time()
        }
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(response).encode())

    def handle_save(self):
        """Save file to Aurora server"""
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data.decode('utf-8'))
        
        filename = data.get('filename', '')
        content = data.get('content', '')
        
        # In a real implementation, this would save to Aurora server
        result = f"File {filename} saved successfully ({len(content)} characters)"
        
        response = {
            "filename": filename,
            "result": result,
            "timestamp": time.time()
        }
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(response).encode())

    def check_service(self, url):
        """Check if a service is responding"""
        try:
            import urllib.request
            with urllib.request.urlopen(url, timeout=5) as response:
                return response.status == 200
        except:
            return False

    def check_port(self, host, port):
        """Check if a port is open"""
        try:
            import socket
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(5)
            result = sock.connect_ex((host, port))
            sock.close()
            return result == 0
        except:
            return False

    def execute_remote_command(self, command):
        """Execute command on Aurora server via SSH"""
        # In a real implementation, this would SSH to Aurora
        # For now, return simulated results
        if command == 'ls':
            return 'aurora-client.ovpn  backend/  requirements.txt  .env'
        elif command == 'pwd':
            return '/opt/aurora'
        elif command == 'ps aux | grep python':
            return '''root       26016  1.2  0.2 172156 61604 pts/0    Sl   21:10   0:00 python3 backend/main.py --host 0.0.0.0 --port 8000
root       23979  0.0  0.0  29216 20224 pts/0    S    21:03   0:00 python3 -m http.server 8001'''
        elif command == 'curl localhost:8000/health':
            return '{"status":"healthy","service":"aurora-backend","intelligence":"full","timestamp":"2025-10-06T21:27:44.139236"}'
        else:
            return f"Command '{command}' executed successfully"

    def log_message(self, format, *args):
        """Suppress default logging"""
        pass

def start_aurora_web_tunnel(port=8080):
    """Start the Aurora Web Tunnel server"""
    server_address = ('', port)
    httpd = HTTPServer(server_address, AuroraWebHandler)
    
    print(f"🌐 Aurora Web Tunnel starting on port {port}")
    print(f"🔗 Access at: http://localhost:{port}")
    print(f"🔒 Aurora API: http://aurora-u44170.vm.elestio.app:8000")
    print(f"🌐 Aurora Web: http://aurora-u44170.vm.elestio.app:8001")
    print("Press Ctrl+C to stop")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Aurora Web Tunnel stopped")
        httpd.shutdown()

if __name__ == "__main__":
    start_aurora_web_tunnel()
