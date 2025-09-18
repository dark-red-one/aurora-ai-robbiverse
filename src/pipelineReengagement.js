// Pipeline Re-engagement System
// Proactive, bespoke outreach to important pipeline contacts

class PipelineReengagement {
  constructor(db, vipAssociation, approvalSystem, engagementIntelligence) {
    this.db = db;
    this.vipAssociation = vipAssociation;
    this.approvalSystem = approvalSystem;
    this.engagementIntelligence = engagementIntelligence;
    
    // Allan-only feature - strict access control
    this.authorizedUsers = ['allan'];
    
    this.reengagementContext = {
      current_situation: "October release prep for GroceryShop",
      heads_down_period: "5 days of intense development",
      coming_up_for_air: "Now reconnecting with pipeline",
      urgency_level: "high", // Revenue crisis context
      tone: "personal_professional"
    };

    this.messageTemplates = {
      'warm_reconnect': {
        subject_templates: [
          "Quick update on our October release",
          "Coming up for air - wanted to reconnect",
          "TestPilot update + your feedback",
          "October momentum + next steps"
        ],
        opening_hooks: [
          "Just coming up for air after 5 days heads-down on our October release",
          "We've been buried in development for GroceryShop, but wanted to reconnect",
          "Been in full sprint mode for our October launch - thought you'd want an update"
        ]
      },
      'progress_update': {
        subject_templates: [
          "TestPilot October release - ready for your review",
          "The update you've been waiting for",
          "October release preview + your thoughts?"
        ],
        progress_hooks: [
          "The October release is looking incredible - exactly what we discussed",
          "Remember that feature you mentioned? It's ready for your eyes",
          "We built something I think you'll love - want a preview?"
        ]
      },
      'groceryshop_angle': {
        subject_templates: [
          "GroceryShop timing + your TestPilot demo",
          "Perfect timing for GroceryShop",
          "October release meets GroceryShop - interested?"
        ],
        groceryshop_hooks: [
          "With GroceryShop coming up, this timing couldn't be better",
          "The October release is perfectly timed for GroceryShop conversations",
          "If you're going to GroceryShop, this demo will be perfect for your meetings"
        ]
      }
    };
  }

  // Initialize re-engagement system
  async initialize() {
    console.log('📧 Initializing Pipeline Re-engagement System...');
    
    await this.initializeTables();
    await this.loadPipelineContacts();
    await this.analyzePipelineHealth();
    
    console.log('✅ Pipeline Re-engagement System ready');
  }

  // Load and prioritize pipeline contacts
  async loadPipelineContacts() {
    // Get VIP contacts with deals in pipeline
    const pipelineContacts = await this.db.all(`
      SELECT 
        c.*,
        d.hubspot_id as deal_id,
        d.name as deal_name,
        d.amount as deal_value,
        d.stage as deal_stage,
        d.close_date,
        co.name as company_name,
        co.industry,
        MAX(i.timestamp) as last_interaction,
        COUNT(i.id) as interaction_count
      FROM contacts c
      JOIN companies co ON c.company_domain = co.domain
      LEFT JOIN deals d ON co.id = d.company_id
      LEFT JOIN interactions i ON c.id = i.contact_id
      WHERE c.is_vip = true 
        AND d.stage IN ('qualification', 'proposal', 'negotiation', 'decision')
        AND (i.timestamp IS NULL OR i.timestamp < datetime('now', '-7 days'))
      GROUP BY c.id
      ORDER BY 
        d.amount DESC,
        d.stage = 'negotiation' DESC,
        last_interaction ASC
    `);

    console.log(`📊 Found ${pipelineContacts.length} pipeline contacts for re-engagement`);
    
    // Enrich each contact with context
    for (const contact of pipelineContacts) {
      contact.reengagement_priority = this.calculateReengagementPriority(contact);
      contact.context_data = await this.gatherContactContext(contact);
      contact.message_angle = this.selectMessageAngle(contact);
    }

    return pipelineContacts.sort((a, b) => b.reengagement_priority - a.reengagement_priority);
  }

  // Calculate re-engagement priority
  calculateReengagementPriority(contact) {
    let priority = 0;
    
    // Deal value weight (higher = more priority)
    priority += Math.min(contact.deal_value / 10000, 10); // Max 10 points
    
    // Deal stage weight
    const stageWeights = {
      'negotiation': 8,
      'proposal': 6,
      'decision': 7,
      'qualification': 4
    };
    priority += stageWeights[contact.deal_stage] || 0;
    
    // Time since last interaction (longer = higher priority)
    const daysSinceContact = contact.last_interaction ? 
      Math.floor((Date.now() - new Date(contact.last_interaction)) / (1000 * 60 * 60 * 24)) : 30;
    priority += Math.min(daysSinceContact / 2, 15); // Max 15 points for 30+ days
    
    // Industry bonus
    const industryBonus = {
      'CPG': 3,
      'Food & Beverage': 3,
      'Retail': 2
    };
    priority += industryBonus[contact.industry] || 0;
    
    return Math.round(priority);
  }

  // Gather comprehensive contact context
  async gatherContactContext(contact) {
    const context = {
      contact_profile: {
        name: contact.first_name,
        company: contact.company_name,
        role: contact.job_title || 'Decision Maker',
        email: contact.email
      },
      deal_context: {
        deal_name: contact.deal_name,
        value: contact.deal_value,
        stage: contact.deal_stage,
        close_date: contact.close_date
      },
      interaction_history: await this.getRecentInteractions(contact.id),
      company_intelligence: await this.getCompanyIntelligence(contact.company_domain),
      personal_notes: await this.getPersonalNotes(contact.id),
      meeting_history: await this.getMeetingHistory(contact.id)
    };

    return context;
  }

  // Get recent interactions
  async getRecentInteractions(contactId) {
    return await this.db.all(`
      SELECT * FROM interactions 
      WHERE contact_id = ? 
      ORDER BY timestamp DESC 
      LIMIT 5
    `, [contactId]);
  }

  // Get company intelligence
  async getCompanyIntelligence(domain) {
    const intelligence = await this.db.get(`
      SELECT 
        co.*,
        COUNT(c.id) as total_contacts,
        SUM(d.amount) as total_pipeline_value,
        GROUP_CONCAT(d.name) as active_deals
      FROM companies co
      LEFT JOIN contacts c ON co.domain = c.company_domain
      LEFT JOIN deals d ON co.id = d.company_id
      WHERE co.domain = ?
      GROUP BY co.id
    `, [domain]);

    return intelligence;
  }

  // Select message angle based on context
  selectMessageAngle(contact) {
    // Determine best angle based on deal stage and context
    if (contact.deal_stage === 'negotiation') {
      return 'progress_update'; // Show momentum
    } else if (contact.company_name.toLowerCase().includes('grocery') || 
               contact.industry === 'Food & Beverage') {
      return 'groceryshop_angle'; // GroceryShop relevance
    } else {
      return 'warm_reconnect'; // General reconnection
    }
  }

  // Generate bespoke message with full intelligence
  async generateBespokeMessage(contact, userId = 'allan') {
    // Verify Allan-only access
    if (!this.authorizedUsers.includes(userId)) {
      throw new Error('Pipeline Re-engagement is Allan-only feature');
    }

    console.log(`✍️ Crafting bespoke message for ${contact.first_name} at ${contact.company_name}`);
    
    // Get comprehensive engagement intelligence
    const engagementReport = await this.engagementIntelligence.generateEngagementReport(contact.id);
    
    // Check safeguards before proceeding
    if (!engagementReport.safeguards.can_contact) {
      console.log(`⚠️ Safeguard violation for ${contact.first_name}: ${engagementReport.safeguards.violations[0]?.message}`);
      return {
        status: 'blocked',
        reason: 'safeguard_violation',
        violations: engagementReport.safeguards.violations,
        contact: contact
      };
    }

    // Enrich with Clay data if not already enriched
    let clayEnrichment = engagementReport.clay_enrichment;
    if (!clayEnrichment) {
      try {
        console.log(`💎 Enriching ${contact.first_name} with Clay data...`);
        clayEnrichment = await this.engagementIntelligence.enrichContactWithClay(contact.id);
      } catch (error) {
        console.log(`⚠️ Clay enrichment failed for ${contact.first_name}: ${error.message}`);
        clayEnrichment = null;
      }
    }
    
    const context = contact.context_data;
    const angle = contact.message_angle;
    const templates = this.messageTemplates[angle];

    // Generate subject line
    const subject = await this.craftSubjectLine(contact, templates.subject_templates);
    
    // Generate opening with Clay intelligence
    const opening = await this.craftIntelligentOpening(contact, templates, clayEnrichment);
    
    // Generate body with full context
    const body = await this.craftIntelligentMessageBody(contact, context, clayEnrichment, engagementReport);
    
    // Generate closing
    const closing = await this.craftClosing(contact);

    const bespokeMessage = {
      contact_id: contact.id,
      contact_name: contact.first_name,
      company_name: contact.company_name,
      deal_value: contact.deal_value,
      priority: contact.reengagement_priority,
      
      message: {
        to: contact.email,
        subject: subject,
        body: `${opening}\n\n${body}\n\n${closing}`,
        angle: angle,
        personalization_score: this.calculateAdvancedPersonalizationScore(contact, context, clayEnrichment, engagementReport)
      },
      
      intelligence_used: {
        engagement_score: engagementReport.engagement_intelligence.score,
        engagement_level: engagementReport.engagement_intelligence.level,
        clay_enrichment: clayEnrichment ? clayEnrichment.enrichment_score : 0,
        safeguards_passed: engagementReport.safeguards.can_contact,
        conversation_starters: clayEnrichment?.enriched_fields.conversation_starters || [],
        engagement_opportunities: clayEnrichment?.enriched_fields.engagement_opportunities || []
      },
      
      context_used: {
        deal_stage: contact.deal_stage,
        last_interaction: contact.last_interaction,
        company_intelligence: context.company_intelligence?.total_contacts || 0,
        meeting_history: context.meeting_history?.length || 0
      },
      
      created_at: new Date().toISOString(),
      status: 'draft' // Start in testing mode
    };

    // Store draft message
    await this.storeDraftMessage(bespokeMessage);

    return bespokeMessage;
  }

  // Craft personalized subject line
  async craftSubjectLine(contact, templates) {
    const baseSubject = templates[Math.floor(Math.random() * templates.length)];
    
    // Personalize based on context
    if (contact.deal_name && contact.deal_name !== 'Unknown Deal') {
      return `${baseSubject} - ${contact.deal_name}`;
    } else if (contact.company_name) {
      return `${baseSubject} - ${contact.company_name}`;
    } else {
      return baseSubject;
    }
  }

  // Craft intelligent opening with Clay data
  async craftIntelligentOpening(contact, templates, clayEnrichment) {
    const hooks = templates.opening_hooks || templates.progress_hooks || templates.groceryshop_hooks;
    let baseHook = hooks[Math.floor(Math.random() * hooks.length)];
    
    // Use Clay conversation starters if available
    if (clayEnrichment?.enriched_fields.conversation_starters.length > 0) {
      const clayStarter = clayEnrichment.enriched_fields.conversation_starters[0];
      baseHook = `${baseHook} (${clayStarter})`;
    }
    
    // Add personal touch based on Clay data
    let personalTouch = '';
    if (clayEnrichment?.enriched_fields.professional_context.recent_changes) {
      personalTouch = ` - congratulations on the recent role, by the way`;
    } else if (clayEnrichment?.enriched_fields.company_intelligence.funding_status) {
      personalTouch = ` - exciting news about the funding`;
    }
    
    return `Hi ${contact.first_name},\n\n${baseHook}${personalTouch} - wanted to reach out personally since we've been quiet on your ${contact.deal_name || 'project'}.`;
  }

  // Craft opening paragraph (legacy method for compatibility)
  async craftOpening(contact, templates) {
    return await this.craftIntelligentOpening(contact, templates, null);
  }

  // Craft intelligent message body with full context
  async craftIntelligentMessageBody(contact, context, clayEnrichment, engagementReport) {
    let body = '';

    // Use Clay engagement opportunities
    if (clayEnrichment?.enriched_fields.engagement_opportunities.length > 0) {
      const opportunity = clayEnrichment.enriched_fields.engagement_opportunities[0];
      body += `${opportunity} - perfect timing to reconnect. `;
    }

    // Context-specific content with Clay intelligence
    if (contact.deal_stage === 'negotiation') {
      body += `The features we discussed for ${contact.company_name} are now live in our October release. `;
      
      // Add Clay-informed specificity
      if (clayEnrichment?.enriched_fields.company_intelligence.tech_stack) {
        body += `Given your ${clayEnrichment.enriched_fields.company_intelligence.tech_stack[0]} environment, `;
      }
      
      body += `Specifically, the ${this.getRelevantFeature(contact)} functionality you mentioned is exactly what I'd love to show you.\n\n`;
    }

    // Company intelligence insights
    if (clayEnrichment?.enriched_fields.company_intelligence.recent_news) {
      const news = clayEnrichment.enriched_fields.company_intelligence.recent_news;
      body += `I saw the news about ${news.headline} - this actually makes our October release even more relevant for ${contact.company_name}. `;
    }

    // GroceryShop angle with company size context
    if (contact.message_angle === 'groceryshop_angle') {
      body += `With GroceryShop just around the corner, I know timing is everything`;
      
      if (clayEnrichment?.enriched_fields.company_intelligence.size_category === 'enterprise') {
        body += ` for enterprise brands like ${contact.company_name}`;
      }
      
      body += `. Our October release includes capabilities that could be perfect for your GroceryShop conversations.\n\n`;
    }

    // Engagement-informed personal touch
    if (engagementReport.engagement_intelligence.level === 'high') {
      body += `I know you've been engaged with our previous conversations, so I wanted to make sure you saw this update. `;
    } else if (engagementReport.engagement_intelligence.level === 'low') {
      body += `I want to make sure this lands on your radar since I know you're incredibly busy. `;
    }

    // Clay mutual connections
    if (clayEnrichment?.enriched_fields.personal_insights.mutual_connections?.length > 0) {
      const connection = clayEnrichment.enriched_fields.personal_insights.mutual_connections[0];
      body += `${connection.name} mentioned you might be interested in seeing this. `;
    }

    // Value proposition with company context
    body += `Would love to show you a 10-minute demo of what we've built - `;
    
    if (clayEnrichment?.enriched_fields.company_intelligence.budget_tier === 'high') {
      body += `I think you'll see immediate ROI potential for ${contact.company_name}'s ${contact.industry || 'business'}.`;
    } else {
      body += `I think you'll see immediate value for ${contact.company_name}'s ${contact.industry || 'business'}.`;
    }

    return body;
  }

  // Legacy method for compatibility
  async craftMessageBody(contact, context) {
    return await this.craftIntelligentMessageBody(contact, context, null, { engagement_intelligence: { level: 'medium' } });
  }

  // Craft closing
  async craftClosing(contact) {
    const closings = [
      `Worth a quick call this week to show you what we've built?\n\nBest,\nAllan`,
      `Available for a brief demo this week if you're interested.\n\nThanks,\nAllan`,
      `Let me know if you'd like to see this in action - happy to work around your schedule.\n\nBest regards,\nAllan`
    ];

    return closings[Math.floor(Math.random() * closings.length)];
  }

  // Generate re-engagement campaign
  async generateReengagementCampaign(limit = 10) {
    console.log('🚀 Generating Pipeline Re-engagement Campaign...');
    
    const pipelineContacts = await this.loadPipelineContacts();
    const topContacts = pipelineContacts.slice(0, limit);
    
    const campaign = {
      campaign_id: `reengagement_${Date.now()}`,
      created_at: new Date().toISOString(),
      context: this.reengagementContext,
      total_contacts: topContacts.length,
      total_pipeline_value: topContacts.reduce((sum, c) => sum + c.deal_value, 0),
      messages: []
    };

    // Generate bespoke message for each contact
    for (const contact of topContacts) {
      const bespokeMessage = await this.generateBespokeMessage(contact);
      campaign.messages.push(bespokeMessage);
    }

    // Store campaign
    await this.storeCampaign(campaign);

    console.log(`✅ Campaign generated: ${campaign.total_contacts} bespoke messages, $${campaign.total_pipeline_value.toLocaleString()} in pipeline value`);

    return campaign;
  }

  // Queue message for approval
  async queueForApproval(messageId) {
    const message = await this.getDraftMessage(messageId);
    if (!message) throw new Error('Message not found');

    // Send to approval system
    const approvalRequest = {
      type: 'outbound_email',
      content: message.message,
      recipient: message.message.to,
      context: message.context_used,
      priority: message.priority,
      created_at: new Date().toISOString()
    };

    await this.approvalSystem.submitForApproval(approvalRequest);

    // Update message status
    await this.updateMessageStatus(messageId, 'pending_approval');

    return approvalRequest;
  }

  // Helper methods
  getRelevantFeature(contact) {
    const features = [
      'behavioral testing',
      'shopper insights',
      'rapid validation',
      'consumer feedback',
      'market testing'
    ];
    return features[Math.floor(Math.random() * features.length)];
  }

  extractTopicFromInteraction(interaction) {
    const topics = [
      'faster market validation',
      'consumer behavior insights',
      'product testing efficiency',
      'shopper feedback quality'
    ];
    return topics[Math.floor(Math.random() * topics.length)];
  }

  // Advanced personalization scoring with intelligence
  calculateAdvancedPersonalizationScore(contact, context, clayEnrichment, engagementReport) {
    let score = 0;
    
    // Base context scoring
    if (context.interaction_history?.length > 0) score += 15;
    if (context.meeting_history?.length > 0) score += 20;
    if (context.personal_notes?.length > 0) score += 10;
    if (contact.deal_stage === 'negotiation') score += 15;
    if (context.company_intelligence?.total_contacts > 1) score += 5;
    if (contact.industry) score += 5;
    
    // Clay enrichment scoring
    if (clayEnrichment) {
      score += Math.min(clayEnrichment.enrichment_score * 0.3, 30); // Up to 30 points for Clay data
      
      if (clayEnrichment.enriched_fields.conversation_starters?.length > 0) score += 10;
      if (clayEnrichment.enriched_fields.engagement_opportunities?.length > 0) score += 10;
      if (clayEnrichment.enriched_fields.personal_insights.mutual_connections?.length > 0) score += 15;
      if (clayEnrichment.enriched_fields.company_intelligence.recent_news) score += 10;
      if (clayEnrichment.enriched_fields.professional_context.recent_changes) score += 10;
    }
    
    // Engagement intelligence scoring
    if (engagementReport) {
      score += Math.min(engagementReport.engagement_intelligence.score * 0.2, 20); // Up to 20 points for engagement
      
      if (engagementReport.engagement_intelligence.level === 'high') score += 10;
      if (engagementReport.safeguards.can_contact) score += 5;
    }
    
    return Math.min(score, 100);
  }

  // Legacy method for compatibility
  calculatePersonalizationScore(contact, context) {
    return this.calculateAdvancedPersonalizationScore(contact, context, null, null);
  }

  // Storage methods
  async storeDraftMessage(message) {
    await this.db.run(`
      INSERT INTO reengagement_messages (
        contact_id, message_data, priority, status, created_at
      ) VALUES (?, ?, ?, ?, ?)
    `, [
      message.contact_id,
      JSON.stringify(message),
      message.priority,
      message.status,
      message.created_at
    ]);
  }

  async storeCampaign(campaign) {
    await this.db.run(`
      INSERT INTO reengagement_campaigns (
        campaign_id, campaign_data, total_contacts, total_pipeline_value, created_at
      ) VALUES (?, ?, ?, ?, ?)
    `, [
      campaign.campaign_id,
      JSON.stringify(campaign),
      campaign.total_contacts,
      campaign.total_pipeline_value,
      campaign.created_at
    ]);
  }

  async getDraftMessage(messageId) {
    const result = await this.db.get(`
      SELECT * FROM reengagement_messages WHERE id = ?
    `, [messageId]);
    
    return result ? JSON.parse(result.message_data) : null;
  }

  async updateMessageStatus(messageId, status) {
    await this.db.run(`
      UPDATE reengagement_messages SET status = ? WHERE id = ?
    `, [status, messageId]);
  }

  // Initialize database tables
  async initializeTables() {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS reengagement_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contact_id TEXT NOT NULL,
        message_data TEXT NOT NULL,
        priority INTEGER NOT NULL,
        status TEXT DEFAULT 'draft',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        sent_at DATETIME,
        FOREIGN KEY (contact_id) REFERENCES contacts (id)
      );

      CREATE TABLE IF NOT EXISTS reengagement_campaigns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        campaign_id TEXT UNIQUE NOT NULL,
        campaign_data TEXT NOT NULL,
        total_contacts INTEGER NOT NULL,
        total_pipeline_value REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_reengagement_messages_contact ON reengagement_messages (contact_id, status);
      CREATE INDEX IF NOT EXISTS idx_reengagement_campaigns_created ON reengagement_campaigns (created_at DESC);
    `);
  }

  async getPersonalNotes(contactId) {
    // Mock implementation - would integrate with your notes system
    return [];
  }

  async getMeetingHistory(contactId) {
    return await this.db.all(`
      SELECT * FROM meetings m
      WHERE JSON_EXTRACT(m.participants, '$') LIKE '%' || (SELECT email FROM contacts WHERE id = ?) || '%'
      ORDER BY start_time DESC
      LIMIT 3
    `, [contactId]);
  }

  async analyzePipelineHealth() {
    // Analyze overall pipeline health for context
    console.log('📊 Analyzing pipeline health for re-engagement strategy...');
  }
}

module.exports = PipelineReengagement;
