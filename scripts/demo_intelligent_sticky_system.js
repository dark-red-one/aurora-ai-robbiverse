#!/usr/bin/env node
/**
 * Demo Script for Intelligent Sticky System
 * Shows how all Robbie inputs generate automatic sticky notes for opportunities
 */

import RobbieInputProcessor from '../src/robbieInputProcessor.js';

// Sample data that would come from real sources
const sampleInputs = [
    {
        sourceType: 'email',
        sourceId: 'email_001',
        content: `Hi Allan,

Hope you're doing well! I wanted to follow up on our conversation about TestPilot CPG.

BillCo is raising $6M and is close to closing. More budget next year? We're definitely interested in scaling our customer insights platform.

Also, our CEO mentioned wanting to accelerate the timeline - we might be able to move faster than expected.

Let me know your thoughts!

Best,
Sarah Johnson
VP of Marketing, BillCo`,
        metadata: {
            from: 'sarah.johnson@billco.com',
            subject: 'Follow up - BillCo scaling plans',
            company: 'BillCo',
            contactEmail: 'sarah.johnson@billco.com',
            timestamp: new Date().toISOString()
        }
    },
    {
        sourceType: 'chat_message',
        sourceId: 'chat_001',
        content: `Allan: Hey, just had a call with TechStart Inc. They're hiring a 15-person engineering team and looking for customer analytics tools. Their founder mentioned they have a $2M budget for Q2.

Robbie: That's interesting! Should we reach out?

Allan: Hmmm... they're still in early stage but the founder seems really sharp. Might be worth keeping in mind for next quarter.`,
        metadata: {
            channel: 'internal_chat',
            timestamp: new Date().toISOString()
        }
    },
    {
        sourceType: 'meeting_note',
        sourceId: 'meeting_001',
        content: `Meeting with GlobalCorp - Q2 Planning Session

Attendees: Allan, Mike Chen (VP Sales), Jennifer Liu (CEO)

Key Points:
- GlobalCorp is expanding into 3 new markets
- They're dissatisfied with their current analytics provider
- CEO mentioned wanting to "accelerate our data-driven decision making"
- Budget increase of 40% for next year
- Timeline: Want to implement by Q3

Next Steps:
- Send proposal by Friday
- Schedule demo for next week`,
        metadata: {
            title: 'GlobalCorp Q2 Planning',
            attendees: ['Allan', 'Mike Chen', 'Jennifer Liu'],
            company: 'GlobalCorp',
            contactEmail: 'jennifer.liu@globalcorp.com',
            timestamp: new Date().toISOString()
        }
    },
    {
        sourceType: 'phone_call',
        sourceId: 'call_001',
        content: `Phone call transcript with David Park from InnovateLab:

Allan: Thanks for taking the time to chat, David.

David: No problem! So we're in the middle of a Series B round - looking to raise $15M. Our current customer analytics tools are just not cutting it anymore.

Allan: What specifically isn't working?

David: We need real-time insights but our current solution takes 24 hours to process data. We're growing fast and need something that can scale with us.

Allan: How fast are you growing?

David: We've doubled our team in the last 6 months and expect to triple revenue this year. We need a solution that can handle enterprise-level data processing.

Allan: That sounds like exactly what we do. When would you need this implemented?

David: Ideally by end of Q2. We have a board meeting in July and want to show them our new analytics capabilities.

Allan: That's definitely doable. Let me put together a proposal for you.

David: Perfect! Also, our CTO is really interested in the technical architecture. Can you include some technical details?

Allan: Absolutely. I'll send that over by Thursday.

David: Great! Looking forward to it.`,
        metadata: {
            caller: 'David Park',
            callee: 'Allan',
            duration: 1200, // 20 minutes
            company: 'InnovateLab',
            contactEmail: 'david.park@innovatelab.com',
            timestamp: new Date().toISOString()
        }
    },
    {
        sourceType: 'crm_record',
        sourceId: 'crm_001',
        content: `CRM Update - MegaCorp Account

Contact: Lisa Thompson, CMO
Company: MegaCorp
Deal Stage: Negotiation
Deal Value: $150,000
Probability: 75%

Latest Update:
- Lisa mentioned they're expanding their marketing team by 25 people
- Budget approved for customer analytics platform
- Competitor (DataCorp) had a major outage last week
- Decision timeline moved up to end of month
- CEO personally involved in final decision

Notes:
- Lisa seems frustrated with current solution
- Mentioned "we need something more reliable"
- Budget increase of $50K approved
- Decision expected within 2 weeks`,
        metadata: {
            type: 'deal_update',
            company: 'MegaCorp',
            email: 'lisa.thompson@megacorp.com',
            stage: 'negotiation',
            value: 150000,
            probability: 0.75,
            timestamp: new Date().toISOString()
        }
    },
    {
        sourceType: 'social_media',
        sourceId: 'social_001',
        content: `LinkedIn Post from Alex Rodriguez, CEO of ScaleUp:

"Excited to announce we've closed our Series A funding round! $8M to accelerate our growth. 

We're hiring across all departments and looking for partners who can help us scale our customer operations. 

The next 12 months are going to be incredible! 🚀

#startup #funding #growth #hiring"

Comments:
- "Congrats Alex! What kind of partners are you looking for?"
- "Amazing news! We're definitely interested in discussing opportunities"
- "Let's connect! We have solutions for scaling customer operations"`,
        metadata: {
            platform: 'linkedin',
            author: 'Alex Rodriguez',
            company: 'ScaleUp',
            url: 'https://linkedin.com/posts/alex-rodriguez-123',
            engagement: 150,
            timestamp: new Date().toISOString()
        }
    }
];

async function runDemo() {
    console.log('🚀 Starting Intelligent Sticky System Demo...\n');
    
    try {
        // Initialize the input processor
        const processor = new RobbieInputProcessor();
        await processor.initialize();
        
        console.log('✅ Input processor initialized\n');
        
        // Process each sample input
        for (const input of sampleInputs) {
            console.log(`📥 Processing ${input.sourceType}: ${input.sourceId}`);
            console.log(`Content preview: ${input.content.substring(0, 100)}...\n`);
            
            const result = await processor.processLiveInput(
                input.sourceType,
                input.sourceId,
                input.content,
                input.metadata
            );
            
            if (result.processed && result.stickyCount > 0) {
                console.log(`🎯 Generated ${result.stickyCount} sticky notes!`);
                
                for (const sticky of result.stickies) {
                    console.log(`\n📝 STICKY NOTE:`);
                    console.log(`Category: ${sticky.category}`);
                    console.log(`Importance: ${sticky.importanceScore.toFixed(2)}`);
                    console.log(`Urgency: ${sticky.urgencyScore.toFixed(2)}`);
                    console.log(`Confidence: ${sticky.confidenceScore.toFixed(2)}`);
                    console.log(`Content: ${sticky.content}`);
                    console.log(`Follow-up: ${sticky.followUpDate.toDateString()}`);
                }
            } else {
                console.log(`❌ No opportunities detected`);
            }
            
            console.log('\n' + '='.repeat(80) + '\n');
        }
        
        // Show summary statistics
        const stats = await processor.getProcessingStats();
        console.log('📊 PROCESSING STATISTICS:');
        console.log(`Total inputs processed: ${stats.totalProcessed}`);
        console.log(`Opportunities found: ${stats.opportunitiesFound}`);
        console.log(`Opportunity rate: ${(stats.opportunityRate * 100).toFixed(1)}%`);
        console.log(`False positive rate: ${(stats.falsePositiveRate * 100).toFixed(1)}%`);
        
        console.log('\n📈 BY SOURCE TYPE:');
        for (const [sourceType, count] of Object.entries(stats.bySourceType)) {
            console.log(`  ${sourceType}: ${count} inputs`);
        }
        
        // Show active opportunities
        const activeOpportunities = await processor.getActiveOpportunities(10);
        console.log(`\n🎯 ACTIVE OPPORTUNITIES (${activeOpportunities.length}):`);
        
        for (const opp of activeOpportunities) {
            console.log(`\n• ${opp.category.toUpperCase()} - ${opp.company || 'Unknown Company'}`);
            console.log(`  ${opp.extracted_opportunity}`);
            console.log(`  Importance: ${opp.importance_score.toFixed(2)} | Urgency: ${opp.urgency_score.toFixed(2)}`);
            console.log(`  Follow-up: ${opp.follow_up_date}`);
        }
        
        // Show follow-up opportunities
        const followUpOpportunities = await processor.getFollowUpOpportunities();
        if (followUpOpportunities.length > 0) {
            console.log(`\n⏰ FOLLOW-UP OPPORTUNITIES (${followUpOpportunities.length}):`);
            
            for (const opp of followUpOpportunities) {
                console.log(`\n• ${opp.company} - ${opp.extracted_opportunity}`);
                console.log(`  Follow-up due: ${opp.follow_up_date}`);
            }
        }
        
        console.log('\n🎉 Demo completed successfully!');
        
        // Cleanup
        await processor.shutdown();
        
    } catch (error) {
        console.error('❌ Demo failed:', error);
        process.exit(1);
    }
}

// Run the demo
runDemo().catch(console.error);
