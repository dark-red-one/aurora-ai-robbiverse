#!/bin/bash
echo "📊 RobbieBook1.testpilot.ai Cache Statistics"
echo "==========================================="

if pgrep -f "robbiebook-proxy.py" > /dev/null; then
    echo "🟢 Status: Running"
else
    echo "🔴 Status: Not running"
fi

echo ""
echo "💾 Cache Information:"
if [ -d "robbiebook_cache" ]; then
    cache_size=$(du -sh robbiebook_cache 2>/dev/null | cut -f1)
    cache_files=$(find robbiebook_cache -name "*.cache" | wc -l)
    echo "   Cache Size: $cache_size"
    echo "   Cached Files: $cache_files"
    
    echo ""
    echo "📁 Recent Cached Files:"
    find robbiebook_cache -name "*.cache" -type f -exec ls -la {} \; | head -10
else
    echo "   No cache directory found"
fi

echo ""
echo "🔧 Cache Management:"
echo "   Clear cache: rm -rf robbiebook_cache/*"
echo "   View cache: ls -la robbiebook_cache/"
echo "   Cache size: du -sh robbiebook_cache/"
