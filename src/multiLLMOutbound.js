// Multi-LLM Outbound Communication System
// Uses ChatGPT, Claude, and local LLM to generate 3 options, Robbie judges best

class MultiLLMOutbound {
  constructor(db, budgetManager) {
    this.db = db;
    this.budgetManager = budgetManager;
    
    this.llmProviders = {
      'chatgpt': {
        name: 'ChatGPT',
        model: 'gpt-4',
        api_endpoint: 'https://api.openai.com/v1/chat/completions',
        cost_per_token: 0.00003,
        strengths: ['detail_oriented', 'consistency', 'bug_hunting'],
        emoji: '🤖'
      },
      'claude': {
        name: 'Claude',
        model: 'claude-3-sonnet',
        api_endpoint: 'https://api.anthropic.com/v1/messages',
        cost_per_token: 0.000015,
        strengths: ['strategic_thinking', 'creativity', 'nuance'],
        emoji: '🧠'
      },
      'local_llm': {
        name: 'Local LLM',
        model: 'llama-3-70b',
        api_endpoint: 'http://localhost:11434/api/generate',
        cost_per_token: 0, // Free local inference
        strengths: ['privacy', 'speed', 'customization'],
        emoji: '🏠'
      }
    };

    this.robbieJudge = {
      engine: 'claude', // Robbie uses Claude for judging
      criteria: [
        'outcome_optimization',
        'recipient_personalization', 
        'context_appropriateness',
        'tone_calibration',
        'motivation_alignment'
      ],
      confidence_threshold: 0.8
    };
  }

  // Generate 3 outbound options using different LLMs
  async generateOutboundOptions(recipient, context, desiredOutcome) {
    console.log(`📝 Generating 3 outbound options for ${recipient.name}...`);

    // Create comprehensive prompt for all LLMs
    const prompt = this.createOutboundPrompt(recipient, context, desiredOutcome);
    
    // Generate options in parallel
    const [chatgptOption, claudeOption, localOption] = await Promise.all([
      this.generateWithChatGPT(prompt, recipient),
      this.generateWithClaude(prompt, recipient),
      this.generateWithLocalLLM(prompt, recipient)
    ]);

    const options = {
      option_a: { ...chatgptOption, provider: 'chatgpt', emoji: '🤖' },
      option_b: { ...claudeOption, provider: 'claude', emoji: '🧠' },
      option_c: { ...localOption, provider: 'local_llm', emoji: '🏠' }
    };

    // Have Robbie judge the best option
    const judgment = await this.robbieJudgeOptions(options, recipient, context, desiredOutcome);

    // Store generation session
    await this.storeGenerationSession({
      recipient: recipient,
      context: context,
      desired_outcome: desiredOutcome,
      options: options,
      judgment: judgment,
      timestamp: new Date().toISOString()
    });

    return {
      options: options,
      robbie_recommendation: judgment.recommended_option,
      robbie_reasoning: judgment.reasoning,
      confidence: judgment.confidence
    };
  }

  // Create comprehensive outbound prompt
  createOutboundPrompt(recipient, context, desiredOutcome) {
    return `
You are crafting an outbound communication for Allan Peretz, CEO of TestPilot CPG.

RECIPIENT ANALYSIS:
Name: ${recipient.name}
Company: ${recipient.company}
Role: ${recipient.role}
Deal Stage: ${recipient.deal_stage}
Deal Value: $${recipient.deal_value?.toLocaleString()}
Last Interaction: ${recipient.last_interaction}
Engagement Level: ${recipient.engagement_level}
Clay Intelligence: ${JSON.stringify(recipient.clay_data || {})}

CONTEXT:
Situation: ${context.situation}
Timeline: ${context.timeline}
Business Pressure: ${context.business_pressure}
Previous Communications: ${JSON.stringify(context.previous_communications || [])}

DESIRED OUTCOME:
Primary Goal: ${desiredOutcome.primary_goal}
Success Metrics: ${desiredOutcome.success_metrics}
Call to Action: ${desiredOutcome.call_to_action}

CRITICAL REQUIREMENTS:
1. Perfect tone for THIS recipient (not Allan's personality)
2. Optimized for THIS outcome (not generic)
3. Personalized for THIS person (use their context)
4. Appropriate for THIS context (business situation)

Generate a compelling, personalized outbound message that maximizes the probability of achieving the desired outcome.
    `;
  }

  // Generate with ChatGPT
  async generateWithChatGPT(prompt, recipient) {
    try {
      // Check budget
      const canSpend = await this.budgetManager.canSpend('chatgpt', 0.50);
      if (!canSpend.canSpend) {
        throw new Error('ChatGPT budget exceeded');
      }

      // Mock ChatGPT response - in production, call actual API
      const response = {
        subject: `TestPilot October Release - ${recipient.company} Partnership`,
        body: `Hi ${recipient.name},\n\nJust wrapped our October release after 5 days of intense development. The behavioral testing features we discussed for ${recipient.company} are now live and I think you'll love what we've built.\n\nGiven your ${recipient.role} role and the ${recipient.deal_stage} stage of our discussions, I wanted to personally reach out about next steps.\n\nWorth a 15-minute call this week to show you the demo?\n\nBest,\nAllan`,
        tone: 'professional_direct',
        personalization_score: 85,
        estimated_tokens: 150,
        cost: 0.45
      };

      // Record spend
      await this.budgetManager.recordSpend('chatgpt', response.cost, `Outbound generation for ${recipient.name}`);

      return response;

    } catch (error) {
      return {
        error: error.message,
        fallback: true,
        subject: 'Error generating ChatGPT option',
        body: 'ChatGPT generation failed'
      };
    }
  }

  // Generate with Claude
  async generateWithClaude(prompt, recipient) {
    try {
      // Check budget
      const canSpend = await this.budgetManager.canSpend('claude', 0.30);
      if (!canSpend.canSpend) {
        throw new Error('Claude budget exceeded');
      }

      // Mock Claude response - in production, call actual API
      const response = {
        subject: `Quick update on TestPilot progress`,
        body: `Hi ${recipient.name},\n\nI know you've been waiting for an update on our October release. We've been heads-down for 5 days building exactly what ${recipient.company} needs.\n\nThe timing is perfect - with GroceryShop approaching, this demo could be incredibly valuable for your team's conversations.\n\nI'd love to show you a 10-minute preview of what we've built. Available for a quick call?\n\nThanks,\nAllan`,
        tone: 'strategic_warm',
        personalization_score: 92,
        estimated_tokens: 140,
        cost: 0.28
      };

      await this.budgetManager.recordSpend('claude', response.cost, `Outbound generation for ${recipient.name}`);

      return response;

    } catch (error) {
      return {
        error: error.message,
        fallback: true,
        subject: 'Error generating Claude option',
        body: 'Claude generation failed'
      };
    }
  }

  // Generate with Local LLM
  async generateWithLocalLLM(prompt, recipient) {
    try {
      // Local LLM is free but may be slower
      const response = {
        subject: `${recipient.company} + TestPilot October Release`,
        body: `Hi ${recipient.name},\n\nComing up for air after our October release sprint. The features we discussed for ${recipient.company} are ready and I'm excited to show you what we've built.\n\nThis could be perfect timing given your ${recipient.deal_stage} stage and the upcoming industry events.\n\nInterested in a brief demo this week?\n\nBest regards,\nAllan`,
        tone: 'balanced_professional',
        personalization_score: 78,
        estimated_tokens: 135,
        cost: 0 // Free local inference
      };

      return response;

    } catch (error) {
      return {
        error: error.message,
        fallback: true,
        subject: 'Error generating Local LLM option',
        body: 'Local LLM generation failed'
      };
    }
  }

  // Robbie judges the three options
  async robbieJudgeOptions(options, recipient, context, desiredOutcome) {
    console.log('🧠 Robbie judging outbound options...');

    // Score each option based on criteria
    const scores = {};
    
    for (const [optionId, option] of Object.entries(options)) {
      scores[optionId] = await this.scoreOption(option, recipient, context, desiredOutcome);
    }

    // Find best option
    const bestOption = Object.entries(scores).reduce((best, [optionId, score]) => 
      score.total_score > best.score ? { option: optionId, score: score.total_score, details: score } : best
    , { option: 'option_a', score: 0, details: {} });

    const judgment = {
      recommended_option: bestOption.option,
      confidence: bestOption.details.confidence || 0.8,
      reasoning: this.generateJudgmentReasoning(bestOption, scores),
      scores: scores,
      judge_engine: 'claude'
    };

    return judgment;
  }

  // Score individual option
  async scoreOption(option, recipient, context, desiredOutcome) {
    if (option.error) {
      return { total_score: 0, confidence: 0, breakdown: { error: true } };
    }

    const scores = {
      outcome_optimization: this.scoreOutcomeOptimization(option, desiredOutcome),
      recipient_personalization: this.scorePersonalization(option, recipient),
      context_appropriateness: this.scoreContextAppropriateness(option, context),
      tone_calibration: this.scoreToneCalibration(option, recipient),
      motivation_alignment: this.scoreMotivationAlignment(option, recipient, desiredOutcome)
    };

    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.keys(scores).length;
    
    return {
      total_score: totalScore,
      confidence: Math.min(totalScore / 100, 1.0),
      breakdown: scores,
      personalization_score: option.personalization_score || 0
    };
  }

  // Scoring methods
  scoreOutcomeOptimization(option, outcome) {
    // Score how well the message drives toward desired outcome
    const bodyLower = option.body.toLowerCase();
    let score = 60; // Base score
    
    if (bodyLower.includes(outcome.call_to_action.toLowerCase())) score += 20;
    if (bodyLower.includes('demo') || bodyLower.includes('call')) score += 15;
    if (option.subject.toLowerCase().includes(outcome.primary_goal.toLowerCase())) score += 5;
    
    return Math.min(score, 100);
  }

  scorePersonalization(option, recipient) {
    // Score personalization level
    return option.personalization_score || 70;
  }

  scoreContextAppropriateness(option, context) {
    // Score context appropriateness
    const bodyLower = option.body.toLowerCase();
    let score = 70; // Base score
    
    if (bodyLower.includes(context.situation.toLowerCase())) score += 15;
    if (bodyLower.includes('october') || bodyLower.includes('release')) score += 10;
    if (bodyLower.includes('groceryshop') && context.timeline.includes('groceryshop')) score += 5;
    
    return Math.min(score, 100);
  }

  scoreToneCalibration(option, recipient) {
    // Score tone appropriateness for recipient
    let score = 75; // Base score
    
    if (recipient.seniority_level === 'senior' && option.tone.includes('professional')) score += 15;
    if (recipient.engagement_level === 'high' && option.tone.includes('direct')) score += 10;
    
    return Math.min(score, 100);
  }

  scoreMotivationAlignment(option, recipient, outcome) {
    // Score alignment with recipient's motivations
    return 80; // Mock score - would analyze recipient's motivations
  }

  // Generate judgment reasoning
  generateJudgmentReasoning(bestOption, allScores) {
    const best = allScores[bestOption.option];
    const reasoning = [];

    reasoning.push(`I recommend ${bestOption.option.replace('_', ' ').toUpperCase()} (${Math.round(best.total_score)}% score)`);
    
    if (best.breakdown.outcome_optimization > 85) {
      reasoning.push('Strong outcome optimization');
    }
    
    if (best.breakdown.recipient_personalization > 90) {
      reasoning.push('Excellent personalization');
    }
    
    if (best.breakdown.context_appropriateness > 85) {
      reasoning.push('Perfect context fit');
    }

    return reasoning.join('. ') + '.';
  }

  // Handle complete rejection with team fallback
  async handleCompleteRejection(generationSession) {
    console.log('❌ Allan rejected primary recommendation, offering team alternatives...');
    
    // Get the other options
    const alternatives = Object.entries(generationSession.options)
      .filter(([optionId]) => optionId !== generationSession.robbie_recommendation)
      .map(([optionId, option]) => ({ id: optionId, ...option }));

    const fallbackMessage = `Well the team also drafted this.... What do you think?`;
    
    return {
      fallback_offered: true,
      message: fallbackMessage,
      alternatives: alternatives,
      original_recommendation: generationSession.robbie_recommendation
    };
  }

  // Store generation session
  async storeGenerationSession(session) {
    await this.db.run(`
      INSERT INTO outbound_generation_sessions (
        recipient_data, context, desired_outcome, options, 
        judgment, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      JSON.stringify(session.recipient),
      JSON.stringify(session.context),
      JSON.stringify(session.desired_outcome),
      JSON.stringify(session.options),
      JSON.stringify(session.judgment),
      session.timestamp
    ]);
  }

  // Initialize database tables
  async initializeTables() {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS outbound_generation_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipient_data TEXT NOT NULL,
        context TEXT NOT NULL,
        desired_outcome TEXT NOT NULL,
        options TEXT NOT NULL,
        judgment TEXT NOT NULL,
        selected_option TEXT,
        user_feedback TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_outbound_sessions_timestamp ON outbound_generation_sessions (timestamp DESC);
    `);
  }
}

module.exports = MultiLLMOutbound;
