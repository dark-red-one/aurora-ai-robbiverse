#!/usr/bin/env node

/**
 * Inspect Supabase Table Structures
 * Get detailed column info for each table discovered
 */

const https = require('https');

const SUPABASE_URL = 'https://hykelmayopljuguuueme.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5a2VsbWF5b3BsanVndXV1ZW1lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDkzMjAxOCwiZXhwIjoyMDUwNTA4MDE4fQ.6bzCuu6Dc0GgnSHVHjOoeyd6yewqhiowPrpfFD2Ld5M';

// Tables to inspect (from discovery)
const TABLES = [
  'companies', 'profiles', 'invites',
  'tests', 'test_variations', 'test_demographics', 'test_survey_questions', 'test_competitors', 'testers_session', 'test_times',
  'products', 'competitor_products', 'amazon_products', 'walmart_products',
  'responses_surveys', 'responses_comparisons', 'responses_comparisons_walmart', 'feedback',
  'ia_insights', 'ia_insights_backup', 'ia_insights_backup_20241226', 'insight_status',
  'purchase_drivers', 'competitive_insights', 'competitive_insights_analysis', 'competitive_insights_walmart', 'summary',
  'custom_screening', 'shopper_demographic',
  'company_credits', 'credit_usage', 'credit_payments',
  'events', 'wrappers_fdw_stats'
];

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

async function inspectTable(tableName) {
  try {
    console.log(`\n🔍 Inspecting table: ${tableName}`);
    
    // Try to get first row to understand structure
    const response = await makeRequest(`/rest/v1/${tableName}?limit=1`);
    
    if (Array.isArray(response) && response.length > 0) {
      const sampleRow = response[0];
      console.log(`📋 Columns found:`);
      Object.keys(sampleRow).forEach(col => {
        const value = sampleRow[col];
        const type = typeof value;
        const example = value === null ? 'NULL' : 
                       type === 'string' && value.length > 50 ? value.substring(0, 50) + '...' : 
                       value;
        console.log(`   ${col}: ${type} (example: ${example})`);
      });
    } else {
      console.log(`   (No data or empty table)`);
    }
    
    return response;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('🚀 Starting detailed table structure inspection...\n');
  
  const results = {};
  
  for (const table of TABLES) {
    const result = await inspectTable(table);
    results[table] = result;
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log('\n✅ Inspection complete!');
  console.log(`\n📊 Summary:`);
  console.log(`   Tables inspected: ${TABLES.length}`);
  console.log(`   Successful: ${Object.values(results).filter(r => r !== null).length}`);
  console.log(`   Errors: ${Object.values(results).filter(r => r === null).length}`);
}

main().catch(console.error);
