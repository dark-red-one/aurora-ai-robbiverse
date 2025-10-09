#!/usr/bin/env python3
"""
Health check for DNS Manager Service
"""

import sys
import requests

def health_check():
    try:
        response = requests.get("http://localhost:8015/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            if data.get("bind_running", False):
                print("✅ DNS Manager service is healthy (BIND9 running)")
                sys.exit(0)
            else:
                print("⚠️ DNS Manager service responding but BIND9 not running")
                sys.exit(1)
        else:
            print(f"❌ DNS Manager service returned status {response.status_code}")
            sys.exit(1)
    except Exception as e:
        print(f"❌ DNS Manager service health check failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    health_check()
