#!/bin/bash
# Aurora Storage Expansion Guide - All Options

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║         HOW TO ADD MORE STORAGE TO AURORA                    ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Current status
echo "📊 CURRENT AURORA STORAGE:"
echo "──────────────────────────"
df -h /workspace | grep -E "Filesystem|workspace"
echo ""
echo "⚠️  Currently using only 20GB of available storage!"
echo ""

echo "═══════════════════════════════════════════════════════════════"
echo "🚀 OPTION 1: EXPAND RUNPOD VOLUME (RECOMMENDED)"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "RunPod allows volume expansion up to 10TB!"
echo ""
echo "📈 EXPANSION OPTIONS:"
echo "   • 50GB  → +$0.30/month  (2.5x current)"
echo "   • 100GB → +$0.80/month  (5x current) ⭐ RECOMMENDED"
echo "   • 200GB → +$1.80/month  (10x current)"
echo "   • 500GB → +$4.80/month  (25x current)"
echo "   • 1TB   → +$9.80/month  (50x current)"
echo ""
echo "📋 HOW TO EXPAND:"
echo "   1. Go to https://console.runpod.io/"
echo "   2. Click on your Aurora pod (ID: 2tbwzatlrjdy7i)"
echo "   3. Click 'Edit Pod' or settings icon"
echo "   4. Find 'Container Disk' or 'Volume Size'"
echo "   5. Increase from 20GB to desired size"
echo "   6. Click 'Deploy' or 'Save Changes'"
echo "   7. Volume expands without data loss!"
echo ""

echo "═══════════════════════════════════════════════════════════════"
echo "🔗 OPTION 2: NETWORK ATTACHED STORAGE (NAS)"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "RunPod Network Volumes - Shared across pods!"
echo ""
echo "📦 NETWORK VOLUME BENEFITS:"
echo "   • Accessible from all your pods"
echo "   • Persistent across pod restarts"
echo "   • Can be massive (up to 100TB+)"
echo "   • Perfect for model/dataset storage"
echo ""
echo "💰 PRICING:"
echo "   • $0.01/GB/month ($10/TB/month)"
echo "   • 1TB = $10/month"
echo "   • 10TB = $100/month"
echo ""
echo "📋 HOW TO ADD NETWORK VOLUME:"
echo "   1. Go to RunPod Console"
echo "   2. Click 'Storage' → 'Network Volumes'"
echo "   3. Click 'New Network Volume'"
echo "   4. Choose size and region"
echo "   5. Attach to Aurora pod"
echo "   6. Mount at /workspace/network-storage"
echo ""

echo "═══════════════════════════════════════════════════════════════"
echo "🌐 OPTION 3: USE FLUENTI'S 178TB (FREE!)"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "You already have 178TB on Fluenti node!"
echo ""
echo "✅ ALREADY CONFIGURED:"
echo "   • 178TB available on Fluenti"
echo "   • Accessible via SSH"
echo "   • No additional cost"
echo ""
echo "📦 USE COMMANDS:"
echo "   # Store large files on Fluenti"
echo "   ./unified-storage-manager.sh push-model <file>"
echo "   "
echo "   # Retrieve files from Fluenti"
echo "   ./unified-storage-manager.sh pull-model <file>"
echo "   "
echo "   # Check storage status"
echo "   ./unified-storage-manager.sh status"
echo ""

echo "═══════════════════════════════════════════════════════════════"
echo "💾 OPTION 4: EXTERNAL CLOUD STORAGE"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Mount external storage services:"
echo ""
echo "☁️ S3-COMPATIBLE:"
echo "   • AWS S3: $0.023/GB/month"
echo "   • Backblaze B2: $0.005/GB/month ⭐ CHEAPEST"
echo "   • Wasabi: $0.0059/GB/month (no egress fees)"
echo ""
echo "📋 SETUP S3 MOUNT:"
cat << 'EOF'
   # Install s3fs
   apt-get install s3fs
   
   # Configure credentials
   echo ACCESS_KEY:SECRET_KEY > ~/.passwd-s3fs
   chmod 600 ~/.passwd-s3fs
   
   # Mount S3 bucket
   s3fs mybucket /workspace/s3-storage \
     -o passwd_file=~/.passwd-s3fs \
     -o allow_other
EOF
echo ""

echo "═══════════════════════════════════════════════════════════════"
echo "🎯 RECOMMENDATION FOR YOUR SETUP"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "✅ IMMEDIATE: Use Fluenti's 178TB (FREE)"
echo "   You already have this configured!"
echo ""
echo "📈 SHORT-TERM: Expand Aurora to 100GB (+$0.80/month)"
echo "   Gives you fast local storage for active models"
echo ""
echo "🚀 LONG-TERM: Add 1TB Network Volume ($10/month)"
echo "   Shared across all pods for model library"
echo ""
echo "💡 CURRENT BEST PRACTICE:"
echo "   • Hot data: Aurora local (20GB → 100GB)"
echo "   • Warm data: Network Volume (1TB)"
echo "   • Cold data: Fluenti (178TB)"
echo ""

# Create expansion script
cat > /workspace/aurora/request-storage-expansion.txt << 'EXPANSIONEOF'
RunPod Storage Expansion Request
=================================

Pod ID: 2tbwzatlrjdy7i
Pod Name: Aurora (allied_ivory_gerbil)
Current Size: 20GB
Requested Size: 100GB
Reason: AI model storage and training data

Additional Network Volume Request:
Size: 1TB
Purpose: Shared model library across pods
Mount Point: /workspace/shared-models

Total Monthly Cost Increase:
- Volume expansion: +$0.80/month
- Network volume: +$10/month
- Total: +$10.80/month

Business Justification:
- Store multiple large language models locally
- Faster inference with local storage
- Reduced network transfer costs
- Improved training performance
EXPANSIONEOF

echo "📄 Storage expansion request template created:"
echo "   /workspace/aurora/request-storage-expansion.txt"
echo ""
echo "🚀 Ready to expand Aurora's storage!"
echo "   Start with: ./unified-storage-manager.sh status"
echo ""
