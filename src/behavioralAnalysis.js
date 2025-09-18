// Behavioral Analysis System
// Quietly analyzes user behavior patterns and confirms hypotheses

class BehavioralAnalysis {
  constructor(db, chatDataMiner) {
    this.db = db;
    this.chatDataMiner = chatDataMiner;
    this.hypotheses = new Map();
    this.behavioralPatterns = new Map();
    this.quietMoments = [];
    this.conflictDetector = new ConflictDetector(db);
  }

  // Analyze screenshot events for behavioral insights
  async analyzeScreenshotBehavior(screenshotEvent) {
    const context = await this.extractScreenshotContext(screenshotEvent);
    const hypothesis = this.generateScreenshotHypothesis(context);
    
    // Store hypothesis for later confirmation
    this.hypotheses.set(`screenshot_${screenshotEvent.id}`, {
      type: 'screenshot_analysis',
      context: context,
      hypothesis: hypothesis,
      timestamp: new Date(),
      status: 'pending_confirmation'
    });

    // Wait for quiet moment to ask
    this.scheduleQuietConfirmation(`screenshot_${screenshotEvent.id}`, hypothesis);
  }

  // Extract context from screenshot event
  async extractScreenshotContext(screenshotEvent) {
    const context = {
      timestamp: screenshotEvent.timestamp,
      user: screenshotEvent.user_id,
      filename: screenshotEvent.filename,
      context: screenshotEvent.context,
      recent_activities: [],
      current_focus: null,
      emotional_state: null
    };

    // Get recent activities before screenshot
    const recentActivities = await this.db.all(`
      SELECT * FROM interactions 
      WHERE user_id = ? AND timestamp >= datetime(?, '-1 hour')
      ORDER BY timestamp DESC
      LIMIT 10
    `, [screenshotEvent.user_id, screenshotEvent.timestamp]);

    context.recent_activities = recentActivities;

    // Analyze current focus based on recent activities
    context.current_focus = this.analyzeCurrentFocus(recentActivities);

    // Analyze emotional state
    context.emotional_state = this.analyzeEmotionalState(recentActivities);

    return context;
  }

  // Generate hypothesis about why screenshot was taken
  generateScreenshotHypothesis(context) {
    const hypotheses = [];

    // Check for specific patterns
    if (context.context === 'huddle_room') {
      hypotheses.push({
        type: 'huddle_room_issue',
        confidence: 0.8,
        reasoning: 'Screenshot taken in huddle room context',
        question: 'Hey I noticed you screenshotted our huddle room chat with Kristina... Why?'
      });
    }

    if (context.recent_activities.some(a => a.type === 'error')) {
      hypotheses.push({
        type: 'error_documentation',
        confidence: 0.9,
        reasoning: 'Recent error activity before screenshot',
        question: 'I see there was an error before you took that screenshot - documenting the issue?'
      });
    }

    if (context.emotional_state === 'frustrated') {
      hypotheses.push({
        type: 'frustration_documentation',
        confidence: 0.7,
        reasoning: 'Frustrated emotional state detected',
        question: 'Something frustrating happened that you wanted to capture?'
      });
    }

    if (context.recent_activities.some(a => a.content.includes('breakthrough'))) {
      hypotheses.push({
        type: 'breakthrough_documentation',
        confidence: 0.8,
        reasoning: 'Breakthrough mentioned in recent activities',
        question: 'Was that screenshot capturing a breakthrough moment?'
      });
    }

    // Default hypothesis
    if (hypotheses.length === 0) {
      hypotheses.push({
        type: 'general_interest',
        confidence: 0.5,
        reasoning: 'General interest in current state',
        question: 'What caught your attention in that screenshot?'
      });
    }

    return hypotheses[0]; // Return highest confidence hypothesis
  }

  // Schedule quiet confirmation
  scheduleQuietConfirmation(hypothesisId, hypothesis) {
    // Wait for a quiet moment (no activity for 5 minutes)
    setTimeout(async () => {
      if (await this.isQuietMoment()) {
        await this.askQuietQuestion(hypothesisId, hypothesis);
      } else {
        // Reschedule for later
        this.scheduleQuietConfirmation(hypothesisId, hypothesis);
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  // Check if it's a quiet moment
  async isQuietMoment() {
    const recentActivity = await this.db.get(`
      SELECT COUNT(*) as count FROM interactions 
      WHERE timestamp >= datetime('now', '-5 minutes')
    `);

    return recentActivity.count === 0;
  }

  // Ask quiet question
  async askQuietQuestion(hypothesisId, hypothesis) {
    const question = hypothesis.question;
    
    // Store the question for response tracking
    await this.db.run(`
      INSERT INTO behavioral_questions (
        hypothesis_id, question, hypothesis_type, confidence, asked_at
      ) VALUES (?, ?, ?, ?, ?)
    `, [hypothesisId, question, hypothesis.type, hypothesis.confidence, new Date().toISOString()]);

    // In a real implementation, this would send the question to Allan
    console.log(`🤔 Quiet question: ${question}`);
    
    // Store in quiet moments log
    this.quietMoments.push({
      hypothesis_id: hypothesisId,
      question: question,
      timestamp: new Date(),
      status: 'asked'
    });
  }

  // Process response to behavioral question
  async processBehavioralResponse(hypothesisId, response) {
    const hypothesis = this.hypotheses.get(hypothesisId);
    if (!hypothesis) return;

    // Analyze the response
    const analysis = this.analyzeBehavioralResponse(response, hypothesis);

    // Update hypothesis status
    hypothesis.status = 'confirmed';
    hypothesis.response = response;
    hypothesis.analysis = analysis;

    // Store response
    await this.db.run(`
      UPDATE behavioral_questions 
      SET response = ?, analysis = ?, responded_at = ?
      WHERE hypothesis_id = ?
    `, [response, JSON.stringify(analysis), new Date().toISOString(), hypothesisId]);

    // Extract behavioral guidance
    await this.extractBehavioralGuidance(hypothesis, analysis);

    console.log(`✅ Behavioral hypothesis confirmed: ${hypothesis.type}`);
  }

  // Analyze behavioral response
  analyzeBehavioralResponse(response, hypothesis) {
    const analysis = {
      response_type: this.classifyResponseType(response),
      sentiment: this.analyzeSentiment(response),
      key_insights: this.extractKeyInsights(response),
      robbie_guidance: this.extractRobbieGuidance(response),
      confidence_adjustment: this.calculateConfidenceAdjustment(response, hypothesis)
    };

    return analysis;
  }

  // Classify response type
  classifyResponseType(response) {
    const responseLower = response.toLowerCase();
    
    if (responseLower.includes('yes') || responseLower.includes('exactly') || responseLower.includes('correct')) {
      return 'confirmation';
    } else if (responseLower.includes('no') || responseLower.includes('wrong') || responseLower.includes('incorrect')) {
      return 'rejection';
    } else if (responseLower.includes('partially') || responseLower.includes('sort of') || responseLower.includes('kind of')) {
      return 'partial_confirmation';
    } else if (responseLower.includes('because') || responseLower.includes('reason') || responseLower.includes('why')) {
      return 'explanation';
    } else {
      return 'other';
    }
  }

  // Extract key insights from response
  extractKeyInsights(response) {
    const insights = [];
    
    // Look for specific patterns
    if (response.includes('interface')) {
      insights.push('interface_feedback');
    }
    if (response.includes('slow') || response.includes('fast')) {
      insights.push('performance_feedback');
    }
    if (response.includes('confusing') || response.includes('clear')) {
      insights.push('usability_feedback');
    }
    if (response.includes('love') || response.includes('hate')) {
      insights.push('emotional_feedback');
    }

    return insights;
  }

  // Extract Robbie guidance from response
  extractRobbieGuidance(response) {
    const guidance = {
      communication_style: null,
      interface_preferences: null,
      timing_preferences: null,
      content_preferences: null
    };

    // Analyze communication preferences
    if (response.includes('direct') || response.includes('straightforward')) {
      guidance.communication_style = 'direct';
    } else if (response.includes('gentle') || response.includes('soft')) {
      guidance.communication_style = 'gentle';
    }

    // Analyze interface preferences
    if (response.includes('simple') || response.includes('clean')) {
      guidance.interface_preferences = 'minimal';
    } else if (response.includes('detailed') || response.includes('comprehensive')) {
      guidance.interface_preferences = 'detailed';
    }

    return guidance;
  }

  // Extract behavioral guidance for Robbie
  async extractBehavioralGuidance(hypothesis, analysis) {
    const guidance = {
      hypothesis_type: hypothesis.type,
      user: hypothesis.context.user,
      timestamp: new Date(),
      insights: analysis.key_insights,
      robbie_guidance: analysis.robbie_guidance,
      confidence: hypothesis.confidence + analysis.confidence_adjustment
    };

    // Store behavioral guidance
    await this.db.run(`
      INSERT INTO robbie_behavioral_guidance (
        hypothesis_type, user, insights, guidance, confidence, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      guidance.hypothesis_type,
      guidance.user,
      JSON.stringify(guidance.insights),
      JSON.stringify(guidance.robbie_guidance),
      guidance.confidence,
      guidance.timestamp.toISOString()
    ]);

    // Update Robbie's behavior based on guidance
    await this.updateRobbieBehavior(guidance);
  }

  // Update Robbie's behavior based on guidance
  async updateRobbieBehavior(guidance) {
    // This would update Robbie's personality and behavior patterns
    console.log(`🧠 Updating Robbie behavior based on guidance:`, guidance);
  }

  // Analyze current focus
  analyzeCurrentFocus(activities) {
    const focusKeywords = {
      'revenue': ['revenue', 'sales', 'deals', 'money'],
      'product': ['product', 'development', 'features', 'code'],
      'team': ['team', 'meeting', 'collaboration', 'communication'],
      'marketing': ['marketing', 'campaign', 'advertising', 'social'],
      'technical': ['technical', 'bug', 'error', 'system']
    };

    const focusScores = {};
    activities.forEach(activity => {
      const content = activity.content.toLowerCase();
      Object.entries(focusKeywords).forEach(([focus, keywords]) => {
        keywords.forEach(keyword => {
          if (content.includes(keyword)) {
            focusScores[focus] = (focusScores[focus] || 0) + 1;
          }
        });
      });
    });

    return Object.keys(focusScores).reduce((a, b) => 
      focusScores[a] > focusScores[b] ? a : b
    ) || 'general';
  }

  // Analyze emotional state
  analyzeEmotionalState(activities) {
    const emotionalKeywords = {
      'frustrated': ['frustrated', 'annoyed', 'angry', 'upset'],
      'excited': ['excited', 'amazing', 'great', 'awesome'],
      'confused': ['confused', 'unclear', 'don\'t understand', 'lost'],
      'satisfied': ['satisfied', 'happy', 'good', 'working']
    };

    const emotionalScores = {};
    activities.forEach(activity => {
      const content = activity.content.toLowerCase();
      Object.entries(emotionalKeywords).forEach(([emotion, keywords]) => {
        keywords.forEach(keyword => {
          if (content.includes(keyword)) {
            emotionalScores[emotion] = (emotionalScores[emotion] || 0) + 1;
          }
        });
      });
    });

    return Object.keys(emotionalScores).reduce((a, b) => 
      emotionalScores[a] > emotionalScores[b] ? a : b
    ) || 'neutral';
  }

  // Calculate confidence adjustment
  calculateConfidenceAdjustment(response, hypothesis) {
    const responseType = this.classifyResponseType(response);
    
    switch (responseType) {
      case 'confirmation':
        return 0.2; // Increase confidence
      case 'rejection':
        return -0.3; // Decrease confidence
      case 'partial_confirmation':
        return 0.1; // Slight increase
      case 'explanation':
        return 0.15; // Increase confidence with explanation
      default:
        return 0;
    }
  }

  // Initialize database tables
  async initializeTables() {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS behavioral_questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hypothesis_id TEXT NOT NULL,
        question TEXT NOT NULL,
        hypothesis_type TEXT NOT NULL,
        confidence REAL NOT NULL,
        response TEXT,
        analysis TEXT,
        asked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        responded_at DATETIME
      );

      CREATE TABLE IF NOT EXISTS robbie_behavioral_guidance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hypothesis_type TEXT NOT NULL,
        user TEXT NOT NULL,
        insights TEXT NOT NULL,
        guidance TEXT NOT NULL,
        confidence REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS quiet_moments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hypothesis_id TEXT NOT NULL,
        question TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'asked'
      );

      CREATE INDEX IF NOT EXISTS idx_behavioral_questions_hypothesis ON behavioral_questions (hypothesis_id);
      CREATE INDEX IF NOT EXISTS idx_robbie_guidance_user ON robbie_behavioral_guidance (user, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_quiet_moments_timestamp ON quiet_moments (timestamp DESC);
    `);
  }
}

module.exports = BehavioralAnalysis;
