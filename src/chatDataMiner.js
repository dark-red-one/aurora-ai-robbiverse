// Comprehensive Chat Data Mining System
// Captures and analyzes ALL chat data for continuous learning and improvement

class ChatDataMiner {
  constructor(db) {
    this.db = db;
    this.miningInterval = 5 * 60 * 1000; // Mine every 5 minutes
    this.isRunning = false;
  }

  // Start continuous data mining
  startMining() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('🔍 Starting chat data mining...');
    
    // Initial mining
    this.mineAllChatData();
    
    // Set up interval
    this.miningIntervalId = setInterval(() => {
      this.mineAllChatData();
    }, this.miningInterval);
  }

  // Stop data mining
  stopMining() {
    if (this.miningIntervalId) {
      clearInterval(this.miningIntervalId);
      this.miningIntervalId = null;
    }
    this.isRunning = false;
    console.log('⏹️ Chat data mining stopped');
  }

  // Mine all chat data from various sources
  async mineAllChatData() {
    try {
      console.log('⛏️ Mining chat data...');
      
      // Mine from different sources
      await Promise.all([
        this.mineLocationFeedback(),
        this.mineHuddleRoomChats(),
        this.mineFollowUpConversations(),
        this.mineGeneralInteractions(),
        this.mineNarrativeResponses()
      ]);

      // Analyze patterns
      await this.analyzePatterns();
      
      console.log('✅ Chat data mining completed');
    } catch (error) {
      console.error('❌ Error in chat data mining:', error);
    }
  }

  // Mine location feedback data
  async mineLocationFeedback() {
    const feedback = await this.db.all(`
      SELECT 
        lf.*,
        lu.location,
        lu.activity,
        lu.availability,
        lu.context,
        lu.priority,
        lu.timestamp as update_timestamp
      FROM location_feedback lf
      JOIN location_updates lu ON lf.update_id = lu.id
      WHERE lf.timestamp > datetime('now', '-24 hours')
      ORDER BY lf.timestamp DESC
    `);

    for (const item of feedback) {
      await this.analyzeFeedbackPattern(item);
    }
  }

  // Analyze individual feedback patterns
  async analyzeFeedbackPattern(feedback) {
    const analysis = {
      team_member_id: feedback.team_member_id,
      feedback_type: feedback.feedback,
      location_context: feedback.location,
      activity_context: feedback.activity,
      narrative_shown: JSON.parse(feedback.narrative_shown || '{}'),
      timestamp: feedback.timestamp,
      patterns: {}
    };

    // Analyze narrative effectiveness
    if (feedback.feedback === 'thumbs_down') {
      analysis.patterns.negative_feedback = {
        location: feedback.location,
        activity: feedback.activity,
        narrative_issues: this.identifyNarrativeIssues(feedback.narrative_shown),
        improvement_suggestions: this.generateImprovementSuggestions(feedback)
      };
    } else {
      analysis.patterns.positive_feedback = {
        location: feedback.location,
        activity: feedback.activity,
        narrative_strengths: this.identifyNarrativeStrengths(feedback.narrative_shown)
      };
    }

    // Store analysis
    await this.db.run(`
      INSERT INTO chat_mining_analysis (
        source_type, source_id, analysis_data, timestamp
      ) VALUES (?, ?, ?, ?)
    `, [
      'location_feedback',
      feedback.id,
      JSON.stringify(analysis),
      new Date().toISOString()
    ]);
  }

  // Mine huddle room chats
  async mineHuddleRoomChats() {
    const chats = await this.db.all(`
      SELECT * FROM huddle_messages 
      WHERE timestamp > datetime('now', '-24 hours')
      ORDER BY timestamp DESC
    `);

    for (const chat of chats) {
      await this.analyzeHuddleChat(chat);
    }
  }

  // Analyze huddle room chat patterns
  async analyzeHuddleChat(chat) {
    const analysis = {
      user_id: chat.user_id,
      message_type: chat.message_type,
      content: chat.content,
      timestamp: chat.timestamp,
      patterns: {
        sentiment: this.analyzeSentiment(chat.content),
        topics: this.extractTopics(chat.content),
        engagement_level: this.assessEngagement(chat.content),
        robbie_response_quality: chat.message_type === 'robbie' ? this.assessResponseQuality(chat.content) : null
      }
    };

    // Store analysis
    await this.db.run(`
      INSERT INTO chat_mining_analysis (
        source_type, source_id, analysis_data, timestamp
      ) VALUES (?, ?, ?, ?)
    `, [
      'huddle_chat',
      chat.id,
      JSON.stringify(analysis),
      new Date().toISOString()
    ]);
  }

  // Mine follow-up conversations
  async mineFollowUpConversations() {
    const followUps = await this.db.all(`
      SELECT 
        fut.*,
        lf.feedback,
        lf.narrative_shown
      FROM follow_up_tasks fut
      LEFT JOIN location_feedback lf ON fut.update_id = lf.update_id
      WHERE fut.status = 'completed' 
        AND fut.completed_at > datetime('now', '-24 hours')
    `);

    for (const followUp of followUps) {
      await this.analyzeFollowUpConversation(followUp);
    }
  }

  // Analyze follow-up conversation effectiveness
  async analyzeFollowUpConversation(followUp) {
    const analysis = {
      team_member_id: followUp.team_member_id,
      original_feedback: followUp.feedback,
      follow_up_type: followUp.follow_up_type,
      response_time: this.calculateResponseTime(followUp.created_at, followUp.completed_at),
      patterns: {
        follow_up_effectiveness: this.assessFollowUpEffectiveness(followUp),
        conversation_flow: this.analyzeConversationFlow(followUp),
        resolution_quality: this.assessResolutionQuality(followUp)
      }
    };

    // Store analysis
    await this.db.run(`
      INSERT INTO chat_mining_analysis (
        source_type, source_id, analysis_data, timestamp
      ) VALUES (?, ?, ?, ?)
    `, [
      'follow_up_conversation',
      followUp.id,
      JSON.stringify(analysis),
      new Date().toISOString()
    ]);
  }

  // Mine general interactions
  async mineGeneralInteractions() {
    const interactions = await this.db.all(`
      SELECT * FROM interactions 
      WHERE timestamp > datetime('now', '-24 hours')
      ORDER BY timestamp DESC
    `);

    for (const interaction of interactions) {
      await this.analyzeGeneralInteraction(interaction);
    }
  }

  // Analyze general interaction patterns
  async analyzeGeneralInteraction(interaction) {
    const analysis = {
      user_id: interaction.user_id,
      channel: interaction.channel,
      type: interaction.type,
      content: interaction.content,
      timestamp: interaction.timestamp,
      patterns: {
        communication_style: this.analyzeCommunicationStyle(interaction.content),
        topic_clusters: this.clusterTopics(interaction.content),
        user_preferences: this.extractUserPreferences(interaction),
        robbie_effectiveness: interaction.type === 'robbie_response' ? this.assessRobbieEffectiveness(interaction) : null
      }
    };

    // Store analysis
    await this.db.run(`
      INSERT INTO chat_mining_analysis (
        source_type, source_id, analysis_data, timestamp
      ) VALUES (?, ?, ?, ?)
    `, [
      'general_interaction',
      interaction.id,
      JSON.stringify(analysis),
      new Date().toISOString()
    ]);
  }

  // Mine narrative responses
  async mineNarrativeResponses() {
    const narratives = await this.db.all(`
      SELECT 
        lu.*,
        COUNT(lf.id) as feedback_count,
        AVG(CASE WHEN lf.feedback = 'thumbs_up' THEN 1 ELSE 0 END) as approval_rate
      FROM location_updates lu
      LEFT JOIN location_feedback lf ON lu.id = lf.update_id
      WHERE lu.timestamp > datetime('now', '-24 hours')
      GROUP BY lu.id
    `);

    for (const narrative of narratives) {
      await this.analyzeNarrativeEffectiveness(narrative);
    }
  }

  // Analyze narrative effectiveness
  async analyzeNarrativeEffectiveness(narrative) {
    const analysis = {
      location: narrative.location,
      activity: narrative.activity,
      availability: narrative.availability,
      context: narrative.context,
      priority: narrative.priority,
      feedback_count: narrative.feedback_count,
      approval_rate: narrative.approval_rate,
      patterns: {
        narrative_performance: this.assessNarrativePerformance(narrative),
        context_effectiveness: this.assessContextEffectiveness(narrative),
        improvement_opportunities: this.identifyImprovementOpportunities(narrative)
      }
    };

    // Store analysis
    await this.db.run(`
      INSERT INTO chat_mining_analysis (
        source_type, source_id, analysis_data, timestamp
      ) VALUES (?, ?, ?, ?)
    `, [
      'narrative_effectiveness',
      narrative.id,
      JSON.stringify(analysis),
      new Date().toISOString()
    ]);
  }

  // Analyze overall patterns
  async analyzePatterns() {
    // Get recent analysis data
    const recentAnalysis = await this.db.all(`
      SELECT * FROM chat_mining_analysis 
      WHERE timestamp > datetime('now', '-24 hours')
      ORDER BY timestamp DESC
    `);

    // Identify patterns
    const patterns = {
      feedback_trends: await this.analyzeFeedbackTrends(recentAnalysis),
      communication_preferences: await this.analyzeCommunicationPreferences(recentAnalysis),
      narrative_optimization: await this.analyzeNarrativeOptimization(recentAnalysis),
      user_engagement: await this.analyzeUserEngagement(recentAnalysis),
      robbie_performance: await this.analyzeRobbiePerformance(recentAnalysis)
    };

    // Store pattern analysis
    await this.db.run(`
      INSERT INTO pattern_analysis (
        analysis_type, pattern_data, timestamp, confidence_score
      ) VALUES (?, ?, ?, ?)
    `, [
      'comprehensive_patterns',
      JSON.stringify(patterns),
      new Date().toISOString(),
      this.calculateConfidenceScore(patterns)
    ]);

    // Generate insights
    await this.generateInsights(patterns);
  }

  // Generate actionable insights
  async generateInsights(patterns) {
    const insights = [];

    // Feedback insights
    if (patterns.feedback_trends.negative_feedback_rate > 0.3) {
      insights.push({
        type: 'narrative_improvement',
        priority: 'high',
        message: 'High negative feedback rate detected. Consider revising narrative templates.',
        action: 'Review and update narrative generation logic',
        confidence: 0.8
      });
    }

    // Communication preference insights
    if (patterns.communication_preferences.preferred_style) {
      insights.push({
        type: 'communication_optimization',
        priority: 'medium',
        message: `Users prefer ${patterns.communication_preferences.preferred_style} communication style`,
        action: 'Adjust communication templates accordingly',
        confidence: 0.7
      });
    }

    // Engagement insights
    if (patterns.user_engagement.engagement_score < 0.5) {
      insights.push({
        type: 'engagement_improvement',
        priority: 'high',
        message: 'Low user engagement detected. Consider more interactive responses.',
        action: 'Implement more engaging conversation patterns',
        confidence: 0.9
      });
    }

    // Store insights
    for (const insight of insights) {
      await this.db.run(`
        INSERT INTO actionable_insights (
          insight_type, priority, message, action, confidence, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [
        insight.type,
        insight.priority,
        insight.message,
        insight.action,
        insight.confidence,
        new Date().toISOString()
      ]);
    }
  }

  // Helper methods for analysis
  identifyNarrativeIssues(narrativeShown) {
    const narrative = JSON.parse(narrativeShown || '{}');
    const issues = [];

    if (narrative.narrative && narrative.narrative.length < 50) {
      issues.push('narrative_too_short');
    }
    if (narrative.context && narrative.context.length === 0) {
      issues.push('missing_context');
    }
    if (narrative.priority === 'high' && !narrative.narrative.includes('urgent')) {
      issues.push('priority_mismatch');
    }

    return issues;
  }

  generateImprovementSuggestions(feedback) {
    const suggestions = [];
    
    if (feedback.activity === 'in_meeting') {
      suggestions.push('Include more specific meeting context');
      suggestions.push('Add estimated duration if available');
    }
    
    if (feedback.location === 'traveling') {
      suggestions.push('Include destination and return time');
      suggestions.push('Add travel status updates');
    }

    return suggestions;
  }

  identifyNarrativeStrengths(narrativeShown) {
    const narrative = JSON.parse(narrativeShown || '{}');
    const strengths = [];

    if (narrative.narrative && narrative.narrative.length > 100) {
      strengths.push('detailed_narrative');
    }
    if (narrative.context && narrative.context.length > 0) {
      strengths.push('good_context');
    }
    if (narrative.emoji) {
      strengths.push('visual_appeal');
    }

    return strengths;
  }

  analyzeSentiment(content) {
    // Simple sentiment analysis
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'disappointing'];
    
    const positiveCount = positiveWords.filter(word => 
      content.toLowerCase().includes(word)
    ).length;
    const negativeCount = negativeWords.filter(word => 
      content.toLowerCase().includes(word)
    ).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  extractTopics(content) {
    const topics = [];
    const topicKeywords = {
      'work': ['meeting', 'project', 'client', 'business', 'sales'],
      'family': ['family', 'home', 'dinner', 'weekend', 'kids'],
      'travel': ['flight', 'hotel', 'trip', 'traveling', 'airport'],
      'health': ['doctor', 'appointment', 'feeling', 'tired', 'sick']
    };

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword => content.toLowerCase().includes(keyword))) {
        topics.push(topic);
      }
    }

    return topics;
  }

  assessEngagement(content) {
    const engagementIndicators = {
      questions: (content.match(/\?/g) || []).length,
      exclamations: (content.match(/!/g) || []).length,
      length: content.length,
      personal_pronouns: (content.match(/\b(I|you|we|us|our)\b/gi) || []).length
    };

    const score = (
      engagementIndicators.questions * 2 +
      engagementIndicators.exclamations * 1.5 +
      Math.min(engagementIndicators.length / 100, 3) +
      engagementIndicators.personal_pronouns * 0.5
    );

    if (score > 5) return 'high';
    if (score > 2) return 'medium';
    return 'low';
  }

  assessResponseQuality(content) {
    const qualityIndicators = {
      helpfulness: content.includes('help') || content.includes('assist'),
      specificity: content.length > 50,
      empathy: content.includes('understand') || content.includes('sorry'),
      actionability: content.includes('can') || content.includes('will') || content.includes('should')
    };

    const score = Object.values(qualityIndicators).filter(Boolean).length;
    return score >= 3 ? 'high' : score >= 2 ? 'medium' : 'low';
  }

  // Initialize database tables
  async initializeTables() {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS chat_mining_analysis (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_type TEXT NOT NULL,
        source_id INTEGER NOT NULL,
        analysis_data TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS pattern_analysis (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        analysis_type TEXT NOT NULL,
        pattern_data TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        confidence_score REAL DEFAULT 0.0
      );

      CREATE TABLE IF NOT EXISTS actionable_insights (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        insight_type TEXT NOT NULL,
        priority TEXT NOT NULL,
        message TEXT NOT NULL,
        action TEXT NOT NULL,
        confidence REAL DEFAULT 0.0,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'pending'
      );

      CREATE TABLE IF NOT EXISTS huddle_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        message_type TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_chat_mining_source ON chat_mining_analysis (source_type, timestamp);
      CREATE INDEX IF NOT EXISTS idx_pattern_analysis_type ON pattern_analysis (analysis_type, timestamp);
      CREATE INDEX IF NOT EXISTS idx_insights_priority ON actionable_insights (priority, status);
    `);
  }
}

module.exports = ChatDataMiner;
