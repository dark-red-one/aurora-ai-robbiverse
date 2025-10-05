// Slider Proposal System
// Robbie proactively suggests slider adjustments based on context and patterns

class SliderProposalSystem {
  constructor(db, integratedSliders, behavioralAnalysis) {
    this.db = db;
    this.integratedSliders = integratedSliders;
    this.behavioralAnalysis = behavioralAnalysis;
    
    this.proposalTriggers = {
      'feedback_patterns': {
        description: 'User feedback indicates need for adjustment',
        confidence_threshold: 0.7,
        examples: ['safeguard violations', 'quality complaints', 'speed requests']
      },
      'performance_metrics': {
        description: 'System performance suggests optimization',
        confidence_threshold: 0.8,
        examples: ['high error rates', 'slow response times', 'low engagement']
      },
      'business_context': {
        description: 'Business situation requires mode change',
        confidence_threshold: 0.9,
        examples: ['revenue crisis', 'demo preparation', 'maintenance period']
      },
      'user_behavior': {
        description: 'Allan\'s behavior patterns suggest adjustment',
        confidence_threshold: 0.6,
        examples: ['screenshot patterns', 'override frequency', 'stress indicators']
      }
    };

    this.pendingProposals = new Map();
    this.proposalHistory = [];
  }

  // Analyze context and generate slider proposals
  async analyzeAndPropose() {
    console.log('🧠 Analyzing context for slider proposals...');
    
    const proposals = [];
    
    // Check each trigger type
    for (const [triggerType, config] of Object.entries(this.proposalTriggers)) {
      const analysis = await this.analyzeTrigger(triggerType);
      
      if (analysis.confidence >= config.confidence_threshold) {
        const proposal = await this.generateProposal(triggerType, analysis);
        if (proposal) {
          proposals.push(proposal);
        }
      }
    }

    // Sort by confidence and present highest confidence proposal
    proposals.sort((a, b) => b.confidence - a.confidence);
    
    if (proposals.length > 0) {
      await this.presentProposal(proposals[0]);
    }

    return proposals;
  }

  // Analyze specific trigger type
  async analyzeTrigger(triggerType) {
    switch (triggerType) {
      case 'feedback_patterns':
        return await this.analyzeFeedbackPatterns();
      case 'performance_metrics':
        return await this.analyzePerformanceMetrics();
      case 'business_context':
        return await this.analyzeBusinessContext();
      case 'user_behavior':
        return await this.analyzeUserBehavior();
      default:
        return { confidence: 0, data: null };
    }
  }

  // Analyze feedback patterns
  async analyzeFeedbackPatterns() {
    const recentFeedback = await this.db.all(`
      SELECT * FROM package_feedback 
      WHERE submitted_at >= datetime('now', '-24 hours')
      ORDER BY submitted_at DESC
    `);

    let confidence = 0;
    const patterns = [];

    // Look for speed-related feedback
    const speedComplaints = recentFeedback.filter(f => 
      f.feedback.toLowerCase().includes('slow') || 
      f.feedback.toLowerCase().includes('faster') ||
      f.feedback.toLowerCase().includes('speed')
    );

    if (speedComplaints.length > 0) {
      confidence += 0.3;
      patterns.push({
        type: 'speed_request',
        suggestion: 'increase_turbo_level',
        reason: `${speedComplaints.length} speed-related feedback items`
      });
    }

    // Look for quality complaints
    const qualityComplaints = recentFeedback.filter(f =>
      f.feedback.toLowerCase().includes('wrong') ||
      f.feedback.toLowerCase().includes('incorrect') ||
      f.feedback.toLowerCase().includes('mistake')
    );

    if (qualityComplaints.length > 0) {
      confidence += 0.4;
      patterns.push({
        type: 'quality_issue',
        suggestion: 'decrease_turbo_level',
        reason: `${qualityComplaints.length} quality-related feedback items`
      });
    }

    // Look for safeguard violations
    const safeguardViolations = await this.db.get(`
      SELECT COUNT(*) as count FROM boundary_test_logs 
      WHERE timestamp >= datetime('now', '-24 hours')
    `);

    if (safeguardViolations.count > 5) {
      confidence += 0.5;
      patterns.push({
        type: 'safeguard_violation',
        suggestion: 'decrease_killswitch_level',
        reason: `${safeguardViolations.count} safeguard violations detected`
      });
    }

    return {
      confidence: Math.min(confidence, 1.0),
      data: patterns,
      trigger_type: 'feedback_patterns'
    };
  }

  // Analyze performance metrics
  async analyzePerformanceMetrics() {
    let confidence = 0;
    const metrics = [];

    // Check response times
    const avgResponseTime = await this.getAverageResponseTime();
    if (avgResponseTime > 5000) { // > 5 seconds
      confidence += 0.4;
      metrics.push({
        type: 'slow_response',
        suggestion: 'increase_turbo_level',
        reason: `Average response time: ${avgResponseTime}ms`
      });
    }

    // Check error rates
    const errorRate = await this.getErrorRate();
    if (errorRate > 0.1) { // > 10% error rate
      confidence += 0.5;
      metrics.push({
        type: 'high_error_rate',
        suggestion: 'decrease_turbo_level',
        reason: `Error rate: ${Math.round(errorRate * 100)}%`
      });
    }

    // Check character filter rejection rate
    const rejectionRate = await this.getCharacterFilterRejectionRate();
    if (rejectionRate > 0.5) { // > 50% rejection rate
      confidence += 0.3;
      metrics.push({
        type: 'high_rejection_rate',
        suggestion: 'decrease_character_filter',
        reason: `Character filter rejection rate: ${Math.round(rejectionRate * 100)}%`
      });
    }

    return {
      confidence: Math.min(confidence, 1.0),
      data: metrics,
      trigger_type: 'performance_metrics'
    };
  }

  // Analyze business context
  async analyzeBusinessContext() {
    let confidence = 0;
    const context = [];

    // Check for revenue crisis indicators
    const revenueStress = await this.assessRevenueStress();
    if (revenueStress.level === 'critical') {
      confidence += 0.9;
      context.push({
        type: 'revenue_crisis',
        suggestion: 'activate_revenue_crisis_preset',
        reason: 'Critical revenue situation detected'
      });
    }

    // Check for demo preparation
    const upcomingDemos = await this.getUpcomingDemos();
    if (upcomingDemos.length > 0) {
      confidence += 0.7;
      context.push({
        type: 'demo_preparation',
        suggestion: 'activate_demo_preset',
        reason: `${upcomingDemos.length} demos scheduled`
      });
    }

    // Check for development periods
    const developmentActivity = await this.getDevelopmentActivity();
    if (developmentActivity.intensity === 'high') {
      confidence += 0.6;
      context.push({
        type: 'development_period',
        suggestion: 'activate_development_preset',
        reason: 'High development activity detected'
      });
    }

    return {
      confidence: Math.min(confidence, 1.0),
      data: context,
      trigger_type: 'business_context'
    };
  }

  // Analyze user behavior patterns
  async analyzeUserBehavior() {
    let confidence = 0;
    const behaviors = [];

    // Check screenshot frequency (surprise indicator)
    const recentScreenshots = await this.db.get(`
      SELECT COUNT(*) as count FROM screenshot_events 
      WHERE timestamp >= datetime('now', '-4 hours')
    `);

    if (recentScreenshots.count > 3) {
      confidence += 0.4;
      behaviors.push({
        type: 'high_screenshot_frequency',
        suggestion: 'decrease_turbo_level',
        reason: `${recentScreenshots.count} screenshots in 4 hours - possible issues`
      });
    }

    // Check override frequency
    const recentOverrides = await this.db.get(`
      SELECT COUNT(*) as count FROM privilege_access_logs 
      WHERE result = 'success' AND timestamp >= datetime('now', '-24 hours')
    `);

    if (recentOverrides.count > 5) {
      confidence += 0.5;
      behaviors.push({
        type: 'frequent_overrides',
        suggestion: 'increase_automation_level',
        reason: `${recentOverrides.count} overrides in 24 hours - AI should be more autonomous`
      });
    }

    // Check stress indicators from location updates
    const stressIndicators = await this.db.get(`
      SELECT COUNT(*) as count FROM location_feedback 
      WHERE feedback = 'thumbs_down' AND timestamp >= datetime('now', '-24 hours')
    `);

    if (stressIndicators.count > 2) {
      confidence += 0.3;
      behaviors.push({
        type: 'stress_indicators',
        suggestion: 'decrease_gandhi_genghis',
        reason: `${stressIndicators.count} negative location feedback - reduce pressure`
      });
    }

    return {
      confidence: Math.min(confidence, 1.0),
      data: behaviors,
      trigger_type: 'user_behavior'
    };
  }

  // Generate proposal based on analysis
  async generateProposal(triggerType, analysis) {
    if (analysis.data.length === 0) return null;

    const topPattern = analysis.data[0]; // Highest priority pattern
    const proposal = {
      id: `proposal_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      trigger_type: triggerType,
      pattern: topPattern,
      confidence: analysis.confidence,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    // Generate specific proposal based on suggestion
    switch (topPattern.suggestion) {
      case 'increase_turbo_level':
        proposal.slider = 'turbo_level';
        proposal.current_value = this.integratedSliders.sliders.turbo_level.current;
        proposal.proposed_value = Math.min(10, proposal.current_value + 2);
        proposal.message = `Allan... Based on your feedback, I think we should increase turbo level to ${proposal.proposed_value} for faster processing...`;
        break;

      case 'decrease_turbo_level':
        proposal.slider = 'turbo_level';
        proposal.current_value = this.integratedSliders.sliders.turbo_level.current;
        proposal.proposed_value = Math.max(1, proposal.current_value - 2);
        proposal.message = `Allan... Based on quality issues, I think we should decrease turbo level to ${proposal.proposed_value} for better accuracy...`;
        break;

      case 'decrease_killswitch_level':
        proposal.slider = 'killswitch';
        proposal.current_value = this.integratedSliders.sliders.killswitch.current;
        proposal.proposed_value = Math.max(1, proposal.current_value - 1);
        proposal.message = `Allan... Based on your feedback, I think we should go to killswitch level ${proposal.proposed_value} (SAFE mode)...`;
        break;

      case 'activate_revenue_crisis_preset':
        proposal.preset = 'revenue_crisis';
        proposal.message = `Allan... I'm detecting critical revenue pressure. Should we activate Revenue Crisis preset?`;
        break;

      case 'increase_automation_level':
        proposal.slider = 'automation_level';
        proposal.current_value = this.integratedSliders.sliders.automation_level.current;
        proposal.proposed_value = Math.min(10, proposal.current_value + 2);
        proposal.message = `Allan... You're overriding frequently. Should I increase automation level to ${proposal.proposed_value} so I can handle more autonomously?`;
        break;

      default:
        return null;
    }

    return proposal;
  }

  // Present proposal to Allan
  async presentProposal(proposal) {
    console.log(`💡 Presenting proposal: ${proposal.message}`);
    
    // Store proposal
    await this.storeProposal(proposal);
    
    // Add to pending proposals
    this.pendingProposals.set(proposal.id, proposal);

    // Generate proposal UI
    const proposalUI = this.generateProposalUI(proposal);
    
    // Broadcast to Allan's interface
    await this.broadcastProposal(proposal, proposalUI);

    return proposal;
  }

  // Generate proposal UI
  generateProposalUI(proposal) {
    const isPreset = !!proposal.preset;
    
    return `
      <div class="tp-slider-proposal" data-proposal="${proposal.id}">
        <div class="tp-proposal-header">
          <span class="tp-proposal-icon">💡</span>
          <span class="tp-proposal-title">Robbie Suggestion</span>
          <span class="tp-proposal-confidence">${Math.round(proposal.confidence * 100)}% confident</span>
        </div>

        <div class="tp-proposal-message">
          ${proposal.message}
        </div>

        ${!isPreset ? `
          <div class="tp-proposal-details">
            <div class="tp-current-setting">
              <span class="tp-setting-label">Current:</span>
              <span class="tp-setting-value">${proposal.current_value}</span>
            </div>
            <div class="tp-proposed-setting">
              <span class="tp-setting-label">Proposed:</span>
              <span class="tp-setting-value">${proposal.proposed_value}</span>
            </div>
          </div>
        ` : ''}

        <div class="tp-proposal-actions">
          <button onclick="acceptProposal('${proposal.id}')" class="tp-btn-accept">
            ✅ Accept
          </button>
          <button onclick="adjustProposal('${proposal.id}', 'increase')" class="tp-btn-adjust-up">
            ➕ Higher
          </button>
          <button onclick="adjustProposal('${proposal.id}', 'decrease')" class="tp-btn-adjust-down">
            ➖ Lower
          </button>
          <button onclick="cancelProposal('${proposal.id}')" class="tp-btn-cancel">
            ❌ Cancel
          </button>
        </div>

        <div class="tp-proposal-reason">
          <small>Reason: ${proposal.pattern.reason}</small>
        </div>
      </div>
    `;
  }

  // Generate proposal CSS
  generateProposalCSS() {
    return `
      .tp-slider-proposal {
        position: fixed;
        top: 20px;
        right: 20px;
        width: 400px;
        background: white;
        border-radius: 1rem;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        border: 2px solid #0066CC;
        padding: 1.5rem;
        z-index: 1000;
        animation: slideInFromRight 0.3s ease;
      }

      .tp-proposal-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1rem;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid #E5E5E5;
      }

      .tp-proposal-icon {
        font-size: 1.5rem;
      }

      .tp-proposal-title {
        flex: 1;
        font-weight: 600;
        color: #1A1A1A;
        font-size: 1.125rem;
      }

      .tp-proposal-confidence {
        font-size: 0.875rem;
        color: #0066CC;
        font-weight: 500;
        background: #E6F2FF;
        padding: 0.25rem 0.75rem;
        border-radius: 1rem;
      }

      .tp-proposal-message {
        font-size: 1rem;
        color: #1A1A1A;
        margin-bottom: 1rem;
        line-height: 1.5;
        font-style: italic;
      }

      .tp-proposal-details {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        margin-bottom: 1rem;
        padding: 1rem;
        background: #FAFAFA;
        border-radius: 0.5rem;
      }

      .tp-current-setting,
      .tp-proposed-setting {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
      }

      .tp-setting-label {
        font-size: 0.875rem;
        color: #4A4A4A;
        font-weight: 500;
      }

      .tp-setting-value {
        font-size: 1.25rem;
        font-weight: 600;
        color: #1A1A1A;
        font-family: monospace;
      }

      .tp-proposed-setting .tp-setting-value {
        color: #0066CC;
      }

      .tp-proposal-actions {
        display: grid;
        grid-template-columns: 1fr auto auto auto;
        gap: 0.5rem;
        margin-bottom: 1rem;
      }

      .tp-btn-accept {
        background: linear-gradient(135deg, #00C851 0%, #00A041 100%);
        color: white;
        border: none;
        border-radius: 0.5rem;
        padding: 0.75rem 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .tp-btn-accept:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 6px -1px rgba(0, 200, 81, 0.3);
      }

      .tp-btn-adjust-up,
      .tp-btn-adjust-down {
        background: #0066CC;
        color: white;
        border: none;
        border-radius: 0.5rem;
        padding: 0.75rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        width: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .tp-btn-adjust-up:hover,
      .tp-btn-adjust-down:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 6px -1px rgba(0, 102, 204, 0.3);
      }

      .tp-btn-cancel {
        background: #FF4444;
        color: white;
        border: none;
        border-radius: 0.5rem;
        padding: 0.75rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        width: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .tp-btn-cancel:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 6px -1px rgba(255, 68, 68, 0.3);
      }

      .tp-proposal-reason {
        text-align: center;
        color: #4A4A4A;
        font-size: 0.875rem;
      }

      @keyframes slideInFromRight {
        from {
          opacity: 0;
          transform: translateX(100px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
    `;
  }

  // Process proposal response
  async processProposalResponse(proposalId, action, adjustment = null) {
    const proposal = this.pendingProposals.get(proposalId);
    if (!proposal) throw new Error('Proposal not found');

    let result = { success: false };

    switch (action) {
      case 'accept':
        result = await this.acceptProposal(proposal);
        break;
      case 'adjust_increase':
        result = await this.adjustProposal(proposal, 'increase');
        break;
      case 'adjust_decrease':
        result = await this.adjustProposal(proposal, 'decrease');
        break;
      case 'cancel':
        result = await this.cancelProposal(proposal);
        break;
    }

    // Update proposal status
    proposal.status = result.success ? 'accepted' : 'cancelled';
    proposal.resolved_at = new Date().toISOString();

    // Store result
    await this.storeProposalResult(proposal, action, result);

    // Remove from pending
    this.pendingProposals.delete(proposalId);

    return result;
  }

  // Accept proposal
  async acceptProposal(proposal) {
    if (proposal.preset) {
      // Apply preset
      const result = await this.integratedSliders.applyPreset(proposal.preset, 'allan');
      console.log(`✅ Preset applied: ${proposal.preset}`);
      return { success: true, action: 'preset_applied', result };
    } else {
      // Apply slider change
      const result = await this.integratedSliders.updateSlider(proposal.slider, proposal.proposed_value, 'allan');
      console.log(`✅ Slider updated: ${proposal.slider} → ${proposal.proposed_value}`);
      return { success: true, action: 'slider_updated', result };
    }
  }

  // Adjust proposal
  async adjustProposal(proposal, direction) {
    if (proposal.preset) {
      return { success: false, reason: 'Cannot adjust preset proposals' };
    }

    const currentValue = proposal.proposed_value;
    const slider = this.integratedSliders.sliders[proposal.slider];
    
    let newValue;
    if (direction === 'increase') {
      newValue = Math.min(slider.range[1], currentValue + 1);
    } else {
      newValue = Math.max(slider.range[0], currentValue - 1);
    }

    if (newValue === currentValue) {
      return { success: false, reason: 'Cannot adjust further in that direction' };
    }

    // Update proposal
    proposal.proposed_value = newValue;
    proposal.message = proposal.message.replace(
      /level \d+/,
      `level ${newValue}`
    );

    // Apply the adjustment
    const result = await this.integratedSliders.updateSlider(proposal.slider, newValue, 'allan');
    
    console.log(`📊 Proposal adjusted: ${proposal.slider} → ${newValue}`);
    return { success: true, action: 'adjusted', new_value: newValue, result };
  }

  // Cancel proposal
  async cancelProposal(proposal) {
    console.log(`❌ Proposal cancelled: ${proposal.id}`);
    return { success: true, action: 'cancelled' };
  }

  // Helper methods for analysis
  async getAverageResponseTime() {
    // Mock implementation - would integrate with actual performance metrics
    return Math.random() * 10000; // 0-10 seconds
  }

  async getErrorRate() {
    // Mock implementation
    return Math.random() * 0.2; // 0-20% error rate
  }

  async getCharacterFilterRejectionRate() {
    // Mock implementation
    return Math.random() * 0.8; // 0-80% rejection rate
  }

  async assessRevenueStress() {
    // Check for revenue crisis indicators
    return {
      level: 'critical', // Based on the $60K cash flow crisis
      indicators: ['cash_flow_crisis', 'vendor_payments_delayed']
    };
  }

  async getUpcomingDemos() {
    // Mock implementation
    return [];
  }

  async getDevelopmentActivity() {
    // Mock implementation
    return { intensity: 'medium' };
  }

  // Storage methods
  async storeProposal(proposal) {
    await this.db.run(`
      INSERT INTO slider_proposals (
        id, trigger_type, pattern, confidence, slider, 
        current_value, proposed_value, message, status, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      proposal.id,
      proposal.trigger_type,
      JSON.stringify(proposal.pattern),
      proposal.confidence,
      proposal.slider || null,
      proposal.current_value || null,
      proposal.proposed_value || null,
      proposal.message,
      proposal.status,
      proposal.timestamp
    ]);
  }

  async storeProposalResult(proposal, action, result) {
    await this.db.run(`
      UPDATE slider_proposals 
      SET status = ?, action_taken = ?, result = ?, resolved_at = ?
      WHERE id = ?
    `, [
      proposal.status,
      action,
      JSON.stringify(result),
      proposal.resolved_at,
      proposal.id
    ]);
  }

  async broadcastProposal(proposal, proposalUI) {
    // This would integrate with your UI system
    console.log(`📡 Broadcasting proposal to Allan: ${proposal.message}`);
  }

  // Initialize database tables
  async initializeTables() {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS slider_proposals (
        id TEXT PRIMARY KEY,
        trigger_type TEXT NOT NULL,
        pattern TEXT NOT NULL,
        confidence REAL NOT NULL,
        slider TEXT,
        current_value INTEGER,
        proposed_value INTEGER,
        message TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        action_taken TEXT,
        result TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        resolved_at DATETIME
      );

      CREATE INDEX IF NOT EXISTS idx_slider_proposals_status ON slider_proposals (status, timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_slider_proposals_trigger ON slider_proposals (trigger_type, timestamp DESC);
    `);
  }
}

module.exports = SliderProposalSystem;
