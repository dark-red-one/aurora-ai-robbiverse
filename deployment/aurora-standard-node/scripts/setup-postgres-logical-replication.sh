#!/bin/bash

# PostgreSQL Logical Replication Setup
# Enables read-your-writes consistency across nodes

set -euo pipefail

echo "🗄️ Setting up PostgreSQL Logical Replication..."

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo "❌ This script should not be run as root"
   exit 1
fi

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL..."
until docker exec aurora-postgres pg_isready -U aurora_app -d aurora_unified; do
    echo "Waiting for PostgreSQL..."
    sleep 2
done

# Configure Aurora (primary) for logical replication
echo "🔧 Configuring Aurora as primary..."
docker exec aurora-postgres psql -U aurora_app -d aurora_unified -c "
-- Enable logical replication
ALTER SYSTEM SET wal_level = logical;
ALTER SYSTEM SET max_replication_slots = 10;
ALTER SYSTEM SET max_wal_senders = 10;
ALTER SYSTEM SET hot_standby = on;
ALTER SYSTEM SET hot_standby_feedback = on;

-- Reload configuration
SELECT pg_reload_conf();
"

# Create publication on Aurora
echo "📡 Creating publication on Aurora..."
docker exec aurora-postgres psql -U aurora_app -d aurora_unified -c "
-- Create publication for all tables
CREATE PUBLICATION aurora_publication FOR ALL TABLES;

-- Verify publication
SELECT * FROM pg_publication;
"

# Create replication user
echo "👤 Creating replication user..."
docker exec aurora-postgres psql -U aurora_app -d aurora_unified -c "
-- Create replication user
CREATE USER replicator WITH REPLICATION LOGIN PASSWORD 'replicator-password-2025';

-- Grant necessary permissions
GRANT CONNECT ON DATABASE aurora_unified TO replicator;
GRANT USAGE ON SCHEMA public TO replicator;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO replicator;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO replicator;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO replicator;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON SEQUENCES TO replicator;
"

# Create subscription script for replica nodes
echo "📝 Creating subscription setup script..."
cat > scripts/setup-replica-subscription.sh << 'EOF'
#!/bin/bash

# Setup replica subscription to Aurora
# Run this on each replica node (Star, Vengeance, RobbieBook1)

set -euo pipefail

NODE_NAME=${1:-"unknown"}
AURORA_IP=${2:-"10.0.0.1"}

echo "🔄 Setting up subscription for $NODE_NAME to Aurora ($AURORA_IP)..."

# Wait for PostgreSQL to be ready
until docker exec ${NODE_NAME}-postgres pg_isready -U aurora_app -d aurora_unified; do
    echo "Waiting for PostgreSQL on $NODE_NAME..."
    sleep 2
done

# Create subscription
docker exec ${NODE_NAME}-postgres psql -U aurora_app -d aurora_unified -c "
-- Create subscription to Aurora
CREATE SUBSCRIPTION ${NODE_NAME}_subscription
CONNECTION 'host=$AURORA_IP port=5432 user=replicator password=replicator-password-2025 dbname=aurora_unified'
PUBLICATION aurora_publication
WITH (copy_data = true, create_slot = true);

-- Verify subscription
SELECT * FROM pg_subscription;
"

echo "✅ Subscription setup complete for $NODE_NAME"
EOF

chmod +x scripts/setup-replica-subscription.sh

# Create monitoring script
echo "📊 Creating replication monitoring script..."
cat > scripts/monitor-replication.py << 'EOF'
#!/usr/bin/env python3
"""
PostgreSQL Logical Replication Monitor
"""

import psycopg2
import redis
import json
import time
from datetime import datetime

def check_replication_status():
    """Check replication status across all nodes"""
    
    nodes = {
        "aurora": "10.0.0.1",
        "star": "10.0.0.2", 
        "vengeance": "10.0.0.4",
        "robbiebook1": "10.0.0.5"
    }
    
    status = {}
    
    for node_name, ip in nodes.items():
        try:
            # Check primary (Aurora)
            if node_name == "aurora":
                conn = psycopg2.connect(
                    host=ip,
                    port=5432,
                    user="aurora_app",
                    password="aurora-password",
                    database="aurora_unified"
                )
                
                with conn.cursor() as cur:
                    # Check publication
                    cur.execute("SELECT * FROM pg_publication WHERE pubname = 'aurora_publication'")
                    publications = cur.fetchall()
                    
                    # Check replication slots
                    cur.execute("SELECT slot_name, active, pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) as lag FROM pg_replication_slots")
                    slots = cur.fetchall()
                    
                    status[node_name] = {
                        "type": "primary",
                        "publications": len(publications),
                        "replication_slots": len(slots),
                        "status": "healthy" if publications else "error"
                    }
                    
            else:
                # Check replica
                conn = psycopg2.connect(
                    host=ip,
                    port=5432,
                    user="aurora_app", 
                    password="aurora-password",
                    database="aurora_unified"
                )
                
                with conn.cursor() as cur:
                    # Check subscription
                    cur.execute("SELECT * FROM pg_subscription WHERE subname LIKE '%_subscription'")
                    subscriptions = cur.fetchall()
                    
                    # Check replication lag
                    cur.execute("""
                        SELECT 
                            pg_size_pretty(pg_wal_lsn_diff(
                                pg_current_wal_lsn(), 
                                pg_replication_origin_progress('aurora_publication', true)
                            )) as lag
                    """)
                    lag_result = cur.fetchone()
                    lag = lag_result[0] if lag_result else "unknown"
                    
                    status[node_name] = {
                        "type": "replica",
                        "subscriptions": len(subscriptions),
                        "replication_lag": lag,
                        "status": "healthy" if subscriptions else "error"
                    }
                    
        except Exception as e:
            status[node_name] = {
                "type": "unknown",
                "error": str(e),
                "status": "error"
            }
    
    return status

if __name__ == "__main__":
    print("📊 PostgreSQL Logical Replication Status")
    print("=" * 50)
    
    status = check_replication_status()
    
    for node, info in status.items():
        print(f"\n🔹 {node.upper()}:")
        for key, value in info.items():
            print(f"  {key}: {value}")
    
    # Store in Redis for monitoring
    try:
        r = redis.Redis(host='redis', port=6379, password='robbie-password')
        r.setex("replication_status", 300, json.dumps(status))
        print(f"\n✅ Status stored in Redis")
    except Exception as e:
        print(f"\n⚠️ Could not store in Redis: {e}")
EOF

chmod +x scripts/monitor-replication.py

echo "✅ PostgreSQL Logical Replication setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Run on Aurora: ./scripts/setup-postgres-logical-replication.sh"
echo "2. Run on replicas: ./scripts/setup-replica-subscription.sh <node_name> <aurora_ip>"
echo "3. Monitor: python3 scripts/monitor-replication.py"
echo ""
echo "🔧 Manual setup commands:"
echo "  - Aurora: ALTER SYSTEM SET wal_level = logical;"
echo "  - Aurora: CREATE PUBLICATION aurora_publication FOR ALL TABLES;"
echo "  - Replicas: CREATE SUBSCRIPTION <node>_subscription CONNECTION '...' PUBLICATION aurora_publication;"
