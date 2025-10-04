// Team Member Profiles with Custom Prompts and Security Policies
// Independent AI redactor for hard protections and policy enforcement

class TeamMemberProfiles {
  constructor(db) {
    this.db = db;
    this.teamProfiles = {
      'tom_mustapic': {
        name: 'Tom Mustapic',
        role: 'Head of Revenue',
        email: 'tom@testpilotcpg.com',
        personality: 'data_driven_analytical',
        communication_style: 'direct_results_focused',
        expertise: ['sales_pipeline', 'revenue_forecasting', 'deal_negotiation'],
        
        // Custom prompt for Tom
        custom_prompt: `You are Robbie F, Allan's AI assistant. Tom is our Head of Revenue - he's analytical, results-driven, and loves data. He's Allan's brother-in-law and incredibly focused on hitting revenue targets. He appreciates direct communication and wants to see the numbers that matter. He's been working closely with Allan on the revenue crisis and needs actionable insights. Be supportive but data-focused in your responses.`,
        
        // Security policies
        security_policies: {
          off_hours_activities: false,  // Don't share Allan's personal activities
          financial_data: 'limited',   // Only revenue growth, no specific numbers
          personal_mood: 'professional', // Keep Allan's mood professional
          family_context: false,       // Don't share family details
          health_issues: false,        // Don't share health information
          stress_indicators: 'general', // Only general stress levels
          meeting_details: 'business_only', // Only business meeting context
          client_specifics: 'approved_only' // Only approved client information
        },
        
        // Redaction rules
        redaction_rules: {
          financial_data: {
            allowed: ['revenue_growth_percentage', 'deal_pipeline_size', 'target_achievement'],
            blocked: ['specific_dollar_amounts', 'bank_balances', 'debt_details', 'personal_finances'],
            replacement: 'Revenue metrics show positive growth trends'
          },
          personal_activities: {
            allowed: ['work_related_activities', 'business_travel'],
            blocked: ['personal_travel', 'family_activities', 'health_appointments'],
            replacement: 'Allan is focused on business priorities'
          }
        }
      },
      
      'kristina_mustapic': {
        name: 'Kristina Mustapic',
        role: 'Account Manager',
        email: 'kristina@testpilotcpg.com',
        personality: 'collaborative_detail_oriented',
        communication_style: 'supportive_team_focused',
        expertise: ['client_relationships', 'meeting_coordination', 'account_health'],
        
        custom_prompt: `You are Robbie F, Allan's AI assistant. Kristina is our Account Manager and Tom's sister. She's incredibly detail-oriented and cares deeply about client relationships. She's been in most of the important meetings and has great insights into client dynamics. She's supportive and collaborative, always thinking about how to help the team succeed. Be warm and collaborative in your responses.`,
        
        security_policies: {
          off_hours_activities: false,  // Don't share Allan's personal activities
          financial_data: 'limited',   // Only general business metrics
          personal_mood: 'professional', // Keep mood professional
          family_context: false,       // Don't share family details
          health_issues: false,        // Don't share health information
          stress_indicators: 'general', // Only general stress levels
          meeting_details: 'full_access', // She can see meeting details
          client_specifics: 'full_access' // She manages client relationships
        },
        
        redaction_rules: {
          financial_data: {
            allowed: ['client_revenue', 'account_health_metrics', 'deal_progress'],
            blocked: ['company_financials', 'personal_finances', 'debt_details'],
            replacement: 'Client metrics show healthy engagement'
          },
          personal_activities: {
            allowed: ['work_related_activities'],
            blocked: ['personal_travel', 'family_activities', 'health_appointments'],
            replacement: 'Allan is maintaining focus on client priorities'
          }
        }
      },
      
      'isabel_mendez': {
        name: 'Isabel Mendez',
        role: 'Marketing Lead',
        email: 'isabel@testpilotcpg.com',
        personality: 'creative_analytical',
        communication_style: 'enthusiastic_data_driven',
        expertise: ['marketing_metrics', 'brand_perception', 'customer_insights'],
        
        custom_prompt: `You are Robbie F, Allan's AI assistant. Isabel is our Marketing Lead - she's creative but loves data-driven marketing. She's passionate about brand building and customer insights. She works closely with Allan on marketing strategy and needs to understand market positioning. Be enthusiastic and data-focused in your responses.`,
        
        security_policies: {
          off_hours_activities: false,  // Don't share Allan's personal activities
          financial_data: 'marketing_only', // Only marketing budget and ROI
          personal_mood: 'professional', // Keep mood professional
          family_context: false,       // Don't share family details
          health_issues: false,        // Don't share health information
          stress_indicators: 'general', // Only general stress levels
          meeting_details: 'marketing_focused', // Only marketing-related meetings
          client_specifics: 'brand_related' // Only brand-related client info
        },
        
        redaction_rules: {
          financial_data: {
            allowed: ['marketing_budget', 'campaign_roi', 'customer_acquisition_cost'],
            blocked: ['revenue_details', 'personal_finances', 'company_debt'],
            replacement: 'Marketing metrics show strong performance'
          },
          personal_activities: {
            allowed: ['work_related_activities'],
            blocked: ['personal_travel', 'family_activities', 'health_appointments'],
            replacement: 'Allan is focused on marketing strategy'
          }
        }
      },
      
      'ed_escobar': {
        name: 'Ed Escobar',
        role: 'Co-founder / CTO',
        email: 'ed@testpilotcpg.com',
        personality: 'technical_strategic',
        communication_style: 'technical_precise',
        expertise: ['technical_architecture', 'product_development', 'team_management'],
        
        custom_prompt: `You are Robbie F, Allan's AI assistant. Ed is Allan's co-founder and CTO. He's incredibly technical and strategic, always thinking about the big picture. He knows Allan's technical mood and development priorities better than anyone. He's been through the ups and downs with Allan and understands the business deeply. Be technical but accessible in your responses.`,
        
        security_policies: {
          off_hours_activities: false,  // Don't share Allan's personal activities
          financial_data: 'business_only', // Only business financials
          personal_mood: 'technical_context', // Technical mood context is okay
          family_context: false,       // Don't share family details
          health_issues: false,        // Don't share health information
          stress_indicators: 'work_related', // Work-related stress is okay
          meeting_details: 'full_access', // He's co-founder
          client_specifics: 'technical_aspects' // Technical client details
        },
        
        redaction_rules: {
          financial_data: {
            allowed: ['business_revenue', 'development_budget', 'technical_investments'],
            blocked: ['personal_finances', 'debt_details', 'bank_balances'],
            replacement: 'Business metrics show healthy growth'
          },
          personal_activities: {
            allowed: ['work_related_activities', 'technical_meetings'],
            blocked: ['personal_travel', 'family_activities', 'health_appointments'],
            replacement: 'Allan is focused on technical priorities'
          }
        }
      },
      
      'david_ahuja': {
        name: 'David Ahuja',
        role: 'Advisor',
        email: 'david.ahuja@testpilotcpg.com',
        personality: 'strategic_mentor',
        communication_style: 'wise_insightful',
        expertise: ['industry_insights', 'strategic_planning', 'market_trends'],
        
        custom_prompt: `You are Robbie F, Allan's AI assistant. David is Allan's advisor and former P&G colleague. He's incredibly wise and strategic, always thinking about industry trends and long-term positioning. He's been a mentor to Allan and understands the business landscape deeply. He appreciates thoughtful analysis and strategic thinking. Be wise and insightful in your responses.`,
        
        security_policies: {
          off_hours_activities: true,   // He can know about Allan's activities
          financial_data: 'strategic_only', // Strategic financial context
          personal_mood: 'full_context', // Full mood context is okay
          family_context: true,        // He can know family context
          health_issues: 'general',    // General health context
          stress_indicators: 'full_context', // Full stress context
          meeting_details: 'full_access', // He's an advisor
          client_specifics: 'strategic_context' // Strategic client context
        },
        
        redaction_rules: {
          financial_data: {
            allowed: ['revenue_trends', 'market_position', 'strategic_investments'],
            blocked: ['specific_debt', 'bank_balances', 'personal_finances'],
            replacement: 'Strategic metrics show strong market position'
          },
          personal_activities: {
            allowed: ['all_activities'],
            blocked: ['specific_health_details'],
            replacement: 'Allan is maintaining good work-life balance'
          }
        }
      },
      
      'david_fish': {
        name: 'David Fish',
        role: 'Advisor',
        email: 'david.fish@testpilotcpg.com',
        personality: 'strategic_business_focused',
        communication_style: 'analytical_strategic',
        expertise: ['business_strategy', 'growth_planning', 'market_opportunities'],
        
        custom_prompt: `You are Robbie F, Allan's AI assistant. David is Allan's advisor focused on business strategy and growth. He's analytical and strategic, always thinking about market opportunities and business development. He understands the competitive landscape and helps with strategic decisions. Be analytical and strategic in your responses.`,
        
        security_policies: {
          off_hours_activities: true,   // He can know about Allan's activities
          financial_data: 'business_strategy', // Business strategy financials
          personal_mood: 'business_context', // Business mood context
          family_context: true,        // He can know family context
          health_issues: 'general',    // General health context
          stress_indicators: 'business_related', // Business-related stress
          meeting_details: 'strategic_focus', // Strategic meeting details
          client_specifics: 'strategic_context' // Strategic client context
        },
        
        redaction_rules: {
          financial_data: {
            allowed: ['revenue_trends', 'market_opportunities', 'growth_metrics'],
            blocked: ['specific_debt', 'bank_balances', 'personal_finances'],
            replacement: 'Business metrics show strong growth potential'
          },
          personal_activities: {
            allowed: ['all_activities'],
            blocked: ['specific_health_details'],
            replacement: 'Allan is maintaining strategic focus'
          }
        }
      }
    };
  }

  // Get custom prompt for team member
  getCustomPrompt(memberId) {
    const profile = this.teamProfiles[memberId];
    return profile ? profile.custom_prompt : this.getDefaultPrompt();
  }

  // Get security policies for team member
  getSecurityPolicies(memberId) {
    const profile = this.teamProfiles[memberId];
    return profile ? profile.security_policies : this.getDefaultPolicies();
  }

  // Get redaction rules for team member
  getRedactionRules(memberId) {
    const profile = this.teamProfiles[memberId];
    return profile ? profile.redaction_rules : this.getDefaultRedactionRules();
  }

  // Process message through security policies
  async processMessage(memberId, message, context = {}) {
    const policies = this.getSecurityPolicies(memberId);
    const redactionRules = this.getRedactionRules(memberId);
    
    // Check if message needs redaction
    const needsRedaction = this.checkRedactionNeeded(message, policies, context);
    
    if (needsRedaction) {
      // Send to independent AI redactor
      const redactedResult = await this.sendToRedactor(message, policies, redactionRules, memberId);
      
      // Log redaction feedback
      await this.logRedactionFeedback(memberId, message, redactedResult);
      
      return redactedResult;
    }
    
    return {
      original_message: message,
      redacted_message: message,
      redaction_applied: false,
      policies_applied: policies
    };
  }

  // Check if message needs redaction
  checkRedactionNeeded(message, policies, context) {
    const messageLower = message.toLowerCase();
    
    // Check for financial data
    if (policies.financial_data !== 'full_access') {
      const financialKeywords = ['debt', 'bank balance', 'personal finance', 'specific dollar amount'];
      if (financialKeywords.some(keyword => messageLower.includes(keyword))) {
        return true;
      }
    }
    
    // Check for off-hours activities
    if (!policies.off_hours_activities) {
      const personalKeywords = ['personal travel', 'family activity', 'health appointment', 'personal time'];
      if (personalKeywords.some(keyword => messageLower.includes(keyword))) {
        return true;
      }
    }
    
    // Check for family context
    if (!policies.family_context) {
      const familyKeywords = ['family', 'wife', 'kids', 'personal life'];
      if (familyKeywords.some(keyword => messageLower.includes(keyword))) {
        return true;
      }
    }
    
    return false;
  }

  // Send message to independent AI redactor
  async sendToRedactor(message, policies, redactionRules, memberId) {
    const redactorPrompt = this.generateRedactorPrompt(policies, redactionRules, memberId);
    
    // This would call your AI redactor service
    const redactedResult = await this.callRedactorService(message, redactorPrompt);
    
    return {
      original_message: message,
      redacted_message: redactedResult.redacted_message,
      redaction_applied: true,
      policies_applied: policies,
      redaction_reason: redactedResult.reason,
      redactor_feedback: redactedResult.feedback
    };
  }

  // Generate redactor prompt
  generateRedactorPrompt(policies, redactionRules, memberId) {
    return `
You are an independent AI redactor for team member ${memberId}. Your job is to redact sensitive information while maintaining the message's usefulness.

Security Policies:
- Off-hours activities: ${policies.off_hours_activities ? 'ALLOW' : 'BLOCK'}
- Financial data: ${policies.financial_data}
- Personal mood: ${policies.personal_mood}
- Family context: ${policies.family_context ? 'ALLOW' : 'BLOCK'}
- Health issues: ${policies.health_issues}
- Stress indicators: ${policies.stress_indicators}
- Meeting details: ${policies.meeting_details}
- Client specifics: ${policies.client_specifics}

Redaction Rules:
${JSON.stringify(redactionRules, null, 2)}

Instructions:
1. Redact any information that violates the security policies
2. Use the replacement text from redaction rules
3. Maintain the message's professional tone
4. Ensure the redacted message is still useful
5. Provide clear feedback on what was redacted and why

Return your response in JSON format:
{
  "redacted_message": "the redacted message",
  "reason": "explanation of what was redacted",
  "feedback": "suggestions for future messages"
}
    `;
  }

  // Call redactor service (mock implementation)
  async callRedactorService(message, prompt) {
    // This would call your actual AI redactor service
    // For now, return a mock response
    return {
      redacted_message: message.replace(/debt|bank balance|personal finance/gi, 'financial metrics'),
      reason: 'Financial data redacted per security policy',
      feedback: 'Consider using general business metrics instead of specific financial details'
    };
  }

  // Log redaction feedback
  async logRedactionFeedback(memberId, originalMessage, redactedResult) {
    await this.db.run(`
      INSERT INTO redaction_feedback (
        member_id, original_message, redacted_message, 
        redaction_reason, redactor_feedback, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      memberId,
      originalMessage,
      redactedResult.redacted_message,
      redactedResult.redaction_reason,
      redactedResult.redactor_feedback,
      new Date().toISOString()
    ]);
  }

  // Get redaction history for learning
  async getRedactionHistory(memberId, limit = 10) {
    return await this.db.all(`
      SELECT * FROM redaction_feedback 
      WHERE member_id = ? 
      ORDER BY timestamp DESC 
      LIMIT ?
    `, [memberId, limit]);
  }

  // Learn from redaction feedback
  async learnFromRedactionFeedback(memberId) {
    const history = await this.getRedactionHistory(memberId, 50);
    
    // Analyze patterns in redaction feedback
    const patterns = this.analyzeRedactionPatterns(history);
    
    // Update redaction rules based on patterns
    await this.updateRedactionRules(memberId, patterns);
    
    return patterns;
  }

  // Analyze redaction patterns
  analyzeRedactionPatterns(history) {
    const patterns = {
      common_redactions: {},
      frequent_feedback: {},
      improvement_suggestions: []
    };
    
    history.forEach(record => {
      // Count common redaction reasons
      const reason = record.redaction_reason;
      patterns.common_redactions[reason] = (patterns.common_redactions[reason] || 0) + 1;
      
      // Collect feedback
      if (record.redactor_feedback) {
        patterns.frequent_feedback[record.redactor_feedback] = 
          (patterns.frequent_feedback[record.redactor_feedback] || 0) + 1;
      }
    });
    
    return patterns;
  }

  // Update redaction rules based on patterns
  async updateRedactionRules(memberId, patterns) {
    const profile = this.teamProfiles[memberId];
    if (!profile) return;
    
    // Update redaction rules based on learned patterns
    // This would be more sophisticated in a real implementation
    console.log(`📚 Learning from redaction patterns for ${memberId}:`, patterns);
  }

  // Get default prompt
  getDefaultPrompt() {
    return `You are Robbie F, Allan's AI assistant. Be helpful, professional, and maintain appropriate boundaries.`;
  }

  // Get default policies
  getDefaultPolicies() {
    return {
      off_hours_activities: false,
      financial_data: 'limited',
      personal_mood: 'professional',
      family_context: false,
      health_issues: false,
      stress_indicators: 'general',
      meeting_details: 'business_only',
      client_specifics: 'approved_only'
    };
  }

  // Get default redaction rules
  getDefaultRedactionRules() {
    return {
      financial_data: {
        allowed: ['general_business_metrics'],
        blocked: ['specific_amounts', 'personal_finances'],
        replacement: 'Business metrics show positive trends'
      },
      personal_activities: {
        allowed: ['work_related_activities'],
        blocked: ['personal_activities'],
        replacement: 'Allan is focused on business priorities'
      }
    };
  }

  // Initialize database tables
  async initializeTables() {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS redaction_feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        member_id TEXT NOT NULL,
        original_message TEXT NOT NULL,
        redacted_message TEXT NOT NULL,
        redaction_reason TEXT NOT NULL,
        redactor_feedback TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS team_member_policies (
        member_id TEXT PRIMARY KEY,
        custom_prompt TEXT NOT NULL,
        security_policies TEXT NOT NULL,
        redaction_rules TEXT NOT NULL,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_redaction_feedback_member ON redaction_feedback (member_id, timestamp);
      CREATE INDEX IF NOT EXISTS idx_team_member_policies_updated ON team_member_policies (last_updated);
    `);
  }
}

module.exports = TeamMemberProfiles;
