#!/bin/bash
# 🧨 SAFE CACHE FIX - Nuclear option without breaking everything
# For when you're DONE with cache problems

set -e

echo "🧨 SAFE NUCLEAR OPTION: Destroying cache without breaking nginx..."

# 1. Clean all build artifacts
echo "1. Cleaning build artifacts..."
cd /home/allan/aurora-ai-robbiverse
rm -rf robbie-app/dist robbie-app/node_modules/.vite
rm -rf robbie-work/dist robbie-work/node_modules/.vite  
rm -rf robbie-play/dist robbie-play/node_modules/.vite
rm -rf robbie-avatar-app/dist robbie-avatar-app/node_modules/.vite

# 2. Clean deployed files (but keep nginx)
echo "2. Cleaning deployed files..."
rm -rf /var/www/html/*

# 3. Clean system cache
echo "3. Clearing system cache..."
sync
echo 3 | sudo tee /proc/sys/vm/drop_caches

# 4. Create cache-busting nginx config
echo "4. Creating cache-busting nginx config..."
sudo tee /etc/nginx/sites-available/aurora > /dev/null << 'EOF'
server {
    listen 80;
    server_name aurora.testpilot.ai;
    
    # ROOT DIRECTORY
    root /var/www/html;
    index index.html;
    
    # DISABLE ALL CACHING FOR DEV
    add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
    add_header Pragma "no-cache";
    add_header Expires "0";
    
    # Disable etags
    etag off;
    if_modified_since off;
    
    # Homepage
    location = / {
        try_files /index.html =404;
    }
    
    # Robbie@Code
    location /code/ {
        alias /var/www/html/code/;
        try_files $uri $uri/ /code/index.html;
    }
    
    # Robbie@Work
    location /work/ {
        alias /var/www/html/work/;
        try_files $uri $uri/ /work/index.html;
    }
    
    # Robbie@Play
    location /play/ {
        alias /var/www/html/play/;
        try_files $uri $uri/ /play/index.html;
    }
    
    # Robbie@Control
    location /control/ {
        alias /var/www/html/control/;
        try_files $uri $uri/ /control/index.html;
    }
    
    # API proxy
    location /api/ {
        proxy_pass http://localhost:8002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # No caching on API calls
        add_header Cache-Control "no-store, no-cache, must-revalidate";
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/aurora /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# 5. Test nginx config
echo "5. Testing nginx config..."
sudo nginx -t

# 6. Rebuild all apps with cache busting
echo "6. Rebuilding all apps..."
cd /home/allan/aurora-ai-robbiverse

# Add timestamp to all builds for cache busting
BUILD_TIME=$(date +%s)
export VITE_BUILD_TIME=$BUILD_TIME

echo "Building with timestamp: $BUILD_TIME"

cd robbie-app && npm run build && cd ..
cd robbie-work && npm run build && cd ..
cd robbie-play && npm run build && cd ..
cd robbie-avatar-app && npm run build && cd ..

# 7. Deploy fresh builds
echo "7. Deploying fresh builds..."
sudo cp -r robbie-avatar-app/dist/* /var/www/html/
sudo cp -r robbie-app/dist /var/www/html/code
sudo cp -r robbie-work/dist /var/www/html/work
sudo cp -r robbie-play/dist /var/www/html/play
sudo cp -r robbie-avatar-app/dist /var/www/html/control

# 8. Set permissions
echo "8. Setting permissions..."
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html

# 9. Restart nginx
echo "9. Restarting nginx..."
sudo systemctl restart nginx

echo ""
echo "✅ SAFE NUCLEAR FIX COMPLETE!"
echo ""
echo "🌐 Your 5 Webpages:"
echo "  🏠 Homepage: http://aurora.testpilot.ai/"
echo "  💻 Robbie@Code: http://aurora.testpilot.ai/code/"
echo "  💼 Robbie@Work: http://aurora.testpilot.ai/work/"
echo "  🎮 Robbie@Play: http://aurora.testpilot.ai/play/"
echo "  🎛️ Robbie@Control: http://aurora.testpilot.ai/control/"
echo ""
echo "🧨 Cache has been NUKED! Fresh start guaranteed!"
