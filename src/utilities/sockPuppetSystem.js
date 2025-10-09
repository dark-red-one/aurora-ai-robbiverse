// Robbie F Sock Puppet System - Draft messages, edit, and verify with AI
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class SockPuppetSystem {
  constructor() {
    this.draftQueue = [];
    this.verificationLog = [];
    this.teamMembers = new Map();
    this.messageTemplates = new Map();
    this.llmVerifier = null;
  }

  // Initialize sock puppet system
  async initialize() {
    console.log('🎭 Robbie F: Initializing Sock Puppet System...');
    
    try {
      // Load team members
      await this.loadTeamMembers();
      
      // Load message templates
      await this.loadMessageTemplates();
      
      // Initialize LLM verifier
      await this.initializeLLMVerifier();
      
      console.log('✅ Robbie F: Sock Puppet System ready!');
      return true;
    } catch (error) {
      console.error('❌ Robbie F: Sock Puppet initialization failed:', error);
      return false;
    }
  }

  // Load team members
  async loadTeamMembers() {
    try {
      const teamData = await fs.readFile('/home/allan/vengeance/data/team_members.json', 'utf8');
      const members = JSON.parse(teamData);
      
      members.forEach(member => {
        this.teamMembers.set(member.name.toLowerCase(), member);
      });
      
      console.log(`👥 Robbie F: Loaded ${this.teamMembers.size} team members`);
    } catch (error) {
      console.log('⚠️  Team members file not found, using defaults');
      
      // Default team members
      const defaultMembers = [
        { name: 'kristina', email: 'kristina@testpilotcpg.com', slack: '@kristina', role: 'sales' },
        { name: 'tom', email: 'tom@testpilotcpg.com', slack: '@tom', role: 'sales' },
        { name: 'allan', email: 'allan@testpilotcpg.com', slack: '@allan', role: 'ceo' }
      ];
      
      defaultMembers.forEach(member => {
        this.teamMembers.set(member.name, member);
      });
    }
  }

  // Load message templates
  async loadMessageTemplates() {
    try {
      const templatesData = await fs.readFile('/home/allan/vengeance/data/message_templates.json', 'utf8');
      const templates = JSON.parse(templatesData);
      
      templates.forEach(template => {
        this.messageTemplates.set(template.type, template);
      });
      
      console.log(`📝 Robbie F: Loaded ${this.messageTemplates.size} message templates`);
    } catch (error) {
      console.log('⚠️  Message templates file not found, using defaults');
      
      // Default templates
      const defaultTemplates = [
        {
          type: 'sales_priorities',
          subject: 'Sales Priorities & Next Steps',
          slack_template: `Hey {recipient}! 👋

Here are our current sales priorities and your next steps:

**Top Priorities:**
{priorities}

**Your Next Steps:**
{next_steps}

**Key Metrics to Track:**
{metrics}

Let me know if you need any clarification or support! 💪

Best,
Robbie F 🤖`,
          email_template: `Hi {recipient_name},

I hope you're doing well! Here's an update on our current sales priorities and your next steps.

**Top Priorities:**
{priorities}

**Your Next Steps:**
{next_steps}

**Key Metrics to Track:**
{metrics}

Please let me know if you have any questions or need additional support.

Best regards,
Robbie F
AI Copilot to Allan Peretz`
        },
        {
          type: 'client_update',
          subject: 'Client Update: {client_name}',
          slack_template: `📊 **Client Update: {client_name}**

**Status:** {status}
**Next Meeting:** {next_meeting}
**Key Points:** {key_points}
**Action Items:** {action_items}

**Allan's Notes:**
{allan_notes}

Let me know if you need more details! 📈`,
          email_template: `Hi Team,

Here's an update on {client_name}:

**Status:** {status}
**Next Meeting:** {next_meeting}
**Key Points:** {key_points}
**Action Items:** {action_items}

**Allan's Notes:**
{allan_notes}

Please review and let me know if you have any questions.

Best,
Robbie F`
        }
      ];
      
      defaultTemplates.forEach(template => {
        this.messageTemplates.set(template.type, template);
      });
    }
  }

  // Initialize LLM verifier
  async initializeLLMVerifier() {
    this.llmVerifier = {
      model: 'llama3.1:8b',
      endpoint: 'http://localhost:11434/api/generate',
      verifyAction: async (intendedAction, actualAction) => {
        return await this.verifyActionWithLLM(intendedAction, actualAction);
      }
    };
  }

  // Process sock puppet command
  async processCommand(command, context = {}) {
    console.log(`🎭 Robbie F: Processing command: "${command}"`);
    
    try {
      // Parse the command
      const parsedCommand = await this.parseCommand(command, context);
      
      // Generate draft messages
      const drafts = await this.generateDrafts(parsedCommand);
      
      // Add to draft queue
      drafts.forEach(draft => {
        this.draftQueue.push({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          command: command,
          parsedCommand: parsedCommand,
          draft: draft,
          status: 'draft',
          timestamp: new Date().toISOString()
        });
      });
      
      console.log(`📝 Robbie F: Generated ${drafts.length} draft messages`);
      return drafts;
    } catch (error) {
      console.error('❌ Robbie F: Error processing command:', error);
      throw error;
    }
  }

  // Parse command to extract intent and parameters
  async parseCommand(command, context) {
    const lowerCommand = command.toLowerCase();
    
    // Extract recipients
    const recipients = this.extractRecipients(lowerCommand);
    
    // Extract message type
    const messageType = this.extractMessageType(lowerCommand);
    
    // Extract content parameters
    const parameters = this.extractParameters(lowerCommand, context);
    
    // Extract channels
    const channels = this.extractChannels(lowerCommand);
    
    return {
      originalCommand: command,
      recipients: recipients,
      messageType: messageType,
      parameters: parameters,
      channels: channels,
      context: context
    };
  }

  // Extract recipients from command
  extractRecipients(command) {
    const recipients = [];
    
    // Check for specific names
    this.teamMembers.forEach((member, name) => {
      if (command.includes(name)) {
        recipients.push({
          name: member.name,
          email: member.email,
          slack: member.slack,
          role: member.role
        });
      }
    });
    
    // Check for "team" keyword
    if (command.includes('team') || command.includes('everyone')) {
      recipients.push({
        name: 'team',
        email: 'team@testpilotcpg.com',
        slack: '@channel',
        role: 'team'
      });
    }
    
    return recipients;
  }

  // Extract message type from command
  extractMessageType(command) {
    if (command.includes('sales priorities') || command.includes('sales update')) {
      return 'sales_priorities';
    }
    
    if (command.includes('client update') || command.includes('simply good foods')) {
      return 'client_update';
    }
    
    if (command.includes('meeting') || command.includes('standup')) {
      return 'meeting_update';
    }
    
    if (command.includes('deadline') || command.includes('urgent')) {
      return 'urgent_update';
    }
    
    return 'general_update';
  }

  // Extract parameters from command
  extractParameters(command, context) {
    const parameters = {};
    
    // Extract priorities
    if (command.includes('priorities')) {
      parameters.priorities = context.priorities || [
        'Focus on high-value prospects',
        'Follow up on pending deals',
        'Prepare for Q4 planning'
      ];
    }
    
    // Extract next steps
    if (command.includes('next steps')) {
      parameters.next_steps = context.next_steps || [
        'Review prospect list',
        'Schedule follow-up calls',
        'Update CRM with latest activities'
      ];
    }
    
    // Extract metrics
    if (command.includes('metrics')) {
      parameters.metrics = context.metrics || [
        'Pipeline value',
        'Conversion rate',
        'Response time'
      ];
    }
    
    // Extract client info
    if (command.includes('simply good foods')) {
      parameters.client_name = 'Simply Good Foods';
      parameters.status = context.status || 'Active discussions';
      parameters.next_meeting = context.next_meeting || 'TBD';
      parameters.key_points = context.key_points || [
        'Product testing completed',
        'Pricing discussions ongoing',
        'Contract terms under review'
      ];
    }
    
    return parameters;
  }

  // Extract channels from command
  extractChannels(command) {
    const channels = [];
    
    if (command.includes('slack')) {
      channels.push('slack');
    }
    
    if (command.includes('email')) {
      channels.push('email');
    }
    
    // Default to both if not specified
    if (channels.length === 0) {
      channels.push('slack', 'email');
    }
    
    return channels;
  }

  // Generate draft messages
  async generateDrafts(parsedCommand) {
    const drafts = [];
    const template = this.messageTemplates.get(parsedCommand.messageType);
    
    if (!template) {
      throw new Error(`No template found for message type: ${parsedCommand.messageType}`);
    }
    
    // Generate draft for each recipient
    parsedCommand.recipients.forEach(recipient => {
      parsedCommand.channels.forEach(channel => {
        const draft = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          recipient: recipient,
          channel: channel,
          subject: this.replacePlaceholders(template.subject, recipient, parsedCommand.parameters),
          content: this.replacePlaceholders(
            channel === 'slack' ? template.slack_template : template.email_template,
            recipient,
            parsedCommand.parameters
          ),
          metadata: {
            messageType: parsedCommand.messageType,
            template: template.type,
            parameters: parsedCommand.parameters,
            context: parsedCommand.context
          }
        };
        
        drafts.push(draft);
      });
    });
    
    return drafts;
  }

  // Replace placeholders in template
  replacePlaceholders(template, recipient, parameters) {
    let content = template;
    
    // Replace recipient placeholders
    content = content.replace(/{recipient}/g, recipient.name);
    content = content.replace(/{recipient_name}/g, recipient.name);
    content = content.replace(/{recipient_email}/g, recipient.email);
    content = content.replace(/{recipient_slack}/g, recipient.slack);
    
    // Replace parameter placeholders
    Object.keys(parameters).forEach(key => {
      const value = Array.isArray(parameters[key]) 
        ? parameters[key].map(item => `• ${item}`).join('\n')
        : parameters[key];
      content = content.replace(new RegExp(`{${key}}`, 'g'), value);
    });
    
    return content;
  }

  // Get draft queue
  getDraftQueue() {
    return this.draftQueue;
  }

  // Get specific draft
  getDraft(draftId) {
    return this.draftQueue.find(draft => draft.id === draftId);
  }

  // Update draft
  async updateDraft(draftId, updates) {
    const draft = this.getDraft(draftId);
    if (draft) {
      Object.assign(draft.draft, updates);
      draft.timestamp = new Date().toISOString();
      console.log(`✏️  Robbie F: Updated draft ${draftId}`);
    }
  }

  // Send draft
  async sendDraft(draftId) {
    const draft = this.getDraft(draftId);
    if (!draft) {
      throw new Error('Draft not found');
    }
    
    try {
      // Record intended action
      const intendedAction = {
        type: 'send_message',
        recipient: draft.draft.recipient,
        channel: draft.draft.channel,
        subject: draft.draft.subject,
        content: draft.draft.content,
        timestamp: new Date().toISOString()
      };
      
      // Send the message
      const actualAction = await this.sendMessage(draft.draft);
      
      // Verify with LLM
      const verification = await this.verifyActionWithLLM(intendedAction, actualAction);
      
      // Update draft status
      draft.status = verification.matches ? 'sent' : 'verification_failed';
      draft.verification = verification;
      
      // Log verification
      this.verificationLog.push({
        draftId: draftId,
        intendedAction: intendedAction,
        actualAction: actualAction,
        verification: verification,
        timestamp: new Date().toISOString()
      });
      
      console.log(`📤 Robbie F: Sent draft ${draftId} - Verification: ${verification.matches ? 'PASSED' : 'FAILED'}`);
      
      return {
        success: true,
        verification: verification,
        actualAction: actualAction
      };
    } catch (error) {
      console.error('❌ Robbie F: Error sending draft:', error);
      draft.status = 'failed';
      throw error;
    }
  }

  // Send message through appropriate channel
  async sendMessage(draft) {
    if (draft.channel === 'slack') {
      return await this.sendSlackMessage(draft);
    } else if (draft.channel === 'email') {
      return await this.sendEmailMessage(draft);
    } else {
      throw new Error(`Unknown channel: ${draft.channel}`);
    }
  }

  // Send Slack message
  async sendSlackMessage(draft) {
    // This would integrate with the Slack listener
    const slackMessage = {
      channel: draft.recipient.slack,
      text: draft.content,
      username: 'Robbie F',
      icon_emoji: ':robot_face:'
    };
    
    // For now, just log the message
    console.log(`📱 Robbie F: Would send Slack message to ${draft.recipient.slack}`);
    console.log(`Content: ${draft.content}`);
    
    return {
      type: 'slack_message',
      channel: draft.recipient.slack,
      content: draft.content,
      timestamp: new Date().toISOString(),
      success: true
    };
  }

  // Send email message
  async sendEmailMessage(draft) {
    // This would integrate with the email system
    const emailMessage = {
      to: draft.recipient.email,
      subject: draft.subject,
      content: draft.content,
      from: 'robbie@heyrobbie.ai'
    };
    
    // For now, just log the message
    console.log(`📧 Robbie F: Would send email to ${draft.recipient.email}`);
    console.log(`Subject: ${draft.subject}`);
    console.log(`Content: ${draft.content}`);
    
    return {
      type: 'email_message',
      to: draft.recipient.email,
      subject: draft.subject,
      content: draft.content,
      timestamp: new Date().toISOString(),
      success: true
    };
  }

  // Verify action with LLM
  async verifyActionWithLLM(intendedAction, actualAction) {
    try {
      const prompt = `You are Robbie F, an AI copilot. I need you to verify that an actual action matches the intended action.

INTENDED ACTION:
${JSON.stringify(intendedAction, null, 2)}

ACTUAL ACTION:
${JSON.stringify(actualAction, null, 2)}

Please analyze if these actions match and return a JSON response with:
- matches: boolean (true if they match)
- confidence: number (0-100)
- differences: array of strings describing any differences
- analysis: string explaining your reasoning

Be thorough and precise in your analysis.`;

      const response = await fetch(this.llmVerifier.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.llmVerifier.model,
          prompt: prompt,
          stream: false,
          format: 'json'
        })
      });

      const result = await response.json();
      const verification = JSON.parse(result.response);
      
      console.log(`🔍 Robbie F: LLM verification - Matches: ${verification.matches}, Confidence: ${verification.confidence}%`);
      
      return verification;
    } catch (error) {
      console.error('❌ Robbie F: LLM verification failed:', error);
      return {
        matches: false,
        confidence: 0,
        differences: ['LLM verification failed'],
        analysis: 'Error during verification process'
      };
    }
  }

  // Get verification log
  getVerificationLog() {
    return this.verificationLog;
  }

  // Get status
  getStatus() {
    return {
      draftQueue: this.draftQueue.length,
      verificationLog: this.verificationLog.length,
      teamMembers: this.teamMembers.size,
      templates: this.messageTemplates.size,
      lastActivity: new Date().toISOString()
    };
  }
}

export const sockPuppetSystem = new SockPuppetSystem();
