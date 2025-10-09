#!/usr/bin/env python3
"""
Health check for Node Registry Service
"""

import requests
import sys

def health_check():
    try:
        response = requests.get("http://localhost:8001/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "healthy":
                print("✅ Node Registry Service is healthy")
                return 0
            else:
                print("❌ Node Registry Service is unhealthy")
                return 1
        else:
            print(f"❌ Node Registry Service returned status {response.status_code}")
            return 1
    except Exception as e:
        print(f"❌ Node Registry Service health check failed: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(health_check())
