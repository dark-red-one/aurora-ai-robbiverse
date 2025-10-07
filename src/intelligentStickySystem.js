/**
 * Aurora AI Intelligent Sticky Note System
 * Automatically generates sticky notes from all Robbie inputs based on relevance, importance, and urgency
 */

import { EventEmitter } from 'events';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import RobbieDistributedMemory from './robbieDistributedMemory.js';
import CustomerDossier from './customerDossier.js';

class IntelligentStickySystem extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            dbPath: config.dbPath || './data/intelligent_stickies.db',
            memorySystem: null,
            customerDossier: null,
            ...config
        };
        
        this.db = null;
        this.isInitialized = false;
        
        // Opportunity detection patterns
        this.opportunityPatterns = {
            FUNDING: [
                /raising.*\$[\d,]+(?:k|m|b)/i,
                /funding.*round/i,
                /series.*[abc]/i,
                /investment.*\$[\d,]+/i,
                /vc.*funding/i,
                /angel.*investment/i,
                /seed.*round/i
            ],
            BUDGET: [
                /budget.*next.*year/i,
                /more.*budget/i,
                /increased.*budget/i,
                /budget.*increase/i,
                /spending.*more/i,
                /investment.*plan/i
            ],
            EXPANSION: [
                /hiring.*team/i,
                /expanding.*team/i,
                /new.*hires/i,
                /growing.*team/i,
                /scaling.*up/i,
                /expansion.*plan/i
            ],
            TIMING: [
                /next.*quarter/i,
                /next.*year/i,
                /in.*6.*months/i,
                /timeline.*change/i,
                /sooner.*than.*expected/i,
                /accelerating/i
            ],
            DECISION_MAKERS: [
                /ceo.*interested/i,
                /founder.*wants/i,
                /board.*decision/i,
                /executive.*team/i,
                /leadership.*change/i,
                /new.*vp/i
            ],
            COMPETITIVE: [
                /competitor.*failed/i,
                /switching.*from/i,
                /dissatisfied.*with/i,
                /looking.*for.*alternative/i,
                /current.*solution.*issues/i
            ],
            URGENCY: [
                /urgent/i,
                /asap/i,
                /immediately/i,
                /rush/i,
                /deadline.*approaching/i,
                /time.*sensitive/i
            ]
        };
        
        // Sticky note categories
        this.categories = {
            OPPORTUNITY: 'opportunity',
            FOLLOW_UP: 'follow_up',
            DEAL_INTEL: 'deal_intel',
            RELATIONSHIP: 'relationship',
            COMPETITIVE: 'competitive',
            TIMING: 'timing',
            URGENT: 'urgent'
        };
        
        // Importance scoring weights
        this.importanceWeights = {
            REVENUE_IMPACT: 0.4,
            URGENCY: 0.3,
            RELATIONSHIP_VALUE: 0.2,
            COMPETITIVE_ADVANTAGE: 0.1
        };
    }

    async initialize() {
        try {
            console.log('📝 Initializing Intelligent Sticky System...');
            
            await this._initializeDatabase();
            await this._initializeMemorySystem();
            
            this.isInitialized = true;
            console.log('✅ Intelligent Sticky System initialized successfully');
            
            this.emit('initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize intelligent sticky system:', error);
            throw error;
        }
    }

    async _initializeDatabase() {
        this.db = await open({
            filename: this.config.dbPath,
            driver: sqlite3.Database
        });

        // Create intelligent stickies table
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS intelligent_stickies (
                id TEXT PRIMARY KEY,
                source_type TEXT NOT NULL,
                source_id TEXT,
                original_content TEXT NOT NULL,
                extracted_opportunity TEXT NOT NULL,
                category TEXT NOT NULL,
                importance_score REAL NOT NULL,
                urgency_score REAL NOT NULL,
                relevance_score REAL NOT NULL,
                
                -- Opportunity details
                opportunity_type TEXT,
                estimated_value REAL,
                timeline TEXT,
                key_people TEXT,
                company TEXT,
                contact_email TEXT,
                
                -- Processing metadata
                processed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                confidence_score REAL DEFAULT 0.0,
                false_positive BOOLEAN DEFAULT FALSE,
                manually_reviewed BOOLEAN DEFAULT FALSE,
                
                -- Memory system integration
                memory_ids TEXT,
                customer_dossier_id TEXT,
                
                -- Status tracking
                status TEXT DEFAULT 'active',
                action_taken TEXT,
                follow_up_date DATE,
                
                -- Metadata
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create source tracking table
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS processed_sources (
                id TEXT PRIMARY KEY,
                source_type TEXT NOT NULL,
                source_id TEXT NOT NULL,
                content_hash TEXT NOT NULL,
                processed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                sticky_count INTEGER DEFAULT 0,
                UNIQUE(source_type, source_id)
            )
        `);

        // Create indexes
        await this.db.exec(`
            CREATE INDEX IF NOT EXISTS idx_sticky_category ON intelligent_stickies (category);
            CREATE INDEX IF NOT EXISTS idx_sticky_importance ON intelligent_stickies (importance_score);
            CREATE INDEX IF NOT EXISTS idx_sticky_urgency ON intelligent_stickies (urgency_score);
            CREATE INDEX IF NOT EXISTS idx_sticky_status ON intelligent_stickies (status);
            CREATE INDEX IF NOT EXISTS idx_sticky_company ON intelligent_stickies (company);
            CREATE INDEX IF NOT EXISTS idx_sticky_follow_up ON intelligent_stickies (follow_up_date);
            CREATE INDEX IF NOT EXISTS idx_processed_sources_hash ON processed_sources (content_hash);
        `);
    }

    async _initializeMemorySystem() {
        if (!this.config.memorySystem) {
            this.config.memorySystem = new RobbieDistributedMemory();
            await this.config.memorySystem.initialize();
        }
        
        if (!this.config.customerDossier) {
            this.config.customerDossier = new CustomerDossier();
            await this.config.customerDossier.initialize();
        }
    }

    async processInput(sourceType, sourceId, content, metadata = {}) {
        try {
            if (!this.isInitialized) {
                throw new Error('Intelligent Sticky System not initialized');
            }

            console.log(`🔍 Processing ${sourceType} input: ${sourceId}`);

            // Check if we've already processed this source
            const contentHash = this._generateContentHash(content);
            const existingSource = await this.db.get(
                'SELECT * FROM processed_sources WHERE content_hash = ?',
                [contentHash]
            );

            if (existingSource) {
                console.log(`⏭️ Already processed ${sourceType}:${sourceId}`);
                return { processed: false, reason: 'already_processed' };
            }

            // Analyze content for opportunities
            const opportunities = await this._analyzeOpportunities(content, metadata);
            
            if (opportunities.length === 0) {
                // Still record that we processed it
                await this._recordProcessedSource(sourceType, sourceId, contentHash);
                return { processed: false, reason: 'no_opportunities' };
            }

            // Generate sticky notes for each opportunity
            const stickyNotes = [];
            for (const opportunity of opportunities) {
                const stickyNote = await this._createStickyNote(
                    sourceType,
                    sourceId,
                    content,
                    opportunity,
                    metadata
                );
                stickyNotes.push(stickyNote);
            }

            // Record processed source
            await this._recordProcessedSource(sourceType, sourceId, contentHash, stickyNotes.length);

            // Store in memory system
            await this._storeInMemorySystem(stickyNotes, content, metadata);

            console.log(`📝 Generated ${stickyNotes.length} sticky notes from ${sourceType}:${sourceId}`);

            this.emit('stickiesGenerated', {
                sourceType,
                sourceId,
                stickyCount: stickyNotes.length,
                stickies: stickyNotes
            });

            return {
                processed: true,
                stickyCount: stickyNotes.length,
                stickies: stickyNotes
            };

        } catch (error) {
            console.error('❌ Error processing input:', error);
            throw error;
        }
    }

    async _analyzeOpportunities(content, metadata = {}) {
        const opportunities = [];
        
        // Check each opportunity pattern category
        for (const [category, patterns] of Object.entries(this.opportunityPatterns)) {
            for (const pattern of patterns) {
                const matches = content.match(pattern);
                if (matches) {
                    const opportunity = await this._extractOpportunityDetails(
                        content,
                        category,
                        matches,
                        metadata
                    );
                    
                    if (opportunity) {
                        opportunities.push(opportunity);
                    }
                }
            }
        }

        // Look for "hmmm..." moments - ambiguous but potentially valuable
        const hmmmMatches = content.match(/hmmm[^.]*\./gi);
        if (hmmmMatches) {
            for (const hmmm of hmmmMatches) {
                const opportunity = await this._analyzeHmmmMoment(hmmm, content, metadata);
                if (opportunity) {
                    opportunities.push(opportunity);
                }
            }
        }

        return opportunities;
    }

    async _extractOpportunityDetails(content, category, matches, metadata) {
        const opportunity = {
            category: category.toLowerCase(),
            extractedText: matches[0],
            confidence: 0.0,
            importanceScore: 0.0,
            urgencyScore: 0.0,
            relevanceScore: 0.0,
            details: {}
        };

        // Extract specific details based on category
        switch (category) {
            case 'FUNDING':
                opportunity.details = this._extractFundingDetails(content, matches);
                opportunity.importanceScore = 0.9; // Funding is always high importance
                opportunity.confidence = 0.8;
                break;

            case 'BUDGET':
                opportunity.details = this._extractBudgetDetails(content, matches);
                opportunity.importanceScore = 0.8;
                opportunity.confidence = 0.7;
                break;

            case 'EXPANSION':
                opportunity.details = this._extractExpansionDetails(content, matches);
                opportunity.importanceScore = 0.7;
                opportunity.confidence = 0.6;
                break;

            case 'TIMING':
                opportunity.details = this._extractTimingDetails(content, matches);
                opportunity.urgencyScore = 0.8;
                opportunity.confidence = 0.7;
                break;

            case 'DECISION_MAKERS':
                opportunity.details = this._extractDecisionMakerDetails(content, matches);
                opportunity.importanceScore = 0.9;
                opportunity.confidence = 0.8;
                break;

            case 'COMPETITIVE':
                opportunity.details = this._extractCompetitiveDetails(content, matches);
                opportunity.importanceScore = 0.8;
                opportunity.confidence = 0.7;
                break;

            case 'URGENCY':
                opportunity.details = this._extractUrgencyDetails(content, matches);
                opportunity.urgencyScore = 0.9;
                opportunity.confidence = 0.8;
                break;
        }

        // Boost scores based on context
        opportunity = await this._boostScoresWithContext(opportunity, content, metadata);

        // Only return if confidence is high enough
        return opportunity.confidence >= 0.5 ? opportunity : null;
    }

    async _analyzeHmmmMoment(hmmmText, fullContent, metadata) {
        // Look for patterns that suggest hidden value
        const valueIndicators = [
            /might.*be.*interesting/i,
            /could.*work/i,
            /worth.*looking.*into/i,
            /potential.*there/i,
            /something.*there/i,
            /keep.*in.*mind/i,
            /remember.*this/i
        ];

        let hasValueIndicators = false;
        for (const indicator of valueIndicators) {
            if (hmmmText.match(indicator)) {
                hasValueIndicators = true;
                break;
            }
        }

        if (!hasValueIndicators) {
            return null;
        }

        return {
            category: 'opportunity',
            extractedText: hmmmText,
            confidence: 0.6,
            importanceScore: 0.6,
            urgencyScore: 0.3,
            relevanceScore: 0.7,
            details: {
                type: 'hmmm_moment',
                context: fullContent.substring(
                    Math.max(0, fullContent.indexOf(hmmmText) - 200),
                    Math.min(fullContent.length, fullContent.indexOf(hmmmText) + hmmmText.length + 200)
                )
            }
        };
    }

    _extractFundingDetails(content, matches) {
        const details = {};
        
        // Extract dollar amounts
        const amountMatch = content.match(/\$[\d,]+(?:k|m|b)/i);
        if (amountMatch) {
            details.amount = amountMatch[0];
        }

        // Extract company names
        const companyMatch = content.match(/([A-Z][a-z]+(?:\.com|[A-Z][a-z]*))/);
        if (companyMatch) {
            details.company = companyMatch[1];
        }

        // Extract timeline
        const timelineMatch = content.match(/(?:in|by|within)\s+(\d+\s*(?:days?|weeks?|months?|quarters?|years?))/i);
        if (timelineMatch) {
            details.timeline = timelineMatch[1];
        }

        return details;
    }

    _extractBudgetDetails(content, matches) {
        const details = {};
        
        // Extract timeframe
        const timeframeMatch = content.match(/(?:next\s+)?(?:year|quarter|month)/i);
        if (timeframeMatch) {
            details.timeframe = timeframeMatch[0];
        }

        // Extract relative amount indicators
        if (content.match(/more|increased|higher/i)) {
            details.direction = 'increased';
        }

        return details;
    }

    _extractExpansionDetails(content, matches) {
        const details = {};
        
        // Extract team size indicators
        const sizeMatch = content.match(/(\d+)\s*(?:people|employees|hires)/i);
        if (sizeMatch) {
            details.teamSize = sizeMatch[1];
        }

        // Extract department/role
        const roleMatch = content.match(/(?:hiring|expanding).*?(?:for|in)\s+([a-z\s]+)/i);
        if (roleMatch) {
            details.role = roleMatch[1].trim();
        }

        return details;
    }

    _extractTimingDetails(content, matches) {
        const details = {};
        
        // Extract specific timeline
        const timelineMatch = content.match(/(\d+\s*(?:days?|weeks?|months?|quarters?))/i);
        if (timelineMatch) {
            details.timeline = timelineMatch[1];
        }

        // Extract urgency indicators
        if (content.match(/sooner|faster|accelerated/i)) {
            details.urgency = 'high';
        }

        return details;
    }

    _extractDecisionMakerDetails(content, matches) {
        const details = {};
        
        // Extract role/title
        const roleMatch = content.match(/(ceo|founder|vp|director|manager)/i);
        if (roleMatch) {
            details.role = roleMatch[1].toLowerCase();
        }

        // Extract name if mentioned
        const nameMatch = content.match(/(?:ceo|founder|vp|director)\s+([A-Z][a-z]+)/i);
        if (nameMatch) {
            details.name = nameMatch[1];
        }

        return details;
    }

    _extractCompetitiveDetails(content, matches) {
        const details = {};
        
        // Extract competitor name
        const competitorMatch = content.match(/(?:from|switching from|replacing)\s+([A-Z][a-z]+)/i);
        if (competitorMatch) {
            details.competitor = competitorMatch[1];
        }

        // Extract pain points
        const painMatch = content.match(/(?:issues?|problems?|dissatisfied with)\s+([^.!?]+)/i);
        if (painMatch) {
            details.painPoints = painMatch[1].trim();
        }

        return details;
    }

    _extractUrgencyDetails(content, matches) {
        const details = {};
        
        // Extract deadline
        const deadlineMatch = content.match(/(?:by|before|deadline).*?(\d{1,2}\/\d{1,2}|\d+\s*(?:days?|weeks?|months?))/i);
        if (deadlineMatch) {
            details.deadline = deadlineMatch[1];
        }

        return details;
    }

    async _boostScoresWithContext(opportunity, content, metadata) {
        // Boost based on company size/importance
        if (metadata.company) {
            const companySize = await this._getCompanySize(metadata.company);
            if (companySize === 'enterprise') {
                opportunity.importanceScore *= 1.2;
                opportunity.confidence *= 1.1;
            }
        }

        // Boost based on relationship strength
        if (metadata.contactEmail) {
            const dossier = await this.config.customerDossier.getDossierByEmail(metadata.contactEmail);
            if (dossier && dossier.relationship_strength > 3) {
                opportunity.importanceScore *= 1.15;
            }
        }

        // Boost if multiple indicators present
        const indicatorCount = Object.values(opportunity.details).filter(val => val).length;
        if (indicatorCount >= 3) {
            opportunity.confidence *= 1.2;
        }

        return opportunity;
    }

    async _createStickyNote(sourceType, sourceId, originalContent, opportunity, metadata) {
        const stickyId = this._generateStickyId(sourceType, sourceId);
        
        // Determine category
        let category = this.categories.OPPORTUNITY;
        if (opportunity.urgencyScore > 0.8) {
            category = this.categories.URGENT;
        } else if (opportunity.category === 'competitive') {
            category = this.categories.COMPETITIVE;
        } else if (opportunity.category === 'timing') {
            category = this.categories.TIMING;
        }

        // Create sticky note content
        const stickyContent = this._formatStickyContent(opportunity, metadata);

        // Store in database
        await this.db.run(`
            INSERT INTO intelligent_stickies (
                id, source_type, source_id, original_content, extracted_opportunity,
                category, importance_score, urgency_score, relevance_score,
                opportunity_type, estimated_value, timeline, key_people,
                company, contact_email, confidence_score, memory_ids,
                customer_dossier_id, follow_up_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            stickyId,
            sourceType,
            sourceId,
            originalContent,
            opportunity.extractedText,
            category,
            opportunity.importanceScore,
            opportunity.urgencyScore,
            opportunity.relevanceScore,
            opportunity.category,
            opportunity.details.amount || null,
            opportunity.details.timeline || opportunity.details.timeframe || null,
            opportunity.details.name || opportunity.details.role || null,
            opportunity.details.company || metadata.company || null,
            metadata.contactEmail || null,
            opportunity.confidence,
            null, // Will be populated after memory storage
            null, // Will be populated after dossier lookup
            this._calculateFollowUpDate(opportunity)
        ]);

        const stickyNote = {
            id: stickyId,
            content: stickyContent,
            category,
            importanceScore: opportunity.importanceScore,
            urgencyScore: opportunity.urgencyScore,
            confidenceScore: opportunity.confidence,
            opportunity: opportunity.details,
            source: { type: sourceType, id: sourceId },
            followUpDate: this._calculateFollowUpDate(opportunity)
        };

        console.log(`📝 Created sticky: ${category} - ${opportunity.extractedText.substring(0, 50)}...`);
        
        return stickyNote;
    }

    _formatStickyContent(opportunity, metadata) {
        let content = `🎯 ${opportunity.extractedText}`;
        
        if (opportunity.details.company) {
            content += `\n🏢 Company: ${opportunity.details.company}`;
        }
        
        if (opportunity.details.amount) {
            content += `\n💰 Value: ${opportunity.details.amount}`;
        }
        
        if (opportunity.details.timeline || opportunity.details.timeframe) {
            content += `\n⏰ Timeline: ${opportunity.details.timeline || opportunity.details.timeframe}`;
        }
        
        if (opportunity.details.name || opportunity.details.role) {
            content += `\n👤 Contact: ${opportunity.details.name || opportunity.details.role}`;
        }

        if (opportunity.category === 'hmmm_moment') {
            content += `\n🤔 Context: ${opportunity.details.context}`;
        }

        return content;
    }

    _calculateFollowUpDate(opportunity) {
        const now = new Date();
        
        if (opportunity.urgencyScore > 0.8) {
            // Urgent - follow up in 1-3 days
            return new Date(now.getTime() + (2 * 24 * 60 * 60 * 1000));
        } else if (opportunity.importanceScore > 0.8) {
            // Important - follow up in 1-2 weeks
            return new Date(now.getTime() + (10 * 24 * 60 * 60 * 1000));
        } else {
            // Standard - follow up in 2-4 weeks
            return new Date(now.getTime() + (21 * 24 * 60 * 60 * 1000));
        }
    }

    async _storeInMemorySystem(stickyNotes, originalContent, metadata) {
        for (const sticky of stickyNotes) {
            // Store in memory system
            const memoryId = await this.config.memorySystem.storeMemory(
                sticky.content,
                'business_opportunity',
                sticky.importanceScore > 0.8 ? 1 : 2, // Critical or High importance
                {
                    stickyId: sticky.id,
                    source: sticky.source,
                    opportunity: sticky.opportunity,
                    confidence: sticky.confidenceScore
                }
            );

            // Update sticky with memory ID
            await this.db.run(
                'UPDATE intelligent_stickies SET memory_ids = ? WHERE id = ?',
                [memoryId, sticky.id]
            );

            // Link to customer dossier if available
            if (metadata.contactEmail) {
                const dossier = await this.config.customerDossier.getDossierByEmail(metadata.contactEmail);
                if (dossier) {
                    await this.db.run(
                        'UPDATE intelligent_stickies SET customer_dossier_id = ? WHERE id = ?',
                        [dossier.id, sticky.id]
                    );
                }
            }
        }
    }

    async _recordProcessedSource(sourceType, sourceId, contentHash, stickyCount = 0) {
        await this.db.run(`
            INSERT OR REPLACE INTO processed_sources 
            (id, source_type, source_id, content_hash, sticky_count)
            VALUES (?, ?, ?, ?, ?)
        `, [
            `${sourceType}_${sourceId}`,
            sourceType,
            sourceId,
            contentHash,
            stickyCount
        ]);
    }

    async getActiveStickies(category = null, limit = 50) {
        let query = `
            SELECT * FROM intelligent_stickies 
            WHERE status = 'active'
        `;
        
        const params = [];
        
        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }
        
        query += ' ORDER BY importance_score DESC, urgency_score DESC, created_at DESC LIMIT ?';
        params.push(limit);
        
        const stickies = await this.db.all(query, params);
        
        return stickies.map(sticky => ({
            ...sticky,
            memory_ids: sticky.memory_ids ? JSON.parse(sticky.memory_ids) : null
        }));
    }

    async getFollowUpStickies() {
        const today = new Date().toISOString().split('T')[0];
        
        const stickies = await this.db.all(`
            SELECT * FROM intelligent_stickies 
            WHERE status = 'active' 
              AND follow_up_date <= ?
            ORDER BY follow_up_date ASC, importance_score DESC
        `, [today]);
        
        return stickies;
    }

    async markStickyActionTaken(stickyId, action, notes = null) {
        await this.db.run(`
            UPDATE intelligent_stickies 
            SET action_taken = ?, status = 'action_taken', updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [action, stickyId]);
        
        console.log(`✅ Marked sticky ${stickyId} as action taken: ${action}`);
    }

    async markStickyFalsePositive(stickyId) {
        await this.db.run(`
            UPDATE intelligent_stickies 
            SET false_positive = TRUE, status = 'false_positive', updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [stickyId]);
        
        console.log(`❌ Marked sticky ${stickyId} as false positive`);
    }

    // Helper methods
    _generateContentHash(content) {
        const crypto = require('crypto');
        return crypto.createHash('sha256').update(content).digest('hex');
    }

    _generateStickyId(sourceType, sourceId) {
        return `sticky_${sourceType}_${sourceId}_${Date.now()}`;
    }

    async _getCompanySize(companyName) {
        // Simplified company size detection
        const enterpriseKeywords = ['inc', 'corp', 'llc', 'enterprise', 'global', 'international'];
        const lowerName = companyName.toLowerCase();
        
        if (enterpriseKeywords.some(keyword => lowerName.includes(keyword))) {
            return 'enterprise';
        }
        
        return 'smb';
    }

    async shutdown() {
        console.log('🛑 Shutting down Intelligent Sticky System...');
        
        if (this.db) {
            await this.db.close();
        }
        
        if (this.config.memorySystem) {
            await this.config.memorySystem.shutdown();
        }
        
        if (this.config.customerDossier) {
            await this.config.customerDossier.shutdown();
        }
        
        this.isInitialized = false;
        console.log('✅ Intelligent Sticky System shutdown complete');
    }
}

export default IntelligentStickySystem;
