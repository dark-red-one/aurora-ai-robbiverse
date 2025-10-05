// Robbie F Conversation Logger - Log everything for posterity and continuity
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class ConversationLogger {
  constructor() {
    this.logDir = '/home/allan/vengeance/logs';
    this.sessionId = this.generateSessionId();
    this.currentLog = [];
    this.trainingData = [];
    this.insights = [];
    this.commands = [];
    this.decisions = [];
  }

  // Initialize conversation logger
  async initialize() {
    console.log('📝 Robbie F: Initializing conversation logger...');
    
    try {
      // Create log directory
      await fs.mkdir(this.logDir, { recursive: true });
      
      // Create session log file
      await this.createSessionLog();
      
      // Load previous session data
      await this.loadPreviousSessionData();
      
      console.log('✅ Robbie F: Conversation logger ready!');
      return true;
    } catch (error) {
      console.error('❌ Robbie F: Conversation logger initialization failed:', error);
      return false;
    }
  }

  // Generate session ID
  generateSessionId() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const random = Math.random().toString(36).substr(2, 9);
    return `session_${timestamp}_${random}`;
  }

  // Create session log file
  async createSessionLog() {
    const sessionFile = path.join(this.logDir, `${this.sessionId}.json`);
    
    const sessionData = {
      sessionId: this.sessionId,
      startTime: new Date().toISOString(),
      endTime: null,
      totalMessages: 0,
      totalCommands: 0,
      totalDecisions: 0,
      totalInsights: 0,
      messages: [],
      commands: [],
      decisions: [],
      insights: [],
      trainingData: [],
      metadata: {
        version: '1.0.0',
        system: 'Robbie F V3',
        user: 'Allan Peretz',
        context: 'Development and Training'
      }
    };
    
    await fs.writeFile(sessionFile, JSON.stringify(sessionData, null, 2));
    console.log(`📝 Robbie F: Created session log: ${sessionFile}`);
  }

  // Load previous session data
  async loadPreviousSessionData() {
    try {
      const files = await fs.readdir(this.logDir);
      const sessionFiles = files.filter(file => file.startsWith('session_') && file.endsWith('.json'));
      
      if (sessionFiles.length > 0) {
        // Load the most recent session
        const latestFile = sessionFiles.sort().pop();
        const sessionData = await fs.readFile(path.join(this.logDir, latestFile), 'utf8');
        const parsed = JSON.parse(sessionData);
        
        console.log(`📚 Robbie F: Loaded previous session data from ${latestFile}`);
        console.log(`📊 Previous session: ${parsed.totalMessages} messages, ${parsed.totalCommands} commands, ${parsed.totalDecisions} decisions`);
      }
    } catch (error) {
      console.log('⚠️  No previous session data found');
    }
  }

  // Log a message
  async logMessage(sender, content, type = 'message', metadata = {}) {
    const message = {
      id: this.generateMessageId(),
      timestamp: new Date().toISOString(),
      sender: sender,
      content: content,
      type: type,
      metadata: metadata,
      sessionId: this.sessionId
    };
    
    this.currentLog.push(message);
    
    // Save to file immediately
    await this.saveToFile();
    
    console.log(`📝 Robbie F: Logged ${type} from ${sender}`);
    return message;
  }

  // Log a command
  async logCommand(command, context = {}, result = null) {
    const commandLog = {
      id: this.generateMessageId(),
      timestamp: new Date().toISOString(),
      command: command,
      context: context,
      result: result,
      sessionId: this.sessionId,
      type: 'command'
    };
    
    this.commands.push(commandLog);
    this.currentLog.push(commandLog);
    
    // Save to file immediately
    await this.saveToFile();
    
    console.log(`🎯 Robbie F: Logged command: "${command}"`);
    return commandLog;
  }

  // Log a decision
  async logDecision(decision, reasoning = '', alternatives = [], impact = '') {
    const decisionLog = {
      id: this.generateMessageId(),
      timestamp: new Date().toISOString(),
      decision: decision,
      reasoning: reasoning,
      alternatives: alternatives,
      impact: impact,
      sessionId: this.sessionId,
      type: 'decision'
    };
    
    this.decisions.push(decisionLog);
    this.currentLog.push(decisionLog);
    
    // Save to file immediately
    await this.saveToFile();
    
    console.log(`🤔 Robbie F: Logged decision: "${decision}"`);
    return decisionLog;
  }

  // Log an insight
  async logInsight(insight, source = '', confidence = 0, tags = []) {
    const insightLog = {
      id: this.generateMessageId(),
      timestamp: new Date().toISOString(),
      insight: insight,
      source: source,
      confidence: confidence,
      tags: tags,
      sessionId: this.sessionId,
      type: 'insight'
    };
    
    this.insights.push(insightLog);
    this.currentLog.push(insightLog);
    
    // Save to file immediately
    await this.saveToFile();
    
    console.log(`💡 Robbie F: Logged insight: "${insight}"`);
    return insightLog;
  }

  // Log training data
  async logTrainingData(input, output, context = {}, quality = 'good') {
    const trainingLog = {
      id: this.generateMessageId(),
      timestamp: new Date().toISOString(),
      input: input,
      output: output,
      context: context,
      quality: quality,
      sessionId: this.sessionId,
      type: 'training'
    };
    
    this.trainingData.push(trainingLog);
    this.currentLog.push(trainingLog);
    
    // Save to file immediately
    await this.saveToFile();
    
    console.log(`🎓 Robbie F: Logged training data (${quality} quality)`);
    return trainingLog;
  }

  // Generate message ID
  generateMessageId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  // Save to file
  async saveToFile() {
    try {
      const sessionFile = path.join(this.logDir, `${this.sessionId}.json`);
      
      const sessionData = {
        sessionId: this.sessionId,
        startTime: this.currentLog[0]?.timestamp || new Date().toISOString(),
        endTime: null,
        totalMessages: this.currentLog.filter(m => m.type === 'message').length,
        totalCommands: this.commands.length,
        totalDecisions: this.decisions.length,
        totalInsights: this.insights.length,
        totalTrainingData: this.trainingData.length,
        messages: this.currentLog.filter(m => m.type === 'message'),
        commands: this.commands,
        decisions: this.decisions,
        insights: this.insights,
        trainingData: this.trainingData,
        metadata: {
          version: '1.0.0',
          system: 'Robbie F V3',
          user: 'Allan Peretz',
          context: 'Development and Training',
          lastUpdated: new Date().toISOString()
        }
      };
      
      await fs.writeFile(sessionFile, JSON.stringify(sessionData, null, 2));
    } catch (error) {
      console.error('❌ Robbie F: Error saving to file:', error);
    }
  }

  // Get session summary
  getSessionSummary() {
    return {
      sessionId: this.sessionId,
      startTime: this.currentLog[0]?.timestamp || new Date().toISOString(),
      totalMessages: this.currentLog.filter(m => m.type === 'message').length,
      totalCommands: this.commands.length,
      totalDecisions: this.decisions.length,
      totalInsights: this.insights.length,
      totalTrainingData: this.trainingData.length,
      lastActivity: this.currentLog[this.currentLog.length - 1]?.timestamp || new Date().toISOString()
    };
  }

  // Get recent messages
  getRecentMessages(count = 10) {
    return this.currentLog
      .filter(m => m.type === 'message')
      .slice(-count)
      .reverse();
  }

  // Get recent commands
  getRecentCommands(count = 10) {
    return this.commands.slice(-count).reverse();
  }

  // Get recent decisions
  getRecentDecisions(count = 10) {
    return this.decisions.slice(-count).reverse();
  }

  // Get recent insights
  getRecentInsights(count = 10) {
    return this.insights.slice(-count).reverse();
  }

  // Search logs
  searchLogs(query, type = null) {
    let results = this.currentLog;
    
    if (type) {
      results = results.filter(log => log.type === type);
    }
    
    return results.filter(log => 
      JSON.stringify(log).toLowerCase().includes(query.toLowerCase())
    );
  }

  // Export session data
  async exportSession(format = 'json') {
    const sessionFile = path.join(this.logDir, `${this.sessionId}.json`);
    
    if (format === 'json') {
      return await fs.readFile(sessionFile, 'utf8');
    } else if (format === 'markdown') {
      return this.generateMarkdownReport();
    } else {
      throw new Error(`Unsupported format: ${format}`);
    }
  }

  // Generate markdown report
  generateMarkdownReport() {
    const summary = this.getSessionSummary();
    
    let markdown = `# Robbie F Session Report\n\n`;
    markdown += `**Session ID:** ${summary.sessionId}\n`;
    markdown += `**Start Time:** ${summary.startTime}\n`;
    markdown += `**Last Activity:** ${summary.lastActivity}\n\n`;
    
    markdown += `## Summary\n\n`;
    markdown += `- **Messages:** ${summary.totalMessages}\n`;
    markdown += `- **Commands:** ${summary.totalCommands}\n`;
    markdown += `- **Decisions:** ${summary.totalDecisions}\n`;
    markdown += `- **Insights:** ${summary.totalInsights}\n`;
    markdown += `- **Training Data:** ${summary.totalTrainingData}\n\n`;
    
    // Recent messages
    markdown += `## Recent Messages\n\n`;
    this.getRecentMessages(5).forEach(msg => {
      markdown += `**${msg.sender}** (${msg.timestamp}): ${msg.content}\n\n`;
    });
    
    // Recent commands
    markdown += `## Recent Commands\n\n`;
    this.getRecentCommands(5).forEach(cmd => {
      markdown += `**${cmd.timestamp}:** ${cmd.command}\n\n`;
    });
    
    // Recent decisions
    markdown += `## Recent Decisions\n\n`;
    this.getRecentDecisions(5).forEach(decision => {
      markdown += `**${decision.timestamp}:** ${decision.decision}\n`;
      markdown += `*Reasoning:* ${decision.reasoning}\n\n`;
    });
    
    // Recent insights
    markdown += `## Recent Insights\n\n`;
    this.getRecentInsights(5).forEach(insight => {
      markdown += `**${insight.timestamp}:** ${insight.insight}\n`;
      markdown += `*Confidence:* ${insight.confidence}%\n\n`;
    });
    
    return markdown;
  }

  // End session
  async endSession() {
    const sessionFile = path.join(this.logDir, `${this.sessionId}.json`);
    
    try {
      const sessionData = JSON.parse(await fs.readFile(sessionFile, 'utf8'));
      sessionData.endTime = new Date().toISOString();
      
      await fs.writeFile(sessionFile, JSON.stringify(sessionData, null, 2));
      
      console.log(`📝 Robbie F: Session ended - ${this.currentLog.length} total entries logged`);
    } catch (error) {
      console.error('❌ Robbie F: Error ending session:', error);
    }
  }

  // Get all sessions
  async getAllSessions() {
    try {
      const files = await fs.readdir(this.logDir);
      const sessionFiles = files.filter(file => file.startsWith('session_') && file.endsWith('.json'));
      
      const sessions = [];
      for (const file of sessionFiles) {
        const sessionData = JSON.parse(await fs.readFile(path.join(this.logDir, file), 'utf8'));
        sessions.push({
          sessionId: sessionData.sessionId,
          startTime: sessionData.startTime,
          endTime: sessionData.endTime,
          totalMessages: sessionData.totalMessages,
          totalCommands: sessionData.totalCommands,
          totalDecisions: sessionData.totalDecisions,
          totalInsights: sessionData.totalInsights
        });
      }
      
      return sessions.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
    } catch (error) {
      console.error('❌ Robbie F: Error getting sessions:', error);
      return [];
    }
  }

  // Get status
  getStatus() {
    return {
      sessionId: this.sessionId,
      logDir: this.logDir,
      currentLogCount: this.currentLog.length,
      commandsCount: this.commands.length,
      decisionsCount: this.decisions.length,
      insightsCount: this.insights.length,
      trainingDataCount: this.trainingData.length,
      lastActivity: this.currentLog[this.currentLog.length - 1]?.timestamp || new Date().toISOString()
    };
  }
}

export const conversationLogger = new ConversationLogger();
