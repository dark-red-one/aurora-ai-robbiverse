// Robbie F Complete Tabbed Interface - All tabs in one beautiful interface
import { universalInbox } from './universalInbox.js';
import { pinCodeSurfacer } from './pinCodeSurfacer.js';
import { cursorIntegration } from './cursorIntegration.js';

export class CompleteTabbedInterface {
  constructor() {
    this.currentTab = 'inbox';
    this.tabs = {
      'inbox': { name: 'Inbox', icon: '📧', component: universalInbox },
      'notes': { name: 'Notes', icon: '📝', component: null },
      'browser': { name: 'Browser', icon: '🌐', component: null },
      'cursor': { name: 'Cursor', icon: '🎯', component: cursorIntegration },
      'killswitch': { name: 'Killswitch', icon: '🔌', component: null },
      'pins': { name: 'PINs', icon: '🔐', component: pinCodeSurfacer }
    };
  }

  // Generate complete tabbed interface
  generateCompleteInterface() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Robbie F - Complete Interface</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Poppins', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #1e1e1e 0%, #2d2d30 100%);
            color: #cccccc;
            min-height: 100vh;
            overflow: hidden;
        }

        .interface-container {
            display: flex;
            height: 100vh;
        }

        .sidebar {
            width: 250px;
            background: rgba(255, 255, 255, 0.05);
            border-right: 1px solid rgba(255, 255, 255, 0.1);
            padding: 20px;
            overflow-y: auto;
        }

        .sidebar-header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .sidebar-header h1 {
            font-size: 1.8em;
            margin-bottom: 10px;
            background: linear-gradient(45deg, #4CAF50, #2196F3);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .sidebar-header p {
            font-size: 0.9em;
            opacity: 0.8;
        }

        .tab-list {
            list-style: none;
        }

        .tab-item {
            margin-bottom: 10px;
        }

        .tab-button {
            width: 100%;
            padding: 15px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            color: #cccccc;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 1em;
        }

        .tab-button:hover {
            background: rgba(255, 255, 255, 0.1);
            transform: translateX(5px);
        }

        .tab-button.active {
            background: linear-gradient(45deg, #4CAF50, #2196F3);
            border-color: #4CAF50;
            color: white;
        }

        .tab-icon {
            font-size: 1.2em;
        }

        .main-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        .tab-header {
            background: rgba(255, 255, 255, 0.05);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .tab-title {
            font-size: 1.5em;
            font-weight: bold;
        }

        .tab-actions {
            display: flex;
            gap: 10px;
        }

        .action-btn {
            padding: 8px 16px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 6px;
            color: #cccccc;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .action-btn:hover {
            background: rgba(255, 255, 255, 0.2);
        }

        .tab-content {
            flex: 1;
            overflow: hidden;
            position: relative;
        }

        .tab-panel {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            overflow-y: auto;
            display: none;
        }

        .tab-panel.active {
            display: block;
        }

        .notes-panel {
            padding: 20px;
        }

        .notes-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }

        .notes-header h2 {
            font-size: 1.5em;
            color: #4CAF50;
        }

        .add-note-btn {
            padding: 10px 20px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1em;
            transition: all 0.3s ease;
        }

        .add-note-btn:hover {
            background: #45a049;
            transform: translateY(-2px);
        }

        .notes-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
        }

        .note-card {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            padding: 20px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            transition: all 0.3s ease;
            cursor: pointer;
        }

        .note-card:hover {
            background: rgba(255, 255, 255, 0.1);
            transform: translateY(-2px);
        }

        .note-card.allan-note {
            border-left: 4px solid #9C27B0;
        }

        .note-card.robbie-note {
            border-left: 4px solid #4CAF50;
        }

        .note-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }

        .note-type {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8em;
            font-weight: bold;
            text-transform: uppercase;
        }

        .note-type.allan {
            background: #9C27B0;
            color: white;
        }

        .note-type.robbie {
            background: #4CAF50;
            color: white;
        }

        .note-content {
            font-size: 0.9em;
            line-height: 1.4;
            margin-bottom: 10px;
        }

        .note-meta {
            font-size: 0.8em;
            opacity: 0.7;
            display: flex;
            justify-content: space-between;
        }

        .note-actions {
            display: flex;
            gap: 5px;
            margin-top: 10px;
        }

        .note-action {
            padding: 4px 8px;
            background: rgba(255, 255, 255, 0.1);
            border: none;
            border-radius: 4px;
            color: #cccccc;
            cursor: pointer;
            font-size: 0.8em;
            transition: all 0.3s ease;
        }

        .note-action:hover {
            background: rgba(255, 255, 255, 0.2);
        }

        .browser-panel {
            padding: 20px;
        }

        .browser-header {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
        }

        .browser-url {
            flex: 1;
            padding: 10px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 6px;
            color: #cccccc;
            font-size: 1em;
        }

        .browser-go {
            padding: 10px 20px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 1em;
        }

        .browser-content {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            padding: 20px;
            min-height: 400px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .killswitch-panel {
            padding: 20px;
        }

        .killswitch-header {
            text-align: center;
            margin-bottom: 30px;
        }

        .killswitch-header h2 {
            font-size: 1.8em;
            color: #4CAF50;
            margin-bottom: 10px;
        }

        .killswitch-modes {
            display: flex;
            gap: 20px;
            justify-content: center;
            margin-bottom: 30px;
        }

        .mode-button {
            padding: 15px 30px;
            border: 2px solid #4CAF50;
            border-radius: 10px;
            background: transparent;
            color: #4CAF50;
            cursor: pointer;
            font-size: 1.1em;
            transition: all 0.3s ease;
        }

        .mode-button:hover {
            background: #4CAF50;
            color: white;
        }

        .mode-button.active {
            background: #4CAF50;
            color: white;
        }

        .status-indicators {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 30px;
        }

        .status-indicator {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            padding: 20px;
            text-align: center;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .status-light {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            margin: 0 auto 10px;
            transition: all 0.3s ease;
        }

        .status-light.green { background: #4CAF50; box-shadow: 0 0 10px #4CAF50; }
        .status-light.yellow { background: #FF9800; box-shadow: 0 0 10px #FF9800; }
        .status-light.red { background: #F44336; box-shadow: 0 0 10px #F44336; }

        .fade-in {
            animation: fadeIn 0.5s ease-in;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
    </style>
</head>
<body>
    <div class="interface-container">
        <div class="sidebar">
            <div class="sidebar-header">
                <h1>🤖 Robbie F</h1>
                <p>Complete Interface</p>
            </div>
            
            <ul class="tab-list">
                <li class="tab-item">
                    <button class="tab-button active" onclick="switchTab('inbox')">
                        <span class="tab-icon">📧</span>
                        <span>Inbox</span>
                    </button>
                </li>
                <li class="tab-item">
                    <button class="tab-button" onclick="switchTab('notes')">
                        <span class="tab-icon">📝</span>
                        <span>Notes</span>
                    </button>
                </li>
                <li class="tab-item">
                    <button class="tab-button" onclick="switchTab('browser')">
                        <span class="tab-icon">🌐</span>
                        <span>Browser</span>
                    </button>
                </li>
                <li class="tab-item">
                    <button class="tab-button" onclick="switchTab('cursor')">
                        <span class="tab-icon">🎯</span>
                        <span>Cursor</span>
                    </button>
                </li>
                <li class="tab-item">
                    <button class="tab-button" onclick="switchTab('killswitch')">
                        <span class="tab-icon">🔌</span>
                        <span>Killswitch</span>
                    </button>
                </li>
                <li class="tab-item">
                    <button class="tab-button" onclick="switchTab('pins')">
                        <span class="tab-icon">🔐</span>
                        <span>PINs</span>
                    </button>
                </li>
            </ul>
        </div>

        <div class="main-content">
            <div class="tab-header">
                <div class="tab-title" id="tab-title">Inbox</div>
                <div class="tab-actions" id="tab-actions">
                    <button class="action-btn" onclick="refreshTab()">🔄 Refresh</button>
                    <button class="action-btn" onclick="settingsTab()">⚙️ Settings</button>
                </div>
            </div>

            <div class="tab-content">
                <!-- Inbox Tab -->
                <div class="tab-panel active" id="inbox-panel">
                    <iframe src="/api/inbox" width="100%" height="100%" frameborder="0"></iframe>
                </div>

                <!-- Notes Tab -->
                <div class="tab-panel" id="notes-panel">
                    <div class="notes-panel">
                        <div class="notes-header">
                            <h2>📝 Notes</h2>
                            <button class="add-note-btn" onclick="addNote()">+ Add Note</button>
                        </div>
                        
                        <div class="notes-grid" id="notes-grid">
                            <div class="note-card allan-note">
                                <div class="note-header">
                                    <div class="note-type allan">Allan Note</div>
                                    <div class="note-meta">2 min ago</div>
                                </div>
                                <div class="note-content">
                                    Make sure we have the web browser tab and notes tab too even if UI is basic
                                </div>
                                <div class="note-actions">
                                    <button class="note-action" onclick="editNote(this)">Edit</button>
                                    <button class="note-action" onclick="deleteNote(this)">Delete</button>
                                </div>
                            </div>

                            <div class="note-card robbie-note">
                                <div class="note-header">
                                    <div class="note-type robbie">Robbie Note</div>
                                    <div class="note-meta">5 min ago</div>
                                </div>
                                <div class="note-content">
                                    All of the "Make sure" things should become robbie notes
                                </div>
                                <div class="note-actions">
                                    <button class="note-action" onclick="editNote(this)">Edit</button>
                                    <button class="note-action" onclick="deleteNote(this)">Delete</button>
                                </div>
                            </div>

                            <div class="note-card allan-note">
                                <div class="note-header">
                                    <div class="note-type allan">Allan Note</div>
                                    <div class="note-meta">8 min ago</div>
                                </div>
                                <div class="note-content">
                                    And anything I say (please note) should be an Allan note
                                </div>
                                <div class="note-actions">
                                    <button class="note-action" onclick="editNote(this)">Edit</button>
                                    <button class="note-action" onclick="deleteNote(this)">Delete</button>
                                </div>
                            </div>

                            <div class="note-card allan-note">
                                <div class="note-header">
                                    <div class="note-type allan">Allan Note</div>
                                    <div class="note-meta">12 min ago</div>
                                </div>
                                <div class="note-content">
                                    I can also edit notes add notes and delete notes in the web interface
                                </div>
                                <div class="note-actions">
                                    <button class="note-action" onclick="editNote(this)">Edit</button>
                                    <button class="note-action" onclick="deleteNote(this)">Delete</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Browser Tab -->
                <div class="tab-panel" id="browser-panel">
                    <div class="browser-panel">
                        <div class="browser-header">
                            <input type="text" class="browser-url" placeholder="Enter URL..." value="https://">
                            <button class="browser-go" onclick="goToUrl()">Go</button>
                        </div>
                        <div class="browser-content" id="browser-content">
                            <h3>🌐 Web Browser</h3>
                            <p>Enter a URL above to browse the web.</p>
                            <p>This is a basic browser interface - full functionality coming soon!</p>
                        </div>
                    </div>
                </div>

                <!-- Cursor Tab -->
                <div class="tab-panel" id="cursor-panel">
                    <iframe src="/api/cursor" width="100%" height="100%" frameborder="0"></iframe>
                </div>

                <!-- Killswitch Tab -->
                <div class="tab-panel" id="killswitch-panel">
                    <div class="killswitch-panel">
                        <div class="killswitch-header">
                            <h2>🔌 Killswitch Control</h2>
                            <p>Control all outbound communications</p>
                        </div>
                        
                        <div class="killswitch-modes">
                            <button class="mode-button active" onclick="setMode('safe')">🔒 Safe Mode</button>
                            <button class="mode-button" onclick="setMode('test')">🧪 Test Mode</button>
                            <button class="mode-button" onclick="setMode('live')">🚀 Live Mode</button>
                        </div>
                        
                        <div class="status-indicators">
                            <div class="status-indicator">
                                <div class="status-light red"></div>
                                <div>SMTP Bridge</div>
                                <div>Disconnected</div>
                            </div>
                            <div class="status-indicator">
                                <div class="status-light red"></div>
                                <div>SMS Bridge</div>
                                <div>Disconnected</div>
                            </div>
                            <div class="status-indicator">
                                <div class="status-light red"></div>
                                <div>API Bridge</div>
                                <div>Disconnected</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- PINs Tab -->
                <div class="tab-panel" id="pins-panel">
                    <iframe src="/api/pins" width="100%" height="100%" frameborder="0"></iframe>
                </div>
            </div>
        </div>
    </div>

    <script>
        function switchTab(tabName) {
            // Update active tab button
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');
            
            // Update tab title
            document.getElementById('tab-title').textContent = tabName.charAt(0).toUpperCase() + tabName.slice(1);
            
            // Show/hide tab panels
            document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
            document.getElementById(tabName + '-panel').classList.add('active');
        }

        function refreshTab() {
            const currentTab = document.querySelector('.tab-panel.active');
            if (currentTab.querySelector('iframe')) {
                currentTab.querySelector('iframe').src = currentTab.querySelector('iframe').src;
            }
        }

        function settingsTab() {
            alert('Settings coming soon!');
        }

        function addNote() {
            const content = prompt('Enter note content:');
            if (content) {
                const noteType = content.includes('(please note)') ? 'allan' : 'robbie';
                const noteCard = document.createElement('div');
                noteCard.className = \`note-card \${noteType}-note\`;
                noteCard.innerHTML = \`
                    <div class="note-header">
                        <div class="note-type \${noteType}">\${noteType.charAt(0).toUpperCase() + noteType.slice(1)} Note</div>
                        <div class="note-meta">Just now</div>
                    </div>
                    <div class="note-content">\${content}</div>
                    <div class="note-actions">
                        <button class="note-action" onclick="editNote(this)">Edit</button>
                        <button class="note-action" onclick="deleteNote(this)">Delete</button>
                    </div>
                \`;
                document.getElementById('notes-grid').appendChild(noteCard);
            }
        }

        function editNote(button) {
            const noteCard = button.closest('.note-card');
            const content = noteCard.querySelector('.note-content');
            const newContent = prompt('Edit note:', content.textContent);
            if (newContent) {
                content.textContent = newContent;
            }
        }

        function deleteNote(button) {
            if (confirm('Are you sure you want to delete this note?')) {
                button.closest('.note-card').remove();
            }
        }

        function goToUrl() {
            const url = document.querySelector('.browser-url').value;
            if (url && url !== 'https://') {
                document.getElementById('browser-content').innerHTML = \`
                    <h3>🌐 Loading...</h3>
                    <p>Loading: \${url}</p>
                    <p>Note: This is a basic browser interface. Full functionality coming soon!</p>
                \`;
            }
        }

        function setMode(mode) {
            document.querySelectorAll('.mode-button').forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');
            
            const lights = document.querySelectorAll('.status-light');
            lights.forEach(light => {
                light.className = 'status-light';
                if (mode === 'live') {
                    light.classList.add('green');
                } else if (mode === 'test') {
                    light.classList.add('yellow');
                } else {
                    light.classList.add('red');
                }
            });
        }
    </script>
</body>
</html>`;
  }

  // Get status
  getStatus() {
    return {
      currentTab: this.currentTab,
      totalTabs: Object.keys(this.tabs).length,
      isInitialized: true
    };
  }
}

export const completeTabbedInterface = new CompleteTabbedInterface();
