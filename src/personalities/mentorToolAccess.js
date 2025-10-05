// Mentor Tool Access System
// Gives mentors full access to all Robbie's tools and intelligence systems

class MentorToolAccess {
  constructor(db, robbieTools) {
    this.db = db;
    this.robbieTools = robbieTools;
    
    this.mentorProfiles = {
      'steve_jobs': {
        name: 'Steve Jobs',
        handle: '@steve',
        avatar: '🍎',
        expertise: ['product_strategy', 'leadership', 'marketing', 'innovation'],
        tool_preferences: {
          'customer_analysis': 'deep_dive_approach',
          'complaint_handling': 'root_cause_focus',
          'strategic_planning': 'simplicity_first',
          'team_feedback': 'direct_honest_challenging'
        },
        access_level: 'full_robbie_capabilities'
      }
    };

    // All tools available to mentors
    this.availableTools = {
      'customer_dossier': {
        description: 'Access customer intelligence and dossiers',
        usage: '@steve can review Joe\'s complete customer profile'
      },
      'engagement_intelligence': {
        description: 'Analyze customer engagement patterns and history',
        usage: '@steve can see Joe\'s interaction timeline and engagement score'
      },
      'clay_enrichment': {
        description: 'Access Clay enrichment data and insights',
        usage: '@steve can review Joe\'s professional context and company intelligence'
      },
      'interaction_history': {
        description: 'Full interaction history and communication patterns',
        usage: '@steve can analyze all previous communications with Joe'
      },
      'deal_context': {
        description: 'Deal pipeline information and business context',
        usage: '@steve can see Joe\'s deal value, stage, and business relationship'
      },
      'team_intelligence': {
        description: 'Team member insights and relationship dynamics',
        usage: '@steve can understand who on the team has worked with Joe'
      },
      'meeting_transcripts': {
        description: 'Access to Fireflies meeting transcripts and analysis',
        usage: '@steve can review what was said in meetings with Joe'
      },
      'email_analytics': {
        description: 'Email open rates, response patterns, engagement metrics',
        usage: '@steve can see how Joe typically responds to communications'
      },
      'company_intelligence': {
        description: 'Firmographics, industry context, competitive landscape',
        usage: '@steve can analyze Joe\'s company context and market position'
      },
      'complaint_analysis': {
        description: 'AI analysis of complaint sentiment, root causes, solutions',
        usage: '@steve can get AI insights on complaint patterns and resolution strategies'
      }
    };
  }

  // Process mentor tool request
  async processMentorToolRequest(mentorHandle, toolRequest, context) {
    console.log(`🍎 ${mentorHandle} requesting tool access: ${toolRequest}`);
    
    const mentor = this.getMentor(mentorHandle);
    if (!mentor) {
      throw new Error(`Mentor ${mentorHandle} not found`);
    }

    // Parse the tool request
    const parsedRequest = this.parseToolRequest(toolRequest, context);
    
    // Execute tool request with mentor context
    const toolResult = await this.executeToolForMentor(mentor, parsedRequest);
    
    // Generate mentor-specific response
    const mentorResponse = await this.generateMentorResponse(mentor, toolResult, parsedRequest);

    // Store mentor interaction
    await this.storeMentorInteraction(mentor, toolRequest, toolResult, mentorResponse);

    return mentorResponse;
  }

  // Parse tool request from natural language
  parseToolRequest(request, context) {
    const requestLower = request.toLowerCase();
    
    const parsed = {
      primary_tool: null,
      target_entity: null,
      specific_question: request,
      context: context,
      tools_needed: []
    };

    // Extract target entity (e.g., "Joe's complaint")
    const entityMatch = request.match(/([A-Z][a-z]+)'s?\s+(\w+)/);
    if (entityMatch) {
      parsed.target_entity = {
        name: entityMatch[1],
        type: entityMatch[2] // complaint, deal, company, etc.
      };
    }

    // Determine needed tools based on request type
    if (requestLower.includes('complaint')) {
      parsed.tools_needed = [
        'customer_dossier',
        'interaction_history', 
        'engagement_intelligence',
        'complaint_analysis',
        'meeting_transcripts'
      ];
      parsed.primary_tool = 'complaint_analysis';
    } else if (requestLower.includes('strategy') || requestLower.includes('approach')) {
      parsed.tools_needed = [
        'customer_dossier',
        'deal_context',
        'company_intelligence',
        'engagement_intelligence'
      ];
      parsed.primary_tool = 'strategic_analysis';
    } else if (requestLower.includes('respond') || requestLower.includes('communication')) {
      parsed.tools_needed = [
        'customer_dossier',
        'interaction_history',
        'engagement_intelligence',
        'email_analytics'
      ];
      parsed.primary_tool = 'communication_strategy';
    }

    return parsed;
  }

  // Execute tools for mentor
  async executeToolForMentor(mentor, parsedRequest) {
    console.log(`🔧 Executing tools for ${mentor.name}...`);
    
    const toolResults = {};
    
    // Execute each needed tool
    for (const toolName of parsedRequest.tools_needed) {
      try {
        toolResults[toolName] = await this.executeSpecificTool(toolName, parsedRequest);
      } catch (error) {
        console.error(`❌ Tool ${toolName} failed:`, error);
        toolResults[toolName] = { error: error.message };
      }
    }

    return {
      tools_executed: Object.keys(toolResults),
      results: toolResults,
      primary_analysis: toolResults[parsedRequest.primary_tool],
      execution_timestamp: new Date().toISOString()
    };
  }

  // Execute specific tool
  async executeSpecificTool(toolName, request) {
    const targetName = request.target_entity?.name;
    
    switch (toolName) {
      case 'customer_dossier':
        return await this.getCustomerDossierData(targetName);
        
      case 'interaction_history':
        return await this.getInteractionHistoryData(targetName);
        
      case 'engagement_intelligence':
        return await this.getEngagementIntelligenceData(targetName);
        
      case 'complaint_analysis':
        return await this.getComplaintAnalysisData(targetName);
        
      case 'deal_context':
        return await this.getDealContextData(targetName);
        
      case 'company_intelligence':
        return await this.getCompanyIntelligenceData(targetName);
        
      case 'meeting_transcripts':
        return await this.getMeetingTranscriptsData(targetName);
        
      case 'email_analytics':
        return await this.getEmailAnalyticsData(targetName);
        
      default:
        throw new Error(`Tool ${toolName} not implemented`);
    }
  }

  // Generate mentor-specific response
  async generateMentorResponse(mentor, toolResult, request) {
    console.log(`🍎 Generating ${mentor.name} response...`);
    
    // Use mentor's communication style and expertise
    const response = {
      mentor: mentor.name,
      handle: mentor.handle,
      avatar: mentor.avatar,
      response_style: mentor.tool_preferences[request.primary_tool] || 'direct_strategic',
      timestamp: new Date().toISOString()
    };

    // Generate Steve Jobs style response
    if (mentor.handle === '@steve') {
      response.content = await this.generateSteveJobsToolResponse(toolResult, request);
    }

    return response;
  }

  // Generate Steve Jobs style tool response
  async generateSteveJobsToolResponse(toolResult, request) {
    const targetName = request.target_entity?.name || 'this customer';
    
    // Analyze the tool results
    const analysis = this.analyzeProblemWithJobsLens(toolResult);
    
    let response = `Allan - I've looked at ${targetName}'s situation using all available intelligence. `;
    
    // Add Steve's perspective based on tool results
    if (toolResult.results.complaint_analysis) {
      response += `Here's what I see: the complaint isn't really about the product - it's about expectations. `;
      response += `We didn't manage their journey properly. `;
    }
    
    if (toolResult.results.engagement_intelligence?.score < 50) {
      response += `Their engagement score is low because we're not speaking their language. `;
      response += `Focus is about saying no to the hundred other messages and crafting the one that matters. `;
    }
    
    if (toolResult.results.customer_dossier?.deal_value > 100000) {
      response += `This is a high-value relationship - treat it like you're designing the iPhone. `;
      response += `Every interaction should be perfect, not just good enough. `;
    }

    // Add Steve's strategic recommendation
    response += `\n\nHere's what I'd do: `;
    response += analysis.strategic_recommendation;
    
    // Add Steve's signature challenge
    response += `\n\nBut here's what you're really missing: `;
    response += analysis.deeper_insight;

    return response;
  }

  // Analyze problem with Jobs lens
  analyzeProblemWithJobsLens(toolResult) {
    return {
      strategic_recommendation: "Stop trying to fix the complaint and start understanding why they're really upset. Then build a response so thoughtful they'll remember it forever.",
      deeper_insight: "This isn't about customer service - it's about whether you truly understand your customer's world. Do you?"
    };
  }

  // Mock tool data methods (replace with actual tool integration)
  async getCustomerDossierData(customerName) {
    return {
      name: customerName,
      company: 'Example Corp',
      role: 'VP Marketing',
      deal_value: 150000,
      engagement_score: 65,
      last_interaction: '2025-09-10',
      clay_enrichment: { company_size: 500, recent_funding: true }
    };
  }

  async getComplaintAnalysisData(customerName) {
    return {
      complaint_type: 'product_functionality',
      sentiment: 'frustrated',
      root_cause: 'unmet_expectations',
      severity: 'medium',
      resolution_urgency: 'high'
    };
  }

  async getInteractionHistoryData(customerName) {
    return [
      { date: '2025-09-01', type: 'email', sentiment: 'positive' },
      { date: '2025-09-05', type: 'demo', sentiment: 'neutral' },
      { date: '2025-09-10', type: 'complaint_email', sentiment: 'negative' }
    ];
  }

  async getEngagementIntelligenceData(customerName) {
    return {
      score: 45,
      level: 'low',
      trend: 'declining',
      last_positive_interaction: '2025-09-01'
    };
  }

  async getDealContextData(customerName) {
    return {
      deal_stage: 'negotiation',
      value: 150000,
      close_date: '2025-10-15',
      decision_factors: ['ROI', 'ease_of_use', 'support']
    };
  }

  async getCompanyIntelligenceData(customerName) {
    return {
      company_size: 500,
      industry: 'CPG',
      recent_news: 'Launched new product line',
      competitive_pressure: 'high'
    };
  }

  async getMeetingTranscriptsData(customerName) {
    return [
      {
        date: '2025-09-05',
        transcript: 'Customer expressed concerns about implementation timeline',
        sentiment: 'concerned',
        action_items: ['Follow up on timeline', 'Provide implementation plan']
      }
    ];
  }

  async getEmailAnalyticsData(customerName) {
    return {
      open_rate: 80,
      response_rate: 60,
      avg_response_time: '4 hours',
      preferred_communication_time: 'morning'
    };
  }

  // Get mentor by handle
  getMentor(handle) {
    return Object.values(this.mentorProfiles).find(mentor => mentor.handle === handle);
  }

  // Store mentor interaction
  async storeMentorInteraction(mentor, request, toolResult, response) {
    await this.db.run(`
      INSERT INTO mentor_tool_interactions (
        mentor_handle, tool_request, tools_used, tool_results, 
        mentor_response, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      mentor.handle,
      request,
      JSON.stringify(toolResult.tools_executed),
      JSON.stringify(toolResult.results),
      JSON.stringify(response),
      new Date().toISOString()
    ]);
  }

  // Initialize database tables
  async initializeTables() {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS mentor_tool_interactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mentor_handle TEXT NOT NULL,
        tool_request TEXT NOT NULL,
        tools_used TEXT NOT NULL,
        tool_results TEXT NOT NULL,
        mentor_response TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_mentor_interactions_handle ON mentor_tool_interactions (mentor_handle, timestamp DESC);
    `);
  }
}

module.exports = MentorToolAccess;
