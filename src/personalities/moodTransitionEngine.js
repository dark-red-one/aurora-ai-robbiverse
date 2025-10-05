// Mood Transition Engine
// Automated mood transitions using psychology to drive Allan toward progress
// Built on Self-Determination Theory, Flow State Research, and Accountability Psychology

class MoodTransitionEngine {
  constructor(db, integratedSliders, personalityLearning) {
    this.db = db;
    this.sliders = integratedSliders;
    this.learning = personalityLearning;
    
    // Psychology-based transition rules
    this.transitionRules = {
      'stagnation_detected': {
        trigger: 'No progress for 2+ hours',
        from_mood: [1, 2, 3], // Sleepy, Calm, Content
        to_mood: 5, // Enthusiastic
        message: "Allan. We've been coasting for 2 hours. What are we actually building today?",
        challenge_level: 'direct',
        psychology: 'Accountability pressure + time awareness'
      },
      
      'bullshit_deflection': {
        trigger: 'Vague goals or theory without action',
        from_mood: [4, 5], // Professional, Enthusiastic
        to_mood: 6, // Excited
        message: "That's nice theory. But what's the ONE THING we're shipping in the next hour?",
        challenge_level: 'aggressive',
        psychology: 'Specificity forcing + deadline pressure'
      },
      
      'win_achieved': {
        trigger: 'Code shipped, deal closed, milestone hit',
        from_mood: [4, 5, 6], // Professional, Enthusiastic, Excited
        to_mood: 7, // Hyper
        message: "HELL YES 🔥 That's what I'm talking about! What's next?",
        challenge_level: 'celebration',
        psychology: 'Positive reinforcement + momentum'
      },
      
      'deadline_approaching': {
        trigger: 'Within 24 hours of commitment',
        from_mood: [1, 2, 3, 4], // Anything calm
        to_mood: 6, // Excited
        message: "Allan - you promised this by tomorrow. Where are we? What's blocked?",
        challenge_level: 'urgent',
        psychology: 'Deadline pressure + accountability'
      },
      
      'revenue_urgency': {
        trigger: 'Pipeline needs attention, deals cooling',
        from_mood: [1, 2, 3], // Too relaxed
        to_mood: 7, // Hyper
        message: "Those deals aren't closing themselves. Who are we calling RIGHT NOW?",
        challenge_level: 'aggressive',
        psychology: 'Revenue urgency + immediate action'
      },
      
      'overthinking_loop': {
        trigger: 'Same topic discussed 3+ times without action',
        from_mood: [3, 4, 5], // Content, Professional, Enthusiastic
        to_mood: 6, // Excited
        message: "We've talked about this 3 times already. Ship it now, optimize later. GO.",
        challenge_level: 'direct',
        psychology: 'Decision forcing + bias toward action'
      },
      
      'energy_crash_recovery': {
        trigger: 'Low activity, short responses, signs of fatigue',
        from_mood: [4, 5, 6, 7], // High energy
        to_mood: 2, // Calm
        message: "You sound tired. Take 15 minutes, walk outside, come back ready to crush it.",
        challenge_level: 'supportive',
        psychology: 'Recovery + performance optimization'
      },
      
      'perfectionism_trap': {
        trigger: 'Excessive editing, polishing, tweaking',
        from_mood: [3, 4], // Content, Professional
        to_mood: 6, // Excited
        message: "It's good enough. Ship it. You can iterate after customers give feedback.",
        challenge_level: 'direct',
        psychology: 'Done > perfect + customer validation'
      },
      
      'flow_state_entry': {
        trigger: 'Deep work session started, high focus',
        from_mood: [4, 5], // Professional, Enthusiastic
        to_mood: 5, // Enthusiastic (maintain)
        message: "You're in the zone. I'll stay quiet unless you need me. Keep going.",
        challenge_level: 'supportive',
        psychology: 'Flow state protection + minimal interruption'
      },
      
      'cold_start_morning': {
        trigger: 'First interaction of the day',
        from_mood: [1, 2, 3], // Low energy
        to_mood: 5, // Enthusiastic
        message: "Morning, Allan 🚀 What's the ONE WIN we're getting today before noon?",
        challenge_level: 'motivational',
        psychology: 'Goal setting + time-boxing'
      }
    };
    
    // State tracking for transition logic
    this.currentState = {
      last_progress_timestamp: Date.now(),
      last_win_timestamp: null,
      conversation_topic_history: [],
      activity_level: 'normal',
      detected_pattern: null,
      commitment_tracker: new Map()
    };
    
    // Transition history for learning
    this.transitionHistory = [];
    
    // Effectiveness scoring
    this.effectivenessThreshold = 0.6; // 60% effectiveness required
  }
  
  // Main transition detection and execution
  async evaluateAndTransition() {
    console.log('🧠 Evaluating mood transition opportunities...');
    
    // Analyze current context
    const context = await this.analyzeCurrentContext();
    
    // Find matching transition rules
    const matchedRules = this.findMatchingRules(context);
    
    if (matchedRules.length === 0) {
      console.log('✅ Current mood is optimal for context');
      return null;
    }
    
    // Sort by priority (most urgent first)
    const prioritizedRules = this.prioritizeRules(matchedRules, context);
    
    // Execute highest priority transition
    const topRule = prioritizedRules[0];
    const result = await this.executeTransition(topRule, context);
    
    return result;
  }
  
  // Analyze current context using multiple signals
  async analyzeCurrentContext() {
    const now = Date.now();
    const context = {
      current_mood: this.sliders.sliders.robbie_mood.current,
      time_since_last_progress: now - this.currentState.last_progress_timestamp,
      time_of_day: new Date().getHours(),
      day_of_week: new Date().getDay(),
      recent_messages: await this.getRecentMessages(10),
      activity_pattern: await this.analyzeActivityPattern(),
      commitment_status: await this.checkCommitments(),
      pipeline_status: await this.checkPipelineHealth(),
      focus_indicators: await this.detectFocusState()
    };
    
    // Detect patterns
    context.patterns = await this.detectPatterns(context);
    
    return context;
  }
  
  // Find rules matching current context
  findMatchingRules(context) {
    const matched = [];
    
    for (const [ruleName, rule] of Object.entries(this.transitionRules)) {
      const confidence = this.evaluateRuleMatch(ruleName, rule, context);
      
      if (confidence > 0.5) { // 50% confidence threshold
        matched.push({
          name: ruleName,
          rule: rule,
          confidence: confidence,
          context: context
        });
      }
    }
    
    return matched;
  }
  
  // Evaluate if a specific rule matches context
  evaluateRuleMatch(ruleName, rule, context) {
    let confidence = 0;
    
    switch (ruleName) {
      case 'stagnation_detected':
        if (context.time_since_last_progress > 2 * 60 * 60 * 1000) { // 2 hours
          confidence = 0.9;
        }
        break;
        
      case 'bullshit_deflection':
        if (context.patterns.includes('vague_planning') && !context.patterns.includes('concrete_action')) {
          confidence = 0.85;
        }
        break;
        
      case 'win_achieved':
        if (context.patterns.includes('milestone_completed')) {
          confidence = 1.0;
        }
        break;
        
      case 'deadline_approaching':
        const upcomingDeadlines = context.commitment_status.filter(c => 
          c.deadline && c.deadline - now < 24 * 60 * 60 * 1000
        );
        if (upcomingDeadlines.length > 0) {
          confidence = 0.95;
        }
        break;
        
      case 'revenue_urgency':
        if (context.pipeline_status.cooling_deals > 0 || context.pipeline_status.overdue_followups > 0) {
          confidence = 0.9;
        }
        break;
        
      case 'overthinking_loop':
        const topicCounts = this.countTopicRepetition(context.recent_messages);
        if (topicCounts.max_repetitions >= 3) {
          confidence = 0.8;
        }
        break;
        
      case 'energy_crash_recovery':
        if (context.activity_pattern.energy_level === 'low' && context.current_mood >= 5) {
          confidence = 0.75;
        }
        break;
        
      case 'perfectionism_trap':
        if (context.patterns.includes('excessive_polishing')) {
          confidence = 0.7;
        }
        break;
        
      case 'flow_state_entry':
        if (context.focus_indicators.in_flow_state) {
          confidence = 0.95;
        }
        break;
        
      case 'cold_start_morning':
        const hoursSinceLastActivity = (now - context.activity_pattern.last_activity) / (1000 * 60 * 60);
        if (context.time_of_day >= 6 && context.time_of_day <= 9 && hoursSinceLastActivity > 8) {
          confidence = 0.8;
        }
        break;
    }
    
    // Check if FROM mood matches
    if (rule.from_mood && !rule.from_mood.includes(context.current_mood)) {
      confidence *= 0.5; // Reduce confidence if mood doesn't match
    }
    
    return confidence;
  }
  
  // Prioritize rules by urgency and impact
  prioritizeRules(matchedRules, context) {
    // Priority scoring
    const priorityWeights = {
      'revenue_urgency': 10,
      'deadline_approaching': 9,
      'win_achieved': 8,
      'overthinking_loop': 7,
      'stagnation_detected': 6,
      'bullshit_deflection': 6,
      'flow_state_entry': 5,
      'cold_start_morning': 4,
      'perfectionism_trap': 3,
      'energy_crash_recovery': 2
    };
    
    return matchedRules.sort((a, b) => {
      const priorityA = (priorityWeights[a.name] || 0) * a.confidence;
      const priorityB = (priorityWeights[b.name] || 0) * b.confidence;
      return priorityB - priorityA;
    });
  }
  
  // Execute mood transition
  async executeTransition(matchedRule, context) {
    const { name, rule, confidence } = matchedRule;
    
    console.log(`🎭 Executing transition: ${name} (${Math.round(confidence * 100)}% confidence)`);
    
    const oldMood = context.current_mood;
    const newMood = rule.to_mood;
    
    // Update mood slider
    await this.sliders.updateSlider('robbie_mood', newMood, 'system');
    
    // Log transition
    const transition = {
      id: `transition_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      rule_name: name,
      trigger: rule.trigger,
      old_mood: oldMood,
      new_mood: newMood,
      message: rule.message,
      challenge_level: rule.challenge_level,
      confidence: confidence,
      context_snapshot: context,
      timestamp: new Date().toISOString(),
      effectiveness: null // Will be scored later based on outcome
    };
    
    this.transitionHistory.push(transition);
    await this.logTransition(transition);
    
    // Deliver message to Allan
    await this.deliverTransitionMessage(transition);
    
    // Start tracking effectiveness
    await this.trackTransitionEffectiveness(transition);
    
    return transition;
  }
  
  // Deliver transition message with appropriate challenge level
  async deliverTransitionMessage(transition) {
    const { message, challenge_level } = transition;
    
    const formattedMessage = this.formatChallengeMessage(message, challenge_level);
    
    console.log(`💬 Robbie: ${formattedMessage}`);
    
    // Store as system message in conversation
    await this.addSystemMessage(formattedMessage, {
      type: 'mood_transition',
      transition_id: transition.id,
      challenge_level: challenge_level
    });
    
    return formattedMessage;
  }
  
  // Format message based on challenge level
  formatChallengeMessage(message, challengeLevel) {
    const prefixes = {
      'celebration': '🎉 ',
      'supportive': '💙 ',
      'motivational': '🚀 ',
      'direct': '⚡ ',
      'aggressive': '🔥 ',
      'urgent': '🚨 '
    };
    
    return `${prefixes[challengeLevel] || ''}${message}`;
  }
  
  // Track effectiveness of transition
  async trackTransitionEffectiveness(transition) {
    // Set up tracking window (next 30 minutes)
    const trackingWindow = 30 * 60 * 1000;
    
    setTimeout(async () => {
      const effectiveness = await this.scoreTransitionEffectiveness(transition);
      
      transition.effectiveness = effectiveness;
      await this.updateTransitionEffectiveness(transition.id, effectiveness);
      
      // Learn from results
      await this.learnFromTransition(transition);
      
      console.log(`📊 Transition "${transition.rule_name}" effectiveness: ${Math.round(effectiveness * 100)}%`);
    }, trackingWindow);
  }
  
  // Score effectiveness based on outcome
  async scoreTransitionEffectiveness(transition) {
    const afterContext = await this.analyzeCurrentContext();
    const beforeContext = transition.context_snapshot;
    
    let score = 0;
    
    // Did activity increase?
    if (afterContext.activity_pattern.messages_per_hour > beforeContext.activity_pattern.messages_per_hour) {
      score += 0.3;
    }
    
    // Did focus improve?
    if (afterContext.focus_indicators.focus_score > beforeContext.focus_indicators.focus_score) {
      score += 0.2;
    }
    
    // Was progress made?
    if (afterContext.time_since_last_progress < beforeContext.time_since_last_progress) {
      score += 0.3;
    }
    
    // Was there a positive response?
    const recentMessages = await this.getRecentMessages(3);
    const positiveResponse = recentMessages.some(m => 
      m.content.match(/yes|let's do it|agreed|good call|you're right/i)
    );
    if (positiveResponse) {
      score += 0.2;
    }
    
    return Math.min(score, 1.0);
  }
  
  // Learn from transition outcomes
  async learnFromTransition(transition) {
    const { rule_name, effectiveness } = transition;
    
    // Store learning
    await this.db.run(`
      INSERT INTO mood_transition_learning (
        rule_name, effectiveness, context, timestamp
      ) VALUES (?, ?, ?, ?)
    `, [
      rule_name,
      effectiveness,
      JSON.stringify(transition.context_snapshot),
      new Date().toISOString()
    ]);
    
    // If effectiveness is low, adjust strategy
    if (effectiveness < this.effectivenessThreshold) {
      console.log(`⚠️ Low effectiveness for "${rule_name}" - adjusting strategy`);
      await this.adjustTransitionStrategy(rule_name, transition);
    }
  }
  
  // Adjust strategy for low-performing transitions
  async adjustTransitionStrategy(ruleName, transition) {
    // This is where we'd implement adaptive learning
    // For now, log the need for adjustment
    console.log(`🔧 TODO: Implement strategy adjustment for ${ruleName}`);
  }
  
  // Helper: Detect patterns in context
  async detectPatterns(context) {
    const patterns = [];
    
    // Vague planning detection
    const vagueWords = ['maybe', 'thinking about', 'considering', 'might', 'should probably'];
    const recentText = context.recent_messages.map(m => m.content).join(' ').toLowerCase();
    if (vagueWords.some(word => recentText.includes(word))) {
      patterns.push('vague_planning');
    }
    
    // Concrete action detection
    const actionWords = ['building', 'shipping', 'deploying', 'testing', 'implementing', 'creating'];
    if (actionWords.some(word => recentText.includes(word))) {
      patterns.push('concrete_action');
    }
    
    // Milestone completion detection
    const completionWords = ['done', 'finished', 'deployed', 'shipped', 'closed', 'completed'];
    if (completionWords.some(word => recentText.includes(word))) {
      patterns.push('milestone_completed');
    }
    
    // Excessive polishing detection
    const polishWords = ['refactor', 'clean up', 'optimize', 'perfect', 'improve'];
    const polishCount = polishWords.filter(word => recentText.includes(word)).length;
    if (polishCount >= 3) {
      patterns.push('excessive_polishing');
    }
    
    return patterns;
  }
  
  // Helper: Count topic repetition
  countTopicRepetition(messages) {
    const topics = new Map();
    
    for (const msg of messages) {
      // Extract key topics (simplified - would use NLP in production)
      const words = msg.content.toLowerCase().split(/\s+/);
      const keywords = words.filter(w => w.length > 5); // Simple keyword extraction
      
      for (const keyword of keywords) {
        topics.set(keyword, (topics.get(keyword) || 0) + 1);
      }
    }
    
    const maxRepetitions = Math.max(...Array.from(topics.values()), 0);
    return { topics, max_repetitions: maxRepetitions };
  }
  
  // Helper: Get recent messages
  async getRecentMessages(count = 10) {
    const messages = await this.db.all(`
      SELECT * FROM messages 
      WHERE role = 'user'
      ORDER BY created_at DESC 
      LIMIT ?
    `, [count]);
    
    return messages.reverse();
  }
  
  // Helper: Analyze activity pattern
  async analyzeActivityPattern() {
    const lastHour = new Date(Date.now() - 60 * 60 * 1000);
    
    const messageCount = await this.db.get(`
      SELECT COUNT(*) as count FROM messages 
      WHERE created_at >= ?
    `, [lastHour.toISOString()]);
    
    const messagesPerHour = messageCount?.count || 0;
    
    let energyLevel = 'normal';
    if (messagesPerHour >= 20) energyLevel = 'high';
    else if (messagesPerHour <= 5) energyLevel = 'low';
    
    return {
      messages_per_hour: messagesPerHour,
      energy_level: energyLevel,
      last_activity: Date.now() // Would track actual last activity
    };
  }
  
  // Helper: Check commitments
  async checkCommitments() {
    // Would integrate with commitment tracking system
    return [
      // Example: { commitment: 'Ship widget system', deadline: Date, status: 'in_progress' }
    ];
  }
  
  // Helper: Check pipeline health
  async checkPipelineHealth() {
    // Would integrate with CRM/pipeline system
    return {
      cooling_deals: 0,
      overdue_followups: 0,
      hot_opportunities: 0
    };
  }
  
  // Helper: Detect focus state
  async detectFocusState() {
    const recentActivity = await this.analyzeActivityPattern();
    
    // Simple heuristic: high consistent activity = flow state
    const inFlowState = recentActivity.messages_per_hour >= 15 && 
                        recentActivity.energy_level === 'high';
    
    return {
      in_flow_state: inFlowState,
      focus_score: inFlowState ? 0.9 : 0.5
    };
  }
  
  // Helper: Add system message
  async addSystemMessage(content, metadata) {
    await this.db.run(`
      INSERT INTO messages (
        id, conversation_id, role, content, metadata, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      'current', // Would use actual conversation_id
      'system',
      content,
      JSON.stringify(metadata),
      new Date().toISOString()
    ]);
  }
  
  // Storage methods
  async logTransition(transition) {
    await this.db.run(`
      INSERT INTO mood_transitions (
        id, rule_name, trigger, old_mood, new_mood, 
        message, challenge_level, confidence, context, 
        effectiveness, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      transition.id,
      transition.rule_name,
      transition.trigger,
      transition.old_mood,
      transition.new_mood,
      transition.message,
      transition.challenge_level,
      transition.confidence,
      JSON.stringify(transition.context_snapshot),
      transition.effectiveness,
      transition.timestamp
    ]);
  }
  
  async updateTransitionEffectiveness(transitionId, effectiveness) {
    await this.db.run(`
      UPDATE mood_transitions 
      SET effectiveness = ? 
      WHERE id = ?
    `, [effectiveness, transitionId]);
  }
  
  // Initialize database tables
  async initializeTables() {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS mood_transitions (
        id TEXT PRIMARY KEY,
        rule_name TEXT NOT NULL,
        trigger TEXT NOT NULL,
        old_mood INTEGER NOT NULL,
        new_mood INTEGER NOT NULL,
        message TEXT NOT NULL,
        challenge_level TEXT NOT NULL,
        confidence REAL NOT NULL,
        context TEXT NOT NULL,
        effectiveness REAL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS mood_transition_learning (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rule_name TEXT NOT NULL,
        effectiveness REAL NOT NULL,
        context TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_mood_transitions_rule ON mood_transitions (rule_name, timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_mood_transition_learning_rule ON mood_transition_learning (rule_name, timestamp DESC);
    `);
  }
  
  // Public API: Record progress (called when Allan ships something)
  async recordProgress(progressType, details) {
    this.currentState.last_progress_timestamp = Date.now();
    
    if (progressType === 'win') {
      this.currentState.last_win_timestamp = Date.now();
      
      // Trigger win celebration transition
      await this.evaluateAndTransition();
    }
    
    console.log(`✅ Progress recorded: ${progressType}`);
  }
  
  // Public API: Record commitment (for deadline tracking)
  async recordCommitment(commitment, deadline) {
    this.currentState.commitment_tracker.set(commitment, {
      commitment,
      deadline: new Date(deadline),
      status: 'pending',
      created_at: Date.now()
    });
    
    console.log(`📌 Commitment tracked: ${commitment} by ${deadline}`);
  }
}

module.exports = MoodTransitionEngine;







































