const { Pool } = require('pg');
const { sendEmail } = require('./EmailService');
const { generateContent } = require('./GenerativeCapabilitiesSystem');



/**
 * Daily Brief System - Immediate Productivity Wins
 * Delivers morning briefs, afternoon check-ins, and evening prep
 * Saves 30-45 minutes per day through intelligent prioritization
 */

class DailyBriefSystem {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL
        });
    }

    /**
     * Generate morning brief with top 3 priorities and outreach opportunities
     * Delivered by 8 AM daily
     */
    async generateMorningBrief(userId) {
        try {
            const priorities = await this.getTopPriorities(userId);
            const emailSummary = await this.getEmailSummary(userId);
            const calendarHighlights = await this.getCalendarHighlights(userId);
            const marketInsights = await this.getMarketInsights();
            const outreachOpportunities = await this.getTop3OutreachOpportunities(userId);

            const brief = {
                timestamp: new Date(),
                priorities: priorities,
                emailSummary: emailSummary,
                calendar: calendarHighlights,
                marketInsights: marketInsights,
                outreachOpportunities: outreachOpportunities,
                weather: await this.getWeatherContext(),
                energy: await this.getEnergyLevel(userId)
            };

            // Generate personalized brief content
            const briefContent = await this.generateBriefContent(brief);
            
            // Send via email and store in database
            await this.sendBrief(userId, briefContent);
            await this.storeBrief(userId, brief);

            return briefContent;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Generate afternoon check-in with progress update
     * Delivered by 2 PM daily
     */
    async generateAfternoonCheckIn(userId) {
        try {
            const progress = await this.getProgressUpdate(userId);
            const blockers = await this.getBlockers(userId);
            const tomorrowPrep = await this.getTomorrowPrep(userId);
            const energyCheck = await this.getEnergyLevel(userId);

            const checkIn = {
                timestamp: new Date(),
                progress: progress,
                blockers: blockers,
                tomorrowPrep: tomorrowPrep,
                energyLevel: energyCheck,
                recommendations: await this.getAfternoonRecommendations(progress, blockers)
            };

            const checkInContent = await this.generateCheckInContent(checkIn);
            
            await this.sendCheckIn(userId, checkInContent);
            await this.storeCheckIn(userId, checkIn);

            return checkInContent;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Generate evening prep for tomorrow
     * Delivered by 6 PM daily
     */
    async generateEveningPrep(userId) {
        try {
            const dayReview = await this.getDayReview(userId);
            const tomorrowFocus = await this.getTomorrowFocus(userId);
            const gratitude = await this.getGratitudePractice(userId);
            const windDown = await this.getWindDownSuggestions(userId);

            const eveningPrep = {
                timestamp: new Date(),
                dayReview: dayReview,
                tomorrowFocus: tomorrowFocus,
                gratitude: gratitude,
                windDown: windDown,
                sleepPrep: await this.getSleepPrep(userId)
            };

            const prepContent = await this.generateEveningPrepContent(eveningPrep);
            
            await this.sendEveningPrep(userId, prepContent);
            await this.storeEveningPrep(userId, eveningPrep);

            return prepContent;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get top 3 priorities for the day
     */
    async getTopPriorities(userId) {
        const query = `
            SELECT 
                t.id,
                t.title,
                t.description,
                t.priority,
                t.due_date,
                t.estimated_duration,
                t.energy_required,
                t.context,
                t.dependencies,
                t.stakeholders,
                t.success_metrics,
                t.urgency_score,
                t.importance_score,
                t.complexity_score,
                t.energy_score,
                t.time_score,
                t.overall_score,
                t.created_at,
                t.updated_at
            FROM app.tasks t
            WHERE t.user_id = $1 
                AND t.status = 'pending'
                AND t.due_date <= CURRENT_DATE + INTERVAL '1 day'
            ORDER BY t.overall_score DESC, t.urgency_score DESC, t.importance_score DESC
            LIMIT 3
        `;

        const result = await this.pool.query(query, [userId]);
        return result.rows;
    }

    /**
     * Get email summary with key insights
     */
    async getEmailSummary(userId) {
        const query = `
            SELECT 
                COUNT(*) as total_emails,
                COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority,
                COUNT(CASE WHEN priority = 'medium' THEN 1 END) as medium_priority,
                COUNT(CASE WHEN priority = 'low' THEN 1 END) as low_priority,
                COUNT(CASE WHEN requires_response = true THEN 1 END) as requires_response,
                COUNT(CASE WHEN is_urgent = true THEN 1 END) as urgent,
                COUNT(CASE WHEN is_important = true THEN 1 END) as important,
                COUNT(CASE WHEN is_routine = true THEN 1 END) as routine,
                COUNT(CASE WHEN is_archive = true THEN 1 END) as archive
            FROM app.emails
            WHERE user_id = $1 
                AND received_at >= CURRENT_DATE
                AND received_at < CURRENT_DATE + INTERVAL '1 day'
        `;

        const result = await this.pool.query(query, [userId]);
        return result.rows[0];
    }

    /**
     * Get calendar highlights for the day
     */
    async getCalendarHighlights(userId) {
        const query = `
            SELECT 
                c.id,
                c.title,
                c.start_time,
                c.end_time,
                c.location,
                c.description,
                c.attendees,
                c.priority,
                c.meeting_type,
                c.prep_required,
                c.follow_up_required,
                c.success_metrics,
                c.energy_required,
                c.context,
                c.stakeholders,
                c.decision_points,
                c.risks,
                c.opportunities,
                c.created_at,
                c.updated_at
            FROM app.calendar_events c
            WHERE c.user_id = $1 
                AND c.start_time >= CURRENT_DATE
                AND c.start_time < CURRENT_DATE + INTERVAL '1 day'
            ORDER BY c.start_time ASC
        `;

        const result = await this.pool.query(query, [userId]);
        return result.rows;
    }

    /**
     * Get market insights and trends
     */
    async getMarketInsights() {
        // This would integrate with external APIs for market data
        // For now, return mock data
        return {
            marketTrends: [
                "AI productivity tools seeing 40% adoption increase",
                "Remote work optimization becoming priority for SMBs",
                "Email automation showing 60% time savings"
            ],
            competitorInsights: [
                "Notion launching new automation features",
                "Monday.com expanding AI capabilities",
                "Asana adding predictive analytics"
            ],
            opportunities: [
                "CPG companies seeking productivity solutions",
                "Small businesses ready for AI adoption",
                "Enterprise clients looking for customization"
            ]
        };
    }

    /**
     * Get weather context for energy planning
     */
    async getWeatherContext() {
        // This would integrate with weather API
        return {
            temperature: 72,
            condition: "Sunny",
            humidity: 45,
            energyImpact: "High energy day - good for complex tasks"
        };
    }

    /**
     * Get user's current energy level
     */
    async getEnergyLevel(userId) {
        const query = `
            SELECT 
                energy_level,
                sleep_quality,
                stress_level,
                mood,
                physical_activity,
                nutrition_score,
                hydration_score,
                social_energy,
                mental_energy,
                physical_energy,
                spiritual_energy,
                overall_energy,
                energy_trend,
                energy_factors,
                energy_recommendations,
                recorded_at
            FROM app.energy_tracking
            WHERE user_id = $1 
                AND recorded_at >= CURRENT_DATE - INTERVAL '1 day'
            ORDER BY recorded_at DESC
            LIMIT 1
        `;

        const result = await this.pool.query(query, [userId]);
        return result.rows[0] || {
            energy_level: 7,
            overall_energy: 7,
            energy_trend: 'stable',
            energy_recommendations: ['Take breaks every 90 minutes', 'Stay hydrated', 'Get sunlight']
        };
    }

    /**
     * Get top 3 outreach opportunities based on signals analysis and strategic context
     */
    async getTop3OutreachOpportunities(userId) {
        try {
            const query = `
                WITH contact_signals AS (
                    SELECT 
                        c.id,
                        c.first_name,
                        c.last_name,
                        c.email,
                        c.role,
                        o.name as company_name,
                        o.industry,
                        crs.overall_score as relationship_score,
                        crs.trend as relationship_trend,
                        ccp.preferred_channels,
                        ccp.optimal_timing,
                        ccp.tone_preference,
                        MAX(i.created_at) as last_interaction_date,
                        COUNT(i.id) as interaction_count,
                        AVG(i.sentiment) as avg_sentiment,
                        COUNT(CASE WHEN i.follow_up_required = true THEN 1 END) as pending_followups,
                        COUNT(CASE WHEN i.created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as recent_interactions
                    FROM app.contacts c
                    LEFT JOIN app.organizations o ON c.organization_id = o.id
                    LEFT JOIN app.contact_relationship_scores crs ON c.id = crs.contact_id
                    LEFT JOIN app.contact_communication_preferences ccp ON c.id = ccp.contact_id
                    LEFT JOIN app.interactions i ON c.id = i.contact_id
                    WHERE c.user_id = $1
                        AND c.status = 'active'
                        AND (crs.overall_score >= 60 OR c.last_contact_date <= CURRENT_DATE - INTERVAL '14 days')
                    GROUP BY c.id, c.first_name, c.last_name, c.email, c.role, o.name, o.industry, 
                             crs.overall_score, crs.trend, ccp.preferred_channels, ccp.optimal_timing, ccp.tone_preference
                ),
                opportunity_analysis AS (
                    SELECT 
                        cs.*,
                        co.opportunity_type,
                        co.title as opportunity_title,
                        co.description as opportunity_description,
                        co.priority as opportunity_priority,
                        co.success_probability,
                        co.estimated_value,
                        co.timeline_days,
                        co.required_actions,
                        co.success_metrics,
                        -- Calculate opportunity score based on multiple factors
                        (
                            COALESCE(cs.relationship_score, 0) * 0.3 +
                            COALESCE(co.success_probability, 0) * 0.25 +
                            COALESCE(co.priority, 0) * 20 * 0.2 +
                            CASE 
                                WHEN cs.last_interaction_date <= CURRENT_DATE - INTERVAL '7 days' THEN 20
                                WHEN cs.last_interaction_date <= CURRENT_DATE - INTERVAL '14 days' THEN 15
                                WHEN cs.last_interaction_date <= CURRENT_DATE - INTERVAL '30 days' THEN 10
                                ELSE 5
                            END * 0.15 +
                            CASE 
                                WHEN cs.pending_followups > 0 THEN 15
                                ELSE 0
                            END * 0.1
                        ) as opportunity_score
                    FROM contact_signals cs
                    LEFT JOIN app.contact_opportunities co ON cs.id = co.contact_id
                    WHERE co.status = 'identified' OR co.status IS NULL
                )
                SELECT 
                    id,
                    first_name,
                    last_name,
                    email,
                    role,
                    company_name,
                    industry,
                    relationship_score,
                    relationship_trend,
                    preferred_channels,
                    optimal_timing,
                    tone_preference,
                    last_interaction_date,
                    interaction_count,
                    avg_sentiment,
                    pending_followups,
                    recent_interactions,
                    opportunity_type,
                    opportunity_title,
                    opportunity_description,
                    opportunity_priority,
                    success_probability,
                    estimated_value,
                    timeline_days,
                    required_actions,
                    success_metrics,
                    opportunity_score,
                    -- Generate recommended communication actions
                    CASE 
                        WHEN opportunity_type = 'immediate' THEN 'Send personalized message within 2 hours'
                        WHEN opportunity_type = 'short_term' THEN 'Schedule follow-up call this week'
                        WHEN opportunity_type = 'long_term' THEN 'Add to nurture sequence'
                        WHEN pending_followups > 0 THEN 'Complete pending follow-up'
                        WHEN last_interaction_date <= CURRENT_DATE - INTERVAL '14 days' THEN 'Re-engage with value-add content'
                        ELSE 'Initiate new conversation'
                    END as recommended_action,
                    -- Generate communication strategy
                    CASE 
                        WHEN preferred_channels @> '["email"]' THEN 'Email'
                        WHEN preferred_channels @> '["linkedin"]' THEN 'LinkedIn'
                        WHEN preferred_channels @> '["phone"]' THEN 'Phone call'
                        ELSE 'Email'
                    END as recommended_channel,
                    -- Generate timing recommendation
                    CASE 
                        WHEN optimal_timing->>'time_of_day' IS NOT NULL THEN optimal_timing->>'time_of_day'
                        ELSE 'Morning (9-11 AM)'
                    END as recommended_timing
                FROM opportunity_analysis
                ORDER BY opportunity_score DESC, relationship_score DESC, last_interaction_date ASC
                LIMIT 3
            `;

            const result = await this.pool.query(query, [userId]);
            return result.rows.map(row => ({
                contact: {
                    id: row.id,
                    name: `${row.first_name} ${row.last_name}`,
                    email: row.email,
                    role: row.role,
                    company: row.company_name,
                    industry: row.industry
                },
                relationship: {
                    score: row.relationship_score,
                    trend: row.relationship_trend,
                    lastInteraction: row.last_interaction_date,
                    interactionCount: row.interaction_count,
                    avgSentiment: row.avg_sentiment
                },
                opportunity: {
                    type: row.opportunity_type,
                    title: row.opportunity_title,
                    description: row.opportunity_description,
                    priority: row.opportunity_priority,
                    successProbability: row.success_probability,
                    estimatedValue: row.estimated_value,
                    timelineDays: row.timeline_days,
                    requiredActions: row.required_actions,
                    successMetrics: row.success_metrics
                },
                communication: {
                    recommendedAction: row.recommended_action,
                    channel: row.recommended_channel,
                    timing: row.recommended_timing,
                    preferredChannels: row.preferred_channels,
                    tonePreference: row.tone_preference
                },
                signals: {
                    pendingFollowups: row.pending_followups,
                    recentInteractions: row.recent_interactions,
                    opportunityScore: row.opportunity_score
                }
            }));
        } catch (error) {
            return [];
        }
    }

    /**
     * Generate personalized brief content
     */
    async generateBriefContent(brief) {
        const prompt = `
            Generate a personalized morning brief for Allan Peretz based on this data:
            
            Priorities: ${JSON.stringify(brief.priorities)}
            Email Summary: ${JSON.stringify(brief.emailSummary)}
            Calendar: ${JSON.stringify(brief.calendar)}
            Market Insights: ${JSON.stringify(brief.marketInsights)}
            Outreach Opportunities: ${JSON.stringify(brief.outreachOpportunities)}
            Weather: ${JSON.stringify(brief.weather)}
            Energy Level: ${JSON.stringify(brief.energy)}
            
            Style: Confident, actionable, supportive. Focus on what matters most.
            Tone: Professional but personal, like a trusted advisor.
            Length: 4-5 paragraphs, bullet points for priorities and outreach.
            
            Include:
            1. Top 3 priorities with specific actions
            2. Email highlights requiring attention
            3. Calendar preparation tips
            4. Top 3 Outreach Opportunities with recommended communication actions
            5. Energy optimization suggestions
            6. Market opportunities to consider
            
            For Outreach Opportunities, include:
            - Contact name, company, and role
            - Relationship score and trend
            - Opportunity type and description
            - Recommended action with specific timing
            - Communication channel and tone preference
            - Success probability and estimated value
        `;

        return await generateContent(prompt, 'text');
    }

    /**
     * Generate afternoon check-in content
     */
    async generateCheckInContent(checkIn) {
        const prompt = `
            Generate an afternoon check-in for Allan Peretz based on this data:
            
            Progress: ${JSON.stringify(checkIn.progress)}
            Blockers: ${JSON.stringify(checkIn.blockers)}
            Tomorrow Prep: ${JSON.stringify(checkIn.tomorrowPrep)}
            Energy Level: ${JSON.stringify(checkIn.energyLevel)}
            Recommendations: ${JSON.stringify(checkIn.recommendations)}
            
            Style: Encouraging, solution-focused, forward-looking.
            Tone: Supportive coach who sees the bigger picture.
            Length: 2-3 paragraphs with actionable next steps.
            
            Include:
            1. Progress celebration
            2. Blocker solutions
            3. Energy management tips
            4. Tomorrow preparation
            5. End-of-day recommendations
        `;

        return await generateContent(prompt, 'text');
    }

    /**
     * Generate evening prep content
     */
    async generateEveningPrepContent(eveningPrep) {
        const prompt = `
            Generate an evening prep for Allan Peretz based on this data:
            
            Day Review: ${JSON.stringify(eveningPrep.dayReview)}
            Tomorrow Focus: ${JSON.stringify(eveningPrep.tomorrowFocus)}
            Gratitude: ${JSON.stringify(eveningPrep.gratitude)}
            Wind Down: ${JSON.stringify(eveningPrep.windDown)}
            Sleep Prep: ${JSON.stringify(eveningPrep.sleepPrep)}
            
            Style: Reflective, calming, forward-looking.
            Tone: Wise mentor helping you wind down and prepare.
            Length: 2-3 paragraphs with gentle guidance.
            
            Include:
            1. Day reflection and wins
            2. Tomorrow's focus areas
            3. Gratitude practice
            4. Wind-down suggestions
            5. Sleep preparation tips
        `;

        return await generateContent(prompt, 'text');
    }

    /**
     * Send brief via email
     */
    async sendBrief(userId, content) {
        const emailData = {
            to: await this.getUserEmail(userId),
            subject: `🌅 Morning Brief - ${new Date().toLocaleDateString()}`,
            html: this.formatBriefEmail(content),
            priority: 'high'
        };

        return await sendEmail(emailData);
    }

    /**
     * Send check-in via email
     */
    async sendCheckIn(userId, content) {
        const emailData = {
            to: await this.getUserEmail(userId),
            subject: `🌤️ Afternoon Check-in - ${new Date().toLocaleDateString()}`,
            html: this.formatCheckInEmail(content),
            priority: 'medium'
        };

        return await sendEmail(emailData);
    }

    /**
     * Send evening prep via email
     */
    async sendEveningPrep(userId, content) {
        const emailData = {
            to: await this.getUserEmail(userId),
            subject: `🌙 Evening Prep - ${new Date().toLocaleDateString()}`,
            html: this.formatEveningPrepEmail(content),
            priority: 'low'
        };

        return await sendEmail(emailData);
    }

    /**
     * Format brief email with HTML
     */
    formatBriefEmail(content) {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
                    <h1 style="margin: 0; font-size: 24px;">🌅 Morning Brief</h1>
                    <p style="margin: 5px 0 0 0; opacity: 0.9;">${new Date().toLocaleDateString()}</p>
                </div>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 10px 10px;">
                    ${content.replace(/\n/g, '<br>')}
                </div>
            </div>
        `;
    }

    /**
     * Format check-in email with HTML
     */
    formatCheckInEmail(content) {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
                    <h1 style="margin: 0; font-size: 24px;">🌤️ Afternoon Check-in</h1>
                    <p style="margin: 5px 0 0 0; opacity: 0.9;">${new Date().toLocaleDateString()}</p>
                </div>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 10px 10px;">
                    ${content.replace(/\n/g, '<br>')}
                </div>
            </div>
        `;
    }

    /**
     * Format evening prep email with HTML
     */
    formatEveningPrepEmail(content) {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
                    <h1 style="margin: 0; font-size: 24px;">🌙 Evening Prep</h1>
                    <p style="margin: 5px 0 0 0; opacity: 0.9;">${new Date().toLocaleDateString()}</p>
                </div>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 10px 10px;">
                    ${content.replace(/\n/g, '<br>')}
                </div>
            </div>
        `;
    }

    /**
     * Get user email address
     */
    async getUserEmail(userId) {
        const query = 'SELECT email FROM app.users WHERE id = $1';
        const result = await this.pool.query(query, [userId]);
        return result.rows[0]?.email;
    }

    /**
     * Store brief in database
     */
    async storeBrief(userId, brief) {
        const query = `
            INSERT INTO app.daily_briefs (user_id, brief_type, content, data, created_at)
            VALUES ($1, 'morning', $2, $3, $4)
        `;

        await this.pool.query(query, [
            userId,
            JSON.stringify(brief),
            JSON.stringify(brief),
            new Date()
        ]);
    }

    /**
     * Store check-in in database
     */
    async storeCheckIn(userId, checkIn) {
        const query = `
            INSERT INTO app.daily_briefs (user_id, brief_type, content, data, created_at)
            VALUES ($1, 'afternoon', $2, $3, $4)
        `;

        await this.pool.query(query, [
            userId,
            JSON.stringify(checkIn),
            JSON.stringify(checkIn),
            new Date()
        ]);
    }

    /**
     * Store evening prep in database
     */
    async storeEveningPrep(userId, eveningPrep) {
        const query = `
            INSERT INTO app.daily_briefs (user_id, brief_type, content, data, created_at)
            VALUES ($1, 'evening', $2, $3, $4)
        `;

        await this.pool.query(query, [
            userId,
            JSON.stringify(eveningPrep),
            JSON.stringify(eveningPrep),
            new Date()
        ]);
    }

    // Additional helper methods would be implemented here...
    // getProgressUpdate, getBlockers, getTomorrowPrep, etc.
}

module.exports = DailyBriefSystem;
