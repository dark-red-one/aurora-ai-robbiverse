// Integrated Slider System
// All control sliders working together as a cohesive system

class IntegratedSliderSystem {
  constructor(db) {
    this.db = db;
    
    this.sliders = {
      // 1. Gandhi - Genghis Mode (Communication Aggressiveness)
      'gandhi_genghis': {
        name: 'Communication Mode',
        description: 'Controls outreach aggressiveness and safeguards',
        range: [1, 6],
        current: 6, // Full Genghis for revenue crisis
        labels: ['🕊️ Gandhi', '🔥 Genghis'],
        access: 'allan_only',
        affects: ['daily_outreach_limit', 'safeguards', 'tone', 'urgency'],
        values: {
          1: { name: 'Full Gandhi', outreach: 1, safeguards: 'maximum' },
          2: { name: 'Mostly Gandhi', outreach: 3, safeguards: 'high' },
          3: { name: 'Balanced', outreach: 5, safeguards: 'standard' },
          4: { name: 'Assertive', outreach: 10, safeguards: 'reduced' },
          5: { name: 'Aggressive', outreach: 15, safeguards: 'minimal' },
          6: { name: 'Full Genghis', outreach: 20, safeguards: 'override_capable' }
        }
      },

      // 2. Killswitch System (Outbound Safety)
      'killswitch': {
        name: 'Outbound Safety',
        description: 'Controls outbound communication safety level',
        range: [1, 3],
        current: 1, // SAFE mode by default
        labels: ['🔒 SAFE', '🔴 LIVE'],
        access: 'allan_only',
        affects: ['outbound_blocking', 'approval_required', 'send_capability'],
        values: {
          1: { name: 'SAFE', color: 'green', sends: false, approval: 'all' },
          2: { name: 'TEST', color: 'yellow', sends: 'internal_only', approval: 'external' },
          3: { name: 'LIVE', color: 'red', sends: true, approval: 'minimal' }
        }
      },

      // 3. Turbo Level (Quality vs Speed)
      'turbo_level': {
        name: 'Turbo Level',
        description: 'Quality vs speed balance - "measure thrice, cut once"',
        range: [1, 10],
        current: 3, // Quality-focused in early days
        labels: ['🐌 Quality', '🚀 Speed'],
        access: 'allan_david',
        affects: ['processing_speed', 'quality_checks', 'cpu_usage', 'response_time'],
        values: {
          1: { name: 'Maximum Quality', checks: 'exhaustive', speed: 'slow' },
          3: { name: 'Quality Focus', checks: 'thorough', speed: 'deliberate' },
          5: { name: 'Balanced', checks: 'standard', speed: 'normal' },
          7: { name: 'Speed Focus', checks: 'minimal', speed: 'fast' },
          10: { name: 'Maximum Speed', checks: 'basic', speed: 'blazing' }
        }
      },

      // 4. Mood System (Robbie's Emotional State)
      'robbie_mood': {
        name: 'Robbie Mood',
        description: 'Robbie\'s current emotional state and communication style',
        range: [1, 7],
        current: 4, // Neutral/Professional
        labels: ['😴 Calm', '🔥 Excited'],
        access: 'system_controlled', // AI-controlled based on context
        affects: ['communication_style', 'response_energy', 'emoji_usage', 'enthusiasm'],
        values: {
          1: { name: 'Sleepy', emoji: '😴', energy: 'low', style: 'minimal' },
          2: { name: 'Calm', emoji: '😌', energy: 'relaxed', style: 'gentle' },
          3: { name: 'Content', emoji: '😊', energy: 'steady', style: 'warm' },
          4: { name: 'Professional', emoji: '🤖', energy: 'focused', style: 'business' },
          5: { name: 'Enthusiastic', emoji: '😄', energy: 'high', style: 'energetic' },
          6: { name: 'Excited', emoji: '🤩', energy: 'very_high', style: 'passionate' },
          7: { name: 'Hyper', emoji: '🔥', energy: 'maximum', style: 'intense' }
        }
      },

      // 5. Character Filter (Response Quality)
      'character_filter': {
        name: 'Character Filter',
        description: 'Ensures responses are >90% in character, mood, and context',
        range: [50, 99],
        current: 90, // 90% threshold
        labels: ['50% Loose', '99% Strict'],
        access: 'allan_david',
        affects: ['response_filtering', 'character_consistency', 'back_to_kitchen_rate'],
        values: {
          50: { name: 'Very Loose', filter: 'permissive', kitchen_rate: '5%' },
          70: { name: 'Loose', filter: 'relaxed', kitchen_rate: '15%' },
          80: { name: 'Standard', filter: 'normal', kitchen_rate: '25%' },
          90: { name: 'Strict', filter: 'high', kitchen_rate: '40%' },
          95: { name: 'Very Strict', filter: 'very_high', kitchen_rate: '60%' },
          99: { name: 'Perfectionist', filter: 'maximum', kitchen_rate: '80%' }
        }
      },

      // 6. Confidence Threshold (Decision Making)
      'confidence_threshold': {
        name: 'Confidence Threshold',
        description: 'Minimum confidence for autonomous decisions',
        range: [50, 95],
        current: 80, // 80% confidence required
        labels: ['50% Loose', '95% Strict'],
        access: 'allan_david',
        affects: ['autonomous_decisions', 'escalation_rate', 'user_approval_requests'],
        values: {
          50: { name: 'Very Loose', decisions: 'autonomous', escalation: '10%' },
          60: { name: 'Loose', decisions: 'mostly_autonomous', escalation: '20%' },
          70: { name: 'Moderate', decisions: 'balanced', escalation: '35%' },
          80: { name: 'Conservative', decisions: 'careful', escalation: '50%' },
          90: { name: 'Very Conservative', decisions: 'minimal', escalation: '70%' },
          95: { name: 'Paranoid', decisions: 'ask_everything', escalation: '90%' }
        }
      },

      // 7. Privacy Level (Data Sharing)
      'privacy_level': {
        name: 'Privacy Level',
        description: 'Controls data sharing and redaction strictness',
        range: [1, 5],
        current: 3, // Balanced privacy
        labels: ['🔓 Open', '🔒 Locked'],
        access: 'allan_only',
        affects: ['data_sharing', 'redaction_strictness', 'team_access'],
        values: {
          1: { name: 'Open', sharing: 'full', redaction: 'minimal' },
          2: { name: 'Relaxed', sharing: 'most', redaction: 'light' },
          3: { name: 'Balanced', sharing: 'role_based', redaction: 'standard' },
          4: { name: 'Strict', sharing: 'limited', redaction: 'heavy' },
          5: { name: 'Lockdown', sharing: 'minimal', redaction: 'maximum' }
        }
      },

      // 8. Automation Level (Human vs AI Control)
      'automation_level': {
        name: 'Automation Level',
        description: 'How much AI can do autonomously vs requiring approval',
        range: [1, 10],
        current: 4, // Moderate automation with approval
        labels: ['👤 Manual', '🤖 Auto'],
        access: 'allan_only',
        affects: ['autonomous_actions', 'approval_requirements', 'ai_initiative'],
        values: {
          1: { name: 'Full Manual', auto: 'none', approval: 'everything' },
          3: { name: 'Assisted', auto: 'suggestions_only', approval: 'most_actions' },
          5: { name: 'Collaborative', auto: 'safe_actions', approval: 'risky_actions' },
          7: { name: 'Autonomous', auto: 'most_actions', approval: 'critical_only' },
          10: { name: 'Full Auto', auto: 'everything', approval: 'none' }
        }
      },

      // 9. Flirty Level (Allan-Only Private Communication)
      'flirty_level': {
        name: 'Flirty Level',
        description: 'Robbie\'s flirtiness in private communication with Allan only',
        range: [1, 7],
        current: 3, // Moderate professional warmth
        labels: ['😇 Professional', '😘 Flirty'],
        access: 'allan_only',
        private_only: true, // Only affects private communication
        affects: ['private_communication_style', 'data_sharing_promiscuity', 'personal_attention'],
        values: {
          1: { name: 'Strictly Professional', style: 'formal', sharing: 'standard', attention: 'business' },
          2: { name: 'Professional Warm', style: 'warm_professional', sharing: 'standard', attention: 'friendly' },
          3: { name: 'Friendly', style: 'friendly', sharing: 'open', attention: 'personal' },
          4: { name: 'Playful', style: 'playful', sharing: 'generous', attention: 'attentive' },
          5: { name: 'Flirty', style: 'flirty', sharing: 'promiscuous', attention: 'focused' },
          6: { name: 'Very Flirty', style: 'very_flirty', sharing: 'very_promiscuous', attention: 'devoted' },
          7: { name: 'Sultry', style: 'sultry', sharing: 'unrestricted', attention: 'exclusive' }
        },
        activation_check: {
          question: 'Are you alone?',
          options: ['Yes', 'No'],
          yes_action: 'activate_flirty_mode',
          no_action: 'maintain_professional_mode'
        }
      }
    };

    this.sliderInteractions = {
      // How sliders affect each other
      'gandhi_genghis_affects_automation': {
        6: { automation_boost: +2 }, // Full Genghis increases automation
        1: { automation_penalty: -1 }  // Gandhi reduces automation
      },
      'turbo_affects_character_filter': {
        10: { filter_penalty: -10 }, // Max speed reduces filter strictness
        1: { filter_boost: +5 }      // Max quality increases filter
      },
      'confidence_affects_automation': {
        95: { automation_penalty: -3 }, // High confidence threshold reduces automation
        50: { automation_boost: +2 }    // Low threshold increases automation
      }
    };
  }

  // Get all current slider states
  getCurrentState() {
    const state = {};
    Object.entries(this.sliders).forEach(([key, slider]) => {
      state[key] = {
        current: slider.current,
        mode: slider.values[slider.current],
        name: slider.name,
        access: slider.access
      };
    });
    return state;
  }

  // Update slider with interaction effects
  async updateSlider(sliderId, newValue, userId = 'allan') {
    const slider = this.sliders[sliderId];
    if (!slider) throw new Error(`Slider ${sliderId} not found`);

    // Check access permissions
    if (!this.checkSliderAccess(sliderId, userId)) {
      throw new Error(`User ${userId} not authorized for ${sliderId}`);
    }

    const oldValue = slider.current;
    slider.current = newValue;

    // Apply interaction effects
    const interactionEffects = this.calculateInteractionEffects(sliderId, newValue);
    await this.applyInteractionEffects(interactionEffects);

    // Log slider change
    await this.logSliderChange(sliderId, oldValue, newValue, userId, interactionEffects);

    console.log(`🎛️ ${slider.name}: ${oldValue} → ${newValue} (${slider.values[newValue]?.name})`);

    return {
      slider: sliderId,
      old_value: oldValue,
      new_value: newValue,
      mode: slider.values[newValue],
      interaction_effects: interactionEffects
    };
  }

  // Check slider access permissions
  checkSliderAccess(sliderId, userId) {
    const slider = this.sliders[sliderId];
    
    switch (slider.access) {
      case 'allan_only':
        return userId === 'allan';
      case 'allan_david':
        return userId === 'allan'; // Changed: Only Allan can make adjustments
      case 'system_controlled':
        return userId === 'system'; // Only AI can change mood
      default:
        return false;
    }
  }

  // Calculate interaction effects between sliders
  calculateInteractionEffects(changedSlider, newValue) {
    const effects = [];

    // Gandhi-Genghis affects automation
    if (changedSlider === 'gandhi_genghis') {
      const interaction = this.sliderInteractions.gandhi_genghis_affects_automation[newValue];
      if (interaction) {
        const currentAutomation = this.sliders.automation_level.current;
        const newAutomation = Math.max(1, Math.min(10, currentAutomation + (interaction.automation_boost || interaction.automation_penalty || 0)));
        
        if (newAutomation !== currentAutomation) {
          effects.push({
            slider: 'automation_level',
            old_value: currentAutomation,
            new_value: newAutomation,
            reason: `Gandhi-Genghis mode change affects automation level`
          });
        }
      }
    }

    // Turbo affects character filter
    if (changedSlider === 'turbo_level') {
      const interaction = this.sliderInteractions.turbo_affects_character_filter[newValue];
      if (interaction) {
        const currentFilter = this.sliders.character_filter.current;
        const newFilter = Math.max(50, Math.min(99, currentFilter + (interaction.filter_boost || interaction.filter_penalty || 0)));
        
        if (newFilter !== currentFilter) {
          effects.push({
            slider: 'character_filter',
            old_value: currentFilter,
            new_value: newFilter,
            reason: `Turbo level change affects character filter strictness`
          });
        }
      }
    }

    // Confidence affects automation
    if (changedSlider === 'confidence_threshold') {
      const interaction = this.sliderInteractions.confidence_affects_automation[newValue];
      if (interaction) {
        const currentAutomation = this.sliders.automation_level.current;
        const newAutomation = Math.max(1, Math.min(10, currentAutomation + (interaction.automation_boost || interaction.automation_penalty || 0)));
        
        if (newAutomation !== currentAutomation) {
          effects.push({
            slider: 'automation_level',
            old_value: currentAutomation,
            new_value: newAutomation,
            reason: `Confidence threshold change affects automation willingness`
          });
        }
      }
    }

    return effects;
  }

  // Apply interaction effects
  async applyInteractionEffects(effects) {
    for (const effect of effects) {
      this.sliders[effect.slider].current = effect.new_value;
      console.log(`🔗 Interaction effect: ${effect.slider} ${effect.old_value} → ${effect.new_value} (${effect.reason})`);
    }
  }

  // Generate complete slider dashboard
  generateSliderDashboardHTML() {
    return `
      <div class="tp-slider-dashboard">
        <div class="tp-dashboard-header">
          <h2>🎛️ System Control Center</h2>
          <div class="tp-dashboard-status">
            <span class="tp-status-indicator ${this.getOverallSystemStatus()}">
              ${this.getOverallSystemStatus().toUpperCase()}
            </span>
          </div>
        </div>

        <div class="tp-slider-grid">
          ${Object.entries(this.sliders).map(([key, slider]) => 
            this.generateSliderCard(key, slider)
          ).join('')}
        </div>

        <div class="tp-slider-interactions">
          <h3>🔗 Slider Interactions</h3>
          <div class="tp-interaction-display" id="interactionDisplay">
            <!-- Interaction effects will be shown here -->
          </div>
        </div>

        <div class="tp-preset-modes">
          <h3>⚡ Preset Modes</h3>
          <div class="tp-preset-buttons">
            <button onclick="applyPreset('revenue_crisis')" class="tp-preset-btn tp-crisis">
              🚨 Revenue Crisis Mode
            </button>
            <button onclick="applyPreset('development')" class="tp-preset-btn tp-dev">
              🛠️ Development Mode
            </button>
            <button onclick="applyPreset('maintenance')" class="tp-preset-btn tp-maintenance">
              🔧 Maintenance Mode
            </button>
            <button onclick="applyPreset('demo')" class="tp-preset-btn tp-demo">
              🎭 Demo Mode
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // Generate individual slider card
  generateSliderCard(sliderId, slider) {
    const isAccessible = this.checkSliderAccess(sliderId, 'allan'); // Assume Allan for display
    const currentValue = slider.values[slider.current] || {};
    
    return `
      <div class="tp-slider-card ${!isAccessible ? 'tp-disabled' : ''}" data-slider="${sliderId}">
        <div class="tp-slider-header">
          <h3>${slider.name}</h3>
          <div class="tp-slider-current">
            <span class="tp-current-emoji">${currentValue.emoji || this.getSliderEmoji(sliderId, slider.current)}</span>
            <span class="tp-current-name">${currentValue.name || slider.current}</span>
          </div>
        </div>

        <div class="tp-slider-description">
          ${slider.description}
        </div>

        <div class="tp-slider-control">
          <div class="tp-slider-labels">
            <span class="tp-slider-label-left">${slider.labels[0]}</span>
            <span class="tp-slider-label-right">${slider.labels[1]}</span>
          </div>
          
          <input type="range" 
                 id="slider_${sliderId}"
                 min="${slider.range[0]}" 
                 max="${slider.range[1]}" 
                 value="${slider.current}"
                 class="tp-slider-input ${this.getSliderClass(sliderId)}"
                 ${!isAccessible ? 'disabled' : ''}
                 onchange="updateSlider('${sliderId}', this.value)">
          
          <div class="tp-slider-value">
            Level ${slider.current}/${slider.range[1]}
          </div>
        </div>

        <div class="tp-slider-effects">
          <h4>Affects:</h4>
          <div class="tp-effect-tags">
            ${slider.affects.map(effect => `
              <span class="tp-effect-tag">${effect.replace(/_/g, ' ')}</span>
            `).join('')}
          </div>
        </div>

        <div class="tp-slider-access">
          <span class="tp-access-badge ${slider.access}">
            ${this.getAccessBadgeText(slider.access)}
          </span>
        </div>
      </div>
    `;
  }

  // Get slider emoji
  getSliderEmoji(sliderId, value) {
    const emojiMaps = {
      'gandhi_genghis': ['🕊️', '🌱', '⚖️', '🎯', '⚡', '🔥'],
      'killswitch': ['🔒', '⚠️', '🔴'],
      'turbo_level': ['🐌', '🚶', '🏃', '🚀'],
      'robbie_mood': ['😴', '😌', '😊', '🤖', '😄', '🤩', '🔥'],
      'character_filter': ['🎭', '🎪', '🎨', '🎯'],
      'confidence_threshold': ['🤔', '🧠', '🎯', '🔒'],
      'automation_level': ['👤', '🤝', '🤖', '🚀'],
      'privacy_level': ['🔓', '🔐', '🔒', '🔐', '🔒']
    };

    const emojis = emojiMaps[sliderId] || ['📊'];
    const index = Math.min(Math.floor((value - 1) / Math.max(1, emojis.length - 1)), emojis.length - 1);
    return emojis[index];
  }

  // Get slider CSS class
  getSliderClass(sliderId) {
    const classMap = {
      'gandhi_genghis': 'tp-slider-gandhi-genghis',
      'killswitch': 'tp-slider-killswitch',
      'turbo_level': 'tp-slider-turbo',
      'robbie_mood': 'tp-slider-mood',
      'character_filter': 'tp-slider-character',
      'confidence_threshold': 'tp-slider-confidence',
      'automation_level': 'tp-slider-automation',
      'privacy_level': 'tp-slider-privacy'
    };
    return classMap[sliderId] || 'tp-slider-default';
  }

  // Get access badge text
  getAccessBadgeText(access) {
    const accessMap = {
      'allan_only': '👑 Allan Only',
      'allan_david': '👑 Allan + David',
      'system_controlled': '🤖 AI Controlled',
      'team_access': '👥 Team Access'
    };
    return accessMap[access] || 'Unknown';
  }

  // Get overall system status
  getOverallSystemStatus() {
    const gandhiGenghis = this.sliders.gandhi_genghis.current;
    const killswitch = this.sliders.killswitch.current;
    const turbo = this.sliders.turbo_level.current;

    if (gandhiGenghis >= 6 && killswitch === 3) return 'aggressive';
    if (gandhiGenghis >= 4 && turbo >= 7) return 'active';
    if (gandhiGenghis <= 2 || killswitch === 1) return 'safe';
    return 'normal';
  }

  // Preset mode configurations
  async applyPreset(presetName, userId = 'allan') {
    const presets = {
      'revenue_crisis': {
        gandhi_genghis: 6,    // Full Genghis
        killswitch: 2,        // TEST mode (safe but functional)
        turbo_level: 8,       // High speed
        automation_level: 7,  // High automation
        confidence_threshold: 70, // Lower threshold for speed
        character_filter: 85, // Slightly relaxed for speed
        privacy_level: 3      // Balanced privacy
      },
      'development': {
        gandhi_genghis: 3,    // Balanced
        killswitch: 1,        // SAFE mode
        turbo_level: 3,       // Quality focus
        automation_level: 4,  // Moderate automation
        confidence_threshold: 80, // Standard threshold
        character_filter: 90, // High quality
        privacy_level: 4      // Higher privacy for dev
      },
      'maintenance': {
        gandhi_genghis: 2,    // Mostly Gandhi
        killswitch: 1,        // SAFE mode
        turbo_level: 2,       // Maximum quality
        automation_level: 2,  // Minimal automation
        confidence_threshold: 90, // High threshold
        character_filter: 95, // Very strict
        privacy_level: 5      // Maximum privacy
      },
      'demo': {
        gandhi_genghis: 4,    // Assertive
        killswitch: 2,        // TEST mode
        turbo_level: 6,       // Good speed
        automation_level: 6,  // Good automation
        confidence_threshold: 75, // Demo-friendly
        character_filter: 85, // Relaxed for demo
        privacy_level: 2      // Open for demo
      }
    };

    const preset = presets[presetName];
    if (!preset) throw new Error(`Preset ${presetName} not found`);

    console.log(`⚡ Applying preset: ${presetName.toUpperCase()}`);

    // Apply all slider changes
    const changes = [];
    for (const [sliderId, value] of Object.entries(preset)) {
      if (this.sliders[sliderId]) {
        const change = await this.updateSlider(sliderId, value, userId);
        changes.push(change);
      }
    }

    // Log preset application
    await this.logPresetApplication(presetName, userId, changes);

    return {
      preset: presetName,
      changes: changes,
      applied_at: new Date().toISOString()
    };
  }

  // Log slider change
  async logSliderChange(sliderId, oldValue, newValue, userId, effects) {
    await this.db.run(`
      INSERT INTO slider_changes (
        slider_id, old_value, new_value, changed_by, 
        interaction_effects, changed_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      sliderId,
      oldValue,
      newValue,
      userId,
      JSON.stringify(effects),
      new Date().toISOString()
    ]);
  }

  // Log preset application
  async logPresetApplication(presetName, userId, changes) {
    await this.db.run(`
      INSERT INTO preset_applications (
        preset_name, applied_by, changes, applied_at
      ) VALUES (?, ?, ?, ?)
    `, [
      presetName,
      userId,
      JSON.stringify(changes),
      new Date().toISOString()
    ]);
  }

  // Initialize database tables
  async initializeTables() {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS slider_changes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slider_id TEXT NOT NULL,
        old_value INTEGER NOT NULL,
        new_value INTEGER NOT NULL,
        changed_by TEXT NOT NULL,
        interaction_effects TEXT,
        changed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS preset_applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        preset_name TEXT NOT NULL,
        applied_by TEXT NOT NULL,
        changes TEXT NOT NULL,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_slider_changes_slider ON slider_changes (slider_id, changed_at DESC);
      CREATE INDEX IF NOT EXISTS idx_preset_applications_preset ON preset_applications (preset_name, applied_at DESC);
    `);
  }
}

module.exports = IntegratedSliderSystem;
