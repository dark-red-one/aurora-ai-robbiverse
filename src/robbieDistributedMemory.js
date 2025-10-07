/**
 * Aurora AI Distributed Memory System
 * FAISS-based vector storage with cross-device synchronization
 */

import { createHash } from 'crypto';
import { EventEmitter } from 'events';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

class RobbieDistributedMemory extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            dbPath: config.dbPath || './data/robbie_memory.db',
            vectorDimensions: config.vectorDimensions || 768,
            maxMemoryItems: config.maxMemoryItems || 10000,
            retentionDays: {
                shortTerm: 1,      // 24 hours
                mediumTerm: 30,    // 30 days
                longTerm: 365      // 1 year
            },
            ...config
        };
        
        this.db = null;
        this.vectorStore = null;
        this.memoryCache = new Map();
        this.syncQueue = [];
        this.isInitialized = false;
        
        // Memory categories
        this.categories = {
            CONVERSATION: 'conversation',
            BUSINESS_CONTEXT: 'business_context',
            CUSTOMER_PROFILE: 'customer_profile',
            DEAL_INFORMATION: 'deal_information',
            EXPERT_KNOWLEDGE: 'expert_knowledge',
            EMERGENCY_CONTEXT: 'emergency_context'
        };
        
        // Memory importance levels
        this.importanceLevels = {
            CRITICAL: 1,    // Revenue-critical, emergency info
            HIGH: 2,        // Business operations, VIP customers
            MEDIUM: 3,      // Standard interactions
            LOW: 4          // Background analysis
        };
    }

    async initialize() {
        try {
            console.log('🧠 Initializing Robbie Distributed Memory System...');
            
            // Initialize database
            await this._initializeDatabase();
            
            // Initialize vector store (FAISS-like implementation)
            await this._initializeVectorStore();
            
            // Load existing memories
            await this._loadMemoryCache();
            
            // Start background processes
            this._startBackgroundProcesses();
            
            this.isInitialized = true;
            console.log('✅ Robbie Distributed Memory System initialized successfully');
            
            this.emit('initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize memory system:', error);
            throw error;
        }
    }

    async _initializeDatabase() {
        this.db = await open({
            filename: this.config.dbPath,
            driver: sqlite3.Database
        });

        // Create memory tables
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS memory_items (
                id TEXT PRIMARY KEY,
                content TEXT NOT NULL,
                category TEXT NOT NULL,
                importance_level INTEGER NOT NULL,
                vector_data BLOB,
                metadata TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP,
                access_count INTEGER DEFAULT 0,
                retention_days INTEGER DEFAULT 30,
                device_id TEXT,
                sync_status TEXT DEFAULT 'pending'
            )
        `);

        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS memory_relationships (
                id TEXT PRIMARY KEY,
                memory_id_1 TEXT NOT NULL,
                memory_id_2 TEXT NOT NULL,
                relationship_type TEXT NOT NULL,
                strength REAL DEFAULT 0.5,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (memory_id_1) REFERENCES memory_items (id),
                FOREIGN KEY (memory_id_2) REFERENCES memory_items (id)
            )
        `);

        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS sync_log (
                id TEXT PRIMARY KEY,
                device_id TEXT NOT NULL,
                operation TEXT NOT NULL,
                memory_id TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'pending',
                conflict_resolution TEXT
            )
        `);

        // Create indexes for performance
        await this.db.exec(`
            CREATE INDEX IF NOT EXISTS idx_memory_category ON memory_items (category);
            CREATE INDEX IF NOT EXISTS idx_memory_importance ON memory_items (importance_level);
            CREATE INDEX IF NOT EXISTS idx_memory_created ON memory_items (created_at);
            CREATE INDEX IF NOT EXISTS idx_memory_accessed ON memory_items (last_accessed);
        `);
    }

    async _initializeVectorStore() {
        // Simple vector store implementation (would use FAISS in production)
        this.vectorStore = new Map();
        this.vectorIndex = [];
        
        // Load existing vectors from database
        const memories = await this.db.all('SELECT id, vector_data FROM memory_items WHERE vector_data IS NOT NULL');
        
        for (const memory of memories) {
            if (memory.vector_data) {
                const vector = JSON.parse(memory.vector_data);
                this.vectorStore.set(memory.id, vector);
                this.vectorIndex.push({ id: memory.id, vector });
            }
        }
        
        console.log(`📊 Loaded ${this.vectorIndex.length} vectors into memory store`);
    }

    async _loadMemoryCache() {
        // Load recent and important memories into cache
        const recentMemories = await this.db.all(`
            SELECT * FROM memory_items 
            WHERE importance_level <= 2 
               OR last_accessed > datetime('now', '-7 days')
            ORDER BY importance_level ASC, last_accessed DESC
            LIMIT 1000
        `);

        for (const memory of recentMemories) {
            this.memoryCache.set(memory.id, {
                ...memory,
                metadata: memory.metadata ? JSON.parse(memory.metadata) : {},
                vector: memory.vector_data ? JSON.parse(memory.vector_data) : null
            });
        }

        console.log(`💾 Loaded ${this.memoryCache.size} memories into cache`);
    }

    async storeMemory(content, category, importanceLevel = this.importanceLevels.MEDIUM, metadata = {}) {
        if (!this.isInitialized) {
            throw new Error('Memory system not initialized');
        }

        try {
            // Generate unique ID
            const memoryId = this._generateMemoryId(content, category);
            
            // Create vector embedding (simplified - would use real embedding model)
            const vector = await this._createEmbedding(content);
            
            // Determine retention period based on importance
            const retentionDays = this._getRetentionDays(importanceLevel);
            
            // Store in database
            await this.db.run(`
                INSERT OR REPLACE INTO memory_items 
                (id, content, category, importance_level, vector_data, metadata, retention_days, device_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                memoryId,
                content,
                category,
                importanceLevel,
                JSON.stringify(vector),
                JSON.stringify(metadata),
                retentionDays,
                this._getDeviceId()
            ]);

            // Store in vector store
            this.vectorStore.set(memoryId, vector);
            this.vectorIndex.push({ id: memoryId, vector });

            // Cache important memories
            if (importanceLevel <= 2) {
                this.memoryCache.set(memoryId, {
                    id: memoryId,
                    content,
                    category,
                    importanceLevel,
                    vector,
                    metadata,
                    created_at: new Date().toISOString(),
                    last_accessed: new Date().toISOString(),
                    access_count: 0
                });
            }

            // Queue for sync
            this._queueForSync(memoryId, 'store');

            this.emit('memoryStored', { memoryId, category, importanceLevel });
            
            console.log(`💾 Stored memory: ${category} (importance: ${importanceLevel})`);
            
            return memoryId;

        } catch (error) {
            console.error('❌ Error storing memory:', error);
            throw error;
        }
    }

    async retrieveMemory(query, category = null, limit = 10, minImportance = null) {
        if (!this.isInitialized) {
            throw new Error('Memory system not initialized');
        }

        try {
            // Create query vector
            const queryVector = await this._createEmbedding(query);
            
            // Search vector store
            const vectorResults = this._searchVectors(queryVector, limit * 2);
            
            // Filter and rank results
            let results = [];
            
            for (const result of vectorResults) {
                const memory = await this._getMemoryById(result.id);
                
                if (memory && this._matchesFilters(memory, category, minImportance)) {
                    // Update access statistics
                    await this._updateAccessStats(result.id);
                    
                    // Calculate relevance score
                    const relevanceScore = this._calculateRelevanceScore(query, memory.content, result.similarity);
                    
                    results.push({
                        ...memory,
                        relevanceScore,
                        similarity: result.similarity
                    });
                }
            }
            
            // Sort by relevance and importance
            results.sort((a, b) => {
                const scoreA = a.relevanceScore + (5 - a.importanceLevel) * 0.1;
                const scoreB = b.relevanceScore + (5 - b.importanceLevel) * 0.1;
                return scoreB - scoreA;
            });

            return results.slice(0, limit);

        } catch (error) {
            console.error('❌ Error retrieving memory:', error);
            throw error;
        }
    }

    async getContextualMemory(context, maxItems = 5) {
        // Get memories relevant to current context
        const memories = await this.retrieveMemory(context, null, maxItems * 2);
        
        // Group by category and importance
        const contextualMemories = {
            business: [],
            customer: [],
            emergency: [],
            general: []
        };

        for (const memory of memories) {
            if (memory.category === this.categories.BUSINESS_CONTEXT || 
                memory.category === this.categories.DEAL_INFORMATION) {
                contextualMemories.business.push(memory);
            } else if (memory.category === this.categories.CUSTOMER_PROFILE) {
                contextualMemories.customer.push(memory);
            } else if (memory.category === this.categories.EMERGENCY_CONTEXT) {
                contextualMemories.emergency.push(memory);
            } else {
                contextualMemories.general.push(memory);
            }
        }

        // Return top memories from each category
        return {
            business: contextualMemories.business.slice(0, maxItems),
            customer: contextualMemories.customer.slice(0, maxItems),
            emergency: contextualMemories.emergency.slice(0, maxItems),
            general: contextualMemories.general.slice(0, maxItems)
        };
    }

    async createMemoryRelationship(memoryId1, memoryId2, relationshipType, strength = 0.5) {
        try {
            const relationshipId = this._generateMemoryId(`${memoryId1}-${memoryId2}-${relationshipType}`, 'relationship');
            
            await this.db.run(`
                INSERT OR REPLACE INTO memory_relationships 
                (id, memory_id_1, memory_id_2, relationship_type, strength)
                VALUES (?, ?, ?, ?, ?)
            `, [relationshipId, memoryId1, memoryId2, relationshipType, strength]);

            console.log(`🔗 Created relationship: ${memoryId1} ↔ ${memoryId2} (${relationshipType})`);
            
            return relationshipId;

        } catch (error) {
            console.error('❌ Error creating memory relationship:', error);
            throw error;
        }
    }

    async getRelatedMemories(memoryId, relationshipType = null, limit = 5) {
        try {
            let query = `
                SELECT m.*, r.relationship_type, r.strength
                FROM memory_items m
                JOIN memory_relationships r ON (m.id = r.memory_id_2)
                WHERE r.memory_id_1 = ?
            `;
            
            const params = [memoryId];
            
            if (relationshipType) {
                query += ' AND r.relationship_type = ?';
                params.push(relationshipType);
            }
            
            query += ' ORDER BY r.strength DESC, m.importance_level ASC LIMIT ?';
            params.push(limit);
            
            const relationships = await this.db.all(query, params);
            
            return relationships.map(rel => ({
                ...rel,
                metadata: rel.metadata ? JSON.parse(rel.metadata) : {},
                vector: rel.vector_data ? JSON.parse(rel.vector_data) : null
            }));

        } catch (error) {
            console.error('❌ Error getting related memories:', error);
            throw error;
        }
    }

    async syncWithDevice(deviceId, lastSyncTime = null) {
        try {
            console.log(`🔄 Syncing with device: ${deviceId}`);
            
            // Get pending sync operations
            const pendingOps = await this.db.all(`
                SELECT * FROM sync_log 
                WHERE device_id = ? AND status = 'pending'
                ORDER BY timestamp ASC
            `, [deviceId]);

            // Get memories modified since last sync
            let memoryQuery = `
                SELECT * FROM memory_items 
                WHERE device_id != ? OR device_id IS NULL
            `;
            const memoryParams = [deviceId];
            
            if (lastSyncTime) {
                memoryQuery += ' AND created_at > ?';
                memoryParams.push(lastSyncTime);
            }
            
            memoryQuery += ' ORDER BY created_at DESC LIMIT 100';
            
            const newMemories = await this.db.all(memoryQuery, memoryParams);
            
            // Handle conflicts and merge
            const syncResults = await this._handleSyncConflicts(deviceId, newMemories, pendingOps);
            
            // Update sync status
            for (const result of syncResults) {
                await this.db.run(`
                    INSERT OR REPLACE INTO sync_log 
                    (id, device_id, operation, memory_id, timestamp, status, conflict_resolution)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `, [
                    this._generateMemoryId(`${deviceId}-${result.memoryId}-${Date.now()}`, 'sync'),
                    deviceId,
                    result.operation,
                    result.memoryId,
                    new Date().toISOString(),
                    'completed',
                    result.conflictResolution
                ]);
            }

            console.log(`✅ Synced ${syncResults.length} operations with device ${deviceId}`);
            
            return {
                syncedMemories: newMemories.length,
                pendingOperations: pendingOps.length,
                conflictsResolved: syncResults.filter(r => r.conflictResolution).length
            };

        } catch (error) {
            console.error('❌ Error syncing with device:', error);
            throw error;
        }
    }

    // Helper methods
    _generateMemoryId(content, category) {
        const hash = createHash('sha256');
        hash.update(content + category + Date.now().toString());
        return hash.digest('hex').substring(0, 16);
    }

    _getDeviceId() {
        return process.env.DEVICE_ID || 'aurora-main';
    }

    async _createEmbedding(text) {
        // Simplified embedding (would use real embedding model in production)
        const words = text.toLowerCase().split(/\s+/);
        const embedding = new Array(this.config.vectorDimensions).fill(0);
        
        for (const word of words) {
            const hash = createHash('md5').update(word).digest('hex');
            const index = parseInt(hash.substring(0, 8), 16) % this.config.vectorDimensions;
            embedding[index] += 1;
        }
        
        // Normalize vector
        const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
        return embedding.map(val => val / magnitude);
    }

    _searchVectors(queryVector, limit) {
        const results = [];
        
        for (const item of this.vectorIndex) {
            const similarity = this._cosineSimilarity(queryVector, item.vector);
            if (similarity > 0.1) { // Minimum similarity threshold
                results.push({ id: item.id, similarity });
            }
        }
        
        results.sort((a, b) => b.similarity - a.similarity);
        return results.slice(0, limit);
    }

    _cosineSimilarity(vecA, vecB) {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }
        
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    _getRetentionDays(importanceLevel) {
        if (importanceLevel === this.importanceLevels.CRITICAL) {
            return this.config.retentionDays.longTerm;
        } else if (importanceLevel === this.importanceLevels.HIGH) {
            return this.config.retentionDays.mediumTerm;
        } else {
            return this.config.retentionDays.shortTerm;
        }
    }

    _matchesFilters(memory, category, minImportance) {
        if (category && memory.category !== category) {
            return false;
        }
        
        if (minImportance && memory.importanceLevel > minImportance) {
            return false;
        }
        
        return true;
    }

    _calculateRelevanceScore(query, content, similarity) {
        // Simple relevance scoring (would be more sophisticated in production)
        const queryWords = query.toLowerCase().split(/\s+/);
        const contentWords = content.toLowerCase().split(/\s+/);
        
        let wordMatches = 0;
        for (const word of queryWords) {
            if (contentWords.includes(word)) {
                wordMatches++;
            }
        }
        
        const wordScore = wordMatches / queryWords.length;
        return (wordScore * 0.7) + (similarity * 0.3);
    }

    async _getMemoryById(memoryId) {
        // Check cache first
        if (this.memoryCache.has(memoryId)) {
            return this.memoryCache.get(memoryId);
        }
        
        // Load from database
        const memory = await this.db.get('SELECT * FROM memory_items WHERE id = ?', [memoryId]);
        
        if (memory) {
            return {
                ...memory,
                metadata: memory.metadata ? JSON.parse(memory.metadata) : {},
                vector: memory.vector_data ? JSON.parse(memory.vector_data) : null
            };
        }
        
        return null;
    }

    async _updateAccessStats(memoryId) {
        await this.db.run(`
            UPDATE memory_items 
            SET last_accessed = CURRENT_TIMESTAMP, access_count = access_count + 1
            WHERE id = ?
        `, [memoryId]);
    }

    _queueForSync(memoryId, operation) {
        this.syncQueue.push({
            memoryId,
            operation,
            timestamp: new Date().toISOString()
        });
    }

    async _handleSyncConflicts(deviceId, newMemories, pendingOps) {
        const results = [];
        
        for (const memory of newMemories) {
            results.push({
                memoryId: memory.id,
                operation: 'sync',
                conflictResolution: null
            });
        }
        
        return results;
    }

    _startBackgroundProcesses() {
        // Memory cleanup process
        setInterval(async () => {
            try {
                await this._cleanupExpiredMemories();
            } catch (error) {
                console.error('❌ Error in memory cleanup:', error);
            }
        }, 3600000); // Every hour

        // Sync process
        setInterval(async () => {
            try {
                await this._processSyncQueue();
            } catch (error) {
                console.error('❌ Error in sync process:', error);
            }
        }, 300000); // Every 5 minutes
    }

    async _cleanupExpiredMemories() {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 30); // 30 days ago
        
        const result = await this.db.run(`
            DELETE FROM memory_items 
            WHERE created_at < ? AND importance_level > 2
        `, [cutoffDate.toISOString()]);
        
        if (result.changes > 0) {
            console.log(`🧹 Cleaned up ${result.changes} expired memories`);
        }
    }

    async _processSyncQueue() {
        if (this.syncQueue.length === 0) {
            return;
        }
        
        console.log(`🔄 Processing ${this.syncQueue.length} sync operations`);
        
        // Process sync queue (simplified implementation)
        this.syncQueue = [];
    }

    async shutdown() {
        console.log('🛑 Shutting down Robbie Distributed Memory System...');
        
        if (this.db) {
            await this.db.close();
        }
        
        this.isInitialized = false;
        console.log('✅ Memory system shutdown complete');
    }
}

export default RobbieDistributedMemory;
