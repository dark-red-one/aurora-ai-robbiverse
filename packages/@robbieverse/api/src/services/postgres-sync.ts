import { Pool } from 'pg';

interface SyncConfig {
    master: {
        host: string;
        port: number;
        database: string;
        user: string;
        password: string;
        ssl: boolean;
    };
    local: {
        host: string;
        port: number;
        database: string;
        user: string;
        password: string;
    };
}

export class PostgresSync {
    private masterPool: Pool;
    private localPool: Pool;
    private syncInterval: NodeJS.Timeout | null = null;
    private isOnline: boolean = true;

    constructor(config: SyncConfig) {
        // Master connection (Elestio/ElephantSQL)
        this.masterPool = new Pool({
            host: config.master.host,
            port: config.master.port,
            database: config.master.database,
            user: config.master.user,
            password: config.master.password,
            ssl: config.master.ssl ? { rejectUnauthorized: false } : false,
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000
        });

        // Local replica
        this.localPool = new Pool({
            host: config.local.host,
            port: config.local.port,
            database: config.local.database,
            user: config.local.user,
            password: config.local.password,
            max: 20,
            idleTimeoutMillis: 30000
        });

        // Check master connection on startup
        this.checkMasterConnection();
    }

    private async checkMasterConnection(): Promise<boolean> {
        try {
            await this.masterPool.query('SELECT 1');
            this.isOnline = true;
            console.log('🐘 Master Postgres: ONLINE');
            return true;
        } catch (error) {
            this.isOnline = false;
            console.warn('⚠️  Master Postgres: OFFLINE (working locally)');
            return false;
        }
    }

    async startSync(intervalSeconds: number = 30) {
        console.log('🔄 Starting Elephant Postgres sync...');

        // Initial sync
        await this.syncFromMaster();

        // Periodic sync
        this.syncInterval = setInterval(async () => {
            await this.checkMasterConnection();
            if (this.isOnline) {
                await this.syncFromMaster();
                await this.syncToMaster();
            }
        }, intervalSeconds * 1000);
    }

    async syncFromMaster() {
        try {
            const tables = ['users', 'code_conversations', 'code_messages', 'code_blocks', 'learned_patterns', 'robbie_personality_state'];

            for (const table of tables) {
                await this.syncTable(table);
            }

            console.log('✅ Synced from master');
        } catch (error: any) {
            console.error('❌ Sync from master failed:', error.message);
            this.isOnline = false;
        }
    }

    async syncToMaster() {
        try {
            // Check for local changes that need to be synced
            const localChanges = await this.localPool.query(`
                SELECT * FROM pending_sync 
                WHERE synced_at IS NULL
                ORDER BY created_at ASC
                LIMIT 100
            `);

            if (localChanges.rowCount === 0) {
                return; // Nothing to sync
            }

            console.log(`🔄 Syncing ${localChanges.rowCount} changes to master...`);

            for (const change of localChanges.rows) {
                try {
                    await this.applyChangeToMaster(change);

                    // Mark as synced
                    await this.localPool.query(`
                        UPDATE pending_sync 
                        SET synced_at = CURRENT_TIMESTAMP 
                        WHERE id = $1
                    `, [change.id]);
                } catch (error: any) {
                    // Log error but continue with other changes
                    await this.localPool.query(`
                        UPDATE pending_sync 
                        SET error = $1 
                        WHERE id = $2
                    `, [error.message, change.id]);
                }
            }

            console.log(`✅ Synced ${localChanges.rowCount} changes to master`);
        } catch (error: any) {
            console.error('❌ Sync to master failed:', error.message);
            this.isOnline = false;
        }
    }

    async syncTable(tableName: string) {
        // Get latest timestamp from local
        const localResult = await this.localPool.query(`
            SELECT COALESCE(MAX(updated_at), '1970-01-01'::timestamptz) as last_updated 
            FROM ${tableName}
        `);

        const lastUpdated = localResult.rows[0]?.last_updated;

        // Get new/updated rows from master
        const masterResult = await this.masterPool.query(`
            SELECT * FROM ${tableName} 
            WHERE updated_at > $1
            ORDER BY updated_at ASC
            LIMIT 1000
        `, [lastUpdated]);

        if (masterResult.rowCount === 0) {
            return; // No new data
        }

        // Upsert into local
        for (const row of masterResult.rows) {
            const columns = Object.keys(row);
            const values = Object.values(row);
            const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
            const updateSet = columns
                .filter(c => c !== 'id')
                .map(c => `${c} = EXCLUDED.${c}`)
                .join(', ');

            await this.localPool.query(`
                INSERT INTO ${tableName} (${columns.join(', ')})
                VALUES (${placeholders})
                ON CONFLICT (id) DO UPDATE SET ${updateSet}
            `, values);
        }

        console.log(`  ↓ ${tableName}: ${masterResult.rowCount} rows`);
    }

    async applyChangeToMaster(change: any) {
        const { table_name, operation, data } = change;

        if (operation === 'INSERT' || operation === 'UPSERT') {
            const columns = Object.keys(data);
            const values = Object.values(data);
            const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
            const updateSet = columns
                .filter(c => c !== 'id')
                .map(c => `${c} = EXCLUDED.${c}`)
                .join(', ');

            await this.masterPool.query(`
                INSERT INTO ${table_name} (${columns.join(', ')})
                VALUES (${placeholders})
                ON CONFLICT (id) DO UPDATE SET ${updateSet}
            `, values);
        } else if (operation === 'UPDATE') {
            const updateSet = Object.keys(data)
                .filter(k => k !== 'id')
                .map((k, i) => `${k} = $${i + 2}`)
                .join(', ');
            const values = [data.id, ...Object.entries(data).filter(([k]) => k !== 'id').map(([, v]) => v)];

            await this.masterPool.query(`
                UPDATE ${table_name} SET ${updateSet} WHERE id = $1
            `, values);
        } else if (operation === 'DELETE') {
            await this.masterPool.query(`
                DELETE FROM ${table_name} WHERE id = $1
            `, [data.id]);
        }
    }

    async write(table: string, data: any): Promise<any> {
        try {
            if (this.isOnline) {
                // Try master first
                return await this.writeToMaster(table, data);
            } else {
                // Offline: write locally and queue
                return await this.writeToLocal(table, data, true);
            }
        } catch (error) {
            console.warn(`⚠️  Master unavailable for ${table}, writing locally`);
            // Fallback to local + queue
            return await this.writeToLocal(table, data, true);
        }
    }

    async writeToMaster(table: string, data: any) {
        const columns = Object.keys(data);
        const values = Object.values(data);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

        const result = await this.masterPool.query(`
            INSERT INTO ${table} (${columns.join(', ')})
            VALUES (${placeholders})
            RETURNING *
        `, values);

        // Also write to local for fast reads
        try {
            const updateSet = columns
                .filter(c => c !== 'id')
                .map(c => `${c} = EXCLUDED.${c}`)
                .join(', ');

            await this.localPool.query(`
                INSERT INTO ${table} (${columns.join(', ')})
                VALUES (${placeholders})
                ON CONFLICT (id) DO UPDATE SET ${updateSet}
            `, values);
        } catch (error) {
            console.error(`Error syncing ${table} to local:`, error);
        }

        return result.rows[0];
    }

    async writeToLocal(table: string, data: any, queue: boolean = false) {
        const columns = Object.keys(data);
        const values = Object.values(data);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

        const result = await this.localPool.query(`
            INSERT INTO ${table} (${columns.join(', ')})
            VALUES (${placeholders})
            RETURNING *
        `, values);

        if (queue) {
            // Queue for later sync to master
            await this.localPool.query(`
                INSERT INTO pending_sync (table_name, operation, data)
                VALUES ($1, $2, $3)
            `, [table, 'INSERT', JSON.stringify(data)]);
        }

        return result.rows[0];
    }

    async read(table: string, where: any = {}): Promise<any[]> {
        // Always read from local (fast)
        const whereKeys = Object.keys(where);
        const whereClause = whereKeys.length > 0
            ? 'WHERE ' + whereKeys.map((k, i) => `${k} = $${i + 1}`).join(' AND ')
            : '';

        const result = await this.localPool.query(`
            SELECT * FROM ${table} ${whereClause}
        `, Object.values(where));

        return result.rows;
    }

    async query(sql: string, params: any[] = [], useMaster: boolean = false): Promise<any> {
        const pool = useMaster && this.isOnline ? this.masterPool : this.localPool;
        return await pool.query(sql, params);
    }

    getLocalPool(): Pool {
        return this.localPool;
    }

    getMasterPool(): Pool {
        return this.masterPool;
    }

    isConnectedToMaster(): boolean {
        return this.isOnline;
    }

    async stop() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        await this.masterPool.end();
        await this.localPool.end();
        console.log('🛑 Postgres sync stopped');
    }
}

// Helper to create sync instance from environment variables
export function createPostgresSyncFromEnv(): PostgresSync {
    const config: SyncConfig = {
        master: {
            host: process.env.MASTER_DB_HOST || 'aurora-postgres-u44170.vm.elestio.app',
            port: parseInt(process.env.MASTER_DB_PORT || '25432'),
            database: process.env.MASTER_DB_NAME || 'aurora_unified',
            user: process.env.MASTER_DB_USER || 'aurora_app',
            password: process.env.MASTER_DB_PASSWORD || '',
            ssl: process.env.MASTER_DB_SSL === 'require'
        },
        local: {
            host: process.env.LOCAL_DB_HOST || 'localhost',
            port: parseInt(process.env.LOCAL_DB_PORT || '5432'),
            database: process.env.LOCAL_DB_NAME || 'robbieverse',
            user: process.env.LOCAL_DB_USER || 'robbie',
            password: process.env.LOCAL_DB_PASSWORD || 'robbie_dev_2025'
        }
    };

    return new PostgresSync(config);
}


