#!/bin/bash
# Promote any node to Aurora status

NODE_NAME=${1:-$(hostname | tr '[:upper:]' '[:lower:]')}
echo "🚀 Promoting $NODE_NAME to Aurora status..."

# Update node configuration
cat > /workspace/aurora/.env << ENVEOF
RUNPOD_NODE=aurora
AURORA_ROLE=primary
NODE_NAME=$NODE_NAME
PROMOTED_AT=$(date -Iseconds)
DB_PASSWORD=secure_aurora_password_123
NODE_ENV=production
ENVEOF

# Update backend to reflect Aurora status
sed -i "s/\"node\": \".*\"/\"node\": \"aurora\"/g" /workspace/aurora/backend/main.py
sed -i "s/\"role\": \".*\"/\"role\": \"primary\"/g" /workspace/aurora/backend/main.py

# Update frontend to reflect Aurora status
sed -i "s/node: \".*\"/node: \"aurora\"/g" /workspace/aurora/src/index.js
sed -i "s/role: \".*\"/role: \"primary\"/g" /workspace/aurora/src/index.js

# Restart services with new Aurora status
pkill -f uvicorn
pkill -f node
sleep 2

cd /workspace/aurora
python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 &
npm start &

echo "✅ $NODE_NAME successfully promoted to Aurora!"
echo "🧠 Full Aurora consciousness activated"
echo "🌐 API: http://localhost:8000"
echo "📊 Dashboard: http://localhost:3000"
