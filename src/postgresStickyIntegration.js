/**
 * PostgreSQL Chat Memory Integration for Intelligent Sticky System
 * Connects to permanent PostgreSQL chat memory and processes all conversations
 */

import { EventEmitter } from 'events';
import pg from 'pg';
import IntelligentStickySystem from './intelligentStickySystem.js';

const { Pool } = pg;

class PostgresStickyIntegration extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // PostgreSQL connection config
            host: config.host || process.env.POSTGRES_HOST || 'aurora-postgres-u44170.vm.elestio.app',
            port: config.port || process.env.POSTGRES_PORT || 25432,
            database: config.database || process.env.POSTGRES_DB || 'aurora_unified',
            user: config.user || process.env.POSTGRES_USER || 'aurora_app',
            password: config.password || process.env.POSTGRES_PASSWORD || 'TestPilot2025_Aurora!',
            ssl: { rejectUnauthorized: false },
            ...config
        };
        
        this.pool = null;
        this.stickySystem = null;
        this.isInitialized = false;
        
        // Chat memory table names
        this.tables = {
            conversation_memory: 'conversation_memory',
            conversation_history: 'conversation_history',
            conversation_messages: 'conversation_messages',
            allan_knowledge: 'allan_knowledge'
        };
        
        // Processing statistics
        this.stats = {
            totalConversationsProcessed: 0,
            totalMessagesProcessed: 0,
            stickiesGenerated: 0,
            lastProcessedId: 0
        };
    }

    async initialize() {
        try {
            console.log('🔗 Initializing PostgreSQL Chat Memory Integration...');
            
            // Initialize PostgreSQL connection pool
            this.pool = new Pool(this.config);
            
            // Test connection
            await this._testConnection();
            
            // Initialize intelligent sticky system
            this.stickySystem = new IntelligentStickySystem();
            await this.stickySystem.initialize();
            
            // Set up event listeners
            this._setupEventListeners();
            
            this.isInitialized = true;
            console.log('✅ PostgreSQL Chat Memory Integration initialized successfully');
            
            this.emit('initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize PostgreSQL integration:', error);
            throw error;
        }
    }

    async _testConnection() {
        const client = await this.pool.connect();
        try {
            const result = await client.query('SELECT NOW()');
            console.log(`📡 Connected to PostgreSQL at ${this.config.host}:${this.config.port}`);
            console.log(`🗄️ Database: ${this.config.database}`);
        } finally {
            client.release();
        }
    }

    _setupEventListeners() {
        this.stickySystem.on('stickiesGenerated', (data) => {
            this.stats.stickiesGenerated += data.stickyCount;
            this.emit('opportunitiesFound', data);
        });
    }

    async processAllChatHistory(limit = null, offset = 0) {
        try {
            console.log('🔄 Processing all chat history for opportunities...');
            
            // Get all conversations from multiple tables
            const conversations = await this._getAllConversations(limit, offset);
            
            console.log(`📚 Found ${conversations.length} conversations to process`);
            
            let processedCount = 0;
            let stickyCount = 0;
            
            for (const conversation of conversations) {
                try {
                    const result = await this._processConversation(conversation);
                    if (result.stickiesGenerated > 0) {
                        stickyCount += result.stickiesGenerated;
                        console.log(`📝 Generated ${result.stickiesGenerated} stickies from conversation ${conversation.id}`);
                    }
                    processedCount++;
                } catch (error) {
                    console.error(`❌ Error processing conversation ${conversation.id}:`, error);
                }
            }
            
            this.stats.totalConversationsProcessed += processedCount;
            
            console.log(`✅ Processed ${processedCount} conversations, generated ${stickyCount} sticky notes`);
            
            return {
                conversationsProcessed: processedCount,
                stickiesGenerated: stickyCount
            };
            
        } catch (error) {
            console.error('❌ Error processing chat history:', error);
            throw error;
        }
    }

    async _getAllConversations(limit = null, offset = 0) {
        const conversations = [];
        
        // Get from conversation_memory table (if exists)
        try {
            const memoryQuery = `
                SELECT 
                    id::text,
                    conversation_id,
                    user_id,
                    message,
                    response,
                    emotional_tone,
                    timestamp,
                    metadata,
                    'conversation_memory' as source_table
                FROM ${this.tables.conversation_memory}
                ORDER BY timestamp DESC
                ${limit ? `LIMIT ${limit} OFFSET ${offset}` : ''}
            `;
            
            const memoryResult = await this.pool.query(memoryQuery);
            conversations.push(...memoryResult.rows);
        } catch (error) {
            console.log(`📋 conversation_memory table not found or empty: ${error.message}`);
        }
        
        // Get from conversation_history table (if exists)
        try {
            const historyQuery = `
                SELECT 
                    id::text,
                    'conv_' || id::text as conversation_id,
                    user_id,
                    user_message as message,
                    robbie_response as response,
                    'neutral' as emotional_tone,
                    timestamp,
                    context_used::jsonb as metadata,
                    'conversation_history' as source_table
                FROM ${this.tables.conversation_history}
                ORDER BY timestamp DESC
                ${limit ? `LIMIT ${limit} OFFSET ${offset}` : ''}
            `;
            
            const historyResult = await this.pool.query(historyQuery);
            conversations.push(...historyResult.rows);
        } catch (error) {
            console.log(`📋 conversation_history table not found or empty: ${error.message}`);
        }
        
        // Get from conversation_messages table (if exists)
        try {
            const messagesQuery = `
                SELECT 
                    id::text,
                    conversation_id,
                    speaker as user_id,
                    message,
                    '' as response,
                    (context->>'mood') as emotional_tone,
                    created_at as timestamp,
                    context as metadata,
                    'conversation_messages' as source_table
                FROM ${this.tables.conversation_messages}
                ORDER BY created_at DESC
                ${limit ? `LIMIT ${limit} OFFSET ${offset}` : ''}
            `;
            
            const messagesResult = await this.pool.query(messagesQuery);
            conversations.push(...messagesResult.rows);
        } catch (error) {
            console.log(`📋 conversation_messages table not found or empty: ${error.message}`);
        }
        
        return conversations;
    }

    async _processConversation(conversation) {
        const content = `${conversation.message} ${conversation.response || ''}`.trim();
        
        if (!content) {
            return { stickiesGenerated: 0 };
        }
        
        const metadata = {
            conversationId: conversation.conversation_id,
            userId: conversation.user_id,
            emotionalTone: conversation.emotional_tone,
            timestamp: conversation.timestamp,
            sourceTable: conversation.source_table,
            originalMetadata: conversation.metadata
        };
        
        const result = await this.stickySystem.processInput(
            'chat_message',
            conversation.id,
            content,
            metadata
        );
        
        this.stats.totalMessagesProcessed++;
        
        return {
            stickiesGenerated: result.processed ? result.stickyCount : 0
        };
    }

    async processNewMessages(since = null) {
        try {
            console.log('🔄 Processing new messages since last run...');
            
            // Get new messages since last processed ID or timestamp
            let query;
            let params = [];
            
            if (since) {
                query = `
                    SELECT * FROM (
                        SELECT id::text, conversation_id, user_id, message, response, 
                               emotional_tone, timestamp, metadata, 'conversation_memory' as source_table
                        FROM ${this.tables.conversation_memory}
                        WHERE timestamp > $1
                        UNION ALL
                        SELECT id::text, 'conv_' || id::text as conversation_id, user_id, 
                               user_message as message, robbie_response as response,
                               'neutral' as emotional_tone, timestamp, 
                               context_used::jsonb as metadata, 'conversation_history' as source_table
                        FROM ${this.tables.conversation_history}
                        WHERE timestamp > $1
                    ) combined
                    ORDER BY timestamp DESC
                `;
                params = [since];
            } else {
                query = `
                    SELECT * FROM (
                        SELECT id::text, conversation_id, user_id, message, response, 
                               emotional_tone, timestamp, metadata, 'conversation_memory' as source_table
                        FROM ${this.tables.conversation_memory}
                        WHERE id > $1
                        UNION ALL
                        SELECT id::text, 'conv_' || id::text as conversation_id, user_id, 
                               user_message as message, robbie_response as response,
                               'neutral' as emotional_tone, timestamp, 
                               context_used::jsonb as metadata, 'conversation_history' as source_table
                        FROM ${this.tables.conversation_history}
                        WHERE id > $1
                    ) combined
                    ORDER BY timestamp DESC
                `;
                params = [this.stats.lastProcessedId];
            }
            
            const result = await this.pool.query(query, params);
            const newMessages = result.rows;
            
            console.log(`📨 Found ${newMessages.length} new messages to process`);
            
            let stickiesGenerated = 0;
            
            for (const message of newMessages) {
                const result = await this._processConversation(message);
                stickiesGenerated += result.stickiesGenerated;
                
                // Update last processed ID
                this.stats.lastProcessedId = Math.max(this.stats.lastProcessedId, parseInt(message.id));
            }
            
            console.log(`✅ Processed ${newMessages.length} new messages, generated ${stickiesGenerated} sticky notes`);
            
            return {
                messagesProcessed: newMessages.length,
                stickiesGenerated
            };
            
        } catch (error) {
            console.error('❌ Error processing new messages:', error);
            throw error;
        }
    }

    async processRealTimeMessage(messageData) {
        try {
            // Process a single real-time message
            const metadata = {
                conversationId: messageData.conversation_id || `realtime_${Date.now()}`,
                userId: messageData.user_id || 'allan',
                emotionalTone: messageData.emotional_tone || 'neutral',
                timestamp: messageData.timestamp || new Date().toISOString(),
                sourceTable: 'realtime',
                realtime: true
            };
            
            const result = await this.stickySystem.processInput(
                'chat_message',
                `realtime_${Date.now()}`,
                messageData.message,
                metadata
            );
            
            if (result.processed && result.stickyCount > 0) {
                console.log(`🎯 Real-time opportunity detected: ${result.stickyCount} sticky notes generated`);
                this.emit('realTimeOpportunity', {
                    message: messageData.message,
                    stickies: result.stickies,
                    timestamp: new Date().toISOString()
                });
            }
            
            return result;
            
        } catch (error) {
            console.error('❌ Error processing real-time message:', error);
            throw error;
        }
    }

    async getActiveOpportunities(limit = 20) {
        return await this.stickySystem.getActiveStickies(null, limit);
    }

    async getFollowUpOpportunities() {
        return await this.stickySystem.getFollowUpStickies();
    }

    async markOpportunityActionTaken(stickyId, action, notes = null) {
        await this.stickySystem.markStickyActionTaken(stickyId, action, notes);
        
        // Also update in PostgreSQL if we want to track actions
        try {
            await this.pool.query(`
                INSERT INTO opportunity_actions (sticky_id, action, notes, created_at)
                VALUES ($1, $2, $3, NOW())
                ON CONFLICT (sticky_id) DO UPDATE SET
                    action = EXCLUDED.action,
                    notes = EXCLUDED.notes,
                    updated_at = NOW()
            `, [stickyId, action, notes]);
        } catch (error) {
            // Table might not exist yet, that's okay
            console.log('📋 opportunity_actions table not found, skipping PostgreSQL update');
        }
    }

    async getProcessingStats() {
        const stickyStats = await this.stickySystem.getProcessingStats();
        
        return {
            ...this.stats,
            ...stickyStats,
            databaseConnection: {
                host: this.config.host,
                database: this.config.database,
                connected: this.isInitialized
            }
        };
    }

    async searchConversationsForOpportunities(query, limit = 10) {
        try {
            // Search conversations that might contain opportunities
            const searchQuery = `
                SELECT 
                    id::text,
                    conversation_id,
                    user_id,
                    message,
                    response,
                    timestamp,
                    metadata
                FROM (
                    SELECT id, conversation_id, user_id, message, response, timestamp, metadata
                    FROM ${this.tables.conversation_memory}
                    WHERE message ILIKE $1 OR response ILIKE $1
                    UNION ALL
                    SELECT id, 'conv_' || id::text, user_id, user_message, robbie_response, timestamp, context_used::jsonb
                    FROM ${this.tables.conversation_history}
                    WHERE user_message ILIKE $1 OR robbie_response ILIKE $1
                ) combined
                ORDER BY timestamp DESC
                LIMIT $2
            `;
            
            const result = await this.pool.query(searchQuery, [`%${query}%`, limit]);
            
            // Process each result for opportunities
            const opportunities = [];
            for (const conversation of result.rows) {
                const content = `${conversation.message} ${conversation.response || ''}`.trim();
                
                const metadata = {
                    conversationId: conversation.conversation_id,
                    userId: conversation.user_id,
                    timestamp: conversation.timestamp,
                    searchQuery: query
                };
                
                const stickyResult = await this.stickySystem.processInput(
                    'search_result',
                    conversation.id,
                    content,
                    metadata
                );
                
                if (stickyResult.processed && stickyResult.stickyCount > 0) {
                    opportunities.push({
                        conversation: conversation,
                        stickies: stickyResult.stickies
                    });
                }
            }
            
            return opportunities;
            
        } catch (error) {
            console.error('❌ Error searching conversations:', error);
            throw error;
        }
    }

    async startRealTimeProcessing(intervalMs = 30000) {
        console.log(`🔄 Starting real-time processing every ${intervalMs}ms...`);
        
        const processNewMessages = async () => {
            try {
                await this.processNewMessages();
            } catch (error) {
                console.error('❌ Error in real-time processing:', error);
            }
        };
        
        // Process immediately
        await processNewMessages();
        
        // Set up interval
        this.realTimeInterval = setInterval(processNewMessages, intervalMs);
        
        console.log('✅ Real-time processing started');
    }

    stopRealTimeProcessing() {
        if (this.realTimeInterval) {
            clearInterval(this.realTimeInterval);
            this.realTimeInterval = null;
            console.log('🛑 Real-time processing stopped');
        }
    }

    async shutdown() {
        console.log('🛑 Shutting down PostgreSQL Chat Memory Integration...');
        
        this.stopRealTimeProcessing();
        
        if (this.stickySystem) {
            await this.stickySystem.shutdown();
        }
        
        if (this.pool) {
            await this.pool.end();
        }
        
        this.isInitialized = false;
        console.log('✅ PostgreSQL integration shutdown complete');
    }
}

export default PostgresStickyIntegration;
