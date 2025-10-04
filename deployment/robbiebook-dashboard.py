#!/usr/bin/env python3
"""
RobbieBook1.testpilot.ai - Aurora AI Empire Dashboard
Real-time monitoring and control for RobbieBook1
"""
import asyncio
import aiohttp
import aiofiles
import json
import time
import os
from datetime import datetime
from pathlib import Path
import psutil
import subprocess

class RobbieBookDashboard:
    """Real-time dashboard for RobbieBook1.testpilot.ai"""
    
    def __init__(self):
        self.aurora_url = "http://localhost:8000"
        self.proxy_port = 8080
        self.cache_dir = Path("./robbiebook_cache")
        self.start_time = time.time()
    
    async def get_aurora_status(self):
        """Get Aurora AI backend status"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.aurora_url}/health") as response:
                    if response.status == 200:
                        data = await response.json()
                        return {
                            "status": "online",
                            "uptime": data.get("uptime", "unknown"),
                            "version": data.get("version", "unknown"),
                            "active_connections": data.get("active_connections", 0)
                        }
        except:
            pass
        return {"status": "offline", "uptime": "0s", "version": "unknown", "active_connections": 0}
    
    def get_proxy_status(self):
        """Get RobbieBook1 proxy status"""
        try:
            # Check if proxy process is running
            for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
                if 'robbiebook-proxy.py' in ' '.join(proc.info['cmdline'] or []):
                    return {
                        "status": "running",
                        "pid": proc.info['pid'],
                        "memory": proc.memory_info().rss / 1024 / 1024,  # MB
                        "cpu": proc.cpu_percent()
                    }
        except:
            pass
        return {"status": "stopped", "pid": None, "memory": 0, "cpu": 0}
    
    def get_cache_stats(self):
        """Get cache statistics"""
        if not self.cache_dir.exists():
            return {"size": 0, "files": 0, "oldest": None, "newest": None}
        
        files = list(self.cache_dir.glob("*.cache"))
        total_size = sum(f.stat().st_size for f in files)
        
        if files:
            times = [f.stat().st_mtime for f in files]
            oldest = min(times)
            newest = max(times)
        else:
            oldest = newest = None
        
        return {
            "size": total_size,
            "files": len(files),
            "oldest": datetime.fromtimestamp(oldest).isoformat() if oldest else None,
            "newest": datetime.fromtimestamp(newest).isoformat() if newest else None
        }
    
    def get_system_stats(self):
        """Get system statistics"""
        return {
            "cpu_percent": psutil.cpu_percent(interval=1),
            "memory_percent": psutil.virtual_memory().percent,
            "disk_percent": psutil.disk_usage('/').percent,
            "load_average": os.getloadavg() if hasattr(os, 'getloadavg') else [0, 0, 0]
        }
    
    async def get_network_stats(self):
        """Get network statistics"""
        try:
            # Test proxy with a simple request
            start_time = time.time()
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"http://127.0.0.1:{self.proxy_port}/httpbin.org/status/200",
                    timeout=aiohttp.ClientTimeout(total=5)
                ) as response:
                    response_time = (time.time() - start_time) * 1000
                    return {
                        "proxy_response_time": response_time,
                        "proxy_status": "online" if response.status == 200 else "error"
                    }
        except:
            return {"proxy_response_time": 0, "proxy_status": "offline"}
    
    async def generate_dashboard_html(self):
        """Generate real-time dashboard HTML"""
        # Gather all statistics
        aurora_status = await self.get_aurora_status()
        proxy_status = self.get_proxy_status()
        cache_stats = self.get_cache_stats()
        system_stats = self.get_system_stats()
        network_stats = await self.get_network_stats()
        
        uptime = time.time() - self.start_time
        
        html = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RobbieBook1.testpilot.ai - Aurora AI Empire Dashboard</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="shortcut icon" type="image/svg+xml" href="/favicon.svg">
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ 
            font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
        }}
        .container {{ max-width: 1200px; margin: 0 auto; padding: 20px; }}
        .header {{ text-align: center; margin-bottom: 30px; }}
        .header h1 {{ font-size: 2.5em; margin-bottom: 10px; }}
        .header p {{ font-size: 1.2em; opacity: 0.9; }}
        .grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }}
        .card {{ 
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 20px;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }}
        .card h3 {{ margin-bottom: 15px; font-size: 1.3em; }}
        .status {{ 
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 0.9em;
        }}
        .status.online {{ background: #4CAF50; }}
        .status.offline {{ background: #f44336; }}
        .status.running {{ background: #2196F3; }}
        .status.stopped {{ background: #ff9800; }}
        .metric {{ margin: 10px 0; }}
        .metric-label {{ font-weight: bold; margin-right: 10px; }}
        .metric-value {{ opacity: 0.9; }}
        .progress-bar {{ 
            width: 100%;
            height: 8px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 4px;
            overflow: hidden;
            margin: 5px 0;
        }}
        .progress-fill {{ 
            height: 100%;
            background: linear-gradient(90deg, #4CAF50, #8BC34A);
            transition: width 0.3s ease;
        }}
        .refresh-btn {{ 
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            padding: 10px 20px;
            border-radius: 25px;
            cursor: pointer;
            font-size: 1em;
        }}
        .refresh-btn:hover {{ background: rgba(255, 255, 255, 0.3); }}
        .timestamp {{ 
            position: fixed;
            bottom: 20px;
            right: 20px;
            opacity: 0.7;
            font-size: 0.9em;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🤖 RobbieBook1.testpilot.ai</h1>
            <p>Aurora AI Empire - Real-time Dashboard</p>
        </div>
        
        <div class="grid">
            <!-- Aurora AI Backend -->
            <div class="card">
                <h3>🧠 Aurora AI Backend</h3>
                <div class="metric">
                    <span class="metric-label">Status:</span>
                    <span class="status {'online' if aurora_status['status'] == 'online' else 'offline'}">
                        {aurora_status['status']}
                    </span>
                </div>
                <div class="metric">
                    <span class="metric-label">Uptime:</span>
                    <span class="metric-value">{aurora_status['uptime']}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Version:</span>
                    <span class="metric-value">{aurora_status['version']}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Active Connections:</span>
                    <span class="metric-value">{aurora_status['active_connections']}</span>
                </div>
            </div>
            
            <!-- RobbieBook1 Proxy -->
            <div class="card">
                <h3>🌐 RobbieBook1 Proxy</h3>
                <div class="metric">
                    <span class="metric-label">Status:</span>
                    <span class="status {'running' if proxy_status['status'] == 'running' else 'stopped'}">
                        {proxy_status['status']}
                    </span>
                </div>
                <div class="metric">
                    <span class="metric-label">PID:</span>
                    <span class="metric-value">{proxy_status['pid'] or 'N/A'}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Memory:</span>
                    <span class="metric-value">{proxy_status['memory']:.1f} MB</span>
                </div>
                <div class="metric">
                    <span class="metric-label">CPU:</span>
                    <span class="metric-value">{proxy_status['cpu']:.1f}%</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Response Time:</span>
                    <span class="metric-value">{network_stats['proxy_response_time']:.1f}ms</span>
                </div>
            </div>
            
            <!-- Cache Statistics -->
            <div class="card">
                <h3>💾 Cache Statistics</h3>
                <div class="metric">
                    <span class="metric-label">Cache Size:</span>
                    <span class="metric-value">{cache_stats['size'] / 1024 / 1024:.1f} MB</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Cached Files:</span>
                    <span class="metric-value">{cache_stats['files']}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Oldest Cache:</span>
                    <span class="metric-value">{cache_stats['oldest'] or 'N/A'}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Newest Cache:</span>
                    <span class="metric-value">{cache_stats['newest'] or 'N/A'}</span>
                </div>
            </div>
            
            <!-- System Resources -->
            <div class="card">
                <h3>⚡ System Resources</h3>
                <div class="metric">
                    <span class="metric-label">CPU Usage:</span>
                    <span class="metric-value">{system_stats['cpu_percent']:.1f}%</span>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: {system_stats['cpu_percent']}%"></div>
                    </div>
                </div>
                <div class="metric">
                    <span class="metric-label">Memory Usage:</span>
                    <span class="metric-value">{system_stats['memory_percent']:.1f}%</span>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: {system_stats['memory_percent']}%"></div>
                    </div>
                </div>
                <div class="metric">
                    <span class="metric-label">Disk Usage:</span>
                    <span class="metric-value">{system_stats['disk_percent']:.1f}%</span>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: {system_stats['disk_percent']}%"></div>
                    </div>
                </div>
                <div class="metric">
                    <span class="metric-label">Load Average:</span>
                    <span class="metric-value">{system_stats['load_average'][0]:.2f}, {system_stats['load_average'][1]:.2f}, {system_stats['load_average'][2]:.2f}</span>
                </div>
            </div>
            
            <!-- Network Performance -->
            <div class="card">
                <h3>🌐 Network Performance</h3>
                <div class="metric">
                    <span class="metric-label">Proxy Status:</span>
                    <span class="status {'online' if network_stats['proxy_status'] == 'online' else 'offline'}">
                        {network_stats['proxy_status']}
                    </span>
                </div>
                <div class="metric">
                    <span class="metric-label">Response Time:</span>
                    <span class="metric-value">{network_stats['proxy_response_time']:.1f}ms</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Dashboard Uptime:</span>
                    <span class="metric-value">{uptime:.0f}s</span>
                </div>
            </div>
            
            <!-- Quick Actions -->
            <div class="card">
                <h3>🔧 Quick Actions</h3>
                <div class="metric">
                    <button onclick="location.reload()" style="background: #4CAF50; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin: 5px;">
                        🔄 Refresh Dashboard
                    </button>
                </div>
                <div class="metric">
                    <button onclick="window.open('http://localhost:8000/docs', '_blank')" style="background: #2196F3; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin: 5px;">
                        📚 Aurora API Docs
                    </button>
                </div>
                <div class="metric">
                    <button onclick="window.open('http://localhost:8000/health', '_blank')" style="background: #FF9800; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin: 5px;">
                        🏥 Aurora Health
                    </button>
                </div>
            </div>
            
            <!-- Robbie Chat Apps -->
            <div class="card">
                <h3>🤖 Robbie Chat Apps</h3>
                <div class="metric">
                    <button onclick="window.open('http://localhost:8005', '_blank')" style="background: #9C27B0; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin: 5px;">
                        💬 TestPilot Chat MVP
                    </button>
                </div>
                <div class="metric">
                    <button onclick="window.open('http://localhost:8005/chat', '_blank')" style="background: #E91E63; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin: 5px;">
                        🚀 Robbie Web Chat
                    </button>
                </div>
                <div class="metric">
                    <button onclick="window.open('http://localhost:8000/api/v1/chat', '_blank')" style="background: #673AB7; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin: 5px;">
                        🧠 Aurora AI Chat API
                    </button>
                </div>
                <div class="metric">
                    <button onclick="runChatCLI()" style="background: #795548; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin: 5px;">
                        💻 CLI Chat Terminal
                    </button>
                </div>
            </div>
        </div>
    </div>
    
    <button class="refresh-btn" onclick="location.reload()">🔄 Refresh</button>
    <div class="timestamp">Last updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</div>
    
    <script>
        // Auto-refresh every 5 seconds
        setTimeout(() => location.reload(), 5000);
        
        // Run CLI Chat Terminal
        function runChatCLI() {{
            // Create a popup window with terminal-like interface
            const terminalWindow = window.open('', 'ChatCLI', 'width=800,height=600,scrollbars=yes');
            terminalWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Robbie CLI Chat Terminal</title>
                    <style>
                        body {{ 
                            background: #1a1a1a; 
                            color: #00ff00; 
                            font-family: 'Courier New', monospace; 
                            padding: 20px; 
                            margin: 0;
                        }}
                        .terminal {{ 
                            background: #000; 
                            padding: 20px; 
                            border-radius: 5px; 
                            border: 1px solid #333;
                            height: 500px;
                            overflow-y: auto;
                        }}
                        .prompt {{ color: #ffff00; }}
                        .command {{ color: #00aaff; }}
                        .response {{ color: #ff6b6b; margin-left: 20px; }}
                        .input {{ 
                            background: transparent; 
                            border: none; 
                            color: #00ff00; 
                            font-family: inherit; 
                            font-size: 14px;
                            width: 80%;
                            outline: none;
                        }}
                        .cursor {{ animation: blink 1s infinite; }}
                        @keyframes blink {{ 0%, 50% {{ opacity: 1; }} 51%, 100% {{ opacity: 0; }} }}
                    </style>
                </head>
                <body>
                    <h2>🤖 Robbie CLI Chat Terminal</h2>
                    <div class="terminal" id="terminal">
                        <div class="prompt">🚀 TestPilot Chat CLI (type /quit to exit)</div>
                        <div class="prompt">==========================================</div>
                        <div class="prompt">Connected to: ws://localhost:8005/ws</div>
                        <br>
                        <div class="response">[Robbie] Hello Allan! I'm ready to chat. What would you like to discuss?</div>
                        <br>
                        <div class="prompt">> <span id="command"></span><span class="cursor">_</span></div>
                    </div>
                    <br>
                    <div>
                        <strong>Instructions:</strong> This is a demo terminal. In the real CLI, you would type commands here.<br>
                        <strong>Real CLI Command:</strong> <code>cd /Users/allanperetz/aurora-ai-robbiverse && python3 chat-mvp/cli_chat.py</code>
                    </div>
                </body>
                </html>
            `);
        }}
    </script>
</body>
</html>
        """
        return html
    
    async def start_dashboard_server(self, port=8081):
        """Start the dashboard web server"""
        from aiohttp import web
        
        async def dashboard_handler(request):
            html = await self.generate_dashboard_html()
            return web.Response(text=html, content_type='text/html')
        
        async def favicon_handler(request):
            # Serve the favicon
            favicon_path = Path("./robbiebook-favicon.svg")
            if favicon_path.exists():
                async with aiofiles.open(favicon_path, 'rb') as f:
                    content = await f.read()
                return web.Response(
                    body=content,
                    content_type='image/svg+xml',
                    headers={'Cache-Control': 'public, max-age=86400'}
                )
            return web.Response(status=404)
        
        app = web.Application()
        app.router.add_get('/', dashboard_handler)
        app.router.add_get('/favicon.svg', favicon_handler)
        
        runner = web.AppRunner(app)
        await runner.setup()
        site = web.TCPSite(runner, '127.0.0.1', port)
        
        print(f"🚀 Starting RobbieBook1 Dashboard on http://127.0.0.1:{port}")
        print(f"   Real-time monitoring for Aurora AI Empire")
        print(f"   Press Ctrl+C to stop")
        
        await site.start()
        
        try:
            while True:
                await asyncio.sleep(1)
        except KeyboardInterrupt:
            print("\n🛑 Stopping RobbieBook1 Dashboard...")
            await runner.cleanup()

async def main():
    """Main function"""
    print("🤖 RobbieBook1.testpilot.ai - Aurora AI Empire Dashboard")
    print("   Real-time monitoring and control")
    print("=" * 60)
    
    dashboard = RobbieBookDashboard()
    await dashboard.start_dashboard_server(port=8081)

if __name__ == "__main__":
    import sys
    port = 8081
    if len(sys.argv) > 1 and sys.argv[1] == "--port" and len(sys.argv) > 2:
        port = int(sys.argv[2])
    
    async def main_with_port():
        dashboard = RobbieBookDashboard()
        await dashboard.start_dashboard_server(port=port)
    
    try:
        asyncio.run(main_with_port())
    except KeyboardInterrupt:
        print("\n👋 RobbieBook1 Dashboard stopped!")
