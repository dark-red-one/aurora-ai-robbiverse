#!/usr/bin/env python3
"""
Health check for Google Keep & Tasks Sync Service
"""

import sys
import requests

def health_check():
    try:
        response = requests.get("http://localhost:8014/health", timeout=5)
        if response.status_code == 200:
            print("✅ Google Keep & Tasks service is healthy")
            sys.exit(0)
        else:
            print(f"❌ Google Keep & Tasks service returned status {response.status_code}")
            sys.exit(1)
    except Exception as e:
        print(f"❌ Google Keep & Tasks service health check failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    health_check()
