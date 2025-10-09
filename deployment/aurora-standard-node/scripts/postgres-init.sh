#!/bin/bash
# PostgreSQL initialization script
# Configures replication based on NODE_ROLE

set -e

echo "Initializing PostgreSQL for Aurora..."

# Check if this is a primary or replica
if [[ "$POSTGRES_REPLICATION_MODE" == "primary" ]]; then
    echo "Configuring as PRIMARY database..."
    
    # Create replication user
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
        -- Create replication user if not exists
        DO \$\$
        BEGIN
            IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'replicator') THEN
                CREATE ROLE replicator WITH REPLICATION LOGIN ENCRYPTED PASSWORD '${POSTGRES_REPLICATION_PASSWORD}';
            END IF;
        END
        \$\$;
        
        -- Create replication slots for known replicas
        SELECT pg_create_physical_replication_slot('replica_runpod_tx') WHERE NOT EXISTS (
            SELECT FROM pg_replication_slots WHERE slot_name = 'replica_runpod_tx'
        );
        
        SELECT pg_create_physical_replication_slot('replica_vengeance') WHERE NOT EXISTS (
            SELECT FROM pg_replication_slots WHERE slot_name = 'replica_vengeance'
        );
        
        SELECT pg_create_physical_replication_slot('replica_robbiebook1') WHERE NOT EXISTS (
            SELECT FROM pg_replication_slots WHERE slot_name = 'replica_robbiebook1'
        );
EOSQL
    
    echo "✅ Primary database configured with replication slots"
    
elif [[ "$POSTGRES_REPLICATION_MODE" == "replica" ]]; then
    echo "Configuring as REPLICA database..."
    echo "Note: Replication setup happens in bootstrap script via pg_basebackup"
    
    # Create standby signal file
    touch /var/lib/postgresql/data/standby.signal
    
    # Configure recovery settings in postgresql.auto.conf
    cat >> /var/lib/postgresql/data/postgresql.auto.conf <<-EOSQL
primary_conninfo = 'host=${POSTGRES_PRIMARY_HOST} port=5432 user=replicator password=${POSTGRES_REPLICATION_PASSWORD} application_name=${NODE_NAME:-replica}'
primary_slot_name = 'replica_${NODE_NAME:-default}'
EOSQL
    
    echo "✅ Replica database configured"
else
    echo "⚠️  No replication mode specified, running as standalone"
fi

echo "PostgreSQL initialization complete"
