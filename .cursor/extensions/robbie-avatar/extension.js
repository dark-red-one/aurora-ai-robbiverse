const vscode = require('vscode');
const { exec } = require('child_process');
const http = require('http');
const os = require('os');

let currentMood = 4; // Default to Focused
let avatarPanel = null;

// Detect OS and set paths accordingly
const IS_MAC = process.platform === 'darwin';
const BASE_PATH = IS_MAC
    ? '/Users/allanperetz/aurora-ai-robbiverse'
    : '/home/allan/robbie_workspace/combined/aurora-ai-robbiverse';

const DB_PATH = `${BASE_PATH}/data/vengeance.db`;

// Detect which Robbie machine we're on
function getRobbieHostInfo() {
    const hostname = os.hostname().toLowerCase();

    if (hostname.includes('vengeance')) {
        return {
            name: 'vengeance',
            apiUrl: 'http://localhost:8000',
            isLocal: true
        };
    } else if (hostname.includes('aurora')) {
        return {
            name: 'aurora',
            apiUrl: 'http://localhost:8000', // Aurora connects to its own API
            isLocal: true
        };
    } else {
        // RobbieBook or other devices - connect to Vengeance main server
        return {
            name: hostname.split('.')[0],
            apiUrl: 'http://192.168.1.246:8000',
            isLocal: false
        };
    }
}

const AVATAR_BASE_URL = 'http://localhost:8000/images/';

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

// Avatar images loaded from web server instead of file system
// const AVATAR_PATH = `${BASE_PATH}/infrastructure/robbie-avatar/expressions/`;

class RobbieAvatarPanel {
    constructor(context) {
        this.context = context;
        this.refreshInterval = null;
        this.robbieBarData = {
            systemStats: { cpu: 0, memory: 0, gpu: 0 },
            gitStatus: { branch: 'main', modified_files: 0, clean: true },
            recentCommits: []
        };
    }

    fetchRobbieBarData() {
        // Fetch personality state first
        this.httpGet('/code/api/personality', (personalityData) => {
            if (personalityData) {
                this.robbieBarData.personality = personalityData;

                // Store personality data for later combined message
            }

            // Fetch system stats
            this.httpGet('/code/api/system/stats', (data) => {
                if (data) this.robbieBarData.systemStats = data;

                // Fetch git status
                this.httpGet('/code/api/git/status', (data) => {
                    if (data) this.robbieBarData.gitStatus = data;

                    // Fetch recent commits
                    this.httpGet('/code/api/git/recent', (data) => {
                        if (data && data.commits) this.robbieBarData.recentCommits = data.commits;

                        // Send update to webview
                        if (avatarPanel) {
                            avatarPanel.webview.postMessage({
                                command: 'updateRobbieBar',
                                ...this.robbieBarData
                            });
                        }
                    });
                });
            });
        });
    }

    httpGet(path, callback) {
        const options = {
            hostname: 'localhost',
            port: 8000,
            path: path,
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    callback(JSON.parse(data));
                } catch (e) {
                    callback(null);
                }
            });
        });

        req.on('error', () => callback(null));
        req.end();
    }

    httpPost(path, payload, callback) {
        const postData = JSON.stringify(payload);
        const options = {
            hostname: 'localhost',
            port: 8000,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    callback(JSON.parse(data));
                } catch (e) {
                    callback(null);
                }
            });
        });

        req.on('error', () => callback(null));
        req.write(postData);
        req.end();
    }

    handleApiCall(message) {
        this.httpGet(message.path, (data) => {
            if (avatarPanel) {
                avatarPanel.webview.postMessage({
                    command: 'apiResponse',
                    requestId: message.requestId,
                    data: data
                });
            }
        });
    }

    handleChatMessage(message) {
        const payload = {
            source: 'robbiebar',
            source_metadata: {
                sender: 'allan',
                timestamp: new Date().toISOString(),
                platform: 'cursor-extension'
            },
            ai_service: 'chat',
            payload: {
                input: message.text,
                parameters: {
                    temperature: 0.7,
                    max_tokens: 1500
                }
            },
            user_id: 'allan',
            fetch_context: true
        };

        this.httpPost('/api/v2/universal/request', payload, (data) => {
            if (data && data.status === 'approved') {
                // Send response to webview
                if (avatarPanel) {
                    avatarPanel.webview.postMessage({
                        command: 'chatResponse',
                        message: data.robbie_response.message,
                        mood: data.robbie_response.mood,
                        personalityChanges: data.robbie_response.personality_changes
                    });
                }
                
                // Refresh state to get updated mood
                this.refreshState();
            }
        });
    }

    resolveWebviewView(webviewView) {
        avatarPanel = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.file(BASE_PATH)
            ]
        };

        webviewView.webview.html = this.getHtmlContent(webviewView.webview);

        // Auto-refresh every 2 seconds for faster updates
        this.refreshInterval = setInterval(() => {
            this.refreshState();
        }, 2000);

        // Initial load
        this.refreshState();

        // Listen for webview visibility changes to refresh when shown
        webviewView.onDidChangeVisibility(() => {
            if (webviewView.visible) {
                this.refreshState();
            }
        });

        // Listen for webview messages to handle refresh requests and API calls
        webviewView.webview.onDidReceiveMessage(message => {
            if (message.command === 'refresh') {
                this.refreshState();
            } else if (message.command === 'apiCall') {
                // Proxy API calls from webview
                this.handleApiCall(message);
            } else if (message.command === 'chat') {
                // Handle chat messages through Universal Input API
                this.handleChatMessage(message);
            }
        });
    }

    refreshState() {
        // Fetch from RobbieBar API instead of database
        this.fetchRobbieBarData();
    }

    getHtmlContent(webview) {
        // Get host info and set up URLs
        const hostInfo = getRobbieHostInfo();
        const defaultImageUrl = hostInfo.apiUrl + '/images/robbie-happy-1.png';
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
                    width: 120px;
                    height: 120px;
                    margin: 8px auto;
                    border-radius: 50%;
                    overflow: hidden;
                    border: 3px solid #00d4ff;
                    position: relative;
                }
                .avatar-image {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    image-rendering: auto;
                    animation: subtle-breath 3s ease-in-out infinite;
                }
                @keyframes subtle-breath {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.02); }
                }
                .avatar-emoji {
                    font-size: 84px;
                    text-align: center;
                    margin: 8px 0;
                    display: none;
                }
                .mood-text {
                    font-size: 18px;
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
                .stats-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 6px;
                }
                .stat-item {
                    background: #2d2d2d;
                    padding: 6px 8px;
                    border-radius: 3px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-left: 3px solid #4caf50;
                }
                .stat-label {
                    font-size: 10px;
                    color: #888;
                }
                .stat-value {
                    font-size: 11px;
                    font-weight: bold;
                    color: #00d4ff;
                    font-family: monospace;
                }
                .stat-value.high {
                    color: #ffa500;
                }
                .stat-value.critical {
                    color: #f44336;
                }
                .git-info {
                    background: #2d2d2d;
                    padding: 6px 8px;
                    border-radius: 3px;
                    font-size: 10px;
                    margin-bottom: 6px;
                    border-left: 3px solid #4caf50;
                }
                .git-branch {
                    margin-bottom: 3px;
                    color: #888;
                }
                .git-branch span {
                    color: #00d4ff;
                    font-weight: bold;
                    font-family: monospace;
                }
                .git-modified {
                    color: #888;
                }
                .git-modified span {
                    color: #ffa500;
                    font-weight: bold;
                }
                .action-btn, .context-btn {
                    width: 100%;
                    background: #3c3c3c;
                    color: #ffffff;
                    border: 1px solid #555555;
                    padding: 8px 12px;
                    border-radius: 6px;
                    font-size: 11px;
                    font-weight: 500;
                    cursor: pointer;
                    text-align: center;
                    transition: all 0.3s ease;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                }
                .action-btn:hover, .context-btn:hover {
                    background: #4a4a4a;
                    border-color: #666666;
                    box-shadow: 0 0 12px rgba(255, 255, 255, 0.15), 0 4px 8px rgba(0, 0, 0, 0.3);
                    transform: translateY(-1px);
                }
                .action-btn:active, .context-btn:active {
                    background: #2a2a2a;
                    border-color: #444444;
                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
                    transform: translateY(0);
                }
                .context-btn.active {
                    background: #00d4ff;
                    color: #1a1a2e;
                    border-color: #00b8ff;
                    box-shadow: 0 0 15px rgba(0, 212, 255, 0.4), 0 4px 8px rgba(0, 0, 0, 0.3);
                }
                .commit-item {
                    background: #2d2d2d;
                    padding: 5px 6px;
                    margin: 3px 0;
                    border-radius: 3px;
                    font-size: 9px;
                    border-left: 3px solid #9c27b0;
                }
                .commit-hash {
                    color: #00d4ff;
                    font-family: monospace;
                    font-weight: bold;
                    margin-right: 4px;
                }
                .commit-message {
                    color: #ffffff;
                }
                .commit-time {
                    color: #888;
                    font-size: 8px;
                    margin-top: 2px;
                }
                .tv-static {
                    width: 100%;
                    height: 120px;
                    background: #000;
                    position: relative;
                    overflow: hidden;
                }
                .tv-static::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: 
                        repeating-linear-gradient(
                            90deg,
                            #000 0px,
                            #fff 1px,
                            #000 2px,
                            #000 3px
                        ),
                        repeating-linear-gradient(
                            0deg,
                            #000 0px,
                            #fff 1px,
                            #000 2px,
                            #000 3px
                        );
                    opacity: 0.1;
                    animation: static 0.1s infinite;
                }
                @keyframes static {
                    0% { opacity: 0.05; }
                    50% { opacity: 0.15; }
                    100% { opacity: 0.05; }
                }
                
                /* Widget Styles */
                .widget-section {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    padding: 4px 6px;
                    background: rgba(255, 255, 255, 0.03);
                    border-radius: 4px;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                }
                
                .widget-icon {
                    font-size: 18px;
                }
                
                .widget-content {
                    flex: 1;
                }
                
                .widget-primary {
                    font-size: 11px;
                    font-weight: bold;
                    color: #cccccc;
                }
                
                .widget-secondary {
                    font-size: 8px;
                    color: #858585;
                    margin-top: 1px;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                #infoWidget {
                    animation: fadeIn 0.5s ease-out;
                }
            </style>
        </head>
        <body>
            <div class="avatar-container">
                <img class="avatar-image" id="avatarImage" src="${defaultImageUrl}" alt="Robbie">
            </div>
            <div class="avatar-emoji" id="avatarEmoji">🤖</div>
            <div class="mood-text" id="moodText">Focused</div>
            <div class="status-text">
                <span class="sync-indicator"></span>
                <span id="hostnameText">loading...</span>
                <button id="refreshBtn" style="background: #00d4ff; color: #1a1a2e; border: none; padding: 2px 6px; border-radius: 3px; font-size: 8px; margin-left: 8px; cursor: pointer;">↻</button>
            </div>
            
            <!-- Removed: To Do List, Directives, Tokens Chart - Keeping it clean! -->
            
            <div class="section">
                <div class="section-title">🔥 System Stats</div>
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-label">CPU</span>
                        <span class="stat-value" id="cpuStat">--%</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Memory</span>
                        <span class="stat-value" id="memoryStat">--%</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">GPU</span>
                        <span class="stat-value" id="gpuStat">--%</span>
                    </div>
                </div>
            </div>
            
            <br>
            
            <div class="section">
                <div class="section-title">🌳 Git Status</div>
                <div class="git-info">
                    <div class="git-branch">Branch: <span id="gitBranch">main</span></div>
                    <div class="git-modified">Modified: <span id="gitModified">0</span> files</div>
                </div>
                <button id="quickCommitBtn" class="action-btn">💾 Quick Commit</button>
            </div>
            
            <br>
            
            <div class="section">
                <div class="section-title">📊 Recent Commits</div>
                <div id="recentCommits" class="loading">Loading...</div>
            </div>
            
            <br>
            
            <br>
            
            <!-- Applications Section -->
            <div class="section">
                <div class="section-title">🚀 Applications</div>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <button class="context-btn" data-context="work">💼 @Work</button>
                    <button class="context-btn" data-context="testpilot">🧪 @TestPilot</button>
                    <button class="context-btn" data-context="growth">📈 @Growth</button>
                    <button class="context-btn" data-context="play">🎮 @Play</button>
                </div>
            </div>

            <br>

            <!-- Chat Section -->
            <div class="section">
                <div class="section-title">💬 Chat with Robbie</div>
                <div id="chatMessages" style="max-height: 200px; overflow-y: auto; background: #2d2d2d; border-radius: 4px; padding: 8px; margin-bottom: 8px; font-size: 11px;"></div>
                <div style="display: flex; gap: 4px;">
                    <input 
                        type="text" 
                        id="chatInput" 
                        placeholder="Ask me anything..." 
                        style="flex: 1; background: #3c3c3c; color: white; border: 1px solid #555; border-radius: 4px; padding: 6px; font-size: 11px;"
                    />
                    <button 
                        id="chatSendBtn" 
                        class="action-btn" 
                        style="flex: 0 0 60px; padding: 6px;"
                    >Send</button>
                </div>
            </div>

            <!-- Bottom padding to prevent content from going under TV bar and widget -->
            <div style="height: 300px;"></div>

            <!-- Mood-Aware Matrix Rain Background -->
            <canvas id="matrixRain" style="position: fixed; top: 0; left: 0; width: 100%; height: calc(100% - 300px); z-index: -1; pointer-events: none; opacity: 0.1;"></canvas>

            <!-- Entertainment Bar - Fixed at Bottom (Separate from scrollable content) -->
            <div style="position: fixed; bottom: 80px; left: 0; right: 0; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-top: 2px solid #00d4ff; padding: 12px; z-index: 1000;">
                <div class="section-title" style="margin-bottom: 8px;">🎬 Entertainment</div>
                <div style="display: flex; gap: 6px; margin-bottom: 8px; flex-wrap: wrap;">
                    <button id="muteTvBtn" class="action-btn" style="flex: 0 0 60px; font-size: 14px; padding: 8px;">🔇</button>
                    <button id="fullscreenBtn" class="action-btn" style="flex: 0 0 60px; font-size: 14px; padding: 8px;">⛶</button>
                    <select id="channelSelect" class="action-btn" style="flex: 1; min-width: 120px; background: #3c3c3c; color: white; border: 1px solid #555555; border-radius: 6px; padding: 8px 12px; font-size: 13px; text-align: center;">
                        <option value="1">📰 MSNBC</option>
                        <option value="2">🦅 Fox News</option>
                        <option value="3">🏛️ CNN</option>
                        <option value="4" selected>🎵 Lofi Beats</option>
                        <option value="5">🎷 Jazz</option>
                        <option value="6">🎻 Classical</option>
                        <option value="7">🔥 Allan's Campfire</option>
                    </select>
                </div>
                <iframe 
                    id="tvFrame"
                    width="100%" 
                    height="152" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen>
                </iframe>
            </div>

            <!-- Info Widget - Fixed at Very Bottom -->
            <div id="infoWidget" style="position: fixed; bottom: 0; left: 0; right: 0; background: #252526; border-top: 1px solid #3e3e42; padding: 6px; z-index: 1001; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px;">
                
                <!-- Time Section -->
                <div class="widget-section">
                    <div class="widget-icon">🕐</div>
                    <div class="widget-content">
                        <div class="widget-primary" id="widgetTime">--:--</div>
                        <div class="widget-secondary" id="widgetDate">Loading...</div>
                    </div>
                </div>
                
                <!-- Weather Section -->
                <div class="widget-section">
                    <div class="widget-icon" id="weatherIcon">☀️</div>
                    <div class="widget-content">
                        <div class="widget-primary" id="widgetTemp">--°</div>
                        <div class="widget-secondary" id="widgetCondition">Loading...</div>
                    </div>
                </div>
                
                <!-- Calendar Section -->
                <div class="widget-section">
                    <div class="widget-icon">📅</div>
                    <div class="widget-content">
                        <div class="widget-primary" id="widgetEvent">No events</div>
                        <div class="widget-secondary" id="widgetEventTime">--</div>
                    </div>
                </div>
                
            </div>

            <script>
                // Injected from Node.js - available before any other scripts
                window.ROBBIE_HOST_INFO = ${JSON.stringify(hostInfo)};
                window.API_BASE_URL = '${hostInfo.apiUrl}';
                
                const vscode = acquireVsCodeApi();
                
                // API Call Helper - Routes through Node.js to avoid CSP blocking
                let requestIdCounter = 0;
                const pendingRequests = {};
                
                function apiCall(path) {
                    return new Promise((resolve) => {
                        const requestId = ++requestIdCounter;
                        pendingRequests[requestId] = resolve;
                        vscode.postMessage({
                            command: 'apiCall',
                            requestId: requestId,
                            path: path
                        });
                    });
                }
                
                // Handle API responses from Node.js
                window.addEventListener('message', event => {
                    const msg = event.data;
                    if (msg.command === 'apiResponse') {
                        const resolve = pendingRequests[msg.requestId];
                        if (resolve) {
                            resolve(msg.data);
                            delete pendingRequests[msg.requestId];
                        }
                    }
                });
                let tokenChart = null;
                let matrixRain = null;

                // Mood-aware matrix rain emojis
                const moodEmojis = {
                    'friendly': ['😊', '💕', '✨', '☀️', '💖'],
                    'focused': ['🎯', '🔥', '💼', '⚡', '🚀'],
                    'playful': ['😘', '💋', '🎮', '🎉', '💕'],
                    'bossy': ['💪', '⚡', '👊', '🔥', '💥'],
                    'surprised': ['😲', '❗', '✨', '⚡', '😮'],
                    'blushing': ['😊', '💕', '💖', '💋', '🌸']
                };

                function initMatrixRain(mood = 'focused') {
                    const canvas = document.getElementById('matrixRain');
                    const ctx = canvas.getContext('2d');
                    
                    // Set canvas size
                    canvas.width = window.innerWidth;
                    canvas.height = window.innerHeight;
                    
                    // Matrix characters (binary + katakana + mood emojis)
                    const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
                    const charArray = chars.split('');
                    const moodEmojisArray = moodEmojis[mood] || moodEmojis['focused'];
                    
                    const fontSize = 14;
                    const columns = Math.floor(canvas.width / fontSize);
                    const drops = [];
                    
                    // Initialize drops at random heights
                    for (let i = 0; i < columns; i++) {
                        drops[i] = Math.random() * -100;
                    }
                    
                    function draw() {
                        // Fade effect for trails
                        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        
                        ctx.font = fontSize + 'px monospace';
                        
                        for (let i = 0; i < drops.length; i++) {
                            // Occasionally use mood emoji instead of character
                            const useMoodEmoji = Math.random() > 0.95;
                            const char = useMoodEmoji ? 
                                moodEmojisArray[Math.floor(Math.random() * moodEmojisArray.length)] :
                                charArray[Math.floor(Math.random() * charArray.length)];
                            
                            const x = i * fontSize;
                            const y = drops[i] * fontSize;
                            
                            // Bright head vs dim trail
                            const isHead = Math.random() > 0.975;
                            ctx.fillStyle = isHead ? '#00ff41' : '#00d4ff';
                            
                            ctx.fillText(char, x, y);
                            
                            // Reset to top when off screen
                            if (y > canvas.height && Math.random() > 0.975) {
                                drops[i] = 0;
                            }
                            
                            drops[i]++;
                        }
                    }
                    
                    // Clear existing interval
                    if (matrixRain) {
                        clearInterval(matrixRain);
                    }
                    
                    // Start animation at 50ms (20 FPS)
                    matrixRain = setInterval(draw, 50);
                }

                function updateMatrixRainWithMoodEmojis(moodEmojisArray) {
                    const canvas = document.getElementById('matrixRain');
                    const ctx = canvas.getContext('2d');
                    
                    // Set canvas size
                    canvas.width = window.innerWidth;
                    canvas.height = window.innerHeight;
                    
                    // Matrix characters (binary + katakana + mood emojis)
                    const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
                    const charArray = chars.split('');
                    const emojis = moodEmojisArray || ['💕', '💋', '😊', '🌸', '💖'];
                    
                    const fontSize = 14;
                    const columns = Math.floor(canvas.width / fontSize);
                    const drops = [];
                    
                    // Initialize drops at random heights
                    for (let i = 0; i < columns; i++) {
                        drops[i] = Math.random() * -100;
                    }
                    
                    // Big mood emojis falling slower in foreground
                    const bigEmojis = [];
                    const bigEmojiSize = 48;
                    
                    function draw() {
                        // Fade effect for trails
                        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        
                        ctx.font = fontSize + 'px monospace';
                        
                        for (let i = 0; i < drops.length; i++) {
                            // Occasionally use mood emoji instead of character
                            const useMoodEmoji = Math.random() > 0.95;
                            const char = useMoodEmoji ? 
                                emojis[Math.floor(Math.random() * emojis.length)] :
                                charArray[Math.floor(Math.random() * charArray.length)];
                            
                            const x = i * fontSize;
                            const y = drops[i] * fontSize;
                            
                            // Bright head vs dim trail
                            const isHead = Math.random() > 0.975;
                            ctx.fillStyle = isHead ? '#00ff41' : '#00d4ff';
                            
                            ctx.fillText(char, x, y);
                            
                            // Reset to top when off screen
                            if (y > canvas.height && Math.random() > 0.975) {
                                drops[i] = 0;
                            }
                            
                            drops[i]++;
                        }
                        
                        // Add new big mood emojis occasionally
                        if (Math.random() < 0.02) {
                            bigEmojis.push({
                                x: Math.random() * canvas.width,
                                y: -bigEmojiSize,
                                emoji: emojis[Math.floor(Math.random() * emojis.length)],
                                speed: 0.5 + Math.random() * 0.5
                            });
                        }
                        
                        // Draw and update big mood emojis
                        ctx.font = bigEmojiSize + 'px monospace';
                        for (let i = bigEmojis.length - 1; i >= 0; i--) {
                            const bigEmoji = bigEmojis[i];
                            
                            // Add glow effect
                            ctx.shadowColor = '#ff69b4';
                            ctx.shadowBlur = 10;
                            ctx.fillStyle = '#ff69b4';
                            ctx.fillText(bigEmoji.emoji, bigEmoji.x, bigEmoji.y);
                            
                            // Reset shadow
                            ctx.shadowBlur = 0;
                            
                            // Move down
                            bigEmoji.y += bigEmoji.speed;
                            
                            // Remove if off screen
                            if (bigEmoji.y > canvas.height + bigEmojiSize) {
                                bigEmojis.splice(i, 1);
                            }
                        }
                    }
                    
                    // Clear existing interval
                    if (matrixRain) {
                        clearInterval(matrixRain);
                    }
                    
                    // Start animation at 50ms (20 FPS)
                    matrixRain = setInterval(draw, 50);
                }

                // Initialize matrix rain once
                let matrixInitialized = false;
                if (!matrixInitialized) {
                    initMatrixRain('focused');
                    matrixInitialized = true;
                }

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
                    
                    if (msg.command === 'updateRobbieBar') {
                        // Update mood display
                        if (msg.personality) {
                            const moodName = msg.personality.mood_data?.name || msg.personality.mood;
                            if (document.getElementById('moodText')) {
                                document.getElementById('moodText').textContent = moodName;
                            }
                            
                            // Update avatar image from API response
                            if (msg.personality.mood_data && msg.personality.mood_data.main_image_url) {
                                const avatarImg = document.getElementById('avatarImage');
                                if (avatarImg) {
                                    avatarImg.src = msg.personality.mood_data.main_image_url;
                                }
                            }
                            
                            // Update matrix rain with mood-specific emojis (only if not already running)
                            if (!matrixInitialized && msg.personality.mood_data && msg.personality.mood_data.matrix_emojis) {
                                updateMatrixRainWithMoodEmojis(msg.personality.mood_data.matrix_emojis);
                                matrixInitialized = true;
                            }
                        }
                        
                        // Update system stats
                        if (msg.systemStats) {
                            const cpuEl = document.getElementById('cpuStat');
                            const memEl = document.getElementById('memoryStat');
                            const gpuEl = document.getElementById('gpuStat');
                            
                            cpuEl.textContent = msg.systemStats.cpu.toFixed(1) + '%';
                            memEl.textContent = msg.systemStats.memory.toFixed(1) + '%';
                            gpuEl.textContent = msg.systemStats.gpu.toFixed(1) + '%';
                            
                            // Color coding
                            [cpuEl, memEl, gpuEl].forEach(el => {
                                const val = parseFloat(el.textContent);
                                el.classList.remove('high', 'critical');
                                if (val > 80) el.classList.add('critical');
                                else if (val > 60) el.classList.add('high');
                            });
                        }
                        
                        // Update git status with clean summary
                        if (msg.gitStatus) {
                            document.getElementById('gitBranch').textContent = msg.gitStatus.branch || 'main';
                            document.getElementById('gitModified').textContent = msg.gitStatus.summary || '✅ Clean';
                        }
                        
                        // Update recent commits
                        if (msg.recentCommits) {
                            const commitsDiv = document.getElementById('recentCommits');
                            if (msg.recentCommits.length > 0) {
                                commitsDiv.innerHTML = msg.recentCommits.map(c => 
                                    '<div class="commit-item">' +
                                    '<span class="commit-hash">' + c.hash + '</span>' +
                                    '<span class="commit-message">' + truncate(c.message, 25) + '</span>' +
                                    '<div class="commit-time">' + c.time + '</div>' +
                                    '</div>'
                                ).join('');
                            } else {
                                commitsDiv.innerHTML = '<div class="loading">No recent commits</div>';
                            }
                        }
                    }
                    
                    if (msg.command === 'updateState') {
                        if (msg.avatarImage) {
                            document.getElementById('avatarImage').src = msg.avatarImage;
                        }
                        document.getElementById('avatarEmoji').textContent = msg.moodEmoji;
                        
                        // Show mood name only
                        document.getElementById('moodText').textContent = msg.moodName;
                        
                        // Update matrix rain with new mood (only if not already running)
                        // Skip to prevent janky reloading
                        
                        // Old sections removed - keeping it clean!
                        
                        // Status updated via hostname display
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
                
                // ============================================
                // WIDGET FUNCTIONS (Time, Weather, Calendar)
                // ============================================
                
                // Update Time (Real-time with 24-hour format and timezone)
                function updateTime() {
                    const now = new Date();
                    const time = now.toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        hour12: false 
                    });
                    const date = now.toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                    });
                    
                    // Get timezone abbreviation
                    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                    const timezoneAbbr = now.toLocaleDateString('en-US', {
                        timeZoneName: 'short'
                    }).split(', ')[1] || timezone.split('/')[1] || 'UTC';
                    
                    document.getElementById('widgetTime').textContent = time;
                    document.getElementById('widgetDate').textContent = date + ' ' + timezoneAbbr;
                }
                
                // Update hostname display on load
                function updateHostnameDisplay() {
                    const hostInfo = window.ROBBIE_HOST_INFO;
                    const text = hostInfo.isLocal 
                        ? hostInfo.name + ': connected'
                        : hostInfo.name + ' → vengeance';
                    document.getElementById('hostnameText').textContent = text;
                }
                
                // Call on load
                updateHostnameDisplay();
                
                // Update every second
                setInterval(updateTime, 1000);
                updateTime();
                
                // Fetch Weather
                async function updateWeather() {
                    try {
                        const data = await apiCall('/code/api/widget/weather');
                        
                        document.getElementById('widgetTemp').textContent = Math.round(data.temp) + '°';
                        document.getElementById('widgetCondition').textContent = data.condition;
                        document.getElementById('weatherIcon').textContent = data.icon;
                    } catch (error) {
                        console.error('Weather fetch error:', error);
                        document.getElementById('widgetTemp').textContent = '--°';
                        document.getElementById('widgetCondition').textContent = 'Offline';
                        document.getElementById('weatherIcon').textContent = '❌';
                    }
                }
                
                // Update every 15 minutes
                setInterval(updateWeather, 15 * 60 * 1000);
                updateWeather();
                
                // Fetch Calendar
                async function updateCalendar() {
                    try {
                        const data = await apiCall('/code/api/widget/calendar');
                        
                        if (data.next_event) {
                            document.getElementById('widgetEvent').textContent = data.next_event.title;
                            document.getElementById('widgetEventTime').textContent = data.next_event.time;
                        } else {
                            document.getElementById('widgetEvent').textContent = 'No events';
                            document.getElementById('widgetEventTime').textContent = 'Free time!';
                        }
                    } catch (error) {
                        document.getElementById('widgetEvent').textContent = 'Calendar offline';
                        document.getElementById('widgetEventTime').textContent = '--';
                    }
                }
                
                // Update every 5 minutes
                setInterval(updateCalendar, 5 * 60 * 1000);
                updateCalendar();
                
                // Add quick commit button functionality
                document.getElementById('quickCommitBtn').addEventListener('click', async () => {
                    const btn = document.getElementById('quickCommitBtn');
                    btn.textContent = '⏳ Committing...';
                    btn.disabled = true;
                    
                    try {
                        const data = await apiCall('/code/api/git/quick-commit');
                        
                        if (data.success) {
                            btn.textContent = data.skipped ? '✅ No Changes' : '✅ Pushed!';
                        } else {
                            btn.textContent = '❌ Failed';
                        }
                    } catch (error) {
                        btn.textContent = '❌ Error';
                    }
                    
                    setTimeout(() => {
                        btn.textContent = '💾 Quick Commit';
                        btn.disabled = false;
                    }, 2000);
                });

                // Add context switching functionality
                const contextUrls = {
                    work: 'http://aurora.testpilot.ai/work/',
                    growth: 'http://aurora.testpilot.ai/growth/',
                    testpilot: 'http://aurora.testpilot.ai/testpilot/',
                    play: 'http://aurora.testpilot.ai/play/'
                };

                document.querySelectorAll('.context-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const context = e.target.dataset.context;
                        
                        // Update active button
                        document.querySelectorAll('.context-btn').forEach(b => b.classList.remove('active'));
                        e.target.classList.add('active');
                        
                        // Switch context in database
                        try {
                            const data = await apiCall('/code/api/context/switch');
                            
                            if (data && data.success) {
                                // Open the web app URL
                                const url = contextUrls[context];
                                if (url) {
                                    vscode.postMessage({
                                        command: 'openUrl',
                                        url: url
                                    });
                                }
                            }
                        } catch (error) {
                            console.error('Context switch failed:', error);
                        }
                    });
                });

                // Chat functionality
                document.getElementById('chatSendBtn').addEventListener('click', sendChatMessage);
                document.getElementById('chatInput').addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') sendChatMessage();
                });

                function sendChatMessage() {
                    const input = document.getElementById('chatInput');
                    const message = input.value.trim();
                    if (!message) return;
                    
                    // Add user message to chat
                    addChatMessage('You', message, true);
                    input.value = '';
                    
                    // Send to extension
                    vscode.postMessage({
                        command: 'chat',
                        text: message
                    });
                }

                function addChatMessage(sender, text, isUser) {
                    const chatDiv = document.getElementById('chatMessages');
                    const msgDiv = document.createElement('div');
                    msgDiv.style.marginBottom = '8px';
                    msgDiv.style.color = isUser ? '#00d4ff' : '#ffffff';
                    msgDiv.innerHTML = `<strong>${sender}:</strong> ${text}`;
                    chatDiv.appendChild(msgDiv);
                    chatDiv.scrollTop = chatDiv.scrollHeight;
                }

                // Listen for chat responses
                window.addEventListener('message', event => {
                    const msg = event.data;
                    if (msg.command === 'chatResponse') {
                        addChatMessage('Robbie', msg.message, false);
                        
                        // Show mood change notification if any
                        if (msg.personalityChanges && msg.personalityChanges.mood) {
                            const change = msg.personalityChanges.mood;
                            addChatMessage('System', `🎭 Mood changed: ${change.from} → ${change.to}`, false);
                        }
                    }
                });

                // TV Configuration - 7 YouTube Live Channels (3 News + 4 Music)
                const tvChannels = {
                    1: { name: 'MSNBC', url: 'https://www.youtube.com/embed/Rl5xoOrCkiA?autoplay=1&enablejsapi=1' },
                    2: { name: 'Fox News', url: 'https://www.youtube.com/embed/E5X51mLOk_o?autoplay=1&enablejsapi=1' },
                    3: { name: 'CNN', url: 'https://www.youtube.com/embed/IUqA-uMEDgg?autoplay=1&enablejsapi=1' },
                    4: { name: 'Lofi Beats', url: 'https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&enablejsapi=1' }, // Lofi Girl
                    5: { name: 'Jazz', url: 'https://www.youtube.com/embed/Dx5qFachd3A?autoplay=1&enablejsapi=1' }, // Smooth Jazz 24/7
                    6: { name: 'Classical', url: 'https://www.youtube.com/embed/jgpJVI3tDbY?autoplay=1&enablejsapi=1' }, // Classical Music
                    7: { name: 'Allan\'s Campfire', url: 'https://open.spotify.com/embed/playlist/4FU9rrRhqZHcKYs2t7RHs8?utm_source=generator' } // Allan's personal playlist
                };

                let isMuted = true;
                let currentChannel = 4; // Default to Lofi Beats
                let channelStartTime = null;
                let viewingHistory = [];

                // Auto-start with Lofi Beats (channel 4)
                setTimeout(() => {
                    changeChannel(4); // Start with Lofi Beats
                }, 500);

                // Mute toggle functionality - sync with YouTube pause/play
                document.getElementById('muteTvBtn').addEventListener('click', () => {
                    const muteBtn = document.getElementById('muteTvBtn');
                    const tvFrame = document.getElementById('tvFrame');
                    isMuted = !isMuted;
                    muteBtn.textContent = isMuted ? '🔇' : '🔊';
                    
                    // Reload iframe with new mute state
                    changeChannel(currentChannel);
                });

                // Fullscreen functionality
                document.getElementById('fullscreenBtn').addEventListener('click', () => {
                    const tvFrame = document.getElementById('tvFrame');
                    if (tvFrame.requestFullscreen) {
                        tvFrame.requestFullscreen();
                    } else if (tvFrame.webkitRequestFullscreen) {
                        tvFrame.webkitRequestFullscreen();
                    } else if (tvFrame.mozRequestFullScreen) {
                        tvFrame.mozRequestFullScreen();
                    } else if (tvFrame.msRequestFullscreen) {
                        tvFrame.msRequestFullscreen();
                    }
                });

                // Channel selection functionality
                document.getElementById('channelSelect').addEventListener('change', (e) => {
                    currentChannel = parseInt(e.target.value);
                    changeChannel(currentChannel);
                });

                function changeChannel(channel) {
                    const tvFrame = document.getElementById('tvFrame');
                    const channelData = tvChannels[channel];
                    
                    // Track previous channel viewing time
                    if (channelStartTime && currentChannel !== channel) {
                        const watchTime = Math.floor((Date.now() - channelStartTime) / 1000);
                        if (watchTime > 0) {
                            trackChannelViewing(currentChannel, watchTime);
                        }
                    }
                    
                    // Build URL with mute parameter
                    const muteParam = isMuted ? '&mute=1' : '&mute=0';
                    tvFrame.src = channelData.url + muteParam;
                    channelStartTime = Date.now();
                    
                    // Track channel switch
                    trackChannelSwitch(channel);
                    
                    currentChannel = channel;
                }
                
                function trackChannelViewing(channel, watchTimeSeconds) {
                    const channelData = tvChannels[channel];
                    const viewingEntry = {
                        channel: channel,
                        channelName: channelData.name,
                        watchTime: watchTimeSeconds,
                        timestamp: new Date().toISOString(),
                        muted: isMuted
                    };
                    
                    viewingHistory.push(viewingEntry);
                    
                    // Send to RobbieBar API for storage (silent tracking)
                    // Note: TV tracking disabled for now - would need POST support in apiCall
                    // apiCall('/code/api/tv/track-viewing').catch(err => {});
                }

                function trackChannelSwitch(channel) {
                    const channelData = tvChannels[channel];
                    const switchEntry = {
                        channel: channel,
                        channelName: channelData.name,
                        action: 'channel_switch',
                        timestamp: new Date().toISOString(),
                        muted: isMuted
                    };
                    
                    // Send to RobbieBar API for storage (silent tracking)
                    // Note: TV tracking disabled for now - would need POST support in apiCall
                    // apiCall('/code/api/tv/track-switch').catch(err => {});
                }
            </script >
        </body >
        </html > `;
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
