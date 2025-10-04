// Conversation Capture System
// Saves Allan + Robbie conversations until SQL integration is complete
// Creates structured files for later import into persistent memory

import fs from 'fs/promises';
import path from 'path';

class ConversationCapture {
  constructor() {
    this.captureDir = '/workspace/aurora/data/conversations';
    this.sessionId = this.generateSessionId();
    this.conversationFile = `${this.captureDir}/session_${this.sessionId}.json`;
    this.allanFile = `${this.captureDir}/allan_messages_${this.sessionId}.txt`;
    this.robbieFile = `${this.captureDir}/robbie_responses_${this.sessionId}.txt`;
    
    this.conversationData = {
      session_id: this.sessionId,
      start_time: new Date().toISOString(),
      participants: ['Allan', 'Robbie'],
      conversation_context: 'Aurora AI Empire Development',
      messages: []
    };
  }

  // Initialize capture system
  async initializeCapture() {
    console.log('📝 INITIALIZING CONVERSATION CAPTURE SYSTEM');
    console.log('==========================================');
    console.log(`Session ID: ${this.sessionId}`);
    console.log(`Conversation File: ${this.conversationFile}`);
    console.log('Capturing: Both Allan and Robbie messages');
    console.log('');
    
    // Create directories
    await fs.mkdir(this.captureDir, { recursive: true });
    
    // Initialize files
    await this.initializeConversationFiles();
    
    console.log('✅ Conversation capture system ready!');
    console.log('💡 Use captureAllanMessage() and captureRobbieResponse()');
    
    return true;
  }

  // Generate unique session ID
  generateSessionId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}_${random}`;
  }

  // Initialize conversation files
  async initializeConversationFiles() {
    // Main conversation JSON
    await fs.writeFile(this.conversationFile, JSON.stringify(this.conversationData, null, 2));
    
    // Allan's messages file
    await fs.writeFile(this.allanFile, `# Allan's Messages - Session ${this.sessionId}\n`);
    await fs.appendFile(this.allanFile, `# Started: ${new Date().toISOString()}\n\n`);
    
    // Robbie's responses file
    await fs.writeFile(this.robbieFile, `# Robbie's Responses - Session ${this.sessionId}\n`);
    await fs.appendFile(this.robbieFile, `# Started: ${new Date().toISOString()}\n\n`);
  }

  // Capture Allan's message
  async captureAllanMessage(message, context = {}) {
    const timestamp = new Date().toISOString();
    
    const messageData = {
      timestamp: timestamp,
      speaker: 'Allan',
      message: message,
      context: context,
      message_id: this.generateMessageId()
    };
    
    // Add to conversation data
    this.conversationData.messages.push(messageData);
    
    // Save to Allan's file
    await fs.appendFile(this.allanFile, `[${timestamp}] Allan:\n${message}\n\n`);
    
    // Update main conversation file
    await fs.writeFile(this.conversationFile, JSON.stringify(this.conversationData, null, 2));
    
    console.log(`📝 Captured Allan message: "${message.substring(0, 50)}..."`);
    
    return messageData.message_id;
  }

  // Capture Robbie's response
  async captureRobbieResponse(response, replyToMessageId = null, context = {}) {
    const timestamp = new Date().toISOString();
    
    const responseData = {
      timestamp: timestamp,
      speaker: 'Robbie',
      message: response,
      reply_to: replyToMessageId,
      context: context,
      message_id: this.generateMessageId()
    };
    
    // Add to conversation data
    this.conversationData.messages.push(responseData);
    
    // Save to Robbie's file
    await fs.appendFile(this.robbieFile, `[${timestamp}] Robbie:\n${response}\n\n`);
    
    // Update main conversation file
    await fs.writeFile(this.conversationFile, JSON.stringify(this.conversationData, null, 2));
    
    console.log(`🤖 Captured Robbie response: "${response.substring(0, 50)}..."`);
    
    return responseData.message_id;
  }

  // Capture current session's messages (IMMEDIATE INTERVENTION)
  async captureCurrentSession() {
    console.log('🚨 IMMEDIATE INTERVENTION - CAPTURING CURRENT CONVERSATION');
    console.log('========================================================');
    
    // Capture what we know from current session
    const currentSessionMessages = [
      {
        speaker: 'Allan',
        message: 'Still providing old conversations for your notes by the way- can you make an intervention now somehow and capture our conversation (or at least my half) in files until we get SQL fully integrated?',
        timestamp: new Date().toISOString(),
        context: { topic: 'conversation_capture_request' }
      },
      {
        speaker: 'Allan', 
        message: 'These will all be "demo mode" account and mine is "presidential privilege"',
        timestamp: new Date().toISOString(),
        context: { topic: 'account_privileges_for_pin_system' }
      },
      {
        speaker: 'Allan',
        message: 'Where the heck do I get this??? (referring to HubSpot token setup)',
        timestamp: new Date().toISOString(),
        context: { topic: 'hubspot_integration_setup' }
      },
      {
        speaker: 'Robbie',
        message: 'ABSOLUTELY! Great thinking! Let\'s capture everything until SQL is ready!',
        timestamp: new Date().toISOString(),
        context: { topic: 'conversation_capture_system_implementation' }
      }
    ];
    
    // Save each message
    for (const msg of currentSessionMessages) {
      if (msg.speaker === 'Allan') {
        await this.captureAllanMessage(msg.message, msg.context);
      } else {
        await this.captureRobbieResponse(msg.message, null, msg.context);
      }
    }
    
    console.log(`✅ Captured ${currentSessionMessages.length} messages from current session`);
  }

  // Generate message ID
  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  // Get conversation summary for review
  async getConversationSummary() {
    const summary = {
      session_id: this.sessionId,
      total_messages: this.conversationData.messages.length,
      allan_messages: this.conversationData.messages.filter(m => m.speaker === 'Allan').length,
      robbie_messages: this.conversationData.messages.filter(m => m.speaker === 'Robbie').length,
      conversation_duration: this.getSessionDuration(),
      last_message: this.conversationData.messages[this.conversationData.messages.length - 1],
      conversation_file: this.conversationFile
    };
    
    return summary;
  }

  // Get session duration
  getSessionDuration() {
    const startTime = new Date(this.conversationData.start_time);
    const currentTime = new Date();
    const durationMs = currentTime - startTime;
    const durationMinutes = Math.floor(durationMs / 60000);
    
    return `${durationMinutes} minutes`;
  }

  // Prepare data for SQL import (when ready)
  async prepareForSQLImport() {
    console.log('🗄️ PREPARING CONVERSATION DATA FOR SQL IMPORT');
    console.log('============================================');
    
    const sqlImportData = {
      conversations_table: {
        session_id: this.sessionId,
        user_id: 'allan',
        title: `Aurora Development Session - ${new Date().toLocaleDateString()}`,
        created_at: this.conversationData.start_time,
        updated_at: new Date().toISOString(),
        metadata: {
          total_messages: this.conversationData.messages.length,
          topics: this.extractTopics(),
          session_context: 'Aurora AI Empire Development'
        }
      },
      
      messages_table: this.conversationData.messages.map(msg => ({
        conversation_id: this.sessionId,
        role: msg.speaker.toLowerCase(),
        content: msg.message,
        created_at: msg.timestamp,
        metadata: msg.context,
        token_count: this.estimateTokenCount(msg.message)
      }))
    };
    
    // Save SQL import file
    const sqlImportFile = `${this.captureDir}/sql_import_${this.sessionId}.json`;
    await fs.writeFile(sqlImportFile, JSON.stringify(sqlImportData, null, 2));
    
    console.log(`✅ SQL import data ready: ${sqlImportFile}`);
    return sqlImportFile;
  }

  // Extract conversation topics
  extractTopics() {
    const topics = new Set();
    
    this.conversationData.messages.forEach(msg => {
      if (msg.context && msg.context.topic) {
        topics.add(msg.context.topic);
      }
    });
    
    return Array.from(topics);
  }

  // Estimate token count for message
  estimateTokenCount(message) {
    // Rough estimate: 1 token ≈ 4 characters
    return Math.ceil(message.length / 4);
  }
}

// Auto-start conversation capture
const conversationCapture = new ConversationCapture();

// Export for use
export default conversationCapture;
