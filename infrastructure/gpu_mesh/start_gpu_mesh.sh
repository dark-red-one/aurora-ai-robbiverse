#!/bin/bash
echo "🔥 Starting Aurora GPU Mesh Network..."

# Start Ray cluster
echo "🚀 Starting Ray cluster..."
cd /workspace/aurora
python3 gpu_mesh/ray_cluster.py &

# Start GPU mesh coordinator
echo "🌐 Starting GPU mesh coordinator..."
python3 gpu_mesh/coordinator.py &

echo "✅ Aurora GPU Mesh Network active!"
echo "🔥 Total GPUs: $(nvidia-smi --list-gpus | wc -l)"
echo "🌐 Coordinator: http://localhost:8001"
echo "📊 Ray Dashboard: http://localhost:8265"
