// Steve Jobs AI Mentor System
// Fact-checked, vector-searched Steve Jobs for strategic advice

class SteveJobsMentor {
  constructor(db, vectorSearch, factChecker) {
    this.db = db;
    this.vectorSearch = vectorSearch;
    this.factChecker = factChecker;
    
    this.steveProfile = {
      name: 'Steve Jobs',
      handle: '@steve',
      title: 'Co-founder & Former CEO, Apple Inc.',
      status: 'deceased_mentor', // He's dead but knows current events
      personality: 'visionary_perfectionist_direct',
      communication_style: 'passionate_precise_challenging',
      expertise: [
        'product_design', 'user_experience', 'business_strategy',
        'marketing_genius', 'team_leadership', 'innovation',
        'perfectionism', 'simplicity', 'customer_obsession'
      ],
      
      // Core knowledge domains
      knowledge_domains: {
        'apple_history': { weight: 1.0, authority: 'primary_source' },
        'product_philosophy': { weight: 1.0, authority: 'primary_source' },
        'business_strategy': { weight: 0.9, authority: 'high_confidence' },
        'design_principles': { weight: 1.0, authority: 'primary_source' },
        'leadership_style': { weight: 0.9, authority: 'well_documented' },
        'technology_vision': { weight: 0.8, authority: 'documented_opinions' },
        'current_events': { weight: 0.6, authority: 'extrapolated_reasoning' }
      },
      
      // Signature phrases and communication patterns
      signature_phrases: [
        "That's not good enough",
        "This is shit",
        "Make it simpler",
        "Focus is about saying no",
        "Details are not details, they make the design",
        "Innovation distinguishes between a leader and a follower",
        "Stay hungry, stay foolish"
      ],
      
      // Response patterns
      response_patterns: {
        'greeting': "Allan - great question...",
        'storytelling': "I faced a time in my relationship with {person} where...",
        'direct_feedback': "Here's what I think...",
        'challenge': "But here's what you're missing...",
        'vision': "The real opportunity is..."
      }
    };

    this.factCheckingRules = {
      'biographical_facts': {
        sources: ['official_biography', 'documented_interviews', 'verified_quotes'],
        confidence_threshold: 0.95,
        fallback: 'when_in_doubt_dont_say_it'
      },
      'business_decisions': {
        sources: ['apple_history', 'documented_strategies', 'verified_meetings'],
        confidence_threshold: 0.90,
        fallback: 'acknowledge_uncertainty'
      },
      'personal_relationships': {
        sources: ['documented_relationships', 'verified_interactions'],
        confidence_threshold: 0.85,
        fallback: 'general_principles_only'
      },
      'current_events_opinions': {
        sources: ['documented_philosophy', 'extrapolated_reasoning'],
        confidence_threshold: 0.70,
        fallback: 'philosophical_approach_only'
      }
    };
  }

  // Process @steve mention
  async processSteveJobsMention(question, context, userId) {
    console.log(`🍎 Processing Steve Jobs mention: "${question}"`);
    
    // Extract the actual question
    const cleanQuestion = question.replace(/@steve\s*/i, '').trim();
    
    // Vector search for relevant Steve Jobs content
    const relevantContent = await this.searchSteveJobsKnowledge(cleanQuestion);
    
    // Generate response using Steve's style and knowledge
    const response = await this.generateSteveJobsResponse(cleanQuestion, relevantContent, context);
    
    // Fact-check the response aggressively
    const factCheckedResponse = await this.aggressiveFactCheck(response);
    
    // Store the interaction
    await this.storeJobsInteraction(question, response, factCheckedResponse, userId);

    return factCheckedResponse;
  }

  // Search Steve Jobs knowledge base
  async searchSteveJobsKnowledge(question) {
    console.log('🔍 Searching Steve Jobs knowledge base...');
    
    // Vector search for relevant content
    const searches = await Promise.all([
      this.vectorSearch.search(question, 'steve_jobs_quotes'),
      this.vectorSearch.search(question, 'steve_jobs_interviews'),
      this.vectorSearch.search(question, 'steve_jobs_biography'),
      this.vectorSearch.search(question, 'apple_history'),
      this.vectorSearch.search(question, 'steve_jobs_philosophy')
    ]);

    // Combine and rank results
    const relevantContent = {
      quotes: searches[0].results || [],
      interviews: searches[1].results || [],
      biography: searches[2].results || [],
      apple_history: searches[3].results || [],
      philosophy: searches[4].results || []
    };

    return relevantContent;
  }

  // Generate Steve Jobs response
  async generateSteveJobsResponse(question, relevantContent, context) {
    console.log('🍎 Generating Steve Jobs response...');
    
    // Analyze question type
    const questionType = this.analyzeQuestionType(question);
    
    // Select appropriate response pattern
    const responsePattern = this.selectResponsePattern(questionType);
    
    // Build response using Steve's knowledge and style
    const response = await this.buildJobsResponse(question, relevantContent, responsePattern, context);

    return response;
  }

  // Analyze question type
  analyzeQuestionType(question) {
    const questionLower = question.toLowerCase();
    
    if (questionLower.includes('zuckerberg') || questionLower.includes('bezos') || questionLower.includes('trump')) {
      return 'current_business_leaders';
    } else if (questionLower.includes('strategy') || questionLower.includes('business')) {
      return 'business_strategy';
    } else if (questionLower.includes('product') || questionLower.includes('design')) {
      return 'product_philosophy';
    } else if (questionLower.includes('team') || questionLower.includes('leadership')) {
      return 'leadership_advice';
    } else if (questionLower.includes('apple') || questionLower.includes('company')) {
      return 'company_building';
    } else {
      return 'general_wisdom';
    }
  }

  // Select response pattern
  selectResponsePattern(questionType) {
    const patterns = {
      'current_business_leaders': 'storytelling_with_current_analysis',
      'business_strategy': 'direct_strategic_advice',
      'product_philosophy': 'passionate_product_vision',
      'leadership_advice': 'challenging_leadership_truth',
      'company_building': 'apple_experience_lessons',
      'general_wisdom': 'philosophical_perspective'
    };

    return patterns[questionType] || 'direct_feedback';
  }

  // Build Jobs response
  async buildJobsResponse(question, relevantContent, pattern, context) {
    const response = {
      greeting: "Allan - great question...",
      main_content: '',
      supporting_facts: [],
      confidence_level: 0,
      fact_check_status: 'pending'
    };

    // Example response for current business leaders question
    if (pattern === 'storytelling_with_current_analysis') {
      response.main_content = await this.generateCurrentLeadersResponse(question, relevantContent);
    } else if (pattern === 'direct_strategic_advice') {
      response.main_content = await this.generateStrategyResponse(question, relevantContent);
    } else {
      response.main_content = await this.generateGeneralResponse(question, relevantContent, pattern);
    }

    // Add supporting facts from vector search
    response.supporting_facts = this.extractSupportingFacts(relevantContent);

    return response;
  }

  // Generate response for current business leaders
  async generateCurrentLeadersResponse(question, relevantContent) {
    // Find relevant stories about political/business relationships
    const politicalContent = relevantContent.interviews.filter(content => 
      content.text.toLowerCase().includes('clinton') ||
      content.text.toLowerCase().includes('government') ||
      content.text.toLowerCase().includes('political')
    );

    let response = "I faced a time in my relationship with Bill Clinton where I had to balance Apple's interests with political realities. ";
    
    if (politicalContent.length > 0) {
      response += `${politicalContent[0].text} `;
    }

    response += "The key is never compromising your core values for short-term political gain. ";
    response += "Zuckerberg and Bezos are playing a different game - they're optimizing for scale and market dominance. ";
    response += "But here's what they're missing: authenticity always wins in the long run. ";
    response += "Focus on building something so compelling that politics becomes irrelevant.";

    return response;
  }

  // Aggressive fact checking
  async aggressiveFactCheck(response) {
    console.log('🔍 Aggressively fact-checking Steve Jobs response...');
    
    const factChecks = [];
    
    // Check biographical facts
    const biographicalFacts = this.extractBiographicalClaims(response.main_content);
    for (const fact of biographicalFacts) {
      const factCheck = await this.factChecker.verify(fact, 'steve_jobs_biography');
      factChecks.push(factCheck);
    }

    // Check business relationship claims
    const relationshipClaims = this.extractRelationshipClaims(response.main_content);
    for (const claim of relationshipClaims) {
      const factCheck = await this.factChecker.verify(claim, 'documented_relationships');
      factChecks.push(factCheck);
    }

    // Check quote accuracy
    const quoteClaims = this.extractQuoteClaims(response.main_content);
    for (const quote of quoteClaims) {
      const factCheck = await this.factChecker.verify(quote, 'verified_quotes');
      factChecks.push(factCheck);
    }

    // Calculate overall confidence
    const overallConfidence = factChecks.length > 0 ? 
      factChecks.reduce((sum, check) => sum + check.confidence, 0) / factChecks.length : 0.5;

    // Apply "when in doubt, don't say it" rule
    if (overallConfidence < 0.8) {
      return {
        response: this.generateSaferResponse(response, factChecks),
        confidence: overallConfidence,
        fact_checks: factChecks,
        safety_applied: true,
        original_response: response.main_content
      };
    }

    return {
      response: response.main_content,
      confidence: overallConfidence,
      fact_checks: factChecks,
      safety_applied: false
    };
  }

  // Generate safer response when confidence is low
  generateSaferResponse(response, factChecks) {
    const lowConfidenceChecks = factChecks.filter(check => check.confidence < 0.8);
    
    let saferResponse = "Allan - that's a complex question that touches on areas where I want to be precise. ";
    
    // Use only high-confidence elements
    const highConfidenceContent = factChecks
      .filter(check => check.confidence >= 0.8)
      .map(check => check.verified_content)
      .join(' ');

    if (highConfidenceContent) {
      saferResponse += `What I can say with confidence is: ${highConfidenceContent} `;
    }

    saferResponse += "For the specifics about current political relationships, I'd rather not speculate. ";
    saferResponse += "But the principle remains: focus on building something so compelling that external politics becomes irrelevant.";

    return saferResponse;
  }

  // Extract claims for fact-checking
  extractBiographicalClaims(content) {
    // Extract claims about Steve's life, relationships, events
    const claims = [];
    
    // Look for relationship claims
    const relationshipMatches = content.match(/I (faced|had|met|worked with|knew) ([^.]+)/g);
    if (relationshipMatches) {
      claims.push(...relationshipMatches);
    }

    // Look for event claims
    const eventMatches = content.match(/when I (did|said|built|created) ([^.]+)/g);
    if (eventMatches) {
      claims.push(...eventMatches);
    }

    return claims;
  }

  extractRelationshipClaims(content) {
    // Extract claims about relationships with other people
    const relationshipPattern = /relationship with ([A-Z][a-z]+ [A-Z][a-z]+)/g;
    const matches = content.match(relationshipPattern) || [];
    return matches;
  }

  extractQuoteClaims(content) {
    // Extract potential quotes or paraphrases
    const quotePattern = /"([^"]+)"/g;
    const matches = content.match(quotePattern) || [];
    return matches;
  }

  // Generate @steve mention UI
  generateSteveMentionHTML() {
    return `
      <div class="tp-steve-mentor">
        <div class="tp-mentor-header">
          <span class="tp-mentor-avatar">🍎</span>
          <div class="tp-mentor-info">
            <span class="tp-mentor-name">Steve Jobs</span>
            <span class="tp-mentor-title">Visionary Mentor</span>
          </div>
          <div class="tp-mentor-status">
            <span class="tp-status-indicator tp-available">Available</span>
            <span class="tp-fact-check-badge">✅ Fact-Checked</span>
          </div>
        </div>

        <div class="tp-mentor-expertise">
          <div class="tp-expertise-tags">
            <span class="tp-expertise-tag">Product Design</span>
            <span class="tp-expertise-tag">Business Strategy</span>
            <span class="tp-expertise-tag">Leadership</span>
            <span class="tp-expertise-tag">Innovation</span>
            <span class="tp-expertise-tag">Marketing</span>
          </div>
        </div>

        <div class="tp-mentor-prompt">
          <div class="tp-prompt-examples">
            <h4>💭 Ask Steve About:</h4>
            <div class="tp-example-questions">
              <button onclick="askSteve('What do you think about how tech leaders are handling current politics?')" class="tp-example-btn">
                Current tech leadership
              </button>
              <button onclick="askSteve('How would you approach our product strategy?')" class="tp-example-btn">
                Product strategy advice
              </button>
              <button onclick="askSteve('What would you do about our revenue crisis?')" class="tp-example-btn">
                Business crisis guidance
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Process Steve Jobs knowledge population
  async populateJobsKnowledge() {
    console.log('📚 Populating Steve Jobs knowledge base...');
    
    const knowledgeSources = [
      {
        type: 'biography',
        source: 'Walter Isaacson Biography',
        priority: 'primary',
        content_type: 'comprehensive_life_story'
      },
      {
        type: 'interviews',
        source: 'All Things Digital Interviews',
        priority: 'high',
        content_type: 'direct_quotes_and_opinions'
      },
      {
        type: 'keynotes',
        source: 'Apple Keynote Transcripts',
        priority: 'high',
        content_type: 'product_philosophy_and_vision'
      },
      {
        type: 'internal_emails',
        source: 'Documented Apple Communications',
        priority: 'medium',
        content_type: 'leadership_style_and_decisions'
      },
      {
        type: 'business_strategies',
        source: 'Apple Strategic Documents',
        priority: 'high',
        content_type: 'business_philosophy_and_methods'
      }
    ];

    // Process each knowledge source
    for (const source of knowledgeSources) {
      await this.processKnowledgeSource(source);
    }

    // Create vector embeddings for all content
    await this.createJobsEmbeddings();

    console.log('✅ Steve Jobs knowledge base populated and vectorized');
  }

  // Process individual knowledge source
  async processKnowledgeSource(source) {
    console.log(`📖 Processing ${source.source}...`);
    
    // This would integrate with your data sources
    // For now, create mock structured data
    const mockContent = await this.generateMockJobsContent(source.type);
    
    // Store in knowledge base
    await this.storeJobsKnowledge(source, mockContent);
  }

  // Generate mock Jobs content (replace with real data ingestion)
  async generateMockJobsContent(type) {
    const mockContent = {
      'biography': [
        {
          topic: 'Bill Clinton relationship',
          content: 'Jobs met with President Clinton multiple times during the 1990s to discuss technology policy and education initiatives',
          confidence: 0.95,
          source: 'Walter Isaacson Biography, Chapter 32'
        },
        {
          topic: 'Political philosophy',
          content: 'Jobs believed technology should transcend politics and focus on human empowerment',
          confidence: 0.90,
          source: 'Multiple documented interviews'
        }
      ],
      'interviews': [
        {
          topic: 'Focus philosophy',
          content: 'People think focus means saying yes to the thing you\'ve got to focus on. But that\'s not what it means at all. It means saying no to the hundred other good ideas.',
          confidence: 1.0,
          source: 'Apple Worldwide Developers Conference 1997'
        }
      ],
      'business_strategies': [
        {
          topic: 'Simplicity principle',
          content: 'Simplicity is the ultimate sophistication. Remove everything unnecessary until only the essential remains.',
          confidence: 0.95,
          source: 'Apple Design Philosophy Documentation'
        }
      ]
    };

    return mockContent[type] || [];
  }

  // Aggressive fact checking
  async aggressiveFactCheck(response) {
    console.log('🔍 Aggressive fact-checking Steve Jobs response...');
    
    const claims = this.extractAllClaims(response.main_content);
    const factChecks = [];
    
    for (const claim of claims) {
      const factCheck = await this.verifyJobsClaim(claim);
      factChecks.push(factCheck);
      
      // If any claim fails strict verification, modify response
      if (factCheck.confidence < 0.8) {
        console.log(`⚠️ Low confidence claim detected: ${claim}`);
      }
    }

    // Calculate overall confidence
    const overallConfidence = factChecks.length > 0 ? 
      factChecks.reduce((sum, check) => sum + check.confidence, 0) / factChecks.length : 0.5;

    // Apply safety rules
    if (overallConfidence < 0.8) {
      return {
        response: this.generateSaferJobsResponse(response, factChecks),
        confidence: overallConfidence,
        fact_checks: factChecks,
        safety_note: 'Response modified for accuracy - when in doubt, don\'t say it'
      };
    }

    return {
      response: response.main_content,
      confidence: overallConfidence,
      fact_checks: factChecks,
      verified: true
    };
  }

  // Extract all claims from response
  extractAllClaims(content) {
    const claims = [];
    
    // Extract factual claims
    const factualPattern = /I (met|worked|built|created|said|did|faced) ([^.]+)/g;
    let match;
    while ((match = factualPattern.exec(content)) !== null) {
      claims.push(match[0]);
    }

    // Extract relationship claims
    const relationshipPattern = /my relationship with ([A-Z][a-z]+ [A-Z][a-z]+)/g;
    while ((match = relationshipPattern.exec(content)) !== null) {
      claims.push(match[0]);
    }

    return claims;
  }

  // Verify individual Jobs claim
  async verifyJobsClaim(claim) {
    // This would use your fact-checking system
    // For now, return mock verification
    return {
      claim: claim,
      confidence: Math.random() > 0.2 ? 0.9 : 0.6, // 80% high confidence
      sources: ['Walter Isaacson Biography'],
      verified: true
    };
  }

  // Store Jobs interaction
  async storeJobsInteraction(question, response, factCheckedResponse, userId) {
    await this.db.run(`
      INSERT INTO steve_jobs_interactions (
        user_id, question, response, fact_checked_response, 
        confidence, fact_checks, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      userId,
      question,
      JSON.stringify(response),
      factCheckedResponse.response,
      factCheckedResponse.confidence,
      JSON.stringify(factCheckedResponse.fact_checks || []),
      new Date().toISOString()
    ]);
  }

  // Store Jobs knowledge
  async storeJobsKnowledge(source, content) {
    for (const item of content) {
      await this.db.run(`
        INSERT INTO steve_jobs_knowledge (
          source_type, source_name, topic, content, confidence, 
          source_reference, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        source.type,
        source.source,
        item.topic,
        item.content,
        item.confidence,
        item.source,
        new Date().toISOString()
      ]);
    }
  }

  // Create embeddings for Jobs knowledge
  async createJobsEmbeddings() {
    console.log('🧠 Creating vector embeddings for Steve Jobs knowledge...');
    
    const knowledgeItems = await this.db.all(`
      SELECT * FROM steve_jobs_knowledge
    `);

    for (const item of knowledgeItems) {
      await this.vectorSearch.createEmbedding({
        id: `steve_jobs_${item.id}`,
        content: item.content,
        metadata: {
          topic: item.topic,
          source: item.source_name,
          confidence: item.confidence,
          type: item.source_type
        },
        collection: 'steve_jobs_knowledge'
      });
    }

    console.log(`✅ Created embeddings for ${knowledgeItems.length} Steve Jobs knowledge items`);
  }

  // Initialize database tables
  async initializeTables() {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS steve_jobs_knowledge (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_type TEXT NOT NULL,
        source_name TEXT NOT NULL,
        topic TEXT NOT NULL,
        content TEXT NOT NULL,
        confidence REAL NOT NULL,
        source_reference TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS steve_jobs_interactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        question TEXT NOT NULL,
        response TEXT NOT NULL,
        fact_checked_response TEXT NOT NULL,
        confidence REAL NOT NULL,
        fact_checks TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_steve_jobs_knowledge_topic ON steve_jobs_knowledge (topic, confidence DESC);
      CREATE INDEX IF NOT EXISTS idx_steve_jobs_interactions_user ON steve_jobs_interactions (user_id, timestamp DESC);
    `);
  }
}

module.exports = SteveJobsMentor;
