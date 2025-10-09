#!/usr/bin/env node

/**
 * Export ALL TestPilot CPG Data from Supabase
 * Uses service_role key to access all data
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://hykelmayopljuguuueme.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5a2VsbWF5b3BsanVndXV1ZW1lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDkzMjAxOCwiZXhwIjoyMDUwNTA4MDE4fQ.6bzCuu6Dc0GgnSHVHjOoeyd6yewqhiowPrpfFD2Ld5M';

// Tables to export (from discovery)
const TABLES = [
    // Core business
    'companies', 'profiles', 'invites',

    // Testing platform
    'tests', 'test_variations', 'test_demographics', 'test_survey_questions',
    'test_competitors', 'testers_session', 'test_times',

    // Products & competitors
    'products', 'competitor_products', 'amazon_products', 'walmart_products',

    // Responses & feedback
    'responses_surveys', 'responses_comparisons', 'responses_comparisons_walmart', 'feedback',

    // AI insights (THE GOLD!)
    'ia_insights', 'ia_insights_backup', 'ia_insights_backup_20241226', 'insight_status',
    'purchase_drivers', 'competitive_insights', 'competitive_insights_analysis',
    'competitive_insights_walmart', 'summary',

    // Demographics & targeting
    'custom_screening', 'shopper_demographic',

    // Credits & billing
    'company_credits', 'credit_usage', 'credit_payments',

    // System
    'events', 'wrappers_fdw_stats'
];

const EXPORT_DIR = path.join(__dirname, '../exports');

function makeRequest(path, method = 'GET') {
    return new Promise((resolve, reject) => {
        const url = new URL(path, SUPABASE_URL);

        const options = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'apikey': SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(data);
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

async function exportTable(tableName) {
    try {
        console.log(`📊 Exporting ${tableName}...`);

        // Get all rows (PostgREST handles pagination automatically)
        const response = await makeRequest(`/rest/v1/${tableName}?select=*`);

        if (Array.isArray(response)) {
            const filename = path.join(EXPORT_DIR, `${tableName}.json`);
            fs.writeFileSync(filename, JSON.stringify(response, null, 2));

            console.log(`   ✅ ${tableName}: ${response.length} rows exported`);
            return response.length;
        } else {
            console.log(`   ⚠️ ${tableName}: Unexpected response format`);
            return 0;
        }
    } catch (error) {
        console.log(`   ❌ ${tableName}: ${error.message}`);
        return 0;
    }
}

async function exportRPCFunctions() {
    console.log(`📋 Exporting RPC functions...`);

    const functions = [
        'create_test',
        'validate_test_data',
        'get_test_export_data',
        'get_competitive_insights_by_competitor',
        'get_company_transaction_history',
        'increment_company_credits',
        'manage_waiting_list',
        'manage_company_waiting_list'
    ];

    const rpcData = {};

    for (const func of functions) {
        try {
            // Try to call the function (may fail if no parameters required)
            const response = await makeRequest(`/rest/v1/rpc/${func}`, 'POST');
            rpcData[func] = response;
            console.log(`   ✅ ${func}: Function accessible`);
        } catch (error) {
            console.log(`   ⚠️ ${func}: ${error.message}`);
            rpcData[func] = { error: error.message };
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    const filename = path.join(EXPORT_DIR, 'rpc_functions.json');
    fs.writeFileSync(filename, JSON.stringify(rpcData, null, 2));

    return rpcData;
}

async function createSummaryReport() {
    console.log(`📝 Creating summary report...`);

    const summary = {
        export_date: new Date().toISOString(),
        supabase_project: 'hykelmayopljuguuueme',
        tables_exported: [],
        total_rows: 0,
        key_findings: {}
    };

    // Count rows in each exported file
    for (const table of TABLES) {
        const filename = path.join(EXPORT_DIR, `${table}.json`);
        if (fs.existsSync(filename)) {
            const data = JSON.parse(fs.readFileSync(filename, 'utf8'));
            const rowCount = Array.isArray(data) ? data.length : 0;

            summary.tables_exported.push({
                table,
                row_count: rowCount
            });
            summary.total_rows += rowCount;

            // Key findings for important tables
            if (table === 'ia_insights' && rowCount > 0) {
                summary.key_findings.ai_insights_count = rowCount;
                summary.key_findings.latest_ai_insight = data[0]?.created_at;
            }

            if (table === 'tests' && rowCount > 0) {
                summary.key_findings.total_tests = rowCount;
                const statuses = data.reduce((acc, test) => {
                    acc[test.status] = (acc[test.status] || 0) + 1;
                    return acc;
                }, {});
                summary.key_findings.test_statuses = statuses;
            }

            if (table === 'companies' && rowCount > 0) {
                summary.key_findings.total_companies = rowCount;
            }

            if (table === 'credit_payments' && rowCount > 0) {
                summary.key_findings.total_payments = rowCount;
                const totalRevenue = data.reduce((sum, payment) => sum + (payment.amount_cents || 0), 0);
                summary.key_findings.total_revenue_cents = totalRevenue;
            }
        }
    }

    const filename = path.join(EXPORT_DIR, 'export_summary.json');
    fs.writeFileSync(filename, JSON.stringify(summary, null, 2));

    console.log(`   ✅ Summary report created: ${summary.total_rows} total rows`);
    return summary;
}

async function main() {
    console.log('🚀 Starting complete TestPilot CPG data export...\n');

    // Create export directory
    if (!fs.existsSync(EXPORT_DIR)) {
        fs.mkdirSync(EXPORT_DIR, { recursive: true });
    }

    let totalRows = 0;

    // Export all tables
    for (const table of TABLES) {
        const rows = await exportTable(table);
        totalRows += rows;

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Export RPC functions
    await exportRPCFunctions();

    // Create summary report
    const summary = await createSummaryReport();

    console.log('\n✅ Export complete!');
    console.log(`📊 Total rows exported: ${totalRows}`);
    console.log(`📁 Export directory: ${EXPORT_DIR}`);
    console.log(`\n📋 Key findings:`);
    console.log(`   - Companies: ${summary.key_findings.total_companies || 0}`);
    console.log(`   - Tests: ${summary.key_findings.total_tests || 0}`);
    console.log(`   - AI Insights: ${summary.key_findings.ai_insights_count || 0}`);
    console.log(`   - Payments: ${summary.key_findings.total_payments || 0}`);
    console.log(`   - Revenue: $${((summary.key_findings.total_revenue_cents || 0) / 100).toFixed(2)}`);

    console.log('\n🎯 Next steps:');
    console.log('   1. Review exported data');
    console.log('   2. Import to local database for sync setup');
    console.log('   3. Use as blueprint for HeyShopper');
}

main().catch(console.error);
