#!/usr/bin/env python3
"""
Deploy Chat App to aurora.testpilot.ai
Simple deployment script to host our chat interface
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path

def deploy_chat_app():
    print('🚀 Deploying Chat App to aurora.testpilot.ai...\n')
    
    try:
        # Get project root
        project_root = Path(__file__).parent.parent
        
        # Source files
        chat_interface = project_root / 'robbie-unified-interface.html'
        
        # Check if chat interface exists
        if not chat_interface.exists():
            print('❌ Chat interface not found!')
            return False
        
        # Create deployment directory
        deploy_dir = project_root / 'deployment' / 'aurora-chat-app'
        deploy_dir.mkdir(parents=True, exist_ok=True)
        
        print('📁 Created deployment directory')
        
        # Copy chat interface
        shutil.copy2(chat_interface, deploy_dir / 'index.html')
        print('✅ Copied chat interface to index.html')
        
        # Create simple Python server
        server_script = '''#!/usr/bin/env python3
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
        print("\\n🛑 Server stopped")
    except Exception as e:
        print(f"❌ Server error: {e}")

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    start_server(port)
'''
        
        server_file = deploy_dir / 'server.py'
        with open(server_file, 'w') as f:
            f.write(server_script)
        
        # Make server executable
        os.chmod(server_file, 0o755)
        print('✅ Created Python server script')
        
        # Create nginx configuration for production
        nginx_config = '''server {
    listen 80;
    server_name aurora.testpilot.ai;
    
    root /var/www/aurora-chat-app;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Enable CORS
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
    add_header Access-Control-Allow-Headers "Content-Type";
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
'''
        
        nginx_file = deploy_dir / 'nginx.conf'
        with open(nginx_file, 'w') as f:
            f.write(nginx_config)
        print('✅ Created nginx configuration')
        
        # Create deployment instructions
        instructions = '''# Aurora Chat App Deployment

## Files Created:
- `index.html` - Main chat interface
- `server.py` - Python development server
- `nginx.conf` - Production nginx configuration

## Quick Start (Development):
```bash
cd /path/to/deployment/aurora-chat-app
python3 server.py 8000
```
Then visit: http://aurora.testpilot.ai:8000

## Production Deployment:
1. Copy files to web server:
   ```bash
   sudo cp -r * /var/www/aurora-chat-app/
   sudo chown -R www-data:www-data /var/www/aurora-chat-app/
   ```

2. Configure nginx:
   ```bash
   sudo cp nginx.conf /etc/nginx/sites-available/aurora-chat
   sudo ln -s /etc/nginx/sites-available/aurora-chat /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

3. Configure DNS:
   - Point aurora.testpilot.ai to your server IP

## Features:
- ✅ Robbie Unified Chat Interface
- ✅ Matrix Background Animation
- ✅ Mood Controls and Personality Sliders
- ✅ Real-time Chat with AI
- ✅ Responsive Design
- ✅ CORS Enabled for API Integration

## Status:
🚀 Ready for deployment!
'''
        
        instructions_file = deploy_dir / 'README.md'
        with open(instructions_file, 'w') as f:
            f.write(instructions)
        print('✅ Created deployment instructions')
        
        # Create systemd service for production
        service_config = '''[Unit]
Description=Aurora Chat App Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/aurora-chat-app
ExecStart=/usr/bin/python3 /var/www/aurora-chat-app/server.py 80
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
'''
        
        service_file = deploy_dir / 'aurora-chat.service'
        with open(service_file, 'w') as f:
            f.write(service_config)
        print('✅ Created systemd service configuration')
        
        print('\\n🎉 Chat App Deployment Package Created!')
        print(f'📁 Deployment directory: {deploy_dir}')
        print('\\n📋 Next Steps:')
        print('1. 🧪 Test locally: python3 server.py 8000')
        print('2. 🌐 Deploy to production: Follow README.md instructions')
        print('3. 🔗 Configure DNS: Point aurora.testpilot.ai to server')
        print('4. ✅ Access: https://aurora.testpilot.ai')
        
        # Test the deployment locally
        print('\\n🧪 Testing deployment locally...')
        try:
            # Start server in background for testing
            test_process = subprocess.Popen([
                sys.executable, str(server_file), '8001'
            ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            
            # Wait a moment for server to start
            import time
            time.sleep(2)
            
            # Check if server is running
            if test_process.poll() is None:
                print('✅ Local server test successful')
                print('🌐 Chat app available at: http://localhost:8001')
                
                # Stop test server
                test_process.terminate()
                test_process.wait()
            else:
                print('⚠️ Local server test failed')
                
        except Exception as e:
            print(f'⚠️ Local test error: {e}')
        
        return True
        
    except Exception as error:
        print(f'❌ Deployment failed: {error}')
        return False

if __name__ == '__main__':
    success = deploy_chat_app()
    if success:
        print('\\n🎯 Deployment package ready!')
        sys.exit(0)
    else:
        print('\\n❌ Deployment failed!')
        sys.exit(1)
