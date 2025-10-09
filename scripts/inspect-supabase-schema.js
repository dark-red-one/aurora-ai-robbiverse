#!/usr/bin/env node

/**
 * Inspect Supabase TestPilot CPG Schema
 * Uses Supabase REST API to introspect the database schema
 */

const https = require('https');
const fs = require('fs');

// Load credentials
require('dotenv').config({ path: '.env.supabase' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Inspecting Supabase schema...');
console.log(`📍 Project: ${SUPABASE_URL}`);

/**
 * Make authenticated request to Supabase
 */
function supabaseRequest(path, method = 'GET') {
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

            res.on('data', (chunk) => {
                data += chunk;
            });

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

/**
 * Get list of all tables via PostgREST introspection
 */
async function getTables() {
    try {
        // Use PostgREST's OpenAPI spec endpoint
        const response = await supabaseRequest('/rest/v1/');
        console.log('📊 Schema inspection response:', JSON.stringify(response, null, 2));
        return response;
    } catch (error) {
        console.error('❌ Error fetching tables:', error.message);
        return null;
    }
}

/**
 * Query a specific table to understand its structure
 */
async function getTableStructure(tableName) {
    try {
        // Get first row to understand structure
        const response = await supabaseRequest(`/rest/v1/${tableName}?limit=0`);
        console.log(`\n📋 Table: ${tableName}`);
        console.log(JSON.stringify(response, null, 2));
        return response;
    } catch (error) {
        console.error(`❌ Error fetching ${tableName}:`, error.message);
        return null;
    }
}

/**
 * Try to get schema info via SQL query
 */
async function getSchemaViaRPC() {
    try {
        // Try to call a function that lists tables
        const response = await supabaseRequest('/rest/v1/rpc/get_schema_info', 'POST');
        console.log('📊 Schema via RPC:', JSON.stringify(response, null, 2));
        return response;
    } catch (error) {
        console.log('ℹ️  RPC method not available (expected)');
        return null;
    }
}

/**
 * Main execution
 */
async function main() {
    console.log('\n=== PHASE 1: Inspect Supabase Schema ===\n');

    // Try to get schema info
    console.log('1️⃣ Attempting to fetch schema via REST API...');
    const schema = await getTables();

    if (!schema) {
        console.log('\n2️⃣ Attempting to fetch schema via RPC...');
        await getSchemaViaRPC();
    }

    // Common TestPilot CPG table names to try
    const commonTables = [
        'users',
        'contacts',
        'companies',
        'deals',
        'emails',
        'interactions',
        'tasks',
        'notes',
        'tags',
        'conversations',
        'attachments'
    ];

    console.log('\n3️⃣ Probing common table names...');
    for (const table of commonTables) {
        await getTableStructure(table);
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n✅ Inspection complete!');
    console.log('\n📝 Next steps:');
    console.log('   - Review output above for table names');
    console.log('   - If tables found, we can query their structure');
    console.log('   - If no tables found, we need database password for pg_dump');
}

main().catch(console.error);

