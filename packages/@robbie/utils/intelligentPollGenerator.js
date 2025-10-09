// Intelligent Daily Poll Generator
// Uses learning objectives to drive poll questions and leverages team expertise

class IntelligentPollGenerator {
  constructor(db, locationAwareness, chatDataMiner) {
    this.db = db;
    this.locationAwareness = locationAwareness;
    this.chatDataMiner = chatDataMiner;
    
    this.learningObjectives = {
      'revenue_prediction': {
        priority: 1,
        description: 'Predict revenue outcomes and deal closures',
        key_metrics: ['deal_value', 'close_probability', 'timeline'],
        expertise_sources: ['tom_mustapic', 'kristina_mustapic']
      },
      'allan_behavior_patterns': {
        priority: 2,
        description: 'Understand Allan\'s decision-making and mood patterns',
        key_metrics: ['mood_indicators', 'decision_factors', 'stress_levels'],
        expertise_sources: ['lisa_peretz', 'ed_escobar']
      },
      'team_dynamics': {
        priority: 3,
        description: 'Optimize team collaboration and communication',
        key_metrics: ['meeting_effectiveness', 'communication_gaps', 'workload_balance'],
        expertise_sources: ['kristina_mustapic', 'isabel_mendez']
      },
      'market_intelligence': {
        priority: 4,
        description: 'Gather market insights and competitive intelligence',
        key_metrics: ['market_sentiment', 'competitive_threats', 'opportunity_sizing'],
        expertise_sources: ['david_ahuja', 'david_fish', 'isabel_mendez']
      },
      'product_development': {
        priority: 5,
        description: 'Track product development progress and user feedback',
        key_metrics: ['feature_adoption', 'user_satisfaction', 'development_velocity'],
        expertise_sources: ['ed_escobar', 'isabel_mendez']
      }
    };

    this.teamExpertise = {
      'tom_mustapic': {
        name: 'Tom Mustapic',
        role: 'Head of Revenue',
        expertise: ['sales_pipeline', 'deal_negotiation', 'revenue_forecasting', 'client_relationships'],
        context_sources: ['hubspot_deals', 'sales_meetings', 'revenue_reports'],
        follow_up_style: 'data_driven',
        confidence_threshold: 0.7
      },
      'kristina_mustapic': {
        name: 'Kristina Mustapic',
        role: 'Account Manager',
        expertise: ['client_meetings', 'account_health', 'meeting_transcripts', 'client_satisfaction'],
        context_sources: ['meeting_notes', 'client_communications', 'account_metrics'],
        follow_up_style: 'collaborative',
        confidence_threshold: 0.6
      },
      'lisa_peretz': {
        name: 'Lisa Peretz',
        role: 'Wife',
        expertise: ['allan_moods', 'personal_context', 'work_life_balance', 'stress_indicators'],
        context_sources: ['personal_communications', 'mood_observations', 'family_context'],
        follow_up_style: 'caring',
        confidence_threshold: 0.8
      },
      'ed_escobar': {
        name: 'Ed Escobar',
        role: 'Co-founder / CTO',
        expertise: ['technical_decisions', 'product_roadmap', 'allan_technical_mood', 'development_priorities'],
        context_sources: ['technical_discussions', 'code_reviews', 'architecture_decisions'],
        follow_up_style: 'technical',
        confidence_threshold: 0.7
      },
      'isabel_mendez': {
        name: 'Isabel Mendez',
        role: 'Marketing Lead',
        expertise: ['market_research', 'brand_perception', 'campaign_effectiveness', 'customer_insights'],
        context_sources: ['marketing_metrics', 'customer_feedback', 'market_research'],
        follow_up_style: 'analytical',
        confidence_threshold: 0.6
      },
      'david_ahuja': {
        name: 'David Ahuja',
        role: 'Advisor',
        expertise: ['industry_insights', 'strategic_planning', 'market_trends', 'competitive_landscape'],
        context_sources: ['industry_reports', 'strategic_discussions', 'market_analysis'],
        follow_up_style: 'strategic',
        confidence_threshold: 0.8
      },
      'david_fish': {
        name: 'David Fish',
        role: 'Advisor',
        expertise: ['business_strategy', 'growth_planning', 'market_opportunities', 'competitive_analysis'],
        context_sources: ['strategy_sessions', 'growth_metrics', 'market_opportunities'],
        follow_up_style: 'strategic',
        confidence_threshold: 0.8
      }
    };
  }

  // Generate daily poll based on learning objectives
  async generateDailyPoll() {
    console.log('🧠 Generating intelligent daily poll...');
    
    // Analyze current context and priorities
    const context = await this.analyzeCurrentContext();
    
    // Select learning objective based on priority and context
    const selectedObjective = this.selectLearningObjective(context);
    
    // Generate poll question
    const pollQuestion = await this.generatePollQuestion(selectedObjective, context);
    
    // Create poll
    const poll = await this.createPoll(pollQuestion);
    
    // Schedule follow-up conversations
    await this.scheduleFollowUpConversations(poll, selectedObjective);
    
    console.log(`📊 Daily poll created: ${poll.question}`);
    return poll;
  }

  // Analyze current context for poll generation
  async analyzeCurrentContext() {
    const context = {
      timestamp: new Date(),
      day_of_week: new Date().getDay(),
      time_of_day: new Date().getHours(),
      
      // Business context
      revenue_pressure: await this.assessRevenuePressure(),
      allan_mood: await this.assessAllanMood(),
      team_stress: await this.assessTeamStress(),
      market_activity: await this.assessMarketActivity(),
      
      // Recent events
      recent_deals: await this.getRecentDeals(),
      recent_meetings: await this.getRecentMeetings(),
      recent_failures: await this.getRecentFailures(),
      
      // Learning gaps
      knowledge_gaps: await this.identifyKnowledgeGaps(),
      prediction_uncertainty: await this.assessPredictionUncertainty()
    };

    return context;
  }

  // Select learning objective based on context
  selectLearningObjective(context) {
    const objectives = Object.entries(this.learningObjectives);
    
    // Score each objective based on context
    const scoredObjectives = objectives.map(([key, objective]) => {
      let score = objective.priority;
      
      // Revenue prediction gets higher priority if revenue pressure is high
      if (key === 'revenue_prediction' && context.revenue_pressure > 0.7) {
        score += 2;
      }
      
      // Allan behavior gets higher priority if mood is uncertain
      if (key === 'allan_behavior_patterns' && context.allan_mood.uncertainty > 0.6) {
        score += 2;
      }
      
      // Team dynamics gets higher priority if team stress is high
      if (key === 'team_dynamics' && context.team_stress > 0.6) {
        score += 1.5;
      }
      
      // Market intelligence gets higher priority if market activity is high
      if (key === 'market_intelligence' && context.market_activity > 0.7) {
        score += 1.5;
      }
      
      return { key, objective, score };
    });

    // Select highest scoring objective
    const selected = scoredObjectives.sort((a, b) => b.score - a.score)[0];
    
    console.log(`🎯 Selected learning objective: ${selected.key} (score: ${selected.score})`);
    return selected;
  }

  // Generate poll question based on objective and context
  async generatePollQuestion(selectedObjective, context) {
    const { key, objective } = selectedObjective;
    
    const questionTemplates = {
      'revenue_prediction': [
        {
          question: "What's the probability we'll close the {deal_name} deal this week?",
          options: [
            { id: 'very_high', text: 'Very High (80-100%)', emoji: '🚀' },
            { id: 'high', text: 'High (60-79%)', emoji: '👍' },
            { id: 'medium', text: 'Medium (40-59%)', emoji: '🤔' },
            { id: 'low', text: 'Low (20-39%)', emoji: '😟' },
            { id: 'very_low', text: 'Very Low (0-19%)', emoji: '📉' }
          ],
          details_link: "https://testpilotcpg.com/deal-pipeline"
        },
        {
          question: "Will we hit our Q4 revenue target of $500K?",
          options: [
            { id: 'exceed', text: 'Exceed Target', emoji: '🎯' },
            { id: 'meet', text: 'Meet Target', emoji: '✅' },
            { id: 'close', text: 'Close to Target', emoji: '📊' },
            { id: 'miss', text: 'Miss Target', emoji: '❌' }
          ],
          details_link: "https://testpilotcpg.com/q4-revenue"
        }
      ],
      'allan_behavior_patterns': [
        {
          question: "How is Allan's stress level today?",
          options: [
            { id: 'very_low', text: 'Very Low - Calm', emoji: '😌' },
            { id: 'low', text: 'Low - Relaxed', emoji: '😊' },
            { id: 'medium', text: 'Medium - Normal', emoji: '😐' },
            { id: 'high', text: 'High - Stressed', emoji: '😰' },
            { id: 'very_high', text: 'Very High - Overwhelmed', emoji: '😵' }
          ],
          details_link: "https://testpilotcpg.com/allan-status"
        },
        {
          question: "What's Allan's current focus priority?",
          options: [
            { id: 'revenue', text: 'Revenue Generation', emoji: '💰' },
            { id: 'product', text: 'Product Development', emoji: '🚀' },
            { id: 'team', text: 'Team Management', emoji: '👥' },
            { id: 'strategy', text: 'Strategic Planning', emoji: '🧠' },
            { id: 'personal', text: 'Personal Time', emoji: '🏠' }
          ],
          details_link: "https://testpilotcpg.com/priorities"
        }
      ],
      'team_dynamics': [
        {
          question: "How effective was our last team meeting?",
          options: [
            { id: 'excellent', text: 'Excellent - Very Productive', emoji: '🌟' },
            { id: 'good', text: 'Good - Productive', emoji: '👍' },
            { id: 'average', text: 'Average - Somewhat Productive', emoji: '😐' },
            { id: 'poor', text: 'Poor - Not Very Productive', emoji: '😕' },
            { id: 'terrible', text: 'Terrible - Waste of Time', emoji: '😤' }
          ],
          details_link: "https://testpilotcpg.com/team-meetings"
        }
      ],
      'market_intelligence': [
        {
          question: "How competitive is our current market position?",
          options: [
            { id: 'leading', text: 'Leading - We\'re Ahead', emoji: '🥇' },
            { id: 'strong', text: 'Strong - Competitive', emoji: '💪' },
            { id: 'average', text: 'Average - Middle Pack', emoji: '📊' },
            { id: 'weak', text: 'Weak - Behind', emoji: '😟' },
            { id: 'struggling', text: 'Struggling - Far Behind', emoji: '📉' }
          ],
          details_link: "https://testpilotcpg.com/competitive-analysis"
        }
      ],
      'product_development': [
        {
          question: "How confident are you in our product roadmap?",
          options: [
            { id: 'very_confident', text: 'Very Confident', emoji: '🚀' },
            { id: 'confident', text: 'Confident', emoji: '👍' },
            { id: 'neutral', text: 'Neutral', emoji: '🤔' },
            { id: 'concerned', text: 'Concerned', emoji: '😟' },
            { id: 'worried', text: 'Worried', emoji: '😰' }
          ],
          details_link: "https://testpilotcpg.com/product-roadmap"
        }
      ]
    };

    const templates = questionTemplates[key] || questionTemplates['revenue_prediction'];
    const selectedTemplate = templates[Math.floor(Math.random() * templates.length)];
    
    // Customize template based on context
    let question = selectedTemplate.question;
    if (question.includes('{deal_name}')) {
      const recentDeal = context.recent_deals[0];
      question = question.replace('{deal_name}', recentDeal?.name || 'Simply Good Foods');
    }

    return {
      question,
      options: selectedTemplate.options,
      details_link: selectedTemplate.details_link,
      learning_objective: key,
      context_metadata: {
        revenue_pressure: context.revenue_pressure,
        allan_mood: context.allan_mood,
        team_stress: context.team_stress
      }
    };
  }

  // Create poll using the polling system
  async createPoll(pollData) {
    // This would integrate with your TeamPollingSystem
    const poll = {
      id: `poll_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      question: pollData.question,
      options: pollData.options,
      type: 'multiple_choice',
      details_link: pollData.details_link,
      created_by: 'robbie_intelligent_system',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      status: 'active',
      learning_objective: pollData.learning_objective,
      context_metadata: pollData.context_metadata
    };

    // Store in database
    await this.db.run(`
      INSERT INTO intelligent_polls (
        id, question, options, learning_objective, context_metadata,
        created_at, expires_at, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      poll.id,
      poll.question,
      JSON.stringify(poll.options),
      poll.learning_objective,
      JSON.stringify(poll.context_metadata),
      poll.created_at,
      poll.expires_at,
      poll.status
    ]);

    return poll;
  }

  // Schedule follow-up conversations based on responses
  async scheduleFollowUpConversations(poll, objective) {
    const followUpSchedule = [];
    
    // Schedule follow-ups for each team member based on their expertise
    for (const [memberId, expertise] of Object.entries(this.teamExpertise)) {
      if (expertise.expertise.some(exp => 
        objective.objective.expertise_sources.includes(memberId)
      )) {
        followUpSchedule.push({
          member_id: memberId,
          poll_id: poll.id,
          scheduled_time: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours after poll
          follow_up_type: 'expertise_clarification',
          priority: 'medium'
        });
      }
    }

    // Store follow-up schedule
    for (const followUp of followUpSchedule) {
      await this.db.run(`
        INSERT INTO poll_follow_ups (
          member_id, poll_id, scheduled_time, follow_up_type, priority
        ) VALUES (?, ?, ?, ?, ?)
      `, [
        followUp.member_id,
        followUp.poll_id,
        followUp.scheduled_time.toISOString(),
        followUp.follow_up_type,
        followUp.priority
      ]);
    }

    console.log(`📅 Scheduled ${followUpSchedule.length} follow-up conversations`);
  }

  // Process poll responses and generate follow-up questions
  async processPollResponses(pollId) {
    const poll = await this.getPoll(pollId);
    const responses = await this.getPollResponses(pollId);
    
    // Analyze response patterns
    const analysis = this.analyzeResponses(responses, poll);
    
    // Generate follow-up questions for unexpected responses
    const followUpQuestions = await this.generateFollowUpQuestions(analysis, poll);
    
    // Schedule follow-up conversations
    await this.scheduleFollowUpConversations(followUpQuestions, poll);
    
    return analysis;
  }

  // Analyze poll responses for patterns
  analyzeResponses(responses, poll) {
    const analysis = {
      total_responses: responses.length,
      response_distribution: {},
      unexpected_responses: [],
      consensus_level: 0,
      expertise_insights: {}
    };

    // Calculate response distribution
    responses.forEach(response => {
      const optionId = response.option_id;
      analysis.response_distribution[optionId] = 
        (analysis.response_distribution[optionId] || 0) + 1;
    });

    // Calculate consensus level
    const maxResponses = Math.max(...Object.values(analysis.response_distribution));
    analysis.consensus_level = (maxResponses / responses.length) * 100;

    // Identify unexpected responses
    responses.forEach(response => {
      const member = this.teamExpertise[response.user_id];
      if (member) {
        const expectedResponse = this.predictExpectedResponse(response, member, poll);
        if (expectedResponse.confidence < member.confidence_threshold) {
          analysis.unexpected_responses.push({
            member_id: response.user_id,
            response: response.option_id,
            expected: expectedResponse.option_id,
            confidence: expectedResponse.confidence,
            expertise_area: member.expertise
          });
        }
      }
    });

    return analysis;
  }

  // Predict expected response based on member expertise
  predictExpectedResponse(response, member, poll) {
    // This would use historical data and member expertise to predict expected response
    // For now, return a mock prediction
    return {
      option_id: 'medium',
      confidence: 0.6,
      reasoning: 'Based on historical patterns and expertise area'
    };
  }

  // Generate follow-up questions for unexpected responses
  async generateFollowUpQuestions(analysis, poll) {
    const followUpQuestions = [];

    for (const unexpected of analysis.unexpected_responses) {
      const member = this.teamExpertise[unexpected.member_id];
      const question = this.generateMemberSpecificFollowUp(unexpected, member, poll);
      
      followUpQuestions.push({
        member_id: unexpected.member_id,
        question: question,
        context: unexpected,
        priority: 'high'
      });
    }

    return followUpQuestions;
  }

  // Generate member-specific follow-up questions
  generateMemberSpecificFollowUp(unexpected, member, poll) {
    const followUpTemplates = {
      'tom_mustapic': [
        "Hey Tom! I noticed your response about the revenue prediction was different than expected. Can you share what factors you're seeing that I might be missing?",
        "Tom, your take on the deal probability seems different from the data I'm seeing. What's your read on the client's current state?"
      ],
      'kristina_mustapic': [
        "Hi Kristina! Your response about the team meeting effectiveness caught my attention. What specific aspects made you feel that way?",
        "Kristina, I'd love to understand your perspective on the client relationship. What are you seeing in your meetings that I should know about?"
      ],
      'lisa_peretz': [
        "Lisa, I noticed your assessment of Allan's stress level. Is there something specific you're observing that I should be aware of?",
        "Hey Lisa! Your take on Allan's current focus seems different from what I'm tracking. What's your read on his priorities right now?"
      ],
      'ed_escobar': [
        "Ed, your response about the product roadmap confidence is interesting. What technical factors are influencing your assessment?",
        "Hey Ed! I'd love to understand your perspective on the development priorities. What are you seeing in the codebase that I should know about?"
      ]
    };

    const templates = followUpTemplates[unexpected.member_id] || [
      "I noticed your response was different than expected. Can you help me understand your perspective?"
    ];

    return templates[Math.floor(Math.random() * templates.length)];
  }

  // Helper methods for context analysis
  async assessRevenuePressure() {
    // Analyze recent revenue data, deal pipeline, etc.
    return Math.random(); // Mock implementation
  }

  async assessAllanMood() {
    // Analyze Allan's recent communications, location data, etc.
    return {
      level: Math.random(),
      uncertainty: Math.random(),
      indicators: ['stress', 'excitement', 'frustration']
    };
  }

  async assessTeamStress() {
    // Analyze team communication patterns, workload, etc.
    return Math.random();
  }

  async assessMarketActivity() {
    // Analyze market conditions, competitive activity, etc.
    return Math.random();
  }

  async getRecentDeals() {
    // Get recent deal data
    return [
      { name: 'Simply Good Foods', value: 125000, stage: 'negotiation' },
      { name: 'Bayer Partnership', value: 485000, stage: 'proposal' }
    ];
  }

  async getRecentMeetings() {
    // Get recent meeting data
    return [
      { title: 'Revenue Review', participants: ['tom', 'kristina'], effectiveness: 0.8 },
      { title: 'Product Planning', participants: ['ed', 'isabel'], effectiveness: 0.6 }
    ];
  }

  async getRecentFailures() {
    // Get recent failure data
    return [];
  }

  async identifyKnowledgeGaps() {
    // Identify areas where we need more information
    return ['revenue_prediction', 'allan_behavior_patterns'];
  }

  async assessPredictionUncertainty() {
    // Assess how uncertain our current predictions are
    return Math.random();
  }

  // Database helper methods
  async getPoll(pollId) {
    return await this.db.get(`
      SELECT * FROM intelligent_polls WHERE id = ?
    `, [pollId]);
  }

  async getPollResponses(pollId) {
    return await this.db.all(`
      SELECT * FROM poll_votes WHERE poll_id = ?
    `, [pollId]);
  }

  // Initialize database tables
  async initializeTables() {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS intelligent_polls (
        id TEXT PRIMARY KEY,
        question TEXT NOT NULL,
        options TEXT NOT NULL,
        learning_objective TEXT NOT NULL,
        context_metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL,
        status TEXT DEFAULT 'active'
      );

      CREATE TABLE IF NOT EXISTS poll_follow_ups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        member_id TEXT NOT NULL,
        poll_id TEXT NOT NULL,
        scheduled_time DATETIME NOT NULL,
        follow_up_type TEXT NOT NULL,
        priority TEXT DEFAULT 'medium',
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (poll_id) REFERENCES intelligent_polls (id)
      );

      CREATE INDEX IF NOT EXISTS idx_intelligent_polls_objective ON intelligent_polls (learning_objective, created_at);
      CREATE INDEX IF NOT EXISTS idx_poll_follow_ups_scheduled ON poll_follow_ups (scheduled_time, status);
    `);
  }
}

module.exports = IntelligentPollGenerator;
