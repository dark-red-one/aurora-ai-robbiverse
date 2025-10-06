#!/usr/bin/env python3

"""
🌐 Aurora AI Empire Live Network Map Server
===========================================
Real-time network monitoring with live dashboard
"""

import subprocess
import json
import time
import threading
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler
import psutil
import os

class NetworkStatus:
    def __init__(self):
        self.nodes = {
            'Aurora (Current)': {'host': 'localhost', 'port': 8000, 'user': 'allan', 'role': 'Primary Development Hub', 'gpu': '2x RTX 4090 (48GB VRAM)', 'status': 'active'},
            'Vengeance': {'host': 'vengeance', 'port': 22, 'user': 'allan', 'role': 'Local Backup', 'gpu': '1x RTX 4090 (24GB VRAM)', 'status': 'active'},
            'RobbieBook1': {'host': '192.199.240.226', 'port': 22, 'user': 'allanperetz', 'role': 'MacBook Pro', 'gpu': 'No GPU (CPU only)', 'status': 'active'},
            'RunPod Aurora': {'host': '82.221.170.242', 'port': 24505, 'user': 'root', 'role': 'Cloud GPU #1', 'gpu': '2x RTX 4090 (48GB VRAM)', 'status': 'inactive'},
            'RunPod Collaboration': {'host': '213.181.111.2', 'port': 43540, 'user': 'root', 'role': 'Cloud GPU #2', 'gpu': '1x RTX 4090 (24GB VRAM)', 'status': 'inactive'},
            'RunPod Fluenti': {'host': '103.196.86.56', 'port': 19777, 'user': 'root', 'role': 'Cloud GPU #3', 'gpu': '1x RTX 4090 (24GB VRAM)', 'status': 'inactive'}
        }
        self.status = {}
        self.last_update = datetime.now()
        
    def ping_test(self, host):
        try:
            result = subprocess.run(['ping', '-c', '1', '-W', '2', host], 
                                  capture_output=True, text=True, timeout=5)
            return result.returncode == 0
        except:
            return False

    def ssh_test(self, host, port, user):
        try:
            cmd = ['ssh', '-o', 'ConnectTimeout=3', '-o', 'StrictHostKeyChecking=no', 
                   '-p', str(port), f'{user}@{host}', 'echo "SSH OK"']
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
            return result.returncode == 0
        except:
            return False

    def http_test(self, host, port):
        try:
            import requests
            response = requests.get(f'http://{host}:{port}/health', timeout=3)
            return response.status_code == 200
        except:
            return False

    def get_local_system_info(self):
        try:
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            return {
                'CPU': f"{cpu_percent:.1f}%",
                'MEM': f"{memory.percent:.1f}%",
                'DISK': f"{(disk.used / disk.total * 100):.1f}%"
            }
        except:
            return {}

    def update_status(self):
        print(f"🔄 Updating network status at {datetime.now().strftime('%H:%M:%S')}")
        
        # Local system info
        local_info = self.get_local_system_info()
        
        for name, config in self.nodes.items():
            host = config['host']
            port = config['port']
            user = config['user']
            
            # Test ping
            ping_ok = self.ping_test(host)
            
            # Test SSH or HTTP based on port
            if port in [8000, 8001, 8007]:  # HTTP services
                service_ok = self.http_test(host, port)
            else:  # SSH services
                service_ok = self.ssh_test(host, port, user) if ping_ok else False
            
            # Determine status based on node type
            if config.get('status') == 'inactive':
                status = 'offline'  # RunPod nodes that aren't activated
            elif ping_ok and service_ok:
                status = 'online'
            elif ping_ok:
                status = 'warning'
            else:
                status = 'offline'
            
            self.status[name] = {
                'host': host,
                'port': port,
                'user': user,
                'role': config['role'],
                'gpu': config['gpu'],
                'ping': ping_ok,
                'ssh': service_ok,
                'status': status,
                'local_info': local_info if name == 'Aurora (Current)' else {}
            }
        
        self.last_update = datetime.now()
        print(f"✅ Status updated: {sum(1 for s in self.status.values() if s['status'] == 'online')}/{len(self.status)} nodes online")

class LiveMapHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.serve_map()
        elif self.path == '/api/status':
            self.serve_status()
        elif self.path.startswith('/api/ping/'):
            host = self.path.split('/')[-1]
            self.serve_ping(host)
        elif self.path.startswith('/api/ssh/'):
            parts = self.path.split('/')
            host = parts[-2]
            port = int(parts[-1])
            self.serve_ssh(host, port)
        else:
            self.send_error(404)

    def serve_map(self):
        try:
            with open('live-network-map.html', 'r') as f:
                content = f.read()
            
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(content.encode())
        except FileNotFoundError:
            self.send_error(404, "Live map file not found")

    def serve_status(self):
        status_data = {
            'timestamp': network_status.last_update.isoformat(),
            'nodes': network_status.status,
            'summary': {
                'total': len(network_status.status),
                'online': sum(1 for s in network_status.status.values() if s['status'] == 'online'),
                'warning': sum(1 for s in network_status.status.values() if s['status'] == 'warning'),
                'offline': sum(1 for s in network_status.status.values() if s['status'] == 'offline')
            }
        }
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(status_data, indent=2).encode())

    def serve_ping(self, host):
        result = network_status.ping_test(host)
        self.send_response(200 if result else 404)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({'ping': result}).encode())

    def serve_ssh(self, host, port):
        # Find the user for this host
        user = 'root'
        for node in network_status.nodes.values():
            if node['host'] == host and node['port'] == port:
                user = node['user']
                break
        
        result = network_status.ssh_test(host, port, user)
        self.send_response(200 if result else 404)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({'ssh': result}).encode())

def start_status_updater():
    """Background thread to update network status"""
    while True:
        network_status.update_status()
        time.sleep(30)  # Update every 30 seconds

if __name__ == "__main__":
    network_status = NetworkStatus()
    
    # Start background status updater
    updater_thread = threading.Thread(target=start_status_updater, daemon=True)
    updater_thread.start()
    
    # Initial status update
    network_status.update_status()
    
    # Start HTTP server
    server = HTTPServer(('0.0.0.0', 8080), LiveMapHandler)
    print("🌐 Aurora AI Empire Live Network Map Server")
    print("=" * 50)
    print("🚀 Server starting on http://localhost:8080")
    print("📊 Live dashboard: http://localhost:8080")
    print("🔌 API endpoint: http://localhost:8080/api/status")
    print("⏳ Updating network status every 30 seconds...")
    print("Press Ctrl+C to stop")
    print()
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Server stopped")
        server.shutdown()
