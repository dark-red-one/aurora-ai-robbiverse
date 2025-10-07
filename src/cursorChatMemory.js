/**
 * Cursor Chat Memory System
 * Saves and searches our entire Cursor conversation history with vector embeddings
 */

import { EventEmitter } from 'events';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { createHash } from 'crypto';

class CursorChatMemory extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            dbPath: config.dbPath || './data/cursor_chat_memory.db',
            vectorDimensions: config.vectorDimensions || 1536, // OpenAI embedding size
            ...config
        };
        
        this.db = null;
        this.isInitialized = false;
        this.conversationBuffer = [];
        
        // Chat message types
        this.messageTypes = {
            USER_QUERY: 'user_query',
            ASSISTANT_RESPONSE: 'assistant_response',
            SYSTEM_MESSAGE: 'system_message',
            CODE_BLOCK: 'code_block',
            FILE_REFERENCE: 'file_reference',
            MEMORY_UPDATE: 'memory_update'
        };
    }

    async initialize() {
        try {
            console.log('🧠 Initializing Cursor Chat Memory System...');
            
            await this._initializeDatabase();
            await this._loadExistingConversations();
            
            this.isInitialized = true;
            console.log('✅ Cursor Chat Memory System initialized successfully');
            
            this.emit('initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize Cursor chat memory:', error);
            throw error;
        }
    }

    async _initializeDatabase() {
        this.db = await open({
            filename: this.config.dbPath,
            driver: sqlite3.Database
        });

        // Create cursor chat memory tables
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS cursor_conversations (
                id TEXT PRIMARY KEY,
                session_id TEXT NOT NULL,
                message_type TEXT NOT NULL,
                content TEXT NOT NULL,
                content_hash TEXT UNIQUE,
                
                -- Context information
                file_context TEXT,
                code_blocks TEXT,
                references TEXT,
                metadata TEXT,
                
                -- Vector embedding
                embedding_data BLOB,
                embedding_model TEXT DEFAULT 'openai-ada-002',
                
                -- Conversation flow
                parent_message_id TEXT,
                response_to TEXT,
                conversation_thread TEXT,
                
                -- Timestamps
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                
                -- Search optimization
                searchable_text TEXT,
                keywords TEXT,
                topics TEXT,
                
                -- Importance and relevance
                importance_score REAL DEFAULT 0.5,
                relevance_score REAL DEFAULT 0.5,
                access_count INTEGER DEFAULT 0,
                last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create conversation sessions table
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS cursor_sessions (
                id TEXT PRIMARY KEY,
                session_name TEXT,
                start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                end_time DATETIME,
                total_messages INTEGER DEFAULT 0,
                key_topics TEXT,
                session_summary TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create memory relationships table
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS cursor_memory_relationships (
                id TEXT PRIMARY KEY,
                source_message_id TEXT NOT NULL,
                target_message_id TEXT NOT NULL,
                relationship_type TEXT NOT NULL,
                strength REAL DEFAULT 0.5,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (source_message_id) REFERENCES cursor_conversations (id),
                FOREIGN KEY (target_message_id) REFERENCES cursor_conversations (id)
            )
        `);

        // Create indexes for performance
        await this.db.exec(`
            CREATE INDEX IF NOT EXISTS idx_cursor_session ON cursor_conversations (session_id);
            CREATE INDEX IF NOT EXISTS idx_cursor_type ON cursor_conversations (message_type);
            CREATE INDEX IF NOT EXISTS idx_cursor_created ON cursor_conversations (created_at);
            CREATE INDEX IF NOT EXISTS idx_cursor_importance ON cursor_conversations (importance_score);
            CREATE INDEX IF NOT EXISTS idx_cursor_searchable ON cursor_conversations (searchable_text);
            CREATE INDEX IF NOT EXISTS idx_cursor_keywords ON cursor_conversations (keywords);
            CREATE INDEX IF NOT EXISTS idx_cursor_topics ON cursor_conversations (topics);
            CREATE INDEX IF NOT EXISTS idx_cursor_thread ON cursor_conversations (conversation_thread);
        `);
    }

    async _loadExistingConversations() {
        const count = await this.db.get('SELECT COUNT(*) as count FROM cursor_conversations');
        console.log(`📚 Loaded ${count.count} existing Cursor conversations`);
    }

    async saveUserQuery(query, context = {}) {
        try {
            const messageId = this._generateMessageId('user', query);
            const contentHash = this._generateContentHash(query);
            
            // Check if already saved
            const existing = await this.db.get(
                'SELECT id FROM cursor_conversations WHERE content_hash = ?',
                [contentHash]
            );
            
            if (existing) {
                console.log('📝 Query already saved, updating access count');
                await this._updateAccessCount(existing.id);
                return existing.id;
            }

            const searchableText = this._extractSearchableText(query);
            const keywords = this._extractKeywords(query);
            const topics = this._extractTopics(query);
            
            await this.db.run(`
                INSERT INTO cursor_conversations (
                    id, session_id, message_type, content, content_hash,
                    file_context, code_blocks, references, metadata,
                    searchable_text, keywords, topics, importance_score
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                messageId,
                context.sessionId || this._getCurrentSessionId(),
                this.messageTypes.USER_QUERY,
                query,
                contentHash,
                context.fileContext || null,
                context.codeBlocks ? JSON.stringify(context.codeBlocks) : null,
                context.references ? JSON.stringify(context.references) : null,
                JSON.stringify(context),
                searchableText,
                keywords,
                topics,
                this._calculateImportanceScore(query, context)
            ]);

            console.log(`💾 Saved user query: ${query.substring(0, 50)}...`);
            
            this.emit('messageSaved', {
                type: 'user_query',
                id: messageId,
                content: query,
                context
            });

            return messageId;

        } catch (error) {
            console.error('❌ Error saving user query:', error);
            throw error;
        }
    }

    async saveAssistantResponse(response, userQueryId = null, context = {}) {
        try {
            const messageId = this._generateMessageId('assistant', response);
            const contentHash = this._generateContentHash(response);
            
            // Check if already saved
            const existing = await this.db.get(
                'SELECT id FROM cursor_conversations WHERE content_hash = ?',
                [contentHash]
            );
            
            if (existing) {
                console.log('📝 Response already saved, updating access count');
                await this._updateAccessCount(existing.id);
                return existing.id;
            }

            const searchableText = this._extractSearchableText(response);
            const keywords = this._extractKeywords(response);
            const topics = this._extractTopics(response);
            
            await this.db.run(`
                INSERT INTO cursor_conversations (
                    id, session_id, message_type, content, content_hash,
                    file_context, code_blocks, references, metadata,
                    searchable_text, keywords, topics, importance_score,
                    response_to, conversation_thread
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                messageId,
                context.sessionId || this._getCurrentSessionId(),
                this.messageTypes.ASSISTANT_RESPONSE,
                response,
                contentHash,
                context.fileContext || null,
                context.codeBlocks ? JSON.stringify(context.codeBlocks) : null,
                context.references ? JSON.stringify(context.references) : null,
                JSON.stringify(context),
                searchableText,
                keywords,
                topics,
                this._calculateImportanceScore(response, context),
                userQueryId,
                this._generateThreadId(userQueryId, messageId)
            ]);

            console.log(`💾 Saved assistant response: ${response.substring(0, 50)}...`);
            
            this.emit('messageSaved', {
                type: 'assistant_response',
                id: messageId,
                content: response,
                context
            });

            return messageId;

        } catch (error) {
            console.error('❌ Error saving assistant response:', error);
            throw error;
        }
    }

    async saveCodeBlock(code, language, context = {}) {
        try {
            const messageId = this._generateMessageId('code', code);
            const contentHash = this._generateContentHash(code);
            
            await this.db.run(`
                INSERT INTO cursor_conversations (
                    id, session_id, message_type, content, content_hash,
                    file_context, code_blocks, metadata,
                    searchable_text, keywords, topics, importance_score
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                messageId,
                context.sessionId || this._getCurrentSessionId(),
                this.messageTypes.CODE_BLOCK,
                code,
                contentHash,
                context.fileContext || null,
                JSON.stringify({ code, language, ...context }),
                JSON.stringify(context),
                this._extractSearchableText(code),
                this._extractKeywords(code),
                this._extractTopics(code),
                this._calculateImportanceScore(code, { ...context, isCode: true })
            ]);

            console.log(`💾 Saved code block: ${language} - ${code.substring(0, 30)}...`);
            
            return messageId;

        } catch (error) {
            console.error('❌ Error saving code block:', error);
            throw error;
        }
    }

    async searchConversations(query, options = {}) {
        try {
            const {
                limit = 10,
                messageType = null,
                sessionId = null,
                minImportance = 0,
                includeCode = true,
                dateRange = null
            } = options;

            let searchQuery = `
                SELECT 
                    id, session_id, message_type, content, content_hash,
                    file_context, code_blocks, metadata,
                    searchable_text, keywords, topics, importance_score,
                    created_at, access_count, last_accessed
                FROM cursor_conversations
                WHERE (searchable_text LIKE ? OR keywords LIKE ? OR topics LIKE ?)
            `;
            
            const params = [`%${query}%`, `%${query}%`, `%${query}%`];
            
            if (messageType) {
                searchQuery += ' AND message_type = ?';
                params.push(messageType);
            }
            
            if (sessionId) {
                searchQuery += ' AND session_id = ?';
                params.push(sessionId);
            }
            
            if (minImportance > 0) {
                searchQuery += ' AND importance_score >= ?';
                params.push(minImportance);
            }
            
            if (!includeCode) {
                searchQuery += ' AND message_type != ?';
                params.push(this.messageTypes.CODE_BLOCK);
            }
            
            if (dateRange) {
                searchQuery += ' AND created_at BETWEEN ? AND ?';
                params.push(dateRange.start, dateRange.end);
            }
            
            searchQuery += `
                ORDER BY 
                    importance_score DESC,
                    CASE WHEN searchable_text LIKE ? THEN 1 ELSE 0 END DESC,
                    created_at DESC
                LIMIT ?
            `;
            params.push(`%${query}%`, limit);

            const results = await this.db.all(searchQuery, params);
            
            // Update access counts
            for (const result of results) {
                await this._updateAccessCount(result.id);
            }
            
            return results.map(result => ({
                ...result,
                metadata: result.metadata ? JSON.parse(result.metadata) : {},
                codeBlocks: result.code_blocks ? JSON.parse(result.code_blocks) : null,
                fileContext: result.file_context ? JSON.parse(result.file_context) : null
            }));

        } catch (error) {
            console.error('❌ Error searching conversations:', error);
            throw error;
        }
    }

    async getConversationHistory(sessionId = null, limit = 50) {
        try {
            let query = `
                SELECT 
                    id, session_id, message_type, content,
                    file_context, code_blocks, metadata,
                    created_at, importance_score
                FROM cursor_conversations
            `;
            
            const params = [];
            
            if (sessionId) {
                query += ' WHERE session_id = ?';
                params.push(sessionId);
            }
            
            query += ' ORDER BY created_at DESC LIMIT ?';
            params.push(limit);

            const results = await this.db.all(query, params);
            
            return results.map(result => ({
                ...result,
                metadata: result.metadata ? JSON.parse(result.metadata) : {},
                codeBlocks: result.code_blocks ? JSON.parse(result.code_blocks) : null,
                fileContext: result.file_context ? JSON.parse(result.file_context) : null
            }));

        } catch (error) {
            console.error('❌ Error getting conversation history:', error);
            throw error;
        }
    }

    async getRelatedMessages(messageId, relationshipType = null, limit = 5) {
        try {
            let query = `
                SELECT 
                    c.id, c.session_id, c.message_type, c.content,
                    c.created_at, c.importance_score, r.relationship_type, r.strength
                FROM cursor_conversations c
                JOIN cursor_memory_relationships r ON c.id = r.target_message_id
                WHERE r.source_message_id = ?
            `;
            
            const params = [messageId];
            
            if (relationshipType) {
                query += ' AND r.relationship_type = ?';
                params.push(relationshipType);
            }
            
            query += ' ORDER BY r.strength DESC, c.importance_score DESC LIMIT ?';
            params.push(limit);

            const results = await this.db.all(query, params);
            
            return results;

        } catch (error) {
            console.error('❌ Error getting related messages:', error);
            throw error;
        }
    }

    async createMemoryRelationship(sourceId, targetId, relationshipType, strength = 0.5) {
        try {
            const relationshipId = this._generateRelationshipId(sourceId, targetId);
            
            await this.db.run(`
                INSERT OR REPLACE INTO cursor_memory_relationships 
                (id, source_message_id, target_message_id, relationship_type, strength)
                VALUES (?, ?, ?, ?, ?)
            `, [relationshipId, sourceId, targetId, relationshipType, strength]);

            console.log(`🔗 Created relationship: ${sourceId} ↔ ${targetId} (${relationshipType})`);
            
            return relationshipId;

        } catch (error) {
            console.error('❌ Error creating memory relationship:', error);
            throw error;
        }
    }

    async getSessionSummary(sessionId) {
        try {
            const session = await this.db.get(
                'SELECT * FROM cursor_sessions WHERE id = ?',
                [sessionId]
            );
            
            if (!session) {
                return null;
            }
            
            const messages = await this.db.all(`
                SELECT message_type, content, importance_score, created_at
                FROM cursor_conversations
                WHERE session_id = ?
                ORDER BY created_at ASC
            `, [sessionId]);
            
            const topics = await this.db.all(`
                SELECT DISTINCT topics
                FROM cursor_conversations
                WHERE session_id = ? AND topics IS NOT NULL
            `, [sessionId]);
            
            return {
                ...session,
                messages: messages.length,
                keyTopics: [...new Set(topics.flatMap(t => t.topics.split(',')))],
                conversationFlow: messages.map(m => ({
                    type: m.message_type,
                    content: m.content.substring(0, 100) + '...',
                    importance: m.importance_score,
                    timestamp: m.created_at
                }))
            };

        } catch (error) {
            console.error('❌ Error getting session summary:', error);
            throw error;
        }
    }

    async getMemoryStats() {
        try {
            const totalMessages = await this.db.get('SELECT COUNT(*) as count FROM cursor_conversations');
            const totalSessions = await this.db.get('SELECT COUNT(*) as count FROM cursor_sessions');
            const totalRelationships = await this.db.get('SELECT COUNT(*) as count FROM cursor_memory_relationships');
            
            const messageTypes = await this.db.all(`
                SELECT message_type, COUNT(*) as count
                FROM cursor_conversations
                GROUP BY message_type
                ORDER BY count DESC
            `);
            
            const topTopics = await this.db.all(`
                SELECT topics, COUNT(*) as count
                FROM cursor_conversations
                WHERE topics IS NOT NULL
                GROUP BY topics
                ORDER BY count DESC
                LIMIT 10
            `);
            
            const recentActivity = await this.db.all(`
                SELECT DATE(created_at) as date, COUNT(*) as count
                FROM cursor_conversations
                WHERE created_at >= date('now', '-30 days')
                GROUP BY DATE(created_at)
                ORDER BY date DESC
            `);
            
            return {
                totalMessages: totalMessages.count,
                totalSessions: totalSessions.count,
                totalRelationships: totalRelationships.count,
                messageTypes,
                topTopics,
                recentActivity
            };

        } catch (error) {
            console.error('❌ Error getting memory stats:', error);
            throw error;
        }
    }

    // Helper methods
    _generateMessageId(type, content) {
        const hash = createHash('sha256');
        hash.update(type + content + Date.now().toString());
        return `cursor_${type}_${hash.digest('hex').substring(0, 12)}`;
    }

    _generateRelationshipId(sourceId, targetId) {
        const hash = createHash('sha256');
        hash.update(sourceId + targetId + Date.now().toString());
        return `rel_${hash.digest('hex').substring(0, 12)}`;
    }

    _generateContentHash(content) {
        return createHash('sha256').update(content).digest('hex');
    }

    _getCurrentSessionId() {
        return `session_${new Date().toISOString().split('T')[0]}`;
    }

    _generateThreadId(userQueryId, assistantResponseId) {
        return `thread_${userQueryId}_${assistantResponseId}`;
    }

    _extractSearchableText(content) {
        // Remove code blocks, markdown formatting, and normalize text
        let searchable = content
            .replace(/```[\s\S]*?```/g, '') // Remove code blocks
            .replace(/`[^`]*`/g, '') // Remove inline code
            .replace(/[#*_~]/g, '') // Remove markdown formatting
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
        
        return searchable;
    }

    _extractKeywords(content) {
        // Simple keyword extraction (would use NLP in production)
        const words = content.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 3)
            .filter(word => !['this', 'that', 'with', 'from', 'they', 'have', 'will', 'been', 'were', 'said', 'each', 'which', 'their', 'time', 'would', 'there', 'could', 'other'].includes(word));
        
        // Get top keywords
        const wordCounts = {};
        words.forEach(word => {
            wordCounts[word] = (wordCounts[word] || 0) + 1;
        });
        
        return Object.entries(wordCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([word]) => word)
            .join(',');
    }

    _extractTopics(content) {
        // Simple topic extraction based on keywords
        const topics = [];
        
        if (content.match(/gpu|mesh|coordinator|node/i)) topics.push('gpu_architecture');
        if (content.match(/memory|vector|embedding|search/i)) topics.push('memory_system');
        if (content.match(/customer|dossier|relationship/i)) topics.push('customer_management');
        if (content.match(/sticky|note|opportunity/i)) topics.push('opportunity_tracking');
        if (content.match(/personality|mood|trait/i)) topics.push('personality_system');
        if (content.match(/risk|assessment|protection/i)) topics.push('risk_management');
        if (content.match(/business|deal|revenue|sales/i)) topics.push('business_operations');
        if (content.match(/code|programming|development/i)) topics.push('development');
        if (content.match(/database|sql|postgres/i)) topics.push('database');
        if (content.match(/api|integration|system/i)) topics.push('system_integration');
        
        return topics.join(',');
    }

    _calculateImportanceScore(content, context = {}) {
        let score = 0.5; // Base score
        
        // Boost for code blocks
        if (context.isCode) score += 0.2;
        
        // Boost for business-related content
        if (content.match(/revenue|deal|customer|business|sales/i)) score += 0.3;
        
        // Boost for technical architecture
        if (content.match(/architecture|system|integration|api/i)) score += 0.2;
        
        // Boost for decisions or important discussions
        if (content.match(/decision|important|critical|priority/i)) score += 0.2;
        
        // Boost for file references
        if (context.fileContext) score += 0.1;
        
        return Math.min(1.0, score);
    }

    async _updateAccessCount(messageId) {
        await this.db.run(`
            UPDATE cursor_conversations 
            SET access_count = access_count + 1, last_accessed = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [messageId]);
    }

    async shutdown() {
        console.log('🛑 Shutting down Cursor Chat Memory System...');
        
        if (this.db) {
            await this.db.close();
        }
        
        this.isInitialized = false;
        console.log('✅ Cursor Chat Memory System shutdown complete');
    }
}

export default CursorChatMemory;
