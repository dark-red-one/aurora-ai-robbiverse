#!/bin/bash
# Automated Data Sync - Runs hourly via cron
# Syncs TestPilot → Aurora data

cd /home/allan/aurora-ai-robbiverse

# Run data sync
python3 << 'EOF'
import sys
sys.path.append('backend/services')
from DataSyncService import sync_now

print("🔄 Starting hourly data sync...")
results = sync_now()

print(f"✅ Deals: {results['deals']['total']} synced")
print(f"✅ Contacts: {results['contacts']['total']} synced")
print(f"✅ Companies: {results['companies']['total']} synced")
print(f"✅ Gmail: {results['gmail']['synced']} emails synced")
print(f"✅ Calendar: {results['calendar']['prep_notes_created']} prep notes created")
print(f"✅ Sync complete at {results['sync_time']}")
EOF

# Log result
echo "$(date): Data sync complete" >> /tmp/aurora-data-sync.log


