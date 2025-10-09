import { Pool } from 'pg';

/**
 * Supabase Sync Service
 * Bidirectional sync between Supabase TestPilot CPG and network nodes
 */

export class SupabaseSyncService {
    private supabasePool: Pool;
    private localPool: Pool;
    private syncInterval: NodeJS.Timeout;
    private isRunning: boolean = false;

    // All TestPilot CPG tables discovered
    private readonly TESTPILOT_TABLES = [
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

    constructor() {
        // Supabase connection (TestPilot CPG production)
        this.supabasePool = new Pool({
            host: process.env.SUPABASE_DB_HOST || 'db.hykelmayopljuguuueme.supabase.co',
            port: parseInt(process.env.SUPABASE_DB_PORT || '5432'),
            database: process.env.SUPABASE_DB_NAME || 'postgres',
            user: process.env.SUPABASE_DB_USER || 'postgres.hykelmayopljuguuueme',
            password: process.env.SUPABASE_DB_PASSWORD,
            ssl: { rejectUnauthorized: false }
        });

        // Local replica connection
        this.localPool = new Pool({
            host: process.env.LOCAL_DB_HOST || 'localhost',
            port: parseInt(process.env.LOCAL_DB_PORT || '5432'),
            database: process.env.LOCAL_DB_NAME || 'robbieverse',
            user: process.env.LOCAL_DB_USER || 'robbie',
            password: process.env.LOCAL_DB_PASSWORD || 'robbie_dev_2025'
        });
    }

    async startSync(intervalSeconds: number = 30) {
        if (this.isRunning) {
            console.log('⚠️ Supabase sync already running');
            return;
        }

        console.log('🚀 Starting Supabase TestPilot CPG sync...');
        console.log(`📊 Syncing ${this.TESTPILOT_TABLES.length} tables`);
        
        this.isRunning = true;

        // Initial sync from Supabase to local
        await this.syncFromSupabase();
        
        // Periodic bidirectional sync
        this.syncInterval = setInterval(async () => {
            try {
                await this.syncFromSupabase();
                await this.syncToSupabase();
            } catch (error) {
                console.error('❌ Sync cycle error:', error);
            }
        }, intervalSeconds * 1000);

        console.log(`✅ Supabase sync started (every ${intervalSeconds}s)`);
    }

    async syncFromSupabase() {
        try {
            console.log('⬇️ Syncing from Supabase...');
            let totalSynced = 0;

            for (const table of this.TESTPILOT_TABLES) {
                const synced = await this.syncTableFromSupabase(table);
                totalSynced += synced;
            }

            console.log(`✅ Synced ${totalSynced} rows from Supabase`);
        } catch (error) {
            console.error('❌ Sync from Supabase failed:', error);
        }
    }

    async syncTableFromSupabase(tableName: string): Promise<number> {
        try {
            // Get latest timestamp from local
            const localResult = await this.localPool.query(`
                SELECT MAX(updated_at) as last_updated FROM ${tableName}
                WHERE updated_at IS NOT NULL
            `).catch(() => ({ rows: [{ last_updated: null }] }));
            
            const lastUpdated = localResult.rows[0]?.last_updated || '1970-01-01';

            // Get new/updated rows from Supabase
            const supabaseResult = await this.supabasePool.query(`
                SELECT * FROM ${tableName} 
                WHERE updated_at > $1
                ORDER BY updated_at ASC
            `, [lastUpdated]);

            // Upsert into local
            let synced = 0;
            for (const row of supabaseResult.rows) {
                await this.upsertRow(tableName, row);
                synced++;
            }

            if (synced > 0) {
                console.log(`   📋 ${tableName}: ${synced} rows synced`);
            }

            return synced;
        } catch (error) {
            console.error(`❌ Error syncing ${tableName}:`, error.message);
            return 0;
        }
    }

    async syncToSupabase() {
        try {
            // Check for local changes that need to go to Supabase
            const pendingChanges = await this.localPool.query(`
                SELECT * FROM pending_supabase_sync 
                WHERE synced_at IS NULL
                ORDER BY created_at ASC
                LIMIT 100
            `);

            for (const change of pendingChanges.rows) {
                await this.applyChangeToSupabase(change);
                
                // Mark as synced
                await this.localPool.query(`
                    UPDATE pending_supabase_sync 
                    SET synced_at = NOW() 
                    WHERE id = $1
                `, [change.id]);
            }

            if (pendingChanges.rowCount > 0) {
                console.log(`⬆️ Synced ${pendingChanges.rowCount} changes to Supabase`);
            }
        } catch (error) {
            console.error('❌ Sync to Supabase failed:', error);
        }
    }

    async upsertRow(tableName: string, row: any) {
        try {
            const columns = Object.keys(row).filter(key => key !== 'id');
            const values = columns.map(col => row[col]);
            const placeholders = values.map((_, i) => `$${i + 2}`).join(', ');
            
            const upsertQuery = `
                INSERT INTO ${tableName} (id, ${columns.join(', ')})
                VALUES ($1, ${placeholders})
                ON CONFLICT (id) DO UPDATE SET
                    ${columns.map((col, i) => `${col} = $${i + 2}`).join(', ')},
                    updated_at = EXCLUDED.updated_at
            `;

            await this.localPool.query(upsertQuery, [row.id, ...values]);
        } catch (error) {
            console.error(`❌ Error upserting to ${tableName}:`, error);
        }
    }

    async applyChangeToSupabase(change: any) {
        try {
            const { table_name, operation, data } = change;
            
            switch (operation) {
                case 'INSERT':
                    await this.supabasePool.query(`
                        INSERT INTO ${table_name} (${Object.keys(data).join(', ')})
                        VALUES (${Object.values(data).map((_, i) => `$${i + 1}`).join(', ')})
                    `, Object.values(data));
                    break;
                    
                case 'UPDATE':
                    const updateColumns = Object.keys(data).filter(key => key !== 'id');
                    const updateValues = updateColumns.map(col => data[col]);
                    
                    await this.supabasePool.query(`
                        UPDATE ${table_name} 
                        SET ${updateColumns.map((col, i) => `${col} = $${i + 2}`).join(', ')},
                            updated_at = NOW()
                        WHERE id = $1
                    `, [data.id, ...updateValues]);
                    break;
                    
                case 'DELETE':
                    await this.supabasePool.query(`
                        DELETE FROM ${table_name} WHERE id = $1
                    `, [data.id]);
                    break;
            }
        } catch (error) {
            console.error(`❌ Error applying change to Supabase:`, error);
        }
    }

    // Write method for applications to use
    async write(tableName: string, data: any): Promise<any> {
        try {
            // Try Supabase first (master)
            const result = await this.writeToSupabase(tableName, data);
            
            // Also write to local for fast reads
            await this.upsertRow(tableName, result);
            
            return result;
        } catch (error) {
            console.warn('⚠️ Supabase unavailable, writing locally and queuing');
            // Fallback to local + queue for later sync
            return await this.writeToLocal(tableName, data, true);
        }
    }

    async writeToSupabase(tableName: string, data: any) {
        const columns = Object.keys(data).join(', ');
        const values = Object.values(data);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

        const result = await this.supabasePool.query(`
            INSERT INTO ${tableName} (${columns})
            VALUES (${placeholders})
            RETURNING *
        `, values);

        return result.rows[0];
    }

    async writeToLocal(tableName: string, data: any, queue: boolean = false) {
        const columns = Object.keys(data).join(', ');
        const values = Object.values(data);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

        const result = await this.localPool.query(`
            INSERT INTO ${tableName} (${columns})
            VALUES (${placeholders})
            RETURNING *
        `, values);

        if (queue) {
            // Queue for later sync to Supabase
            await this.localPool.query(`
                INSERT INTO pending_supabase_sync (table_name, operation, data)
                VALUES ($1, $2, $3)
            `, [tableName, 'INSERT', JSON.stringify(data)]);
        }

        return result.rows[0];
    }

    async read(tableName: string, where: any = {}): Promise<any[]> {
        // Always read from local (fast)
        const whereClause = Object.keys(where).length > 0
            ? 'WHERE ' + Object.keys(where).map((k, i) => `${k} = $${i + 1}`).join(' AND ')
            : '';
        
        const result = await this.localPool.query(`
            SELECT * FROM ${tableName} ${whereClause}
            ORDER BY updated_at DESC
        `, Object.values(where));

        return result.rows;
    }

    async stop() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        this.isRunning = false;
        await this.supabasePool.end();
        await this.localPool.end();
        console.log('🛑 Supabase sync stopped');
    }

    // Health check
    async healthCheck() {
        try {
            const supabaseHealth = await this.supabasePool.query('SELECT 1');
            const localHealth = await this.localPool.query('SELECT 1');
            
            return {
                supabase: supabaseHealth.rowCount > 0,
                local: localHealth.rowCount > 0,
                isRunning: this.isRunning
            };
        } catch (error) {
            return {
                supabase: false,
                local: false,
                isRunning: this.isRunning,
                error: error.message
            };
        }
    }
}
