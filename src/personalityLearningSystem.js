// Personality Learning System
// Tracks Allan's personality preferences and offers intelligent scheduling

class PersonalityLearningSystem {
  constructor(db, personalityTab, integratedSliders) {
    this.db = db;
    this.personalityTab = personalityTab;
    this.integratedSliders = integratedSliders;
    
    this.learningPatterns = new Map();
    this.scheduleSuggestions = [];
    this.confidenceThreshold = 0.75; // 75% confidence before suggesting
    
    this.timePatterns = {
      'morning': { start: 6, end: 12 },
      'afternoon': { start: 12, end: 17 },
      'evening': { start: 17, end: 23 },
      'night': { start: 23, end: 6 }
    };
    
    this.dayPatterns = {
      'weekday': [1, 2, 3, 4, 5], // Monday-Friday
      'weekend': [0, 6], // Sunday, Saturday
      'monday': [1],
      'friday': [5]
    };
  }

  // Analyze personality change patterns
  async analyzePersonalityPatterns() {
    console.log('🧠 Analyzing Allan\'s personality patterns...');
    
    // Get recent personality changes
    const recentChanges = await this.db.all(`
      SELECT 
        pc.*,
        strftime('%H', pc.changed_at) as hour,
        strftime('%w', pc.changed_at) as day_of_week,
        strftime('%Y-%m-%d', pc.changed_at) as date
      FROM personality_changes pc
      WHERE pc.changed_at >= datetime('now', '-30 days')
      ORDER BY pc.changed_at DESC
    `);

    // Analyze patterns by slider
    const sliderPatterns = {};
    
    for (const change of recentChanges) {
      if (!sliderPatterns[change.slider_id]) {
        sliderPatterns[change.slider_id] = {
          changes: [],
          time_patterns: {},
          day_patterns: {},
          value_preferences: {}
        };
      }
      
      const pattern = sliderPatterns[change.slider_id];
      pattern.changes.push(change);
      
      // Analyze time patterns
      const hour = parseInt(change.hour);
      const timeOfDay = this.getTimeOfDay(hour);
      pattern.time_patterns[timeOfDay] = (pattern.time_patterns[timeOfDay] || 0) + 1;
      
      // Analyze day patterns
      const dayOfWeek = parseInt(change.day_of_week);
      const dayType = this.getDayType(dayOfWeek);
      pattern.day_patterns[dayType] = (pattern.day_patterns[dayType] || 0) + 1;
      
      // Analyze value preferences
      pattern.value_preferences[change.new_value] = (pattern.value_preferences[change.new_value] || 0) + 1;
    }

    // Generate insights and suggestions
    const insights = await this.generateInsights(sliderPatterns);
    
    // Store insights
    await this.storeInsights(insights);
    
    return insights;
  }

  // Generate insights from patterns
  async generateInsights(sliderPatterns) {
    const insights = [];

    for (const [sliderId, pattern] of Object.entries(sliderPatterns)) {
      const sliderInsights = await this.analyzeSliderPattern(sliderId, pattern);
      insights.push(...sliderInsights);
    }

    return insights;
  }

  // Analyze individual slider pattern
  async analyzeSliderPattern(sliderId, pattern) {
    const insights = [];
    const totalChanges = pattern.changes.length;
    
    if (totalChanges < 3) return insights; // Need at least 3 data points

    // Analyze time preferences
    const timePreferences = this.analyzeTimePreferences(pattern.time_patterns, totalChanges);
    if (timePreferences.confidence >= this.confidenceThreshold) {
      insights.push({
        type: 'time_preference',
        slider: sliderId,
        pattern: timePreferences.pattern,
        confidence: timePreferences.confidence,
        suggestion: timePreferences.suggestion,
        data: timePreferences
      });
    }

    // Analyze day preferences
    const dayPreferences = this.analyzeDayPreferences(pattern.day_patterns, totalChanges);
    if (dayPreferences.confidence >= this.confidenceThreshold) {
      insights.push({
        type: 'day_preference',
        slider: sliderId,
        pattern: dayPreferences.pattern,
        confidence: dayPreferences.confidence,
        suggestion: dayPreferences.suggestion,
        data: dayPreferences
      });
    }

    // Analyze value preferences
    const valuePreferences = this.analyzeValuePreferences(pattern.value_preferences, totalChanges);
    if (valuePreferences.confidence >= this.confidenceThreshold) {
      insights.push({
        type: 'value_preference',
        slider: sliderId,
        pattern: valuePreferences.pattern,
        confidence: valuePreferences.confidence,
        suggestion: valuePreferences.suggestion,
        data: valuePreferences
      });
    }

    return insights;
  }

  // Analyze time preferences
  analyzeTimePreferences(timePatterns, totalChanges) {
    const dominantTime = Object.entries(timePatterns)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (!dominantTime) return { confidence: 0 };

    const [timeOfDay, count] = dominantTime;
    const confidence = count / totalChanges;
    
    let suggestion = '';
    if (timeOfDay === 'evening' && confidence > 0.6) {
      suggestion = `Allan likes ${this.getSliderDisplayName()} mode in the evenings. I'm going to offer him to set this as a schedule.`;
    } else if (timeOfDay === 'morning' && confidence > 0.6) {
      suggestion = `Allan prefers ${this.getSliderDisplayName()} adjustments in the morning. Should I suggest a morning routine?`;
    }

    return {
      pattern: `${Math.round(confidence * 100)}% of changes happen in ${timeOfDay}`,
      confidence: confidence,
      suggestion: suggestion,
      dominant_time: timeOfDay,
      count: count,
      total: totalChanges
    };
  }

  // Analyze day preferences
  analyzeDayPreferences(dayPatterns, totalChanges) {
    const dominantDay = Object.entries(dayPatterns)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (!dominantDay) return { confidence: 0 };

    const [dayType, count] = dominantDay;
    const confidence = count / totalChanges;
    
    let suggestion = '';
    if (dayType === 'weekend' && confidence > 0.6) {
      suggestion = `Allan likes flirty mode on weekends. I'm going to offer him to set this as a schedule.`;
    } else if (dayType === 'weekday' && confidence > 0.7) {
      suggestion = `Allan adjusts personality settings during weekdays. Should I suggest weekday automation?`;
    }

    return {
      pattern: `${Math.round(confidence * 100)}% of changes happen on ${dayType}s`,
      confidence: confidence,
      suggestion: suggestion,
      dominant_day: dayType,
      count: count,
      total: totalChanges
    };
  }

  // Analyze value preferences
  analyzeValuePreferences(valuePatterns, totalChanges) {
    const dominantValue = Object.entries(valuePatterns)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (!dominantValue) return { confidence: 0 };

    const [value, count] = dominantValue;
    const confidence = count / totalChanges;
    
    const suggestion = `Allan frequently sets this to level ${value}. Should I suggest this as a default?`;

    return {
      pattern: `${Math.round(confidence * 100)}% preference for level ${value}`,
      confidence: confidence,
      suggestion: suggestion,
      preferred_value: parseInt(value),
      count: count,
      total: totalChanges
    };
  }

  // Generate schedule suggestion
  async generateScheduleSuggestion(insight) {
    const suggestion = {
      id: `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      type: 'personality_schedule',
      slider: insight.slider,
      pattern: insight.pattern,
      confidence: insight.confidence,
      timestamp: new Date().toISOString()
    };

    // Generate specific suggestion based on insight type
    if (insight.type === 'time_preference' && insight.data.dominant_time === 'evening') {
      if (insight.slider === 'flirty_level') {
        suggestion.message = "Allan likes flirty mode evenings after 7 and on weekends. I'm going to offer him to set this as a schedule.";
        suggestion.schedule = {
          flirty_level: this.getPreferredValue(insight.slider),
          time_trigger: 'after_7pm',
          day_trigger: 'weekends',
          auto_activate: true
        };
      }
    }

    if (insight.type === 'day_preference' && insight.data.dominant_day === 'weekend') {
      suggestion.message = `Allan prefers ${insight.slider} adjustments on weekends. Should I automate this?`;
      suggestion.schedule = {
        slider: insight.slider,
        value: this.getPreferredValue(insight.slider),
        day_trigger: 'weekends',
        auto_activate: true
      };
    }

    return suggestion;
  }

  // Present schedule suggestion to Allan
  async presentScheduleSuggestion(suggestion) {
    console.log(`📅 Presenting schedule suggestion: ${suggestion.message}`);

    const suggestionUI = this.generateScheduleSuggestionUI(suggestion);
    
    // Store suggestion
    await this.storeSuggestion(suggestion);
    
    // Show in UI
    await this.showScheduleSuggestion(suggestionUI);

    return suggestion;
  }

  // Generate schedule suggestion UI
  generateScheduleSuggestionUI(suggestion) {
    return `
      <div class="tp-schedule-suggestion" data-suggestion="${suggestion.id}">
        <div class="tp-suggestion-header">
          <span class="tp-suggestion-icon">📅</span>
          <span class="tp-suggestion-title">Schedule Suggestion</span>
          <span class="tp-suggestion-confidence">${Math.round(suggestion.confidence * 100)}% confident</span>
        </div>

        <div class="tp-suggestion-message">
          ${suggestion.message}
        </div>

        <div class="tp-suggestion-schedule">
          <h4>Proposed Schedule:</h4>
          <div class="tp-schedule-details">
            ${this.formatScheduleDetails(suggestion.schedule)}
          </div>
        </div>

        <div class="tp-suggestion-actions">
          <button onclick="acceptSchedule('${suggestion.id}')" class="tp-btn-accept-schedule">
            ✅ Set Schedule
          </button>
          <button onclick="modifySchedule('${suggestion.id}')" class="tp-btn-modify-schedule">
            ✏️ Modify
          </button>
          <button onclick="cancelSchedule('${suggestion.id}')" class="tp-btn-cancel-schedule">
            ❌ No Thanks
          </button>
        </div>
      </div>
    `;
  }

  // Format schedule details
  formatScheduleDetails(schedule) {
    let details = '';
    
    if (schedule.time_trigger) {
      details += `<div class="tp-schedule-item">⏰ Time: ${schedule.time_trigger}</div>`;
    }
    
    if (schedule.day_trigger) {
      details += `<div class="tp-schedule-item">📅 Days: ${schedule.day_trigger}</div>`;
    }
    
    if (schedule.flirty_level) {
      details += `<div class="tp-schedule-item">💕 Flirty Level: ${schedule.flirty_level}</div>`;
    }
    
    if (schedule.auto_activate) {
      details += `<div class="tp-schedule-item">🤖 Auto-activate: Yes</div>`;
    }
    
    return details;
  }

  // Helper methods
  getTimeOfDay(hour) {
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 23) return 'evening';
    return 'night';
  }

  getDayType(dayOfWeek) {
    if ([0, 6].includes(dayOfWeek)) return 'weekend';
    return 'weekday';
  }

  getSliderDisplayName(sliderId) {
    const displayNames = {
      'flirty_level': 'flirty',
      'gandhi_genghis': 'aggressive communication',
      'turbo_level': 'turbo',
      'character_filter': 'character filter'
    };
    return displayNames[sliderId] || sliderId;
  }

  getPreferredValue(sliderId) {
    // This would be calculated from the value preferences analysis
    // For now, return reasonable defaults
    const defaults = {
      'flirty_level': 5,
      'gandhi_genghis': 4,
      'turbo_level': 6,
      'character_filter': 85
    };
    return defaults[sliderId] || 3;
  }

  // Storage methods
  async storeInsights(insights) {
    for (const insight of insights) {
      await this.db.run(`
        INSERT INTO personality_insights (
          type, slider, pattern, confidence, suggestion, data, generated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        insight.type,
        insight.slider,
        insight.pattern,
        insight.confidence,
        insight.suggestion,
        JSON.stringify(insight.data),
        new Date().toISOString()
      ]);
    }
  }

  async storeSuggestion(suggestion) {
    await this.db.run(`
      INSERT INTO schedule_suggestions (
        id, type, slider, pattern, confidence, message, schedule, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      suggestion.id,
      suggestion.type,
      suggestion.slider,
      suggestion.pattern,
      suggestion.confidence,
      suggestion.message,
      JSON.stringify(suggestion.schedule),
      suggestion.timestamp
    ]);
  }

  async showScheduleSuggestion(suggestionUI) {
    // This would integrate with your UI system
    console.log('📅 Showing schedule suggestion to Allan');
  }

  // Initialize database tables
  async initializeTables() {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS personality_insights (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        slider TEXT NOT NULL,
        pattern TEXT NOT NULL,
        confidence REAL NOT NULL,
        suggestion TEXT NOT NULL,
        data TEXT NOT NULL,
        generated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS schedule_suggestions (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        slider TEXT NOT NULL,
        pattern TEXT NOT NULL,
        confidence REAL NOT NULL,
        message TEXT NOT NULL,
        schedule TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        resolved_at DATETIME
      );

      CREATE TABLE IF NOT EXISTS personality_schedules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slider TEXT NOT NULL,
        value INTEGER NOT NULL,
        time_trigger TEXT,
        day_trigger TEXT,
        auto_activate BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        active BOOLEAN DEFAULT TRUE
      );

      CREATE INDEX IF NOT EXISTS idx_personality_insights_slider ON personality_insights (slider, generated_at DESC);
      CREATE INDEX IF NOT EXISTS idx_schedule_suggestions_status ON schedule_suggestions (status, timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_personality_schedules_active ON personality_schedules (active, slider);
    `);
  }
}

module.exports = PersonalityLearningSystem;
