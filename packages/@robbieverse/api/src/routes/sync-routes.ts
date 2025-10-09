import { Router } from 'express';
import { SupabaseSyncService, defaultSyncConfig } from '../services/supabase-sync';

const router = Router();
let syncService: SupabaseSyncService | null = null;

// Initialize sync service
async function getSyncService(): Promise<SupabaseSyncService> {
    if (!syncService) {
        syncService = new SupabaseSyncService(defaultSyncConfig);
    }
    return syncService;
}

// Start sync service
router.post('/start', async (req, res) => {
    try {
        const service = await getSyncService();
        await service.start();

        res.json({
            success: true,
            message: 'Sync service started successfully',
            config: {
                supabaseUrl: defaultSyncConfig.supabaseUrl,
                syncInterval: defaultSyncConfig.syncInterval,
                tables: defaultSyncConfig.tables
            }
        });
    } catch (error) {
        console.error('Error starting sync service:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to start sync service',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Stop sync service
router.post('/stop', async (req, res) => {
    try {
        if (syncService) {
            await syncService.stop();
            syncService = null;
        }

        res.json({
            success: true,
            message: 'Sync service stopped successfully'
        });
    } catch (error) {
        console.error('Error stopping sync service:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to stop sync service',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Get sync status
router.get('/status', async (req, res) => {
    try {
        if (!syncService) {
            return res.json({
                success: true,
                running: false,
                message: 'Sync service is not running'
            });
        }

        const status = await syncService.getSyncStatus();

        res.json({
            success: true,
            running: true,
            status: status,
            config: {
                supabaseUrl: defaultSyncConfig.supabaseUrl,
                syncInterval: defaultSyncConfig.syncInterval,
                tables: defaultSyncConfig.tables
            }
        });
    } catch (error) {
        console.error('Error getting sync status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get sync status',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Sync specific table
router.post('/sync-table/:tableName', async (req, res) => {
    try {
        const { tableName } = req.params;

        if (!defaultSyncConfig.tables.includes(tableName)) {
            return res.status(400).json({
                success: false,
                message: `Table '${tableName}' is not in sync configuration`,
                availableTables: defaultSyncConfig.tables
            });
        }

        const service = await getSyncService();
        await service.syncTable(tableName);

        res.json({
            success: true,
            message: `Table '${tableName}' synced successfully`
        });
    } catch (error) {
        console.error(`Error syncing table ${req.params.tableName}:`, error);
        res.status(500).json({
            success: false,
            message: `Failed to sync table '${req.params.tableName}'`,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Get sync configuration
router.get('/config', (req, res) => {
    res.json({
        success: true,
        config: {
            supabaseUrl: defaultSyncConfig.supabaseUrl,
            localDbUrl: defaultSyncConfig.localDbUrl.replace(/\/\/.*@/, '//***:***@'),
            syncInterval: defaultSyncConfig.syncInterval,
            tables: defaultSyncConfig.tables
        }
    });
});

export default router;
