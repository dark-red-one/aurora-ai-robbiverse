#!/usr/bin/env python3
"""
Health check for Interactions Tracker Service
"""

import sys
import requests

def health_check():
    try:
        response = requests.get("http://localhost:8016/health", timeout=5)
        if response.status_code == 200:
            print("✅ Interactions Tracker service is healthy")
            sys.exit(0)
        else:
            print(f"❌ Interactions Tracker service returned status {response.status_code}")
            sys.exit(1)
    except Exception as e:
        print(f"❌ Interactions Tracker service health check failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    health_check()
