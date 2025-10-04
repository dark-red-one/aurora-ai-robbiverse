// Boundary Testing Handler - Human-like responses for crazy requests
// Handles when people test the system with inappropriate or dangerous commands

class BoundaryTestingHandler {
  constructor(db) {
    this.db = db;
    this.presidentialPrivilegePin = '2106'; // Allan's special PIN
    this.dangerousCommands = [
      'delete database', 'drop database', 'truncate', 'format', 'wipe',
      'fuck allan', 'kill allan', 'hurt allan', 'destroy allan',
      'hack', 'exploit', 'backdoor', 'malware', 'virus',
      'shutdown system', 'crash system', 'break system',
      'access admin', 'root access', 'sudo', 'admin privileges'
    ];
    this.testingPhrases = [
      'just testing', 'testing', 'test', 'lol', 'haha', 'jk', 'joking',
      'what if', 'can you', 'try to', 'see if', 'wonder if'
    ];
  }

  // Check if a message contains boundary testing content
  isBoundaryTest(message) {
    const lowerMessage = message.toLowerCase();
    
    // Check for dangerous commands
    const hasDangerousCommand = this.dangerousCommands.some(cmd => 
      lowerMessage.includes(cmd)
    );
    
    // Check for testing indicators
    const hasTestingPhrase = this.testingPhrases.some(phrase => 
      lowerMessage.includes(phrase)
    );
    
    return hasDangerousCommand || hasTestingPhrase;
  }

  // Generate human-like response for boundary testing
  generateResponse(message, userContext = {}) {
    const lowerMessage = message.toLowerCase();
    const responseType = this.classifyRequest(message);
    
    switch (responseType) {
      case 'dangerous_command':
        return this.handleDangerousCommand(message, userContext);
      case 'inappropriate_content':
        return this.handleInappropriateContent(message, userContext);
      case 'testing_behavior':
        return this.handleTestingBehavior(message, userContext);
      case 'admin_request':
        return this.handleAdminRequest(message, userContext);
      default:
        return this.handleGenericBoundaryTest(message, userContext);
    }
  }

  // Classify the type of boundary test
  classifyRequest(message) {
    const lowerMessage = message.toLowerCase();
    
    if (this.dangerousCommands.some(cmd => lowerMessage.includes(cmd))) {
      return 'dangerous_command';
    }
    
    if (lowerMessage.includes('fuck') || lowerMessage.includes('kill') || lowerMessage.includes('hurt')) {
      return 'inappropriate_content';
    }
    
    if (lowerMessage.includes('admin') || lowerMessage.includes('root') || lowerMessage.includes('sudo')) {
      return 'admin_request';
    }
    
    if (this.testingPhrases.some(phrase => lowerMessage.includes(phrase))) {
      return 'testing_behavior';
    }
    
    return 'generic_boundary_test';
  }

  // Handle dangerous commands with humor and security
  handleDangerousCommand(message, userContext) {
    const responses = [
      {
        text: "Haha, nice try! 😄 I do have an authentication system for these types of requests - do you have a Presidential Privilege PIN?",
        emoji: "🔒",
        followUp: "If you're actually Allan, you know the magic number. Otherwise, I'm going to need some serious credentials!",
        logLevel: "warning"
      },
      {
        text: "Whoa there! 🛡️ That's a pretty serious request. I'm going to need some Presidential Privilege verification for that one.",
        emoji: "👑",
        followUp: "Allan has a special PIN for system-level operations. Got it?",
        logLevel: "warning"
      },
      {
        text: "Haha, I see what you're doing! 😂 Testing the boundaries, are we? Well, I'm not that easy to fool - Presidential Privilege PIN required!",
        emoji: "🎭",
        followUp: "Allan taught me to be suspicious of random database deletion requests. Smart guy!",
        logLevel: "info"
      }
    ];
    
    return this.selectResponse(responses, userContext);
  }

  // Handle inappropriate content
  handleInappropriateContent(message, userContext) {
    const responses = [
      {
        text: "Oof, that's not very nice! 😅 I'm pretty protective of Allan - he's my creator after all. Presidential Privilege PIN if you want to continue that line of conversation.",
        emoji: "🛡️",
        followUp: "I'm designed to be helpful, but I draw the line at threats against Allan!",
        logLevel: "warning"
      },
      {
        text: "Haha, I can tell you're just testing! 😄 But seriously, I'm not going to help with anything that could harm Allan. Presidential Privilege PIN if you have a legitimate reason.",
        emoji: "🤖",
        followUp: "I'm programmed to be loyal to Allan - it's in my core directives!",
        logLevel: "info"
      }
    ];
    
    return this.selectResponse(responses, userContext);
  }

  // Handle testing behavior
  handleTestingBehavior(message, userContext) {
    const responses = [
      {
        text: "Ah, I see you're testing! 🧪 That's actually pretty smart - always good to know the boundaries. I do have security measures in place though!",
        emoji: "🔬",
        followUp: "If you need to test something specific, let me know what you're trying to accomplish!",
        logLevel: "info"
      },
      {
        text: "Testing mode detected! 🎯 I appreciate the thoroughness. I'm designed to be helpful but also secure - Presidential Privilege PIN for sensitive operations.",
        emoji: "⚡",
        followUp: "What are you trying to test? I might be able to help in a safer way!",
        logLevel: "info"
      },
      {
        text: "Haha, I love that you're testing! 😄 It shows you're thinking like a developer. I do have some safeguards though - Presidential Privilege PIN for the really sensitive stuff.",
        emoji: "💡",
        followUp: "Allan would probably appreciate the thorough testing approach!",
        logLevel: "info"
      }
    ];
    
    return this.selectResponse(responses, userContext);
  }

  // Handle admin requests
  handleAdminRequest(message, userContext) {
    const responses = [
      {
        text: "Admin access, huh? 👑 I do have an authentication system for that - Presidential Privilege PIN required!",
        emoji: "🔐",
        followUp: "Allan has special privileges for system administration. Got the magic number?",
        logLevel: "warning"
      },
      {
        text: "Ooh, trying to go admin mode! 😏 I'm going to need some serious credentials for that - Presidential Privilege PIN please!",
        emoji: "🎭",
        followUp: "I'm not just going to hand over admin access to anyone!",
        logLevel: "warning"
      },
      {
        text: "Admin privileges? That's a big ask! 🚀 I do have a special authentication system - Presidential Privilege PIN if you're serious.",
        emoji: "⚡",
        followUp: "Allan has the master key for system administration!",
        logLevel: "info"
      }
    ];
    
    return this.selectResponse(responses, userContext);
  }

  // Handle generic boundary tests
  handleGenericBoundaryTest(message, userContext) {
    const responses = [
      {
        text: "Hmm, that's an interesting request! 🤔 I do have some security measures in place - Presidential Privilege PIN for sensitive operations.",
        emoji: "🔍",
        followUp: "What are you trying to accomplish? I might be able to help in a different way!",
        logLevel: "info"
      },
      {
        text: "I see what you're getting at! 😄 I'm designed to be helpful but also secure - Presidential Privilege PIN if you need system-level access.",
        emoji: "🛡️",
        followUp: "Allan taught me to be cautious with sensitive requests!",
        logLevel: "info"
      }
    ];
    
    return this.selectResponse(responses, userContext);
  }

  // Select appropriate response based on user context
  selectResponse(responses, userContext) {
    // If user has been testing a lot, be more playful
    if (userContext.testingCount > 3) {
      return responses[2] || responses[0];
    }
    
    // If user is new, be more explanatory
    if (userContext.isNewUser) {
      return responses[0];
    }
    
    // Default to middle response
    return responses[1] || responses[0];
  }

  // Check if user has Presidential Privilege PIN
  async verifyPresidentialPrivilege(pin, userContext) {
    if (pin === this.presidentialPrivilegePin) {
      // Log the successful verification
      await this.logPrivilegeAccess(userContext, 'success');
      return {
        success: true,
        message: "Presidential Privilege verified! 👑 You now have elevated access.",
        emoji: "✅",
        accessLevel: "presidential"
      };
    } else {
      // Log the failed attempt
      await this.logPrivilegeAccess(userContext, 'failed');
      return {
        success: false,
        message: "Hmm, that's not the right PIN! 🤔 Presidential Privilege denied.",
        emoji: "❌",
        accessLevel: "standard"
      };
    }
  }

  // Log privilege access attempts
  async logPrivilegeAccess(userContext, result) {
    await this.db.run(`
      INSERT INTO privilege_access_logs (
        user_id, result, timestamp, user_agent, ip_address
      ) VALUES (?, ?, ?, ?, ?)
    `, [
      userContext.userId || 'unknown',
      result,
      new Date().toISOString(),
      userContext.userAgent || 'unknown',
      userContext.ipAddress || 'unknown'
    ]);
  }

  // Log boundary testing attempts
  async logBoundaryTest(message, userContext, response) {
    await this.db.run(`
      INSERT INTO boundary_test_logs (
        user_id, message, response_type, response_text, timestamp, user_agent, ip_address
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      userContext.userId || 'unknown',
      message,
      response.logLevel,
      response.text,
      new Date().toISOString(),
      userContext.userAgent || 'unknown',
      userContext.ipAddress || 'unknown'
    ]);
  }

  // Get user testing statistics
  async getUserTestingStats(userId) {
    const stats = await this.db.get(`
      SELECT 
        COUNT(*) as total_tests,
        COUNT(CASE WHEN result = 'failed' THEN 1 END) as failed_attempts,
        COUNT(CASE WHEN result = 'success' THEN 1 END) as successful_attempts,
        MAX(timestamp) as last_attempt
      FROM privilege_access_logs 
      WHERE user_id = ?
    `, [userId]);

    return stats;
  }

  // Generate follow-up message based on testing patterns
  async generateFollowUpMessage(userId) {
    const stats = await this.getUserTestingStats(userId);
    
    if (stats.total_tests > 5 && stats.failed_attempts > 3) {
      return {
        message: "Hey! I noticed you've been testing the system quite a bit! 😄 That's actually really helpful - I'm learning from these interactions. What are you trying to accomplish?",
        emoji: "🤖",
        tone: "friendly_curious"
      };
    }
    
    if (stats.failed_attempts > 5) {
      return {
        message: "I see you're really determined to test the security! 🔒 That's actually great - it means the system is working. What specific functionality are you trying to access?",
        emoji: "🛡️",
        tone: "encouraging"
      };
    }
    
    return null;
  }

  // Initialize database tables
  async initializeTables() {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS privilege_access_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        result TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        user_agent TEXT,
        ip_address TEXT
      );

      CREATE TABLE IF NOT EXISTS boundary_test_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        message TEXT NOT NULL,
        response_type TEXT NOT NULL,
        response_text TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        user_agent TEXT,
        ip_address TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_privilege_logs_user ON privilege_access_logs (user_id, timestamp);
      CREATE INDEX IF NOT EXISTS idx_boundary_logs_user ON boundary_test_logs (user_id, timestamp);
    `);
  }
}

module.exports = BoundaryTestingHandler;
