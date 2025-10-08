#!/usr/bin/env python3
"""
Test vision rejection in Robbie LLM Proxy
"""

import requests
import json

PROXY_URL = "http://localhost:8000/v1/chat/completions"

print("🧪 Testing Robbie LLM Proxy Vision Rejection\n")

# Test 1: Normal text request (should work)
print("Test 1: Normal text request...")
response = requests.post(PROXY_URL, json={
    "model": "qwen2.5-coder:7b",
    "messages": [
        {"role": "user", "content": "Write a hello world function in Python"}
    ],
    "max_tokens": 100
})

if response.status_code == 200:
    print("✅ Text request PASSED")
    data = response.json()
    print(f"   Response: {data['choices'][0]['message']['content'][:100]}...")
else:
    print(f"❌ Text request FAILED: {response.status_code}")
    print(f"   {response.text}")

print()

# Test 2: Vision request (should be rejected)
print("Test 2: Vision request with image...")
response = requests.post(PROXY_URL, json={
    "model": "qwen2.5-coder:7b",
    "messages": [
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "What's in this image?"},
                {"type": "image_url", "image_url": {"url": "data:image/png;base64,iVBORw0KG..."}}
            ]
        }
    ],
    "max_tokens": 100
})

if response.status_code == 400:
    print("✅ Vision rejection PASSED (correctly rejected)")
    error_data = response.json()
    if 'error' in error_data:
        print(f"   Error message: {error_data['error']['message']}")
    else:
        print(f"   Error: {error_data}")
elif response.status_code == 200:
    print("❌ Vision rejection FAILED (should have been rejected!)")
else:
    print(f"⚠️ Unexpected status code: {response.status_code}")
    print(f"   {response.text}")

print()

# Test 3: Check model capabilities
print("Test 3: Check model capabilities...")
response = requests.get("http://localhost:8000/v1/models")

if response.status_code == 200:
    data = response.json()
    model = data['data'][0]
    
    if 'capabilities' in model:
        caps = model['capabilities']
        print("✅ Capabilities found in model response")
        print(f"   vision: {caps.get('vision', 'NOT SET')}")
        print(f"   text: {caps.get('text', 'NOT SET')}")
        
        if caps.get('vision') == False:
            print("✅ Vision correctly marked as False")
        else:
            print("❌ Vision should be False!")
    else:
        print("❌ No capabilities field in model response")
else:
    print(f"❌ Failed to get models: {response.status_code}")

print("\n═══════════════════════════════════════")
print("🔥 Testing Complete! 🔥")
print("═══════════════════════════════════════")

