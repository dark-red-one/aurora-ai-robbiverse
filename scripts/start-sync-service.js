#!/usr/bin/env node

const { SupabaseSyncService, defaultSyncConfig } = require('../packages/@robbieverse/api/src/services/supabase-sync.ts');
require('dotenv').config();

async function startSyncService() {
    console.log('🚀 Starting TestPilot CPG Sync Service...');
    console.log('📊 Syncing with Supabase:', defaultSyncConfig.supabaseUrl);
    console.log('🗄️  Local database:', defaultSyncConfig.localDbUrl.replace(/\/\/.*@/, '//***:***@'));
    console.log('⏰ Sync interval:', defaultSyncConfig.syncInterval / 1000, 'seconds');
    console.log('📋 Tables to sync:', defaultSyncConfig.tables.join(', '));

    const syncService = new SupabaseSyncService(defaultSyncConfig);

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down sync service...');
        await syncService.stop();
        process.exit(0);
    });

    process.on('SIGTERM', async () => {
        console.log('\n🛑 Shutting down sync service...');
        await syncService.stop();
        process.exit(0);
    });

    try {
        await syncService.start();

        // Log sync status every 5 minutes
        setInterval(async () => {
            try {
                const status = await syncService.getSyncStatus();
                console.log('📊 Sync Status:', status);
            } catch (error) {
                console.error('❌ Error getting sync status:', error);
            }
        }, 5 * 60 * 1000);

    } catch (error) {
        console.error('❌ Failed to start sync service:', error);
        process.exit(1);
    }
}

// Start the service
startSyncService().catch(console.error);
