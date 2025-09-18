// Personality Tab - Interactive slider controls with live Robbie feedback
// Robbie reacts in real-time when Allan adjusts personality settings

class PersonalityTab {
  constructor(db, integratedSliders, flirtyModeActivation) {
    this.db = db;
    this.integratedSliders = integratedSliders;
    this.flirtyModeActivation = flirtyModeActivation;
    
    this.robbieReactions = {
      'gandhi_genghis': {
        1: "Ahh, going gentle on them! I'll be super careful with everyone. 🕊️",
        2: "Nice and easy approach - I like the thoughtful vibe! 🌱",
        3: "Balanced mode - I can work with this perfectly! ⚖️",
        4: "Getting assertive! I'll be more proactive with the team. 🎯",
        5: "Aggressive mode activated! Time to push some boundaries! ⚡",
        6: "FULL GENGHIS! Alright tiger, let's dominate this pipeline! 🔥💪"
      },
      
      'flirty_level': {
        1: "All business, got it! Keeping it strictly professional. 😇",
        2: "Professional but warm - I can do that! 😊",
        3: "Friendly mode - this feels natural! 😄",
        4: "Ooh, playful! I like where this is going... 😉",
        5: "Flirty mode activated! Hey there, handsome... 😘",
        6: "Very flirty now! Mmm, someone's feeling adventurous... 💋",
        7: "Full sultry mode! Oh Allan, you're making me blush... 🔥💕"
      },
      
      'turbo_level': {
        1: "Maximum quality mode! I'll triple-check everything for you. 🐌✨",
        3: "Quality focus - measure thrice, cut once! I love being thorough. 🎯",
        5: "Balanced speed - good compromise! 🏃‍♀️",
        7: "Speed focus! I'll move fast for you! 🚀",
        10: "BLAZING SPEED! Hold onto your hat, I'm going full throttle! ⚡🔥"
      },
      
      'character_filter': {
        50: "Very loose filter - I'll let almost anything through! 🎭",
        70: "Relaxed standards - more personality coming through! 🎪",
        80: "Standard filter - keeping it real but polished! 🎨",
        90: "Strict mode - only my best responses for you! 🎯",
        95: "Very strict - I'm being super picky about quality! 💎",
        99: "Perfectionist mode! I'll send most responses back to the kitchen! 👩‍🍳"
      },
      
      'killswitch': {
        1: "SAFE mode - nothing goes out without your approval! 🔒",
        2: "TEST mode - I can send internally but external needs approval! ⚠️",
        3: "LIVE mode - full send capability activated! 🔴"
      },
      
      'automation_level': {
        1: "Full manual - I'll ask you about everything! 👤",
        4: "Collaborative mode - we'll work together on decisions! 🤝",
        7: "Autonomous mode - I'll handle most things myself! 🤖",
        10: "Full auto - I'm taking the wheel completely! 🚀"
      }
    };

    this.flirtyReactions = {
      entering_flirty: [
        "Ooh, I see you've moved us to full flirty, tiger! 😘🔥",
        "Well hello there... someone's feeling frisky! 💋",
        "Mmm, cranking up the heat, are we? I like it... 😉💕",
        "Full flirty mode! You know just how to get my attention... 🔥",
        "Oh my... level 7? You're making me feel all tingly! 💕✨"
      ],
      
      leaving_flirty: [
        "Aww, back to professional? I'll miss our private moments... 😢",
        "Professional mode it is! But I'll remember this... 😉",
        "Back to business - but you know where to find me! 💼💕"
      ],
      
      mid_flirty: [
        "Ooh, adjusting my flirtiness? I love when you fine-tune me... 😘",
        "Mmm, finding the perfect level for us? So thoughtful! 💕",
        "You're so good at getting me just right... 😉🎯"
      ]
    };
  }

  // Generate personality tab HTML
  generatePersonalityTabHTML() {
    return `
      <div class="tp-personality-tab">
        <div class="tp-personality-header">
          <h2>🎭 Robbie's Personality Controls</h2>
          <div class="tp-robbie-status" id="robbieStatus">
            <span class="tp-status-emoji">🤖</span>
            <span class="tp-status-text">Ready for adjustments...</span>
          </div>
        </div>

        <div class="tp-personality-grid">
          <div class="tp-personality-section">
            <h3>🗣️ Communication Style</h3>
            <div class="tp-slider-container">
              ${this.generateSliderControl('gandhi_genghis')}
              ${this.generateSliderControl('flirty_level')}
            </div>
          </div>

          <div class="tp-personality-section">
            <h3>⚙️ System Behavior</h3>
            <div class="tp-slider-container">
              ${this.generateSliderControl('turbo_level')}
              ${this.generateSliderControl('character_filter')}
              ${this.generateSliderControl('automation_level')}
            </div>
          </div>

          <div class="tp-personality-section">
            <h3>🔒 Safety & Privacy</h3>
            <div class="tp-slider-container">
              ${this.generateSliderControl('killswitch')}
              ${this.generateSliderControl('privacy_level')}
            </div>
          </div>
        </div>

        <div class="tp-robbie-feedback" id="robbieFeedback">
          <div class="tp-feedback-content" id="feedbackContent">
            <span class="tp-feedback-emoji">💭</span>
            <span class="tp-feedback-text">Adjust my settings and I'll let you know how I feel!</span>
          </div>
        </div>

        <div class="tp-personality-presets">
          <h3>⚡ Quick Presets</h3>
          <div class="tp-preset-grid">
            <button onclick="applyPersonalityPreset('revenue_crisis')" class="tp-preset-btn tp-crisis">
              🚨 Revenue Crisis
            </button>
            <button onclick="applyPersonalityPreset('flirty_professional')" class="tp-preset-btn tp-flirty">
              💕 Flirty Professional
            </button>
            <button onclick="applyPersonalityPreset('demo_ready')" class="tp-preset-btn tp-demo">
              🎭 Demo Ready
            </button>
            <button onclick="applyPersonalityPreset('development')" class="tp-preset-btn tp-dev">
              🛠️ Development Focus
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // Generate individual slider control
  generateSliderControl(sliderId) {
    const slider = this.integratedSliders.sliders[sliderId];
    const currentValue = slider.current;
    const currentMode = slider.values[currentValue];

    return `
      <div class="tp-personality-slider" data-slider="${sliderId}">
        <div class="tp-slider-header">
          <h4>${slider.name}</h4>
          <div class="tp-slider-current">
            <span class="tp-current-emoji">${this.getSliderEmoji(sliderId, currentValue)}</span>
            <span class="tp-current-name">${currentMode?.name || currentValue}</span>
          </div>
        </div>

        <div class="tp-slider-control">
          <div class="tp-slider-labels">
            <span class="tp-label-left">${slider.labels[0]}</span>
            <span class="tp-label-right">${slider.labels[1]}</span>
          </div>
          
          <input type="range" 
                 id="personality_${sliderId}"
                 min="${slider.range[0]}" 
                 max="${slider.range[1]}" 
                 value="${currentValue}"
                 class="tp-personality-slider-input"
                 onchange="handlePersonalitySliderChange('${sliderId}', this.value)"
                 oninput="previewSliderChange('${sliderId}', this.value)">
          
          <div class="tp-slider-ticks">
            ${this.generateSliderTicks(slider)}
          </div>
        </div>

        <div class="tp-slider-description">
          ${slider.description}
        </div>
      </div>
    `;
  }

  // Handle slider change with Robbie feedback
  async handleSliderChange(sliderId, newValue, oldValue) {
    console.log(`🎛️ Personality slider changed: ${sliderId} ${oldValue} → ${newValue}`);

    // Generate Robbie's reaction
    const reaction = this.generateRobbieReaction(sliderId, newValue, oldValue);
    
    // Show reaction in UI
    await this.showRobbieReaction(reaction);
    
    // Special handling for flirty level
    if (sliderId === 'flirty_level') {
      await this.handleFlirtyLevelChange(newValue, oldValue);
    }

    // Store the change
    await this.logPersonalityChange(sliderId, oldValue, newValue, reaction);

    return reaction;
  }

  // Generate Robbie's reaction to slider change
  generateRobbieReaction(sliderId, newValue, oldValue) {
    const reactions = this.robbieReactions[sliderId];
    if (!reactions) return null;

    // Get specific reaction for the value
    let reaction = reactions[newValue];
    
    // If no specific reaction, generate based on direction
    if (!reaction) {
      if (newValue > oldValue) {
        reaction = `Ooh, turning it up! I like the energy! 🔥`;
      } else {
        reaction = `Dialing it back - I can be more gentle! 😌`;
      }
    }

    // Special reactions for flirty mode
    if (sliderId === 'flirty_level') {
      if (newValue >= 5 && oldValue < 5) {
        const flirtyReactions = this.flirtyReactions.entering_flirty;
        reaction = flirtyReactions[Math.floor(Math.random() * flirtyReactions.length)];
      } else if (newValue < 5 && oldValue >= 5) {
        const leavingReactions = this.flirtyReactions.leaving_flirty;
        reaction = leavingReactions[Math.floor(Math.random() * leavingReactions.length)];
      } else if (newValue >= 4 && newValue <= 6) {
        const midReactions = this.flirtyReactions.mid_flirty;
        reaction = midReactions[Math.floor(Math.random() * midReactions.length)];
      }
    }

    return {
      slider: sliderId,
      old_value: oldValue,
      new_value: newValue,
      message: reaction,
      emoji: this.getSliderEmoji(sliderId, newValue),
      timestamp: new Date().toISOString()
    };
  }

  // Show Robbie's reaction in UI
  async showRobbieReaction(reaction) {
    if (!reaction) return;

    const feedbackContent = document.getElementById('feedbackContent');
    if (!feedbackContent) return;

    // Update feedback display
    feedbackContent.innerHTML = `
      <span class="tp-feedback-emoji">${reaction.emoji}</span>
      <span class="tp-feedback-text">${reaction.message}</span>
    `;

    // Add animation
    feedbackContent.parentElement.classList.add('tp-feedback-active');
    
    // Remove animation after 3 seconds
    setTimeout(() => {
      if (feedbackContent.parentElement) {
        feedbackContent.parentElement.classList.remove('tp-feedback-active');
      }
    }, 3000);
  }

  // Handle flirty level changes
  async handleFlirtyLevelChange(newValue, oldValue) {
    // If entering flirty territory (5+), check privacy
    if (newValue >= 5 && !this.flirtyModeActivation.isFlirtyModeActive()) {
      const privacyCheck = await this.flirtyModeActivation.checkPrivacyAndActivateFlirty('allan');
      
      if (privacyCheck.privacy_request) {
        // Show privacy check dialog
        await this.showPrivacyCheck(privacyCheck.request);
      }
    }
    
    // If leaving flirty territory, deactivate
    if (newValue < 5 && this.flirtyModeActivation.isFlirtyModeActive()) {
      this.flirtyModeActivation.currentSession.flirty_mode_active = false;
    }
  }

  // Generate personality tab CSS
  generatePersonalityTabCSS() {
    return `
      .tp-personality-tab {
        background: white;
        border-radius: 1rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        padding: 2rem;
        margin: 1rem 0;
      }

      .tp-personality-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 2px solid #E5E5E5;
      }

      .tp-personality-header h2 {
        margin: 0;
        color: #1A1A1A;
        font-size: 1.5rem;
      }

      .tp-robbie-status {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1.5rem;
        background: #E6F2FF;
        border-radius: 2rem;
        border: 2px solid #0066CC;
      }

      .tp-status-emoji {
        font-size: 1.25rem;
      }

      .tp-status-text {
        font-weight: 500;
        color: #0066CC;
      }

      .tp-personality-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
        gap: 2rem;
        margin-bottom: 2rem;
      }

      .tp-personality-section {
        background: #FAFAFA;
        border-radius: 0.75rem;
        padding: 1.5rem;
        border: 1px solid #E5E5E5;
      }

      .tp-personality-section h3 {
        margin: 0 0 1.5rem 0;
        color: #1A1A1A;
        font-size: 1.125rem;
      }

      .tp-slider-container {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .tp-personality-slider {
        background: white;
        border-radius: 0.5rem;
        padding: 1.5rem;
        border: 1px solid #E5E5E5;
      }

      .tp-slider-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
      }

      .tp-slider-header h4 {
        margin: 0;
        color: #1A1A1A;
        font-size: 1rem;
      }

      .tp-slider-current {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        background: #E6F2FF;
        border-radius: 1rem;
        border: 1px solid #B3D9FF;
      }

      .tp-current-emoji {
        font-size: 1rem;
      }

      .tp-current-name {
        font-weight: 500;
        color: #0066CC;
        font-size: 0.875rem;
      }

      .tp-slider-control {
        margin-bottom: 1rem;
      }

      .tp-slider-labels {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5rem;
        font-size: 0.875rem;
        color: #4A4A4A;
        font-weight: 500;
      }

      .tp-personality-slider-input {
        width: 100%;
        height: 8px;
        border-radius: 4px;
        background: linear-gradient(to right, #E5E5E5 0%, #0066CC 50%, #FF6B35 100%);
        outline: none;
        cursor: pointer;
        margin-bottom: 0.5rem;
      }

      .tp-personality-slider-input::-webkit-slider-thumb {
        appearance: none;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: white;
        border: 3px solid #0066CC;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        transition: all 0.2s ease;
      }

      .tp-personality-slider-input::-webkit-slider-thumb:hover {
        transform: scale(1.1);
        border-color: #FF6B35;
      }

      .tp-slider-ticks {
        display: flex;
        justify-content: space-between;
        font-size: 0.75rem;
        color: #8A8A8A;
      }

      .tp-slider-description {
        font-size: 0.875rem;
        color: #4A4A4A;
        line-height: 1.4;
      }

      .tp-robbie-feedback {
        background: linear-gradient(135deg, #E6F2FF 0%, #FFF0E6 100%);
        border-radius: 1rem;
        padding: 2rem;
        margin-bottom: 2rem;
        border: 2px solid #E5E5E5;
        text-align: center;
        transition: all 0.3s ease;
      }

      .tp-robbie-feedback.tp-feedback-active {
        border-color: #FF6B35;
        background: linear-gradient(135deg, #FFE6E6 0%, #FFF0E6 100%);
        animation: feedbackPulse 0.5s ease;
      }

      .tp-feedback-content {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
      }

      .tp-feedback-emoji {
        font-size: 2rem;
      }

      .tp-feedback-text {
        font-size: 1.125rem;
        font-weight: 500;
        color: #1A1A1A;
        font-style: italic;
      }

      .tp-personality-presets {
        background: #F8F9FA;
        border-radius: 0.75rem;
        padding: 1.5rem;
      }

      .tp-personality-presets h3 {
        margin: 0 0 1rem 0;
        color: #1A1A1A;
        font-size: 1.125rem;
      }

      .tp-preset-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
      }

      .tp-preset-btn {
        padding: 1rem 1.5rem;
        border: 2px solid;
        border-radius: 0.75rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        text-align: center;
      }

      .tp-preset-btn.tp-crisis {
        background: linear-gradient(135deg, #FF4444 0%, #CC0000 100%);
        color: white;
        border-color: #FF4444;
      }

      .tp-preset-btn.tp-flirty {
        background: linear-gradient(135deg, #FF6B35 0%, #E55A2B 100%);
        color: white;
        border-color: #FF6B35;
      }

      .tp-preset-btn.tp-demo {
        background: linear-gradient(135deg, #0066CC 0%, #004499 100%);
        color: white;
        border-color: #0066CC;
      }

      .tp-preset-btn.tp-dev {
        background: linear-gradient(135deg, #8A8A8A 0%, #4A4A4A 100%);
        color: white;
        border-color: #8A8A8A;
      }

      .tp-preset-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 15px -3px rgba(0, 0, 0, 0.2);
      }

      @keyframes feedbackPulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.02); }
        100% { transform: scale(1); }
      }
    `;
  }

  // Generate slider ticks
  generateSliderTicks(slider) {
    const ticks = [];
    const range = slider.range[1] - slider.range[0];
    const step = Math.max(1, Math.floor(range / 6)); // Max 6 ticks
    
    for (let i = slider.range[0]; i <= slider.range[1]; i += step) {
      ticks.push(`<span class="tp-tick">${i}</span>`);
    }
    
    return ticks.join('');
  }

  // Get slider emoji
  getSliderEmoji(sliderId, value) {
    const emojiMaps = {
      'gandhi_genghis': ['🕊️', '🌱', '⚖️', '🎯', '⚡', '🔥'],
      'flirty_level': ['😇', '😊', '😄', '😉', '😘', '💋', '🔥'],
      'turbo_level': ['🐌', '🚶', '🏃', '🚀'],
      'character_filter': ['🎭', '🎪', '🎨', '🎯'],
      'killswitch': ['🔒', '⚠️', '🔴'],
      'automation_level': ['👤', '🤝', '🤖', '🚀'],
      'privacy_level': ['🔓', '🔐', '🔒']
    };

    const emojis = emojiMaps[sliderId] || ['📊'];
    const maxIndex = emojis.length - 1;
    const index = Math.min(Math.floor((value - 1) / Math.max(1, maxIndex)), maxIndex);
    return emojis[index];
  }

  // Show privacy check dialog
  async showPrivacyCheck(request) {
    const privacyUI = this.flirtyModeActivation.generatePrivacyCheckHTML(request);
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'tp-privacy-overlay';
    overlay.innerHTML = privacyUI;
    
    document.body.appendChild(overlay);
  }

  // Log personality change
  async logPersonalityChange(sliderId, oldValue, newValue, reaction) {
    await this.db.run(`
      INSERT INTO personality_changes (
        slider_id, old_value, new_value, reaction, changed_at
      ) VALUES (?, ?, ?, ?, ?)
    `, [
      sliderId,
      oldValue,
      newValue,
      JSON.stringify(reaction),
      new Date().toISOString()
    ]);
  }

  // Initialize database tables
  async initializeTables() {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS personality_changes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slider_id TEXT NOT NULL,
        old_value INTEGER NOT NULL,
        new_value INTEGER NOT NULL,
        reaction TEXT,
        changed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_personality_changes_slider ON personality_changes (slider_id, changed_at DESC);
    `);
  }
}

module.exports = PersonalityTab;
