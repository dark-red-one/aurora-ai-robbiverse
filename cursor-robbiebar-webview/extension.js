const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

let robbiebarPanel;

function activate(context) {
    console.log('💜 RobbieBar Webview is activating!');

    // Register command to open panel
    context.subscriptions.push(
        vscode.commands.registerCommand('robbiebar.openPanel', () => {
            createOrShowPanel(context);
        })
    );

    // Register refresh command
    context.subscriptions.push(
        vscode.commands.registerCommand('robbiebar.refresh', () => {
            if (robbiebarPanel) {
                robbiebarPanel.dispose();
                robbiebarPanel = null;
            }
            createOrShowPanel(context);
        })
    );

    // Register webview view provider for sidebar
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('robbiebar.mainView', {
            resolveWebviewView: (webviewView) => {
                webviewView.webview.options = {
                    enableScripts: true,
                    localResourceRoots: [
                        vscode.Uri.file(path.join(context.extensionPath, 'webview')),
                        vscode.Uri.file(path.join(context.extensionPath, 'avatars'))
                    ]
                };

                webviewView.webview.html = getWebviewContent(context, webviewView.webview);

                // Handle messages from webview
                webviewView.webview.onDidReceiveMessage(
                    message => handleWebviewMessage(message),
                    undefined,
                    context.subscriptions
                );

                console.log('💜 RobbieBar webview loaded in sidebar!');
            }
        })
    );

    // Auto-open on startup if configured
    const config = vscode.workspace.getConfiguration('robbiebar');
    if (config.get('autoStart', true)) {
        // Give Cursor a moment to fully load
        setTimeout(() => {
            vscode.commands.executeCommand('robbiebar.openPanel');
        }, 2000);
    }

    console.log('💜 RobbieBar Webview activated!');
}

function createOrShowPanel(context) {
    const column = vscode.ViewColumn.Two;

    if (robbiebarPanel) {
        robbiebarPanel.reveal(column);
        return;
    }

    robbiebarPanel = vscode.window.createWebviewPanel(
        'robbiebarPanel',
        '💜 RobbieBar Command Center',
        column,
        {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [
                vscode.Uri.file(path.join(context.extensionPath, 'webview')),
                vscode.Uri.file(path.join(context.extensionPath, 'avatars'))
            ]
        }
    );

    robbiebarPanel.webview.html = getWebviewContent(context, robbiebarPanel.webview);

    // Handle messages from webview
    robbiebarPanel.webview.onDidReceiveMessage(
        message => handleWebviewMessage(message),
        undefined,
        context.subscriptions
    );

    robbiebarPanel.onDidDispose(
        () => {
            robbiebarPanel = null;
        },
        null,
        context.subscriptions
    );
}

function getWebviewContent(context, webview) {
    // Read the HTML, CSS, and JS from webview directory
    const htmlPath = path.join(context.extensionPath, 'webview', 'index.html');
    const cssPath = path.join(context.extensionPath, 'webview', 'style.css');
    const jsPath = path.join(context.extensionPath, 'webview', 'app.js');

    let html = fs.readFileSync(htmlPath, 'utf8');
    const css = fs.readFileSync(cssPath, 'utf8');
    const js = fs.readFileSync(jsPath, 'utf8');

    // Get configuration
    const config = vscode.workspace.getConfiguration('robbiebar');
    const apiUrl = config.get('apiUrl', 'http://localhost:8000');

    // Generate webview URIs for avatars
    const avatarsDir = path.join(context.extensionPath, 'avatars');
    const avatarUris = {
        friendly: webview.asWebviewUri(vscode.Uri.file(path.join(avatarsDir, 'robbie-friendly.png'))).toString(),
        focused: webview.asWebviewUri(vscode.Uri.file(path.join(avatarsDir, 'robbie-focused.png'))).toString(),
        playful: webview.asWebviewUri(vscode.Uri.file(path.join(avatarsDir, 'robbie-playful.png'))).toString(),
        bossy: webview.asWebviewUri(vscode.Uri.file(path.join(avatarsDir, 'robbie-bossy.png'))).toString(),
        surprised: webview.asWebviewUri(vscode.Uri.file(path.join(avatarsDir, 'robbie-surprised.png'))).toString(),
        blushing: webview.asWebviewUri(vscode.Uri.file(path.join(avatarsDir, 'robbie-blushing.png'))).toString()
    };

    // Inject configuration and inline CSS/JS
    html = html.replace('</head>', `
        <style>${css}</style>
        <script>
            // Configuration from extension settings
            window.ROBBIE_CONFIG = {
                apiUrl: '${apiUrl}',
                vscodeApi: acquireVsCodeApi(),
                avatarUris: ${JSON.stringify(avatarUris)}
            };
        </script>
        </head>
    `);

    html = html.replace('</body>', `
        <script>${js}</script>
        </body>
    `);

    return html;
}

function handleWebviewMessage(message) {
    switch (message.command) {
        case 'openExternal':
            vscode.env.openExternal(vscode.Uri.parse(message.url));
            break;
        
        case 'showInfo':
            vscode.window.showInformationMessage(message.text);
            break;
        
        case 'showError':
            vscode.window.showErrorMessage(message.text);
            break;
        
        case 'executeGitCommit':
            // Execute git command via terminal
            const terminal = vscode.window.createTerminal('RobbieBar Git');
            terminal.sendText('git add -A && git commit -m "' + message.commitMessage + '" && git push');
            terminal.show();
            vscode.window.showInformationMessage('🚀 Executing git commit...');
            break;

        case 'log':
            console.log('[RobbieBar]', message.text);
            break;
    }
}

function deactivate() {
    if (robbiebarPanel) {
        robbiebarPanel.dispose();
    }
    console.log('💜 RobbieBar Webview deactivated');
}

module.exports = {
    activate,
    deactivate
};


