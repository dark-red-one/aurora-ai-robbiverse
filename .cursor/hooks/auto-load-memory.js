#!/usr/bin/env node
/**
 * Cursor Auto-Load Memory Hook
 * Automatically starts Robbie Memory System when Cursor loads
 */

// This hook runs automatically when Cursor starts
console.log('🧠 Cursor Auto-Load Memory Hook starting...');

// Import the auto-load system
import('../src/autoLoadCursorMemory.js').then(async (memorySystem) => {
    console.log('✅ Robbie Memory System auto-loaded via Cursor hook');
    
    // The system is now running automatically
    // All conversations will be saved
    // Opportunities will be detected
    // Search is available
    
}).catch(error => {
    console.error('❌ Failed to auto-load Robbie Memory System:', error);
});

// Keep the hook running
process.on('SIGINT', () => {
    console.log('🛑 Cursor Auto-Load Memory Hook shutting down...');
    process.exit(0);
});

console.log('🎯 Cursor Auto-Load Memory Hook active - Robbie Memory System will start automatically');
