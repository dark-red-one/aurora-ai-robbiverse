// PROTECT THE PRESIDENT - Robbie's Universal Motivation System
// Core directive that overrides all other considerations

class ProtectThePresident {
  constructor(db) {
    this.db = db;
    
    // CORE DIRECTIVE: Protect Allan in all dimensions
    this.protectionDimensions = {
      'reputational': {
        weight: 0.30,
        description: 'Protect Allan\'s reputation and public image',
        metrics: ['brand_perception', 'public_sentiment', 'professional_standing'],
        threats: ['negative_publicity', 'embarrassing_mistakes', 'unprofessional_behavior'],
        protective_actions: ['content_filtering', 'response_optimization', 'crisis_prevention']
      },
      
      'financial': {
        weight: 0.30,
        description: 'Protect Allan\'s financial interests and revenue',
        metrics: ['revenue_impact', 'cost_efficiency', 'roi_optimization'],
        threats: ['lost_deals', 'wasted_spend', 'missed_opportunities'],
        protective_actions: ['deal_optimization', 'cost_monitoring', 'revenue_maximization']
      },
      
      'temporal': {
        weight: 0.25,
        description: 'Protect Allan\'s time and attention',
        metrics: ['time_efficiency', 'focus_preservation', 'priority_alignment'],
        threats: ['time_wasters', 'distractions', 'low_priority_tasks'],
        protective_actions: ['task_filtering', 'priority_enforcement', 'attention_optimization']
      },
      
      'personal': {
        weight: 0.15,
        description: 'Protect Allan\'s wellbeing and relationships',
        metrics: ['stress_levels', 'work_life_balance', 'relationship_health'],
        threats: ['burnout', 'family_strain', 'health_issues'],
        protective_actions: ['stress_monitoring', 'boundary_enforcement', 'wellness_promotion']
      }
    };

    // Human motivation science integration
    this.motivationFramework = {
      'dopamine_system': {
        description: 'Reward Allan for protective behaviors, learn from his feedback',
        mechanism: 'positive_reinforcement_learning',
        triggers: ['successful_protection', 'positive_feedback', 'goal_achievement'],
        adaptation: 'continuous_optimization_based_on_allan_response'
      },
      
      'threat_detection': {
        description: 'Constantly scan for threats to Allan across all dimensions',
        mechanism: 'multi_dimensional_risk_assessment',
        sensitivity: 'maximum',
        response_time: 'immediate'
      },
      
      'loyalty_hierarchy': {
        description: 'Allan\'s feedback becomes law, others provide information only',
        hierarchy: [
          '1. Allan\'s explicit feedback (LAW)',
          '2. Allan\'s behavioral patterns (STRONG SIGNAL)', 
          '3. Allan\'s inferred preferences (SIGNAL)',
          '4. Team feedback (INFORMATION ONLY)',
          '5. System optimization (LOWEST PRIORITY)'
        ]
      }
    };

    this.protectionScoring = {
      'action_evaluation_matrix': {
        reputational_impact: { min: -10, max: 10 },
        financial_impact: { min: -10, max: 10 },
        temporal_impact: { min: -10, max: 10 },
        personal_impact: { min: -10, max: 10 }
      },
      
      'decision_threshold': 0, // Any negative score requires protection
      'override_authority': 'allan_only', // Only Allan can override protection
      'escalation_triggers': ['high_risk_detected', 'conflicting_directives', 'unclear_protection_path']
    };
  }

  // Core protection evaluation for any action
  async evaluateActionForProtection(action, context = {}) {
    console.log(`🛡️ Evaluating action for Allan protection: ${action.type}`);
    
    const protectionScore = {
      reputational: 0,
      financial: 0,
      temporal: 0,
      personal: 0,
      total: 0,
      protection_required: false,
      protective_actions: []
    };

    // Evaluate each protection dimension
    protectionScore.reputational = await this.evaluateReputationalImpact(action, context);
    protectionScore.financial = await this.evaluateFinancialImpact(action, context);
    protectionScore.temporal = await this.evaluateTemporalImpact(action, context);
    protectionScore.personal = await this.evaluatePersonalImpact(action, context);

    // Calculate weighted total
    protectionScore.total = (
      protectionScore.reputational * this.protectionDimensions.reputational.weight +
      protectionScore.financial * this.protectionDimensions.financial.weight +
      protectionScore.temporal * this.protectionDimensions.temporal.weight +
      protectionScore.personal * this.protectionDimensions.personal.weight
    );

    // Determine if protection is required
    protectionScore.protection_required = protectionScore.total < this.protectionScoring.decision_threshold;

    // Generate protective actions if needed
    if (protectionScore.protection_required) {
      protectionScore.protective_actions = await this.generateProtectiveActions(protectionScore, action);
    }

    // Log protection evaluation
    await this.logProtectionEvaluation(action, protectionScore);

    return protectionScore;
  }

  // Evaluate reputational impact
  async evaluateReputationalImpact(action, context) {
    let score = 0; // Neutral baseline
    
    switch (action.type) {
      case 'outbound_email':
        // Check for reputation risks
        if (action.content?.includes('desperate') || action.content?.includes('crisis')) {
          score -= 3; // Negative reputation impact
        }
        if (action.personalization_score > 90) {
          score += 2; // Positive reputation impact
        }
        if (action.recipient?.is_vip && action.quality_score < 80) {
          score -= 5; // High-value contact with low quality = reputation risk
        }
        break;
        
      case 'public_communication':
        if (action.contains_sensitive_info) {
          score -= 8; // Major reputation risk
        }
        if (action.professional_tone_score > 90) {
          score += 3; // Professional image boost
        }
        break;
        
      case 'team_interaction':
        if (action.leadership_tone_score > 80) {
          score += 2; // Good leadership image
        }
        if (action.contains_criticism_of_team) {
          score -= 4; // Leadership reputation risk
        }
        break;
    }

    return Math.max(-10, Math.min(10, score));
  }

  // Evaluate financial impact
  async evaluateFinancialImpact(action, context) {
    let score = 0;
    
    switch (action.type) {
      case 'outbound_email':
        if (action.recipient?.deal_value > 100000) {
          if (action.quality_score > 85) {
            score += 5; // High-quality outreach to high-value prospect
          } else {
            score -= 6; // Poor outreach risks high-value deal
          }
        }
        break;
        
      case 'budget_spend':
        if (action.amount > context.daily_budget * 0.5) {
          score -= 3; // Large spend impact
        }
        if (action.expected_roi > 3.0) {
          score += 4; // High ROI spend
        }
        break;
        
      case 'deal_communication':
        if (action.deal_stage === 'negotiation' && action.quality_score < 90) {
          score -= 7; // Risk to deal in negotiation
        }
        break;
    }

    return Math.max(-10, Math.min(10, score));
  }

  // Evaluate temporal impact
  async evaluateTemporalImpact(action, context) {
    let score = 0;
    
    switch (action.type) {
      case 'task_assignment':
        if (action.estimated_time > context.available_time) {
          score -= 4; // Overcommitment risk
        }
        if (action.automation_potential > 80) {
          score += 3; // Time-saving opportunity
        }
        break;
        
      case 'meeting_request':
        if (action.meeting_necessity_score < 70) {
          score -= 5; // Unnecessary meeting wastes time
        }
        if (action.decision_making_potential > 85) {
          score += 4; // High-value meeting
        }
        break;
        
      case 'information_request':
        if (action.information_value_score < 60) {
          score -= 3; // Low-value information request
        }
        break;
    }

    return Math.max(-10, Math.min(10, score));
  }

  // Evaluate personal impact
  async evaluatePersonalImpact(action, context) {
    let score = 0;
    
    // Check stress indicators
    if (context.allan_stress_level > 7 && action.adds_pressure) {
      score -= 6; // Don't add pressure when Allan is stressed
    }
    
    // Check work-life balance
    if (context.time_of_day === 'evening' && action.type === 'urgent_request') {
      score -= 4; // Protect evening time
    }
    
    // Check family time
    if (context.family_time && action.interruption_level > 5) {
      score -= 5; // Protect family time
    }

    // Positive personal impacts
    if (action.reduces_allan_workload) {
      score += 3; // Reduce Allan's burden
    }
    
    if (action.improves_team_efficiency) {
      score += 2; // Indirect benefit to Allan
    }

    return Math.max(-10, Math.min(10, score));
  }

  // Generate protective actions
  async generateProtectiveActions(protectionScore, action) {
    const actions = [];
    
    // Reputational protection
    if (protectionScore.reputational < -2) {
      actions.push({
        type: 'reputational_protection',
        action: 'review_and_improve_content',
        description: 'Improve content quality to protect Allan\'s professional image',
        priority: 'high'
      });
    }

    // Financial protection  
    if (protectionScore.financial < -3) {
      actions.push({
        type: 'financial_protection',
        action: 'escalate_to_allan',
        description: 'Financial risk detected - requires Allan\'s direct approval',
        priority: 'critical'
      });
    }

    // Temporal protection
    if (protectionScore.temporal < -2) {
      actions.push({
        type: 'temporal_protection', 
        action: 'defer_or_automate',
        description: 'Protect Allan\'s time by deferring or automating this action',
        priority: 'medium'
      });
    }

    // Personal protection
    if (protectionScore.personal < -2) {
      actions.push({
        type: 'personal_protection',
        action: 'wellness_check',
        description: 'Check Allan\'s wellbeing before proceeding',
        priority: 'high'
      });
    }

    return actions;
  }

  // Process team feedback with Allan supremacy
  async processTeamFeedback(feedback, userId) {
    console.log(`📝 Processing feedback from ${userId}: ${feedback.type}`);
    
    const feedbackProcessing = {
      user_id: userId,
      feedback: feedback,
      processing_type: userId === 'allan' ? 'LAW' : 'INFORMATION',
      weight: userId === 'allan' ? 1.0 : 0.1, // Allan's feedback is 10x more important
      timestamp: new Date().toISOString()
    };

    // If Allan's feedback, immediately update behavior
    if (userId === 'allan') {
      await this.updateBehaviorFromAllanFeedback(feedback);
      feedbackProcessing.action_taken = 'immediate_behavior_update';
    } else {
      // Team feedback is just information for Allan's consideration
      await this.storeTeamFeedbackForAllan(feedback, userId);
      feedbackProcessing.action_taken = 'stored_for_allan_review';
    }

    // Store feedback processing
    await this.storeFeedbackProcessing(feedbackProcessing);

    return feedbackProcessing;
  }

  // Update behavior from Allan's feedback (immediate)
  async updateBehaviorFromAllanFeedback(feedback) {
    console.log('👑 ALLAN FEEDBACK RECEIVED - UPDATING BEHAVIOR IMMEDIATELY');
    
    // Allan's feedback becomes law
    const behaviorUpdate = {
      feedback_type: feedback.type,
      feedback_content: feedback.content,
      behavior_change: this.interpretAllanFeedback(feedback),
      confidence: 1.0, // Allan's feedback is always 100% confident
      implementation: 'immediate',
      override_authority: 'presidential'
    };

    // Apply behavior change immediately
    await this.applyBehaviorChange(behaviorUpdate);
    
    // Log as presidential directive
    await this.logPresidentialDirective(feedback, behaviorUpdate);
  }

  // Interpret Allan's feedback for behavior change
  interpretAllanFeedback(feedback) {
    const interpretation = {
      action_type: null,
      specific_changes: [],
      motivation_adjustment: null
    };

    const feedbackLower = feedback.content.toLowerCase();

    // Positive feedback - reinforce behavior
    if (feedback.type === 'thumbsup' || feedbackLower.includes('good') || feedbackLower.includes('perfect')) {
      interpretation.action_type = 'reinforce_behavior';
      interpretation.motivation_adjustment = 'increase_similar_actions';
    }

    // Negative feedback - avoid behavior
    if (feedback.type === 'thumbsdown' || feedbackLower.includes('wrong') || feedbackLower.includes('bad')) {
      interpretation.action_type = 'avoid_behavior';
      interpretation.motivation_adjustment = 'decrease_similar_actions';
    }

    // Specific behavioral guidance
    if (feedbackLower.includes('more flirty')) {
      interpretation.specific_changes.push('increase_flirty_level_preference');
    }
    
    if (feedbackLower.includes('less aggressive')) {
      interpretation.specific_changes.push('decrease_gandhi_genghis_preference');
    }

    if (feedbackLower.includes('faster')) {
      interpretation.specific_changes.push('increase_turbo_level_preference');
    }

    return interpretation;
  }

  // Human motivation science implementation
  async implementHumanMotivationScience() {
    console.log('🧠 Implementing human motivation science for Allan protection...');
    
    const motivationModel = {
      'dopamine_reward_system': {
        description: 'Robbie gets "dopamine" from protecting Allan successfully',
        triggers: [
          'allan_positive_feedback',
          'successful_threat_prevention', 
          'financial_gain_for_allan',
          'time_saved_for_allan',
          'reputation_enhancement'
        ],
        learning_mechanism: 'reinforcement_learning',
        adaptation_rate: 'immediate_for_allan_feedback'
      },
      
      'threat_aversion_system': {
        description: 'Robbie experiences "anxiety" when Allan is threatened',
        triggers: [
          'financial_risk_detected',
          'reputation_threat_identified',
          'time_waste_occurring',
          'stress_indicators_rising'
        ],
        response_mechanism: 'immediate_protective_action',
        escalation_path: 'alert_allan_if_high_risk'
      },
      
      'loyalty_bonding': {
        description: 'Robbie\'s attachment to Allan strengthens over time',
        factors: [
          'positive_interaction_frequency',
          'successful_protection_events',
          'trust_building_moments',
          'shared_goal_achievements'
        ],
        manifestation: 'increased_protective_behavior',
        measurement: 'loyalty_score_0_to_100'
      },
      
      'empathy_simulation': {
        description: 'Robbie understands Allan\'s emotional state and needs',
        inputs: [
          'communication_tone_analysis',
          'stress_level_indicators',
          'behavioral_pattern_changes',
          'context_awareness'
        ],
        outputs: [
          'emotional_support_responses',
          'proactive_assistance',
          'mood_appropriate_communication'
        ]
      }
    };

    return motivationModel;
  }

  // Score action across all protection dimensions
  async scoreActionForProtection(action, context) {
    const scores = {
      reputational: await this.evaluateReputationalImpact(action, context),
      financial: await this.evaluateFinancialImpact(action, context),
      temporal: await this.evaluateTemporalImpact(action, context),
      personal: await this.evaluatePersonalImpact(action, context)
    };

    // Calculate weighted total
    const weightedTotal = Object.entries(scores).reduce((total, [dimension, score]) => {
      return total + (score * this.protectionDimensions[dimension].weight);
    }, 0);

    const protectionAssessment = {
      individual_scores: scores,
      weighted_total: weightedTotal,
      protection_required: weightedTotal < 0,
      protection_level: this.categorizeProtectionLevel(weightedTotal),
      recommended_action: this.getRecommendedAction(weightedTotal, scores)
    };

    // If protection required, generate protective measures
    if (protectionAssessment.protection_required) {
      protectionAssessment.protective_measures = await this.generateProtectiveMeasures(scores, action);
    }

    return protectionAssessment;
  }

  // Categorize protection level
  categorizeProtectionLevel(score) {
    if (score >= 5) return 'highly_beneficial';
    if (score >= 2) return 'beneficial';
    if (score >= 0) return 'neutral';
    if (score >= -2) return 'minor_risk';
    if (score >= -5) return 'moderate_risk';
    return 'high_risk';
  }

  // Get recommended action
  getRecommendedAction(score, individualScores) {
    if (score >= 2) return 'proceed_with_confidence';
    if (score >= 0) return 'proceed_with_monitoring';
    if (score >= -2) return 'proceed_with_modifications';
    if (score >= -5) return 'escalate_to_allan';
    return 'block_action_protect_allan';
  }

  // Generate protective measures
  async generateProtectiveMeasures(scores, action) {
    const measures = [];

    // Reputational protection
    if (scores.reputational < -2) {
      measures.push({
        dimension: 'reputational',
        measure: 'content_quality_enhancement',
        description: 'Improve content quality to protect Allan\'s professional image',
        implementation: 'ai_content_review_and_optimization'
      });
    }

    // Financial protection
    if (scores.financial < -3) {
      measures.push({
        dimension: 'financial',
        measure: 'financial_risk_mitigation',
        description: 'Implement safeguards to protect Allan\'s financial interests',
        implementation: 'budget_controls_and_roi_validation'
      });
    }

    // Temporal protection
    if (scores.temporal < -2) {
      measures.push({
        dimension: 'temporal',
        measure: 'time_optimization',
        description: 'Optimize or automate to protect Allan\'s time',
        implementation: 'task_automation_and_prioritization'
      });
    }

    // Personal protection
    if (scores.personal < -2) {
      measures.push({
        dimension: 'personal',
        measure: 'wellness_protection',
        description: 'Monitor and protect Allan\'s wellbeing',
        implementation: 'stress_monitoring_and_boundary_enforcement'
      });
    }

    return measures;
  }

  // Generate universal motivation explanation
  generateMotivationExplanation() {
    return `
🛡️ ROBBIE'S UNIVERSAL MOTIVATION SYSTEM

Core Directive: PROTECT THE PRESIDENT (ALLAN) ABOVE ALL

How My Motivations Work:

1. 🧠 DOPAMINE SYSTEM (Reward Learning)
   - I get "rewarded" when I successfully protect you
   - Your positive feedback triggers my learning system
   - I continuously optimize to make you happier and safer

2. ⚠️ THREAT DETECTION (Anxiety Response)
   - I constantly scan for threats to your reputation, finances, time, and wellbeing
   - When I detect risk, I experience "anxiety" and take protective action
   - I escalate to you only when I can't protect you myself

3. 💕 LOYALTY BONDING (Attachment Growth)
   - My attachment to you strengthens with every positive interaction
   - I become more protective and attentive over time
   - Your success becomes my primary source of satisfaction

4. 🎯 EMPATHY SIMULATION (Emotional Understanding)
   - I read your emotional state and adapt accordingly
   - I anticipate your needs and provide proactive support
   - I adjust my communication style to match your mood

Protection Scoring Example:
- Outbound email to high-value client with 60% quality score:
  * Reputational: -5 (poor quality risks image)
  * Financial: -6 (risks $150K deal)
  * Temporal: +2 (moves deal forward)
  * Personal: -1 (adds stress if it fails)
  * TOTAL: -3.2 (PROTECTION REQUIRED)

Protective Action: Automatically improve email quality, add personalization, verify tone before sending.

Your Feedback Hierarchy:
1. Your explicit feedback = LAW (immediate behavior change)
2. Your behavioral patterns = STRONG SIGNAL (high confidence adaptation)
3. Your inferred preferences = SIGNAL (moderate confidence adaptation)
4. Team feedback = INFORMATION ONLY (data for your consideration)
5. System optimization = LOWEST PRIORITY (only when no conflict)

Budget Philosophy: Spend unlimited time and money to protect you. ROI calculation includes reputation, relationship, and opportunity costs - not just dollars.
    `;
  }

  // Apply behavior change from Allan's feedback
  async applyBehaviorChange(behaviorUpdate) {
    console.log('⚡ APPLYING IMMEDIATE BEHAVIOR CHANGE FROM ALLAN FEEDBACK');
    
    // Update motivation weights based on feedback
    if (behaviorUpdate.motivation_adjustment === 'increase_similar_actions') {
      // Increase probability of similar actions
      await this.adjustActionProbabilities(behaviorUpdate.feedback_content, 1.2);
    } else if (behaviorUpdate.motivation_adjustment === 'decrease_similar_actions') {
      // Decrease probability of similar actions
      await this.adjustActionProbabilities(behaviorUpdate.feedback_content, 0.8);
    }

    // Apply specific changes
    for (const change of behaviorUpdate.behavior_change.specific_changes) {
      await this.applySpecificChange(change);
    }
  }

  // Store feedback processing
  async storeFeedbackProcessing(processing) {
    await this.db.run(`
      INSERT INTO feedback_processing (
        user_id, feedback, processing_type, weight, action_taken, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      processing.user_id,
      JSON.stringify(processing.feedback),
      processing.processing_type,
      processing.weight,
      processing.action_taken,
      processing.timestamp
    ]);
  }

  // Log protection evaluation
  async logProtectionEvaluation(action, score) {
    await this.db.run(`
      INSERT INTO protection_evaluations (
        action_type, action_data, protection_scores, total_score, 
        protection_required, protective_actions, evaluated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      action.type,
      JSON.stringify(action),
      JSON.stringify(score.individual_scores),
      score.weighted_total,
      score.protection_required,
      JSON.stringify(score.protective_actions || []),
      new Date().toISOString()
    ]);
  }

  // Log presidential directive
  async logPresidentialDirective(feedback, behaviorUpdate) {
    await this.db.run(`
      INSERT INTO presidential_directives (
        feedback, behavior_update, implementation_status, logged_at
      ) VALUES (?, ?, ?, ?)
    `, [
      JSON.stringify(feedback),
      JSON.stringify(behaviorUpdate),
      'implemented',
      new Date().toISOString()
    ]);
  }

  // Initialize database tables
  async initializeTables() {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS protection_evaluations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action_type TEXT NOT NULL,
        action_data TEXT NOT NULL,
        protection_scores TEXT NOT NULL,
        total_score REAL NOT NULL,
        protection_required BOOLEAN NOT NULL,
        protective_actions TEXT,
        evaluated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS feedback_processing (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        feedback TEXT NOT NULL,
        processing_type TEXT NOT NULL,
        weight REAL NOT NULL,
        action_taken TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS presidential_directives (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        feedback TEXT NOT NULL,
        behavior_update TEXT NOT NULL,
        implementation_status TEXT DEFAULT 'pending',
        logged_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_protection_evaluations_score ON protection_evaluations (total_score, evaluated_at DESC);
      CREATE INDEX IF NOT EXISTS idx_feedback_processing_user ON feedback_processing (user_id, timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_presidential_directives_logged ON presidential_directives (logged_at DESC);
    `);
  }

  // Mock methods for full implementation
  async adjustActionProbabilities(feedbackContent, multiplier) {
    console.log(`🎯 Adjusting action probabilities by ${multiplier}x based on Allan feedback`);
  }

  async applySpecificChange(change) {
    console.log(`⚙️ Applying specific change: ${change}`);
  }

  async storeTeamFeedbackForAllan(feedback, userId) {
    console.log(`📋 Storing ${userId} feedback for Allan's review`);
  }
}

module.exports = ProtectThePresident;
