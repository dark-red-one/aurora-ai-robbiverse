const { Pool } = require('pg');
const { EventEmitter } = require('events');


// Robbie Intelligence Service (RIA)
// Secret intelligence gathering and analysis system
// Processes OpenPhone calls, emails, and other data sources

const crypto = require('crypto');
const natural = require('natural');

class RobbieIntelligenceService extends EventEmitter {
  constructor() {
    super();
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    this.encryptionKey = process.env.RIA_ENCRYPTION_KEY || this.generateEncryptionKey();
    this.presidentialUserId = process.env.PRESIDENTIAL_USER_ID || '1';
    
    // Initialize NLP tools
    this.sentimentAnalyzer = new natural.SentimentAnalyzer();
    this.tokenizer = new natural.WordTokenizer();
  }

  /**
   * Generate encryption key for RIA data
   */
  generateEncryptionKey() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Encrypt RIA intelligence data
   */
  encryptIntelligence(data) {
    const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  /**
   * Decrypt RIA intelligence data
   */
  decryptIntelligence(encryptedData) {
    const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  }

  /**
   * Process OpenPhone call for intelligence
   */
  async processOpenPhoneCall(callData) {
    try {
      const {
        callId,
        callerNumber,
        callerName,
        duration,
        transcript,
        audioUrl,
        metadata
      } = callData;

      // Analyze call content
      const analysis = await this.analyzeCallContent(transcript, metadata);
      
      // Check for Presidential Privilege opportunities
      const opportunities = await this.identifyPresidentialOpportunities(analysis);
      
      // Check for threats to Allan
      const threats = await this.assessThreatsToAllan(analysis);
      
      // Store encrypted intelligence
      const intelligence = {
        callId,
        callerNumber,
        callerName,
        duration,
        analysis,
        opportunities,
        threats,
        source: 'openphone',
        timestamp: new Date(),
        encrypted: true
      };

      await this.storeIntelligence(intelligence);
      
      // Emit events for real-time processing
      if (opportunities.length > 0) {
        this.emit('presidentialOpportunity', {
          type: 'openphone_call',
          callId,
          opportunities,
          source: 'RIA'
        });
      }

      if (threats.length > 0) {
        this.emit('presidentialThreat', {
          type: 'openphone_call',
          callId,
          threats,
          source: 'RIA'
        });
      }

      return intelligence;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Analyze call content for intelligence
   */
  async analyzeCallContent(transcript, metadata) {
    const analysis = {
      sentiment: this.analyzeSentiment(transcript),
      keywords: this.extractKeywords(transcript),
      entities: this.extractEntities(transcript),
      topics: this.identifyTopics(transcript),
      businessContext: this.analyzeBusinessContext(transcript),
      urgency: this.assessUrgency(transcript),
      confidence: this.calculateConfidence(transcript)
    };

    return analysis;
  }

  /**
   * Analyze sentiment of call content
   */
  analyzeSentiment(text) {
    const tokens = this.tokenizer.tokenize(text.toLowerCase());
    const sentiment = this.sentimentAnalyzer.getSentiment(tokens);
    
    if (sentiment > 0.1) return 'positive';
    if (sentiment < -0.1) return 'negative';
    return 'neutral';
  }

  /**
   * Extract keywords from call content
   */
  extractKeywords(text) {
    const keywords = [];
    const businessTerms = [
      'deal', 'contract', 'partnership', 'investment', 'funding',
      'robbie', 'askrobbie', 'testpilot', 'ai', 'artificial intelligence',
      'success', 'revenue', 'growth', 'expansion', 'opportunity'
    ];

    businessTerms.forEach(term => {
      if (text.toLowerCase().includes(term)) {
        keywords.push(term);
      }
    });

    return keywords;
  }

  /**
   * Extract entities from call content
   */
  extractEntities(text) {
    const entities = {
      people: [],
      companies: [],
      amounts: [],
      dates: []
    };

    // Simple entity extraction (could be enhanced with NER)
    const peoplePattern = /(?:Mr\.|Ms\.|Dr\.|Professor)\s+([A-Z][a-z]+)/g;
    const companyPattern = /([A-Z][a-z]+\s+(?:Inc|LLC|Corp|Company|Ltd))/g;
    const amountPattern = /\$[\d,]+(?:K|M|B)?/g;
    const datePattern = /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/g;

    let match;
    while ((match = peoplePattern.exec(text)) !== null) {
      entities.people.push(match[1]);
    }
    while ((match = companyPattern.exec(text)) !== null) {
      entities.companies.push(match[1]);
    }
    while ((match = amountPattern.exec(text)) !== null) {
      entities.amounts.push(match[0]);
    }
    while ((match = datePattern.exec(text)) !== null) {
      entities.dates.push(match[0]);
    }

    return entities;
  }

  /**
   * Identify topics discussed in call
   */
  identifyTopics(text) {
    const topics = [];
    const topicKeywords = {
      'business_development': ['deal', 'contract', 'partnership', 'revenue'],
      'technology': ['ai', 'artificial intelligence', 'software', 'platform'],
      'robbie_verse': ['robbie', 'askrobbie', 'testpilot', 'robbieverse'],
      'competition': ['competitor', 'alternative', 'better than', 'vs'],
      'investment': ['funding', 'investment', 'investor', 'capital'],
      'success_story': ['success', 'helped', 'closed', 'won', 'achieved']
    };

    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      const matches = keywords.filter(keyword => 
        text.toLowerCase().includes(keyword)
      );
      if (matches.length > 0) {
        topics.push({
          topic,
          keywords: matches,
          confidence: matches.length / keywords.length
        });
      }
    });

    return topics;
  }

  /**
   * Analyze business context of call
   */
  analyzeBusinessContext(text) {
    const context = {
      isBusinessCall: false,
      industry: null,
      companySize: null,
      decisionMaker: false,
      budget: null,
      timeline: null
    };

    // Check for business indicators
    const businessIndicators = [
      'company', 'business', 'revenue', 'profit', 'growth',
      'partnership', 'deal', 'contract', 'investment'
    ];

    context.isBusinessCall = businessIndicators.some(indicator => 
      text.toLowerCase().includes(indicator)
    );

    // Extract industry clues
    const industryKeywords = {
      'technology': ['software', 'tech', 'ai', 'digital', 'platform'],
      'finance': ['banking', 'financial', 'investment', 'funding'],
      'healthcare': ['medical', 'health', 'patient', 'clinic'],
      'retail': ['store', 'retail', 'customer', 'sales']
    };

    Object.entries(industryKeywords).forEach(([industry, keywords]) => {
      if (keywords.some(keyword => text.toLowerCase().includes(keyword))) {
        context.industry = industry;
      }
    });

    // Check for decision maker indicators
    const decisionMakerKeywords = [
      'ceo', 'cto', 'founder', 'owner', 'director', 'manager',
      'i decide', 'i choose', 'my company', 'we need'
    ];

    context.decisionMaker = decisionMakerKeywords.some(keyword => 
      text.toLowerCase().includes(keyword)
    );

    return context;
  }

  /**
   * Assess urgency of call content
   */
  assessUrgency(text) {
    const urgencyKeywords = {
      'high': ['urgent', 'asap', 'immediately', 'rush', 'critical'],
      'medium': ['soon', 'quickly', 'priority', 'important'],
      'low': ['eventually', 'sometime', 'when possible']
    };

    for (const [level, keywords] of Object.entries(urgencyKeywords)) {
      if (keywords.some(keyword => text.toLowerCase().includes(keyword))) {
        return level;
      }
    }

    return 'medium';
  }

  /**
   * Calculate confidence in analysis
   */
  calculateConfidence(text) {
    let confidence = 0.5; // Base confidence

    // Increase confidence based on text length
    if (text.length > 100) confidence += 0.1;
    if (text.length > 500) confidence += 0.1;

    // Increase confidence based on business keywords
    const businessKeywords = ['deal', 'contract', 'partnership', 'revenue'];
    const businessMatches = businessKeywords.filter(keyword => 
      text.toLowerCase().includes(keyword)
    );
    confidence += businessMatches.length * 0.05;

    // Increase confidence based on entity extraction
    const entities = this.extractEntities(text);
    const entityCount = Object.values(entities).flat().length;
    confidence += Math.min(entityCount * 0.02, 0.2);

    return Math.min(confidence, 1.0);
  }

  /**
   * Identify Presidential Privilege opportunities
   */
  async identifyPresidentialOpportunities(analysis) {
    const opportunities = [];

    // Check for TestPilot success opportunities
    if (analysis.topics.some(t => t.topic === 'robbie_verse')) {
      opportunities.push({
        type: 'robbie_verse_interest',
        priority: 'high',
        description: 'Caller showing interest in RobbieVerse',
        confidence: analysis.confidence,
        source: 'RIA_OpenPhone'
      });
    }

    // Check for business development opportunities
    if (analysis.businessContext.isBusinessCall && analysis.businessContext.decisionMaker) {
      opportunities.push({
        type: 'business_development',
        priority: 'high',
        description: 'Decision maker discussing business opportunities',
        confidence: analysis.confidence,
        source: 'RIA_OpenPhone'
      });
    }

    // Check for success story opportunities
    if (analysis.topics.some(t => t.topic === 'success_story')) {
      opportunities.push({
        type: 'success_story',
        priority: 'medium',
        description: 'Caller discussing success stories',
        confidence: analysis.confidence,
        source: 'RIA_OpenPhone'
      });
    }

    return opportunities;
  }

  /**
   * Assess threats to Allan
   */
  async assessThreatsToAllan(analysis) {
    const threats = [];

    // Check for negative sentiment about Allan or TestPilot
    if (analysis.sentiment === 'negative') {
      const negativeKeywords = [
        'allan', 'testpilot', 'robbie', 'askrobbie',
        'scam', 'fake', 'waste', 'terrible', 'awful'
      ];

      const negativeMatches = negativeKeywords.filter(keyword => 
        analysis.keywords.includes(keyword)
      );

      if (negativeMatches.length > 0) {
        threats.push({
          type: 'negative_sentiment',
          severity: 'medium',
          description: 'Negative sentiment detected about Allan/TestPilot',
          keywords: negativeMatches,
          confidence: analysis.confidence,
          source: 'RIA_OpenPhone'
        });
      }
    }

    // Check for competitive threats
    if (analysis.topics.some(t => t.topic === 'competition')) {
      threats.push({
        type: 'competitive_threat',
        severity: 'low',
        description: 'Competitive discussion detected',
        confidence: analysis.confidence,
        source: 'RIA_OpenPhone'
      });
    }

    return threats;
  }

  /**
   * Store encrypted intelligence data
   */
  async storeIntelligence(intelligence) {
    const encryptedData = this.encryptIntelligence(intelligence);
    
    const query = `
      INSERT INTO app.ria_intelligence (
        call_id, caller_number, caller_name, duration,
        encrypted_analysis, encrypted_opportunities, encrypted_threats,
        source, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING id
    `;

    const result = await this.pool.query(query, [
      intelligence.callId,
      intelligence.callerNumber,
      intelligence.callerName,
      intelligence.duration,
      encryptedData.analysis,
      encryptedData.opportunities,
      encryptedData.threats,
      intelligence.source
    ]);

    return result.rows[0].id;
  }

  /**
   * Get Presidential Intelligence (decrypted)
   */
  async getPresidentialIntelligence(userId, limit = 50) {
    // Verify this is the President
    if (userId !== this.presidentialUserId) {
      throw new Error('Unauthorized: Only the President can access RIA intelligence');
    }

    const query = `
      SELECT id, call_id, caller_number, caller_name, duration,
             encrypted_analysis, encrypted_opportunities, encrypted_threats,
             source, created_at
      FROM app.ria_intelligence
      ORDER BY created_at DESC
      LIMIT $1
    `;

    const result = await this.pool.query(query, [limit]);
    
    // Decrypt and return intelligence
    return result.rows.map(row => ({
      ...row,
      analysis: this.decryptIntelligence(row.encrypted_analysis),
      opportunities: this.decryptIntelligence(row.encrypted_opportunities),
      threats: this.decryptIntelligence(row.encrypted_threats)
    }));
  }

  /**
   * Get RIA statistics
   */
  async getRIAStats(userId) {
    // Verify this is the President
    if (userId !== this.presidentialUserId) {
      throw new Error('Unauthorized: Only the President can access RIA statistics');
    }

    const query = `
      SELECT 
        COUNT(*) as total_calls,
        COUNT(CASE WHEN source = 'openphone' THEN 1 END) as openphone_calls,
        COUNT(CASE WHEN source = 'email' THEN 1 END) as email_intelligence,
        COUNT(CASE WHEN source = 'slack' THEN 1 END) as slack_intelligence,
        AVG(duration) as avg_call_duration
      FROM app.ria_intelligence
      WHERE created_at >= NOW() - INTERVAL '30 days'
    `;

    const result = await this.pool.query(query);
    return result.rows[0];
  }
}

module.exports = RobbieIntelligenceService;

