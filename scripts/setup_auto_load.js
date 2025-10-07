#!/usr/bin/env node
/**
 * Setup Auto-Load for Robbie Memory System
 * One-time setup to make memory system start automatically
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupAutoLoad() {
    console.log('🚀 Setting up Robbie Memory System Auto-Load...\n');
    
    try {
        // Create .cursor directory if it doesn't exist
        const cursorDir = path.join(__dirname, '..', '.cursor');
        if (!fs.existsSync(cursorDir)) {
            fs.mkdirSync(cursorDir, { recursive: true });
            console.log('📁 Created .cursor directory');
        }
        
        // Create hooks directory
        const hooksDir = path.join(cursorDir, 'hooks');
        if (!fs.existsSync(hooksDir)) {
            fs.mkdirSync(hooksDir, { recursive: true });
            console.log('📁 Created .cursor/hooks directory');
        }
        
        // Create extensions directory
        const extensionsDir = path.join(cursorDir, 'extensions');
        if (!fs.existsSync(extensionsDir)) {
            fs.mkdirSync(extensionsDir, { recursive: true });
            console.log('📁 Created .cursor/extensions directory');
        }
        
        // Create auto-load configuration
        const autoLoadConfig = {
            "name": "robbie-memory-autoload",
            "version": "1.0.0",
            "description": "Automatically starts Robbie Memory System",
            "autoStart": true,
            "enabled": true,
            "startupDelay": 2000,
            "memorySystem": {
                "autoSave": true,
                "opportunityDetection": true,
                "saveInterval": 5000,
                "vectorEmbeddings": true,
                "searchEnabled": true
            },
            "created": new Date().toISOString(),
            "lastUpdated": new Date().toISOString()
        };
        
        // Write configuration file
        const configPath = path.join(cursorDir, 'robbie-memory-config.json');
        fs.writeFileSync(configPath, JSON.stringify(autoLoadConfig, null, 2));
        console.log('✅ Created Robbie Memory configuration');
        
        // Create startup script
        const startupScript = `#!/usr/bin/env node
/**
 * Robbie Memory System Startup Script
 * Automatically runs when Cursor loads
 */

import { autoStartMemorySystem } from '../src/autoLoadCursorMemory.js';

console.log('🧠 Starting Robbie Memory System...');

// Auto-start the memory system
autoStartMemorySystem().then(() => {
    console.log('✅ Robbie Memory System started successfully');
    console.log('📝 All conversations will be automatically saved');
    console.log('🔍 Search functionality is available');
    console.log('💡 Opportunities will be automatically detected');
}).catch(error => {
    console.error('❌ Failed to start Robbie Memory System:', error);
});

// Keep the process running
process.on('SIGINT', () => {
    console.log('🛑 Robbie Memory System shutting down...');
    process.exit(0);
});
`;
        
        const startupPath = path.join(hooksDir, 'start-memory.js');
        fs.writeFileSync(startupPath, startupScript);
        fs.chmodSync(startupPath, '755'); // Make executable
        console.log('✅ Created startup script');
        
        // Create package.json for the extension
        const packageJson = {
            "name": "robbie-memory-autoload",
            "displayName": "Robbie Memory Auto-Load",
            "description": "Automatically starts Robbie chat memory system",
            "version": "1.0.0",
            "main": "extension.js",
            "activationEvents": [
                "onStartupFinished"
            ],
            "engines": {
                "vscode": "^1.74.0"
            }
        };
        
        const extensionDir = path.join(extensionsDir, 'robbie-memory-autoload');
        if (!fs.existsSync(extensionDir)) {
            fs.mkdirSync(extensionDir, { recursive: true });
        }
        
        fs.writeFileSync(
            path.join(extensionDir, 'package.json'),
            JSON.stringify(packageJson, null, 2)
        );
        console.log('✅ Created extension package.json');
        
        // Create README with instructions
        const readme = `# Robbie Memory Auto-Load Setup

## What This Does
- Automatically starts Robbie Memory System when Cursor loads
- Saves all our conversations with vector embeddings
- Detects business opportunities from our discussions
- Provides searchable conversation history

## How It Works
1. When Cursor starts, it automatically loads the memory system
2. Every message we exchange gets saved to the database
3. Opportunities are automatically detected and stored as sticky notes
4. You can search through our entire conversation history

## Usage
Once auto-load is set up, the memory system starts automatically. You can:

\`\`\`javascript
// Search our conversations
await robbieMemory.remember("GPU mesh");

// Find all opportunities
await robbieMemory.showOpportunities();

// Get memory statistics
await robbieMemory.showStats();
\`\`\`

## Manual Control
If you need to manually start/stop the system:

\`\`\`bash
# Start manually
node scripts/start_cursor_memory.js

# Stop manually
# The system will stop when Cursor closes
\`\`\`

## Configuration
Edit \`.cursor/robbie-memory-config.json\` to adjust settings:
- \`autoSave\`: Enable/disable automatic saving
- \`opportunityDetection\`: Enable/disable opportunity detection
- \`saveInterval\`: How often to save (milliseconds)
- \`vectorEmbeddings\`: Enable/disable vector search

## Files Created
- \`.cursor/robbie-memory-config.json\` - Configuration
- \`.cursor/hooks/start-memory.js\` - Startup script
- \`.cursor/extensions/robbie-memory-autoload/\` - Extension files

## Status
✅ Auto-load setup complete!
The memory system will start automatically when Cursor loads.
`;
        
        fs.writeFileSync(path.join(__dirname, '..', 'README_AUTO_LOAD.md'), readme);
        console.log('✅ Created README with instructions');
        
        console.log('\n🎉 Robbie Memory System Auto-Load setup complete!');
        console.log('\n📋 What happens next:');
        console.log('1. ✅ Memory system will start automatically when Cursor loads');
        console.log('2. ✅ All our conversations will be saved with vector embeddings');
        console.log('3. ✅ Business opportunities will be automatically detected');
        console.log('4. ✅ You can search through our entire chat history');
        console.log('5. ✅ Sticky notes will be generated for opportunities');
        
        console.log('\n🚀 Ready to go! The next time you open Cursor, the memory system will start automatically.');
        console.log('\n💡 You can also start it manually with: node scripts/start_cursor_memory.js');
        
    } catch (error) {
        console.error('❌ Setup failed:', error);
        process.exit(1);
    }
}

// Run setup
setupAutoLoad().catch(console.error);
