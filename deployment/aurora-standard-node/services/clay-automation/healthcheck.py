#!/usr/bin/env python3
"""
Health check for Clay Automation Service
"""

import sys
import requests

def health_check():
    try:
        response = requests.get("http://localhost:8017/health", timeout=5)
        if response.status_code == 200:
            print("✅ Clay Automation service is healthy")
            sys.exit(0)
        else:
            print(f"❌ Clay Automation service returned status {response.status_code}")
            sys.exit(1)
    except Exception as e:
        print(f"❌ Clay Automation service health check failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    health_check()
