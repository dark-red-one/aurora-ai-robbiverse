/**
 * Robbie Memory Auto-Load Extension
 * Automatically starts Cursor chat memory system when Cursor loads
 */

const vscode = require('vscode');
const path = require('path');
const { spawn } = require('child_process');

let memoryProcess = null;
let memoryManager = null;

function activate(context) {
    console.log('🧠 Robbie Memory Auto-Load Extension activated');
    
    // Start memory system automatically
    startMemorySystem();
    
    // Register commands
    const startMemoryCommand = vscode.commands.registerCommand('robbie-memory.start', () => {
        startMemorySystem();
    });
    
    const stopMemoryCommand = vscode.commands.registerCommand('robbie-memory.stop', () => {
        stopMemorySystem();
    });
    
    const searchMemoryCommand = vscode.commands.registerCommand('robbie-memory.search', async () => {
        await searchMemory();
    });
    
    const showOpportunitiesCommand = vscode.commands.registerCommand('robbie-memory.opportunities', async () => {
        await showOpportunities();
    });
    
    const showStatsCommand = vscode.commands.registerCommand('robbie-memory.stats', async () => {
        await showStats();
    });
    
    // Register all commands
    context.subscriptions.push(
        startMemoryCommand,
        stopMemoryCommand,
        searchMemoryCommand,
        showOpportunitiesCommand,
        showStatsCommand
    );
    
    // Show status in status bar
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = "$(database) Robbie Memory";
    statusBarItem.tooltip = "Robbie Chat Memory System";
    statusBarItem.command = 'robbie-memory.stats';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);
    
    // Auto-start when extension loads
    setTimeout(() => {
        startMemorySystem();
    }, 2000); // Wait 2 seconds for Cursor to fully load
}

function deactivate() {
    console.log('🛑 Robbie Memory Auto-Load Extension deactivated');
    stopMemorySystem();
}

async function startMemorySystem() {
    try {
        if (memoryProcess) {
            console.log('📝 Robbie Memory System already running');
            return;
        }
        
        console.log('🚀 Starting Robbie Memory System...');
        
        // Get workspace path
        const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri?.fsPath;
        if (!workspacePath) {
            vscode.window.showErrorMessage('No workspace found for Robbie Memory System');
            return;
        }
        
        // Path to memory system script
        const memoryScriptPath = path.join(workspacePath, 'scripts', 'start_cursor_memory.js');
        
        // Start the memory system process
        memoryProcess = spawn('node', [memoryScriptPath], {
            cwd: workspacePath,
            stdio: ['pipe', 'pipe', 'pipe'],
            detached: false
        });
        
        // Handle process output
        memoryProcess.stdout.on('data', (data) => {
            const output = data.toString();
            console.log(`[Robbie Memory] ${output}`);
            
            // Show important messages in Cursor
            if (output.includes('✅ Cursor Memory System started')) {
                vscode.window.showInformationMessage('🧠 Robbie Memory System started successfully!');
            }
            
            if (output.includes('🎯 OPPORTUNITY DETECTED')) {
                vscode.window.showWarningMessage('🎯 Business opportunity detected in chat!');
            }
        });
        
        memoryProcess.stderr.on('data', (data) => {
            console.error(`[Robbie Memory Error] ${data.toString()}`);
        });
        
        memoryProcess.on('close', (code) => {
            console.log(`[Robbie Memory] Process exited with code ${code}`);
            memoryProcess = null;
            
            if (code !== 0) {
                vscode.window.showErrorMessage(`Robbie Memory System stopped unexpectedly (code: ${code})`);
            }
        });
        
        memoryProcess.on('error', (error) => {
            console.error(`[Robbie Memory] Process error: ${error}`);
            vscode.window.showErrorMessage(`Robbie Memory System error: ${error.message}`);
            memoryProcess = null;
        });
        
        console.log('✅ Robbie Memory System process started');
        
        // Update status bar
        updateStatusBar('running');
        
    } catch (error) {
        console.error('❌ Error starting Robbie Memory System:', error);
        vscode.window.showErrorMessage(`Failed to start Robbie Memory System: ${error.message}`);
    }
}

function stopMemorySystem() {
    if (memoryProcess) {
        console.log('🛑 Stopping Robbie Memory System...');
        memoryProcess.kill();
        memoryProcess = null;
        
        updateStatusBar('stopped');
        vscode.window.showInformationMessage('🛑 Robbie Memory System stopped');
    }
}

async function searchMemory() {
    try {
        const query = await vscode.window.showInputBox({
            prompt: 'Search our conversation history',
            placeHolder: 'Enter search query...'
        });
        
        if (!query) return;
        
        // Send search command to memory process
        if (memoryProcess && memoryProcess.stdin) {
            memoryProcess.stdin.write(`search:${query}\n`);
        }
        
        vscode.window.showInformationMessage(`🔍 Searching for: "${query}"`);
        
    } catch (error) {
        vscode.window.showErrorMessage(`Search error: ${error.message}`);
    }
}

async function showOpportunities() {
    try {
        // Send opportunities command to memory process
        if (memoryProcess && memoryProcess.stdin) {
            memoryProcess.stdin.write('opportunities\n');
        }
        
        vscode.window.showInformationMessage('🎯 Fetching active opportunities...');
        
    } catch (error) {
        vscode.window.showErrorMessage(`Opportunities error: ${error.message}`);
    }
}

async function showStats() {
    try {
        // Send stats command to memory process
        if (memoryProcess && memoryProcess.stdin) {
            memoryProcess.stdin.write('stats\n');
        }
        
        vscode.window.showInformationMessage('📊 Fetching memory statistics...');
        
    } catch (error) {
        vscode.window.showErrorMessage(`Stats error: ${error.message}`);
    }
}

function updateStatusBar(status) {
    // Update status bar based on memory system status
    // This would be implemented with the status bar item
    console.log(`📊 Memory system status: ${status}`);
}

module.exports = {
    activate,
    deactivate
};
