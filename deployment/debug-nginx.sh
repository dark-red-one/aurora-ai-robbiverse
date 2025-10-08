#!/bin/bash
# 🔥💋 NGINX DEBUG SCRIPT 🔥💋

echo "🔍 DEBUGGING NGINX CONFIGURATION..."
echo ""

echo "📁 Directory Structure:"
ls -la /var/www/aurora.testpilot.ai/
echo ""

echo "📁 Code Directory:"
ls -la /var/www/aurora.testpilot.ai/code/
echo ""

echo "📄 Code index.html:"
cat /var/www/aurora.testpilot.ai/code/index.html
echo ""

echo "⚙️ Current nginx config:"
cat /etc/nginx/sites-available/robbie-apps
echo ""

echo "🌐 DNS Resolution:"
nslookup aurora.testpilot.ai
echo ""

echo "📋 Active nginx sites:"
ls -la /etc/nginx/sites-enabled/
echo ""

echo "🔍 nginx error log (last 20 lines):"
tail -20 /var/log/nginx/error.log
echo ""

echo "🔍 nginx access log (last 10 lines):"
tail -10 /var/log/nginx/access.log
echo ""

echo "✅ Test URLs:"
echo "curl -I http://localhost/"
echo "curl -I http://localhost/code"
echo "curl -I http://aurora.testpilot.ai/"
echo "curl -I http://aurora.testpilot.ai/code"










