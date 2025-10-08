#!/usr/bin/env python3
"""
Test the proxy EXACTLY like Cursor does
"""
import requests
import json

BASE_URL = "http://155.138.194.222:8000"
API_KEY = "robbie-gpu-mesh"

print("🧪 TESTING LIKE CURSOR DOES...\n")

# Test 1: Health check
print("1️⃣ Health Check...")
try:
    r = requests.get(f"{BASE_URL}/health", timeout=5)
    print(f"   Status: {r.status_code}")
    print(f"   Response: {r.json()}")
    print("   ✅ PASS\n")
except Exception as e:
    print(f"   ❌ FAIL: {e}\n")

# Test 2: List models
print("2️⃣ List Models...")
try:
    r = requests.get(
        f"{BASE_URL}/v1/models",
        headers={"Authorization": f"Bearer {API_KEY}"},
        timeout=5
    )
    print(f"   Status: {r.status_code}")
    data = r.json()
    print(f"   Models found: {len(data['data'])}")
    for m in data['data']:
        print(f"      - {m['id']}")
    print("   ✅ PASS\n")
except Exception as e:
    print(f"   ❌ FAIL: {e}\n")

# Test 3: Simple chat completion (what Verify does)
print("3️⃣ Chat Completion (Verify Test)...")
try:
    r = requests.post(
        f"{BASE_URL}/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "model": "qwen2.5-coder:7b",
            "messages": [{"role": "user", "content": "Hi"}],
            "max_tokens": 10
        },
        timeout=30
    )
    print(f"   Status: {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        print(f"   Model used: {data.get('model', 'unknown')}")
        print(f"   Response: {data['choices'][0]['message']['content']}")
        print("   ✅ PASS\n")
    else:
        print(f"   Response: {r.text}")
        print("   ❌ FAIL\n")
except Exception as e:
    print(f"   ❌ FAIL: {e}\n")

# Test 4: Check response format matches OpenAI
print("4️⃣ Response Format Check...")
try:
    r = requests.post(
        f"{BASE_URL}/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "model": "qwen2.5-coder:7b",
            "messages": [{"role": "user", "content": "Test"}],
            "max_tokens": 5
        },
        timeout=30
    )
    data = r.json()
    
    # Check required OpenAI fields
    required = ['id', 'object', 'created', 'model', 'choices', 'usage']
    missing = [f for f in required if f not in data]
    
    if missing:
        print(f"   ❌ Missing fields: {missing}\n")
    else:
        print(f"   ✅ All OpenAI fields present")
        print(f"   Format: {data['object']}")
        print(f"   ✅ PASS\n")
except Exception as e:
    print(f"   ❌ FAIL: {e}\n")

print("=" * 60)
print("If all tests pass, Cursor should work!")
print("If Verify still fails, skip it and just use Chat directly!")
print("=" * 60)









