#!/usr/bin/env python3
"""
Health check for Mayor Governance Service
"""

import sys
import requests

def health_check():
    try:
        response = requests.get("http://localhost:8022/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Mayor Governance service is healthy (Active Banishments: {data.get('active_banishments', 0)})")
            sys.exit(0)
        else:
            print(f"❌ Mayor Governance service returned status {response.status_code}")
            sys.exit(1)
    except Exception as e:
        print(f"❌ Mayor Governance service health check failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    health_check()
