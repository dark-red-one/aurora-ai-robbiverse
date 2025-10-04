#!/bin/bash
# On-Demand Llama 4 Maverick Setup
# Spin up multi-GPU RunPod when you need the beast

set -euo pipefail

echo "🚀 LLAMA 4 MAVERICK - ON-DEMAND SETUP GUIDE"
echo "============================================"
echo ""
echo "⚠️  Llama 4 Maverick requires 244GB model + significant VRAM"
echo ""
echo "📊 GPU Options:"
echo ""
echo "Option A: 2x A100 80GB (160GB VRAM) - RECOMMENDED"
echo "  - Cost: ~$3.00/hour"
echo "  - RunPod Pod Type: 2x A100 (80GB)"
echo "  - Will fit Maverick with tensor parallelism"
echo ""
echo "Option B: 4x A100 80GB (320GB VRAM) - POWER MODE"
echo "  - Cost: ~$6.00/hour"
echo "  - RunPod Pod Type: 4x A100 (80GB)"
echo "  - Faster inference, more headroom"
echo ""
echo "Option C: 2x H100 80GB (160GB VRAM) - FASTEST"
echo "  - Cost: ~$10-12/hour"
echo "  - RunPod Pod Type: 2x H100 (80GB)"
echo "  - Maximum performance"
echo ""
echo "🎯 RECOMMENDED WORKFLOW:"
echo ""
echo "1. Keep daily models on Aurora Town:"
echo "   - qwen2.5:7b (4.7GB) - Fast & quality"
echo "   - llama3.1:8b (4.9GB) - General purpose"
echo "   - Cost: $0 (using existing RTX 4090)"
echo ""
echo "2. Spin up Maverick ONLY when needed:"
echo "   - Big documents (1M context)"
echo "   - Complex multimodal tasks"
echo "   - Image understanding"
echo "   - Major decision analysis"
echo ""
echo "3. Shut down after use to save cost"
echo ""
echo "📋 TO DEPLOY MAVERICK POD:"
echo ""
echo "Step 1: Create RunPod instance"
echo "  - Go to: https://runpod.io/console/pods"
echo "  - Select: 2x A100 80GB"
echo "  - Template: Pytorch or Ollama"
echo "  - Volume: 300GB+ network storage"
echo ""
echo "Step 2: Setup Ollama on pod"
echo "  curl -fsSL https://ollama.com/install.sh | sh"
echo "  export OLLAMA_HOST=0.0.0.0:11434"
echo "  ollama serve &"
echo "  ollama pull llama4:maverick"
echo ""
echo "Step 3: Connect Aurora Town"
echo "  # Get pod SSH details (IP:PORT)"
echo "  # Update tunnel service with new endpoint"
echo "  # Test connection"
echo ""
echo "Step 4: Route Maverick requests"
echo "  # Aurora Town gateway routes llama4:maverick → multi-GPU pod"
echo "  # Other models → single RTX 4090 pod"
echo ""
echo "💰 COST COMPARISON:"
echo ""
echo "Current Setup (RTX 4090 always-on):"
echo "  - ~$0.40/hour × 24h × 30 days = ~$288/month"
echo "  - Handles 99% of workload"
echo ""
echo "Maverick On-Demand (2x A100):"
echo "  - ~$3.00/hour"
echo "  - Use 2 hours/day = $6/day = $180/month"
echo "  - Use 1 hour/week = $12/month"
echo "  - Use only when critical = minimal cost"
echo ""
echo "🎯 SMART APPROACH:"
echo "  - Keep current setup for daily work"
echo "  - Deploy Maverick pod when needed (1-click)"
echo "  - Destroy pod after task complete"
echo "  - Only pay for what you use"
echo ""
echo "📝 Files Created:"
echo "  - deployment/maverick-pod-template.json (RunPod config)"
echo "  - deployment/connect-maverick-pod.sh (Auto-connect script)"
echo ""

# Create RunPod template for Maverick
cat > /tmp/maverick-pod-template.json << 'EOF'
{
  "name": "Llama4-Maverick-OnDemand",
  "imageName": "runpod/pytorch:2.1.0-py3.10-cuda12.1.1-devel-ubuntu22.04",
  "dockerArgs": "",
  "gpuTypeId": "NVIDIA A100 80GB PCIe",
  "gpuCount": 2,
  "cloudType": "SECURE",
  "volumeInGb": 300,
  "containerDiskInGb": 50,
  "minVcpuCount": 16,
  "minMemoryInGb": 128,
  "ports": "11434/http,8000/http,22/tcp",
  "env": [
    {
      "key": "OLLAMA_HOST",
      "value": "0.0.0.0:11434"
    },
    {
      "key": "OLLAMA_GPU_LAYERS",
      "value": "999"
    },
    {
      "key": "OLLAMA_KEEP_ALIVE",
      "value": "2h"
    }
  ],
  "startupScript": "curl -fsSL https://ollama.com/install.sh | sh && ollama serve > /tmp/ollama.log 2>&1 & sleep 10 && ollama pull llama4:maverick"
}
EOF

echo ""
echo "✅ Template created: /tmp/maverick-pod-template.json"
echo ""
echo "🚀 Next: Use RunPod web UI to deploy when you need Maverick!"


