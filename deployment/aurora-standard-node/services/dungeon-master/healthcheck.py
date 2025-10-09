#!/usr/bin/env python3
"""
Health check for Dungeon Master Service
"""

import sys
import requests

def health_check():
    try:
        response = requests.get("http://localhost:8020/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Dungeon Master service is healthy (Active Events: {data.get('active_events', 0)})")
            sys.exit(0)
        else:
            print(f"❌ Dungeon Master service returned status {response.status_code}")
            sys.exit(1)
    except Exception as e:
        print(f"❌ Dungeon Master service health check failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    health_check()
