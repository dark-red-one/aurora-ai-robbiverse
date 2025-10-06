// Robbie V3 Killswitch UI - Clean 3-position switch with real-time feedback
import fs from 'fs/promises';
import path from 'path';

export class KillswitchUI {
  constructor() {
    this.modes = {
      SAFE: { 
        name: 'SAFE MODE', 
        color: '#ff4444', 
        icon: '🔒',
        description: 'All outbound goes to Allan only'
      },
      TEST: { 
        name: 'TEST MODE', 
        color: '#ffaa00', 
        icon: '🧪',
        description: 'Test communications to Allan'
      },
      LIVE: { 
        name: 'LIVE MODE', 
        color: '#44ff44', 
        icon: '🚀',
        description: 'Real outbound communications'
      }
    };
    this.currentMode = 'SAFE';
    this.communicationLog = [];
    this.bridgeStatus = {
      smtp: { status: 'disconnected', lastActivity: null, success: false },
      sms: { status: 'disconnected', lastActivity: null, success: false },
      api: { status: 'disconnected', lastActivity: null, success: false }
    };
  }

  // Generate the killswitch interface
  generateInterface() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Robbie V3 Killswitch Control</title>
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
            overflow-x: hidden;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 15px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            background: linear-gradient(45deg, #4CAF50, #2196F3);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .header p {
            font-size: 1.2em;
            opacity: 0.8;
        }

        .killswitch-panel {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
        }

        .mode-selector {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 15px;
            padding: 30px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .mode-selector h2 {
            text-align: center;
            margin-bottom: 25px;
            font-size: 1.8em;
        }

        .mode-switch {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 10px;
            padding: 5px;
        }

        .step-controls {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 20px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .step-controls h3 {
            margin-bottom: 15px;
            text-align: center;
            color: #4CAF50;
        }

        .step-buttons {
            display: flex;
            gap: 10px;
            justify-content: center;
            margin-bottom: 15px;
        }

        .btn-step {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s ease;
            font-size: 1.1em;
        }

        .btn-step.primary {
            background: #4CAF50;
            color: white;
        }

        .btn-step.primary:hover {
            background: #45a049;
            transform: translateY(-2px);
        }

        .btn-step.secondary {
            background: #2196F3;
            color: white;
        }

        .btn-step.secondary:hover {
            background: #1976D2;
            transform: translateY(-2px);
        }

        .btn-step.danger {
            background: #F44336;
            color: white;
        }

        .btn-step.danger:hover {
            background: #D32F2F;
            transform: translateY(-2px);
        }

        .step-status {
            text-align: center;
            padding: 10px;
            border-radius: 8px;
            margin-bottom: 10px;
            font-weight: bold;
        }

        .step-status.waiting {
            background: rgba(255, 193, 7, 0.2);
            color: #FFC107;
            border: 1px solid #FFC107;
        }

        .step-status.processing {
            background: rgba(33, 150, 243, 0.2);
            color: #2196F3;
            border: 1px solid #2196F3;
        }

        .step-status.success {
            background: rgba(76, 175, 80, 0.2);
            color: #4CAF50;
            border: 1px solid #4CAF50;
        }

        .step-status.error {
            background: rgba(244, 67, 54, 0.2);
            color: #F44336;
            border: 1px solid #F44336;
        }

        .step-details {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 8px;
            padding: 15px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
            max-height: 200px;
            overflow-y: auto;
        }

        .slack-preview {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            padding: 20px;
            margin-top: 20px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .slack-message {
            background: #2c2d30;
            border-radius: 8px;
            padding: 15px;
            margin: 10px 0;
            border-left: 4px solid #4CAF50;
        }

        .slack-header {
            display: flex;
            align-items: center;
            margin-bottom: 8px;
        }

        .slack-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: #4CAF50;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 10px;
            font-weight: bold;
            color: white;
        }

        .slack-user {
            font-weight: bold;
            color: #4CAF50;
        }

        .slack-timestamp {
            color: #666;
            font-size: 0.8em;
            margin-left: 10px;
        }

        .slack-content {
            color: #cccccc;
            line-height: 1.4;
        }

        .slack-actions {
            display: flex;
            gap: 10px;
            margin-top: 10px;
        }

        .btn-slack {
            padding: 8px 16px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.9em;
            transition: all 0.3s ease;
        }

        .btn-slack.edit {
            background: #FF9800;
            color: white;
        }

        .btn-slack.send {
            background: #4CAF50;
            color: white;
        }

        .btn-slack.cancel {
            background: #F44336;
            color: white;
        }

        .mode-option {
            flex: 1;
            padding: 15px;
            text-align: center;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
            border: 2px solid transparent;
            position: relative;
        }

        .mode-option.active {
            background: var(--mode-color);
            color: white;
            border-color: var(--mode-color);
            box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
        }

        .mode-option:hover:not(.active) {
            background: rgba(255, 255, 255, 0.1);
            transform: translateY(-2px);
        }

        .mode-option .icon {
            font-size: 2em;
            margin-bottom: 8px;
            display: block;
        }

        .mode-option .name {
            font-weight: bold;
            font-size: 1.1em;
            margin-bottom: 5px;
        }

        .mode-option .description {
            font-size: 0.9em;
            opacity: 0.8;
        }

        .status-indicators {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-top: 20px;
        }

        .status-indicator {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            padding: 15px;
            text-align: center;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .status-indicator .bridge-name {
            font-weight: bold;
            margin-bottom: 8px;
        }

        .status-light {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            margin: 0 auto 8px;
            transition: all 0.3s ease;
        }

        .status-light.green { background: #4CAF50; box-shadow: 0 0 10px #4CAF50; }
        .status-light.yellow { background: #FF9800; box-shadow: 0 0 10px #FF9800; }
        .status-light.red { background: #F44336; box-shadow: 0 0 10px #F44336; }

        .bridge-status {
            font-size: 0.9em;
            opacity: 0.8;
        }

        .communication-log {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 15px;
            padding: 30px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .communication-log h2 {
            margin-bottom: 20px;
            font-size: 1.8em;
        }

        .log-controls {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
        }

        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s ease;
        }

        .btn-primary {
            background: #2196F3;
            color: white;
        }

        .btn-primary:hover {
            background: #1976D2;
            transform: translateY(-2px);
        }

        .btn-danger {
            background: #F44336;
            color: white;
        }

        .btn-danger:hover {
            background: #D32F2F;
            transform: translateY(-2px);
        }

        .log-entries {
            max-height: 400px;
            overflow-y: auto;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 10px;
            padding: 15px;
        }

        .log-entry {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 10px;
            border-left: 4px solid var(--entry-color);
            transition: all 0.3s ease;
        }

        .log-entry:hover {
            background: rgba(255, 255, 255, 0.1);
            transform: translateX(5px);
        }

        .log-entry-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }

        .log-entry-type {
            font-weight: bold;
            font-size: 1.1em;
        }

        .log-entry-time {
            font-size: 0.9em;
            opacity: 0.7;
        }

        .log-entry-details {
            font-size: 0.9em;
            opacity: 0.8;
            margin-bottom: 5px;
        }

        .log-entry-status {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8em;
            font-weight: bold;
        }

        .status-queued { background: #FF9800; color: white; }
        .status-sent { background: #4CAF50; color: white; }
        .status-failed { background: #F44336; color: white; }
        .status-blocked { background: #9E9E9E; color: white; }

        .stats-panel {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-bottom: 30px;
        }

        .stat-card {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            padding: 20px;
            text-align: center;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .stat-number {
            font-size: 2em;
            font-weight: bold;
            margin-bottom: 5px;
        }

        .stat-label {
            font-size: 0.9em;
            opacity: 0.8;
        }

        .real-time-indicator {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: #4CAF50;
            padding: 10px 15px;
            border-radius: 20px;
            font-size: 0.9em;
            border: 1px solid #4CAF50;
        }

        .real-time-indicator::before {
            content: "●";
            margin-right: 8px;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }

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
    <div class="real-time-indicator">LIVE</div>
    
    <div class="container">
        <div class="header fade-in">
            <h1>🔌 Robbie V3 Killswitch Control</h1>
            <p>Complete control over all outbound communications</p>
        </div>

        <div class="stats-panel fade-in">
            <div class="stat-card">
                <div class="stat-number" id="total-communications">0</div>
                <div class="stat-label">Total Communications</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="queued-communications">0</div>
                <div class="stat-label">Queued</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="successful-communications">0</div>
                <div class="stat-label">Successful</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="failed-communications">0</div>
                <div class="stat-label">Failed</div>
            </div>
        </div>

        <div class="killswitch-panel fade-in">
            <div class="mode-selector">
                <h2>🎛️ Mode Control</h2>
                <div class="mode-switch">
                    <div class="mode-option active" data-mode="SAFE" style="--mode-color: #ff4444;">
                        <span class="icon">🔒</span>
                        <div class="name">SAFE MODE</div>
                        <div class="description">All to Allan only</div>
                    </div>
                    <div class="mode-option" data-mode="TEST" style="--mode-color: #ffaa00;">
                        <span class="icon">🧪</span>
                        <div class="name">TEST MODE</div>
                        <div class="description">Test to Allan</div>
                    </div>
                    <div class="mode-option" data-mode="LIVE" style="--mode-color: #44ff44;">
                        <span class="icon">🚀</span>
                        <div class="name">LIVE MODE</div>
                        <div class="description">Real outbound</div>
                    </div>
                </div>
                
                <div class="step-controls">
                    <h3>🤖 Robbie F Step Mode</h3>
                    <div class="step-buttons">
                        <button class="btn-step primary" onclick="startStepMode()">▶️ Start Step Mode</button>
                        <button class="btn-step secondary" onclick="nextStep()">⏭️ Next Step</button>
                        <button class="btn-step danger" onclick="stopStepMode()">⏹️ Stop</button>
                    </div>
                    <div class="step-status waiting" id="step-status">Waiting for your command, Allan! 💕</div>
                    <div class="step-details" id="step-details">Ready to help you execute tasks step by step with full visibility and control!</div>
                </div>
                
                <div class="status-indicators">
                    <div class="status-indicator">
                        <div class="bridge-name">SMTP Bridge</div>
                        <div class="status-light red" id="smtp-light"></div>
                        <div class="bridge-status" id="smtp-status">Disconnected</div>
                    </div>
                    <div class="status-indicator">
                        <div class="bridge-name">SMS Bridge</div>
                        <div class="status-light red" id="sms-light"></div>
                        <div class="bridge-status" id="sms-status">Disconnected</div>
                    </div>
                    <div class="status-indicator">
                        <div class="bridge-name">API Bridge</div>
                        <div class="status-light red" id="api-light"></div>
                        <div class="bridge-status" id="api-status">Disconnected</div>
                    </div>
                </div>
            </div>

            <div class="communication-log">
                <h2>📋 Communication Log</h2>
                <div class="log-controls">
                    <button class="btn btn-primary" onclick="refreshLog()">🔄 Refresh</button>
                    <button class="btn btn-danger" onclick="clearLog()">🗑️ Clear Log</button>
                    <button class="btn btn-primary" onclick="exportLog()">📤 Export</button>
                </div>
                <div class="log-entries" id="log-entries">
                    <div class="log-entry" style="--entry-color: #4CAF50;">
                        <div class="log-entry-header">
                            <div class="log-entry-type">System Initialized</div>
                            <div class="log-entry-time">${new Date().toLocaleString()}</div>
                        </div>
                        <div class="log-entry-details">Killswitch system started in SAFE mode</div>
                        <span class="log-entry-status status-sent">Active</span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        let currentMode = 'SAFE';
        let communicationLog = [];
        let bridgeStatus = {
            smtp: { status: 'disconnected', success: false },
            sms: { status: 'disconnected', success: false },
            api: { status: 'disconnected', success: false }
        };

        // Mode switching
        document.querySelectorAll('.mode-option').forEach(option => {
            option.addEventListener('click', function() {
                const mode = this.dataset.mode;
                switchMode(mode);
            });
        });

        function switchMode(mode) {
            // Update UI
            document.querySelectorAll('.mode-option').forEach(opt => opt.classList.remove('active'));
            document.querySelector(\`[data-mode="\${mode}"]\`).classList.add('active');
            
            currentMode = mode;
            
            // Update bridge status based on mode
            updateBridgeStatus();
            
            // Add log entry
            addLogEntry('Mode Changed', \`Switched to \${mode} mode\`, 'system', 'sent');
            
            // Send to backend
            fetch('/api/killswitch/mode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode: mode })
            }).catch(err => console.error('Mode switch failed:', err));
        }

        function updateBridgeStatus() {
            const statuses = {
                'SAFE': { smtp: 'disconnected', sms: 'disconnected', api: 'disconnected' },
                'TEST': { smtp: 'connected', sms: 'connected', api: 'connected' },
                'LIVE': { smtp: 'connected', sms: 'connected', api: 'connected' }
            };
            
            const status = statuses[currentMode];
            Object.keys(status).forEach(bridge => {
                updateBridgeIndicator(bridge, status[bridge], currentMode === 'LIVE');
            });
        }

        function updateBridgeIndicator(bridge, status, isLive) {
            const light = document.getElementById(\`\${bridge}-light\`);
            const statusText = document.getElementById(\`\${bridge}-status\`);
            
            if (status === 'connected') {
                light.className = 'status-light ' + (isLive ? 'green' : 'yellow');
                statusText.textContent = isLive ? 'Live' : 'Test';
            } else {
                light.className = 'status-light red';
                statusText.textContent = 'Disconnected';
            }
        }

        function addLogEntry(type, details, category, status) {
            const entry = {
                id: Date.now(),
                type: type,
                details: details,
                category: category,
                status: status,
                timestamp: new Date().toLocaleString()
            };
            
            communicationLog.unshift(entry);
            renderLogEntries();
            updateStats();
        }

        function renderLogEntries() {
            const container = document.getElementById('log-entries');
            const entries = communicationLog.slice(0, 50); // Show last 50 entries
            
            container.innerHTML = entries.map(entry => {
                const colors = {
                    'email': '#2196F3',
                    'sms': '#FF9800',
                    'api': '#9C27B0',
                    'system': '#4CAF50'
                };
                
                return \`
                    <div class="log-entry" style="--entry-color: \${colors[entry.category] || '#666'};">
                        <div class="log-entry-header">
                            <div class="log-entry-type">\${entry.type}</div>
                            <div class="log-entry-time">\${entry.timestamp}</div>
                        </div>
                        <div class="log-entry-details">\${entry.details}</div>
                        <span class="log-entry-status status-\${entry.status}">\${entry.status.toUpperCase()}</span>
                    </div>
                \`;
            }).join('');
        }

        function updateStats() {
            const total = communicationLog.length;
            const queued = communicationLog.filter(e => e.status === 'queued').length;
            const successful = communicationLog.filter(e => e.status === 'sent').length;
            const failed = communicationLog.filter(e => e.status === 'failed').length;
            
            document.getElementById('total-communications').textContent = total;
            document.getElementById('queued-communications').textContent = queued;
            document.getElementById('successful-communications').textContent = successful;
            document.getElementById('failed-communications').textContent = failed;
        }

        function refreshLog() {
            fetch('/api/killswitch/log')
                .then(response => response.json())
                .then(data => {
                    communicationLog = data.log || [];
                    renderLogEntries();
                    updateStats();
                })
                .catch(err => console.error('Refresh failed:', err));
        }

        function clearLog() {
            if (confirm('Are you sure you want to clear the communication log?')) {
                communicationLog = [];
                renderLogEntries();
                updateStats();
                
                fetch('/api/killswitch/clear', { method: 'POST' })
                    .catch(err => console.error('Clear failed:', err));
            }
        }

        function exportLog() {
            const data = {
                mode: currentMode,
                timestamp: new Date().toISOString(),
                log: communicationLog
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = \`killswitch-log-\${new Date().toISOString().split('T')[0]}.json\`;
            a.click();
            URL.revokeObjectURL(url);
        }

        // Simulate real-time updates
        setInterval(() => {
            // Simulate occasional communications
            if (Math.random() < 0.1) {
                const types = ['Email', 'SMS', 'API Call'];
                const type = types[Math.floor(Math.random() * types.length)];
                const statuses = currentMode === 'SAFE' ? ['blocked'] : ['sent', 'queued'];
                const status = statuses[Math.floor(Math.random() * statuses.length)];
                
                addLogEntry(
                    \`\${type} Communication\`,
                    \`Test \${type.toLowerCase()} to recipient@example.com\`,
                    type.toLowerCase().replace(' ', ''),
                    status
                );
            }
        }, 5000);

        // Initialize
        updateBridgeStatus();
        updateStats();
    </script>
</body>
</html>`;
  }

  // Add communication to log
  addCommunication(type, details, category, status) {
    const entry = {
      id: Date.now(),
      type: type,
      details: details,
      category: category,
      status: status,
      timestamp: new Date().toISOString()
    };
    
    this.communicationLog.unshift(entry);
    
    // Keep only last 1000 entries
    if (this.communicationLog.length > 1000) {
      this.communicationLog = this.communicationLog.slice(0, 1000);
    }
    
    return entry;
  }

  // Get communication log
  getCommunicationLog() {
    return this.communicationLog;
  }

  // Clear communication log
  clearCommunicationLog() {
    this.communicationLog = [];
  }

  // Update bridge status
  updateBridgeStatus(bridge, status, success) {
    this.bridgeStatus[bridge] = {
      status: status,
      lastActivity: new Date().toISOString(),
      success: success
    };
  }

  // Get bridge status
  getBridgeStatus() {
    return this.bridgeStatus;
  }

  // Set current mode
  setMode(mode) {
    if (Object.keys(this.modes).includes(mode)) {
      this.currentMode = mode;
      return true;
    }
    return false;
  }

  // Get current mode
  getCurrentMode() {
    return this.currentMode;
  }
}

export const killswitchUI = new KillswitchUI();
