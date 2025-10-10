#!/bin/bash
# Apply full unified schema to vengeance_unified database
set -e

DB_NAME="vengeance_unified"
SCHEMA_DIR="/home/allan/robbie_workspace/combined/aurora-ai-robbiverse/database/unified-schema"

echo "🏛️ VENGEANCE TOWN SETUP - Applying Full Unified Schema"
echo "========================================================"
echo ""

# Array of schema files in order
SCHEMA_FILES=(
    "01-core.sql"
    "02-conversations.sql"
    "03-vectors-rag.sql"
    "04-enhanced-business-tables.sql"
    "05-town-separation.sql"
    "06-testpilot-simulations.sql"
    "07-data-sharing-strategy.sql"
    "08-universal-ai-state.sql"
    "09-google-workspace-sync.sql"
    "10-extensions.sql"
    "11-tenancy.sql"
    "12-rbac_and_privacy.sql"
    "13-slack.sql"
    "14-service_tables.sql"
    "15-indexes.sql"
    "16-audit_log.sql"
    "17-crm-entities.sql"
    "18-linkedin-integration.sql"
    "19-interactions-database.sql"
    "20-sync-infrastructure.sql"
    "21-robbieblocks-cms.sql"
    "22-testpilot-production.sql"
    "23-growth-marketing.sql"
)

# Apply each schema file
for file in "${SCHEMA_FILES[@]}"; do
    filepath="$SCHEMA_DIR/$file"
    if [ -f "$filepath" ]; then
        echo "📝 Applying $file..."
        cat "$filepath" | sudo -u postgres psql -d $DB_NAME > /tmp/schema_output_$$.log 2>&1
        if [ $? -eq 0 ]; then
            echo "   ✅ $file applied successfully"
        else
            echo "   ⚠️  $file completed with warnings (check /tmp/schema_output_$$.log)"
        fi
    else
        echo "   ⚠️  $file not found, skipping..."
    fi
done

echo ""
echo "🎉 Schema application complete!"
echo ""
echo "🔍 Verifying setup..."
echo ""

# Verify towns table
echo "📊 Towns in database:"
sudo -u postgres psql -d $DB_NAME -c "SELECT name, display_name, region FROM towns ORDER BY id;"

echo ""
echo "📊 Schema components loaded:"
sudo -u postgres psql -d $DB_NAME -c "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';"

echo ""
echo "✅ Vengeance town setup complete!"
