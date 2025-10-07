/**
 * Live Cursor Memory Manager
 * Automatically saves and manages our Cursor chat conversations
 */

import { EventEmitter } from 'events';
import CursorChatMemory from './cursorChatMemory.js';
import IntelligentStickySystem from './intelligentStickySystem.js';

class LiveCursorMemoryManager extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            ...config
        };
        
        this.chatMemory = null;
        this.stickySystem = null;
        this.isInitialized = false;
        
        // Conversation tracking
        this.currentSessionId = this._generateSessionId();
        this.conversationBuffer = [];
        this.lastProcessedMessage = null;
        
        // Auto-save settings
        this.autoSaveEnabled = true;
        this.autoProcessOpportunities = true;
        this.saveInterval = 5000; // Save every 5 seconds
        this.saveTimer = null;
    }

    async initialize() {
        try {
            console.log('🧠 Initializing Live Cursor Memory Manager...');
            
            // Initialize chat memory system
            this.chatMemory = new CursorChatMemory();
            await this.chatMemory.initialize();
            
            // Initialize intelligent sticky system
            this.stickySystem = new IntelligentStickySystem();
            await this.stickySystem.initialize();
            
            // Set up event listeners
            this._setupEventListeners();
            
            // Start auto-save timer
            if (this.autoSaveEnabled) {
                this._startAutoSave();
            }
            
            this.isInitialized = true;
            console.log('✅ Live Cursor Memory Manager initialized successfully');
            
            this.emit('initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize live cursor memory manager:', error);
            throw error;
        }
    }

    _setupEventListeners() {
        this.chatMemory.on('messageSaved', (data) => {
            console.log(`💾 Message saved: ${data.type} - ${data.content.substring(0, 50)}...`);
            
            // Process for opportunities if enabled
            if (this.autoProcessOpportunities && data.type === 'user_query') {
                this._processForOpportunities(data.content, data.context);
            }
        });
        
        this.stickySystem.on('stickiesGenerated', (data) => {
            console.log(`🎯 Opportunity detected in Cursor chat: ${data.stickyCount} sticky notes`);
            this.emit('opportunityDetected', data);
        });
    }

    _startAutoSave() {
        this.saveTimer = setInterval(() => {
            if (this.conversationBuffer.length > 0) {
                this._flushConversationBuffer();
            }
        }, this.saveInterval);
        
        console.log(`⏰ Auto-save enabled (every ${this.saveInterval}ms)`);
    }

    _stopAutoSave() {
        if (this.saveTimer) {
            clearInterval(this.saveTimer);
            this.saveTimer = null;
        }
    }

    async saveUserMessage(message, context = {}) {
        try {
            if (!this.isInitialized) {
                throw new Error('Live cursor memory manager not initialized');
            }

            // Add to conversation buffer
            this.conversationBuffer.push({
                type: 'user_message',
                content: message,
                context: {
                    ...context,
                    sessionId: this.currentSessionId,
                    timestamp: new Date().toISOString()
                },
                timestamp: Date.now()
            });

            // Save immediately for important messages
            if (this._isImportantMessage(message, context)) {
                await this._flushConversationBuffer();
            }

            console.log(`📝 User message queued: ${message.substring(0, 50)}...`);

        } catch (error) {
            console.error('❌ Error saving user message:', error);
        }
    }

    async saveAssistantMessage(message, userMessageId = null, context = {}) {
        try {
            if (!this.isInitialized) {
                throw new Error('Live cursor memory manager not initialized');
            }

            // Add to conversation buffer
            this.conversationBuffer.push({
                type: 'assistant_message',
                content: message,
                userMessageId,
                context: {
                    ...context,
                    sessionId: this.currentSessionId,
                    timestamp: new Date().toISOString()
                },
                timestamp: Date.now()
            });

            // Save immediately for important responses
            if (this._isImportantMessage(message, context)) {
                await this._flushConversationBuffer();
            }

            console.log(`📝 Assistant message queued: ${message.substring(0, 50)}...`);

        } catch (error) {
            console.error('❌ Error saving assistant message:', error);
        }
    }

    async saveCodeBlock(code, language, context = {}) {
        try {
            if (!this.isInitialized) {
                throw new Error('Live cursor memory manager not initialized');
            }

            await this.chatMemory.saveCodeBlock(code, language, {
                ...context,
                sessionId: this.currentSessionId,
                timestamp: new Date().toISOString()
            });

            console.log(`💾 Code block saved: ${language} - ${code.substring(0, 30)}...`);

        } catch (error) {
            console.error('❌ Error saving code block:', error);
        }
    }

    async _flushConversationBuffer() {
        if (this.conversationBuffer.length === 0) {
            return;
        }

        try {
            console.log(`🔄 Flushing ${this.conversationBuffer.length} messages from buffer...`);

            for (const message of this.conversationBuffer) {
                if (message.type === 'user_message') {
                    await this.chatMemory.saveUserQuery(message.content, message.context);
                } else if (message.type === 'assistant_message') {
                    await this.chatMemory.saveAssistantResponse(
                        message.content,
                        message.userMessageId,
                        message.context
                    );
                }
            }

            this.conversationBuffer = [];
            console.log('✅ Conversation buffer flushed');

        } catch (error) {
            console.error('❌ Error flushing conversation buffer:', error);
        }
    }

    async _processForOpportunities(content, context = {}) {
        try {
            const result = await this.stickySystem.processInput(
                'cursor_chat',
                `cursor_${Date.now()}`,
                content,
                {
                    ...context,
                    source: 'cursor_chat',
                    sessionId: this.currentSessionId
                }
            );

            if (result.processed && result.stickyCount > 0) {
                console.log(`🎯 Found ${result.stickyCount} opportunities in Cursor chat!`);
                
                for (const sticky of result.stickies) {
                    console.log(`📝 Cursor Opportunity: ${sticky.content}`);
                }
            }

        } catch (error) {
            console.error('❌ Error processing for opportunities:', error);
        }
    }

    async searchOurConversations(query, options = {}) {
        try {
            if (!this.isInitialized) {
                throw new Error('Live cursor memory manager not initialized');
            }

            const results = await this.chatMemory.searchConversations(query, {
                ...options,
                sessionId: this.currentSessionId
            });

            console.log(`🔍 Found ${results.length} conversations matching "${query}"`);
            
            return results;

        } catch (error) {
            console.error('❌ Error searching conversations:', error);
            throw error;
        }
    }

    async searchAllHistory(query, options = {}) {
        try {
            if (!this.isInitialized) {
                throw new Error('Live cursor memory manager not initialized');
            }

            const results = await this.chatMemory.searchConversations(query, options);
            
            console.log(`🔍 Found ${results.length} conversations in all history matching "${query}"`);
            
            return results;

        } catch (error) {
            console.error('❌ Error searching all history:', error);
            throw error;
        }
    }

    async getConversationSummary(sessionId = null) {
        try {
            const targetSessionId = sessionId || this.currentSessionId;
            const summary = await this.chatMemory.getSessionSummary(targetSessionId);
            
            if (summary) {
                console.log(`📊 Session Summary for ${targetSessionId}:`);
                console.log(`  Messages: ${summary.messages}`);
                console.log(`  Key Topics: ${summary.keyTopics.join(', ')}`);
                console.log(`  Duration: ${summary.start_time} to ${summary.end_time || 'ongoing'}`);
            }
            
            return summary;

        } catch (error) {
            console.error('❌ Error getting conversation summary:', error);
            throw error;
        }
    }

    async getMemoryStats() {
        try {
            const stats = await this.chatMemory.getMemoryStats();
            
            console.log('📊 Cursor Chat Memory Statistics:');
            console.log(`  Total Messages: ${stats.totalMessages}`);
            console.log(`  Total Sessions: ${stats.totalSessions}`);
            console.log(`  Total Relationships: ${stats.totalRelationships}`);
            console.log(`  Message Types: ${stats.messageTypes.map(t => `${t.message_type}: ${t.count}`).join(', ')}`);
            
            return stats;

        } catch (error) {
            console.error('❌ Error getting memory stats:', error);
            throw error;
        }
    }

    async getActiveOpportunities() {
        try {
            return await this.stickySystem.getActiveStickies();
        } catch (error) {
            console.error('❌ Error getting active opportunities:', error);
            throw error;
        }
    }

    async getFollowUpOpportunities() {
        try {
            return await this.stickySystem.getFollowUpStickies();
        } catch (error) {
            console.error('❌ Error getting follow-up opportunities:', error);
            throw error;
        }
    }

    async markOpportunityActionTaken(stickyId, action, notes = null) {
        try {
            await this.stickySystem.markStickyActionTaken(stickyId, action, notes);
            console.log(`✅ Marked opportunity as action taken: ${action}`);
        } catch (error) {
            console.error('❌ Error marking opportunity as action taken:', error);
            throw error;
        }
    }

    // Helper methods
    _generateSessionId() {
        const date = new Date();
        const dateStr = date.toISOString().split('T')[0];
        const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '');
        return `cursor_session_${dateStr}_${timeStr}`;
    }

    _isImportantMessage(message, context) {
        // Check if message is important enough to save immediately
        const importantKeywords = [
            'important', 'critical', 'urgent', 'decision', 'decision',
            'revenue', 'deal', 'customer', 'business', 'money',
            'architecture', 'system', 'integration', 'database',
            'opportunity', 'funding', 'budget', 'expansion'
        ];
        
        const lowerMessage = message.toLowerCase();
        return importantKeywords.some(keyword => lowerMessage.includes(keyword)) ||
               context.isImportant ||
               context.hasCode ||
               message.length > 500;
    }

    // Public API methods for easy integration
    async remember(query) {
        return await this.searchOurConversations(query);
    }

    async rememberAll(query) {
        return await this.searchAllHistory(query);
    }

    async whatDidWeTalkAbout(topic) {
        return await this.searchOurConversations(topic, { limit: 20 });
    }

    async showOpportunities() {
        return await this.getActiveOpportunities();
    }

    async showFollowUps() {
        return await this.getFollowUpOpportunities();
    }

    async showStats() {
        return await this.getMemoryStats();
    }

    async shutdown() {
        console.log('🛑 Shutting down Live Cursor Memory Manager...');
        
        this._stopAutoSave();
        
        // Flush any remaining messages
        await this._flushConversationBuffer();
        
        if (this.chatMemory) {
            await this.chatMemory.shutdown();
        }
        
        if (this.stickySystem) {
            await this.stickySystem.shutdown();
        }
        
        this.isInitialized = false;
        console.log('✅ Live Cursor Memory Manager shutdown complete');
    }
}

export default LiveCursorMemoryManager;
