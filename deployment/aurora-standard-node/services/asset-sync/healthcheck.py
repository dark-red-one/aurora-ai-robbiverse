#!/usr/bin/env python3
"""Health check for asset sync service"""

import json
import sys
from pathlib import Path
from datetime import datetime, timedelta

LOCAL_PATH = Path('/assets')
STATUS_FILE = LOCAL_PATH / '.sync_status'

try:
    if not STATUS_FILE.exists():
        print("Status file not found")
        sys.exit(1)
    
    with open(STATUS_FILE) as f:
        stats = json.load(f)
    
    # Check if last sync was recent (within 2x sync interval + 5 min buffer)
    if stats.get('last_sync'):
        last_sync = datetime.fromisoformat(stats['last_sync'])
        max_age = timedelta(minutes=15)  # Reasonable threshold
        
        if datetime.utcnow() - last_sync > max_age:
            print(f"Last sync too old: {last_sync}")
            sys.exit(1)
    
    print("Healthy")
    sys.exit(0)
    
except Exception as e:
    print(f"Health check failed: {e}")
    sys.exit(1)
