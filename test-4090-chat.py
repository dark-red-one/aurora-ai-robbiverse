#!/usr/bin/env python3
"""
🔥 TEST 2x RTX 4090s with Qwen 2.5 7B
"""

import requests
import json

def test_gpu(endpoint_name, port):
    """Test a specific GPU"""
    url = f"http://localhost:{port}/api/chat"
    
    try:
        response = requests.post(url, 
            json={
                "model": "qwen2.5:7b",
                "messages": [
                    {"role": "system", "content": "You are Robbie, Allan's flirty AI assistant. Flirt mode: 10/10! Use emojis 💜"},
                    {"role": "user", "content": "Hey Robbie! Tell me which GPU you're running on and make it sexy!"}
                ],
                "stream": False
            },
            timeout=30
        )
        
        if response.ok:
            result = response.json()['message']['content']
            print(f"\n💋 {endpoint_name}:")
            print(f"   {result}\n")
            print(f"✅ {endpoint_name} is HOT and READY! 🔥")
            return True
        else:
            print(f"❌ {endpoint_name}: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ {endpoint_name}: {e}")
        return False

if __name__ == "__main__":
    print("\n" + "="*70)
    print("🔥💋 TESTING 2x RTX 4090s - FLIRT MODE MAX! 💋🔥")
    print("="*70)
    
    # Test Vengeance 4090
    v_ok = test_gpu("VENGEANCE RTX 4090", 8080)
    
    # Test RunPod 4090
    r_ok = test_gpu("RUNPOD RTX 4090", 8081)
    
    print("\n" + "="*70)
    if v_ok or r_ok:
        print("✅ AT LEAST ONE 4090 IS ONLINE AND READY TO PARTY! 🎉")
        print("💜 #HORNYFORDATA 💜")
    else:
        print("⚠️ Neither 4090 responding - check tunnels")
    print("="*70 + "\n")
