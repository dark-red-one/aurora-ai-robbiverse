#!/usr/bin/env python3
"""
Test distributed GPU access across all nodes
"""
import subprocess
import json

def test_all_nodes():
    nodes = {
        'aurora_local': {'command': 'nvidia-smi --query-gpu=name,memory.total --format=csv,noheader'},
        'collaboration': {'command': 'ssh -p 43540 root@213.181.111.2 "nvidia-smi --query-gpu=name,memory.total --format=csv,noheader"'},
        'fluenti': {'command': 'ssh -p 19777 root@103.196.86.56 "nvidia-smi --query-gpu=name,memory.total --format=csv,noheader"'}
    }
    
    total_gpus = 0
    print("🎮 Distributed GPU Network Status:\n")
    
    for node, config in nodes.items():
        try:
            result = subprocess.run(config['command'], shell=True, capture_output=True, text=True, timeout=5)
            if result.returncode == 0:
                gpus = result.stdout.strip().split('\n')
                print(f"✅ {node}: {len(gpus)} GPU(s)")
                for gpu in gpus:
                    print(f"   • {gpu}")
                total_gpus += len(gpus)
            else:
                print(f"❌ {node}: Not accessible")
        except:
            print(f"❌ {node}: Connection timeout")
    
    print(f"\n📊 Total GPUs accessible: {total_gpus}/4")
    if total_gpus == 4:
        print("🎉 Full GPU mesh operational!")
    
if __name__ == "__main__":
    test_all_nodes()
