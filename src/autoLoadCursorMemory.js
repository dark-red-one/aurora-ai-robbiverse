/**
 * Auto-Load Cursor Memory System
 * Automatically starts when this file is imported/required
 */

import LiveCursorMemoryManager from './liveCursorMemoryManager.js';

// Global instance
let memoryManager = null;
let isAutoStarted = false;

// Auto-start function
async function autoStartMemorySystem() {
    if (isAutoStarted) {
        console.log('🧠 Robbie Memory System already auto-started');
        return memoryManager;
    }
    
    try {
        console.log('🚀 Auto-starting Robbie Memory System...');
        
        // Initialize memory manager
        memoryManager = new LiveCursorMemoryManager();
        await memoryManager.initialize();
        
        // Set up global event listeners
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
        
        isAutoStarted = true;
        console.log('✅ Robbie Memory System auto-started successfully!');
        console.log('📝 All our conversations will be automatically saved');
        console.log('🔍 You can search through our full chat history');
        console.log('💡 Opportunities will be automatically detected');
        
        // Make globally available
        global.robbieMemory = memoryManager;
        
        // Set up graceful shutdown
        process.on('SIGINT', async () => {
            console.log('\n🛑 Shutting down Robbie Memory System...');
            if (memoryManager) {
                await memoryManager.shutdown();
            }
            process.exit(0);
        });
        
        process.on('SIGTERM', async () => {
            console.log('\n🛑 Shutting down Robbie Memory System...');
            if (memoryManager) {
                await memoryManager.shutdown();
            }
            process.exit(0);
        });
        
        return memoryManager;
        
    } catch (error) {
        console.error('❌ Failed to auto-start Robbie Memory System:', error);
        throw error;
    }
}

// Auto-start immediately when this module is loaded
autoStartMemorySystem().catch(error => {
    console.error('❌ Auto-start failed:', error);
});

// Export for manual control
export { memoryManager, autoStartMemorySystem };

// Export convenience functions
export const remember = async (query) => {
    if (!memoryManager) {
        await autoStartMemorySystem();
    }
    return await memoryManager.remember(query);
};

export const rememberAll = async (query) => {
    if (!memoryManager) {
        await autoStartMemorySystem();
    }
    return await memoryManager.rememberAll(query);
};

export const whatDidWeTalkAbout = async (topic) => {
    if (!memoryManager) {
        await autoStartMemorySystem();
    }
    return await memoryManager.whatDidWeTalkAbout(topic);
};

export const showOpportunities = async () => {
    if (!memoryManager) {
        await autoStartMemorySystem();
    }
    return await memoryManager.showOpportunities();
};

export const showFollowUps = async () => {
    if (!memoryManager) {
        await autoStartMemorySystem();
    }
    return await memoryManager.showFollowUps();
};

export const showStats = async () => {
    if (!memoryManager) {
        await autoStartMemorySystem();
    }
    return await memoryManager.showStats();
};

export const saveUserMessage = async (message, context = {}) => {
    if (!memoryManager) {
        await autoStartMemorySystem();
    }
    return await memoryManager.saveUserMessage(message, context);
};

export const saveAssistantMessage = async (message, userMessageId = null, context = {}) => {
    if (!memoryManager) {
        await autoStartMemorySystem();
    }
    return await memoryManager.saveAssistantMessage(message, userMessageId, context);
};

export const saveCodeBlock = async (code, language, context = {}) => {
    if (!memoryManager) {
        await autoStartMemorySystem();
    }
    return await memoryManager.saveCodeBlock(code, language, context);
};

// Default export
export default {
    memoryManager,
    autoStartMemorySystem,
    remember,
    rememberAll,
    whatDidWeTalkAbout,
    showOpportunities,
    showFollowUps,
    showStats,
    saveUserMessage,
    saveAssistantMessage,
    saveCodeBlock
};
