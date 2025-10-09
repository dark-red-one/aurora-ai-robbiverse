import { db } from "./db.js";
import { randomUUID } from "crypto";
import { directGPU } from "./directGPU.js";
import { workTracker } from "./workTracker.js";
import { characterFilter } from "./characterFilter.js";

// BBS/IRC Interface with Business/Startup Terminology
export class BBSInterface {
  constructor() {
    this.initializeTables();
    this.channels = this.getDefaultChannels();
    this.currentChannel = 'general';
    this.statusBar = {
      tokens: 0,
      cost: 0.0,
      time: 0,
      weather: '☀️'
    };
  }

  initializeTables() {
    // Channel messages
    db.prepare(`
      CREATE TABLE IF NOT EXISTS channel_messages (
        id TEXT PRIMARY KEY,
        channel TEXT NOT NULL,
        username TEXT NOT NULL,
        message TEXT NOT NULL,
        message_type TEXT DEFAULT 'text', -- 'text', 'system', 'action', 'error', 'success'
        metadata TEXT, -- JSON for additional data
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `).run();

    // Channel users
    db.prepare(`
      CREATE TABLE IF NOT EXISTS channel_users (
        id TEXT PRIMARY KEY,
        channel TEXT NOT NULL,
        username TEXT NOT NULL,
        status TEXT DEFAULT 'online', -- 'online', 'away', 'busy', 'offline'
        last_seen TEXT NOT NULL DEFAULT (datetime('now')),
        is_operator BOOLEAN DEFAULT FALSE
      )
    `).run();

    // Hashtags
    db.prepare(`
      CREATE TABLE IF NOT EXISTS hashtags (
        id TEXT PRIMARY KEY,
        tag TEXT NOT NULL UNIQUE,
        usage_count INTEGER DEFAULT 1,
        last_used TEXT NOT NULL DEFAULT (datetime('now')),
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `).run();

    // Indexes
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_channel_messages_channel ON channel_messages(channel, created_at)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_channel_users_channel ON channel_users(channel, status)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_hashtags_tag ON hashtags(tag)`).run();
  }

  getDefaultChannels() {
    return {
      'general': {
        name: 'General',
        description: 'General business discussion and strategy',
        hashtags: ['#strategy', '#growth', '#metrics', '#roi', '#scaling']
      },
      'product': {
        name: 'Product',
        description: 'Product development and roadmap discussions',
        hashtags: ['#mvp', '#features', '#roadmap', '#user-feedback', '#product-market-fit']
      },
      'sales': {
        name: 'Sales',
        description: 'Sales pipeline and customer acquisition',
        hashtags: ['#pipeline', '#leads', '#conversion', '#cac', '#ltv', '#churn']
      },
      'marketing': {
        name: 'Marketing',
        description: 'Marketing campaigns and growth hacking',
        hashtags: ['#campaigns', '#growth-hacking', '#content', '#seo', '#social-media']
      },
      'finance': {
        name: 'Finance',
        description: 'Financial planning and fundraising',
        hashtags: ['#burn-rate', '#runway', '#fundraising', '#valuation', '#revenue']
      },
      'tech': {
        name: 'Tech',
        description: 'Technical development and infrastructure',
        hashtags: ['#development', '#infrastructure', '#scalability', '#security', '#ai']
      },
      'robbie': {
        name: 'Robbie',
        description: 'AI copilot and automation discussions',
        hashtags: ['#ai', '#automation', '#efficiency', '#data-driven', '#optimization']
      }
    };
  }

  // Generate BBS/IRC interface HTML
  generateInterface() {
    return `<!doctype html>
<html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Vengeance BBS - TestPilot Command Center</title>
<style>
/* BBS/IRC Aesthetic with Business Focus */
:root {
  --bg-primary: #0a0a0a;
  --bg-secondary: #1a1a1a;
  --bg-tertiary: #2a2a2a;
  --text-primary: #00ff00;
  --text-secondary: #888888;
  --text-accent: #ffff00;
  --text-error: #ff0000;
  --text-success: #00ff00;
  --text-warning: #ffaa00;
  --border: #333333;
  --font-mono: 'Courier New', 'Monaco', 'Consolas', monospace;
}

* { box-sizing: border-box; margin: 0; padding: 0; }
body { 
  font-family: var(--font-mono);
  background: var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.4;
  overflow: hidden;
}

/* Status Bar */
.status-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 30px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  padding: 0 10px;
  font-size: 12px;
  z-index: 1000;
}

.status-item {
  margin-right: 20px;
  display: flex;
  align-items: center;
}

.status-label {
  color: var(--text-secondary);
  margin-right: 5px;
}

.status-value {
  color: var(--text-accent);
  font-weight: bold;
}

/* Channel Header */
.channel-header {
  position: fixed;
  top: 30px;
  left: 0;
  right: 0;
  height: 40px;
  background: var(--bg-tertiary);
  border-bottom: 2px solid var(--text-accent);
  display: flex;
  align-items: center;
  padding: 0 15px;
  z-index: 999;
}

.channel-name {
  font-size: 16px;
  font-weight: bold;
  color: var(--text-accent);
  margin-right: 10px;
}

.channel-topic {
  color: var(--text-secondary);
  font-size: 12px;
}

.channel-users {
  margin-left: auto;
  color: var(--text-secondary);
  font-size: 12px;
}

/* Main Content */
.main-content {
  position: fixed;
  top: 70px;
  left: 0;
  right: 0;
  bottom: 60px;
  overflow-y: auto;
  padding: 10px;
}

/* Message Styles */
.message {
  margin-bottom: 2px;
  font-size: 13px;
}

.message-timestamp {
  color: var(--text-secondary);
  margin-right: 8px;
}

.message-username {
  color: var(--text-accent);
  font-weight: bold;
  margin-right: 5px;
}

.message-text {
  color: var(--text-primary);
}

.message-system {
  color: var(--text-warning);
  font-style: italic;
}

.message-error {
  color: var(--text-error);
}

.message-success {
  color: var(--text-success);
}

.message-action {
  color: var(--text-warning);
  font-style: italic;
}

/* Hashtag Styles */
.hashtag {
  color: var(--text-accent);
  font-weight: bold;
  cursor: pointer;
}

.hashtag:hover {
  background: var(--text-accent);
  color: var(--bg-primary);
}

/* Input Area */
.input-area {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border);
  display: flex;
  align-items: center;
  padding: 0 10px;
}

.input-prompt {
  color: var(--text-accent);
  margin-right: 5px;
  font-weight: bold;
}

.input-field {
  flex: 1;
  background: var(--bg-primary);
  border: 1px solid var(--border);
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: 13px;
  padding: 5px 8px;
  outline: none;
}

.input-field:focus {
  border-color: var(--text-accent);
}

/* Channel List */
.channel-list {
  position: fixed;
  left: 0;
  top: 70px;
  width: 200px;
  bottom: 60px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border);
  padding: 10px;
  overflow-y: auto;
}

.channel-item {
  padding: 5px 8px;
  margin-bottom: 2px;
  cursor: pointer;
  border-radius: 3px;
  font-size: 12px;
}

.channel-item:hover {
  background: var(--bg-tertiary);
}

.channel-item.active {
  background: var(--text-accent);
  color: var(--bg-primary);
  font-weight: bold;
}

.channel-item-name {
  font-weight: bold;
}

.channel-item-topic {
  color: var(--text-secondary);
  font-size: 10px;
  margin-top: 2px;
}

/* Work Tracker Tray */
.work-tray {
  position: fixed;
  right: 0;
  top: 70px;
  width: 300px;
  bottom: 60px;
  background: var(--bg-secondary);
  border-left: 1px solid var(--border);
  padding: 10px;
  overflow-y: auto;
}

.work-item {
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  padding: 8px;
  margin-bottom: 8px;
  border-radius: 3px;
}

.work-item.completed {
  opacity: 0.6;
  background: var(--bg-primary);
}

.work-item.in-progress {
  border-color: var(--text-warning);
}

.work-item-title {
  font-weight: bold;
  color: var(--text-accent);
  font-size: 12px;
}

.work-item-meta {
  color: var(--text-secondary);
  font-size: 10px;
  margin-top: 2px;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: var(--bg-primary);
  border-radius: 2px;
  margin-top: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--text-success);
  transition: width 0.3s ease;
}

/* Responsive */
@media (max-width: 768px) {
  .channel-list, .work-tray {
    display: none;
  }
  .main-content {
    left: 0;
  }
}
</style>
</head><body>
  <!-- Status Bar -->
  <div class="status-bar">
    <div class="status-item">
      <span class="status-label">TOKENS:</span>
      <span class="status-value" id="token-count">0</span>
    </div>
    <div class="status-item">
      <span class="status-label">COST:</span>
      <span class="status-value" id="cost-display">$0.00</span>
    </div>
    <div class="status-item">
      <span class="status-label">TIME:</span>
      <span class="status-value" id="time-display">00:00</span>
    </div>
    <div class="status-item">
      <span class="status-label">WEATHER:</span>
      <span class="status-value" id="weather-display">☀️</span>
    </div>
    <div class="status-item" style="margin-left: auto;">
      <span class="status-label">ROBBIE:</span>
      <span class="status-value" style="color: var(--text-success);">ONLINE</span>
    </div>
  </div>

  <!-- Channel Header -->
  <div class="channel-header">
    <span class="channel-name">#${this.currentChannel}</span>
    <span class="channel-topic">${this.channels[this.currentChannel]?.description || 'General discussion'}</span>
    <span class="channel-users" id="user-count">1 user</span>
  </div>

  <!-- Channel List -->
  <div class="channel-list">
    ${Object.entries(this.channels).map(([key, channel]) => `
      <div class="channel-item ${key === this.currentChannel ? 'active' : ''}" onclick="switchChannel('${key}')">
        <div class="channel-item-name">#${channel.name.toLowerCase()}</div>
        <div class="channel-item-topic">${channel.description}</div>
      </div>
    `).join('')}
  </div>

  <!-- Main Content -->
  <div class="main-content" id="message-container">
    <div class="message message-system">
      <span class="message-timestamp">[${new Date().toLocaleTimeString()}]</span>
      <span class="message-text">Welcome to Vengeance BBS - TestPilot Command Center</span>
    </div>
    <div class="message message-system">
      <span class="message-timestamp">[${new Date().toLocaleTimeString()}]</span>
      <span class="message-text">Type /help for available commands</span>
    </div>
  </div>

  <!-- Work Tracker Tray -->
  <div class="work-tray">
    <div style="color: var(--text-accent); font-weight: bold; margin-bottom: 10px; font-size: 14px;">
      📊 WORK QUEUE
    </div>
    <div id="work-items">
      <!-- Work items will be populated here -->
    </div>
  </div>

  <!-- Input Area -->
  <div class="input-area">
    <span class="input-prompt">${this.currentChannel}></span>
    <input type="text" class="input-field" id="message-input" placeholder="Type your message... (use /help for commands)" autocomplete="off">
  </div>

  <script>
    // BBS Interface JavaScript
    let currentChannel = '${this.currentChannel}';
    let messageHistory = [];
    let historyIndex = -1;

    // Initialize interface
    document.addEventListener('DOMContentLoaded', function() {
      const input = document.getElementById('message-input');
      input.focus();
      
      // Load initial messages
      loadMessages();
      loadWorkQueue();
      updateStatusBar();
      
      // Set up event listeners
      input.addEventListener('keydown', handleKeyDown);
      
      // Auto-refresh every 5 seconds
      setInterval(() => {
        loadMessages();
        loadWorkQueue();
        updateStatusBar();
      }, 5000);
    });

    function handleKeyDown(e) {
      if (e.key === 'Enter') {
        sendMessage();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        navigateHistory(-1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        navigateHistory(1);
      }
    }

    function sendMessage() {
      const input = document.getElementById('message-input');
      const message = input.value.trim();
      
      if (!message) return;
      
      // Add to history
      messageHistory.unshift(message);
      if (messageHistory.length > 100) {
        messageHistory = messageHistory.slice(0, 100);
      }
      historyIndex = -1;
      
      // Process command or regular message
      if (message.startsWith('/')) {
        processCommand(message);
      } else {
        addMessage('allan', message, 'text');
        // Send to Robbie for processing
        processWithRobbie(message);
      }
      
      input.value = '';
    }

    function processCommand(command) {
      const parts = command.split(' ');
      const cmd = parts[0].toLowerCase();
      
      switch (cmd) {
        case '/help':
          showHelp();
          break;
        case '/join':
          if (parts[1]) {
            switchChannel(parts[1]);
          }
          break;
        case '/work':
          if (parts[1]) {
            createWorkItem(parts.slice(1).join(' '));
          } else {
            showWorkQueue();
          }
          break;
        case '/status':
          showStatus();
          break;
        case '/clear':
          clearMessages();
          break;
        default:
          addMessage('system', 'Unknown command. Type /help for available commands.', 'error');
      }
    }

    function processWithRobbie(message) {
      // This would integrate with the direct GPU system
      addMessage('robbie', 'Processing your request...', 'system');
      
      // Simulate Robbie's response
      setTimeout(() => {
        addMessage('robbie', 'I understand you want to discuss: ' + message, 'text');
      }, 1000);
    }

    function addMessage(username, text, type = 'text') {
      const container = document.getElementById('message-container');
      const messageDiv = document.createElement('div');
      messageDiv.className = 'message message-' + type;
      
      const timestamp = new Date().toLocaleTimeString();
      messageDiv.innerHTML = \`
        <span class="message-timestamp">[\${timestamp}]</span>
        <span class="message-username">\${username}:</span>
        <span class="message-text">\${text}</span>
      \`;
      
      container.appendChild(messageDiv);
      container.scrollTop = container.scrollHeight;
    }

    function switchChannel(channel) {
      currentChannel = channel;
      document.querySelector('.channel-item.active').classList.remove('active');
      document.querySelector(\`[onclick="switchChannel('\${channel}')"]\`).classList.add('active');
      
      // Update channel header
      document.querySelector('.channel-name').textContent = '#' + channel;
      document.querySelector('.channel-topic').textContent = channels[channel]?.description || 'General discussion';
      
      // Clear messages and load new channel
      clearMessages();
      loadMessages();
    }

    function loadMessages() {
      // This would load messages from the database
      // For now, just show a placeholder
    }

    function loadWorkQueue() {
      // This would load work items from the work tracker
      // For now, show placeholder
      const container = document.getElementById('work-items');
      container.innerHTML = \`
        <div class="work-item in-progress">
          <div class="work-item-title">PDF Sign Design</div>
          <div class="work-item-meta">ETA: 45min | $15.00 | 1,200 tokens</div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: 60%;"></div>
          </div>
        </div>
        <div class="work-item completed">
          <div class="work-item-title">Market Analysis</div>
          <div class="work-item-meta">Completed | $25.00 | 2,100 tokens</div>
        </div>
      \`;
    }

    function updateStatusBar() {
      // Update status bar with real data
      document.getElementById('token-count').textContent = '1,200';
      document.getElementById('cost-display').textContent = '$15.00';
      document.getElementById('time-display').textContent = new Date().toLocaleTimeString().slice(0, 5);
      document.getElementById('weather-display').textContent = '☀️';
    }

    function showHelp() {
      const helpText = \`
Available commands:
/help - Show this help
/join <channel> - Switch to channel
/work <description> - Create work item
/status - Show system status
/clear - Clear messages
      \`;
      addMessage('system', helpText, 'system');
    }

    function showStatus() {
      const statusText = \`
System Status:
- GPU: RTX 4090 (85% utilization)
- Memory: 12GB/24GB used
- Temperature: 72°C
- Models: llama-maverick, qwen-local
- Uptime: 2h 15m
      \`;
      addMessage('system', statusText, 'system');
    }

    function clearMessages() {
      const container = document.getElementById('message-container');
      container.innerHTML = '';
    }

    function navigateHistory(direction) {
      if (messageHistory.length === 0) return;
      
      historyIndex += direction;
      if (historyIndex < 0) historyIndex = 0;
      if (historyIndex >= messageHistory.length) historyIndex = messageHistory.length - 1;
      
      document.getElementById('message-input').value = messageHistory[historyIndex] || '';
    }

    // Channel definitions
    const channels = ${JSON.stringify(this.channels)};
  </script>
</body></html>`;
  }

  // Add message to channel
  addMessage(channel, username, message, messageType = 'text', metadata = {}) {
    try {
      const id = randomUUID();
      db.prepare(`
        INSERT INTO channel_messages (id, channel, username, message, message_type, metadata)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, channel, username, message, messageType, JSON.stringify(metadata));
      
      return { id, channel, username, message, messageType };
    } catch (error) {
      console.error('Error adding message:', error);
      throw new Error('Failed to add message');
    }
  }

  // Get channel messages
  getChannelMessages(channel, limit = 50) {
    try {
      return db.prepare(`
        SELECT * FROM channel_messages 
        WHERE channel = ? 
        ORDER BY created_at DESC 
        LIMIT ?
      `).all(channel, limit);
    } catch (error) {
      console.error('Error getting channel messages:', error);
      return [];
    }
  }

  // Process hashtags in message
  processHashtags(message) {
    const hashtagRegex = /#(\w+)/g;
    const hashtags = [];
    let match;
    
    while ((match = hashtagRegex.exec(message)) !== null) {
      const tag = match[1].toLowerCase();
      hashtags.push(tag);
      
      // Update hashtag usage
      try {
        const existing = db.prepare(`SELECT * FROM hashtags WHERE tag = ?`).get(tag);
        if (existing) {
          db.prepare(`
            UPDATE hashtags SET usage_count = usage_count + 1, last_used = datetime('now')
            WHERE tag = ?
          `).run(tag);
        } else {
          db.prepare(`
            INSERT INTO hashtags (id, tag) VALUES (?, ?)
          `).run(randomUUID(), tag);
        }
      } catch (error) {
        console.error('Error updating hashtag:', error);
      }
    }
    
    return hashtags;
  }

  // Get trending hashtags
  getTrendingHashtags(limit = 10) {
    try {
      return db.prepare(`
        SELECT tag, usage_count, last_used
        FROM hashtags
        ORDER BY usage_count DESC, last_used DESC
        LIMIT ?
      `).all(limit);
    } catch (error) {
      console.error('Error getting trending hashtags:', error);
      return [];
    }
  }
}

// Singleton instance
export const bbsInterface = new BBSInterface();
