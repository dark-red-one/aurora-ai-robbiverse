#!/usr/bin/env python3
"""
Health check for Event Bus Service
"""

import requests
import sys

def health_check():
    try:
        response = requests.get("http://localhost:8004/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "healthy":
                print("✅ Event Bus Service is healthy")
                return 0
            else:
                print("❌ Event Bus Service is unhealthy")
                return 1
        else:
            print(f"❌ Event Bus Service returned status {response.status_code}")
            return 1
    except Exception as e:
        print(f"❌ Event Bus Service health check failed: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(health_check())
