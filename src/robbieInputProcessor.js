/**
 * Aurora AI Robbie Input Processing Pipeline
 * Processes all Robbie inputs (text, chat, emails, CRM records) through intelligent sticky system
 */

import { EventEmitter } from 'events';
import IntelligentStickySystem from './intelligentStickySystem.js';
import RobbieDistributedMemory from './robbieDistributedMemory.js';
import CustomerDossier from './customerDossier.js';

class RobbieInputProcessor extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            ...config
        };
        
        this.stickySystem = null;
        this.memorySystem = null;
        this.customerDossier = null;
        this.isInitialized = false;
        
        // Input source types
        this.sourceTypes = {
            CHAT_MESSAGE: 'chat_message',
            EMAIL: 'email',
            CRM_RECORD: 'crm_record',
            CALENDAR_EVENT: 'calendar_event',
            PHONE_CALL: 'phone_call',
            MEETING_NOTE: 'meeting_note',
            DOCUMENT: 'document',
            SOCIAL_MEDIA: 'social_media',
            WEB_FORM: 'web_form'
        };
        
        // Processing statistics
        this.stats = {
            totalProcessed: 0,
            stickiesGenerated: 0,
            opportunitiesFound: 0,
            falsePositives: 0,
            bySourceType: {},
            byCategory: {}
        };
    }

    async initialize() {
        try {
            console.log('🔄 Initializing Robbie Input Processing Pipeline...');
            
            // Initialize systems
            this.stickySystem = new IntelligentStickySystem();
            await this.stickySystem.initialize();
            
            this.memorySystem = new RobbieDistributedMemory();
            await this.memorySystem.initialize();
            
            this.customerDossier = new CustomerDossier();
            await this.customerDossier.initialize();
            
            // Set up event listeners
            this._setupEventListeners();
            
            this.isInitialized = true;
            console.log('✅ Robbie Input Processing Pipeline initialized successfully');
            
            this.emit('initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize input processing pipeline:', error);
            throw error;
        }
    }

    _setupEventListeners() {
        // Listen for sticky generation events
        this.stickySystem.on('stickiesGenerated', (data) => {
            this._updateStats('stickiesGenerated', data.stickyCount);
            this._updateStats('opportunitiesFound', data.stickyCount);
            this._updateSourceStats(data.sourceType, data.stickyCount);
            
            this.emit('opportunitiesFound', data);
        });
    }

    async processChatMessage(messageId, content, metadata = {}) {
        return await this._processInput(
            this.sourceTypes.CHAT_MESSAGE,
            messageId,
            content,
            {
                ...metadata,
                channel: metadata.channel || 'chat',
                timestamp: metadata.timestamp || new Date().toISOString()
            }
        );
    }

    async processEmail(emailId, content, metadata = {}) {
        // Extract email metadata
        const emailMetadata = {
            ...metadata,
            sender: metadata.from,
            recipient: metadata.to,
            subject: metadata.subject,
            timestamp: metadata.timestamp || new Date().toISOString(),
            threadId: metadata.threadId
        };

        return await this._processInput(
            this.sourceTypes.EMAIL,
            emailId,
            content,
            emailMetadata
        );
    }

    async processCRMRecord(recordId, content, metadata = {}) {
        const crmMetadata = {
            ...metadata,
            recordType: metadata.type || 'contact',
            company: metadata.company,
            contactEmail: metadata.email,
            dealStage: metadata.stage,
            dealValue: metadata.value,
            timestamp: metadata.timestamp || new Date().toISOString()
        };

        return await this._processInput(
            this.sourceTypes.CRM_RECORD,
            recordId,
            content,
            crmMetadata
        );
    }

    async processCalendarEvent(eventId, content, metadata = {}) {
        const calendarMetadata = {
            ...metadata,
            eventTitle: metadata.title,
            attendees: metadata.attendees,
            startTime: metadata.startTime,
            endTime: metadata.endTime,
            location: metadata.location,
            meetingUrl: metadata.meetingUrl,
            timestamp: metadata.timestamp || new Date().toISOString()
        };

        return await this._processInput(
            this.sourceTypes.CALENDAR_EVENT,
            eventId,
            content,
            calendarMetadata
        );
    }

    async processPhoneCall(callId, transcript, metadata = {}) {
        const callMetadata = {
            ...metadata,
            caller: metadata.from,
            callee: metadata.to,
            duration: metadata.duration,
            recordingUrl: metadata.recordingUrl,
            timestamp: metadata.timestamp || new Date().toISOString()
        };

        return await this._processInput(
            this.sourceTypes.PHONE_CALL,
            callId,
            transcript,
            callMetadata
        );
    }

    async processMeetingNote(noteId, content, metadata = {}) {
        const meetingMetadata = {
            ...metadata,
            meetingTitle: metadata.title,
            attendees: metadata.attendees,
            meetingDate: metadata.date,
            actionItems: metadata.actionItems,
            outcomes: metadata.outcomes,
            timestamp: metadata.timestamp || new Date().toISOString()
        };

        return await this._processInput(
            this.sourceTypes.MEETING_NOTE,
            noteId,
            content,
            meetingMetadata
        );
    }

    async processDocument(docId, content, metadata = {}) {
        const docMetadata = {
            ...metadata,
            documentType: metadata.type,
            fileName: metadata.fileName,
            author: metadata.author,
            createdDate: metadata.createdDate,
            modifiedDate: metadata.modifiedDate,
            timestamp: metadata.timestamp || new Date().toISOString()
        };

        return await this._processInput(
            this.sourceTypes.DOCUMENT,
            docId,
            content,
            docMetadata
        );
    }

    async processSocialMedia(postId, content, metadata = {}) {
        const socialMetadata = {
            ...metadata,
            platform: metadata.platform || 'unknown',
            author: metadata.author,
            postUrl: metadata.url,
            engagement: metadata.engagement,
            timestamp: metadata.timestamp || new Date().toISOString()
        };

        return await this._processInput(
            this.sourceTypes.SOCIAL_MEDIA,
            postId,
            content,
            socialMetadata
        );
    }

    async processWebForm(formId, content, metadata = {}) {
        const formMetadata = {
            ...metadata,
            formType: metadata.type,
            company: metadata.company,
            contactEmail: metadata.email,
            phone: metadata.phone,
            source: metadata.source,
            timestamp: metadata.timestamp || new Date().toISOString()
        };

        return await this._processInput(
            this.sourceTypes.WEB_FORM,
            formId,
            content,
            formMetadata
        );
    }

    async _processInput(sourceType, sourceId, content, metadata) {
        try {
            if (!this.isInitialized) {
                throw new Error('Input processing pipeline not initialized');
            }

            console.log(`🔄 Processing ${sourceType}: ${sourceId}`);

            // Pre-process content
            const processedContent = await this._preprocessContent(content, metadata);
            
            // Process through intelligent sticky system
            const result = await this.stickySystem.processInput(
                sourceType,
                sourceId,
                processedContent,
                metadata
            );

            // Store in memory system regardless of sticky generation
            await this._storeInMemorySystem(sourceType, sourceId, content, metadata);

            // Update customer dossier if contact information available
            if (metadata.contactEmail || metadata.email) {
                await this._updateCustomerDossier(metadata, content);
            }

            // Update statistics
            this._updateStats('totalProcessed', 1);
            this._updateSourceStats(sourceType, 1);

            this.emit('inputProcessed', {
                sourceType,
                sourceId,
                result,
                metadata
            });

            return result;

        } catch (error) {
            console.error(`❌ Error processing ${sourceType} ${sourceId}:`, error);
            throw error;
        }
    }

    async _preprocessContent(content, metadata) {
        // Clean and normalize content
        let processedContent = content;
        
        // Remove HTML tags if present
        processedContent = processedContent.replace(/<[^>]*>/g, '');
        
        // Normalize whitespace
        processedContent = processedContent.replace(/\s+/g, ' ').trim();
        
        // Extract key information based on source type
        if (metadata.subject) {
            processedContent = `${metadata.subject}\n\n${processedContent}`;
        }
        
        if (metadata.attendees) {
            processedContent += `\n\nAttendees: ${metadata.attendees.join(', ')}`;
        }
        
        if (metadata.company) {
            processedContent += `\n\nCompany: ${metadata.company}`;
        }

        return processedContent;
    }

    async _storeInMemorySystem(sourceType, sourceId, content, metadata) {
        // Determine memory category and importance
        let category = 'conversation';
        let importance = 3; // Medium importance by default
        
        switch (sourceType) {
            case this.sourceTypes.CRM_RECORD:
                category = 'business_context';
                importance = metadata.dealValue > 10000 ? 2 : 3;
                break;
            case this.sourceTypes.EMAIL:
                category = 'business_context';
                importance = metadata.contactEmail ? 2 : 3;
                break;
            case this.sourceTypes.MEETING_NOTE:
                category = 'business_context';
                importance = 2;
                break;
            case this.sourceTypes.PHONE_CALL:
                category = 'customer_profile';
                importance = 2;
                break;
        }

        // Store in memory system
        await this.memorySystem.storeMemory(
            content,
            category,
            importance,
            {
                sourceType,
                sourceId,
                ...metadata
            }
        );
    }

    async _updateCustomerDossier(metadata, content) {
        try {
            const email = metadata.contactEmail || metadata.email;
            if (!email) return;

            // Create or update customer dossier
            const dossier = await this.customerDossier.createOrUpdateDossier(email, {
                name: metadata.name || metadata.sender,
                company: metadata.company,
                title: metadata.title,
                phone: metadata.phone
            });

            // Add interaction record
            if (dossier) {
                await this.customerDossier.addInteraction(dossier.id, {
                    type: metadata.sourceType || 'email',
                    channel: metadata.channel || 'email',
                    subject: metadata.subject,
                    content: content.substring(0, 1000), // Truncate for storage
                    sentiment: await this._analyzeSentiment(content),
                    outcome: metadata.outcome || null
                });
            }

        } catch (error) {
            console.error('❌ Error updating customer dossier:', error);
        }
    }

    async _analyzeSentiment(content) {
        // Simple sentiment analysis (would use real NLP in production)
        const positiveWords = ['great', 'excellent', 'good', 'interested', 'excited', 'love', 'amazing'];
        const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'disappointed', 'frustrated', 'angry'];
        
        const lowerContent = content.toLowerCase();
        const positiveCount = positiveWords.filter(word => lowerContent.includes(word)).length;
        const negativeCount = negativeWords.filter(word => lowerContent.includes(word)).length;
        
        if (positiveCount > negativeCount) return 0.7;
        if (negativeCount > positiveCount) return 0.3;
        return 0.5; // Neutral
    }

    _updateStats(statType, increment = 1) {
        this.stats[statType] = (this.stats[statType] || 0) + increment;
    }

    _updateSourceStats(sourceType, increment = 1) {
        this.stats.bySourceType[sourceType] = (this.stats.bySourceType[sourceType] || 0) + increment;
    }

    async getProcessingStats() {
        return {
            ...this.stats,
            falsePositiveRate: this.stats.totalProcessed > 0 ? 
                this.stats.falsePositives / this.stats.totalProcessed : 0,
            opportunityRate: this.stats.totalProcessed > 0 ? 
                this.stats.opportunitiesFound / this.stats.totalProcessed : 0
        };
    }

    async getActiveOpportunities(limit = 20) {
        return await this.stickySystem.getActiveStickies(null, limit);
    }

    async getFollowUpOpportunities() {
        return await this.stickySystem.getFollowUpStickies();
    }

    async markOpportunityActionTaken(stickyId, action, notes = null) {
        await this.stickySystem.markStickyActionTaken(stickyId, action, notes);
        this._updateStats('actionTaken', 1);
    }

    async markOpportunityFalsePositive(stickyId) {
        await this.stickySystem.markStickyFalsePositive(stickyId);
        this._updateStats('falsePositives', 1);
    }

    // Batch processing methods
    async processBatch(inputs) {
        const results = [];
        
        for (const input of inputs) {
            try {
                const result = await this._processInput(
                    input.sourceType,
                    input.sourceId,
                    input.content,
                    input.metadata
                );
                results.push({ success: true, result, input });
            } catch (error) {
                results.push({ success: false, error: error.message, input });
            }
        }
        
        return results;
    }

    // Real-time processing for live inputs
    async processLiveInput(sourceType, sourceId, content, metadata) {
        // Process immediately for real-time inputs
        const result = await this._processInput(sourceType, sourceId, content, metadata);
        
        // Emit real-time events
        if (result.processed && result.stickyCount > 0) {
            this.emit('realTimeOpportunity', {
                sourceType,
                sourceId,
                opportunities: result.stickies,
                timestamp: new Date().toISOString()
            });
        }
        
        return result;
    }

    async shutdown() {
        console.log('🛑 Shutting down Robbie Input Processing Pipeline...');
        
        if (this.stickySystem) {
            await this.stickySystem.shutdown();
        }
        
        if (this.memorySystem) {
            await this.memorySystem.shutdown();
        }
        
        if (this.customerDossier) {
            await this.customerDossier.shutdown();
        }
        
        this.isInitialized = false;
        console.log('✅ Robbie Input Processing Pipeline shutdown complete');
    }
}

export default RobbieInputProcessor;
