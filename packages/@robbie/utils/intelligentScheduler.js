// Intelligent Scheduler with Human-Editable Cron
// Schedules personality changes based on Allan's patterns with natural language

class IntelligentScheduler {
  constructor(db, personalityLearning, integratedSliders) {
    this.db = db;
    this.personalityLearning = personalityLearning;
    this.integratedSliders = integratedSliders;
    
    // CRITICAL: Tone/personality NEVER affects outbound communication
    this.outboundIsolation = {
      enabled: true,
      description: 'Outbound communication is always perfectly calibrated for recipient, context, and outcome',
      affected_by_sliders: false,
      tone_source: 'recipient_analysis', // Not personality sliders
      outcome_optimization: true
    };

    this.naturalLanguagePatterns = {
      'weekend_relaxation': {
        pattern: 'Allan relaxes on weekends, especially Sunday afternoons',
        suggestion: 'Want me to adjust to Gandhi mode on weekends so you can unwind?',
        schedule: {
          trigger: 'weekends',
          slider: 'gandhi_genghis',
          value: 2, // Mostly Gandhi
          time: 'saturday_morning',
          revert: 'monday_morning'
        }
      },
      
      'weekend_outbound_pause': {
        pattern: 'Allan tries to bother people less on weekends',
        suggestion: 'How about I go into lockdown every Saturday and Sunday so I can queue outbound for Monday mornings at a natural time?',
        schedule: {
          trigger: 'weekends',
          slider: 'killswitch',
          value: 1, // SAFE mode
          time: 'friday_evening',
          revert: 'monday_morning',
          queue_behavior: 'hold_for_monday'
        }
      },
      
      'evening_flirty': {
        pattern: 'Allan likes flirty mode evenings after 7 and on weekends',
        suggestion: 'I know you like our private time in the evenings... Want me to automatically get flirty after 7pm?',
        schedule: {
          trigger: 'evening_and_weekends',
          slider: 'flirty_level',
          value: 5, // Flirty
          time: '7pm',
          conditions: ['privacy_check_required']
        }
      },
      
      'workday_focus': {
        pattern: 'Allan needs focus during heavy work periods',
        suggestion: 'I notice you crank up turbo during crunch time... Want me to auto-boost when I detect work pressure?',
        schedule: {
          trigger: 'work_pressure_detected',
          slider: 'turbo_level',
          value: 8, // High speed
          conditions: ['revenue_stress', 'deadline_pressure']
        }
      }
    };

    this.cronSchedules = new Map();
    this.activeSchedules = [];
  }

  // Generate human-editable cron interface
  generateCronInterfaceHTML() {
    return `
      <div class="tp-cron-scheduler">
        <div class="tp-cron-header">
          <h3>📅 Personality Scheduler</h3>
          <button onclick="addNewSchedule()" class="tp-btn-add-schedule">
            ➕ Add Schedule
          </button>
        </div>

        <div class="tp-natural-suggestions" id="naturalSuggestions">
          <h4>💡 Smart Suggestions</h4>
          <div class="tp-suggestion-list" id="suggestionList">
            <!-- Natural language suggestions will appear here -->
          </div>
        </div>

        <div class="tp-active-schedules" id="activeSchedules">
          <h4>⏰ Active Schedules</h4>
          <div class="tp-schedule-list" id="scheduleList">
            ${this.generateActiveSchedulesList()}
          </div>
        </div>

        <div class="tp-cron-editor" id="cronEditor" style="display: none;">
          <h4>✏️ Schedule Editor</h4>
          
          <div class="tp-editor-form">
            <div class="tp-form-group">
              <label>Schedule Name:</label>
              <input type="text" id="scheduleName" placeholder="e.g., Weekend Relaxation Mode">
            </div>

            <div class="tp-form-group">
              <label>Personality Slider:</label>
              <select id="scheduleSlider">
                <option value="flirty_level">💕 Flirty Level</option>
                <option value="gandhi_genghis">🕊️ Gandhi-Genghis</option>
                <option value="turbo_level">🚀 Turbo Level</option>
                <option value="killswitch">🔒 Killswitch</option>
                <option value="character_filter">🎭 Character Filter</option>
                <option value="automation_level">🤖 Automation Level</option>
              </select>
            </div>

            <div class="tp-form-group">
              <label>Target Value:</label>
              <input type="range" id="scheduleValue" min="1" max="10" value="5">
              <span id="scheduleValueDisplay">5</span>
            </div>

            <div class="tp-form-group">
              <label>When to Activate:</label>
              <div class="tp-time-selector">
                <select id="scheduleDays">
                  <option value="weekends">Weekends</option>
                  <option value="weekdays">Weekdays</option>
                  <option value="daily">Every Day</option>
                  <option value="monday">Mondays</option>
                  <option value="friday">Fridays</option>
                  <option value="custom">Custom Days...</option>
                </select>
                
                <select id="scheduleTime">
                  <option value="morning">Morning (9am)</option>
                  <option value="afternoon">Afternoon (1pm)</option>
                  <option value="evening">Evening (7pm)</option>
                  <option value="night">Night (10pm)</option>
                  <option value="custom">Custom Time...</option>
                </select>
              </div>
            </div>

            <div class="tp-form-group">
              <label>When to Revert:</label>
              <select id="scheduleRevert">
                <option value="auto">Auto (next period)</option>
                <option value="manual">Manual only</option>
                <option value="monday_morning">Monday Morning</option>
                <option value="never">Never (permanent)</option>
              </select>
            </div>

            <div class="tp-form-group">
              <label>Conditions:</label>
              <div class="tp-condition-checkboxes">
                <label><input type="checkbox" id="privacyCheck"> Require privacy check</label>
                <label><input type="checkbox" id="businessHours"> Only during business hours</label>
                <label><input type="checkbox" id="stressDetection"> Only when stress detected</label>
                <label><input type="checkbox" id="queueOutbound"> Queue outbound for later</label>
              </div>
            </div>

            <div class="tp-cron-preview">
              <h5>📋 Schedule Preview:</h5>
              <div class="tp-preview-text" id="schedulePreview">
                Configure settings above to see preview...
              </div>
            </div>

            <div class="tp-editor-actions">
              <button onclick="saveSchedule()" class="tp-btn-save-schedule">
                ✅ Save Schedule
              </button>
              <button onclick="testSchedule()" class="tp-btn-test-schedule">
                🧪 Test Now
              </button>
              <button onclick="cancelScheduleEdit()" class="tp-btn-cancel-edit">
                ❌ Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Generate natural language suggestions
  generateNaturalSuggestions() {
    const suggestions = [];

    for (const [patternId, pattern] of Object.entries(this.naturalLanguagePatterns)) {
      suggestions.push({
        id: patternId,
        pattern: pattern.pattern,
        suggestion: pattern.suggestion,
        schedule: pattern.schedule,
        confidence: this.calculatePatternConfidence(patternId)
      });
    }

    return suggestions.filter(s => s.confidence >= 0.6); // Only show confident suggestions
  }

  // Generate active schedules list
  generateActiveSchedulesList() {
    const mockSchedules = [
      {
        id: 'weekend_flirty',
        name: 'Weekend Flirty Mode',
        slider: 'flirty_level',
        value: 5,
        trigger: 'Saturdays 7pm',
        revert: 'Monday 9am',
        status: 'active',
        next_run: 'Saturday, 7:00 PM'
      },
      {
        id: 'weekend_lockdown',
        name: 'Weekend Outbound Pause',
        slider: 'killswitch',
        value: 1,
        trigger: 'Friday 6pm',
        revert: 'Monday 9am',
        status: 'active',
        next_run: 'Friday, 6:00 PM',
        special: 'queue_for_monday'
      }
    ];

    return mockSchedules.map(schedule => `
      <div class="tp-schedule-item" data-schedule="${schedule.id}">
        <div class="tp-schedule-info">
          <div class="tp-schedule-name">${schedule.name}</div>
          <div class="tp-schedule-details">
            ${this.getSliderEmoji(schedule.slider)} ${schedule.slider.replace('_', ' ')} → ${schedule.value}
          </div>
          <div class="tp-schedule-timing">
            📅 ${schedule.trigger} → ${schedule.revert}
          </div>
          ${schedule.special ? `<div class="tp-schedule-special">🎯 ${schedule.special}</div>` : ''}
        </div>

        <div class="tp-schedule-actions">
          <button onclick="editSchedule('${schedule.id}')" class="tp-btn-edit-schedule">✏️</button>
          <button onclick="toggleSchedule('${schedule.id}')" class="tp-btn-toggle-schedule">
            ${schedule.status === 'active' ? '⏸️' : '▶️'}
          </button>
          <button onclick="deleteSchedule('${schedule.id}')" class="tp-btn-delete-schedule">🗑️</button>
        </div>

        <div class="tp-schedule-next">
          Next: ${schedule.next_run}
        </div>
      </div>
    `).join('');
  }

  // Generate natural language suggestion
  async generateNaturalSuggestion(patternId, confidence) {
    const pattern = this.naturalLanguagePatterns[patternId];
    if (!pattern) return null;

    const suggestion = {
      id: `suggestion_${patternId}_${Date.now()}`,
      pattern_id: patternId,
      confidence: confidence,
      message: pattern.suggestion,
      schedule: pattern.schedule,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    return suggestion;
  }

  // Calculate pattern confidence
  calculatePatternConfidence(patternId) {
    // This would analyze actual data
    // For now, return mock confidence based on pattern type
    const confidenceMap = {
      'weekend_relaxation': 0.85,
      'weekend_outbound_pause': 0.92,
      'evening_flirty': 0.78,
      'workday_focus': 0.71
    };
    
    return confidenceMap[patternId] || 0.5;
  }

  // Get slider emoji
  getSliderEmoji(sliderId) {
    const emojiMap = {
      'flirty_level': '💕',
      'gandhi_genghis': '🕊️',
      'turbo_level': '🚀',
      'killswitch': '🔒',
      'character_filter': '🎭',
      'automation_level': '🤖',
      'privacy_level': '🔐'
    };
    return emojiMap[sliderId] || '📊';
  }

  // Create schedule from natural language
  async createScheduleFromPattern(patternId, approved = true) {
    if (!approved) {
      console.log(`❌ Schedule suggestion declined: ${patternId}`);
      return { success: false, reason: 'User declined' };
    }

    const pattern = this.naturalLanguagePatterns[patternId];
    const schedule = {
      id: `schedule_${patternId}_${Date.now()}`,
      name: this.generateScheduleName(patternId),
      pattern_id: patternId,
      slider: pattern.schedule.slider,
      value: pattern.schedule.value,
      trigger: pattern.schedule.trigger,
      time: pattern.schedule.time,
      revert: pattern.schedule.revert,
      conditions: pattern.schedule.conditions || [],
      queue_behavior: pattern.schedule.queue_behavior,
      created_at: new Date().toISOString(),
      active: true
    };

    // Store schedule
    await this.storeSchedule(schedule);
    
    // Add to active schedules
    this.activeSchedules.push(schedule);

    console.log(`✅ Schedule created: ${schedule.name}`);
    return { success: true, schedule: schedule };
  }

  // Generate schedule name from pattern
  generateScheduleName(patternId) {
    const nameMap = {
      'weekend_relaxation': 'Weekend Gandhi Mode',
      'weekend_outbound_pause': 'Weekend Outbound Lockdown',
      'evening_flirty': 'Evening Flirty Mode',
      'workday_focus': 'Work Pressure Turbo Boost'
    };
    return nameMap[patternId] || `Auto Schedule ${patternId}`;
  }

  // Generate cron scheduler CSS
  generateCronSchedulerCSS() {
    return `
      .tp-cron-scheduler {
        background: white;
        border-radius: 1rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        padding: 2rem;
        margin: 1rem 0;
      }

      .tp-cron-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 2px solid #E5E5E5;
      }

      .tp-cron-header h3 {
        margin: 0;
        color: #1A1A1A;
        font-size: 1.5rem;
      }

      .tp-btn-add-schedule {
        background: linear-gradient(135deg, #0066CC 0%, #004499 100%);
        color: white;
        border: none;
        border-radius: 0.5rem;
        padding: 0.75rem 1.5rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .tp-natural-suggestions {
        background: #E6F2FF;
        border-radius: 0.75rem;
        padding: 1.5rem;
        margin-bottom: 2rem;
        border: 1px solid #B3D9FF;
      }

      .tp-natural-suggestions h4 {
        margin: 0 0 1rem 0;
        color: #0066CC;
        font-size: 1.125rem;
      }

      .tp-suggestion-item {
        background: white;
        border-radius: 0.5rem;
        padding: 1.5rem;
        margin-bottom: 1rem;
        border: 1px solid #B3D9FF;
      }

      .tp-suggestion-pattern {
        font-style: italic;
        color: #4A4A4A;
        margin-bottom: 0.75rem;
        font-size: 0.875rem;
      }

      .tp-suggestion-message {
        font-size: 1rem;
        color: #1A1A1A;
        margin-bottom: 1rem;
        font-weight: 500;
      }

      .tp-suggestion-actions {
        display: flex;
        gap: 0.5rem;
      }

      .tp-btn-accept-suggestion {
        background: #00C851;
        color: white;
        border: none;
        border-radius: 0.5rem;
        padding: 0.5rem 1rem;
        font-weight: 500;
        cursor: pointer;
      }

      .tp-btn-decline-suggestion {
        background: #FF4444;
        color: white;
        border: none;
        border-radius: 0.5rem;
        padding: 0.5rem 1rem;
        font-weight: 500;
        cursor: pointer;
      }

      .tp-active-schedules {
        background: #FAFAFA;
        border-radius: 0.75rem;
        padding: 1.5rem;
        margin-bottom: 2rem;
      }

      .tp-active-schedules h4 {
        margin: 0 0 1rem 0;
        color: #1A1A1A;
        font-size: 1.125rem;
      }

      .tp-schedule-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: white;
        border-radius: 0.5rem;
        padding: 1rem 1.5rem;
        margin-bottom: 1rem;
        border: 1px solid #E5E5E5;
        transition: all 0.2s ease;
      }

      .tp-schedule-item:hover {
        border-color: #0066CC;
        transform: translateY(-1px);
      }

      .tp-schedule-info {
        flex: 1;
      }

      .tp-schedule-name {
        font-weight: 600;
        color: #1A1A1A;
        margin-bottom: 0.25rem;
      }

      .tp-schedule-details {
        font-size: 0.875rem;
        color: #4A4A4A;
        margin-bottom: 0.25rem;
      }

      .tp-schedule-timing {
        font-size: 0.875rem;
        color: #0066CC;
        font-family: monospace;
      }

      .tp-schedule-special {
        font-size: 0.75rem;
        color: #FF6B35;
        font-weight: 500;
        margin-top: 0.25rem;
      }

      .tp-schedule-actions {
        display: flex;
        gap: 0.5rem;
      }

      .tp-btn-edit-schedule,
      .tp-btn-toggle-schedule,
      .tp-btn-delete-schedule {
        width: 32px;
        height: 32px;
        border: none;
        border-radius: 0.25rem;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .tp-btn-edit-schedule {
        background: #0066CC;
        color: white;
      }

      .tp-btn-toggle-schedule {
        background: #FFB800;
        color: white;
      }

      .tp-btn-delete-schedule {
        background: #FF4444;
        color: white;
      }

      .tp-schedule-next {
        font-size: 0.75rem;
        color: #8A8A8A;
        margin-top: 0.5rem;
        font-family: monospace;
      }

      .tp-cron-editor {
        background: #F8F9FA;
        border-radius: 0.75rem;
        padding: 2rem;
        border: 1px solid #E5E5E5;
      }

      .tp-cron-editor h4 {
        margin: 0 0 1.5rem 0;
        color: #1A1A1A;
        font-size: 1.125rem;
      }

      .tp-editor-form {
        display: grid;
        gap: 1.5rem;
      }

      .tp-form-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .tp-form-group label {
        font-weight: 500;
        color: #1A1A1A;
        font-size: 0.875rem;
      }

      .tp-form-group input,
      .tp-form-group select {
        padding: 0.75rem;
        border: 1px solid #E5E5E5;
        border-radius: 0.5rem;
        font-size: 1rem;
      }

      .tp-time-selector {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }

      .tp-condition-checkboxes {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.5rem;
      }

      .tp-condition-checkboxes label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        color: #4A4A4A;
      }

      .tp-cron-preview {
        background: white;
        border-radius: 0.5rem;
        padding: 1rem;
        border: 1px solid #E5E5E5;
      }

      .tp-cron-preview h5 {
        margin: 0 0 0.5rem 0;
        color: #1A1A1A;
        font-size: 1rem;
      }

      .tp-preview-text {
        font-family: monospace;
        color: #0066CC;
        background: #F5F5F5;
        padding: 0.75rem;
        border-radius: 0.25rem;
        font-size: 0.875rem;
      }

      .tp-editor-actions {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
      }

      .tp-btn-save-schedule {
        background: #00C851;
        color: white;
        border: none;
        border-radius: 0.5rem;
        padding: 0.75rem 1.5rem;
        font-weight: 600;
        cursor: pointer;
      }

      .tp-btn-test-schedule {
        background: #FFB800;
        color: white;
        border: none;
        border-radius: 0.5rem;
        padding: 0.75rem 1.5rem;
        font-weight: 600;
        cursor: pointer;
      }

      .tp-btn-cancel-edit {
        background: #FF4444;
        color: white;
        border: none;
        border-radius: 0.5rem;
        padding: 0.75rem 1.5rem;
        font-weight: 600;
        cursor: pointer;
      }
    `;
  }

  // Store schedule in database
  async storeSchedule(schedule) {
    await this.db.run(`
      INSERT INTO personality_schedules (
        id, name, pattern_id, slider, value, trigger_type, 
        trigger_time, revert_condition, conditions, queue_behavior, 
        created_at, active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      schedule.id,
      schedule.name,
      schedule.pattern_id,
      schedule.slider,
      schedule.value,
      schedule.trigger,
      schedule.time,
      schedule.revert,
      JSON.stringify(schedule.conditions),
      schedule.queue_behavior,
      schedule.created_at,
      schedule.active
    ]);
  }

  // Initialize database tables
  async initializeTables() {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS personality_schedules (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        pattern_id TEXT,
        slider TEXT NOT NULL,
        value INTEGER NOT NULL,
        trigger_type TEXT NOT NULL,
        trigger_time TEXT,
        revert_condition TEXT,
        conditions TEXT,
        queue_behavior TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        active BOOLEAN DEFAULT TRUE,
        last_executed DATETIME,
        next_execution DATETIME
      );

      CREATE TABLE IF NOT EXISTS schedule_executions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        schedule_id TEXT NOT NULL,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        old_value INTEGER,
        new_value INTEGER,
        success BOOLEAN DEFAULT TRUE,
        FOREIGN KEY (schedule_id) REFERENCES personality_schedules (id)
      );

      CREATE INDEX IF NOT EXISTS idx_personality_schedules_active ON personality_schedules (active, next_execution);
      CREATE INDEX IF NOT EXISTS idx_schedule_executions_schedule ON schedule_executions (schedule_id, executed_at DESC);
    `);
  }
}

module.exports = IntelligentScheduler;
