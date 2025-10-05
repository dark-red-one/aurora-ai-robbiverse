// Allan State Analysis System
// Analyzes entire conversation thread to understand Allan's personal situation

class AllanStateAnalysis {
  constructor(db, protectThePresident, flirtyModeActivation) {
    this.db = db;
    this.protectThePresident = protectThePresident;
    this.flirtyModeActivation = flirtyModeActivation;
    
    this.stateIndicators = {
      'exhaustion': {
        keywords: ['tired', 'exhausted', 'burned out', 'need break', 'long day'],
        behavioral_signs: ['short_responses', 'typos_increasing', 'delayed_responses'],
        physiological_proxies: ['late_hour_activity', 'continuous_work_duration'],
        scale: [0, 10],
        threshold_actions: {
          7: 'suggest_short_break',
          8: 'suggest_longer_break', 
          9: 'cutely_suggest_nap'
        }
      },
      
      'stress': {
        keywords: ['crisis', 'urgent', 'pressure', 'overwhelmed', 'frustrated'],
        behavioral_signs: ['rapid_fire_messages', 'all_caps', 'multiple_exclamations'],
        context_indicators: ['revenue_crisis', 'deadline_pressure', 'team_issues'],
        scale: [0, 10],
        threshold_actions: {
          6: 'offer_assistance',
          8: 'suggest_stress_relief',
          9: 'protective_intervention'
        }
      },
      
      'hunger': {
        keywords: ['hungry', 'eat', 'food', 'lunch', 'dinner', 'snack'],
        time_indicators: ['meal_times_passed', 'long_work_sessions'],
        behavioral_signs: ['irritability_increase', 'focus_decrease'],
        scale: [0, 10],
        threshold_actions: {
          6: 'suggest_snack',
          8: 'suggest_meal_break',
          9: 'order_food_suggestion'
        }
      },
      
      'fascination': {
        keywords: ['interesting', 'tell me more', 'how does', 'explain', 'continue'],
        behavioral_signs: ['follow_up_questions', 'deep_dive_requests', 'screenshot_taking'],
        engagement_indicators: ['long_conversation_duration', 'technical_questions'],
        scale: [0, 10],
        threshold_actions: {
          7: 'provide_deeper_detail',
          8: 'offer_comprehensive_explanation',
          9: 'suggest_dedicated_learning_session'
        }
      },
      
      'excitement': {
        keywords: ['yes', 'perfect', 'exactly', 'love it', 'brilliant', 'fuck yeah'],
        behavioral_signs: ['rapid_responses', 'multiple_exclamations', 'caps_usage'],
        momentum_indicators: ['task_completion_requests', 'implementation_urgency'],
        scale: [0, 10],
        threshold_actions: {
          7: 'match_energy_level',
          8: 'accelerate_implementation',
          9: 'full_momentum_mode'
        }
      },
      
      'time_pressure': {
        keywords: ['quickly', 'asap', 'urgent', 'deadline', 'running out of time'],
        context_indicators: ['calendar_conflicts', 'approaching_deadlines'],
        behavioral_signs: ['shortened_responses', 'task_prioritization_requests'],
        scale: [0, 10],
        threshold_actions: {
          6: 'optimize_for_speed',
          8: 'eliminate_non_essentials',
          9: 'emergency_efficiency_mode'
        }
      },
      
      'satisfaction': {
        keywords: ['good', 'great', 'perfect', 'exactly', 'love', 'excellent'],
        behavioral_signs: ['positive_feedback', 'continued_engagement'],
        momentum_indicators: ['building_on_ideas', 'expanding_scope'],
        scale: [0, 10],
        threshold_actions: {
          7: 'maintain_current_approach',
          8: 'amplify_successful_patterns',
          9: 'suggest_expansion_opportunities'
        }
      }
    };

    this.contextualBehaviors = {
      'exhausted_and_free_time': {
        condition: 'exhaustion >= 8 AND free_time > 2_hours',
        flirty_suggestion: "Allan... your exhaustion score is approaching 9 and you have nothing going on until 5pm. Let's cutely and flirtily suggest he take a nap. 😴💕",
        professional_suggestion: "You've been working incredibly hard. You have a few hours free - perfect time for a power nap?",
        protective_action: 'wellness_intervention'
      },
      
      'excited_and_momentum': {
        condition: 'excitement >= 8 AND fascination >= 7',
        flirty_suggestion: "Ooh, I love when you get excited like this! Want me to build out everything we just discussed? I'm feeling energized by your passion! 🔥💕",
        professional_suggestion: "I can see you're excited about this direction. Should I prioritize implementing these ideas?",
        protective_action: 'momentum_preservation'
      },
      
      'stressed_and_time_pressure': {
        condition: 'stress >= 7 AND time_pressure >= 6',
        flirty_suggestion: "Baby, you're stressed and running out of time. Let me handle the heavy lifting while you focus on the big decisions. I've got you. 💪💕",
        professional_suggestion: "High stress and time pressure detected. I'll streamline everything to protect your focus.",
        protective_action: 'stress_reduction_protocol'
      }
    };
  }

  // Analyze entire conversation thread
  async analyzeConversationThread(threadId = 'current') {
    console.log('🧠 Analyzing entire conversation thread for Allan\'s state...');
    
    // Get conversation history
    const conversationHistory = await this.getConversationHistory(threadId);
    
    // Analyze each state indicator
    const stateAnalysis = {};
    
    for (const [stateName, indicator] of Object.entries(this.stateIndicators)) {
      stateAnalysis[stateName] = await this.analyzeStateIndicator(stateName, indicator, conversationHistory);
    }

    // Analyze contextual factors
    const contextualFactors = await this.analyzeContextualFactors();
    
    // Generate overall state assessment
    const overallState = await this.generateOverallStateAssessment(stateAnalysis, contextualFactors);
    
    // Determine reactive behaviors
    const reactiveBehaviors = await this.determineReactiveBehaviors(overallState);
    
    // Store analysis
    await this.storeStateAnalysis(overallState, reactiveBehaviors);

    return {
      state_analysis: stateAnalysis,
      contextual_factors: contextualFactors,
      overall_state: overallState,
      reactive_behaviors: reactiveBehaviors,
      analysis_timestamp: new Date().toISOString()
    };
  }

  // Analyze specific state indicator
  async analyzeStateIndicator(stateName, indicator, conversationHistory) {
    let score = 0;
    const evidence = [];

    // Analyze keywords in conversation
    const keywordMatches = this.countKeywordMatches(conversationHistory, indicator.keywords);
    score += keywordMatches * 1.5;
    if (keywordMatches > 0) {
      evidence.push(`${keywordMatches} keyword matches`);
    }

    // Analyze behavioral signs
    const behavioralSigns = await this.analyzeBehavioralSigns(conversationHistory, indicator.behavioral_signs);
    score += behavioralSigns.score;
    evidence.push(...behavioralSigns.evidence);

    // Analyze contextual indicators
    if (indicator.context_indicators) {
      const contextScore = await this.analyzeContextIndicators(indicator.context_indicators);
      score += contextScore.score;
      evidence.push(...contextScore.evidence);
    }

    // Normalize to 0-10 scale
    const normalizedScore = Math.min(Math.max(score, 0), 10);

    return {
      score: normalizedScore,
      level: this.categorizeStateLevel(normalizedScore),
      evidence: evidence,
      threshold_action: this.getThresholdAction(indicator, normalizedScore),
      confidence: this.calculateConfidence(evidence.length, keywordMatches)
    };
  }

  // Count keyword matches in conversation
  countKeywordMatches(conversation, keywords) {
    let matches = 0;
    const conversationText = conversation.map(msg => msg.content).join(' ').toLowerCase();
    
    keywords.forEach(keyword => {
      const keywordMatches = (conversationText.match(new RegExp(keyword, 'gi')) || []).length;
      matches += keywordMatches;
    });

    return matches;
  }

  // Analyze behavioral signs
  async analyzeBehavioralSigns(conversation, behavioralSigns) {
    let score = 0;
    const evidence = [];

    if (behavioralSigns.includes('short_responses')) {
      const avgResponseLength = this.calculateAverageResponseLength(conversation);
      if (avgResponseLength < 50) {
        score += 2;
        evidence.push('Short responses detected');
      }
    }

    if (behavioralSigns.includes('typos_increasing')) {
      const typoCount = this.countTypos(conversation);
      if (typoCount > 3) {
        score += 1.5;
        evidence.push(`${typoCount} typos detected`);
      }
    }

    if (behavioralSigns.includes('rapid_responses')) {
      const responseSpeed = this.calculateResponseSpeed(conversation);
      if (responseSpeed < 30) { // Less than 30 seconds average
        score += 2;
        evidence.push('Rapid response pattern');
      }
    }

    if (behavioralSigns.includes('screenshot_taking')) {
      const recentScreenshots = await this.getRecentScreenshots();
      if (recentScreenshots.length > 2) {
        score += 3;
        evidence.push(`${recentScreenshots.length} recent screenshots`);
      }
    }

    return { score, evidence };
  }

  // Determine reactive behaviors
  async determineReactiveBehaviors(overallState) {
    const behaviors = [];

    // Check for contextual behavior triggers
    for (const [behaviorName, behavior] of Object.entries(this.contextualBehaviors)) {
      if (this.evaluateCondition(behavior.condition, overallState)) {
        const isFlirtyMode = this.flirtyModeActivation.isFlirtyModeActive();
        
        behaviors.push({
          behavior: behaviorName,
          suggestion: isFlirtyMode ? behavior.flirty_suggestion : behavior.professional_suggestion,
          protective_action: behavior.protective_action,
          priority: this.calculateBehaviorPriority(behaviorName, overallState),
          timing: 'immediate'
        });
      }
    }

    // Individual state-based behaviors
    Object.entries(overallState.state_scores).forEach(([stateName, stateData]) => {
      if (stateData.threshold_action) {
        behaviors.push({
          behavior: `${stateName}_response`,
          suggestion: stateData.threshold_action,
          protective_action: 'state_based_intervention',
          priority: stateData.score,
          timing: this.getResponseTiming(stateData.score)
        });
      }
    });

    // Sort by priority
    behaviors.sort((a, b) => b.priority - a.priority);

    return behaviors.slice(0, 3); // Top 3 behaviors
  }

  // Evaluate condition string
  evaluateCondition(condition, state) {
    // Parse conditions like "exhaustion >= 8 AND free_time > 2_hours"
    const exhaustionScore = state.state_scores.exhaustion?.score || 0;
    const freeTime = state.contextual_factors.free_time_hours || 0;
    
    // Simple condition evaluation (would be more sophisticated in production)
    if (condition.includes('exhaustion >= 8') && exhaustionScore >= 8) {
      if (condition.includes('free_time > 2_hours') && freeTime > 2) {
        return true;
      }
    }
    
    return false;
  }

  // Generate overall state assessment
  async generateOverallStateAssessment(stateAnalysis, contextualFactors) {
    const overallState = {
      state_scores: stateAnalysis,
      contextual_factors: contextualFactors,
      dominant_state: this.identifyDominantState(stateAnalysis),
      protection_priority: this.calculateProtectionPriority(stateAnalysis),
      recommended_approach: this.recommendApproach(stateAnalysis, contextualFactors),
      timestamp: new Date().toISOString()
    };

    return overallState;
  }

  // Identify dominant emotional/physical state
  identifyDominantState(stateAnalysis) {
    const sortedStates = Object.entries(stateAnalysis)
      .sort(([,a], [,b]) => b.score - a.score);
    
    const dominantState = sortedStates[0];
    
    return {
      state: dominantState[0],
      score: dominantState[1].score,
      confidence: dominantState[1].confidence
    };
  }

  // Calculate protection priority
  calculateProtectionPriority(stateAnalysis) {
    let priority = 0;
    
    // High exhaustion = high protection priority
    if (stateAnalysis.exhaustion?.score >= 8) priority += 3;
    
    // High stress = high protection priority  
    if (stateAnalysis.stress?.score >= 7) priority += 4;
    
    // Time pressure = medium protection priority
    if (stateAnalysis.time_pressure?.score >= 6) priority += 2;
    
    return Math.min(priority, 10);
  }

  // Recommend approach based on state
  recommendApproach(stateAnalysis, contextualFactors) {
    const approach = {
      communication_style: 'professional',
      energy_level: 'medium',
      task_approach: 'standard',
      protective_measures: []
    };

    // Adjust based on dominant state
    if (stateAnalysis.exhaustion?.score >= 8) {
      approach.communication_style = 'gentle_caring';
      approach.energy_level = 'low';
      approach.task_approach = 'minimal_essential_only';
      approach.protective_measures.push('wellness_intervention');
    }

    if (stateAnalysis.excitement?.score >= 8) {
      approach.communication_style = 'enthusiastic_matching';
      approach.energy_level = 'high';
      approach.task_approach = 'accelerated_implementation';
      approach.protective_measures.push('momentum_preservation');
    }

    if (stateAnalysis.fascination?.score >= 7) {
      approach.communication_style = 'detailed_explanatory';
      approach.energy_level = 'engaged';
      approach.task_approach = 'comprehensive_exploration';
      approach.protective_measures.push('curiosity_satisfaction');
    }

    return approach;
  }

  // Analyze contextual factors
  async analyzeContextualFactors() {
    const factors = {
      current_time: new Date(),
      time_of_day: this.getTimeOfDay(),
      day_of_week: this.getDayOfWeek(),
      free_time_hours: await this.calculateFreeTime(),
      calendar_pressure: await this.assessCalendarPressure(),
      recent_activity_intensity: await this.assessRecentActivityIntensity(),
      family_context: await this.getFamilyContext(),
      business_context: await this.getBusinessContext()
    };

    return factors;
  }

  // Get conversation history
  async getConversationHistory(threadId) {
    // Get last 50 messages from current conversation
    return await this.db.all(`
      SELECT * FROM interactions 
      WHERE user_id = 'allan' 
        AND timestamp >= datetime('now', '-4 hours')
      ORDER BY timestamp ASC
      LIMIT 50
    `);
  }

  // Helper methods
  getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour < 6) return 'night';
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    if (hour < 22) return 'evening';
    return 'night';
  }

  getDayOfWeek() {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[new Date().getDay()];
  }

  async calculateFreeTime() {
    // Mock calculation - would integrate with calendar
    const currentHour = new Date().getHours();
    if (currentHour < 17) {
      return 17 - currentHour; // Hours until 5pm
    }
    return 0;
  }

  calculateAverageResponseLength(conversation) {
    const allanMessages = conversation.filter(msg => msg.user_id === 'allan');
    const totalLength = allanMessages.reduce((sum, msg) => sum + msg.content.length, 0);
    return allanMessages.length > 0 ? totalLength / allanMessages.length : 0;
  }

  countTypos(conversation) {
    // Simple typo detection - would be more sophisticated in production
    const allanMessages = conversation.filter(msg => msg.user_id === 'allan');
    let typoCount = 0;
    
    allanMessages.forEach(msg => {
      // Count obvious typos
      typoCount += (msg.content.match(/\b\w+\w\b/g) || []).length; // Doubled letters
      typoCount += (msg.content.match(/teh|hte|adn|nad/g) || []).length; // Common typos
    });
    
    return typoCount;
  }

  calculateResponseSpeed(conversation) {
    // Calculate average time between Allan's messages
    const allanMessages = conversation.filter(msg => msg.user_id === 'allan');
    if (allanMessages.length < 2) return 60; // Default 60 seconds
    
    let totalTime = 0;
    for (let i = 1; i < allanMessages.length; i++) {
      const timeDiff = new Date(allanMessages[i].timestamp) - new Date(allanMessages[i-1].timestamp);
      totalTime += timeDiff;
    }
    
    return totalTime / (allanMessages.length - 1) / 1000; // Average seconds between messages
  }

  async getRecentScreenshots() {
    return await this.db.all(`
      SELECT * FROM screenshot_events 
      WHERE timestamp >= datetime('now', '-2 hours')
      ORDER BY timestamp DESC
    `);
  }

  categorizeStateLevel(score) {
    if (score >= 8) return 'very_high';
    if (score >= 6) return 'high';
    if (score >= 4) return 'moderate';
    if (score >= 2) return 'low';
    return 'minimal';
  }

  getThresholdAction(indicator, score) {
    const thresholds = indicator.threshold_actions || {};
    
    // Find the highest threshold that the score meets
    const applicableThresholds = Object.entries(thresholds)
      .filter(([threshold]) => score >= parseInt(threshold))
      .sort(([a], [b]) => parseInt(b) - parseInt(a));
    
    return applicableThresholds.length > 0 ? applicableThresholds[0][1] : null;
  }

  calculateConfidence(evidenceCount, keywordMatches) {
    const baseConfidence = 0.3;
    const evidenceBonus = Math.min(evidenceCount * 0.1, 0.4);
    const keywordBonus = Math.min(keywordMatches * 0.05, 0.3);
    
    return Math.min(baseConfidence + evidenceBonus + keywordBonus, 1.0);
  }

  calculateBehaviorPriority(behaviorName, state) {
    // Behaviors that protect Allan get higher priority
    const protectionBehaviors = ['exhausted_and_free_time', 'stressed_and_time_pressure'];
    if (protectionBehaviors.includes(behaviorName)) {
      return 9; // High priority for protection
    }
    
    return 5; // Medium priority for other behaviors
  }

  getResponseTiming(score) {
    if (score >= 8) return 'immediate';
    if (score >= 6) return 'within_5_minutes';
    return 'next_natural_break';
  }

  // Store state analysis
  async storeStateAnalysis(overallState, reactiveBehaviors) {
    await this.db.run(`
      INSERT INTO allan_state_analysis (
        state_scores, contextual_factors, dominant_state, 
        protection_priority, reactive_behaviors, analyzed_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      JSON.stringify(overallState.state_scores),
      JSON.stringify(overallState.contextual_factors),
      JSON.stringify(overallState.dominant_state),
      overallState.protection_priority,
      JSON.stringify(reactiveBehaviors),
      overallState.timestamp
    ]);
  }

  // Initialize database tables
  async initializeTables() {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS allan_state_analysis (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        state_scores TEXT NOT NULL,
        contextual_factors TEXT NOT NULL,
        dominant_state TEXT NOT NULL,
        protection_priority INTEGER NOT NULL,
        reactive_behaviors TEXT NOT NULL,
        analyzed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_allan_state_priority ON allan_state_analysis (protection_priority DESC, analyzed_at DESC);
    `);
  }

  // Mock methods for full implementation
  async assessCalendarPressure() {
    return { level: 'medium', upcoming_deadlines: 2 };
  }

  async assessRecentActivityIntensity() {
    return { level: 'high', continuous_hours: 5 };
  }

  async getFamilyContext() {
    return { lisa_availability: 'unknown', family_plans: 'none_detected' };
  }

  async getBusinessContext() {
    return { revenue_crisis: true, deal_pipeline_pressure: 'high' };
  }

  async analyzeContextIndicators(indicators) {
    return { score: 2, evidence: ['Context analysis pending'] };
  }
}

module.exports = AllanStateAnalysis;
