#!/usr/bin/env node
/**
 * Start Cursor Memory System
 * Simple script to start saving our Cursor chat conversations
 */

import LiveCursorMemoryManager from '../src/liveCursorMemoryManager.js';

// Global instance for easy access
let memoryManager = null;

async function startCursorMemory() {
    console.log('🧠 Starting Cursor Memory System...\n');
    
    try {
        // Initialize the memory manager
        memoryManager = new LiveCursorMemoryManager();
        await memoryManager.initialize();
        
        console.log('✅ Cursor Memory System started successfully!\n');
        
        // Set up event listeners
        memoryManager.on('opportunityDetected', (data) => {
            console.log(`\n🎯 OPPORTUNITY DETECTED IN OUR CHAT!`);
            console.log(`Stickies generated: ${data.stickyCount}`);
            
            for (const sticky of data.stickies) {
                console.log(`\n📝 STICKY NOTE:`);
                console.log(`Category: ${sticky.category}`);
                console.log(`Importance: ${sticky.importanceScore.toFixed(2)}`);
                console.log(`Urgency: ${sticky.urgencyScore.toFixed(2)}`);
                console.log(`Content: ${sticky.content}`);
                console.log(`Follow-up: ${sticky.followUpDate.toDateString()}`);
            }
            console.log('\n' + '='.repeat(60) + '\n');
        });
        
        console.log('🎯 Cursor Memory System is now active!');
        console.log('📝 All our conversations will be automatically saved');
        console.log('🔍 You can search through our full chat history');
        console.log('💡 Opportunities will be automatically detected');
        console.log('\n💻 Available commands:');
        console.log('  memoryManager.remember("query") - Search our conversations');
        console.log('  memoryManager.rememberAll("query") - Search all history');
        console.log('  memoryManager.showOpportunities() - Show active opportunities');
        console.log('  memoryManager.showFollowUps() - Show follow-up opportunities');
        console.log('  memoryManager.showStats() - Show memory statistics');
        console.log('\n🚀 Ready to start our conversation!\n');
        
        // Keep the process running
        process.on('SIGINT', async () => {
            console.log('\n🛑 Shutting down Cursor Memory System...');
            if (memoryManager) {
                await memoryManager.shutdown();
            }
            process.exit(0);
        });
        
        // Show stats every 10 minutes
        setInterval(async () => {
            if (memoryManager) {
                const stats = await memoryManager.showStats();
                console.log(`\n📊 Memory Stats: ${stats.totalMessages} messages, ${stats.totalSessions} sessions`);
            }
        }, 600000); // Every 10 minutes
        
        // Make memoryManager globally available
        global.memoryManager = memoryManager;
        
    } catch (error) {
        console.error('❌ Failed to start Cursor Memory System:', error);
        process.exit(1);
    }
}

// Export for use in other scripts
export { memoryManager };

// Start the system
startCursorMemory().catch(console.error);
