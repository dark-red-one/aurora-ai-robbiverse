#!/usr/bin/env node
/**
 * Live Chat Memory Processor
 * Processes all existing PostgreSQL chat memory and runs real-time monitoring
 */

import PostgresStickyIntegration from '../src/postgresStickyIntegration.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function runLiveProcessor() {
    console.log('🚀 Starting Live Chat Memory Processor...\n');
    
    try {
        // Initialize PostgreSQL integration
        const processor = new PostgresStickyIntegration({
            host: process.env.POSTGRES_HOST || 'aurora-postgres-u44170.vm.elestio.app',
            port: process.env.POSTGRES_PORT || 25432,
            database: process.env.POSTGRES_DB || 'aurora_unified',
            user: process.env.POSTGRES_USER || 'aurora_app',
            password: process.env.POSTGRES_PASSWORD || 'TestPilot2025_Aurora!'
        });
        
        await processor.initialize();
        
        console.log('✅ Connected to PostgreSQL chat memory\n');
        
        // Set up event listeners
        processor.on('opportunitiesFound', (data) => {
            console.log(`\n🎯 OPPORTUNITY DETECTED!`);
            console.log(`Source: ${data.sourceType}:${data.sourceId}`);
            console.log(`Stickies generated: ${data.stickyCount}`);
            
            for (const sticky of data.stickies) {
                console.log(`\n📝 STICKY NOTE:`);
                console.log(`Category: ${sticky.category}`);
                console.log(`Importance: ${sticky.importanceScore.toFixed(2)}`);
                console.log(`Urgency: ${sticky.urgencyScore.toFixed(2)}`);
                console.log(`Content: ${sticky.content}`);
                console.log(`Follow-up: ${sticky.followUpDate.toDateString()}`);
            }
            console.log('\n' + '='.repeat(60) + '\n');
        });
        
        processor.on('realTimeOpportunity', (data) => {
            console.log(`\n⚡ REAL-TIME OPPORTUNITY!`);
            console.log(`Message: ${data.message.substring(0, 100)}...`);
            console.log(`Stickies: ${data.stickies.length}`);
            console.log(`Time: ${data.timestamp}`);
        });
        
        // Process all historical chat data
        console.log('📚 Processing all historical chat data...');
        const historicalResult = await processor.processAllChatHistory();
        
        console.log(`\n📊 HISTORICAL PROCESSING RESULTS:`);
        console.log(`Conversations processed: ${historicalResult.conversationsProcessed}`);
        console.log(`Sticky notes generated: ${historicalResult.stickiesGenerated}`);
        
        // Show active opportunities
        const activeOpportunities = await processor.getActiveOpportunities(10);
        console.log(`\n🎯 ACTIVE OPPORTUNITIES (${activeOpportunities.length}):`);
        
        for (const opp of activeOpportunities) {
            console.log(`\n• ${opp.category.toUpperCase()}`);
            console.log(`  ${opp.extracted_opportunity}`);
            console.log(`  Company: ${opp.company || 'Unknown'}`);
            console.log(`  Importance: ${opp.importance_score.toFixed(2)} | Urgency: ${opp.urgency_score.toFixed(2)}`);
            console.log(`  Created: ${new Date(opp.created_at).toLocaleDateString()}`);
            console.log(`  Follow-up: ${opp.follow_up_date}`);
        }
        
        // Show follow-up opportunities
        const followUpOpportunities = await processor.getFollowUpOpportunities();
        if (followUpOpportunities.length > 0) {
            console.log(`\n⏰ FOLLOW-UP OPPORTUNITIES (${followUpOpportunities.length}):`);
            
            for (const opp of followUpOpportunities) {
                console.log(`\n• ${opp.company} - ${opp.extracted_opportunity}`);
                console.log(`  Follow-up due: ${opp.follow_up_date}`);
                console.log(`  Importance: ${opp.importance_score.toFixed(2)}`);
            }
        }
        
        // Start real-time processing
        console.log('\n🔄 Starting real-time monitoring...');
        await processor.startRealTimeProcessing(30000); // Check every 30 seconds
        
        console.log('✅ Live processor running! Press Ctrl+C to stop.\n');
        
        // Keep the process running
        process.on('SIGINT', async () => {
            console.log('\n🛑 Shutting down live processor...');
            await processor.shutdown();
            process.exit(0);
        });
        
        // Show stats every 5 minutes
        setInterval(async () => {
            const stats = await processor.getProcessingStats();
            console.log(`\n📊 STATS UPDATE:`);
            console.log(`Total conversations: ${stats.totalConversationsProcessed}`);
            console.log(`Total messages: ${stats.totalMessagesProcessed}`);
            console.log(`Total stickies: ${stats.stickiesGenerated}`);
            console.log(`Opportunity rate: ${(stats.opportunityRate * 100).toFixed(1)}%`);
            console.log(`Time: ${new Date().toLocaleTimeString()}`);
        }, 300000); // Every 5 minutes
        
    } catch (error) {
        console.error('❌ Live processor failed:', error);
        process.exit(1);
    }
}

// Run the live processor
runLiveProcessor().catch(console.error);
