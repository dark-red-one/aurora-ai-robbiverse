#!/usr/bin/env python3
"""
Health check for Presidential Privilege Service
"""

import sys
import requests

def health_check():
    try:
        response = requests.get("http://localhost:8021/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Presidential Privilege service is healthy (Active Sessions: {data.get('active_sessions', 0)})")
            sys.exit(0)
        else:
            print(f"❌ Presidential Privilege service returned status {response.status_code}")
            sys.exit(1)
    except Exception as e:
        print(f"❌ Presidential Privilege service health check failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    health_check()
