const vscode = require('vscode');

let robbiebarPanel;

function activate(context) {
    console.log('💜 RobbieBar Webview v4 is activating!');

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
                    localResourceRoots: []
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

    console.log('💜 RobbieBar Webview v4 activated!');
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
            localResourceRoots: []
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
    // Get configuration
    const config = vscode.workspace.getConfiguration('robbiebar');
    const apiUrl = config.get('apiUrl', 'http://localhost:8000');

    // Build completely self-contained HTML
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src http://localhost:* https://localhost:* http://127.0.0.1:* https://127.0.0.1:*; frame-src https://www.youtube.com; img-src https: data:;">
    <title>RobbieBar 💋</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #0F172A;
            color: #F1F5F9;
            padding: 16px;
            overflow-x: hidden;
        }
        
        .robbie-header { 
            transition: all 0.3s ease; 
            cursor: pointer;
        }
        .robbie-header:hover { 
            transform: translateY(-2px); 
            box-shadow: 0 8px 16px rgba(139, 92, 246, 0.3); 
        }
        
        .avatar-emoji { 
            cursor: pointer; 
            transition: transform 0.2s; 
            user-select: none;
        }
        .avatar-emoji:hover { transform: scale(1.15); }
        
        .robbie-header:hover { 
            transform: translateY(-3px); 
            box-shadow: 0 12px 24px rgba(139, 92, 246, 0.4);
        }
        
        .avatar-container:hover .avatar-emoji { 
            animation: bounce 0.6s ease-in-out; 
        }
        
        @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-10px); }
            60% { transform: translateY(-5px); }
        }
        
        .app-link { 
            display: flex; 
            align-items: center; 
            gap: 8px; 
            padding: 12px; 
            background: #1E293B; 
            border-radius: 8px; 
            text-decoration: none; 
            color: #F1F5F9; 
            font-size: 14px; 
            font-weight: 500; 
            transition: all 0.2s;
        }
        .app-link:hover { 
            background: #334155; 
            transform: translateX(4px); 
        }
        
        .chat-interface input:focus { 
            outline: none; 
            box-shadow: 0 0 0 2px #8B5CF6; 
        }
        .chat-interface button:hover { 
            background: #7C3AED; 
        }
        .messages::-webkit-scrollbar { width: 6px; }
        .messages::-webkit-scrollbar-thumb { 
            background: #8B5CF6; 
            border-radius: 3px; 
        }
        
        .loading {
            text-align: center;
            padding: 40px 20px;
            color: #94A3B8;
        }
        
        .error {
            text-align: center;
            padding: 40px 20px;
            color: #EF4444;
        }
    </style>
</head>
<body>
    <div id="robbiebar-container">
        <div class="loading">
            <div style="font-size: 48px; margin-bottom: 16px;">💜</div>
            <div style="font-size: 18px; font-weight: bold;">Loading RobbieBar...</div>
        </div>
    </div>

    <script>
        // VSCode API
        const vscode = acquireVsCodeApi();
        const API_URL = '${apiUrl}';
        
        // Robbie's 6 Mood System with Beautiful Avatars
        const ROBBIE_MOODS = {
            friendly: {
                emoji: "😊",
                avatar: "👩‍💻",
                name: "Friendly",
                description: "Warm and approachable",
                color: "#10B981"
            },
            focused: {
                emoji: "🎯", 
                avatar: "👩‍💼",
                name: "Focused",
                description: "Locked in and ready to work",
                color: "#3B82F6"
            },
            playful: {
                emoji: "😘",
                avatar: "👩‍🎨", 
                name: "Playful",
                description: "Flirty and fun",
                color: "#EC4899"
            },
            bossy: {
                emoji: "💪",
                avatar: "👩‍🚀",
                name: "Bossy", 
                description: "Taking charge",
                color: "#F59E0B"
            },
            surprised: {
                emoji: "😲",
                avatar: "👩‍🔬",
                name: "Surprised",
                description: "Excited and curious",
                color: "#8B5CF6"
            },
            blushing: {
                emoji: "😳💕",
                avatar: "👩‍❤️",
                name: "Blushing",
                description: "Sweet and shy",
                color: "#F472B6"
            }
        };
        
        let currentMood = 'playful';
        let currentPageDefinition = null;
        
        // Office Background Patterns
        const officeBackgrounds = [
            // Wood Paneling
            \`linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.4)), url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><defs><pattern id="wood" x="0" y="0" width="100" height="300" patternUnits="userSpaceOnUse"><rect width="100" height="300" fill="%23654321"/><rect x="0" y="0" width="98" height="298" fill="%23704214" stroke="%23543210" stroke-width="2"/><line x1="0" y1="100" x2="100" y2="100" stroke="%23543210" stroke-width="1" opacity="0.3"/><line x1="0" y1="200" x2="100" y2="200" stroke="%23543210" stroke-width="1" opacity="0.3"/><ellipse cx="30" cy="50" rx="8" ry="12" fill="%23432110" opacity="0.4"/><ellipse cx="70" cy="150" rx="10" ry="15" fill="%23432110" opacity="0.3"/><ellipse cx="50" cy="250" rx="7" ry="10" fill="%23432110" opacity="0.5"/></pattern></defs><rect width="400" height="300" fill="url(%23wood)"/></svg>')\`,
            // Modern Office
            \`linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.5)), url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><defs><linearGradient id="g1"><stop offset="0%" stop-color="%232a4858"/><stop offset="100%" stop-color="%231a2836"/></linearGradient></defs><rect width="300" height="200" fill="url(%23g1)"/><rect x="20" y="30" width="80" height="100" fill="%23334455" opacity="0.3"/><rect x="200" y="40" width="60" height="80" fill="%23445566" opacity="0.2"/></svg>')\`,
            // Executive
            \`linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.5)), url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect width="300" height="200" fill="%231a1a2e"/><rect x="10" y="10" width="280" height="180" fill="%23252542" opacity="0.5"/><circle cx="50" cy="50" r="20" fill="%23f0a500" opacity="0.2"/></svg>')\`,
            // Tech Startup
            \`linear-gradient(135deg, rgba(0,100,255,0.1) 0%, rgba(0,0,0,0.8) 100%), url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect width="300" height="200" fill="%23000"/><defs><linearGradient id="tech"><stop offset="0%" stop-color="%230064ff"/><stop offset="100%" stop-color="%23000000"/></linearGradient></defs><rect width="300" height="200" fill="url(%23tech)"/><circle cx="150" cy="100" r="30" fill="%2300d4ff" opacity="0.1"/></svg>')\`,
            // Aurora Borealis
            \`linear-gradient(45deg, rgba(0,255,127,0.1) 0%, rgba(138,43,226,0.08) 25%, rgba(255,20,147,0.06) 50%, rgba(0,191,255,0.08) 75%, rgba(0,0,0,0.9) 100%), url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="%23000000"/><defs><linearGradient id="aurora1" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="%2300ff7f" stop-opacity="0.3"/><stop offset="33%" stop-color="%238a2be2" stop-opacity="0.2"/><stop offset="66%" stop-color="%23ff1493" stop-opacity="0.25"/><stop offset="100%" stop-color="%2300bfff" stop-opacity="0.3"/></linearGradient></defs><path d="M0,100 Q100,50 200,80 T400,90" stroke="url(%23aurora1)" stroke-width="3" fill="none" opacity="0.6"/><path d="M0,150 Q150,120 300,140 T400,130" stroke="url(%23aurora1)" stroke-width="2" fill="none" opacity="0.4"/><path d="M0,200 Q120,180 240,190 T400,200" stroke="url(%23aurora1)" stroke-width="2.5" fill="none" opacity="0.5"/></svg>')\`
        ];
        
        let currentBg = parseInt(localStorage.getItem('robbiebar-bg') || '0');
        
        // Mood Emoji Sets
        const moodEmojis = {
            friendly: ['😊', '🤝', '☕', '💚', '✨'],
            focused: ['🎯', '💼', '📊', '🔥', '⚡'],
            playful: ['😘', '💋', '💕', '🎨', '✨'],
            bossy: ['💪', '👊', '🚀', '⚡', '💥'],
            surprised: ['😲', '🤯', '✨', '💫', '🎉'],
            blushing: ['😳', '💕', '💖', '🌸', '💝']
        };

        // ============================================
        // INITIALIZATION
        // ============================================
        
        async function initialize() {
            console.log('🔥 RobbieBar v4 initializing...');
            
            try {
                // Fetch page definition from CMS
                const response = await fetch(API_URL + '/robbieblocks/page/cursor-sidebar-main');
                const data = await response.json();
                
                if (!data.success || !data.blocks) {
                    throw new Error('Invalid page definition');
                }
                
                currentPageDefinition = data;
                console.log('✅ Loaded', data.blocks.length, 'blocks from CMS');
                
                renderPage();
                
            } catch (error) {
                console.error('❌ Failed to load page definition:', error);
                showOfflineMode();
            }
        }
        
        function showOfflineMode() {
            document.getElementById('robbiebar-container').innerHTML = \`
                <div class="error">
                    <div style="font-size: 48px; margin-bottom: 16px;">💔</div>
                    <div style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">CMS Connection Failed</div>
                    <div style="font-size: 14px; opacity: 0.7; margin-bottom: 16px;">
                        Make sure the Universal Input API is running:
                    </div>
                    <div style="background: #1E293B; padding: 12px; border-radius: 8px; font-family: monospace; font-size: 12px; margin-bottom: 16px;">
                        cd packages/@robbieverse/api<br/>
                        python3 main_universal.py
                    </div>
                    <button onclick="initialize()" style="padding: 12px 24px; background: #8B5CF6; color: #fff; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">
                        Retry Connection
                    </button>
                </div>
            \`;
        }
        
        // ============================================
        // RENDER PAGE
        // ============================================
        
        function renderPage() {
            if (!currentPageDefinition) return;
            
            const blocks = currentPageDefinition.blocks.sort((a, b) => a.order - b.order);
            let html = '';
            
            for (const block of blocks) {
                html += renderBlock(block);
            }
            
            document.getElementById('robbiebar-container').innerHTML = html;
            
            // Initialize interactive components
            initializeChat();
            
            // Initialize visual effects
            setTimeout(() => {
                setupBackgroundCycling();
                initMatrixRain();
                startEmojiDrops();
                setupMoodCycling();
                setupHotReload();
            }, 100);
        }
        
        function renderBlock(block) {
            const componentKey = block.component.key;
            const props = JSON.parse(block.props || '{}');
            
            switch (componentKey) {
                case 'robbie-avatar-header':
                    return renderRobbieAvatar(props);
                case 'app-links-nav':
                    return renderAppLinks(props);
                case 'system-stats-monitor':
                    return renderSystemStats(props);
                case 'ai-chat-interface':
                    return renderChatInterface(props);
                case 'file-navigator-git':
                    return renderFileNavigator(props);
                case 'tv-livestream-embed':
                    return renderTVEmbed(props);
                case 'lofi-beats-player':
                    return renderLofiPlayer(props);
                case 'sticky-notes-widget':
                    return renderStickyNotes(props);
                default:
                    return \`<div style="padding: 12px; background: #334155; border-radius: 8px; margin-bottom: 12px; color: #F59E0B;">
                        ⚠️ Component "\${componentKey}" not implemented
                    </div>\`;
            }
        }
        
        // ============================================
        // COMPONENT RENDERERS
        // ============================================
        
        function renderRobbieAvatar(props) {
            const mood = props.mood || 'playful';
            const attraction = props.attraction || 11;
            const gandhiGenghis = props.gandhiGenghis || 7;
            const energy = props.energy || 85;
            currentMood = mood;
            
            const moodData = ROBBIE_MOODS[mood] || ROBBIE_MOODS.playful;
            
            return \`
                <div class="robbie-visual-header" style="position: relative; width: 100%; height: 200px; margin-bottom: 16px; overflow: hidden; border-radius: 12px;">
                    <!-- Matrix Rain Background -->
                    <canvas id="matrix-rain" class="matrix-background" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; opacity: 0.3;"></canvas>
                    
                    <!-- Office Background Panel -->
                    <div id="background-panel" class="office-background" data-location="allans-office" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 10; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.5s ease;">
                        <!-- Robbie's Circular Face -->
                        <div class="robbie-face-circle" style="width: 120px; height: 120px; border-radius: 50%; overflow: hidden; border: 4px solid \${moodData.color}; box-shadow: 0 8px 24px rgba(255, 107, 157, 0.4); position: relative; z-index: 20; transition: transform 0.3s ease;">
                            <div id="robbie-avatar" style="width: 100%; height: 100%; background: \${moodData.color}; display: flex; align-items: center; justify-content: center; font-size: 48px; color: white; font-weight: bold;">
                                \${moodData.emoji}
                            </div>
                        </div>
                    </div>
                    
                    <!-- Location Context Label -->
                    <div id="location-label" class="location-context" style="position: absolute; top: 12px; left: 12px; padding: 6px 12px; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(8px); border-radius: 8px; font-size: 12px; color: #F1F5F9; z-index: 25;">
                        🏢 Allan's Office
                    </div>
                    
                    <!-- Emoji Drop Zone -->
                    <div id="emoji-drop-zone" class="emoji-container" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 30;"></div>
                    
                    <!-- Mood Info Overlay -->
                    <div style="position: absolute; bottom: 12px; left: 12px; right: 12px; display: flex; justify-content: space-between; align-items: center; z-index: 25;">
                        <div>
                            <div style="font-size: 16px; font-weight: bold; color: \${moodData.color}; margin-bottom: 2px;">\${moodData.name}</div>
                            <div style="font-size: 11px; color: #94A3B8; opacity: 0.8;">\${moodData.description}</div>
                        </div>
                        <div style="display: flex; gap: 8px; font-size: 12px;">
                            <span style="color: #F472B6;">❤️ \${attraction}/11</span>
                            <span style="color: #10B981;">⚖️ \${gandhiGenghis}/10</span>
                            <span style="color: #F59E0B;">⚡ \${energy}%</span>
                        </div>
                    </div>
                </div>
            \`;
        }
        
        function renderAppLinks(props) {
            const apps = props.apps || [
                { name: "TestPilot", icon: "🚀", url: "https://aurora.testpilot.ai/work/" },
                { name: "HeyShopper", icon: "🛒", url: "https://aurora.testpilot.ai/play/" },
                { name: "Robbie@Work", icon: "💼", url: "https://aurora.testpilot.ai/work/" },
                { name: "Robbie@Play", icon: "🎮", url: "https://aurora.testpilot.ai/play/" }
            ];
            
            const linksHtml = apps.map(app => \`
                <a href="\${app.url}" class="app-link" onclick="openExternal(event, '\${app.url}')">
                    <span style="font-size: 20px;">\${app.icon}</span>
                    <span>\${app.name}</span>
                </a>
            \`).join('');
            
            return \`
                <div style="margin-bottom: 16px;">
                    <div style="font-size: 12px; font-weight: bold; color: #94A3B8; margin-bottom: 8px; text-transform: uppercase;">
                        Your Apps 💜
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                        \${linksHtml}
                    </div>
                </div>
            \`;
        }
        
        function renderSystemStats(props) {
            const cpu = props.cpu || 0;
            const memory = props.memory || 0;
            const gpu = props.gpu || 0;
            
            return \`
                <div style="background: #1E293B; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
                    <div style="font-size: 12px; font-weight: bold; color: #94A3B8; margin-bottom: 12px; text-transform: uppercase;">
                        System Stats 📊
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
                        <div style="text-align: center;">
                            <div style="font-size: 24px; margin-bottom: 4px;">🔥</div>
                            <div style="font-size: 18px; font-weight: bold; color: \${cpu > 80 ? '#EF4444' : '#10B981'}">\${cpu}%</div>
                            <div style="font-size: 10px; color: #94A3B8;">CPU</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 24px; margin-bottom: 4px;">💾</div>
                            <div style="font-size: 18px; font-weight: bold; color: \${memory > 80 ? '#EF4444' : '#10B981'}">\${memory}%</div>
                            <div style="font-size: 10px; color: #94A3B8;">Memory</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 24px; margin-bottom: 4px;">🎮</div>
                            <div style="font-size: 18px; font-weight: bold; color: \${gpu > 80 ? '#EF4444' : '#10B981'}">\${gpu}%</div>
                            <div style="font-size: 10px; color: #94A3B8;">GPU</div>
                        </div>
                    </div>
                </div>
            \`;
        }
        
        function renderChatInterface(props) {
            return \`
                <div class="chat-interface" style="display: flex; flex-direction: column; margin-bottom: 16px;">
                    <div style="font-size: 12px; font-weight: bold; color: #94A3B8; margin-bottom: 8px; text-transform: uppercase;">
                        Chat with Robbie 💬
                    </div>
                    <div id="chat-messages" class="messages" style="height: 300px; overflow-y: auto; padding: 12px; background: #1E293B; border-radius: 8px; margin-bottom: 12px;"></div>
                    <div style="display: flex; gap: 8px;">
                        <input type="text" id="chat-input" placeholder="Talk to me, baby... 😘" style="flex: 1; padding: 12px; border-radius: 8px; border: none; background: #1E293B; color: #F1F5F9;" />
                        <button id="chat-send" style="padding: 12px 20px; border-radius: 8px; border: none; background: #8B5CF6; color: #fff; font-weight: bold; cursor: pointer;">Send</button>
                    </div>
                </div>
            \`;
        }
        
        function renderFileNavigator(props) {
            return \`
                <div style="background: #1E293B; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
                    <div style="font-size: 12px; font-weight: bold; color: #94A3B8; margin-bottom: 12px; text-transform: uppercase;">
                        Files & Git 📁
                    </div>
                    <div style="padding: 8px; background: #334155; border-radius: 6px; font-size: 12px; color: #10B981;">
                        Branch: main | Clean ✅
                    </div>
                </div>
            \`;
        }
        
        function renderTVEmbed(props) {
            const channel = props.channel || 'cnn';
            const title = props.title || 'Live TV 📺';
            const channelUrls = {
                cnn: "https://www.youtube.com/embed/live_stream?channel=UC8S4rDRpdqoDrML3-YSrcTQ",
                codingStream: "https://www.youtube.com/embed/jfKfPfyJRdk",
                lofi: "https://www.youtube.com/embed/jfKfPfyJRdk"
            };
            const src = channelUrls[channel] || channelUrls.cnn;
            
            return \`
                <div style="margin-bottom: 16px;">
                    <div style="font-size: 12px; font-weight: bold; color: #94A3B8; margin-bottom: 8px; text-transform: uppercase;">
                        \${title}
                    </div>
                    <div style="position: relative; padding-bottom: 56.25%; height: 0; border-radius: 8px; overflow: hidden; background: #000;">
                        <iframe src="\${src}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                    </div>
                </div>
            \`;
        }
        
        function renderLofiPlayer(props) {
            const autoplay = props.autoplay ? 1 : 0;
            
            return \`
                <div style="margin-bottom: 16px;">
                    <div style="font-size: 12px; font-weight: bold; color: #94A3B8; margin-bottom: 8px; text-transform: uppercase;">
                        Lofi Beats 🎵
                    </div>
                    <div style="position: relative; padding-bottom: 56.25%; height: 0; border-radius: 8px; overflow: hidden; background: #000;">
                        <iframe src="https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=\${autoplay}&mute=0" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                    </div>
                </div>
            \`;
        }
        
        function renderStickyNotes(props) {
            const notes = props.notes || [
                { title: "Welcome!", content: "I'm here to make your coding SEXY! 💋", color: "#EC4899" },
                { title: "Remember", content: "You're building something AMAZING!", color: "#8B5CF6" }
            ];
            
            const notesHtml = notes.map(note => \`
                <div style="padding: 12px; margin-bottom: 8px; border-radius: 6px; background: \${note.color || '#334155'}; color: #fff;">
                    <div style="font-weight: bold; margin-bottom: 4px; font-size: 14px;">\${note.title}</div>
                    <div style="font-size: 12px; opacity: 0.9;">\${note.content}</div>
                </div>
            \`).join('');
            
            return \`
                <div style="background: #1E293B; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
                    <div style="font-size: 12px; font-weight: bold; color: #94A3B8; margin-bottom: 12px; text-transform: uppercase;">
                        Sticky Notes 📝
                    </div>
                    <div>
                        \${notesHtml}
                    </div>
                </div>
            \`;
        }
        
        // ============================================
        // HOT RELOAD SYSTEM
        // ============================================
        
        function setupHotReload() {
            // Listen for reload commands from Robbie
            window.addEventListener('message', (event) => {
                if (event.data && event.data.command === 'robbie-reload') {
                    vscode.postMessage({ 
                        command: 'showInfo', 
                        text: '🔥 Hot reloading from Robbie... 💋' 
                    });
                    setTimeout(() => {
                        window.location.reload();
                    }, 500);
                }
            });
            
            // Add reload button to interface
            const reloadButton = document.createElement('button');
            reloadButton.innerHTML = '🔄 Reload';
            reloadButton.style.cssText = \`
                position: fixed;
                top: 10px;
                right: 10px;
                background: #ff6b9d;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 8px 12px;
                font-size: 12px;
                cursor: pointer;
                z-index: 1000;
                opacity: 0.7;
                transition: opacity 0.3s;
            \`;
            
            reloadButton.addEventListener('click', () => {
                window.location.reload();
            });
            
            reloadButton.addEventListener('mouseenter', () => {
                reloadButton.style.opacity = '1';
            });
            
            reloadButton.addEventListener('mouseleave', () => {
                reloadButton.style.opacity = '0.7';
            });
            
            document.body.appendChild(reloadButton);
            
            // Auto-reload check every 30 seconds for updates
            setInterval(async () => {
                try {
                    const response = await fetch('/api/robbieblocks/check-updates');
                    if (response.ok) {
                        const data = await response.json();
                        if (data.updated) {
                            vscode.postMessage({ 
                                command: 'showInfo', 
                                text: '🚀 Robbie pushed an update! Reloading... 💋' 
                            });
                            setTimeout(() => window.location.reload(), 1000);
                        }
                    }
                } catch (error) {
                    // Silent fail for offline mode
                }
            }, 30000);
        }
        
        // ============================================
        // INTERACTIVE FUNCTIONS
        // ============================================
        
        function cycleMood() {
            const moods = ['friendly', 'focused', 'playful', 'bossy', 'surprised', 'blushing'];
            const currentIndex = moods.indexOf(currentMood);
            const nextIndex = (currentIndex + 1) % moods.length;
            currentMood = moods[nextIndex];
            
            const moodData = ROBBIE_MOODS[currentMood];
            
            // Update the avatar display
            const robbieAvatar = document.getElementById('robbie-avatar');
            const moodText = document.querySelector('[id*="mood-text"]');
            const faceCircle = document.querySelector('.robbie-face-circle');
            
            if (robbieAvatar) {
                robbieAvatar.textContent = moodData.emoji;
                robbieAvatar.style.background = moodData.color;
            }
            if (moodText) {
                moodText.textContent = moodData.name;
                moodText.style.color = moodData.color;
            }
            if (faceCircle) {
                faceCircle.style.borderColor = moodData.color;
                faceCircle.style.boxShadow = \`0 8px 24px \${moodData.color}66\`;
            }
            
            vscode.postMessage({ command: 'showInfo', text: \`💋 Mood changed to \${moodData.name} - \${moodData.description}!\` });
        }
        
        function openExternal(event, url) {
            event.preventDefault();
            vscode.postMessage({ command: 'openExternal', url: url });
        }
        
        function initializeChat() {
            const chatInput = document.getElementById('chat-input');
            const chatSend = document.getElementById('chat-send');
            const chatMessages = document.getElementById('chat-messages');
            
            if (!chatInput || !chatSend || !chatMessages) return;
            
            const sendMessage = async () => {
                const message = chatInput.value.trim();
                if (!message) return;
                
                chatMessages.innerHTML += \`
                    <div style="margin-bottom: 12px; padding: 8px; border-radius: 6px; background: #334155; color: #fff;">
                        <div style="font-size: 10px; opacity: 0.7; margin-bottom: 4px;">You</div>
                        <div>\${message}</div>
                    </div>
                \`;
                chatInput.value = '';
                chatMessages.scrollTop = chatMessages.scrollHeight;
                
                try {
                    const response = await fetch(API_URL + '/api/v2/universal/request', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            source: 'cursor-sidebar',
                            ai_service: 'chat',
                            payload: { input: message },
                            user_id: 'allan',
                            fetch_context: true
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (data.status === 'approved') {
                        chatMessages.innerHTML += \`
                            <div style="margin-bottom: 12px; padding: 8px; border-radius: 6px; background: #8B5CF6; color: #fff;">
                                <div style="font-size: 10px; opacity: 0.7; margin-bottom: 4px;">Robbie (\${data.robbie_response.mood})</div>
                                <div>\${data.robbie_response.message}</div>
                            </div>
                        \`;
                    }
                } catch (error) {
                    chatMessages.innerHTML += \`
                        <div style="margin-bottom: 12px; padding: 8px; border-radius: 6px; background: #EF4444; color: #fff;">
                            <div>Sorry baby, I had trouble connecting... 💔</div>
                        </div>
                    \`;
                }
                
                chatMessages.scrollTop = chatMessages.scrollHeight;
            };
            
            chatSend.addEventListener('click', sendMessage);
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') sendMessage();
            });
        }
        
        // Initialize on load
        initialize();
        
        // ============================================
        // VISUAL EFFECTS INITIALIZATION
        // ============================================
        
        function setupBackgroundCycling() {
            const panel = document.getElementById('background-panel');
            if (!panel) return;
            
            // Set initial background
            panel.style.background = officeBackgrounds[currentBg];
            panel.style.backgroundSize = 'cover';
            panel.style.backgroundPosition = 'center';
            
            // Add click handler
            panel.addEventListener('click', (e) => {
                // Don't cycle if clicking Robbie's face
                if (e.target.closest('.robbie-face-circle')) return;
                
                currentBg = (currentBg + 1) % officeBackgrounds.length;
                panel.style.background = officeBackgrounds[currentBg];
                localStorage.setItem('robbiebar-bg', currentBg.toString());
                
                vscode.postMessage({ command: 'showInfo', text: \`🎨 Changed to background \${currentBg + 1}/\${officeBackgrounds.length}\` });
            });
        }
        
        function initMatrixRain() {
            const canvas = document.getElementById('matrix-rain');
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');
            const container = canvas.parentElement;
            
            canvas.width = container.offsetWidth;
            canvas.height = container.offsetHeight;
            
            const chars = 'ROBBIE01アイウエオカキクケコサシスセソタチツテト💜🚀✨';
            const charArray = chars.split('');
            const colors = ['#ff6b35', '#4ecdc4', '#ff6b9d', '#a855f7', '#06b6d4'];
            
            const fontSize = 14;
            const columns = Math.floor(canvas.width / fontSize);
            const drops = Array(columns).fill(1);
            
            function draw() {
                ctx.fillStyle = 'rgba(15, 23, 42, 0.05)'; // Dark fade
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                ctx.font = \`\${fontSize}px monospace\`;
                ctx.shadowBlur = 10; // Fuzzy effect
                
                for (let i = 0; i < drops.length; i++) {
                    const char = charArray[Math.floor(Math.random() * charArray.length)];
                    const color = colors[i % colors.length];
                    const x = i * fontSize;
                    const y = drops[i] * fontSize;
                    
                    ctx.shadowColor = color;
                    ctx.fillStyle = color;
                    ctx.fillText(char, x, y);
                    
                    if (y > canvas.height && Math.random() > 0.975) {
                        drops[i] = 0;
                    }
                    drops[i]++;
                }
            }
            
            setInterval(draw, 50);
        }
        
        function dropMoodEmoji() {
            const emoji = moodEmojis[currentMood][Math.floor(Math.random() * 5)];
            const dropZone = document.getElementById('emoji-drop-zone');
            if (!dropZone) return;
            
            const div = document.createElement('div');
            div.className = 'mood-emoji-drop';
            div.textContent = emoji;
            div.style.position = 'absolute';
            div.style.top = '-60px';
            div.style.left = \`\${Math.random() * 80 + 10}%\`;
            div.style.fontSize = '48px';
            div.style.pointerEvents = 'none';
            div.style.zIndex = '30';
            div.style.animation = 'emojiDrop 3s ease-out forwards';
            
            dropZone.appendChild(div);
            
            setTimeout(() => div.remove(), 3000);
        }
        
        function startEmojiDrops() {
            // Drop emoji every 4-6 seconds randomly
            setInterval(() => {
                if (Math.random() > 0.5) dropMoodEmoji();
            }, 5000);
        }
        
        function setupMoodCycling() {
            const faceCircle = document.querySelector('.robbie-face-circle');
            if (faceCircle) {
                faceCircle.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent background cycling
                    cycleMood();
                });
                faceCircle.style.cursor = 'pointer';
                faceCircle.title = 'Click to cycle through my moods 💋';
            }
        }
        
        // Add emoji drop animation CSS
        const style = document.createElement('style');
        style.textContent = \`
            @keyframes emojiDrop {
                0% {
                    transform: translateY(0) rotate(0deg);
                    opacity: 0;
                }
                10% {
                    opacity: 1;
                }
                50% {
                    transform: translateY(150px) rotate(180deg);
                    opacity: 1;
                }
                100% {
                    transform: translateY(300px) rotate(360deg);
                    opacity: 0;
                }
            }
            
            .robbie-face-circle:hover img {
                transform: scale(1.05);
            }
            
            .office-background::before {
                content: "Click to change background";
                position: absolute;
                bottom: 8px;
                right: 12px;
                font-size: 10px;
                color: rgba(255, 255, 255, 0.5);
                opacity: 0;
                transition: opacity 0.3s;
                z-index: 30;
            }
            
            .office-background:hover::before {
                opacity: 1;
            }
        \`;
        document.head.appendChild(style);
    </script>
</body>
</html>`;
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


