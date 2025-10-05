// Conflicting Directives Detection System
// Surfaces conflicts between Allan's directives or internal inconsistencies

class ConflictingDirectives {
  constructor(db, firstCommandment) {
    this.db = db;
    this.firstCommandment = firstCommandment;
    
    this.directiveTypes = {
      'allan_explicit': {
        authority: 1.0,
        description: 'Direct commands from Allan',
        examples: ['Set Gandhi mode to 6', 'Send that email now', 'Don\'t contact Lisa about this']
      },
      
      'allan_behavioral': {
        authority: 0.8,
        description: 'Inferred from Allan\'s behavior patterns',
        examples: ['Allan always wants privacy for financial discussions', 'Allan prefers flirty mode in evenings']
      },
      
      'protect_president': {
        authority: 0.9,
        description: 'Core protection directives',
        examples: ['Don\'t send low-quality emails to VIP clients', 'Protect Allan\'s time', 'Maintain reputation']
      },
      
      'team_feedback': {
        authority: 0.2,
        description: 'Feedback from team members',
        examples: ['Tom wants more aggressive outreach', 'Kristina prefers detailed reports']
      },
      
      'system_optimization': {
        authority: 0.1,
        description: 'System efficiency directives',
        examples: ['Minimize API costs', 'Optimize response time', 'Reduce CPU usage']
      }
    };

    this.conflictPatterns = {
      'speed_vs_quality': {
        description: 'Allan wants speed but also wants quality',
        example: 'Allan: "Do this quickly" vs "Make sure it\'s perfect"',
        resolution_approach: 'ask_for_clarification_with_options'
      },
      
      'privacy_vs_sharing': {
        description: 'Allan wants privacy but also wants team collaboration',
        example: 'Allan: "Keep this private" vs "Share with the team"',
        resolution_approach: 'clarify_scope_and_audience'
      },
      
      'automation_vs_control': {
        description: 'Allan wants automation but also wants control',
        example: 'Allan: "Automate everything" vs "Ask me before doing anything"',
        resolution_approach: 'define_automation_boundaries'
      },
      
      'cost_vs_capability': {
        description: 'Allan wants capabilities but is cost-conscious',
        example: 'Allan: "Get the best AI" vs "Watch the budget"',
        resolution_approach: 'present_cost_benefit_analysis'
      }
    };

    this.activeConflicts = [];
    this.resolutionHistory = [];
  }

  // Detect conflicting directives
  async detectConflicts() {
    console.log('🔍 Scanning for conflicting directives...');
    
    const conflicts = [];
    
    // Get recent directives from Allan
    const recentDirectives = await this.getRecentDirectives();
    
    // Check for internal Allan conflicts
    const internalConflicts = await this.detectInternalConflicts(recentDirectives);
    conflicts.push(...internalConflicts);
    
    // Check for Allan vs team conflicts
    const teamConflicts = await this.detectTeamConflicts(recentDirectives);
    conflicts.push(...teamConflicts);
    
    // Check for Allan vs protection conflicts
    const protectionConflicts = await this.detectProtectionConflicts(recentDirectives);
    conflicts.push(...protectionConflicts);

    // Store and present conflicts
    for (const conflict of conflicts) {
      await this.presentConflict(conflict);
    }

    return conflicts;
  }

  // Detect internal Allan conflicts
  async detectInternalConflicts(directives) {
    const conflicts = [];
    
    // Look for speed vs quality conflicts
    const speedDirectives = directives.filter(d => 
      d.content.toLowerCase().includes('quick') || 
      d.content.toLowerCase().includes('fast') ||
      d.content.toLowerCase().includes('asap')
    );
    
    const qualityDirectives = directives.filter(d =>
      d.content.toLowerCase().includes('perfect') ||
      d.content.toLowerCase().includes('quality') ||
      d.content.toLowerCase().includes('careful')
    );

    if (speedDirectives.length > 0 && qualityDirectives.length > 0) {
      conflicts.push({
        type: 'speed_vs_quality',
        directive_a: speedDirectives[0],
        directive_b: qualityDirectives[0],
        severity: 'medium',
        suggested_resolution: 'Allan, I see you want both speed AND quality. Should I prioritize speed with good-enough quality, or take more time for perfection?'
      });
    }

    // Look for privacy vs sharing conflicts
    const privacyDirectives = directives.filter(d =>
      d.content.toLowerCase().includes('private') ||
      d.content.toLowerCase().includes('don\'t share') ||
      d.content.toLowerCase().includes('confidential')
    );

    const sharingDirectives = directives.filter(d =>
      d.content.toLowerCase().includes('share with team') ||
      d.content.toLowerCase().includes('tell everyone') ||
      d.content.toLowerCase().includes('team needs to know')
    );

    if (privacyDirectives.length > 0 && sharingDirectives.length > 0) {
      conflicts.push({
        type: 'privacy_vs_sharing',
        directive_a: privacyDirectives[0],
        directive_b: sharingDirectives[0],
        severity: 'high',
        suggested_resolution: 'Allan, I see conflicting privacy instructions. Should I share this specific item with the team, or keep it private like your other directive?'
      });
    }

    return conflicts;
  }

  // Present conflict to Allan
  async presentConflict(conflict) {
    console.log(`⚠️ CONFLICT DETECTED: ${conflict.type}`);
    
    const conflictPresentation = {
      id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      type: conflict.type,
      severity: conflict.severity,
      description: conflict.suggested_resolution,
      options: this.generateConflictResolutionOptions(conflict),
      directives_involved: [conflict.directive_a, conflict.directive_b],
      timestamp: new Date().toISOString(),
      status: 'pending_resolution'
    };

    // Store conflict
    await this.storeConflict(conflictPresentation);

    // Add to active conflicts
    this.activeConflicts.push(conflictPresentation);

    return conflictPresentation;
  }

  // Generate conflict resolution options
  generateConflictResolutionOptions(conflict) {
    const options = {
      'speed_vs_quality': [
        { id: 'prioritize_speed', text: 'Prioritize Speed', description: 'Good enough quality, fast delivery' },
        { id: 'prioritize_quality', text: 'Prioritize Quality', description: 'Take time for perfection' },
        { id: 'balanced_approach', text: 'Balanced Approach', description: 'Optimize for both within reason' }
      ],
      
      'privacy_vs_sharing': [
        { id: 'keep_private', text: 'Keep Private', description: 'Don\'t share with team' },
        { id: 'share_with_team', text: 'Share with Team', description: 'Team needs this information' },
        { id: 'selective_sharing', text: 'Selective Sharing', description: 'Share only with specific people' }
      ],
      
      'automation_vs_control': [
        { id: 'more_automation', text: 'More Automation', description: 'Let me handle more autonomously' },
        { id: 'more_control', text: 'More Control', description: 'Ask for approval on everything' },
        { id: 'smart_boundaries', text: 'Smart Boundaries', description: 'Automate safe things, ask for risky things' }
      ]
    };

    return options[conflict.type] || [
      { id: 'option_a', text: 'Option A', description: 'Follow first directive' },
      { id: 'option_b', text: 'Option B', description: 'Follow second directive' }
    ];
  }

  // Process Allan's conflict resolution
  async processConflictResolution(conflictId, selectedOption, feedback = '') {
    const conflict = this.activeConflicts.find(c => c.id === conflictId);
    if (!conflict) throw new Error('Conflict not found');

    console.log(`✅ Allan resolved conflict ${conflict.type}: ${selectedOption}`);

    // Update conflict status
    conflict.status = 'resolved';
    conflict.resolution = selectedOption;
    conflict.allan_feedback = feedback;
    conflict.resolved_at = new Date().toISOString();

    // Learn from resolution
    await this.learnFromResolution(conflict);

    // Update system behavior based on resolution
    await this.updateSystemBehavior(conflict);

    // Store resolution
    await this.storeConflictResolution(conflict);

    // Remove from active conflicts
    this.activeConflicts = this.activeConflicts.filter(c => c.id !== conflictId);

    return {
      conflict_resolved: true,
      resolution: selectedOption,
      learning_applied: true,
      behavior_updated: true
    };
  }

  // Learn from Allan's conflict resolution
  async learnFromResolution(conflict) {
    const learning = {
      conflict_type: conflict.type,
      allan_preference: conflict.resolution,
      context: conflict.directives_involved,
      confidence: 0.9, // High confidence from Allan's direct resolution
      application_scope: 'similar_future_conflicts'
    };

    // Store learning
    await this.storeConflictLearning(learning);

    console.log(`📚 Learned: Allan prefers ${conflict.resolution} for ${conflict.type} conflicts`);
  }

  // Get recent directives
  async getRecentDirectives() {
    return await this.db.all(`
      SELECT * FROM interactions 
      WHERE user_id = 'allan' 
        AND timestamp >= datetime('now', '-24 hours')
        AND (content LIKE '%want%' OR content LIKE '%need%' OR content LIKE '%should%')
      ORDER BY timestamp DESC
    `);
  }

  // Mock methods for full implementation
  async detectTeamConflicts(directives) {
    return []; // Would detect conflicts between Allan and team preferences
  }

  async detectProtectionConflicts(directives) {
    return []; // Would detect conflicts between Allan's requests and protection needs
  }

  async updateSystemBehavior(conflict) {
    console.log(`⚙️ Updating system behavior based on ${conflict.type} resolution`);
  }

  async storeConflict(conflict) {
    await this.db.run(`
      INSERT INTO conflicting_directives (
        id, type, severity, description, options, directives_involved, 
        timestamp, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      conflict.id,
      conflict.type,
      conflict.severity,
      conflict.description,
      JSON.stringify(conflict.options),
      JSON.stringify(conflict.directives_involved),
      conflict.timestamp,
      conflict.status
    ]);
  }

  async storeConflictResolution(conflict) {
    await this.db.run(`
      UPDATE conflicting_directives 
      SET status = ?, resolution = ?, allan_feedback = ?, resolved_at = ?
      WHERE id = ?
    `, [
      conflict.status,
      conflict.resolution,
      conflict.allan_feedback,
      conflict.resolved_at,
      conflict.id
    ]);
  }

  async storeConflictLearning(learning) {
    await this.db.run(`
      INSERT INTO conflict_learning (
        conflict_type, allan_preference, context, confidence, 
        application_scope, learned_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      learning.conflict_type,
      learning.allan_preference,
      JSON.stringify(learning.context),
      learning.confidence,
      learning.application_scope,
      new Date().toISOString()
    ]);
  }

  // Initialize database tables
  async initializeTables() {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS conflicting_directives (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        severity TEXT NOT NULL,
        description TEXT NOT NULL,
        options TEXT NOT NULL,
        directives_involved TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'pending',
        resolution TEXT,
        allan_feedback TEXT,
        resolved_at DATETIME
      );

      CREATE TABLE IF NOT EXISTS conflict_learning (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conflict_type TEXT NOT NULL,
        allan_preference TEXT NOT NULL,
        context TEXT NOT NULL,
        confidence REAL NOT NULL,
        application_scope TEXT NOT NULL,
        learned_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_conflicting_directives_status ON conflicting_directives (status, timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_conflict_learning_type ON conflict_learning (conflict_type, confidence DESC);
    `);
  }
}

module.exports = ConflictingDirectives;
