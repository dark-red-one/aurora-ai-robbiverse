#!/usr/bin/env python3
import sys
import requests

try:
    response = requests.get("http://localhost:8009/health", timeout=5)
    if response.status_code == 200:
        print("OK")
        sys.exit(0)
    else:
        print(f"FAILED: {response.status_code}")
        sys.exit(1)
except Exception as e:
    print(f"ERROR: {e}")
    sys.exit(1)
