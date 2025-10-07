/**
 * Aurora AI Customer Dossier System
 * Comprehensive relationship tracking with auto-enrichment
 */

import { EventEmitter } from 'events';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fetch from 'node-fetch';

class CustomerDossier extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            dbPath: config.dbPath || './data/customer_dossiers.db',
            clayApiKey: config.clayApiKey || process.env.CLAY_API_KEY,
            gmailApiKey: config.gmailApiKey || process.env.GMAIL_API_KEY,
            ...config
        };
        
        this.db = null;
        this.isInitialized = false;
        
        // Relationship strength levels
        this.relationshipLevels = {
            STRANGER: 0,
            ACQUAINTANCE: 1,
            CONTACT: 2,
            COLLABORATOR: 3,
            PARTNER: 4,
            STRATEGIC_PARTNER: 5
        };
        
        // Authority levels
        this.authorityLevels = {
            INDIVIDUAL: 0,
            MANAGER: 1,
            DIRECTOR: 2,
            VP: 3,
            C_LEVEL: 4,
            FOUNDER: 5,
            BOARD_MEMBER: 6
        };
        
        // Deal stages
        this.dealStages = {
            PROSPECT: 'prospect',
            QUALIFIED: 'qualified',
            PROPOSAL: 'proposal',
            NEGOTIATION: 'negotiation',
            CLOSED_WON: 'closed_won',
            CLOSED_LOST: 'closed_lost'
        };
    }

    async initialize() {
        try {
            console.log('📋 Initializing Customer Dossier System...');
            
            await this._initializeDatabase();
            await this._loadExistingDossiers();
            
            this.isInitialized = true;
            console.log('✅ Customer Dossier System initialized successfully');
            
            this.emit('initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize customer dossier system:', error);
            throw error;
        }
    }

    async _initializeDatabase() {
        this.db = await open({
            filename: this.config.dbPath,
            driver: sqlite3.Database
        });

        // Create customer dossiers table
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS customer_dossiers (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE,
                name TEXT,
                company TEXT,
                title TEXT,
                phone TEXT,
                linkedin_url TEXT,
                profile_image_url TEXT,
                
                -- Relationship metrics
                relationship_strength REAL DEFAULT 0.0,
                authority_level INTEGER DEFAULT 0,
                influence_score REAL DEFAULT 0.0,
                engagement_level REAL DEFAULT 0.0,
                
                -- Business context
                deal_stage TEXT DEFAULT 'prospect',
                deal_value REAL DEFAULT 0.0,
                deal_probability REAL DEFAULT 0.0,
                last_contact_date DATETIME,
                next_follow_up_date DATETIME,
                
                -- Communication preferences
                preferred_contact_method TEXT,
                communication_style TEXT,
                timezone TEXT,
                response_time_hours REAL DEFAULT 24.0,
                
                -- Enrichment data
                company_size TEXT,
                industry TEXT,
                location TEXT,
                bio TEXT,
                skills TEXT,
                
                -- Metadata
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_enriched_at DATETIME,
                enrichment_confidence REAL DEFAULT 0.0,
                
                -- Raw data
                raw_profile_data TEXT,
                interaction_history TEXT
            )
        `);

        // Create interaction history table
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS interaction_history (
                id TEXT PRIMARY KEY,
                customer_id TEXT NOT NULL,
                interaction_type TEXT NOT NULL,
                channel TEXT NOT NULL,
                subject TEXT,
                content TEXT,
                sentiment REAL,
                outcome TEXT,
                duration_minutes REAL,
                participants TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customer_dossiers (id)
            )
        `);

        // Create meeting history table
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS meeting_history (
                id TEXT PRIMARY KEY,
                customer_id TEXT NOT NULL,
                meeting_title TEXT,
                meeting_type TEXT,
                duration_minutes REAL,
                attendees TEXT,
                agenda TEXT,
                outcomes TEXT,
                next_steps TEXT,
                meeting_url TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customer_dossiers (id)
            )
        `);

        // Create deal tracking table
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS deal_tracking (
                id TEXT PRIMARY KEY,
                customer_id TEXT NOT NULL,
                deal_name TEXT NOT NULL,
                deal_stage TEXT NOT NULL,
                deal_value REAL NOT NULL,
                probability REAL DEFAULT 0.0,
                expected_close_date DATE,
                actual_close_date DATE,
                deal_source TEXT,
                competitor TEXT,
                decision_criteria TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customer_dossiers (id)
            )
        `);

        // Create indexes
        await this.db.exec(`
            CREATE INDEX IF NOT EXISTS idx_customer_email ON customer_dossiers (email);
            CREATE INDEX IF NOT EXISTS idx_customer_company ON customer_dossiers (company);
            CREATE INDEX IF NOT EXISTS idx_customer_relationship ON customer_dossiers (relationship_strength);
            CREATE INDEX IF NOT EXISTS idx_customer_authority ON customer_dossiers (authority_level);
            CREATE INDEX IF NOT EXISTS idx_customer_deal_stage ON customer_dossiers (deal_stage);
            CREATE INDEX IF NOT EXISTS idx_interaction_customer ON interaction_history (customer_id);
            CREATE INDEX IF NOT EXISTS idx_interaction_date ON interaction_history (created_at);
            CREATE INDEX IF NOT EXISTS idx_meeting_customer ON meeting_history (customer_id);
            CREATE INDEX IF NOT EXISTS idx_deal_customer ON deal_tracking (customer_id);
        `);
    }

    async _loadExistingDossiers() {
        const count = await this.db.get('SELECT COUNT(*) as count FROM customer_dossiers');
        console.log(`📊 Loaded ${count.count} existing customer dossiers`);
    }

    async createOrUpdateDossier(email, initialData = {}) {
        try {
            // Check if dossier already exists
            let existingDossier = await this.db.get(
                'SELECT * FROM customer_dossier WHERE email = ?', 
                [email]
            );

            let dossierId;
            
            if (existingDossier) {
                // Update existing dossier
                dossierId = existingDossier.id;
                await this._updateDossier(dossierId, initialData);
                console.log(`📝 Updated dossier for ${email}`);
            } else {
                // Create new dossier
                dossierId = this._generateDossierId(email);
                await this._createDossier(dossierId, email, initialData);
                console.log(`📋 Created new dossier for ${email}`);
            }

            // Auto-enrich the dossier
            await this._enrichDossier(dossierId);

            this.emit('dossierUpdated', { dossierId, email });

            return await this.getDossier(dossierId);

        } catch (error) {
            console.error('❌ Error creating/updating dossier:', error);
            throw error;
        }
    }

    async _createDossier(dossierId, email, initialData) {
        await this.db.run(`
            INSERT INTO customer_dossiers (
                id, email, name, company, title, phone, linkedin_url,
                relationship_strength, authority_level, deal_stage,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [
            dossierId,
            email,
            initialData.name || null,
            initialData.company || null,
            initialData.title || null,
            initialData.phone || null,
            initialData.linkedin_url || null,
            this.relationshipLevels.STRANGER,
            this._determineAuthorityLevel(initialData.title),
            this.dealStages.PROSPECT
        ]);
    }

    async _updateDossier(dossierId, updateData) {
        const updateFields = [];
        const values = [];
        
        for (const [key, value] of Object.entries(updateData)) {
            if (value !== undefined && value !== null) {
                updateFields.push(`${key} = ?`);
                values.push(value);
            }
        }
        
        if (updateFields.length > 0) {
            updateFields.push('updated_at = CURRENT_TIMESTAMP');
            values.push(dossierId);
            
            await this.db.run(`
                UPDATE customer_dossiers 
                SET ${updateFields.join(', ')}
                WHERE id = ?
            `, values);
        }
    }

    async _enrichDossier(dossierId) {
        try {
            const dossier = await this.getDossier(dossierId);
            
            // Enrich with Clay API
            if (this.config.clayApiKey && dossier.email) {
                await this._enrichWithClay(dossierId, dossier.email);
            }
            
            // Enrich with Gmail data
            if (this.config.gmailApiKey && dossier.email) {
                await this._enrichWithGmail(dossierId, dossier.email);
            }
            
            // Calculate relationship metrics
            await this._calculateRelationshipMetrics(dossierId);
            
            // Update enrichment timestamp
            await this.db.run(`
                UPDATE customer_dossiers 
                SET last_enriched_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [dossierId]);
            
            console.log(`🔍 Enriched dossier for ${dossier.email}`);
            
        } catch (error) {
            console.error('❌ Error enriching dossier:', error);
        }
    }

    async _enrichWithClay(dossierId, email) {
        try {
            const response = await fetch('https://api.clay.com/v1/people/enrich', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.clayApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    fields: [
                        'first_name', 'last_name', 'company_name', 'title',
                        'phone', 'linkedin_url', 'company_size', 'industry',
                        'location', 'bio', 'skills'
                    ]
                })
            });

            if (response.ok) {
                const enrichmentData = await response.json();
                
                if (enrichmentData.data) {
                    const data = enrichmentData.data;
                    
                    await this.db.run(`
                        UPDATE customer_dossiers 
                        SET name = ?, company = ?, title = ?, phone = ?,
                            linkedin_url = ?, company_size = ?, industry = ?,
                            location = ?, bio = ?, skills = ?,
                            enrichment_confidence = ?
                        WHERE id = ?
                    `, [
                        data.first_name && data.last_name ? `${data.first_name} ${data.last_name}` : null,
                        data.company_name,
                        data.title,
                        data.phone,
                        data.linkedin_url,
                        data.company_size,
                        data.industry,
                        data.location,
                        data.bio,
                        data.skills ? JSON.stringify(data.skills) : null,
                        enrichmentData.confidence || 0.8,
                        dossierId
                    ]);
                }
            }
            
        } catch (error) {
            console.error('❌ Clay enrichment failed:', error);
        }
    }

    async _enrichWithGmail(dossierId, email) {
        try {
            // Get email interaction history
            const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/search?q=from:${email}`, {
                headers: {
                    'Authorization': `Bearer ${this.config.gmailApiKey}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const emailCount = data.messages ? data.messages.length : 0;
                
                // Calculate engagement level based on email frequency
                const engagementLevel = Math.min(1.0, emailCount / 10); // Max at 10 emails
                
                await this.db.run(`
                    UPDATE customer_dossiers 
                    SET engagement_level = ?, interaction_history = ?
                    WHERE id = ?
                `, [
                    engagementLevel,
                    JSON.stringify({
                        email_count: emailCount,
                        last_enriched: new Date().toISOString()
                    }),
                    dossierId
                ]);
            }
            
        } catch (error) {
            console.error('❌ Gmail enrichment failed:', error);
        }
    }

    async _calculateRelationshipMetrics(dossierId) {
        // Get interaction history
        const interactions = await this.db.all(`
            SELECT * FROM interaction_history 
            WHERE customer_id = ? 
            ORDER BY created_at DESC
            LIMIT 50
        `, [dossierId]);

        // Calculate relationship strength
        let relationshipStrength = 0;
        let influenceScore = 0;
        
        if (interactions.length > 0) {
            // Base strength from interaction frequency
            relationshipStrength = Math.min(5, interactions.length / 5);
            
            // Boost from positive interactions
            const positiveInteractions = interactions.filter(i => i.sentiment > 0.5).length;
            relationshipStrength += positiveInteractions * 0.2;
            
            // Calculate influence score based on authority and engagement
            const dossier = await this.getDossier(dossierId);
            influenceScore = (dossier.authority_level / 6) * 0.6 + (dossier.engagement_level * 0.4);
        }
        
        await this.db.run(`
            UPDATE customer_dossiers 
            SET relationship_strength = ?, influence_score = ?
            WHERE id = ?
        `, [relationshipStrength, influenceScore, dossierId]);
    }

    async getDossier(dossierId) {
        const dossier = await this.db.get('SELECT * FROM customer_dossiers WHERE id = ?', [dossierId]);
        
        if (dossier) {
            return {
                ...dossier,
                raw_profile_data: dossier.raw_profile_data ? JSON.parse(dossier.raw_profile_data) : null,
                interaction_history: dossier.interaction_history ? JSON.parse(dossier.interaction_history) : null,
                skills: dossier.skills ? JSON.parse(dossier.skills) : null
            };
        }
        
        return null;
    }

    async getDossierByEmail(email) {
        const dossier = await this.db.get('SELECT * FROM customer_dossiers WHERE email = ?', [email]);
        
        if (dossier) {
            return await this.getDossier(dossier.id);
        }
        
        return null;
    }

    async addInteraction(customerId, interactionData) {
        const interactionId = this._generateInteractionId(customerId, interactionData.type);
        
        await this.db.run(`
            INSERT INTO interaction_history (
                id, customer_id, interaction_type, channel, subject,
                content, sentiment, outcome, duration_minutes, participants
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            interactionId,
            customerId,
            interactionData.type,
            interactionData.channel,
            interactionData.subject || null,
            interactionData.content || null,
            interactionData.sentiment || null,
            interactionData.outcome || null,
            interactionData.duration_minutes || null,
            interactionData.participants ? JSON.stringify(interactionData.participants) : null
        ]);
        
        // Update last contact date
        await this.db.run(`
            UPDATE customer_dossiers 
            SET last_contact_date = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [customerId]);
        
        // Recalculate relationship metrics
        await this._calculateRelationshipMetrics(customerId);
        
        console.log(`📞 Added interaction for customer ${customerId}`);
        
        return interactionId;
    }

    async addMeeting(customerId, meetingData) {
        const meetingId = this._generateMeetingId(customerId, meetingData.title);
        
        await this.db.run(`
            INSERT INTO meeting_history (
                id, customer_id, meeting_title, meeting_type, duration_minutes,
                attendees, agenda, outcomes, next_steps, meeting_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            meetingId,
            customerId,
            meetingData.title,
            meetingData.type || 'meeting',
            meetingData.duration_minutes || null,
            meetingData.attendees ? JSON.stringify(meetingData.attendees) : null,
            meetingData.agenda || null,
            meetingData.outcomes || null,
            meetingData.next_steps || null,
            meetingData.meeting_url || null
        ]);
        
        console.log(`🤝 Added meeting for customer ${customerId}`);
        
        return meetingId;
    }

    async trackDeal(customerId, dealData) {
        const dealId = this._generateDealId(customerId, dealData.name);
        
        await this.db.run(`
            INSERT OR REPLACE INTO deal_tracking (
                id, customer_id, deal_name, deal_stage, deal_value,
                probability, expected_close_date, actual_close_date,
                deal_source, competitor, decision_criteria
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            dealId,
            customerId,
            dealData.name,
            dealData.stage || this.dealStages.PROSPECT,
            dealData.value || 0,
            dealData.probability || 0,
            dealData.expected_close_date || null,
            dealData.actual_close_date || null,
            dealData.source || null,
            dealData.competitor || null,
            dealData.decision_criteria ? JSON.stringify(dealData.decision_criteria) : null
        ]);
        
        // Update customer dossier with deal information
        await this.db.run(`
            UPDATE customer_dossiers 
            SET deal_stage = ?, deal_value = ?, deal_probability = ?
            WHERE id = ?
        `, [
            dealData.stage || this.dealStages.PROSPECT,
            dealData.value || 0,
            dealData.probability || 0,
            customerId
        ]);
        
        console.log(`💰 Tracked deal for customer ${customerId}: ${dealData.name}`);
        
        return dealId;
    }

    async getCustomerInsights(customerId) {
        const dossier = await this.getDossier(customerId);
        const interactions = await this.db.all(`
            SELECT * FROM interaction_history 
            WHERE customer_id = ? 
            ORDER BY created_at DESC 
            LIMIT 10
        `, [customerId]);
        
        const meetings = await this.db.all(`
            SELECT * FROM meeting_history 
            WHERE customer_id = ? 
            ORDER BY created_at DESC 
            LIMIT 5
        `, [customerId]);
        
        const deals = await this.db.all(`
            SELECT * FROM deal_tracking 
            WHERE customer_id = ? 
            ORDER BY updated_at DESC
        `, [customerId]);
        
        // Generate insights
        const insights = {
            relationship_strength: this._getRelationshipStrengthLabel(dossier.relationship_strength),
            authority_level: this._getAuthorityLevelLabel(dossier.authority_level),
            engagement_trend: this._calculateEngagementTrend(interactions),
            communication_preferences: this._analyzeCommunicationPreferences(interactions),
            deal_health: this._analyzeDealHealth(deals),
            next_steps: this._suggestNextSteps(dossier, interactions, meetings, deals),
            risk_factors: this._identifyRiskFactors(dossier, deals)
        };
        
        return insights;
    }

    async getTopCustomers(criteria = 'relationship_strength', limit = 10) {
        const customers = await this.db.all(`
            SELECT * FROM customer_dossiers 
            ORDER BY ${criteria} DESC 
            LIMIT ?
        `, [limit]);
        
        return customers.map(customer => ({
            ...customer,
            raw_profile_data: customer.raw_profile_data ? JSON.parse(customer.raw_profile_data) : null,
            interaction_history: customer.interaction_history ? JSON.parse(customer.interaction_history) : null
        }));
    }

    async getCustomersByCompany(company) {
        return await this.db.all(`
            SELECT * FROM customer_dossiers 
            WHERE company = ? 
            ORDER BY authority_level DESC, relationship_strength DESC
        `, [company]);
    }

    // Helper methods
    _generateDossierId(email) {
        return `dossier_${Buffer.from(email).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 12)}`;
    }

    _generateInteractionId(customerId, type) {
        return `interaction_${customerId}_${type}_${Date.now()}`;
    }

    _generateMeetingId(customerId, title) {
        return `meeting_${customerId}_${Buffer.from(title).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 8)}`;
    }

    _generateDealId(customerId, name) {
        return `deal_${customerId}_${Buffer.from(name).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 8)}`;
    }

    _determineAuthorityLevel(title) {
        if (!title) return this.authorityLevels.INDIVIDUAL;
        
        const titleLower = title.toLowerCase();
        
        if (titleLower.includes('founder') || titleLower.includes('ceo')) {
            return this.authorityLevels.FOUNDER;
        } else if (titleLower.includes('president') || titleLower.includes('chief')) {
            return this.authorityLevels.C_LEVEL;
        } else if (titleLower.includes('vp') || titleLower.includes('vice president')) {
            return this.authorityLevels.VP;
        } else if (titleLower.includes('director')) {
            return this.authorityLevels.DIRECTOR;
        } else if (titleLower.includes('manager')) {
            return this.authorityLevels.MANAGER;
        }
        
        return this.authorityLevels.INDIVIDUAL;
    }

    _getRelationshipStrengthLabel(strength) {
        if (strength >= 4.5) return 'Strategic Partner';
        if (strength >= 3.5) return 'Partner';
        if (strength >= 2.5) return 'Collaborator';
        if (strength >= 1.5) return 'Contact';
        if (strength >= 0.5) return 'Acquaintance';
        return 'Stranger';
    }

    _getAuthorityLevelLabel(level) {
        const labels = [
            'Individual Contributor',
            'Manager',
            'Director',
            'VP',
            'C-Level',
            'Founder',
            'Board Member'
        ];
        return labels[level] || 'Unknown';
    }

    _calculateEngagementTrend(interactions) {
        if (interactions.length < 2) return 'stable';
        
        const recent = interactions.slice(0, Math.floor(interactions.length / 2));
        const older = interactions.slice(Math.floor(interactions.length / 2));
        
        const recentAvg = recent.reduce((sum, i) => sum + (i.sentiment || 0.5), 0) / recent.length;
        const olderAvg = older.reduce((sum, i) => sum + (i.sentiment || 0.5), 0) / older.length;
        
        if (recentAvg > olderAvg + 0.1) return 'increasing';
        if (recentAvg < olderAvg - 0.1) return 'decreasing';
        return 'stable';
    }

    _analyzeCommunicationPreferences(interactions) {
        const channels = {};
        const responseTimes = [];
        
        interactions.forEach(interaction => {
            channels[interaction.channel] = (channels[interaction.channel] || 0) + 1;
            if (interaction.duration_minutes) {
                responseTimes.push(interaction.duration_minutes);
            }
        });
        
        const preferredChannel = Object.keys(channels).reduce((a, b) => channels[a] > channels[b] ? a : b);
        const avgResponseTime = responseTimes.length > 0 ? 
            responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 24;
        
        return {
            preferred_channel: preferredChannel,
            average_response_time_hours: avgResponseTime / 60,
            channel_distribution: channels
        };
    }

    _analyzeDealHealth(deals) {
        if (deals.length === 0) return { status: 'no_deals', health_score: 0 };
        
        const activeDeals = deals.filter(deal => 
            deal.deal_stage !== this.dealStages.CLOSED_WON && 
            deal.deal_stage !== this.dealStages.CLOSED_LOST
        );
        
        if (activeDeals.length === 0) return { status: 'no_active_deals', health_score: 0 };
        
        const totalValue = activeDeals.reduce((sum, deal) => sum + deal.deal_value, 0);
        const avgProbability = activeDeals.reduce((sum, deal) => sum + deal.probability, 0) / activeDeals.length;
        
        let healthScore = avgProbability;
        
        // Penalize deals that are stuck
        const oldDeals = activeDeals.filter(deal => {
            const daysSinceUpdate = (new Date() - new Date(deal.updated_at)) / (1000 * 60 * 60 * 24);
            return daysSinceUpdate > 30;
        });
        
        healthScore -= (oldDeals.length / activeDeals.length) * 0.2;
        
        return {
            status: 'active_deals',
            health_score: Math.max(0, healthScore),
            total_value: totalValue,
            average_probability: avgProbability,
            deal_count: activeDeals.length
        };
    }

    _suggestNextSteps(dossier, interactions, meetings, deals) {
        const suggestions = [];
        
        // Check if follow-up is overdue
        if (dossier.next_follow_up_date && new Date() > new Date(dossier.next_follow_up_date)) {
            suggestions.push('Overdue follow-up - contact immediately');
        }
        
        // Suggest based on deal stage
        const activeDeals = deals.filter(deal => 
            deal.deal_stage !== this.dealStages.CLOSED_WON && 
            deal.deal_stage !== this.dealStages.CLOSED_LOST
        );
        
        if (activeDeals.length > 0) {
            const deal = activeDeals[0];
            if (deal.deal_stage === this.dealStages.PROSPECT) {
                suggestions.push('Schedule discovery call to qualify opportunity');
            } else if (deal.deal_stage === this.dealStages.QUALIFIED) {
                suggestions.push('Send proposal and schedule demo');
            } else if (deal.deal_stage === this.dealStages.NEGOTIATION) {
                suggestions.push('Address objections and move toward close');
            }
        }
        
        // Suggest based on relationship strength
        if (dossier.relationship_strength < 2) {
            suggestions.push('Build relationship through value-add interactions');
        }
        
        return suggestions;
    }

    _identifyRiskFactors(dossier, deals) {
        const risks = [];
        
        // Check for stale deals
        const staleDeals = deals.filter(deal => {
            const daysSinceUpdate = (new Date() - new Date(deal.updated_at)) / (1000 * 60 * 60 * 24);
            return daysSinceUpdate > 60;
        });
        
        if (staleDeals.length > 0) {
            risks.push('Stale deals - may need re-engagement');
        }
        
        // Check for low engagement
        if (dossier.engagement_level < 0.3) {
            risks.push('Low engagement - relationship may be cooling');
        }
        
        // Check for overdue follow-ups
        if (dossier.next_follow_up_date && new Date() > new Date(dossier.next_follow_up_date)) {
            risks.push('Overdue follow-up - may signal disinterest');
        }
        
        return risks;
    }

    async shutdown() {
        console.log('🛑 Shutting down Customer Dossier System...');
        
        if (this.db) {
            await this.db.close();
        }
        
        this.isInitialized = false;
        console.log('✅ Customer Dossier System shutdown complete');
    }
}

export default CustomerDossier;
