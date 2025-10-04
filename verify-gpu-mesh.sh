#!/bin/bash
echo "🔍 Verifying GPU Mesh Network..."

# Aurora (local)
echo -e "\n📍 Aurora Node (Local):"
nvidia-smi --query-gpu=name,memory.total --format=csv,noheader | while read line; do
    echo "   • $line"
done

# Collaboration
if ssh -o ConnectTimeout=2 -p 43540 root@213.181.111.2 "exit" 2>/dev/null; then
    echo -e "\n📍 Collaboration Node:"
    ssh -p 43540 root@213.181.111.2 "nvidia-smi --query-gpu=name,memory.total --format=csv,noheader" | while read line; do
        echo "   • $line"
    done
else
    echo -e "\n❌ Collaboration Node: Not connected"
fi

# Fluenti
if ssh -o ConnectTimeout=2 -p 19777 root@103.196.86.56 "exit" 2>/dev/null; then
    echo -e "\n📍 Fluenti Node:"
    ssh -p 19777 root@103.196.86.56 "nvidia-smi --query-gpu=name,memory.total --format=csv,noheader" | while read line; do
        echo "   • $line"
    done
else
    echo -e "\n❌ Fluenti Node: Not connected"
fi

echo -e "\n✅ Verification complete!"
