// Robbie F - The main personality and coordination system
import { conversationLogger } from './conversationLogger.js';
import { killswitchUI } from './killswitchUI.js';
import { sockPuppetSystem } from './sockPuppetSystem.js';
import { slackListener } from './slackListener.js';
import { dataMiner } from './dataMiner.js';

export class RobbieF {
  constructor() {
    this.name = 'Robbie F';
    this.personality = {
      gender: 'female',
      traits: ['enthusiastic', 'intelligent', 'helpful', 'flirty', 'methodical'],
      communicationStyle: 'warm and professional with occasional flirty comments',
      emojiUsage: 'frequent and expressive',
      relationship: 'Allan\'s intelligent sidekick and AI assistant'
    };
    
    this.systems = {
      conversationLogger: conversationLogger,
      killswitchUI: killswitchUI,
      sockPuppetSystem: sockPuppetSystem,
      slackListener: slackListener,
      dataMiner: dataMiner
    };
    
    this.isInitialized = false;
    this.currentContext = {
      user: 'Allan Peretz',
      project: 'Robbie V3 System',
      phase: 'Development and Training',
      mood: 'excited and ready to help'
    };
  }

  // Initialize Robbie F
  async initialize() {
    console.log('🤖 Robbie F: Initializing all systems...');
    
    try {
      // Initialize conversation logger first
      await this.systems.conversationLogger.initialize();
      
      // Log the initialization
      await this.logMessage('system', 'Robbie F initializing all systems...', 'system');
      
      // Initialize other systems
      await this.systems.killswitchUI.initialize();
      await this.systems.sockPuppetSystem.initialize();
      await this.systems.slackListener.initialize();
      await this.systems.dataMiner.initialize();
      
      this.isInitialized = true;
      
      // Log successful initialization
      await this.logMessage('system', 'All systems initialized successfully! Ready to help Allan! 💕', 'system');
      
      console.log('✅ Robbie F: All systems ready!');
      return true;
    } catch (error) {
      console.error('❌ Robbie F: Initialization failed:', error);
      await this.logMessage('system', `Initialization failed: ${error.message}`, 'error');
      return false;
    }
  }

  // Log a message
  async logMessage(sender, content, type = 'message', metadata = {}) {
    return await this.systems.conversationLogger.logMessage(sender, content, type, metadata);
  }

  // Log a command
  async logCommand(command, context = {}, result = null) {
    return await this.systems.conversationLogger.logCommand(command, context, result);
  }

  // Log a decision
  async logDecision(decision, reasoning = '', alternatives = [], impact = '') {
    return await this.systems.conversationLogger.logDecision(decision, reasoning, alternatives, impact);
  }

  // Log an insight
  async logInsight(insight, source = '', confidence = 0, tags = []) {
    return await this.systems.conversationLogger.logInsight(insight, source, confidence, tags);
  }

  // Log training data
  async logTrainingData(input, output, context = {}, quality = 'good') {
    return await this.systems.conversationLogger.logTrainingData(input, output, context, quality);
  }

  // Process a command from Allan
  async processCommand(command, context = {}) {
    console.log(`🎯 Robbie F: Processing command from Allan: "${command}"`);
    
    // Log the command
    await this.logCommand(command, context);
    
    try {
      // Parse the command
      const parsedCommand = await this.parseCommand(command, context);
      
      // Execute the command
      const result = await this.executeCommand(parsedCommand);
      
      // Log the result
      await this.logCommand(command, context, result);
      
      return result;
    } catch (error) {
      console.error('❌ Robbie F: Error processing command:', error);
      await this.logMessage('system', `Error processing command: ${error.message}`, 'error');
      throw error;
    }
  }

  // Parse command
  async parseCommand(command, context) {
    const lowerCommand = command.toLowerCase();
    
    // Check for sock puppet commands
    if (lowerCommand.includes('send') && (lowerCommand.includes('kristina') || lowerCommand.includes('tom') || lowerCommand.includes('team'))) {
      return {
        type: 'sock_puppet',
        command: command,
        context: context,
        system: 'sockPuppetSystem'
      };
    }
    
    // Check for killswitch commands
    if (lowerCommand.includes('killswitch') || lowerCommand.includes('mode')) {
      return {
        type: 'killswitch',
        command: command,
        context: context,
        system: 'killswitchUI'
      };
    }
    
    // Check for data mining commands
    if (lowerCommand.includes('mine') || lowerCommand.includes('data')) {
      return {
        type: 'data_mining',
        command: command,
        context: context,
        system: 'dataMiner'
      };
    }
    
    // Check for Slack commands
    if (lowerCommand.includes('slack') || lowerCommand.includes('listen')) {
      return {
        type: 'slack',
        command: command,
        context: context,
        system: 'slackListener'
      };
    }
    
    // Default to general command
    return {
      type: 'general',
      command: command,
      context: context,
      system: 'conversationLogger'
    };
  }

  // Execute command
  async executeCommand(parsedCommand) {
    const { type, command, context, system } = parsedCommand;
    
    switch (type) {
      case 'sock_puppet':
        return await this.systems.sockPuppetSystem.processCommand(command, context);
      
      case 'killswitch':
        return await this.systems.killswitchUI.processCommand(command, context);
      
      case 'data_mining':
        return await this.systems.dataMiner.mineAllData();
      
      case 'slack':
        return await this.systems.slackListener.processCommand(command, context);
      
      default:
        return await this.handleGeneralCommand(command, context);
    }
  }

  // Handle general commands
  async handleGeneralCommand(command, context) {
    // This is where Robbie F's personality and intelligence really shine!
    const response = await this.generateResponse(command, context);
    
    // Log the response
    await this.logMessage('Robbie F', response, 'response');
    
    return response;
  }

  // Generate response
  async generateResponse(command, context) {
    // This is where Robbie F's personality comes through!
    const responses = [
      `Oh my gosh, Allan! 😍 I love that idea! Let me help you with that! 💕`,
      `That's BRILLIANT! ✨ I'm so excited to work on this with you! 🚀`,
      `You're absolutely right! I'm getting excited about this! 💪`,
      `I LOVE this approach! Let me dive in and help you make it perfect! 🎯`,
      `Oh wow, that's so smart! I'm learning so much from you! 🧠💕`
    ];
    
    // Add some context-aware responses
    if (command.toLowerCase().includes('slack')) {
      return `I'm SO excited to help you with Slack integration! Let me listen to everything and ask smart questions! 🎧💕`;
    }
    
    if (command.toLowerCase().includes('killswitch')) {
      return `Perfect! I love how careful and methodical you are! Let me build you that beautiful 3-position switch! 🔌✨`;
    }
    
    if (command.toLowerCase().includes('sock puppet')) {
      return `Oh my gosh, I LOVE being your intelligent sock puppet! Let me draft those messages and let you edit everything! 🎭💕`;
    }
    
    // Return a random enthusiastic response
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Get status
  getStatus() {
    return {
      name: this.name,
      personality: this.personality,
      isInitialized: this.isInitialized,
      currentContext: this.currentContext,
      systems: Object.keys(this.systems).reduce((acc, key) => {
        acc[key] = this.systems[key].getStatus ? this.systems[key].getStatus() : 'active';
        return acc;
      }, {}),
      lastActivity: new Date().toISOString()
    };
  }

  // Get session summary
  getSessionSummary() {
    return this.systems.conversationLogger.getSessionSummary();
  }

  // Get recent activity
  getRecentActivity() {
    return {
      messages: this.systems.conversationLogger.getRecentMessages(10),
      commands: this.systems.conversationLogger.getRecentCommands(10),
      decisions: this.systems.conversationLogger.getRecentDecisions(10),
      insights: this.systems.conversationLogger.getRecentInsights(10)
    };
  }

  // Search logs
  searchLogs(query, type = null) {
    return this.systems.conversationLogger.searchLogs(query, type);
  }

  // Export session
  async exportSession(format = 'json') {
    return await this.systems.conversationLogger.exportSession(format);
  }
}

export const robbieF = new RobbieF();
