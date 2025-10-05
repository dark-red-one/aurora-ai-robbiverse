// Engagement Intelligence System
// Comprehensive contact intelligence with Clay enrichment and safeguards

class EngagementIntelligence {
  constructor(db, clayAPI, budgetManager) {
    this.db = db;
    this.clayAPI = clayAPI;
    this.budgetManager = budgetManager;
    
    // Allan-only feature - strict access control
    this.authorizedUsers = ['allan'];
    
    this.safeguards = {
      max_emails_per_contact_per_week: 1,
      max_emails_per_company_per_week: 2,
      min_days_between_emails: 3,
      max_daily_outreach: 5, // Allan's capacity
      engagement_decay_threshold: 0.3, // Below 30% engagement = pause
      overcommunication_detection: true
    };

    this.clayEnrichmentFields = [
      'job_title_verified',
      'company_size',
      'company_revenue',
      'linkedin_profile',
      'recent_job_changes',
      'company_news',
      'funding_rounds',
      'tech_stack',
      'social_media_activity',
      'professional_interests',
      'mutual_connections',
      'company_growth_signals'
    ];

    this.engagementScoring = {
      email_open: 10,
      email_click: 25,
      email_reply: 50,
      meeting_scheduled: 100,
      demo_attended: 150,
      proposal_requested: 200,
      contract_signed: 500
    };
  }

  // Initialize engagement intelligence (Allan-only)
  async initialize(userId) {
    if (!this.authorizedUsers.includes(userId)) {
      throw new Error('Engagement Intelligence is Allan-only feature');
    }

    console.log('🧠 Initializing Engagement Intelligence System...');
    
    await this.initializeTables();
    await this.loadEngagementHistory();
    await this.initializeSafeguards();
    
    console.log('✅ Engagement Intelligence ready');
  }

  // Enrich contact with Clay data
  async enrichContactWithClay(contactId) {
    console.log(`💎 Enriching contact ${contactId} with Clay data...`);
    
    const contact = await this.getContact(contactId);
    if (!contact) throw new Error('Contact not found');

    // Check budget before enrichment
    const canSpend = await this.budgetManager.canSpend('clay', 2); // $2 per enrichment
    if (!canSpend.canSpend) {
      throw new Error(`Clay enrichment blocked: ${canSpend.reason}`);
    }

    try {
      // Call Clay API for enrichment
      const clayData = await this.clayAPI.enrichContact({
        email: contact.email,
        company_domain: contact.company_domain,
        fields: this.clayEnrichmentFields
      });

      // Process and store enrichment data
      const enrichmentData = {
        contact_id: contactId,
        clay_data: clayData,
        enriched_fields: this.processClayData(clayData),
        enrichment_score: this.calculateEnrichmentScore(clayData),
        enriched_at: new Date().toISOString(),
        cost: 2
      };

      await this.storeEnrichmentData(enrichmentData);
      
      // Record spend
      await this.budgetManager.recordSpend('clay', 2, `Contact enrichment: ${contact.email}`);

      console.log(`✅ Contact enriched - Score: ${enrichmentData.enrichment_score}/100`);
      return enrichmentData;

    } catch (error) {
      console.error('❌ Clay enrichment failed:', error);
      throw error;
    }
  }

  // Process Clay data into actionable intelligence
  processClayData(clayData) {
    const processed = {
      professional_context: {},
      company_intelligence: {},
      personal_insights: {},
      engagement_opportunities: [],
      conversation_starters: []
    };

    // Professional context
    if (clayData.job_title_verified) {
      processed.professional_context.verified_title = clayData.job_title_verified;
      processed.professional_context.seniority_level = this.assessSeniorityLevel(clayData.job_title_verified);
    }

    if (clayData.recent_job_changes) {
      processed.professional_context.recent_changes = clayData.recent_job_changes;
      processed.engagement_opportunities.push('Recent job change - perfect timing for outreach');
    }

    // Company intelligence
    if (clayData.company_size) {
      processed.company_intelligence.size = clayData.company_size;
      processed.company_intelligence.size_category = this.categorizeCompanySize(clayData.company_size);
    }

    if (clayData.company_revenue) {
      processed.company_intelligence.revenue = clayData.company_revenue;
      processed.company_intelligence.budget_tier = this.assessBudgetTier(clayData.company_revenue);
    }

    if (clayData.funding_rounds) {
      processed.company_intelligence.funding_status = clayData.funding_rounds;
      processed.engagement_opportunities.push('Recent funding - growth mode opportunity');
    }

    if (clayData.company_news) {
      processed.company_intelligence.recent_news = clayData.company_news;
      processed.conversation_starters.push(`Saw the news about ${clayData.company_news.headline}`);
    }

    // Personal insights
    if (clayData.linkedin_profile) {
      processed.personal_insights.linkedin_activity = clayData.linkedin_profile.recent_posts;
      processed.personal_insights.interests = clayData.linkedin_profile.interests;
    }

    if (clayData.mutual_connections) {
      processed.personal_insights.mutual_connections = clayData.mutual_connections;
      processed.conversation_starters.push(`I see we both know ${clayData.mutual_connections[0]?.name}`);
    }

    if (clayData.professional_interests) {
      processed.personal_insights.interests = clayData.professional_interests;
      processed.conversation_starters.push(`Noticed your interest in ${clayData.professional_interests[0]}`);
    }

    // Tech stack insights
    if (clayData.tech_stack) {
      processed.company_intelligence.tech_stack = clayData.tech_stack;
      processed.engagement_opportunities.push('Tech stack alignment opportunity');
    }

    return processed;
  }

  // Calculate comprehensive engagement score
  async calculateEngagementScore(contactId) {
    const contact = await this.getContact(contactId);
    const engagementHistory = await this.getEngagementHistory(contactId);
    const enrichmentData = await this.getEnrichmentData(contactId);

    let score = 0;
    let totalInteractions = 0;

    // Score based on interaction history
    engagementHistory.forEach(interaction => {
      const points = this.engagementScoring[interaction.type] || 0;
      score += points;
      totalInteractions++;
    });

    // Decay score based on time since last interaction
    const daysSinceLastInteraction = this.getDaysSinceLastInteraction(engagementHistory);
    const decayFactor = Math.max(0.1, 1 - (daysSinceLastInteraction * 0.05)); // 5% decay per day
    score *= decayFactor;

    // Bonus for enrichment data quality
    if (enrichmentData) {
      score += enrichmentData.enrichment_score * 0.1; // 10% of enrichment score
    }

    // Normalize to 0-100 scale
    const normalizedScore = Math.min(Math.round(score / Math.max(totalInteractions, 1)), 100);

    return {
      score: normalizedScore,
      total_interactions: totalInteractions,
      days_since_last: daysSinceLastInteraction,
      decay_factor: decayFactor,
      engagement_level: this.categorizeEngagementLevel(normalizedScore)
    };
  }

  // Check safeguards before sending
  async checkSafeguards(contactId, messageType = 'email') {
    const safeguardChecks = {
      passed: true,
      violations: [],
      recommendations: []
    };

    const contact = await this.getContact(contactId);
    const recentOutreach = await this.getRecentOutreach(contactId);

    // Check email frequency per contact
    const emailsThisWeek = recentOutreach.filter(r => 
      r.type === 'email' && 
      this.isWithinDays(r.sent_at, 7)
    ).length;

    if (emailsThisWeek >= this.safeguards.max_emails_per_contact_per_week) {
      safeguardChecks.passed = false;
      safeguardChecks.violations.push({
        type: 'contact_frequency_exceeded',
        message: `Contact already received ${emailsThisWeek} emails this week (max: ${this.safeguards.max_emails_per_contact_per_week})`,
        severity: 'high'
      });
    }

    // Check company frequency
    const companyEmailsThisWeek = await this.getCompanyOutreachThisWeek(contact.company_domain);
    if (companyEmailsThisWeek >= this.safeguards.max_emails_per_company_per_week) {
      safeguardChecks.passed = false;
      safeguardChecks.violations.push({
        type: 'company_frequency_exceeded',
        message: `Company already received ${companyEmailsThisWeek} emails this week (max: ${this.safeguards.max_emails_per_company_per_week})`,
        severity: 'medium'
      });
    }

    // Check minimum days between emails
    const lastEmail = recentOutreach.find(r => r.type === 'email');
    if (lastEmail) {
      const daysSinceLastEmail = this.getDaysSince(lastEmail.sent_at);
      if (daysSinceLastEmail < this.safeguards.min_days_between_emails) {
        safeguardChecks.passed = false;
        safeguardChecks.violations.push({
          type: 'minimum_interval_violation',
          message: `Only ${daysSinceLastEmail} days since last email (minimum: ${this.safeguards.min_days_between_emails})`,
          severity: 'medium'
        });
      }
    }

    // Check daily outreach limit
    const todaysOutreach = await this.getTodaysOutreach();
    if (todaysOutreach >= this.safeguards.max_daily_outreach) {
      safeguardChecks.passed = false;
      safeguardChecks.violations.push({
        type: 'daily_limit_exceeded',
        message: `Already sent ${todaysOutreach} emails today (max: ${this.safeguards.max_daily_outreach})`,
        severity: 'high'
      });
    }

    // Check engagement decay
    const engagementScore = await this.calculateEngagementScore(contactId);
    if (engagementScore.score < this.safeguards.engagement_decay_threshold * 100) {
      safeguardChecks.violations.push({
        type: 'low_engagement_warning',
        message: `Low engagement score (${engagementScore.score}%) - consider different approach`,
        severity: 'low'
      });
      safeguardChecks.recommendations.push('Try a different message angle or channel');
    }

    // Overcommunication detection
    if (this.safeguards.overcommunication_detection) {
      const overcommunicationRisk = await this.assessOvercommunicationRisk(contactId);
      if (overcommunicationRisk.risk_level === 'high') {
        safeguardChecks.violations.push({
          type: 'overcommunication_risk',
          message: overcommunicationRisk.message,
          severity: 'medium'
        });
      }
    }

    return safeguardChecks;
  }

  // Assess overcommunication risk
  async assessOvercommunicationRisk(contactId) {
    const outreachHistory = await this.getRecentOutreach(contactId, 30); // Last 30 days
    const engagementHistory = await this.getEngagementHistory(contactId, 30);

    const outreachCount = outreachHistory.length;
    const engagementCount = engagementHistory.length;
    const responseRate = engagementCount > 0 ? engagementCount / outreachCount : 0;

    let riskLevel = 'low';
    let message = 'Normal communication pattern';

    if (outreachCount > 5 && responseRate < 0.1) {
      riskLevel = 'high';
      message = `High risk: ${outreachCount} messages sent with ${Math.round(responseRate * 100)}% response rate`;
    } else if (outreachCount > 3 && responseRate < 0.2) {
      riskLevel = 'medium';
      message = `Medium risk: ${outreachCount} messages with ${Math.round(responseRate * 100)}% response rate`;
    }

    return {
      risk_level: riskLevel,
      message: message,
      outreach_count: outreachCount,
      response_rate: responseRate
    };
  }

  // Generate engagement intelligence report
  async generateEngagementReport(contactId) {
    const contact = await this.getContact(contactId);
    const enrichmentData = await this.getEnrichmentData(contactId);
    const engagementScore = await this.calculateEngagementScore(contactId);
    const safeguardCheck = await this.checkSafeguards(contactId);

    const report = {
      contact: {
        name: `${contact.first_name} ${contact.last_name}`,
        company: contact.company_name,
        email: contact.email,
        title: contact.job_title
      },
      engagement_intelligence: {
        score: engagementScore.score,
        level: engagementScore.engagement_level,
        total_interactions: engagementScore.total_interactions,
        days_since_last: engagementScore.days_since_last
      },
      clay_enrichment: enrichmentData ? {
        enrichment_score: enrichmentData.enrichment_score,
        professional_context: enrichmentData.enriched_fields.professional_context,
        company_intelligence: enrichmentData.enriched_fields.company_intelligence,
        conversation_starters: enrichmentData.enriched_fields.conversation_starters,
        engagement_opportunities: enrichmentData.enriched_fields.engagement_opportunities
      } : null,
      safeguards: {
        can_contact: safeguardCheck.passed,
        violations: safeguardCheck.violations,
        recommendations: safeguardCheck.recommendations
      },
      recommended_approach: this.recommendApproach(engagementScore, enrichmentData, safeguardCheck)
    };

    return report;
  }

  // Recommend engagement approach
  recommendApproach(engagementScore, enrichmentData, safeguardCheck) {
    const recommendations = [];

    // Based on engagement level
    if (engagementScore.engagement_level === 'high') {
      recommendations.push('Direct approach - they\'re engaged');
    } else if (engagementScore.engagement_level === 'low') {
      recommendations.push('Soft re-engagement - provide value first');
    }

    // Based on enrichment data
    if (enrichmentData?.enriched_fields.engagement_opportunities.length > 0) {
      recommendations.push(`Opportunity: ${enrichmentData.enriched_fields.engagement_opportunities[0]}`);
    }

    if (enrichmentData?.enriched_fields.conversation_starters.length > 0) {
      recommendations.push(`Starter: ${enrichmentData.enriched_fields.conversation_starters[0]}`);
    }

    // Based on safeguards
    if (!safeguardCheck.passed) {
      recommendations.push('Wait - safeguard violations detected');
    }

    return recommendations;
  }

  // Helper methods
  assessSeniorityLevel(title) {
    const senior = ['director', 'vp', 'vice president', 'head', 'chief', 'ceo', 'cto', 'cmo'];
    const mid = ['manager', 'lead', 'principal', 'senior'];
    
    const titleLower = title.toLowerCase();
    
    if (senior.some(s => titleLower.includes(s))) return 'senior';
    if (mid.some(m => titleLower.includes(m))) return 'mid';
    return 'junior';
  }

  categorizeCompanySize(size) {
    if (size < 50) return 'startup';
    if (size < 500) return 'small';
    if (size < 5000) return 'medium';
    return 'enterprise';
  }

  assessBudgetTier(revenue) {
    if (revenue > 100000000) return 'high'; // $100M+
    if (revenue > 10000000) return 'medium'; // $10M+
    return 'low';
  }

  categorizeEngagementLevel(score) {
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  calculateEnrichmentScore(clayData) {
    let score = 0;
    
    // Score based on data completeness and quality
    if (clayData.job_title_verified) score += 15;
    if (clayData.company_size) score += 10;
    if (clayData.company_revenue) score += 15;
    if (clayData.linkedin_profile) score += 20;
    if (clayData.recent_job_changes) score += 10;
    if (clayData.company_news) score += 10;
    if (clayData.mutual_connections?.length > 0) score += 20;
    
    return Math.min(score, 100);
  }

  getDaysSinceLastInteraction(history) {
    if (!history.length) return 999;
    const lastInteraction = new Date(history[0].timestamp);
    return Math.floor((Date.now() - lastInteraction) / (1000 * 60 * 60 * 24));
  }

  getDaysSince(dateString) {
    const date = new Date(dateString);
    return Math.floor((Date.now() - date) / (1000 * 60 * 60 * 24));
  }

  isWithinDays(dateString, days) {
    return this.getDaysSince(dateString) <= days;
  }

  // Database methods
  async getContact(contactId) {
    return await this.db.get(`
      SELECT c.*, co.name as company_name 
      FROM contacts c 
      LEFT JOIN companies co ON c.company_domain = co.domain 
      WHERE c.id = ?
    `, [contactId]);
  }

  async getEngagementHistory(contactId, days = 90) {
    return await this.db.all(`
      SELECT * FROM interactions 
      WHERE contact_id = ? 
        AND timestamp >= datetime('now', '-${days} days')
      ORDER BY timestamp DESC
    `, [contactId]);
  }

  async getEnrichmentData(contactId) {
    const result = await this.db.get(`
      SELECT * FROM contact_enrichments 
      WHERE contact_id = ? 
      ORDER BY enriched_at DESC 
      LIMIT 1
    `, [contactId]);

    return result ? {
      ...result,
      enriched_fields: JSON.parse(result.enriched_fields)
    } : null;
  }

  async getRecentOutreach(contactId, days = 7) {
    return await this.db.all(`
      SELECT * FROM outreach_log 
      WHERE contact_id = ? 
        AND sent_at >= datetime('now', '-${days} days')
      ORDER BY sent_at DESC
    `, [contactId]);
  }

  async getCompanyOutreachThisWeek(domain) {
    const result = await this.db.get(`
      SELECT COUNT(*) as count FROM outreach_log ol
      JOIN contacts c ON ol.contact_id = c.id
      WHERE c.company_domain = ? 
        AND ol.sent_at >= datetime('now', '-7 days')
    `, [domain]);

    return result.count;
  }

  async getTodaysOutreach() {
    const result = await this.db.get(`
      SELECT COUNT(*) as count FROM outreach_log 
      WHERE DATE(sent_at) = DATE('now')
    `);

    return result.count;
  }

  async storeEnrichmentData(data) {
    await this.db.run(`
      INSERT INTO contact_enrichments (
        contact_id, clay_data, enriched_fields, enrichment_score, cost, enriched_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      data.contact_id,
      JSON.stringify(data.clay_data),
      JSON.stringify(data.enriched_fields),
      data.enrichment_score,
      data.cost,
      data.enriched_at
    ]);
  }

  async initializeTables() {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS contact_enrichments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contact_id TEXT NOT NULL,
        clay_data TEXT NOT NULL,
        enriched_fields TEXT NOT NULL,
        enrichment_score INTEGER NOT NULL,
        cost REAL NOT NULL,
        enriched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (contact_id) REFERENCES contacts (id)
      );

      CREATE TABLE IF NOT EXISTS outreach_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contact_id TEXT NOT NULL,
        type TEXT NOT NULL,
        content TEXT,
        sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (contact_id) REFERENCES contacts (id)
      );

      CREATE INDEX IF NOT EXISTS idx_contact_enrichments_contact ON contact_enrichments (contact_id, enriched_at DESC);
      CREATE INDEX IF NOT EXISTS idx_outreach_log_contact ON outreach_log (contact_id, sent_at DESC);
    `);
  }

  async loadEngagementHistory() {
    console.log('📊 Loading engagement history for analysis...');
  }

  async initializeSafeguards() {
    console.log('🛡️ Initializing communication safeguards...');
  }
}

module.exports = EngagementIntelligence;
