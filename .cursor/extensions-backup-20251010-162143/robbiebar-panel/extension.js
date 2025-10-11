const vscode = require('vscode');

/**
 * RobbieBar Cursor Extension
 * Embeds the robbiebar web app (http://localhost:8000/code) in Cursor sidebar
 */

let robbiebarPanel;

function activate(context) {
    console.log('🎯 RobbieBar extension is activating...');

    // Register webview provider
    const provider = new RobbieBarViewProvider(context.extensionUri);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            'robbiebar.panel',
            provider,
            {
                webviewOptions: {
                    retainContextWhenHidden: true
                }
            }
        )
    );

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('robbiebar.show', () => {
            vscode.commands.executeCommand('robbiebar.panel.focus');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('robbiebar.refresh', () => {
            if (provider.view) {
                provider.view.webview.postMessage({ command: 'refresh' });
            }
        })
    );

    console.log('✅ RobbieBar extension activated!');
}

class RobbieBarViewProvider {
    constructor(extensionUri) {
        this._extensionUri = extensionUri;
        this.view = null;
    }

    resolveWebviewView(webviewView, context, _token) {
        this.view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'alert':
                    vscode.window.showInformationMessage(message.text);
                    break;
            }
        });
    }

    _getHtmlForWebview(webview) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RobbieBar</title>
    <style>
        body, html {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            background: #1e1e1e;
        }
        iframe {
            width: 100%;
            height: 100%;
            border: none;
        }
        .loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #cccccc;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            text-align: center;
        }
        .error {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #f48771;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            text-align: center;
            padding: 20px;
        }
        .error a {
            color: #007acc;
            text-decoration: none;
        }
        .error a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="loading" id="loading">
        <div style="font-size: 24px; margin-bottom: 10px;">🎯</div>
        <div>Loading RobbieBar...</div>
    </div>
    <div class="error" id="error" style="display: none;">
        <div style="font-size: 24px; margin-bottom: 10px;">⚠️</div>
        <div>RobbieBar server not running</div>
        <div style="margin-top: 10px; font-size: 12px; color: #858585;">
            Start server: <code>./start-robbiebar.sh</code>
        </div>
    </div>
    <iframe id="robbiebar-frame" src="http://localhost:8000/code" style="display: none;"></iframe>
    
    <script>
        const iframe = document.getElementById('robbiebar-frame');
        const loading = document.getElementById('loading');
        const error = document.getElementById('error');
        
        // Check if server is running
        fetch('http://localhost:8000/health')
            .then(response => {
                if (response.ok) {
                    // Server is running, show iframe
                    iframe.style.display = 'block';
                    loading.style.display = 'none';
                } else {
                    throw new Error('Server not healthy');
                }
            })
            .catch(err => {
                // Server not running
                loading.style.display = 'none';
                error.style.display = 'block';
            });
        
        // Handle iframe load
        iframe.onload = function() {
            loading.style.display = 'none';
            iframe.style.display = 'block';
        };
        
        iframe.onerror = function() {
            loading.style.display = 'none';
            error.style.display = 'block';
        };
        
        // Listen for refresh commands
        window.addEventListener('message', event => {
            const message = event.data;
            if (message.command === 'refresh') {
                iframe.src = iframe.src; // Reload iframe
            }
        });
    </script>
</body>
</html>`;
    }
}

function deactivate() {
    console.log('🛑 RobbieBar extension deactivated');
}

module.exports = {
    activate,
    deactivate
};



