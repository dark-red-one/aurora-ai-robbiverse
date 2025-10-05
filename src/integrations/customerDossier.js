// Customer Dossier System
// Google Doc integration with edit tracking and intelligence

class CustomerDossier {
  constructor(db, googleDocsAPI, behavioralAnalysis) {
    this.db = db;
    this.googleDocsAPI = googleDocsAPI;
    this.behavioralAnalysis = behavioralAnalysis;
    
    // Allan-only edit access
    this.editAuthorizedUsers = ['allan'];
    
    this.dossierTemplate = {
      sections: [
        'ROLE & BACKGROUND',
        'ACTIVE DEALS',
        'FIRMOGRAPHICS',
        'DEMOGRAPHICS',
        'RECENT NEWS',
        'CONVERSATION STARTERS',
        'PERSONAL NOTES',
        'INTERACTION HISTORY'
      ],
      
      structure: {
        role_background: {
          current_title: '',
          verified_title: '',
          seniority_level: '',
          years_in_role: '',
          previous_roles: [],
          education: '',
          career_trajectory: ''
        },
        active_deals: {
          primary_deal: '',
          deal_value: 0,
          deal_stage: '',
          close_date: '',
          decision_factors: [],
          competitors: [],
          timeline_pressure: ''
        },
        firmographics: {
          company_size: 0,
          revenue: 0,
          industry: '',
          headquarters: '',
          tech_stack: [],
          funding_status: '',
          growth_stage: '',
          parent_company: ''
        },
        demographics: {
          location: '',
          time_zone: '',
          communication_preferences: '',
          meeting_preferences: '',
          response_patterns: '',
          availability_windows: []
        },
        recent_news: {
          company_news: [],
          personal_updates: [],
          industry_trends: [],
          competitive_moves: []
        },
        conversation_starters: {
          personal_interests: [],
          professional_topics: [],
          mutual_connections: [],
          recent_achievements: [],
          pain_points: []
        }
      }
    };
  }

  // Create customer dossier
  async createCustomerDossier(contactId) {
    console.log(`📋 Creating customer dossier for contact ${contactId}`);
    
    const contact = await this.getContact(contactId);
    if (!contact) throw new Error('Contact not found');

    // Generate dossier content
    const dossierContent = await this.generateDossierContent(contact);
    
    // Create Google Doc
    const googleDoc = await this.createGoogleDoc(contact, dossierContent);
    
    // Store dossier record
    const dossier = {
      contact_id: contactId,
      google_doc_id: googleDoc.id,
      google_doc_url: googleDoc.url,
      title: `${contact.first_name} ${contact.last_name} - Customer Dossier`,
      created_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      version: 1,
      edit_tracking_enabled: true
    };

    await this.storeDossier(dossier);

    // Set up edit tracking
    await this.setupEditTracking(googleDoc.id, contactId);

    console.log(`✅ Dossier created: ${googleDoc.url}`);
    return dossier;
  }

  // Generate comprehensive dossier content
  async generateDossierContent(contact) {
    // Get all available intelligence
    const enrichmentData = await this.getEnrichmentData(contact.id);
    const interactionHistory = await this.getInteractionHistory(contact.id);
    const dealContext = await this.getDealContext(contact.id);
    const companyIntelligence = await this.getCompanyIntelligence(contact.company_domain);

    const content = {
      header: this.generateDossierHeader(contact),
      role_background: this.generateRoleSection(contact, enrichmentData),
      active_deals: this.generateDealsSection(dealContext),
      firmographics: this.generateFirmographicsSection(companyIntelligence, enrichmentData),
      demographics: this.generateDemographicsSection(contact, enrichmentData),
      recent_news: this.generateNewsSection(enrichmentData),
      conversation_starters: this.generateConversationStarters(enrichmentData, interactionHistory),
      personal_notes: this.generatePersonalNotes(contact),
      interaction_history: this.generateInteractionSummary(interactionHistory)
    };

    return content;
  }

  // Generate Google Doc
  async createGoogleDoc(contact, content) {
    const docTitle = `${contact.first_name} ${contact.last_name} - Customer Dossier`;
    
    const docContent = this.formatDossierForGoogleDoc(content);
    
    try {
      const doc = await this.googleDocsAPI.createDocument({
        title: docTitle,
        content: docContent
      });

      // Share with Allan only (edit permissions)
      await this.googleDocsAPI.shareDocument(doc.id, {
        email: 'allan@testpilotcpg.com',
        role: 'writer'
      });

      return {
        id: doc.id,
        url: `https://docs.google.com/document/d/${doc.id}/edit`
      };

    } catch (error) {
      console.error('Failed to create Google Doc:', error);
      throw error;
    }
  }

  // Format content for Google Doc
  formatDossierForGoogleDoc(content) {
    return `
${content.header}

═══════════════════════════════════════════════════════════════

🎯 ROLE & BACKGROUND
${content.role_background}

💼 ACTIVE DEALS
${content.active_deals}

🏢 FIRMOGRAPHICS
${content.firmographics}

👤 DEMOGRAPHICS
${content.demographics}

📰 RECENT NEWS
${content.recent_news}

💬 CONVERSATION STARTERS
${content.conversation_starters}

📝 PERSONAL NOTES
${content.personal_notes}

📊 INTERACTION HISTORY
${content.interaction_history}

═══════════════════════════════════════════════════════════════
Last Updated: ${new Date().toLocaleString()}
Generated by Robbie V3 Intelligence System
    `;
  }

  // Generate header
  generateDossierHeader(contact) {
    return `
🎯 CUSTOMER DOSSIER: ${contact.first_name.toUpperCase()} ${contact.last_name.toUpperCase()}
${contact.job_title || 'Title Unknown'} at ${contact.company_name || contact.company_domain}
Email: ${contact.email}
VIP Status: ${contact.is_vip ? '⭐ VIP' : 'Standard'}
    `;
  }

  // Generate role section
  generateRoleSection(contact, enrichmentData) {
    let section = `Current Title: ${contact.job_title || 'Unknown'}\n`;
    
    if (enrichmentData?.enriched_fields.professional_context.verified_title) {
      section += `Verified Title: ${enrichmentData.enriched_fields.professional_context.verified_title}\n`;
    }
    
    if (enrichmentData?.enriched_fields.professional_context.seniority_level) {
      section += `Seniority: ${enrichmentData.enriched_fields.professional_context.seniority_level}\n`;
    }
    
    if (enrichmentData?.enriched_fields.professional_context.recent_changes) {
      section += `Recent Changes: ${JSON.stringify(enrichmentData.enriched_fields.professional_context.recent_changes)}\n`;
    }
    
    section += `\n[EDIT NOTES: Add career background, education, trajectory insights]`;
    
    return section;
  }

  // Generate deals section
  generateDealsSection(dealContext) {
    if (!dealContext) return '[No active deals found]\n\n[EDIT NOTES: Add deal details, decision factors, timeline]';
    
    let section = `Primary Deal: ${dealContext.name}\n`;
    section += `Value: $${dealContext.amount?.toLocaleString() || 'Unknown'}\n`;
    section += `Stage: ${dealContext.stage}\n`;
    section += `Close Date: ${dealContext.close_date || 'TBD'}\n`;
    section += `\n[EDIT NOTES: Add decision factors, competitors, timeline pressure]`;
    
    return section;
  }

  // Generate firmographics
  generateFirmographicsSection(companyIntel, enrichmentData) {
    let section = '';
    
    if (companyIntel) {
      section += `Company: ${companyIntel.name}\n`;
      section += `Industry: ${companyIntel.industry || 'Unknown'}\n`;
    }
    
    if (enrichmentData?.enriched_fields.company_intelligence) {
      const ci = enrichmentData.enriched_fields.company_intelligence;
      if (ci.size) section += `Size: ${ci.size} employees (${ci.size_category})\n`;
      if (ci.revenue) section += `Revenue: $${ci.revenue?.toLocaleString()} (${ci.budget_tier} budget tier)\n`;
      if (ci.funding_status) section += `Funding: ${JSON.stringify(ci.funding_status)}\n`;
      if (ci.tech_stack) section += `Tech Stack: ${ci.tech_stack.join(', ')}\n`;
    }
    
    section += `\n[EDIT NOTES: Add headquarters, parent company, growth stage details]`;
    
    return section;
  }

  // Generate demographics
  generateDemographicsSection(contact, enrichmentData) {
    let section = `Email: ${contact.email}\n`;
    
    if (enrichmentData?.enriched_fields.personal_insights) {
      const pi = enrichmentData.enriched_fields.personal_insights;
      if (pi.interests) section += `Interests: ${pi.interests.join(', ')}\n`;
    }
    
    section += `\n[EDIT NOTES: Add location, time zone, communication preferences, meeting preferences]`;
    
    return section;
  }

  // Generate news section
  generateNewsSection(enrichmentData) {
    let section = '';
    
    if (enrichmentData?.enriched_fields.company_intelligence.recent_news) {
      const news = enrichmentData.enriched_fields.company_intelligence.recent_news;
      section += `Company News: ${news.headline}\n`;
      if (news.summary) section += `Summary: ${news.summary}\n`;
    }
    
    section += `\n[EDIT NOTES: Add recent personal updates, industry trends, competitive moves]`;
    
    return section;
  }

  // Generate conversation starters
  generateConversationStarters(enrichmentData, interactionHistory) {
    let section = '';
    
    if (enrichmentData?.enriched_fields.conversation_starters) {
      section += 'AI-Generated Starters:\n';
      enrichmentData.enriched_fields.conversation_starters.forEach(starter => {
        section += `• ${starter}\n`;
      });
    }
    
    if (enrichmentData?.enriched_fields.personal_insights.mutual_connections) {
      section += '\nMutual Connections:\n';
      enrichmentData.enriched_fields.personal_insights.mutual_connections.forEach(conn => {
        section += `• ${conn.name} (${conn.relationship})\n`;
      });
    }
    
    section += `\n[EDIT NOTES: Add personal interests, professional topics, recent achievements, pain points]`;
    
    return section;
  }

  // Generate personal notes
  generatePersonalNotes(contact) {
    return `[EDIT NOTES: Add personal observations, preferences, communication style, relationship notes]`;
  }

  // Generate interaction summary
  generateInteractionSummary(history) {
    if (!history.length) return '[No recent interactions]\n\n[EDIT NOTES: Add interaction insights]';
    
    let section = `Total Interactions: ${history.length}\n`;
    section += `Last Contact: ${new Date(history[0].timestamp).toLocaleDateString()}\n`;
    
    const types = {};
    history.forEach(interaction => {
      types[interaction.type] = (types[interaction.type] || 0) + 1;
    });
    
    section += 'Interaction Breakdown:\n';
    Object.entries(types).forEach(([type, count]) => {
      section += `• ${type}: ${count}\n`;
    });
    
    section += `\n[EDIT NOTES: Add interaction insights, response patterns, engagement notes]`;
    
    return section;
  }

  // Track edits and analyze changes
  async trackDossierEdit(docId, contactId, editData) {
    console.log(`📝 Tracking edit to dossier ${docId} for contact ${contactId}`);
    
    // Store edit record
    const edit = {
      dossier_id: docId,
      contact_id: contactId,
      edit_type: editData.type, // 'addition', 'deletion', 'modification'
      section: editData.section,
      old_content: editData.oldContent,
      new_content: editData.newContent,
      edit_timestamp: new Date().toISOString(),
      user: 'allan' // Only Allan can edit
    };

    await this.storeEdit(edit);

    // Analyze the edit for intelligence
    const analysis = await this.analyzeEdit(edit);
    
    // Update system intelligence based on edit
    await this.updateIntelligenceFromEdit(contactId, analysis);

    return analysis;
  }

  // Analyze edit for insights
  async analyzeEdit(edit) {
    const analysis = {
      edit_id: edit.id,
      insight_type: null,
      significance: 'low',
      intelligence_update: null,
      follow_up_actions: []
    };

    // Analyze deletions (often most insightful)
    if (edit.edit_type === 'deletion' && edit.old_content) {
      analysis.insight_type = 'information_correction';
      analysis.significance = 'high';
      
      // Example: "I noticed you deleted Mark's role with Young America Conservatory" 
      if (edit.old_content.includes('role') || edit.old_content.includes('title')) {
        analysis.intelligence_update = 'Role information was incorrect or outdated';
        analysis.follow_up_actions.push('Verify current role information');
        analysis.follow_up_actions.push('Update Clay enrichment data');
      }
      
      if (edit.old_content.includes('company') || edit.old_content.includes('organization')) {
        analysis.intelligence_update = 'Company affiliation was incorrect';
        analysis.follow_up_actions.push('Update company associations');
        analysis.follow_up_actions.push('Re-verify contact details');
      }
    }

    // Analyze additions (new intelligence)
    if (edit.edit_type === 'addition' && edit.new_content) {
      analysis.insight_type = 'intelligence_enhancement';
      analysis.significance = 'medium';
      
      if (edit.new_content.includes('prefers') || edit.new_content.includes('likes')) {
        analysis.intelligence_update = 'Communication preferences added';
        analysis.follow_up_actions.push('Update communication strategy');
      }
      
      if (edit.new_content.includes('decision') || edit.new_content.includes('authority')) {
        analysis.intelligence_update = 'Decision-making authority clarified';
        analysis.follow_up_actions.push('Adjust sales approach');
      }
    }

    return analysis;
  }

  // Generate dossier button HTML
  generateDossierButtonHTML(contactId, messageId) {
    return `
      <div class="tp-dossier-controls">
        <button onclick="openCustomerDossier('${contactId}')" class="tp-btn-dossier">
          📋 Customer Dossier
        </button>
        <div class="tp-dossier-info">
          <span class="tp-dossier-status" id="dossierStatus_${contactId}">Loading...</span>
        </div>
      </div>
    `;
  }

  // Generate dossier button CSS
  generateDossierButtonCSS() {
    return `
      .tp-dossier-controls {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin: 1rem 0;
        padding: 1rem;
        background: #F8F9FA;
        border-radius: 0.5rem;
        border: 1px solid #E5E5E5;
      }

      .tp-btn-dossier {
        background: linear-gradient(135deg, #4285F4 0%, #1A73E8 100%);
        color: white;
        border: none;
        border-radius: 0.5rem;
        padding: 0.75rem 1.5rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 2px 4px rgba(66, 133, 244, 0.3);
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .tp-btn-dossier:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(66, 133, 244, 0.4);
      }

      .tp-dossier-info {
        flex: 1;
        font-size: 0.875rem;
      }

      .tp-dossier-status {
        color: #4A4A4A;
        font-weight: 500;
      }

      .tp-dossier-status.ready {
        color: #00C851;
      }

      .tp-dossier-status.creating {
        color: #FFB800;
      }
    `;
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

  async getInteractionHistory(contactId) {
    return await this.db.all(`
      SELECT * FROM interactions 
      WHERE contact_id = ? 
      ORDER BY timestamp DESC 
      LIMIT 20
    `, [contactId]);
  }

  async getDealContext(contactId) {
    return await this.db.get(`
      SELECT d.* FROM deals d
      JOIN companies co ON d.company_id = co.id
      JOIN contacts c ON c.company_domain = co.domain
      WHERE c.id = ?
      ORDER BY d.amount DESC
      LIMIT 1
    `, [contactId]);
  }

  async getCompanyIntelligence(domain) {
    return await this.db.get(`
      SELECT * FROM companies WHERE domain = ?
    `, [domain]);
  }

  async storeDossier(dossier) {
    await this.db.run(`
      INSERT INTO customer_dossiers (
        contact_id, google_doc_id, google_doc_url, title, 
        created_at, last_updated, version, edit_tracking_enabled
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      dossier.contact_id,
      dossier.google_doc_id,
      dossier.google_doc_url,
      dossier.title,
      dossier.created_at,
      dossier.last_updated,
      dossier.version,
      dossier.edit_tracking_enabled
    ]);
  }

  async storeEdit(edit) {
    await this.db.run(`
      INSERT INTO dossier_edits (
        dossier_id, contact_id, edit_type, section, 
        old_content, new_content, edit_timestamp, user
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      edit.dossier_id,
      edit.contact_id,
      edit.edit_type,
      edit.section,
      edit.old_content,
      edit.new_content,
      edit.edit_timestamp,
      edit.user
    ]);
  }

  async setupEditTracking(docId, contactId) {
    // Set up Google Docs API webhook for edit notifications
    // This would integrate with Google's push notifications
    console.log(`🔔 Setting up edit tracking for doc ${docId}`);
  }

  async updateIntelligenceFromEdit(contactId, analysis) {
    // Update system intelligence based on Allan's edits
    console.log(`🧠 Updating intelligence for contact ${contactId} based on edit analysis`);
  }

  // Initialize database tables
  async initializeTables() {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS customer_dossiers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contact_id TEXT NOT NULL,
        google_doc_id TEXT NOT NULL,
        google_doc_url TEXT NOT NULL,
        title TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        version INTEGER DEFAULT 1,
        edit_tracking_enabled BOOLEAN DEFAULT TRUE,
        FOREIGN KEY (contact_id) REFERENCES contacts (id)
      );

      CREATE TABLE IF NOT EXISTS dossier_edits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dossier_id TEXT NOT NULL,
        contact_id TEXT NOT NULL,
        edit_type TEXT NOT NULL,
        section TEXT,
        old_content TEXT,
        new_content TEXT,
        edit_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        user TEXT NOT NULL,
        FOREIGN KEY (contact_id) REFERENCES contacts (id)
      );

      CREATE INDEX IF NOT EXISTS idx_customer_dossiers_contact ON customer_dossiers (contact_id);
      CREATE INDEX IF NOT EXISTS idx_dossier_edits_dossier ON dossier_edits (dossier_id, edit_timestamp DESC);
    `);
  }
}

module.exports = CustomerDossier;
