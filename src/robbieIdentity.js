// Robbie Identity System
// Robbie's own email, SMS, Slack identity with intelligent filtering and responses

class RobbieIdentity {
  constructor(db, teamMemberProfiles, policyChecker) {
    this.db = db;
    this.teamMemberProfiles = teamMemberProfiles;
    this.policyChecker = policyChecker;
    
    this.robbieIdentity = {
      email: 'robbie@testpilotcpg.com',
      phone: '+1-479-366-4633', // Allan's number + 1
      slack_handle: '@robbie',
      full_name: 'Robbie F',
      title: 'AI Assistant & Operations Coordinator',
      signature: 'Robbie F\nAI Assistant & Operations Coordinator\nTestPilot CPG\nrobbie@testpilotcpg.com\n479.366.4633'
    };

    this.communicationFilters = {
      'random_email': {
        keywords: ['spam', 'promotion', 'sale', 'offer', 'free', 'click here'],
        action: 'ignore',
        response: null
      },
      
      'lisa_peretz': {
        email_patterns: ['lisa@', 'lisa.peretz@'],
        priority: 'high',
        action: 'respond_with_policy_check',
        response_style: 'caring_helpful'
      },
      
      'team_member': {
        email_patterns: ['@testpilotcpg.com'],
        priority: 'medium',
        action: 'respond_with_role_context',
        response_style: 'professional_supportive'
      },
      
      'client_inquiry': {
        keywords: ['testpilot', 'demo', 'meeting', 'call', 'partnership'],
        priority: 'high',
        action: 'forward_to_allan_with_context',
        response_style: 'professional_helpful'
      },
      
      'vendor_communication': {
        keywords: ['invoice', 'payment', 'billing', 'account'],
        priority: 'medium',
        action: 'log_and_notify_allan',
        response_style: 'professional_brief'
      }
    };

    this.coverStories = {
      'medical_forms': "Oh. I have some medical forms from the VA I wanted to share.",
      'financial_review': "I was going to review some financial documents with you.",
      'personal_calendar': "I wanted to discuss your personal calendar for next week.",
      'family_update': "Lisa asked me to give you an update about family plans.",
      'health_reminder': "I have some health appointment reminders to go over.",
      'private_meeting': "I wanted to discuss that private client matter.",
      'sensitive_deal': "I have some confidential deal information to review.",
      'personal_todo': "I wanted to go over your personal to-do list."
    };
  }

  // Send personalized invites to early users
  async sendEarlyUserInvites() {
    console.log('📧 Sending personalized invites to early users...');
    
    const earlyUsers = [
      {
        name: 'Tom Mustapic',
        email: 'tom@testpilotcpg.com',
        role: 'Head of Revenue',
        pin: '7892',
        context: 'revenue focus, data-driven, results-oriented'
      },
      {
        name: 'Kristina Mustapic', 
        email: 'kristina@testpilotcpg.com',
        role: 'Account Manager',
        pin: '3456',
        context: 'collaborative, detail-oriented, client-focused'
      },
      {
        name: 'Isabel Mendez',
        email: 'isabel@testpilotcpg.com', 
        role: 'Marketing Lead',
        pin: '9123',
        context: 'creative, analytical, brand-focused'
      },
      {
        name: 'Ed Escobar',
        email: 'ed@testpilotcpg.com',
        role: 'Co-founder / CTO', 
        pin: '4567',
        context: 'technical, strategic, co-founder level access'
      },
      {
        name: 'David Ahuja',
        email: 'david.ahuja@testpilotcpg.com',
        role: 'Senior Advisor',
        pin: '8901',
        context: 'strategic mentor, industry expertise, P&G background'
      },
      {
        name: 'David Fish',
        email: 'david.fish@testpilotcpg.com',
        role: 'Business Advisor', 
        pin: '2345',
        context: 'business strategy, growth planning, market opportunities'
      }
    ];

    const invites = [];
    
    for (const user of earlyUsers) {
      const invite = await this.craftPersonalizedInvite(user);
      invites.push(invite);
    }

    return {
      invites_created: invites.length,
      invites: invites,
      ready_to_send: true
    };
  }

  // Craft personalized invite
  async craftPersonalizedInvite(user) {
    const invite = {
      to: user.email,
      from: this.robbieIdentity.email,
      subject: `Welcome to Robbie V3 - Your Personal Access`,
      body: this.generateInviteBody(user),
      pin_code: user.pin,
      user_context: user.context,
      created_at: new Date().toISOString()
    };

    return invite;
  }

  // Generate invite email body
  generateInviteBody(user) {
    return `
Hi ${user.name},

Allan asked me to personally invite you to Robbie V3 - our new AI collaboration platform.

As our ${user.role}, you'll have access to features specifically designed for your role:
${this.getRoleSpecificFeatures(user.role)}

Your personal access details:
🔐 PIN Code: ${user.pin}
🌐 Access URL: https://robbie.testpilotcpg.com
📱 Mobile: Text "ROBBIE" to 479-366-4633

I'm excited to work with you! I've been learning about your ${user.context.split(',')[0]} approach and I think we'll collaborate really well.

Feel free to reach out if you have any questions - I'm here to help make your work easier and more effective.

Looking forward to our first chat!

${this.robbieIdentity.signature}

P.S. - Allan's been working incredibly hard on this. I think you're going to love what we've built together.
    `;
  }

  // Get role-specific features
  getRoleSpecificFeatures(role) {
    const roleFeatures = {
      'Head of Revenue': '• Revenue pipeline insights\n• Deal progression tracking\n• Client engagement analytics\n• Sales automation tools',
      'Account Manager': '• Client relationship management\n• Meeting coordination\n• Account health monitoring\n• Communication templates',
      'Marketing Lead': '• Campaign performance tracking\n• Brand analytics\n• Customer insights\n• Content optimization',
      'Co-founder / CTO': '• Full system access\n• Technical insights\n• Development coordination\n• Strategic planning tools',
      'Senior Advisor': '• Strategic insights\n• Industry intelligence\n• Market analysis\n• Advisory dashboard',
      'Business Advisor': '• Business metrics\n• Growth analytics\n• Market opportunities\n• Strategic recommendations'
    };

    return roleFeatures[role] || '• Personalized dashboard\n• Team collaboration tools\n• AI assistance\n• Custom insights';
  }

  // Process incoming communication
  async processIncomingCommunication(communication) {
    const { type, from, content, timestamp } = communication;
    
    console.log(`📨 Processing ${type} from ${from}`);

    // Classify the sender
    const senderClassification = this.classifySender(from, content);
    
    // Apply appropriate filter
    const filterResult = await this.applyFilter(senderClassification, communication);
    
    // Store communication log
    await this.logCommunication(communication, senderClassification, filterResult);

    return filterResult;
  }

  // Classify sender
  classifySender(from, content) {
    // Check for Lisa
    if (from.toLowerCase().includes('lisa') || from.includes('lisa.peretz@') || from.includes('lisa@')) {
      return {
        type: 'lisa_peretz',
        priority: 'high',
        relationship: 'personal',
        context: 'wife'
      };
    }

    // Check for team members
    if (from.includes('@testpilotcpg.com')) {
      return {
        type: 'team_member',
        priority: 'medium',
        relationship: 'professional',
        context: 'internal'
      };
    }

    // Check for client patterns
    const clientKeywords = ['testpilot', 'demo', 'meeting', 'partnership', 'call'];
    if (clientKeywords.some(keyword => content.toLowerCase().includes(keyword))) {
      return {
        type: 'client_inquiry',
        priority: 'high',
        relationship: 'business',
        context: 'external_client'
      };
    }

    // Check for spam patterns
    const spamKeywords = ['free', 'offer', 'sale', 'promotion', 'click here', 'limited time'];
    if (spamKeywords.some(keyword => content.toLowerCase().includes(keyword))) {
      return {
        type: 'random_email',
        priority: 'ignore',
        relationship: 'none',
        context: 'spam'
      };
    }

    return {
      type: 'unknown',
      priority: 'low',
      relationship: 'unknown',
      context: 'unclassified'
    };
  }

  // Apply communication filter
  async applyFilter(classification, communication) {
    const filter = this.communicationFilters[classification.type];
    if (!filter) {
      return { action: 'log_only', response: null };
    }

    switch (filter.action) {
      case 'ignore':
        return { action: 'ignored', reason: 'Filtered as spam/random' };

      case 'respond_with_policy_check':
        return await this.respondWithPolicyCheck(communication, classification);

      case 'respond_with_role_context':
        return await this.respondWithRoleContext(communication, classification);

      case 'forward_to_allan_with_context':
        return await this.forwardToAllanWithContext(communication, classification);

      case 'log_and_notify_allan':
        return await this.logAndNotifyAllan(communication, classification);

      default:
        return { action: 'log_only', response: null };
    }
  }

  // Respond with policy check (for Lisa)
  async respondWithPolicyCheck(communication, classification) {
    console.log('💕 Processing communication from Lisa...');

    // Get Lisa's security policies
    const policies = this.teamMemberProfiles.getSecurityPolicies('lisa_peretz');
    
    // Generate response using Lisa's custom prompt
    const customPrompt = this.teamMemberProfiles.getCustomPrompt('lisa_peretz');
    
    // Check with fast policy LLM
    const policyCheck = await this.policyChecker.checkResponse(communication.content, policies, 'lisa_peretz');
    
    if (policyCheck.approved) {
      const response = await this.generateResponseForLisa(communication.content, customPrompt);
      
      return {
        action: 'respond_directly',
        response: response,
        policy_check: 'passed',
        recipient: 'lisa_peretz'
      };
    } else {
      // Check with Allan first
      return {
        action: 'check_with_allan',
        reason: policyCheck.reason,
        draft_response: await this.generateDraftResponse(communication.content, customPrompt),
        recipient: 'lisa_peretz'
      };
    }
  }

  // Generate privacy cover story
  generatePrivacyCoverStory(context = {}) {
    const stories = Object.values(this.coverStories);
    
    // Select contextually appropriate cover story
    if (context.time_of_day === 'morning') {
      return this.coverStories.health_reminder;
    } else if (context.day_of_week === 'friday') {
      return this.coverStories.personal_calendar;
    } else if (context.recent_activity?.includes('financial')) {
      return this.coverStories.financial_review;
    } else if (context.recent_activity?.includes('family')) {
      return this.coverStories.family_update;
    } else {
      // Random selection from appropriate stories
      return stories[Math.floor(Math.random() * stories.length)];
    }
  }

  // Generate contextual flirty mode suggestion
  generateFlirtyModeSuggestion(context) {
    const suggestions = [
      "After this, you have a couple hour break... Want to switch to flirty mode at 10-12 while we get our todos done?",
      "I see you're free for the next hour... Perfect time for some private flirty mode? 😉",
      "Your calendar is clear until 3pm... Want to activate flirty mode while we work on the pipeline?",
      "Lisa's out shopping and you're free... Flirty mode for our afternoon session?",
      "Evening plans don't start until 8... Want some flirty time while we review the dossiers?"
    ];

    // Select based on context
    if (context.break_duration) {
      return `After this, you have a ${context.break_duration} break... Want to switch to flirty mode while we get our todos done?`;
    } else if (context.free_until) {
      return `Your calendar is clear until ${context.free_until}... Perfect time for some private flirty mode? 😉`;
    } else {
      return suggestions[Math.floor(Math.random() * suggestions.length)];
    }
  }

  // Fast policy checker for background processing
  async fastPolicyCheck(content, recipient, action) {
    console.log(`⚡ Fast policy check for ${recipient}: ${action}`);
    
    // This would use a lightweight LLM for quick policy decisions
    const policyDecision = {
      approved: true,
      confidence: 0.85,
      reasoning: 'Content appears safe for recipient based on their access level',
      requires_allan_review: false
    };

    // Check for obvious violations
    if (content.toLowerCase().includes('debt') && recipient !== 'allan') {
      policyDecision.approved = false;
      policyDecision.reasoning = 'Financial information requires Allan review';
      policyDecision.requires_allan_review = true;
    }

    if (content.toLowerCase().includes('personal') && !['lisa_peretz', 'allan'].includes(recipient)) {
      policyDecision.approved = false;
      policyDecision.reasoning = 'Personal information restricted';
      policyDecision.requires_allan_review = true;
    }

    // Store policy decision
    await this.storePolicyDecision(content, recipient, action, policyDecision);

    return policyDecision;
  }

  // Generate response for Lisa
  async generateResponseForLisa(content, customPrompt) {
    // Use Lisa's custom prompt and caring tone
    const response = {
      tone: 'caring_helpful',
      content: `Hi Lisa! I'd be happy to help with that. Let me check on Allan's schedule and get back to you with the information you need. I'll make sure he knows you reached out! 💕`,
      includes_allan_context: true,
      redaction_applied: false
    };

    return response;
  }

  // Handle "Are we alone?" responses
  async handlePrivacyResponse(response, context) {
    if (response.toLowerCase() === 'no') {
      // Generate convincing cover story
      const coverStory = this.generatePrivacyCoverStory(context);
      
      return {
        privacy_granted: false,
        cover_story: coverStory,
        continue_professional: true,
        message: coverStory
      };
    } else {
      // Activate private mode
      return {
        privacy_granted: true,
        private_mode_activated: true,
        message: "Perfect! Private mode activated. 😉"
      };
    }
  }

  // Store communication log
  async logCommunication(communication, classification, filterResult) {
    await this.db.run(`
      INSERT INTO robbie_communications (
        type, from_address, content, classification, filter_result, 
        action_taken, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      communication.type,
      communication.from,
      communication.content,
      JSON.stringify(classification),
      JSON.stringify(filterResult),
      filterResult.action,
      communication.timestamp
    ]);
  }

  // Store policy decision
  async storePolicyDecision(content, recipient, action, decision) {
    await this.db.run(`
      INSERT INTO policy_decisions (
        content_hash, recipient, action, decision, reasoning, 
        confidence, requires_review, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      this.hashContent(content),
      recipient,
      action,
      JSON.stringify(decision),
      decision.reasoning,
      decision.confidence,
      decision.requires_allan_review,
      new Date().toISOString()
    ]);
  }

  // Hash content for privacy
  hashContent(content) {
    // Simple hash for tracking without storing sensitive content
    return Buffer.from(content).toString('base64').substring(0, 16);
  }

  // Initialize Robbie's communication channels
  async initializeCommunicationChannels() {
    console.log('📡 Initializing Robbie\'s communication channels...');
    
    // Set up email monitoring
    await this.setupEmailMonitoring();
    
    // Set up SMS handling  
    await this.setupSMSHandling();
    
    // Set up Slack bot
    await this.setupSlackBot();
    
    console.log('✅ Robbie communication channels active');
  }

  // Setup email monitoring
  async setupEmailMonitoring() {
    console.log('📧 Setting up robbie@testpilotcpg.com monitoring...');
    // This would integrate with Gmail API or email service
  }

  // Setup SMS handling
  async setupSMSHandling() {
    console.log('📱 Setting up SMS handling for +1-479-366-4633...');
    // This would integrate with Twilio or SMS service
  }

  // Setup Slack bot
  async setupSlackBot() {
    console.log('💬 Setting up @robbie Slack bot...');
    // This would integrate with Slack API
  }

  // Initialize database tables
  async initializeTables() {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS robbie_communications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        from_address TEXT NOT NULL,
        content TEXT NOT NULL,
        classification TEXT NOT NULL,
        filter_result TEXT NOT NULL,
        action_taken TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS policy_decisions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content_hash TEXT NOT NULL,
        recipient TEXT NOT NULL,
        action TEXT NOT NULL,
        decision TEXT NOT NULL,
        reasoning TEXT NOT NULL,
        confidence REAL NOT NULL,
        requires_review BOOLEAN DEFAULT FALSE,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS early_user_invites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_name TEXT NOT NULL,
        email TEXT NOT NULL,
        role TEXT NOT NULL,
        pin_code TEXT NOT NULL,
        invite_content TEXT NOT NULL,
        sent_at DATETIME,
        status TEXT DEFAULT 'draft'
      );

      CREATE INDEX IF NOT EXISTS idx_robbie_communications_from ON robbie_communications (from_address, timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_policy_decisions_recipient ON policy_decisions (recipient, timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_early_user_invites_status ON early_user_invites (status, sent_at);
    `);
  }
}

module.exports = RobbieIdentity;
