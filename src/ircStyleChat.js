// IRC Style Chat Interface
// Colorful 2007 IRC experience with proper formatting and user colors

class IRCStyleChat {
  constructor(db, auroraLocation) {
    this.db = db;
    this.auroraLocation = auroraLocation;
    
    this.userColors = {
      'allan': '#FF6B6B',      // Red - CEO
      'tom_mustapic': '#4ECDC4',     // Teal - Revenue
      'kristina_mustapic': '#45B7D1', // Blue - Account Manager
      'isabel_mendez': '#96CEB4',     // Green - Marketing
      'ed_escobar': '#FFEAA7',       // Yellow - CTO
      'david_ahuja': '#DDA0DD',      // Plum - Advisor
      'david_fish': '#98D8C8',       // Mint - Advisor
      'marcus_chen': '#F7DC6F',      // Gold - Dev Manager
      'robbie': '#FF6B35'            // Orange - Robbie
    };

    this.messageTypes = {
      'chat': { prefix: '', color: 'inherit' },
      'action': { prefix: '*', color: '#8A8A8A', italic: true },
      'system': { prefix: '***', color: '#0066CC', bold: true },
      'private': { prefix: '->', color: '#FF6B35', background: '#FFF0E6' },
      'announcement': { prefix: '!!!', color: '#FF4444', bold: true, background: '#FFE6E6' }
    };

    this.channelHeaders = {
      'town_square': '🏛️ #aurora-town-square',
      'the_pub': '🍺 #rusty-gear-pub',
      'conference_room': '📊 #conference-room',
      'allans_office': '🏢 #allans-private-office',
      'dev_lab': '⚗️ #dev-laboratory',
      'quiet_corner': '☕ #quiet-corner-cafe'
    };
  }

  // Generate IRC-style chat interface
  generateIRCChatHTML(venueId) {
    const venue = this.auroraLocation.auroraVenues[venueId];
    const occupancy = this.auroraLocation.getCurrentOccupancy(venueId);
    
    return `
      <div class="tp-irc-chat">
        <div class="tp-irc-header">
          <div class="tp-channel-info">
            <span class="tp-channel-name">${this.channelHeaders[venueId]}</span>
            <span class="tp-channel-topic">${venue.description}</span>
          </div>
          <div class="tp-channel-stats">
            <span class="tp-user-count">👥 ${occupancy.length}</span>
            <span class="tp-privacy-level">${this.getPrivacyIcon(venue.privacy_level)}</span>
          </div>
        </div>

        <div class="tp-irc-content">
          <div class="tp-irc-messages" id="ircMessages">
            <div class="tp-irc-message tp-system">
              <span class="tp-timestamp">[${this.getCurrentTime()}]</span>
              <span class="tp-prefix">***</span>
              <span class="tp-system-text">Welcome to ${venue.name}</span>
            </div>
            <div class="tp-irc-message tp-system">
              <span class="tp-timestamp">[${this.getCurrentTime()}]</span>
              <span class="tp-prefix">***</span>
              <span class="tp-system-text">Topic: ${venue.description}</span>
            </div>
            ${this.generateWelcomeMessages(occupancy)}
          </div>

          <div class="tp-irc-sidebar">
            <div class="tp-user-list">
              <div class="tp-user-list-header">
                <span class="tp-user-list-title">Users (${occupancy.length})</span>
              </div>
              <div class="tp-user-list-content">
                ${this.generateUserList(occupancy)}
              </div>
            </div>

            <div class="tp-venue-info">
              <div class="tp-venue-rules">
                <h4>📋 Venue Rules</h4>
                <div class="tp-rule-item">
                  Privacy: ${venue.privacy_level}
                </div>
                <div class="tp-rule-item">
                  Flirty Mode: ${venue.flirty_allowed ? '✅ Allowed' : '❌ Disabled'}
                </div>
                <div class="tp-rule-item">
                  Sensitive Info: ${venue.sensitive_info_allowed}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="tp-irc-input">
          <div class="tp-input-line">
            <span class="tp-input-prompt" style="color: ${this.userColors['allan']}">
              &lt;Allan&gt;
            </span>
            <input type="text" 
                   id="ircInput" 
                   class="tp-irc-input-field"
                   placeholder="Type your message..."
                   onkeypress="handleIRCInput(event)">
          </div>
          
          <div class="tp-input-controls">
            <button onclick="sendIRCMessage()" class="tp-btn-send-irc">Send</button>
            <button onclick="sendIRCAction()" class="tp-btn-action-irc">/me</button>
            <button onclick="checkPrivacy()" class="tp-btn-privacy-irc">🔒 Privacy</button>
          </div>
        </div>
      </div>
    `;
  }

  // Generate IRC-style CSS
  generateIRCChatCSS() {
    return `
      .tp-irc-chat {
        background: #1A1A1A;
        color: #FFFFFF;
        font-family: 'Courier New', 'Monaco', 'Menlo', monospace;
        border-radius: 0.5rem;
        overflow: hidden;
        height: 600px;
        display: flex;
        flex-direction: column;
        border: 2px solid #333;
      }

      .tp-irc-header {
        background: linear-gradient(135deg, #2C3E50 0%, #3498DB 100%);
        padding: 0.75rem 1rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 2px solid #333;
      }

      .tp-channel-name {
        font-weight: bold;
        color: #FFFFFF;
        font-size: 1.125rem;
      }

      .tp-channel-topic {
        color: #BDC3C7;
        font-size: 0.875rem;
        margin-left: 1rem;
      }

      .tp-channel-stats {
        display: flex;
        gap: 1rem;
        align-items: center;
      }

      .tp-user-count {
        color: #E74C3C;
        font-weight: bold;
      }

      .tp-privacy-level {
        font-size: 1.25rem;
      }

      .tp-irc-content {
        flex: 1;
        display: flex;
        min-height: 0;
      }

      .tp-irc-messages {
        flex: 1;
        padding: 1rem;
        overflow-y: auto;
        background: #0A0A0A;
        font-size: 0.875rem;
        line-height: 1.4;
      }

      .tp-irc-message {
        margin-bottom: 0.25rem;
        display: flex;
        align-items: baseline;
        gap: 0.5rem;
        word-wrap: break-word;
      }

      .tp-irc-message.tp-system {
        color: #3498DB;
        font-weight: bold;
      }

      .tp-irc-message.tp-action {
        color: #95A5A6;
        font-style: italic;
      }

      .tp-irc-message.tp-private {
        background: rgba(255, 107, 53, 0.1);
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        border-left: 3px solid #FF6B35;
      }

      .tp-irc-message.tp-announcement {
        background: rgba(231, 76, 60, 0.1);
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        border-left: 3px solid #E74C3C;
        font-weight: bold;
      }

      .tp-timestamp {
        color: #7F8C8D;
        font-size: 0.75rem;
        min-width: 60px;
      }

      .tp-prefix {
        color: #E67E22;
        font-weight: bold;
        min-width: 20px;
      }

      .tp-username {
        font-weight: bold;
        min-width: 80px;
      }

      .tp-message-content {
        flex: 1;
        color: #FFFFFF;
      }

      .tp-irc-sidebar {
        width: 200px;
        background: #2C2C2C;
        border-left: 1px solid #444;
        display: flex;
        flex-direction: column;
      }

      .tp-user-list {
        flex: 1;
        padding: 1rem;
      }

      .tp-user-list-header {
        margin-bottom: 1rem;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid #444;
      }

      .tp-user-list-title {
        color: #3498DB;
        font-weight: bold;
        font-size: 0.875rem;
      }

      .tp-user-list-content {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .tp-user-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        cursor: pointer;
        transition: background 0.2s ease;
      }

      .tp-user-item:hover {
        background: rgba(255, 255, 255, 0.1);
      }

      .tp-user-emoji {
        font-size: 0.875rem;
      }

      .tp-user-name {
        font-size: 0.875rem;
        font-weight: 500;
      }

      .tp-venue-info {
        padding: 1rem;
        border-top: 1px solid #444;
      }

      .tp-venue-rules h4 {
        color: #E67E22;
        margin: 0 0 0.75rem 0;
        font-size: 0.875rem;
      }

      .tp-rule-item {
        font-size: 0.75rem;
        color: #BDC3C7;
        margin-bottom: 0.5rem;
        padding: 0.25rem 0.5rem;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 0.25rem;
      }

      .tp-irc-input {
        background: #2C2C2C;
        padding: 1rem;
        border-top: 1px solid #444;
      }

      .tp-input-line {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
      }

      .tp-input-prompt {
        font-weight: bold;
        min-width: 80px;
      }

      .tp-irc-input-field {
        flex: 1;
        background: #1A1A1A;
        border: 1px solid #444;
        color: #FFFFFF;
        padding: 0.5rem;
        border-radius: 0.25rem;
        font-family: inherit;
        font-size: 0.875rem;
      }

      .tp-irc-input-field:focus {
        outline: none;
        border-color: #3498DB;
        box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
      }

      .tp-input-controls {
        display: flex;
        gap: 0.5rem;
      }

      .tp-btn-send-irc,
      .tp-btn-action-irc,
      .tp-btn-privacy-irc {
        background: #34495E;
        color: #FFFFFF;
        border: 1px solid #5D6D7E;
        border-radius: 0.25rem;
        padding: 0.5rem 1rem;
        font-size: 0.75rem;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .tp-btn-send-irc:hover {
        background: #3498DB;
      }

      .tp-btn-action-irc:hover {
        background: #E67E22;
      }

      .tp-btn-privacy-irc:hover {
        background: #E74C3C;
      }

      /* Color classes for usernames */
      ${Object.entries(this.userColors).map(([userId, color]) => `
        .tp-user-${userId.replace('_', '-')} {
          color: ${color} !important;
        }
      `).join('')}

      /* Message formatting */
      .tp-msg-bold { font-weight: bold; }
      .tp-msg-italic { font-style: italic; }
      .tp-msg-underline { text-decoration: underline; }
      
      /* IRC-style scrolling */
      .tp-irc-messages::-webkit-scrollbar {
        width: 8px;
      }
      
      .tp-irc-messages::-webkit-scrollbar-track {
        background: #2C2C2C;
      }
      
      .tp-irc-messages::-webkit-scrollbar-thumb {
        background: #555;
        border-radius: 4px;
      }
      
      .tp-irc-messages::-webkit-scrollbar-thumb:hover {
        background: #777;
      }
    `;
  }

  // Format IRC message
  formatIRCMessage(userId, message, messageType = 'chat', timestamp = null) {
    const time = timestamp ? new Date(timestamp) : new Date();
    const timeStr = time.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });

    const userColor = this.userColors[userId] || '#FFFFFF';
    const userName = this.auroraLocation.getUserDisplayName(userId);
    const messageTypeConfig = this.messageTypes[messageType];

    let formattedMessage = '';

    switch (messageType) {
      case 'chat':
        formattedMessage = `
          <div class="tp-irc-message tp-chat">
            <span class="tp-timestamp">[${timeStr}]</span>
            <span class="tp-username tp-user-${userId.replace('_', '-')}" style="color: ${userColor}">
              &lt;${userName}&gt;
            </span>
            <span class="tp-message-content">${this.formatMessageContent(message)}</span>
          </div>
        `;
        break;

      case 'action':
        formattedMessage = `
          <div class="tp-irc-message tp-action">
            <span class="tp-timestamp">[${timeStr}]</span>
            <span class="tp-prefix">*</span>
            <span class="tp-username" style="color: ${userColor}">${userName}</span>
            <span class="tp-message-content">${this.formatMessageContent(message)}</span>
          </div>
        `;
        break;

      case 'system':
        formattedMessage = `
          <div class="tp-irc-message tp-system">
            <span class="tp-timestamp">[${timeStr}]</span>
            <span class="tp-prefix">***</span>
            <span class="tp-system-text">${message}</span>
          </div>
        `;
        break;

      case 'private':
        formattedMessage = `
          <div class="tp-irc-message tp-private">
            <span class="tp-timestamp">[${timeStr}]</span>
            <span class="tp-prefix">-&gt;</span>
            <span class="tp-username" style="color: ${userColor}">${userName}</span>
            <span class="tp-message-content">${this.formatMessageContent(message)}</span>
          </div>
        `;
        break;

      case 'announcement':
        formattedMessage = `
          <div class="tp-irc-message tp-announcement">
            <span class="tp-timestamp">[${timeStr}]</span>
            <span class="tp-prefix">!!!</span>
            <span class="tp-system-text">${message}</span>
          </div>
        `;
        break;
    }

    return formattedMessage;
  }

  // Format message content with IRC-style formatting
  formatMessageContent(content) {
    let formatted = content;

    // Bold: *text*
    formatted = formatted.replace(/\*([^*]+)\*/g, '<span class="tp-msg-bold">$1</span>');
    
    // Italic: _text_
    formatted = formatted.replace(/_([^_]+)_/g, '<span class="tp-msg-italic">$1</span>');
    
    // Underline: __text__
    formatted = formatted.replace(/__([^_]+)__/g, '<span class="tp-msg-underline">$1</span>');
    
    // URLs
    formatted = formatted.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" class="tp-irc-link">$1</a>');
    
    // Hashtags
    formatted = formatted.replace(/#([a-zA-Z0-9_]+)/g, '<span class="tp-hashtag">#$1</span>');
    
    // @mentions
    formatted = formatted.replace(/@([a-zA-Z0-9_]+)/g, '<span class="tp-mention">@$1</span>');

    return formatted;
  }

  // Generate welcome messages for current occupants
  generateWelcomeMessages(occupancy) {
    return occupancy.map(userId => {
      const userName = this.auroraLocation.getUserDisplayName(userId);
      const userEmoji = this.auroraLocation.getUserEmoji(userId);
      return this.formatIRCMessage('system', `${userEmoji} ${userName} is here`, 'system');
    }).join('');
  }

  // Generate user list
  generateUserList(occupancy) {
    return occupancy.map(userId => {
      const userName = this.auroraLocation.getUserDisplayName(userId);
      const userEmoji = this.auroraLocation.getUserEmoji(userId);
      const userColor = this.userColors[userId] || '#FFFFFF';
      
      return `
        <div class="tp-user-item" onclick="openPrivateChat('${userId}')">
          <span class="tp-user-emoji">${userEmoji}</span>
          <span class="tp-user-name" style="color: ${userColor}">${userName}</span>
        </div>
      `;
    }).join('');
  }

  // Get privacy icon
  getPrivacyIcon(privacyLevel) {
    const icons = {
      'public': '🔓',
      'semi_private': '🔐',
      'private': '🔒',
      'business': '💼',
      'technical': '⚙️'
    };
    return icons[privacyLevel] || '📍';
  }

  // Get current time formatted for IRC
  getCurrentTime() {
    return new Date().toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  }

  // Add message to chat
  async addMessageToChat(venueId, userId, message, messageType = 'chat') {
    // Store in database
    await this.db.run(`
      INSERT INTO venue_messages (
        venue_id, user_id, message, message_type, timestamp
      ) VALUES (?, ?, ?, ?, ?)
    `, [venueId, userId, message, messageType, new Date().toISOString()]);

    // Format for display
    const formattedMessage = this.formatIRCMessage(userId, message, messageType);
    
    // Add to chat interface
    this.appendToChat(formattedMessage);

    // Check for privacy violations if sensitive
    if (messageType === 'private' || this.detectSensitiveInfo(message)) {
      const privacyCheck = await this.auroraLocation.checkPrivacyForSensitiveInfo(userId, venueId, message);
      if (privacyCheck.privacy_check_needed) {
        await this.showPrivacyWarning(privacyCheck.privacy_request);
      }
    }
  }

  // Append message to chat
  appendToChat(formattedMessage) {
    const messagesContainer = document.getElementById('ircMessages');
    if (messagesContainer) {
      messagesContainer.innerHTML += formattedMessage;
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  // Show privacy warning
  async showPrivacyWarning(privacyRequest) {
    const warningMessage = this.formatIRCMessage('system', 
      `⚠️ Sensitive information detected. ${privacyRequest.other_users.length} other users present: ${privacyRequest.other_users.join(', ')}`, 
      'announcement'
    );
    
    this.appendToChat(warningMessage);
  }

  // Detect sensitive info (same as Aurora location)
  detectSensitiveInfo(message) {
    const sensitiveKeywords = [
      'revenue', 'financial', 'debt', 'crisis', 'budget', 'personal',
      'private', 'confidential', 'internal', 'strategy', 'deal value'
    ];

    const messageLower = message.toLowerCase();
    return sensitiveKeywords.some(keyword => messageLower.includes(keyword));
  }

  // Initialize database tables
  async initializeTables() {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS irc_chat_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        venue_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        message TEXT NOT NULL,
        message_type TEXT DEFAULT 'chat',
        formatted_message TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_irc_chat_venue ON irc_chat_logs (venue_id, timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_irc_chat_user ON irc_chat_logs (user_id, timestamp DESC);
    `);
  }
}

module.exports = IRCStyleChat;
