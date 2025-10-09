#!/usr/bin/env python3
"""
Health check for Skill Manager Service
"""

import sys
import requests

def health_check():
    try:
        response = requests.get("http://localhost:8019/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Skill Manager service is healthy (Templates: {data.get('templates_available', 0)})")
            sys.exit(0)
        else:
            print(f"❌ Skill Manager service returned status {response.status_code}")
            sys.exit(1)
    except Exception as e:
        print(f"❌ Skill Manager service health check failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    health_check()
