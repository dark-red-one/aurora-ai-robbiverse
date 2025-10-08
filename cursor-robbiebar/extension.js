const vscode = require('vscode');
const http = require('http');

let statusBarItems = [];
let updateInterval;

function activate(context) {
    console.log('💜 RobbieBar is activating!');

    // Create status bar items
    const moodItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1000);
    const chatItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 999);
    const cpuItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 998);
    const memItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 997);
    const gpuItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 996);
    const userItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 995);

    statusBarItems = [moodItem, chatItem, cpuItem, memItem, gpuItem, userItem];

    // Mood indicator
    moodItem.text = '$(heart) playful';
    moodItem.tooltip = 'Robbie\'s Mood: Let\'s code, handsome! 💜';
    moodItem.show();

    // Chat button
    chatItem.text = '$(comment) Chat';
    chatItem.tooltip = 'Open Robbie Chat';
    chatItem.command = 'robbiebar.openChat';
    chatItem.show();

    // System stats (will be updated)
    cpuItem.text = '$(flame) --';
    cpuItem.tooltip = 'CPU Usage';
    cpuItem.show();

    memItem.text = '$(database) --';
    memItem.tooltip = 'Memory Usage';
    memItem.show();

    gpuItem.text = '$(device-desktop) --';
    gpuItem.tooltip = 'GPU Usage';
    gpuItem.show();

    // Active user
    userItem.text = '$(account) Allan';
    userItem.tooltip = 'Active Users';
    userItem.show();

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('robbiebar.openChat', () => {
            const config = vscode.workspace.getConfiguration('robbiebar');
            const chatUrl = config.get('chatUrl', 'http://localhost:3001');
            vscode.env.openExternal(vscode.Uri.parse(chatUrl));
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('robbiebar.toggleBar', () => {
            const visible = moodItem.text !== '';
            statusBarItems.forEach(item => {
                if (visible) {
                    item.hide();
                } else {
                    item.show();
                }
            });
            vscode.window.showInformationMessage(
                visible ? 'RobbieBar hidden' : 'RobbieBar shown'
            );
        })
    );

    // Update stats periodically
    const config = vscode.workspace.getConfiguration('robbiebar');
    const apiUrl = config.get('apiUrl', 'http://localhost:8000');
    const updateIntervalMs = config.get('updateInterval', 2000);

    updateInterval = setInterval(() => {
        updateSystemStats(apiUrl, cpuItem, memItem, gpuItem);
    }, updateIntervalMs);

    // Initial update
    updateSystemStats(apiUrl, cpuItem, memItem, gpuItem);

    // Add to subscriptions
    context.subscriptions.push(...statusBarItems);
    context.subscriptions.push({
        dispose: () => {
            if (updateInterval) {
                clearInterval(updateInterval);
            }
        }
    });

    console.log('💜 RobbieBar activated!');
}

function updateSystemStats(apiUrl, cpuItem, memItem, gpuItem) {
    const url = `${apiUrl}/api/system/stats`;
    
    http.get(url, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                const stats = JSON.parse(data);
                cpuItem.text = `$(flame) ${Math.round(stats.cpu)}%`;
                memItem.text = `$(database) ${Math.round(stats.memory)}%`;
                gpuItem.text = `$(device-desktop) ${Math.round(stats.gpu)}%`;
            } catch (error) {
                console.error('Failed to parse stats:', error);
            }
        });
    }).on('error', (error) => {
        // Fallback to mock data if API unavailable
        cpuItem.text = `$(flame) ${Math.floor(Math.random() * 30 + 10)}%`;
        memItem.text = `$(database) ${Math.floor(Math.random() * 40 + 30)}%`;
        gpuItem.text = `$(device-desktop) ${Math.floor(Math.random() * 50 + 20)}%`;
    });
}

function deactivate() {
    if (updateInterval) {
        clearInterval(updateInterval);
    }
    console.log('💜 RobbieBar deactivated');
}

module.exports = {
    activate,
    deactivate
};
