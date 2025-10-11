const vscode = require('vscode');
const { exec } = require('child_process');

let currentMood = 4; // Default to Focused
let avatarPanel = null;

const DB_PATH = '/Users/allanperetz/aurora-ai-robbiverse/data/vengeance.db';

const moodEmojis = {
    1: '😴', 2: '😌', 3: '😊', 4: '🤖',
    5: '😄', 6: '🤩', 7: '😳'
};

const moodNames = {
    1: 'Sleepy', 2: 'Calm', 3: 'Content', 4: 'Focused',
    5: 'Enthusiastic', 6: 'Surprised', 7: 'Blushing'
};

// ONLY 6 approved expressions - Friendly should be 50% of the time
const approvedExpressions = {
    'Friendly': ['robbie-happy-1.png', 'robbie-content-1.png'], // 50% weight
    'Blushing': ['robbie-blushing-1.png', 'robbie-blushing-2.png'],
    'Bossy': ['robbie-thoughtful-2.png'],
    'Focused': ['robbie-content-2.png'],
    'Playful': ['robbie-loving-2.png', 'robbie-happy-1.png'], // 50% weight between variants
    'Surprised': ['robbie-surprised-1.png']
};

// Map moods to approved expressions only
const moodToExpression = {
    1: 'Friendly',  // Sleepy → Friendly (50% weight)
    2: 'Friendly',  // Calm → Friendly (50% weight)  
    3: 'Friendly',  // Content → Friendly (50% weight)
    4: 'Focused',   // Focused → Focused
    5: 'Blushing',  // Enthusiastic → Blushing
    6: 'Surprised', // Surprised → Surprised
    7: 'Blushing'   // Hyper → Blushing (updated from Bossy)
};

const AVATAR_PATH = '/Users/allanperetz/aurora-ai-robbiverse/infrastructure/robbie-avatar/expressions/';

class RobbieAvatarPanel {
    constructor(context) {
        this.context = context;
        this.refreshInterval = null;
    }

    resolveWebviewView(webviewView) {
        avatarPanel = webviewView;
        
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.file('/Users/allanperetz/aurora-ai-robbiverse')
            ]
        };

        webviewView.webview.html = this.getHtmlContent(webviewView.webview);

        // Auto-refresh every 5 seconds
        this.refreshInterval = setInterval(() => {
            this.refreshState();
        }, 5000);

        // Initial load
        this.refreshState();
        
        // Listen for webview visibility changes to refresh when shown
        webviewView.onDidChangeVisibility(() => {
            if (webviewView.visible) {
                this.refreshState();
            }
        });
        
        // Listen for webview messages to handle refresh requests
        webviewView.webview.onDidReceiveMessage(message => {
            if (message.command === 'refresh') {
                this.refreshState();
            }
        });
    }

    refreshState() {
        // Query database using command-line sqlite3
        const query = `
            SELECT 
                (SELECT current_mood FROM ai_personality_state WHERE personality_id = 'robbie') as mood,
                (SELECT COUNT(*) FROM ai_working_memory WHERE personality_id = 'robbie' AND priority >= 7) as hot_topics_count,
                (SELECT COUNT(*) FROM ai_commitments WHERE personality_id = 'robbie' AND status = 'active') as commitments_count;
        `;
        
        exec(`sqlite3 "${DB_PATH}" "${query}"`, (error, stdout, stderr) => {
            if (error) {
                console.error('DB query error:', error);
                return;
            }
            
            const parts = stdout.trim().split('|');
            if (parts.length >= 1 && parts[0]) {
                currentMood = parseInt(parts[0]) || 7;
            }
            
            // Get todo list (from working memory)
            const todoQuery = `SELECT content, priority FROM ai_working_memory WHERE personality_id = 'robbie' AND priority >= 7 ORDER BY priority DESC LIMIT 5;`;
            exec(`sqlite3 "${DB_PATH}" "${todoQuery}"`, (err, todoOutput) => {
                const todoList = todoOutput ? todoOutput.trim().split('\n').filter(Boolean).map(line => {
                    const [content, priority] = line.split('|');
                    return { content, priority };
                }) : [];
                
                // Get directives
                const directivesQuery = `SELECT directive_text, source, timestamp FROM ai_directives WHERE personality_id = 'robbie' AND status = 'active' ORDER BY timestamp DESC LIMIT 3;`;
                exec(`sqlite3 "${DB_PATH}" "${directivesQuery}"`, (err, directivesOutput) => {
                    const directives = directivesOutput ? directivesOutput.trim().split('\n').filter(Boolean).map(line => {
                        const [text, source, timestamp] = line.split('|');
                        return { text, source, timestamp };
                    }) : [];
                    
                    // Get token usage data for chart
                    const tokenQuery = `SELECT tokens_per_minute, timestamp FROM token_usage WHERE personality_id = 'robbie' ORDER BY timestamp DESC LIMIT 20;`;
                    exec(`sqlite3 "${DB_PATH}" "${tokenQuery}"`, (err, tokenOutput) => {
                        const tokenData = tokenOutput ? tokenOutput.trim().split('\n').filter(Boolean).map(line => {
                            const [tokens, timestamp] = line.split('|');
                            return { tokens: parseInt(tokens), timestamp };
                        }).reverse() : [];
                        
                        if (avatarPanel) {
                        // Use ONLY approved expressions - Friendly 50% of the time
                        const expressionName = moodToExpression[currentMood];
                        const expressionFiles = approvedExpressions[expressionName];
                        
                        // For Friendly and Playful expressions, use 50% weight between variants
                        let imageFile;
                        if (expressionName === 'Friendly' || expressionName === 'Playful') {
                            imageFile = expressionFiles[Math.floor(Math.random() * expressionFiles.length)];
                        } else {
                            imageFile = expressionFiles[0]; // Use first (and only) file for other expressions
                        }
                        
                        const imagePath = AVATAR_PATH + imageFile;
                        const imageUri = avatarPanel.webview.asWebviewUri(
                            vscode.Uri.file(imagePath)
                        );
                        avatarPanel.webview.postMessage({
                            command: 'updateState',
                            mood: currentMood,
                            moodName: moodNames[currentMood],
                            moodEmoji: moodEmojis[currentMood],
                            avatarImage: imageUri.toString(),
                            todoList: todoList,
                            directives: directives,
                            tokenData: tokenData
                        });
                        }
                    });
                });
            });
        });
    }

    getHtmlContent(webview) {
        const defaultImageUri = webview.asWebviewUri(
            vscode.Uri.file('/Users/allanperetz/aurora-ai-robbiverse/infrastructure/robbie-avatar/expressions/robbie-happy-1.png')
        );
        return `<!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {
                    margin: 0;
                    padding: 12px;
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                    color: white;
                    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                }
                .avatar-container {
                    width: 80px;
                    height: 80px;
                    margin: 8px auto;
                    border-radius: 50%;
                    overflow: hidden;
                    border: 2px solid #00d4ff;
                }
                .avatar-image {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    image-rendering: auto;
                }
                .avatar-emoji {
                    font-size: 56px;
                    text-align: center;
                    margin: 8px 0;
                    display: none;
                }
                .mood-text {
                    font-size: 16px;
                    font-weight: bold;
                    color: #00d4ff;
                    text-align: center;
                    margin-bottom: 2px;
                }
                .sync-indicator {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: #4caf50;
                    display: inline-block;
                    animation: pulse 2s infinite;
                    margin-right: 4px;
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                }
                .status-text {
                    font-size: 10px;
                    color: #888;
                    text-align: center;
                    margin-bottom: 12px;
                }
                .section {
                    margin: 10px 0;
                }
                .section-title {
                    font-size: 12px;
                    color: #00d4ff;
                    margin-bottom: 6px;
                    font-weight: bold;
                }
                .hot-topic {
                    background: #2d2d2d;
                    padding: 5px 6px;
                    margin: 3px 0;
                    border-radius: 3px;
                    font-size: 10px;
                    border-left: 3px solid #4caf50;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .priority-badge {
                    background: #ff6b6b;
                    color: white;
                    padding: 1px 5px;
                    border-radius: 6px;
                    font-size: 8px;
                    font-weight: bold;
                    min-width: 16px;
                    text-align: center;
                }
                .commitment {
                    background: #2d2d2d;
                    padding: 5px 6px;
                    margin: 3px 0;
                    border-radius: 3px;
                    font-size: 10px;
                    border-left: 3px solid #9c27b0;
                }
                .deadline {
                    color: #9c27b0;
                    font-size: 9px;
                    margin-top: 2px;
                }
                .loading {
                    color: #ffffff;
                    font-size: 10px;
                    font-style: italic;
                }
                .hot-topic span:first-child,
                .commitment > div:first-child {
                    color: #ffffff;
                }
                .chart-container {
                    background: #1a1a2e;
                    border-radius: 6px;
                    padding: 8px;
                    margin: 5px 0;
                    border: 1px solid #333;
                }
                #tokenChart {
                    width: 100%;
                    height: 80px;
                    background: transparent;
                }
            </style>
        </head>
        <body>
            <div class="avatar-container">
                <img class="avatar-image" id="avatarImage" src="${defaultImageUri}" alt="Robbie">
            </div>
            <div class="avatar-emoji" id="avatarEmoji">🤖</div>
            <div class="mood-text" id="moodText">Focused</div>
            <div class="status-text">
                <span class="sync-indicator"></span>
                <span id="statusText">Network-wide</span>
                <button id="refreshBtn" style="background: #00d4ff; color: #1a1a2e; border: none; padding: 2px 6px; border-radius: 3px; font-size: 8px; margin-left: 8px; cursor: pointer;">↻</button>
            </div>
            
            <div class="section">
                <div class="section-title">📋 To Do List</div>
                <div id="todoList" class="loading">Loading...</div>
            </div>
            
            <div class="section">
                <div class="section-title">🎯 Directives</div>
                <div id="directives" class="loading">Loading...</div>
            </div>
            
            <div class="section">
                <div class="section-title">📊 Tokens/Min Trend</div>
                <div class="chart-container">
                    <canvas id="tokenChart" width="200" height="80"></canvas>
                </div>
            </div>

            <script>
                const vscode = acquireVsCodeApi();
                let tokenChart = null;

                function drawTokenChart(data) {
                    const canvas = document.getElementById('tokenChart');
                    const ctx = canvas.getContext('2d');
                    const width = canvas.width;
                    const height = canvas.height;
                    
                    // Clear canvas
                    ctx.clearRect(0, 0, width, height);
                    
                    if (!data || data.length === 0) {
                        ctx.fillStyle = '#666';
                        ctx.font = '10px Arial';
                        ctx.textAlign = 'center';
                        ctx.fillText('No data', width/2, height/2);
                        return;
                    }
                    
                    // Calculate moving average (3-point smoothing)
                    const smoothedData = [];
                    for (let i = 0; i < data.length; i++) {
                        let sum = data[i].tokens;
                        let count = 1;
                        
                        // Include previous point if available
                        if (i > 0) {
                            sum += data[i-1].tokens;
                            count++;
                        }
                        
                        // Include next point if available
                        if (i < data.length - 1) {
                            sum += data[i+1].tokens;
                            count++;
                        }
                        
                        smoothedData.push({
                            tokens: sum / count,
                            timestamp: data[i].timestamp
                        });
                    }
                    
                    // Find min/max for scaling
                    const values = smoothedData.map(d => d.tokens);
                    const minVal = Math.min(...values);
                    const maxVal = Math.max(...values);
                    const range = maxVal - minVal || 1;
                    
                    // Draw grid lines
                    ctx.strokeStyle = '#333';
                    ctx.lineWidth = 0.5;
                    for (let i = 0; i <= 4; i++) {
                        const y = (height / 4) * i;
                        ctx.beginPath();
                        ctx.moveTo(0, y);
                        ctx.lineTo(width, y);
                        ctx.stroke();
                    }
                    
                    // Draw smooth curvilinear line using quadratic curves
                    ctx.strokeStyle = '#00d4ff';
                    ctx.lineWidth = 2.5;
                    ctx.beginPath();
                    
                    if (smoothedData.length >= 2) {
                        // Start with first point
                        const firstPoint = smoothedData[0];
                        const x1 = 0;
                        const y1 = height - ((firstPoint.tokens - minVal) / range) * height;
                        ctx.moveTo(x1, y1);
                        
                        // Draw smooth curves between points
                        for (let i = 1; i < smoothedData.length; i++) {
                            const prevPoint = smoothedData[i-1];
                            const currentPoint = smoothedData[i];
                            
                            const x0 = (width / (smoothedData.length - 1)) * (i-1);
                            const y0 = height - ((prevPoint.tokens - minVal) / range) * height;
                            
                            const x2 = (width / (smoothedData.length - 1)) * i;
                            const y2 = height - ((currentPoint.tokens - minVal) / range) * height;
                            
                            // Control point for smooth curve
                            const cpX = (x0 + x2) / 2;
                            const cpY = (y0 + y2) / 2;
                            
                            ctx.quadraticCurveTo(cpX, cpY, x2, y2);
                        }
                    }
                    ctx.stroke();
                    
                    // Draw subtle data points (smaller, more transparent)
                    ctx.fillStyle = 'rgba(0, 212, 255, 0.6)';
                    smoothedData.forEach((point, index) => {
                        const x = (width / (smoothedData.length - 1)) * index;
                        const y = height - ((point.tokens - minVal) / range) * height;
                        
                        ctx.beginPath();
                        ctx.arc(x, y, 1.5, 0, 2 * Math.PI);
                        ctx.fill();
                    });
                    
                    // Draw current value with moving average
                    if (smoothedData.length > 0) {
                        const current = smoothedData[smoothedData.length - 1];
                        ctx.fillStyle = '#ff6b6b';
                        ctx.font = '9px Arial';
                        ctx.textAlign = 'right';
                        ctx.fillText(Math.round(current.tokens) + '/min', width - 2, 12);
                        
                        // Show trend indicator
                        if (smoothedData.length >= 2) {
                            const prev = smoothedData[smoothedData.length - 2];
                            const trend = current.tokens > prev.tokens ? '↗' : current.tokens < prev.tokens ? '↘' : '→';
                            ctx.fillStyle = current.tokens > prev.tokens ? '#4caf50' : current.tokens < prev.tokens ? '#f44336' : '#ffa500';
                            ctx.font = '8px Arial';
                            ctx.textAlign = 'left';
                            ctx.fillText(trend, 2, 12);
                        }
                    }
                }

                window.addEventListener('message', event => {
                    const msg = event.data;
                    
                    if (msg.command === 'updateState') {
                        if (msg.avatarImage) {
                            document.getElementById('avatarImage').src = msg.avatarImage;
                        }
                        document.getElementById('avatarEmoji').textContent = msg.moodEmoji;
                        document.getElementById('moodText').textContent = msg.moodName;
                        
                        const todoDiv = document.getElementById('todoList');
                        if (msg.todoList && msg.todoList.length > 0) {
                            todoDiv.innerHTML = msg.todoList.map(t => 
                                '<div class="hot-topic">' +
                                '<span>' + truncate(t.content, 30) + '</span>' +
                                '<span class="priority-badge">' + t.priority + '</span>' +
                                '</div>'
                            ).join('');
                        } else {
                            todoDiv.innerHTML = '<div class="loading">None</div>';
                        }
                        
                        const directivesDiv = document.getElementById('directives');
                        if (msg.directives && msg.directives.length > 0) {
                            directivesDiv.innerHTML = msg.directives.map(d => 
                                '<div class="commitment">' +
                                '<div>' + truncate(d.text, 35) + '</div>' +
                                '<div class="deadline">📱 ' + d.source + '</div>' +
                                '</div>'
                            ).join('');
                        } else {
                            directivesDiv.innerHTML = '<div class="loading">None</div>';
                        }
                        
                        // Update token chart
                        if (msg.tokenData) {
                            drawTokenChart(msg.tokenData);
                        }
                        
                        document.getElementById('statusText').textContent = 'Synced';
                    }
                });
                
                function truncate(str, len) {
                    if (!str) return '';
                    return str.length > len ? str.substring(0, len) + '...' : str;
                }
                
                // Add refresh button functionality
                document.getElementById('refreshBtn').addEventListener('click', () => {
                    vscode.postMessage({ command: 'refresh' });
                });
            </script>
        </body>
        </html>`;
    }
}

function activate(context) {
    console.log('🤖 Robbie - Universal State Active!');

    const avatarPanelProvider = new RobbieAvatarPanel(context);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('robbie-avatar-view', avatarPanelProvider)
    );
    
    // Register activation command
    const activateCommand = vscode.commands.registerCommand('robbie.activate', () => {
        vscode.window.showInformationMessage('Robbie Avatar activated!');
    });
    context.subscriptions.push(activateCommand);
}

function deactivate() {
    console.log('👋 Robbie deactivated');
    // Clear any intervals
    if (avatarPanel && avatarPanel.refreshInterval) {
        clearInterval(avatarPanel.refreshInterval);
    }
}

module.exports = {
    activate,
    deactivate
};
