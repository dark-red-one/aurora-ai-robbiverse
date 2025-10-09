#!/usr/bin/env python3
"""
Health check for Robbie Agent Service
"""

import sys
import requests

def health_check():
    try:
        response = requests.get("http://localhost:8018/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Robbie Agent service is healthy (Personality: {data.get('personality_mode', 'unknown')}, Skills: {data.get('available_skills', 0)})")
            sys.exit(0)
        else:
            print(f"❌ Robbie Agent service returned status {response.status_code}")
            sys.exit(1)
    except Exception as e:
        print(f"❌ Robbie Agent service health check failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    health_check()
