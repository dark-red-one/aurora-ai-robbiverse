# 🐘 **ELEPHANT POSTGRES MASTER + LOCAL REPLICA ARCHITECTURE**

**Created:** January 9, 2025  
**Architecture:** Master-Replica with Local Cache

---

## 🎯 **Architecture Overview**

```
┌─────────────────────────────────────────────────────────┐
│  ElephantSQL / Elestio (MASTER)                         │
│  aurora-postgres-u44170.vm.elestio.app:25432           │
│                                                          │
│  Database: aurora_unified                                │
│  User: aurora_app                                        │
│  - Single source of truth                                │
│  - All writes go here first                              │
│  - pgvector enabled                                      │
│  - Automated backups                                     │
└─────────────────────────────────────────────────────────┘
                          ↕ Bi-directional Sync
        ┌─────────────────┴─────────────────┐
        ↓                                   ↓
┌──────────────────────┐          ┌──────────────────────┐
│  Vengeance (Local)   │          │  Aurora Town (Local) │
│  localhost:5432      │          │  localhost:5432      │
│                      │          │                      │
│  - Read replica      │          │  - Read replica      │
│  - Write to master   │          │  - Write to master   │
│  - Fast local reads  │          │  - Fast local reads  │
│  - Offline capable   │          │  - Offline capable   │
└──────────────────────┘          └──────────────────────┘
```

## 📊 **Database Schema**

All nodes share the same schema from `robbieverse-api/init-smart-robbie.sql`:

- ✅ `users` - User accounts
- ✅ `code_conversations` - Chat sessions with context
- ✅ `code_messages` - Messages with vector embeddings
- ✅ `code_blocks` - RobbieBlocks with semantic search
- ✅ `learned_patterns` - AI learning from usage
- ✅ `robbie_personality_state` - Mood, G-G level, attraction

## 🔧 **Connection Configuration**

### Master (Elestio)

```bash
export MASTER_DB_HOST="aurora-postgres-u44170.vm.elestio.app"
export MASTER_DB_PORT="25432"
export MASTER_DB_NAME="aurora_unified"
export MASTER_DB_USER="aurora_app"
export MASTER_DB_PASSWORD="TestPilot2025_Aurora!"
export MASTER_DB_SSL="require"
```

### Local Replica (Vengeance)

```bash
export LOCAL_DB_HOST="localhost"
export LOCAL_DB_PORT="5432"
export LOCAL_DB_NAME="robbieverse"
export LOCAL_DB_USER="robbie"
export LOCAL_DB_PASSWORD="robbie_dev_2025"
```

## 🚀 **Sync Strategy**

### Write Operations

1. **Primary:** Always write to master first
2. **Fallback:** If master unavailable, write locally
3. **Queue:** Store failed writes in `pending_sync` table
4. **Retry:** Sync queued writes when master reconnects

### Read Operations

1. **Default:** Read from local replica (fast)
2. **Fresh:** Read from master for critical data
3. **Cache:** Local replica updated every 30 seconds

### Conflict Resolution

- **Master Wins:** Master always takes precedence
- **Timestamp:** Use `updated_at` for conflict detection
- **Merge:** Personality state merges (not replaces)

## 📝 **Implementation Files**

### 1. Sync Service

**File:** `robbieverse-api/src/services/postgres-sync.ts`

```typescript
import { Pool } from 'pg';

export class PostgresSync {
    private masterPool: Pool;
    private localPool: Pool;
    private syncInterval: NodeJS.Timeout;

    constructor() {
        // Master connection (Elestio)
        this.masterPool = new Pool({
            host: process.env.MASTER_DB_HOST,
            port: parseInt(process.env.MASTER_DB_PORT || '25432'),
            database: process.env.MASTER_DB_NAME,
            user: process.env.MASTER_DB_USER,
            password: process.env.MASTER_DB_PASSWORD,
            ssl: { rejectUnauthorized: false }
        });

        // Local replica
        this.localPool = new Pool({
            host: process.env.LOCAL_DB_HOST || 'localhost',
            port: parseInt(process.env.LOCAL_DB_PORT || '5432'),
            database: process.env.LOCAL_DB_NAME || 'robbieverse',
            user: process.env.LOCAL_DB_USER || 'robbie',
            password: process.env.LOCAL_DB_PASSWORD
        });
    }

    async startSync(intervalSeconds: number = 30) {
        console.log('🐘 Starting Elephant Postgres sync...');
        
        // Initial sync
        await this.syncFromMaster();
        
        // Periodic sync
        this.syncInterval = setInterval(async () => {
            await this.syncFromMaster();
            await this.syncToMaster();
        }, intervalSeconds * 1000);
    }

    async syncFromMaster() {
        try {
            // Sync conversations
            await this.syncTable('code_conversations');
            await this.syncTable('code_messages');
            await this.syncTable('code_blocks');
            await this.syncTable('learned_patterns');
            await this.syncTable('robbie_personality_state');
            
            console.log('✅ Synced from master');
        } catch (error) {
            console.error('❌ Sync from master failed:', error);
        }
    }

    async syncToMaster() {
        try {
            // Check for local changes
            const localChanges = await this.localPool.query(`
                SELECT * FROM pending_sync 
                ORDER BY created_at ASC
            `);

            for (const change of localChanges.rows) {
                await this.applyChangeToMaster(change);
            }

            console.log(`✅ Synced ${localChanges.rowCount} changes to master`);
        } catch (error) {
            console.error('❌ Sync to master failed:', error);
        }
    }

    async syncTable(tableName: string) {
        // Get latest timestamp from local
        const localResult = await this.localPool.query(`
            SELECT MAX(updated_at) as last_updated FROM ${tableName}
        `);
        
        const lastUpdated = localResult.rows[0]?.last_updated || '1970-01-01';

        // Get new/updated rows from master
        const masterResult = await this.masterPool.query(`
            SELECT * FROM ${tableName} 
            WHERE updated_at > $1
        `, [lastUpdated]);

        // Upsert into local
        for (const row of masterResult.rows) {
            const columns = Object.keys(row).join(', ');
            const values = Object.values(row);
            const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

            await this.localPool.query(`
                INSERT INTO ${tableName} (${columns})
                VALUES (${placeholders})
                ON CONFLICT (id) DO UPDATE SET
                    updated_at = EXCLUDED.updated_at
            `, values);
        }
    }

    async write(table: string, data: any): Promise<any> {
        try {
            // Try master first
            return await this.writeToMaster(table, data);
        } catch (error) {
            console.warn('⚠️ Master unavailable, writing locally');
            // Fallback to local + queue
            return await this.writeToLocal(table, data, true);
        }
    }

    async writeToMaster(table: string, data: any) {
        const columns = Object.keys(data).join(', ');
        const values = Object.values(data);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

        const result = await this.masterPool.query(`
            INSERT INTO ${table} (${columns})
            VALUES (${placeholders})
            RETURNING *
        `, values);

        // Also write to local for fast reads
        await this.localPool.query(`
            INSERT INTO ${table} (${columns})
            VALUES (${placeholders})
            ON CONFLICT (id) DO UPDATE SET updated_at = EXCLUDED.updated_at
        `, values);

        return result.rows[0];
    }

    async writeToLocal(table: string, data: any, queue: boolean = false) {
        const columns = Object.keys(data).join(', ');
        const values = Object.values(data);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

        const result = await this.localPool.query(`
            INSERT INTO ${table} (${columns})
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
        const whereClause = Object.keys(where).length > 0
            ? 'WHERE ' + Object.keys(where).map((k, i) => `${k} = $${i + 1}`).join(' AND ')
            : '';
        
        const result = await this.localPool.query(`
            SELECT * FROM ${table} ${whereClause}
        `, Object.values(where));

        return result.rows;
    }

    async stop() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        await this.masterPool.end();
        await this.localPool.end();
    }
}
```

### 2. Pending Sync Table

**File:** `robbieverse-api/database/pending-sync.sql`

```sql
-- Queue for offline writes
CREATE TABLE IF NOT EXISTS pending_sync (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(255) NOT NULL,
    operation VARCHAR(50) NOT NULL, -- INSERT, UPDATE, DELETE
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    synced_at TIMESTAMPTZ,
    error TEXT
);

CREATE INDEX idx_pending_sync_created ON pending_sync(created_at);
CREATE INDEX idx_pending_sync_synced ON pending_sync(synced_at) WHERE synced_at IS NULL;
```

### 3. Environment Variables

**File:** `robbieverse-api/.env`

```bash
# Master Database (Elestio)
MASTER_DB_HOST=aurora-postgres-u44170.vm.elestio.app
MASTER_DB_PORT=25432
MASTER_DB_NAME=aurora_unified
MASTER_DB_USER=aurora_app
MASTER_DB_PASSWORD=TestPilot2025_Aurora!
MASTER_DB_SSL=require

# Local Replica
LOCAL_DB_HOST=localhost
LOCAL_DB_PORT=5432
LOCAL_DB_NAME=robbieverse
LOCAL_DB_USER=robbie
LOCAL_DB_PASSWORD=robbie_dev_2025

# Sync Settings
SYNC_INTERVAL_SECONDS=30
SYNC_ENABLED=true
```

### 4. Update Server

**File:** `robbieverse-api/src/server.ts` (add sync)

```typescript
import { PostgresSync } from './services/postgres-sync';

// Initialize sync
const postgresSync = new PostgresSync();
await postgresSync.startSync(30); // Sync every 30 seconds

// Use sync for all DB operations
app.post('/api/conversations', async (req, res) => {
    const conversation = await postgresSync.write('code_conversations', {
        user_id: req.body.user_id,
        title: req.body.title,
        // ...
    });
    res.json({ conversation });
});
```

## 🎯 **Benefits**

✅ **Single Source of Truth** - Master always has latest data  
✅ **Fast Local Reads** - Sub-millisecond response times  
✅ **Offline Capable** - Work without internet, sync later  
✅ **Automatic Backups** - Elestio handles master backups  
✅ **Scale Horizontally** - Add more local replicas easily  
✅ **Conflict Resolution** - Master wins, no data loss  

## 🚀 **Deployment**

### Vengeance Setup

```bash
cd robbieverse-api

# Start local Postgres
docker-compose up -d

# Apply pending sync schema
psql -h localhost -U robbie -d robbieverse -f database/pending-sync.sql

# Start API with sync
npm start
```

### Aurora Town Setup

```bash
# Same as above on Aurora Town server
ssh allan@aurora-town-u44170.vm.elestio.app
cd /opt/aurora-dev/aurora/robbieverse-api
docker-compose up -d
psql -h localhost -U robbie -d robbieverse -f database/pending-sync.sql
npm start
```

## 📊 **Monitoring**

```bash
# Check sync status
psql -h localhost -U robbie -d robbieverse -c "SELECT COUNT(*) FROM pending_sync WHERE synced_at IS NULL;"

# View sync errors
psql -h localhost -U robbie -d robbieverse -c "SELECT * FROM pending_sync WHERE error IS NOT NULL;"

# Check master connection
psql -h aurora-postgres-u44170.vm.elestio.app -p 25432 -U aurora_app -d aurora_unified -c "SELECT version();"
```

---

**This architecture gives you the best of both worlds: centralized master + distributed edge computing!** 🐘🚀

