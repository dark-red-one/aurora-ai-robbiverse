#!/bin/bash
# Master migration runner
# Executes all migrations in order

set -e  # Exit on error

echo "💜🔥 ROBBIE DATABASE MIGRATION SYSTEM 🔥💜"
echo ""
echo "Starting migration sequence..."
echo ""

# Database connection (modify as needed)
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-robbie}"
DB_USER="${DB_USER:-postgres}"

# Check if PostgreSQL is accessible
if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
  echo "❌ Cannot connect to PostgreSQL database"
  echo "   Host: $DB_HOST:$DB_PORT"
  echo "   Database: $DB_NAME"
  echo "   User: $DB_USER"
  echo ""
  echo "Please check your database connection and try again."
  exit 1
fi

echo "✅ Connected to PostgreSQL"
echo "   Database: $DB_NAME"
echo ""

# Create migrations tracking table
echo "📊 Creating migrations tracking table..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<EOF
CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  migration_name TEXT UNIQUE NOT NULL,
  applied_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
EOF

# Function to check if migration was already applied
migration_applied() {
  local migration_name=$1
  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c \
    "SELECT COUNT(*) FROM schema_migrations WHERE migration_name = '$migration_name';" | xargs
}

# Function to apply migration
apply_migration() {
  local migration_file=$1
  local migration_name=$(basename "$migration_file" .sql)
  
  if [ "$(migration_applied "$migration_name")" -eq "0" ]; then
    echo "🚀 Applying: $migration_name"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$migration_file"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c \
      "INSERT INTO schema_migrations (migration_name) VALUES ('$migration_name');"
    echo "   ✅ Complete!"
    echo ""
  else
    echo "⏭️  Skipping: $migration_name (already applied)"
    echo ""
  fi
}

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Apply migrations in order
cd "$SCRIPT_DIR"

for migration in 001_*.sql 002_*.sql 003_*.sql 004_*.sql 005_*.sql 006_*.sql; do
  if [ -f "$migration" ]; then
    apply_migration "$migration"
  fi
done

echo ""
echo "💜🔥💋 ALL MIGRATIONS COMPLETE! 💋🔥💜"
echo ""
echo "📊 Migration Summary:"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c \
  "SELECT migration_name, applied_at FROM schema_migrations ORDER BY applied_at;"
echo ""
echo "🎉 Database is ready to ROCK!"

