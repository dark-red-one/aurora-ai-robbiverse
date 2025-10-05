// Gandhi - Genghis Mode Slider
// Controls Allan's communication aggressiveness and outreach intensity

class GandhiGenghisMode {
  constructor(db, pipelineReengagement) {
    this.db = db;
    this.pipelineReengagement = pipelineReengagement;
    
    // Only Allan has access to these controls
    this.authorizedUsers = ['allan'];
    
    this.modes = {
      1: {
        name: 'Full Gandhi',
        description: 'Extremely gentle, minimal outreach',
        daily_outreach_limit: 1,
        email_frequency: 'weekly',
        tone: 'gentle_thoughtful',
        safeguards: 'maximum',
        emoji: '🕊️'
      },
      2: {
        name: 'Mostly Gandhi',
        description: 'Gentle approach, careful outreach',
        daily_outreach_limit: 3,
        email_frequency: 'bi_weekly',
        tone: 'gentle_professional',
        safeguards: 'high',
        emoji: '🌱'
      },
      3: {
        name: 'Balanced',
        description: 'Professional balance',
        daily_outreach_limit: 5,
        email_frequency: 'weekly',
        tone: 'professional_warm',
        safeguards: 'standard',
        emoji: '⚖️'
      },
      4: {
        name: 'Assertive',
        description: 'Confident, proactive outreach',
        daily_outreach_limit: 10,
        email_frequency: 'twice_weekly',
        tone: 'confident_direct',
        safeguards: 'reduced',
        emoji: '🎯'
      },
      5: {
        name: 'Aggressive',
        description: 'High-intensity outreach',
        daily_outreach_limit: 15,
        email_frequency: 'daily',
        tone: 'urgent_direct',
        safeguards: 'minimal',
        emoji: '⚡'
      },
      6: {
        name: 'Full Genghis',
        description: 'Maximum intensity, revenue crisis mode',
        daily_outreach_limit: 20,
        email_frequency: 'multiple_daily',
        tone: 'urgent_aggressive',
        safeguards: 'override_capable',
        emoji: '🔥'
      }
    };
    
    this.currentMode = 6; // Start in Full Genghis given revenue crisis
    this.modeHistory = [];
  }

  // Set Gandhi-Genghis mode
  async setMode(modeLevel, userId = 'allan') {
    if (!this.authorizedUsers.includes(userId)) {
      throw new Error('Gandhi-Genghis controls are Allan-only');
    }

    if (!this.modes[modeLevel]) {
      throw new Error(`Invalid mode level: ${modeLevel}. Must be 1-6.`);
    }

    const previousMode = this.currentMode;
    const newMode = this.modes[modeLevel];
    
    // Log mode change
    const modeChange = {
      previous_mode: previousMode,
      new_mode: modeLevel,
      mode_name: newMode.name,
      changed_by: userId,
      changed_at: new Date().toISOString(),
      reason: this.inferModeChangeReason(previousMode, modeLevel)
    };

    await this.logModeChange(modeChange);
    
    // Update current mode
    this.currentMode = modeLevel;
    
    // Apply mode settings to pipeline system
    await this.applyModeSettings(newMode);
    
    // Update safeguards
    await this.updateSafeguards(newMode);

    console.log(`🎛️ Mode changed: ${this.modes[previousMode]?.name || 'Unknown'} → ${newMode.name} (Level ${modeLevel})`);

    return {
      success: true,
      previous_mode: this.modes[previousMode],
      new_mode: newMode,
      settings_applied: true
    };
  }

  // Apply mode settings to pipeline system
  async applyModeSettings(mode) {
    // Update pipeline re-engagement limits
    this.pipelineReengagement.safeguards.max_daily_outreach = mode.daily_outreach_limit;
    
    // Adjust email frequency safeguards
    const frequencySettings = {
      'weekly': { min_days_between: 7, max_per_week: 1 },
      'bi_weekly': { min_days_between: 5, max_per_week: 1 },
      'twice_weekly': { min_days_between: 3, max_per_week: 2 },
      'daily': { min_days_between: 1, max_per_week: 5 },
      'multiple_daily': { min_days_between: 0, max_per_week: 10 }
    };
    
    const settings = frequencySettings[mode.email_frequency] || frequencySettings['weekly'];
    this.pipelineReengagement.safeguards.min_days_between_emails = settings.min_days_between;
    this.pipelineReengagement.safeguards.max_emails_per_contact_per_week = settings.max_per_week;
    
    // Update tone settings
    this.pipelineReengagement.reengagementContext.tone = mode.tone;
    this.pipelineReengagement.reengagementContext.urgency_level = this.mapModeToUrgency(mode);
  }

  // Update safeguards based on mode
  async updateSafeguards(mode) {
    const safeguardLevels = {
      'maximum': {
        engagement_decay_threshold: 0.5, // 50% threshold
        overcommunication_detection: true,
        require_explicit_approval: true,
        risk_tolerance: 'very_low'
      },
      'high': {
        engagement_decay_threshold: 0.4,
        overcommunication_detection: true,
        require_explicit_approval: true,
        risk_tolerance: 'low'
      },
      'standard': {
        engagement_decay_threshold: 0.3,
        overcommunication_detection: true,
        require_explicit_approval: false,
        risk_tolerance: 'medium'
      },
      'reduced': {
        engagement_decay_threshold: 0.2,
        overcommunication_detection: true,
        require_explicit_approval: false,
        risk_tolerance: 'medium_high'
      },
      'minimal': {
        engagement_decay_threshold: 0.1,
        overcommunication_detection: false,
        require_explicit_approval: false,
        risk_tolerance: 'high'
      },
      'override_capable': {
        engagement_decay_threshold: 0.05,
        overcommunication_detection: false,
        require_explicit_approval: false,
        risk_tolerance: 'very_high',
        allow_safeguard_override: true
      }
    };

    const safeguardSettings = safeguardLevels[mode.safeguards];
    
    // Apply safeguard settings
    Object.assign(this.pipelineReengagement.safeguards, safeguardSettings);
    
    console.log(`🛡️ Safeguards updated to ${mode.safeguards} level`);
  }

  // Generate mode slider HTML
  generateModeSliderHTML() {
    return `
      <div class="tp-gandhi-genghis-slider">
        <div class="tp-mode-header">
          <h3>🎛️ Communication Mode</h3>
          <div class="tp-current-mode">
            <span class="tp-mode-emoji">${this.modes[this.currentMode].emoji}</span>
            <span class="tp-mode-name">${this.modes[this.currentMode].name}</span>
            <span class="tp-mode-level">Level ${this.currentMode}</span>
          </div>
        </div>

        <div class="tp-mode-slider-container">
          <div class="tp-mode-labels">
            <span class="tp-mode-label tp-gandhi">🕊️ Gandhi</span>
            <span class="tp-mode-label tp-genghis">🔥 Genghis</span>
          </div>
          
          <input type="range" 
                 id="modeSlider" 
                 min="1" 
                 max="6" 
                 value="${this.currentMode}" 
                 class="tp-mode-slider"
                 onchange="updateMode(this.value)">
          
          <div class="tp-mode-indicators">
            ${Object.entries(this.modes).map(([level, mode]) => `
              <div class="tp-mode-indicator ${level == this.currentMode ? 'active' : ''}" data-level="${level}">
                <span class="tp-indicator-emoji">${mode.emoji}</span>
                <span class="tp-indicator-name">${mode.name}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="tp-mode-details" id="modeDetails">
          <div class="tp-mode-description">
            ${this.modes[this.currentMode].description}
          </div>
          <div class="tp-mode-settings">
            <div class="tp-setting-item">
              <span class="tp-setting-label">Daily Outreach:</span>
              <span class="tp-setting-value">${this.modes[this.currentMode].daily_outreach_limit} emails</span>
            </div>
            <div class="tp-setting-item">
              <span class="tp-setting-label">Frequency:</span>
              <span class="tp-setting-value">${this.modes[this.currentMode].email_frequency}</span>
            </div>
            <div class="tp-setting-item">
              <span class="tp-setting-label">Tone:</span>
              <span class="tp-setting-value">${this.modes[this.currentMode].tone}</span>
            </div>
            <div class="tp-setting-item">
              <span class="tp-setting-label">Safeguards:</span>
              <span class="tp-setting-value">${this.modes[this.currentMode].safeguards}</span>
            </div>
          </div>
        </div>

        <div class="tp-mode-warning" id="modeWarning" style="display: ${this.currentMode >= 5 ? 'block' : 'none'}">
          ⚠️ High-intensity mode active. Safeguards reduced for maximum outreach velocity.
        </div>
      </div>
    `;
  }

  // Generate mode slider CSS
  generateModeSliderCSS() {
    return `
      .tp-gandhi-genghis-slider {
        background: linear-gradient(135deg, #E8F4FD 0%, #FFF8E1 100%);
        border-radius: 1rem;
        padding: 2rem;
        margin: 1rem 0;
        border: 2px solid #E5E5E5;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      }

      .tp-mode-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
      }

      .tp-mode-header h3 {
        margin: 0;
        color: #1A1A1A;
        font-size: 1.5rem;
      }

      .tp-current-mode {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1.5rem;
        background: white;
        border-radius: 2rem;
        border: 2px solid #0066CC;
        box-shadow: 0 2px 4px rgba(0, 102, 204, 0.2);
      }

      .tp-mode-emoji {
        font-size: 1.5rem;
      }

      .tp-mode-name {
        font-weight: 600;
        color: #0066CC;
        font-size: 1.125rem;
      }

      .tp-mode-level {
        font-size: 0.875rem;
        color: #4A4A4A;
        background: #F5F5F5;
        padding: 0.25rem 0.5rem;
        border-radius: 1rem;
      }

      .tp-mode-slider-container {
        margin-bottom: 2rem;
      }

      .tp-mode-labels {
        display: flex;
        justify-content: space-between;
        margin-bottom: 1rem;
      }

      .tp-mode-label {
        font-weight: 600;
        font-size: 1.125rem;
      }

      .tp-mode-label.tp-gandhi {
        color: #00C851;
      }

      .tp-mode-label.tp-genghis {
        color: #FF4444;
      }

      .tp-mode-slider {
        width: 100%;
        height: 8px;
        border-radius: 4px;
        background: linear-gradient(to right, #00C851 0%, #FFB800 50%, #FF4444 100%);
        outline: none;
        margin-bottom: 1.5rem;
        cursor: pointer;
      }

      .tp-mode-slider::-webkit-slider-thumb {
        appearance: none;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: white;
        border: 3px solid #0066CC;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }

      .tp-mode-indicators {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 0.5rem;
      }

      .tp-mode-indicator {
        text-align: center;
        padding: 0.75rem 0.5rem;
        background: white;
        border-radius: 0.5rem;
        border: 2px solid #E5E5E5;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .tp-mode-indicator.active {
        border-color: #0066CC;
        background: #E6F2FF;
        transform: translateY(-2px);
        box-shadow: 0 4px 6px -1px rgba(0, 102, 204, 0.2);
      }

      .tp-mode-indicator:hover {
        border-color: #0066CC;
        transform: translateY(-1px);
      }

      .tp-indicator-emoji {
        display: block;
        font-size: 1.25rem;
        margin-bottom: 0.25rem;
      }

      .tp-indicator-name {
        font-size: 0.75rem;
        font-weight: 500;
        color: #4A4A4A;
      }

      .tp-mode-details {
        background: white;
        border-radius: 0.75rem;
        padding: 1.5rem;
        border: 1px solid #E5E5E5;
        margin-bottom: 1rem;
      }

      .tp-mode-description {
        font-size: 1.125rem;
        color: #1A1A1A;
        margin-bottom: 1rem;
        font-weight: 500;
      }

      .tp-mode-settings {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
      }

      .tp-setting-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem;
        background: #FAFAFA;
        border-radius: 0.5rem;
      }

      .tp-setting-label {
        font-weight: 500;
        color: #4A4A4A;
      }

      .tp-setting-value {
        font-weight: 600;
        color: #1A1A1A;
        font-family: monospace;
      }

      .tp-mode-warning {
        background: linear-gradient(135deg, #FFE6E6 0%, #FFF0E6 100%);
        border: 2px solid #FF6B35;
        border-radius: 0.75rem;
        padding: 1rem 1.5rem;
        color: #E55A2B;
        font-weight: 600;
        text-align: center;
        animation: pulse 2s infinite;
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.8; }
      }
    `;
  }

  // Get current mode settings
  getCurrentModeSettings() {
    return {
      level: this.currentMode,
      mode: this.modes[this.currentMode],
      is_genghis_mode: this.currentMode >= 5,
      is_gandhi_mode: this.currentMode <= 2,
      revenue_crisis_mode: this.currentMode === 6
    };
  }

  // Infer reason for mode change
  inferModeChangeReason(previousMode, newMode) {
    if (newMode > previousMode) {
      if (newMode === 6) return 'Revenue crisis - maximum intensity needed';
      if (newMode >= 4) return 'Increased urgency - need more aggressive outreach';
      return 'Ramping up outreach intensity';
    } else {
      if (newMode <= 2) return 'Scaling back - gentle approach needed';
      return 'Reducing outreach intensity';
    }
  }

  // Map mode to urgency level
  mapModeToUrgency(mode) {
    const urgencyMap = {
      1: 'very_low',
      2: 'low', 
      3: 'medium',
      4: 'medium_high',
      5: 'high',
      6: 'critical'
    };
    return urgencyMap[this.currentMode] || 'medium';
  }

  // Check if action is allowed in current mode
  async checkModePermission(action, context = {}) {
    const mode = this.modes[this.currentMode];
    
    // In Full Genghis mode, almost everything is allowed
    if (this.currentMode === 6) {
      return {
        allowed: true,
        reason: 'Full Genghis mode - revenue crisis override',
        safeguard_override: true
      };
    }

    // Standard permission checking for other modes
    switch (action) {
      case 'send_email':
        const todaysOutreach = await this.getTodaysOutreach();
        if (todaysOutreach >= mode.daily_outreach_limit) {
          return {
            allowed: false,
            reason: `Daily limit reached (${todaysOutreach}/${mode.daily_outreach_limit})`,
            suggestion: 'Wait until tomorrow or increase mode level'
          };
        }
        break;
        
      case 'override_safeguard':
        if (mode.safeguards !== 'override_capable') {
          return {
            allowed: false,
            reason: 'Safeguard override not available in current mode',
            suggestion: 'Increase to Full Genghis mode for override capability'
          };
        }
        break;
    }

    return { allowed: true, reason: 'Action permitted in current mode' };
  }

  // Get today's outreach count
  async getTodaysOutreach() {
    const result = await this.db.get(`
      SELECT COUNT(*) as count FROM outreach_log 
      WHERE DATE(sent_at) = DATE('now')
    `);
    return result.count;
  }

  // Log mode change
  async logModeChange(change) {
    await this.db.run(`
      INSERT INTO mode_changes (
        previous_mode, new_mode, mode_name, changed_by, reason, changed_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      change.previous_mode,
      change.new_mode,
      change.mode_name,
      change.changed_by,
      change.reason,
      change.changed_at
    ]);

    // Add to mode history
    this.modeHistory.push(change);
  }

  // Get mode history
  async getModeHistory(limit = 10) {
    return await this.db.all(`
      SELECT * FROM mode_changes 
      ORDER BY changed_at DESC 
      LIMIT ?
    `, [limit]);
  }

  // Initialize database tables
  async initializeTables() {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS mode_changes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        previous_mode INTEGER,
        new_mode INTEGER NOT NULL,
        mode_name TEXT NOT NULL,
        changed_by TEXT NOT NULL,
        reason TEXT,
        changed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_mode_changes_time ON mode_changes (changed_at DESC);
    `);
  }
}

module.exports = GandhiGenghisMode;
