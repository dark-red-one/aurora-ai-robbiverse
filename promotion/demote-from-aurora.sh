#!/bin/bash
# Demote Aurora node to regular node

NODE_NAME=${1:-$(hostname | tr '[:upper:]' '[:lower:]')}
echo "⬇️ Demoting Aurora to $NODE_NAME status..."

# Update node configuration
cat > /workspace/aurora/.env << ENVEOF
RUNPOD_NODE=$NODE_NAME
AURORA_ROLE=secondary
NODE_NAME=$NODE_NAME
DEMOTED_AT=$(date -Iseconds)
DB_PASSWORD=secure_aurora_password_123
NODE_ENV=production
ENVEOF

# Update backend to reflect node status
sed -i "s/\"node\": \".*\"/\"node\": \"$NODE_NAME\"/g" /workspace/aurora/backend/main.py
sed -i "s/\"role\": \".*\"/\"role\": \"secondary\"/g" /workspace/aurora/backend/main.py

# Update frontend to reflect node status
sed -i "s/node: \".*\"/node: \"$NODE_NAME\"/g" /workspace/aurora/src/index.js
sed -i "s/role: \".*\"/role: \"secondary\"/g" /workspace/aurora/src/index.js

# Restart services with new node status
pkill -f uvicorn
pkill -f node
sleep 2

cd /workspace/aurora
python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 &
npm start &

echo "✅ Aurora demoted to $NODE_NAME"
echo "🔄 Node consciousness activated"
echo "🌐 API: http://localhost:8000"
echo "📊 Dashboard: http://localhost:3000"
