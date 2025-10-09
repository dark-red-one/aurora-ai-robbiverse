#!/usr/bin/env node

/**
 * Import Supabase TestPilot CPG Data to Local Database
 * Converts JSON exports to SQL INSERT statements
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const EXPORT_DIR = path.join(__dirname, '../exports');
const LOCAL_DB_CONFIG = {
    host: 'localhost',
    port: 5432,
    database: 'robbieverse',
    user: 'robbie',
    password: 'robbie_dev_2025'
};

// Table import order (respecting foreign key dependencies)
const IMPORT_ORDER = [
    // Core business (no dependencies)
    'companies',
    'profiles',
    'invites',

    // Products (depends on companies)
    'products',
    'amazon_products',
    'walmart_products',
    'competitor_products',

    // Tests (depends on companies, profiles)
    'tests',
    'test_demographics',
    'test_survey_questions',
    'test_variations',
    'test_competitors',

    // Sessions (depends on tests)
    'testers_session',
    'test_times',

    // Responses (depends on tests, sessions)
    'responses_surveys',
    'responses_comparisons',
    'responses_comparisons_walmart',

    // AI insights (depends on tests)
    'ia_insights',
    'ia_insights_backup',
    'ia_insights_backup_20241226',
    'insight_status',
    'purchase_drivers',
    'competitive_insights',
    'competitive_insights_analysis',
    'competitive_insights_walmart',
    'summary',

    // Demographics & targeting
    'custom_screening',
    'shopper_demographic',

    // Credits & billing (depends on companies)
    'company_credits',
    'credit_usage',
    'credit_payments',

    // System
    'events',
    'feedback',
    'wrappers_fdw_stats'
];

function createPool() {
    return new Pool(LOCAL_DB_CONFIG);
}

function sanitizeValue(value) {
    if (value === null || value === undefined) {
        return 'NULL';
    }

    if (typeof value === 'string') {
        // Escape single quotes and wrap in quotes
        return `'${value.replace(/'/g, "''")}'`;
    }

    if (typeof value === 'boolean') {
        return value ? 'TRUE' : 'FALSE';
    }

    if (Array.isArray(value)) {
        // Convert array to PostgreSQL array format
        const escapedValues = value.map(v =>
            typeof v === 'string' ? `"${v.replace(/"/g, '\\"')}"` : v
        );
        return `'${escapedValues.join(',')}'`;
    }

    if (typeof value === 'object') {
        // Convert JSON object to PostgreSQL JSONB
        return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
    }

    return value.toString();
}

function generateInsertStatement(tableName, row) {
    const columns = Object.keys(row);
    const values = columns.map(col => sanitizeValue(row[col]));

    return `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')}) ON CONFLICT (id) DO UPDATE SET updated_at = EXCLUDED.updated_at;`;
}

async function importTable(pool, tableName) {
    const filePath = path.join(EXPORT_DIR, `${tableName}.json`);

    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  ${tableName}: File not found, skipping`);
        return 0;
    }

    try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        if (!Array.isArray(data) || data.length === 0) {
            console.log(`📋 ${tableName}: No data to import`);
            return 0;
        }

        console.log(`📊 Importing ${tableName}...`);

        let imported = 0;
        let errors = 0;

        for (const row of data) {
            try {
                const insertSQL = generateInsertStatement(tableName, row);
                await pool.query(insertSQL);
                imported++;
            } catch (error) {
                console.log(`   ❌ Error importing row: ${error.message}`);
                errors++;
            }
        }

        console.log(`   ✅ ${tableName}: ${imported} rows imported, ${errors} errors`);
        return imported;

    } catch (error) {
        console.log(`   ❌ ${tableName}: ${error.message}`);
        return 0;
    }
}

async function verifyImport(pool) {
    console.log('\n🔍 Verifying import...');

    const verificationQueries = [
        { table: 'companies', expected: 40 },
        { table: 'tests', expected: 34 },
        { table: 'ia_insights', expected: 25 },
        { table: 'credit_payments', expected: 48 }
    ];

    for (const { table, expected } of verificationQueries) {
        try {
            const result = await pool.query(`SELECT COUNT(*) FROM ${table}`);
            const count = parseInt(result.rows[0].count);
            const status = count >= expected * 0.8 ? '✅' : '⚠️';
            console.log(`   ${status} ${table}: ${count} rows (expected ~${expected})`);
        } catch (error) {
            console.log(`   ❌ ${table}: ${error.message}`);
        }
    }
}

async function main() {
    console.log('🚀 Starting TestPilot CPG data import...\n');

    const pool = createPool();

    try {
        // Test connection
        await pool.query('SELECT 1');
        console.log('✅ Connected to local database');

        // Import tables in dependency order
        let totalImported = 0;

        for (const table of IMPORT_ORDER) {
            const imported = await importTable(pool, table);
            totalImported += imported;

            // Small delay between tables
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Verify import
        await verifyImport(pool);

        console.log('\n✅ Import complete!');
        console.log(`📊 Total rows imported: ${totalImported}`);

        console.log('\n🎯 Next steps:');
        console.log('   1. Start Supabase sync service');
        console.log('   2. Test bidirectional sync');
        console.log('   3. Use as HeyShopper blueprint');

    } catch (error) {
        console.error('❌ Import failed:', error.message);
    } finally {
        await pool.end();
    }
}

main().catch(console.error);
