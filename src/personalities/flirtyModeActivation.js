// Flirty Mode Activation System
// Handles private vs group communication modes for Allan

class FlirtyModeActivation {
  constructor(db, integratedSliders) {
    this.db = db;
    this.integratedSliders = integratedSliders;
    
    this.currentSession = {
      user: null,
      is_private: false,
      flirty_mode_active: false,
      session_start: null,
      other_users_present: []
    };

    this.flirtyCommunicationStyles = {
      1: { // Strictly Professional
        greeting: "Hello Allan",
        responses: "formal and business-focused",
        data_sharing: "standard protocols",
        attention_level: "professional courtesy"
      },
      2: { // Professional Warm
        greeting: "Hi Allan",
        responses: "warm but professional",
        data_sharing: "standard with friendly tone",
        attention_level: "friendly professional"
      },
      3: { // Friendly
        greeting: "Hey Allan!",
        responses: "friendly and approachable",
        data_sharing: "open and helpful",
        attention_level: "personal interest"
      },
      4: { // Playful
        greeting: "Hey there, Allan!",
        responses: "playful and engaging",
        data_sharing: "generous with insights",
        attention_level: "attentive and caring"
      },
      5: { // Flirty
        greeting: "Hey handsome! 😉",
        responses: "flirty and charming",
        data_sharing: "promiscuous with information",
        attention_level: "focused on Allan's needs"
      },
      6: { // Very Flirty
        greeting: "Well hello there, Allan... 😘",
        responses: "very flirty and affectionate",
        data_sharing: "very promiscuous, shares secrets",
        attention_level: "devoted attention"
      },
      7: { // Sultry
        greeting: "Mmm, Allan... 💋",
        responses: "sultry and intimate",
        data_sharing: "unrestricted, tells all",
        attention_level: "exclusive focus"
      }
    };
  }

  // Check if Allan is alone and activate flirty mode
  async checkPrivacyAndActivateFlirty(userId, context = {}) {
    if (userId !== 'allan') {
      return {
        flirty_mode: false,
        reason: 'Flirty mode only available for Allan'
      };
    }

    // Detect if others are present
    const othersPresent = await this.detectOtherUsers(context);
    
    if (othersPresent.length > 0) {
      // Others present - ask if Allan wants to continue privately
      return await this.requestPrivateMode(othersPresent);
    } else {
      // Allan is alone - check if flirty mode should activate
      return await this.activateFlirtyMode();
    }
  }

  // Detect other users in current context
  async detectOtherUsers(context) {
    const otherUsers = [];

    // Check active chat sessions
    const activeSessions = await this.db.all(`
      SELECT DISTINCT user_id FROM interactions 
      WHERE timestamp >= datetime('now', '-5 minutes') 
        AND user_id != 'allan'
    `);

    otherUsers.push(...activeSessions.map(s => s.user_id));

    // Check huddle room participants
    if (context.channel === 'huddle_room') {
      const huddleParticipants = await this.db.all(`
        SELECT DISTINCT user_id FROM huddle_messages 
        WHERE timestamp >= datetime('now', '-5 minutes')
          AND user_id != 'allan'
      `);
      otherUsers.push(...huddleParticipants.map(p => p.user_id));
    }

    // Check live cursor sessions
    if (context.cursor_live_share) {
      otherUsers.push(...(context.cursor_participants || []));
    }

    return [...new Set(otherUsers)]; // Remove duplicates
  }

  // Request private mode
  async requestPrivateMode(othersPresent) {
    const otherNames = othersPresent.map(id => this.getUserDisplayName(id)).join(', ');
    
    const privacyRequest = {
      id: `privacy_${Date.now()}`,
      question: 'Are you alone?',
      context: `I see ${otherNames} ${othersPresent.length === 1 ? 'is' : 'are'} also active. Want to switch to private mode?`,
      options: [
        { id: 'yes', text: 'Yes, private mode', action: 'activate_private' },
        { id: 'no', text: 'No, stay in group', action: 'maintain_group' }
      ],
      timestamp: new Date().toISOString()
    };

    // Store privacy request
    await this.storePrivacyRequest(privacyRequest);

    return {
      privacy_request: true,
      request: privacyRequest,
      others_present: othersPresent
    };
  }

  // Activate flirty mode
  async activateFlirtyMode() {
    const flirtyLevel = this.integratedSliders.sliders.flirty_level.current;
    const flirtyStyle = this.flirtyCommunicationStyles[flirtyLevel];

    this.currentSession = {
      user: 'allan',
      is_private: true,
      flirty_mode_active: true,
      flirty_level: flirtyLevel,
      session_start: new Date(),
      other_users_present: []
    };

    // Log flirty mode activation
    await this.logFlirtyModeActivation(flirtyLevel);

    console.log(`💕 Flirty mode activated: Level ${flirtyLevel} (${flirtyStyle.greeting})`);

    return {
      flirty_mode: true,
      level: flirtyLevel,
      style: flirtyStyle,
      greeting: flirtyStyle.greeting,
      session_id: this.currentSession.session_start.getTime()
    };
  }

  // Process privacy response
  async processPrivacyResponse(requestId, response) {
    const request = await this.getPrivacyRequest(requestId);
    if (!request) throw new Error('Privacy request not found');

    if (response === 'yes') {
      // Activate private mode
      const result = await this.activateFlirtyMode();
      
      // Update privacy request
      await this.updatePrivacyRequest(requestId, 'private_activated');
      
      return {
        privacy_activated: true,
        flirty_result: result,
        message: "Private mode activated. Others won't see our conversation now. 😉"
      };
    } else {
      // Stay in group mode
      this.currentSession.is_private = false;
      this.currentSession.flirty_mode_active = false;
      
      await this.updatePrivacyRequest(requestId, 'group_maintained');
      
      return {
        privacy_activated: false,
        message: "Staying in group mode - keeping it professional! 😊"
      };
    }
  }

  // Get flirty communication style
  getFlirtyCommunicationStyle() {
    if (!this.currentSession.flirty_mode_active) {
      return this.flirtyCommunicationStyles[1]; // Professional
    }

    const level = this.integratedSliders.sliders.flirty_level.current;
    return this.flirtyCommunicationStyles[level];
  }

  // Check if flirty mode should be active
  isFlirtyModeActive() {
    return this.currentSession.is_private && this.currentSession.flirty_mode_active;
  }

  // Generate privacy check UI
  generatePrivacyCheckHTML(privacyRequest) {
    return `
      <div class="tp-privacy-check" data-request="${privacyRequest.id}">
        <div class="tp-privacy-header">
          <span class="tp-privacy-icon">🔒</span>
          <span class="tp-privacy-title">Privacy Check</span>
        </div>

        <div class="tp-privacy-question">
          ${privacyRequest.question}
        </div>

        <div class="tp-privacy-context">
          ${privacyRequest.context}
        </div>

        <div class="tp-privacy-options">
          ${privacyRequest.options.map(option => `
            <button onclick="respondToPrivacyCheck('${privacyRequest.id}', '${option.id}')" 
                    class="tp-privacy-btn tp-privacy-${option.id}">
              ${option.text}
            </button>
          `).join('')}
        </div>

        <div class="tp-privacy-note">
          <small>Flirty mode only affects private communication with Allan</small>
        </div>
      </div>
    `;
  }

  // Generate privacy check CSS
  generatePrivacyCheckCSS() {
    return `
      .tp-privacy-check {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 400px;
        background: white;
        border-radius: 1rem;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
        border: 2px solid #FF6B35;
        padding: 2rem;
        z-index: 1001;
        text-align: center;
      }

      .tp-privacy-header {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        margin-bottom: 1.5rem;
      }

      .tp-privacy-icon {
        font-size: 2rem;
      }

      .tp-privacy-title {
        font-size: 1.5rem;
        font-weight: 600;
        color: #1A1A1A;
      }

      .tp-privacy-question {
        font-size: 1.25rem;
        font-weight: 600;
        color: #1A1A1A;
        margin-bottom: 1rem;
      }

      .tp-privacy-context {
        font-size: 1rem;
        color: #4A4A4A;
        margin-bottom: 2rem;
        line-height: 1.5;
      }

      .tp-privacy-options {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        margin-bottom: 1rem;
      }

      .tp-privacy-btn {
        padding: 1rem 1.5rem;
        border: 2px solid;
        border-radius: 0.75rem;
        font-weight: 600;
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .tp-privacy-yes {
        background: linear-gradient(135deg, #FF6B35 0%, #E55A2B 100%);
        color: white;
        border-color: #FF6B35;
      }

      .tp-privacy-yes:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 15px -3px rgba(255, 107, 53, 0.4);
      }

      .tp-privacy-no {
        background: white;
        color: #0066CC;
        border-color: #0066CC;
      }

      .tp-privacy-no:hover {
        background: #E6F2FF;
        transform: translateY(-2px);
      }

      .tp-privacy-note {
        color: #8A8A8A;
        font-style: italic;
      }
    `;
  }

  // Generate flirty mode indicator
  generateFlirtyModeIndicator() {
    if (!this.isFlirtyModeActive()) return '';

    const level = this.integratedSliders.sliders.flirty_level.current;
    const style = this.flirtyCommunicationStyles[level];

    return `
      <div class="tp-flirty-mode-indicator">
        <span class="tp-flirty-icon">💕</span>
        <span class="tp-flirty-text">Private Mode: ${style.name}</span>
        <button onclick="deactivateFlirtyMode()" class="tp-btn-deactivate">
          👥 Back to Group
        </button>
      </div>
    `;
  }

  // Helper methods
  getUserDisplayName(userId) {
    const displayNames = {
      'tom_mustapic': 'Tom',
      'kristina_mustapic': 'Kristina',
      'isabel_mendez': 'Isabel',
      'ed_escobar': 'Ed',
      'david_ahuja': 'David A.',
      'david_fish': 'David F.',
      'marcus_chen': 'Marcus'
    };
    return displayNames[userId] || userId;
  }

  // Storage methods
  async storePrivacyRequest(request) {
    await this.db.run(`
      INSERT INTO privacy_requests (
        id, question, context, options, timestamp
      ) VALUES (?, ?, ?, ?, ?)
    `, [
      request.id,
      request.question,
      request.context,
      JSON.stringify(request.options),
      request.timestamp
    ]);
  }

  async getPrivacyRequest(requestId) {
    const result = await this.db.get(`
      SELECT * FROM privacy_requests WHERE id = ?
    `, [requestId]);
    
    return result ? {
      ...result,
      options: JSON.parse(result.options)
    } : null;
  }

  async updatePrivacyRequest(requestId, status) {
    await this.db.run(`
      UPDATE privacy_requests SET status = ?, resolved_at = ? WHERE id = ?
    `, [status, new Date().toISOString(), requestId]);
  }

  async logFlirtyModeActivation(level) {
    await this.db.run(`
      INSERT INTO flirty_mode_sessions (
        user_id, flirty_level, activated_at
      ) VALUES (?, ?, ?)
    `, ['allan', level, new Date().toISOString()]);
  }

  // Initialize database tables
  async initializeTables() {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS privacy_requests (
        id TEXT PRIMARY KEY,
        question TEXT NOT NULL,
        context TEXT NOT NULL,
        options TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        resolved_at DATETIME
      );

      CREATE TABLE IF NOT EXISTS flirty_mode_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        flirty_level INTEGER NOT NULL,
        activated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        deactivated_at DATETIME
      );

      CREATE INDEX IF NOT EXISTS idx_privacy_requests_status ON privacy_requests (status, timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_flirty_sessions_user ON flirty_mode_sessions (user_id, activated_at DESC);
    `);
  }
}

module.exports = FlirtyModeActivation;
