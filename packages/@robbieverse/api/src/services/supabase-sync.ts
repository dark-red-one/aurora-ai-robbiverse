import { createClient } from '@supabase/supabase-js';
import { Pool, PoolClient } from 'pg';

export interface SyncConfig {
    supabaseUrl: string;
    supabaseKey: string;
    localDbUrl: string;
    syncInterval: number; // milliseconds
    tables: string[];
    readOnly: boolean; // If true, only sync FROM Supabase (never write back)
}

export class SupabaseSyncService {
    private supabase: any;
    private localPool: Pool;
    private config: SyncConfig;
    private syncInterval?: NodeJS.Timeout;
    private isRunning = false;

    constructor(config: SyncConfig) {
        this.config = config;
        this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
        this.localPool = new Pool({
            connectionString: config.localDbUrl,
        });
    }

    async start(): Promise<void> {
        if (this.isRunning) {
            console.log('Sync service already running');
            return;
        }

        console.log('🚀 Starting Supabase sync service...');
        this.isRunning = true;

        // Initial sync
        await this.performSync();

        // Set up periodic sync
        this.syncInterval = setInterval(async () => {
            try {
                await this.performSync();
            } catch (error) {
                console.error('❌ Sync error:', error);
            }
        }, this.config.syncInterval);

        console.log(`✅ Sync service started - syncing every ${this.config.syncInterval / 1000}s`);
    }

    async stop(): Promise<void> {
        if (!this.isRunning) {
            return;
        }

        console.log('🛑 Stopping Supabase sync service...');
        this.isRunning = false;

        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }

        await this.localPool.end();
        console.log('✅ Sync service stopped');
    }

    private async performSync(): Promise<void> {
        const syncMode = this.config.readOnly ? '📥 READ-ONLY sync' : '🔄 bidirectional sync';
        console.log(`${syncMode}...`);

        for (const tableName of this.config.tables) {
            try {
                // Sync from Supabase to local (ALWAYS safe)
                await this.syncFromSupabase(tableName);

                // Sync from local to Supabase (ONLY if not read-only)
                if (!this.config.readOnly) {
                    await this.syncToSupabase(tableName);
                }

                console.log(`✅ Synced table: ${tableName}`);
            } catch (error) {
                console.error(`❌ Error syncing table ${tableName}:`, error);
            }
        }
    }

    private async syncFromSupabase(tableName: string): Promise<void> {
        const localClient = await this.localPool.connect();

        try {
            // Get latest timestamp from local table
            const lastSyncResult = await localClient.query(
                `SELECT MAX(updated_at) as last_sync FROM ${tableName} WHERE updated_at IS NOT NULL`
            );

            const lastSync = lastSyncResult.rows[0]?.last_sync;

            // Fetch new/updated data from Supabase
            let query = this.supabase.from(tableName).select('*');

            if (lastSync) {
                query = query.gte('updated_at', lastSync.toISOString());
            }

            const { data, error } = await query;

            if (error) {
                throw new Error(`Supabase query error: ${error.message}`);
            }

            if (!data || data.length === 0) {
                return; // No new data
            }

            // Insert/update data in local database
            for (const row of data) {
                await this.upsertRow(localClient, tableName, row);
            }

            console.log(`📥 Synced ${data.length} rows from Supabase to local (${tableName})`);

        } finally {
            localClient.release();
        }
    }

    private async syncToSupabase(tableName: string): Promise<void> {
        const localClient = await this.localPool.connect();

        try {
            // Get local changes that need to be synced to Supabase
            const result = await localClient.query(
                `SELECT * FROM ${tableName} WHERE sync_status = 'pending' OR sync_status IS NULL LIMIT 100`
            );

            if (result.rows.length === 0) {
                return; // No pending changes
            }

            // Send changes to Supabase
            for (const row of result.rows) {
                try {
                    const { error } = await this.supabase
                        .from(tableName)
                        .upsert(row, { onConflict: 'id' });

                    if (error) {
                        console.error(`Error syncing row to Supabase:`, error);
                        continue;
                    }

                    // Mark as synced in local database
                    await localClient.query(
                        `UPDATE ${tableName} SET sync_status = 'synced', synced_at = NOW() WHERE id = $1`,
                        [row.id]
                    );

                } catch (error) {
                    console.error(`Error syncing row ${row.id} to Supabase:`, error);
                }
            }

            console.log(`📤 Synced ${result.rows.length} rows from local to Supabase (${tableName})`);

        } finally {
            localClient.release();
        }
    }

    private async upsertRow(client: PoolClient, tableName: string, row: any): Promise<void> {
        // Get column names (excluding id if it's auto-generated)
        const columns = Object.keys(row);
        const values = Object.values(row);

        // Build UPSERT query
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
        const updateClause = columns
            .filter(col => col !== 'id')
            .map((col, i) => `${col} = $${i + 1}`)
            .join(', ');

        const query = `
      INSERT INTO ${tableName} (${columns.join(', ')})
      VALUES (${placeholders})
      ON CONFLICT (id) DO UPDATE SET
        ${updateClause},
        updated_at = NOW()
    `;

        await client.query(query, values);
    }

    // Method to manually trigger sync for specific table
    async syncTable(tableName: string): Promise<void> {
        console.log(`🔄 Manual sync triggered for table: ${tableName}`);
        await this.syncFromSupabase(tableName);
        await this.syncToSupabase(tableName);
    }

    // Method to get sync status
    async getSyncStatus(): Promise<any> {
        const client = await this.localPool.connect();

        try {
            const result = await client.query(`
        SELECT 
          table_name,
          COUNT(*) as total_rows,
          COUNT(CASE WHEN sync_status = 'synced' THEN 1 END) as synced_rows,
          COUNT(CASE WHEN sync_status = 'pending' THEN 1 END) as pending_rows,
          MAX(updated_at) as last_update
        FROM (
          SELECT 'companies' as table_name, COUNT(*) as total_rows, 
                 COUNT(CASE WHEN sync_status = 'synced' THEN 1 END) as synced_rows,
                 COUNT(CASE WHEN sync_status = 'pending' THEN 1 END) as pending_rows,
                 MAX(updated_at) as last_update
          FROM companies
          UNION ALL
          SELECT 'tests', COUNT(*), 
                 COUNT(CASE WHEN sync_status = 'synced' THEN 1 END),
                 COUNT(CASE WHEN sync_status = 'pending' THEN 1 END),
                 MAX(updated_at)
          FROM tests
          UNION ALL
          SELECT 'credit_payments', COUNT(*),
                 COUNT(CASE WHEN sync_status = 'synced' THEN 1 END),
                 COUNT(CASE WHEN sync_status = 'pending' THEN 1 END),
                 MAX(updated_at)
          FROM credit_payments
        ) t
        GROUP BY table_name
      `);

            return result.rows;

        } finally {
            client.release();
        }
    }
}

// Default configuration for TestPilot CPG sync
export const defaultSyncConfig: SyncConfig = {
    supabaseUrl: process.env.SUPABASE_URL || 'https://hykelmayopljuguuueme.supabase.co',
    supabaseKey: process.env.SUPABASE_ANON_KEY || '',
    localDbUrl: process.env.DATABASE_URL || 'postgresql://robbie:robbie_dev_2025@localhost:5432/robbieverse',
    syncInterval: 30000, // 30 seconds
    readOnly: true, // 🔒 SAFE MODE: Only pull from Supabase, never write back
    tables: [
        'companies',
        'tests',
        'test_variations',
        'test_demographics',
        'test_survey_questions',
        'products',
        'competitor_products',
        'amazon_products',
        'walmart_products',
        'custom_screening',
        'company_credits',
        'credit_payments',
        'ia_insights',
        'feedback'
    ]
};