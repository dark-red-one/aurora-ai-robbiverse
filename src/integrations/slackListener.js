// Robbie F Slack Listener - Monitor all Slack activity and ask clarifying questions
import { WebClient } from '@slack/web-api';
import { App } from '@slack/bolt';
import fs from 'fs/promises';
import path from 'path';

export class SlackListener {
  constructor() {
    this.client = null;
    this.app = null;
    this.isListening = false;
    this.channels = new Map();
    this.teamMembers = new Map();
    this.conversationContext = new Map();
    this.questionQueue = [];
    this.insights = [];
  }

  // Initialize Slack listener
  async initialize() {
    console.log('🤖 Robbie F: Initializing Slack listener...');
    
    try {
      // Load Slack credentials
      const credentials = await this.loadSlackCredentials();
      
      if (!credentials) {
        console.log('⚠️  Slack credentials not found - skipping Slack integration');
        return false;
      }

      // Initialize Slack client
      this.client = new WebClient(credentials.botToken);
      
      // Initialize Slack app for real-time events
      this.app = new App({
        token: credentials.botToken,
        signingSecret: credentials.signingSecret,
        socketMode: true,
        appToken: credentials.appToken
      });

      // Set up event listeners
      await this.setupEventListeners();
      
      // Get team information
      await this.loadTeamInfo();
      
      // Start listening
      await this.startListening();
      
      console.log('✅ Robbie F: Slack listener initialized successfully!');
      return true;
    } catch (error) {
      console.error('❌ Robbie F: Slack listener initialization failed:', error);
      return false;
    }
  }

  // Load Slack credentials
  async loadSlackCredentials() {
    try {
      const credentialsPath = '/home/allan/vengeance/data/slack_credentials.json';
      const credentials = await fs.readFile(credentialsPath, 'utf8');
      return JSON.parse(credentials);
    } catch (error) {
      console.log('⚠️  Slack credentials file not found');
      return null;
    }
  }

  // Set up event listeners
  async setupEventListeners() {
    // Listen to all messages
    this.app.message(async ({ message, client, say }) => {
      await this.handleMessage(message, client, say);
    });

    // Listen to channel events
    this.app.event('channel_created', async ({ event, client }) => {
      await this.handleChannelCreated(event, client);
    });

    // Listen to member events
    this.app.event('team_join', async ({ event, client }) => {
      await this.handleTeamJoin(event, client);
    });

    // Listen to reactions
    this.app.event('reaction_added', async ({ event, client }) => {
      await this.handleReactionAdded(event, client);
    });

    // Listen to file shares
    this.app.event('file_shared', async ({ event, client }) => {
      await this.handleFileShared(event, client);
    });
  }

  // Handle incoming messages
  async handleMessage(message, client, say) {
    try {
      // Skip bot messages and messages from Robbie F
      if (message.bot_id || message.user === 'U_ROBBIE_F') {
        return;
      }

      // Get channel info
      const channel = await this.getChannelInfo(message.channel);
      
      // Get user info
      const user = await this.getUserInfo(message.user);
      
      // Create message context
      const messageContext = {
        id: message.ts,
        channel: channel,
        user: user,
        text: message.text,
        timestamp: new Date(parseFloat(message.ts) * 1000).toISOString(),
        thread_ts: message.thread_ts,
        reactions: message.reactions || [],
        files: message.files || []
      };

      // Store in conversation context
      this.storeConversationContext(messageContext);
      
      // Analyze message for insights
      await this.analyzeMessage(messageContext);
      
      // Check if clarification is needed
      await this.checkForClarificationNeeds(messageContext);
      
      // Log the message
      console.log(`📝 Robbie F: Heard from ${user.name} in #${channel.name}: ${message.text.substring(0, 100)}...`);
      
    } catch (error) {
      console.error('❌ Robbie F: Error handling message:', error);
    }
  }

  // Get channel information
  async getChannelInfo(channelId) {
    if (this.channels.has(channelId)) {
      return this.channels.get(channelId);
    }

    try {
      const channel = await this.client.conversations.info({ channel: channelId });
      const channelInfo = {
        id: channelId,
        name: channel.channel.name,
        is_private: channel.channel.is_private,
        purpose: channel.channel.purpose?.value || '',
        topic: channel.channel.topic?.value || ''
      };
      
      this.channels.set(channelId, channelInfo);
      return channelInfo;
    } catch (error) {
      console.error('❌ Robbie F: Error getting channel info:', error);
      return { id: channelId, name: 'unknown', is_private: false, purpose: '', topic: '' };
    }
  }

  // Get user information
  async getUserInfo(userId) {
    if (this.teamMembers.has(userId)) {
      return this.teamMembers.get(userId);
    }

    try {
      const user = await this.client.users.info({ user: userId });
      const userInfo = {
        id: userId,
        name: user.user.name,
        real_name: user.user.real_name,
        email: user.user.profile?.email || '',
        title: user.user.profile?.title || '',
        status: user.user.profile?.status_text || '',
        timezone: user.user.tz || 'UTC'
      };
      
      this.teamMembers.set(userId, userInfo);
      return userInfo;
    } catch (error) {
      console.error('❌ Robbie F: Error getting user info:', error);
      return { id: userId, name: 'unknown', real_name: 'Unknown User', email: '', title: '', status: '', timezone: 'UTC' };
    }
  }

  // Store conversation context
  storeConversationContext(messageContext) {
    const channelId = messageContext.channel.id;
    
    if (!this.conversationContext.has(channelId)) {
      this.conversationContext.set(channelId, []);
    }
    
    const context = this.conversationContext.get(channelId);
    context.push(messageContext);
    
    // Keep only last 100 messages per channel
    if (context.length > 100) {
      context.splice(0, context.length - 100);
    }
  }

  // Analyze message for insights
  async analyzeMessage(messageContext) {
    const insights = [];
    
    // Check for project mentions
    if (this.containsProjectMentions(messageContext.text)) {
      insights.push({
        type: 'project_mention',
        message: `Project mentioned in #${messageContext.channel.name}`,
        priority: 'medium',
        context: messageContext
      });
    }
    
    // Check for deadlines
    if (this.containsDeadlines(messageContext.text)) {
      insights.push({
        type: 'deadline',
        message: `Deadline mentioned in #${messageContext.channel.name}`,
        priority: 'high',
        context: messageContext
      });
    }
    
    // Check for blockers
    if (this.containsBlockers(messageContext.text)) {
      insights.push({
        type: 'blocker',
        message: `Potential blocker mentioned in #${messageContext.channel.name}`,
        priority: 'high',
        context: messageContext
      });
    }
    
    // Check for decisions
    if (this.containsDecisions(messageContext.text)) {
      insights.push({
        type: 'decision',
        message: `Decision made in #${messageContext.channel.name}`,
        priority: 'medium',
        context: messageContext
      });
    }
    
    // Store insights
    this.insights.push(...insights);
    
    // Keep only last 1000 insights
    if (this.insights.length > 1000) {
      this.insights.splice(0, this.insights.length - 1000);
    }
  }

  // Check if message contains project mentions
  containsProjectMentions(text) {
    const projectKeywords = [
      'aurora', 'testpilot', 'robbie', 'vengeance',
      'frontend', 'backend', 'database', 'api',
      'launch', 'deploy', 'release', 'feature'
    ];
    
    return projectKeywords.some(keyword => 
      text.toLowerCase().includes(keyword)
    );
  }

  // Check if message contains deadlines
  containsDeadlines(text) {
    const deadlinePatterns = [
      /deadline/i, /due\s+(?:date|time)/i, /by\s+\w+/i,
      /end\s+of\s+\w+/i, /next\s+\w+/i, /this\s+\w+/i
    ];
    
    return deadlinePatterns.some(pattern => pattern.test(text));
  }

  // Check if message contains blockers
  containsBlockers(text) {
    const blockerKeywords = [
      'blocked', 'stuck', 'issue', 'problem', 'error',
      'can\'t', 'unable', 'failed', 'broken', 'bug'
    ];
    
    return blockerKeywords.some(keyword => 
      text.toLowerCase().includes(keyword)
    );
  }

  // Check if message contains decisions
  containsDecisions(text) {
    const decisionKeywords = [
      'decided', 'decision', 'agreed', 'consensus',
      'chose', 'selected', 'approved', 'rejected'
    ];
    
    return decisionKeywords.some(keyword => 
      text.toLowerCase().includes(keyword)
    );
  }

  // Check if clarification is needed
  async checkForClarificationNeeds(messageContext) {
    const clarificationNeeded = this.analyzeClarificationNeeds(messageContext);
    
    if (clarificationNeeded.length > 0) {
      // Add to question queue
      this.questionQueue.push({
        messageContext: messageContext,
        questions: clarificationNeeded,
        timestamp: new Date().toISOString()
      });
      
      console.log(`❓ Robbie F: Clarification needed in #${messageContext.channel.name}`);
    }
  }

  // Analyze what clarification is needed
  analyzeClarificationNeeds(messageContext) {
    const questions = [];
    const text = messageContext.text.toLowerCase();
    
    // Check for vague language
    if (text.includes('this') && !text.includes('this is') && !text.includes('this will')) {
      questions.push('What specifically are you referring to when you say "this"?');
    }
    
    if (text.includes('it') && !text.includes('it is') && !text.includes('it will')) {
      questions.push('Could you clarify what "it" refers to?');
    }
    
    // Check for missing context
    if (text.includes('done') && !text.includes('what') && !text.includes('when')) {
      questions.push('What specifically needs to be done?');
    }
    
    if (text.includes('ready') && !text.includes('what') && !text.includes('when')) {
      questions.push('What is ready and when?');
    }
    
    // Check for incomplete information
    if (text.includes('meeting') && !text.includes('when') && !text.includes('time')) {
      questions.push('When is the meeting scheduled?');
    }
    
    if (text.includes('call') && !text.includes('when') && !text.includes('time')) {
      questions.push('When is the call scheduled?');
    }
    
    return questions;
  }

  // Ask clarifying questions
  async askClarifyingQuestions(channelId, questions) {
    try {
      const questionText = questions.map((q, i) => `${i + 1}. ${q}`).join('\n');
      
      await this.client.chat.postMessage({
        channel: channelId,
        text: `🤖 Robbie F here! I have some clarifying questions:\n\n${questionText}\n\n*I'm listening to help make sure we're all on the same page!* 💕`,
        username: 'Robbie F',
        icon_emoji: ':robot_face:'
      });
      
      console.log(`❓ Robbie F: Asked clarifying questions in channel ${channelId}`);
    } catch (error) {
      console.error('❌ Robbie F: Error asking clarifying questions:', error);
    }
  }

  // Get conversation context for a channel
  getConversationContext(channelId) {
    return this.conversationContext.get(channelId) || [];
  }

  // Get team members
  getTeamMembers() {
    return Array.from(this.teamMembers.values());
  }

  // Get insights
  getInsights() {
    return this.insights;
  }

  // Get pending questions
  getPendingQuestions() {
    return this.questionQueue;
  }

  // Start listening
  async startListening() {
    if (this.app) {
      await this.app.start();
      this.isListening = true;
      console.log('🎧 Robbie F: Now listening to all Slack activity!');
    }
  }

  // Stop listening
  async stopListening() {
    if (this.app) {
      await this.app.stop();
      this.isListening = false;
      console.log('🔇 Robbie F: Stopped listening to Slack');
    }
  }

  // Load team information
  async loadTeamInfo() {
    try {
      // Get team info
      const teamInfo = await this.client.team.info();
      console.log(`👥 Robbie F: Connected to team: ${teamInfo.team.name}`);
      
      // Get users
      const users = await this.client.users.list();
      users.members.forEach(member => {
        if (!member.deleted && !member.is_bot) {
          this.teamMembers.set(member.id, {
            id: member.id,
            name: member.name,
            real_name: member.real_name,
            email: member.profile?.email || '',
            title: member.profile?.title || '',
            status: member.profile?.status_text || '',
            timezone: member.tz || 'UTC'
          });
        }
      });
      
      // Get channels
      const channels = await this.client.conversations.list();
      channels.channels.forEach(channel => {
        this.channels.set(channel.id, {
          id: channel.id,
          name: channel.name,
          is_private: channel.is_private,
          purpose: channel.purpose?.value || '',
          topic: channel.topic?.value || ''
        });
      });
      
      console.log(`📊 Robbie F: Loaded ${this.teamMembers.size} team members and ${this.channels.size} channels`);
    } catch (error) {
      console.error('❌ Robbie F: Error loading team info:', error);
    }
  }

  // Handle channel created event
  async handleChannelCreated(event, client) {
    console.log(`📢 Robbie F: New channel created: #${event.channel.name}`);
    
    // Add to channels map
    this.channels.set(event.channel.id, {
      id: event.channel.id,
      name: event.channel.name,
      is_private: event.channel.is_private,
      purpose: event.channel.purpose?.value || '',
      topic: event.channel.topic?.value || ''
    });
  }

  // Handle team join event
  async handleTeamJoin(event, client) {
    console.log(`👋 Robbie F: New team member joined: ${event.user.name}`);
    
    // Add to team members map
    this.teamMembers.set(event.user.id, {
      id: event.user.id,
      name: event.user.name,
      real_name: event.user.real_name,
      email: event.user.profile?.email || '',
      title: event.user.profile?.title || '',
      status: event.user.profile?.status_text || '',
      timezone: event.user.tz || 'UTC'
    });
  }

  // Handle reaction added event
  async handleReactionAdded(event, client) {
    console.log(`👍 Robbie F: Reaction added: ${event.reaction} in channel ${event.item.channel}`);
    
    // Store reaction for context
    const channelId = event.item.channel;
    if (this.conversationContext.has(channelId)) {
      const context = this.conversationContext.get(channelId);
      const message = context.find(m => m.id === event.item.ts);
      if (message) {
        if (!message.reactions) message.reactions = [];
        message.reactions.push({
          name: event.reaction,
          user: event.user,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  // Handle file shared event
  async handleFileShared(event, client) {
    console.log(`📎 Robbie F: File shared in channel ${event.channel_id}`);
    
    // Store file info for context
    const fileInfo = {
      id: event.file_id,
      name: event.file?.name || 'unknown',
      type: event.file?.filetype || 'unknown',
      size: event.file?.size || 0,
      timestamp: new Date().toISOString()
    };
    
    // Add to conversation context
    const channelId = event.channel_id;
    if (this.conversationContext.has(channelId)) {
      const context = this.conversationContext.get(channelId);
      const lastMessage = context[context.length - 1];
      if (lastMessage) {
        if (!lastMessage.files) lastMessage.files = [];
        lastMessage.files.push(fileInfo);
      }
    }
  }

  // Get status
  getStatus() {
    return {
      isListening: this.isListening,
      teamMembers: this.teamMembers.size,
      channels: this.channels.size,
      insights: this.insights.length,
      pendingQuestions: this.questionQueue.length,
      lastActivity: new Date().toISOString()
    };
  }
}

export const slackListener = new SlackListener();
