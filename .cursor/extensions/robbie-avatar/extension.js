const vscode = require('vscode');
const http = require('http');
const fs = require('fs');
const path = require('path');

let currentMood = 0;
const moods = [
    { image: 'robbie-thoughtful-1.png', text: 'Thoughtful', status: 'Analyzing...', emoji: '🤔' },
    { image: 'robbie-happy-1.png', text: 'Happy', status: 'Love this!', emoji: '😊' },
    { image: 'robbie-content-1.png', text: 'Content', status: 'Feeling good!', emoji: '😌' },
    { image: 'robbie-surprised-1.png', text: 'Surprised', status: 'Whoa!', emoji: '😮' },
    { image: 'robbie-loving-1.png', text: 'Loving', status: 'You\'re amazing!', emoji: '💕' },
    { image: 'robbie-thoughtful-2.png', text: 'Strategic', status: 'Planning ahead', emoji: '🎯' },
    { image: 'robbie-happy-2.png', text: 'Excited', status: 'Let\'s ship it!', emoji: '🚀' },
    { image: 'robbie-content-2.png', text: 'Focused', status: 'On it!', emoji: '🤖' },
    { image: 'robbie-surprised-2.png', text: 'Alert', status: 'Watching!', emoji: '👁️' },
    { image: 'robbie-loving-2.png', text: 'Playful', status: 'Having fun!', emoji: '🎉' }
];

class RobbieAvatarProvider {
    constructor(context) {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.context = context;
        
        // Load saved mood
        currentMood = context.globalState.get('robbieMood', 0);
    }

    refresh() {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element) {
        return element;
    }

    getChildren(element) {
        if (!element) {
            const mood = moods[currentMood];
            
            return [
                new RobbieItem(`${mood.emoji} ${mood.text}`, mood.status, 'mood'),
                new RobbieItem('Click to change mood', '', 'action'),
                new RobbieItem('---', '', 'separator'),
                new RobbieItem('💬 Active Session', new Date().toLocaleTimeString(), 'session'),
                new RobbieItem('🧠 Memory Active', 'ChromaDB synced', 'memory')
            ];
        }
        return [];
    }
}

class RobbieMemoryProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.recentSearches = [];
    }

    refresh() {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element) {
        return element;
    }

    getChildren(element) {
        return [
            new RobbieItem('🔍 Search Conversation History', 'Click to search', 'search'),
            new RobbieItem('💾 Save Current Chat', 'Store this conversation', 'save'),
            new RobbieItem('---', '', 'separator'),
            new RobbieItem('📊 Recent Topics', '', 'header'),
            new RobbieItem('  • PepsiCo deal strategy', '2 hours ago', 'topic'),
            new RobbieItem('  • Database replication', '1 hour ago', 'topic'),
            new RobbieItem('  • Avatar app build', 'Just now', 'topic')
        ];
    }
}

class RobbieItem extends vscode.TreeItem {
    constructor(label, description, type) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.description = description;
        this.type = type;
        
        if (type === 'mood' || type === 'action') {
            this.command = {
                command: 'robbie.changeMood',
                title: 'Change Mood'
            };
        } else if (type === 'search') {
            this.command = {
                command: 'robbie.searchMemory',
                title: 'Search Memory'
            };
        } else if (type === 'save') {
            this.command = {
                command: 'robbie.saveConversation',
                title: 'Save Conversation'
            };
        }
    }
}

function activate(context) {
    console.log('🤖 Robbie Avatar extension activated!');

    // Avatar View Provider
    const avatarProvider = new RobbieAvatarProvider(context);
    vscode.window.registerTreeDataProvider('robbie-avatar-view', avatarProvider);

    // Memory View Provider
    const memoryProvider = new RobbieMemoryProvider();
    vscode.window.registerTreeDataProvider('robbie-memory-view', memoryProvider);

    // Change Mood Command
    context.subscriptions.push(
        vscode.commands.registerCommand('robbie.changeMood', () => {
            currentMood = (currentMood + 1) % moods.length;
            const mood = moods[currentMood];
            
            // Save mood
            context.globalState.update('robbieMood', currentMood);
            
            // Refresh view
            avatarProvider.refresh();
            
            // Show notification
            vscode.window.showInformationMessage(`Robbie is now ${mood.emoji} ${mood.text}: "${mood.status}"`);
            
            // Update backend
            updateBackendMood(mood.text);
        })
    );

    // Search Memory Command
    context.subscriptions.push(
        vscode.commands.registerCommand('robbie.searchMemory', async () => {
            const query = await vscode.window.showInputBox({
                prompt: 'Search conversation history',
                placeHolder: 'What did we discuss about...?'
            });
            
            if (query) {
                // Call memory search
                searchConversationMemory(query);
            }
        })
    );

    // Save Conversation Command
    context.subscriptions.push(
        vscode.commands.registerCommand('robbie.saveConversation', () => {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                const selection = editor.selection;
                const text = editor.document.getText(selection);
                
                if (text) {
                    saveToMemory('allan', text);
                    vscode.window.showInformationMessage('💾 Conversation saved to memory!');
                }
            }
        })
    );

    // Auto-refresh every 30 seconds
    setInterval(() => {
        avatarProvider.refresh();
    }, 30000);
}

function updateBackendMood(mood) {
    const data = JSON.stringify({ mood: mood });
    const options = {
        hostname: 'localhost',
        port: 9000,
        path: '/api/mood',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    const req = http.request(options, (res) => {});
    req.on('error', (e) => {});
    req.write(data);
    req.end();
}

function searchConversationMemory(query) {
    // Call Python memory system
    const { exec } = require('child_process');
    exec(`cd /Users/allanperetz/aurora-ai-robbiverse && python3 deployment/chat-memory-system.py search "${query}"`, 
        (error, stdout, stderr) => {
            if (error) {
                vscode.window.showErrorMessage(`Memory search failed: ${error.message}`);
                return;
            }
            
            // Show results in output channel
            const outputChannel = vscode.window.createOutputChannel('Robbie Memory Search');
            outputChannel.clear();
            outputChannel.appendLine(stdout);
            outputChannel.show();
        }
    );
}

function saveToMemory(speaker, message) {
    const { exec } = require('child_process');
    exec(`cd /Users/allanperetz/aurora-ai-robbiverse && python3 deployment/chat-memory-system.py save "${speaker}" "${message}"`,
        (error, stdout, stderr) => {
            if (error) {
                console.error(`Save failed: ${error.message}`);
            }
        }
    );
}

function deactivate() {
    console.log('👋 Robbie Avatar extension deactivated');
}

module.exports = {
    activate,
    deactivate
};

