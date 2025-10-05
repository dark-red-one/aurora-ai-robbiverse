// Conflict Detection System
// Identifies opposing preferences and conflicts between team members

class ConflictDetector {
  constructor(db) {
    this.db = db;
    this.conflictThresholds = {
      sentiment_difference: 0.7, // 70% difference in sentiment
      preference_opposition: 0.8, // 80% opposition in preferences
      frequency_threshold: 3 // Minimum 3 instances to flag conflict
    };
  }

  // Analyze tagged input for conflicts
  async analyzeTaggedInput(taggedInput) {
    const conflicts = [];

    // Check for sentiment conflicts
    const sentimentConflicts = await this.detectSentimentConflicts(taggedInput);
    conflicts.push(...sentimentConflicts);

    // Check for preference conflicts
    const preferenceConflicts = await this.detectPreferenceConflicts(taggedInput);
    conflicts.push(...preferenceConflicts);

    // Check for interface conflicts
    const interfaceConflicts = await this.detectInterfaceConflicts(taggedInput);
    conflicts.push(...interfaceConflicts);

    // Check for workflow conflicts
    const workflowConflicts = await this.detectWorkflowConflicts(taggedInput);
    conflicts.push(...workflowConflicts);

    return conflicts;
  }

  // Detect sentiment conflicts
  async detectSentimentConflicts(taggedInput) {
    const conflicts = [];
    const sentimentGroups = this.groupBySentiment(taggedInput);

    // Compare sentiment between team members
    const members = Object.keys(sentimentGroups);
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        const member1 = members[i];
        const member2 = members[j];
        const sentiment1 = sentimentGroups[member1];
        const sentiment2 = sentimentGroups[member2];

        const conflict = this.calculateSentimentConflict(member1, sentiment1, member2, sentiment2);
        if (conflict) {
          conflicts.push(conflict);
        }
      }
    }

    return conflicts;
  }

  // Detect preference conflicts
  async detectPreferenceConflicts(taggedInput) {
    const conflicts = [];
    const preferenceGroups = this.groupByPreference(taggedInput);

    // Look for opposing preferences
    Object.entries(preferenceGroups).forEach(([preference, members]) => {
      if (members.length > 1) {
        const opposingMembers = this.findOpposingMembers(preference, members);
        if (opposingMembers.length > 0) {
          conflicts.push({
            type: 'preference_conflict',
            preference: preference,
            members: members,
            opposing_members: opposingMembers,
            severity: this.calculateConflictSeverity(members, opposingMembers),
            timestamp: new Date().toISOString()
          });
        }
      }
    });

    return conflicts;
  }

  // Detect interface conflicts
  async detectInterfaceConflicts(taggedInput) {
    const conflicts = [];
    const interfaceFeedback = taggedInput.filter(input => 
      input.content.toLowerCase().includes('interface') ||
      input.content.toLowerCase().includes('ui') ||
      input.content.toLowerCase().includes('design')
    );

    if (interfaceFeedback.length < 2) return conflicts;

    const positiveFeedback = interfaceFeedback.filter(input => 
      input.sentiment === 'positive' || 
      input.content.toLowerCase().includes('love') ||
      input.content.toLowerCase().includes('great') ||
      input.content.toLowerCase().includes('excellent')
    );

    const negativeFeedback = interfaceFeedback.filter(input => 
      input.sentiment === 'negative' || 
      input.content.toLowerCase().includes('hate') ||
      input.content.toLowerCase().includes('terrible') ||
      input.content.toLowerCase().includes('awful')
    );

    if (positiveFeedback.length > 0 && negativeFeedback.length > 0) {
      conflicts.push({
        type: 'interface_conflict',
        positive_members: positiveFeedback.map(f => f.user),
        negative_members: negativeFeedback.map(f => f.user),
        positive_feedback: positiveFeedback.map(f => f.content),
        negative_feedback: negativeFeedback.map(f => f.content),
        severity: this.calculateInterfaceConflictSeverity(positiveFeedback, negativeFeedback),
        timestamp: new Date().toISOString()
      });
    }

    return conflicts;
  }

  // Detect workflow conflicts
  async detectWorkflowConflicts(taggedInput) {
    const conflicts = [];
    const workflowKeywords = [
      'process', 'workflow', 'procedure', 'method', 'approach',
      'efficient', 'inefficient', 'slow', 'fast', 'complicated', 'simple'
    ];

    const workflowFeedback = taggedInput.filter(input => 
      workflowKeywords.some(keyword => 
        input.content.toLowerCase().includes(keyword)
      )
    );

    if (workflowFeedback.length < 2) return conflicts;

    // Group by workflow aspect
    const workflowAspects = this.groupByWorkflowAspect(workflowFeedback);

    Object.entries(workflowAspects).forEach(([aspect, feedback]) => {
      const positive = feedback.filter(f => f.sentiment === 'positive');
      const negative = feedback.filter(f => f.sentiment === 'negative');

      if (positive.length > 0 && negative.length > 0) {
        conflicts.push({
          type: 'workflow_conflict',
          aspect: aspect,
          positive_members: positive.map(f => f.user),
          negative_members: negative.map(f => f.user),
          severity: this.calculateWorkflowConflictSeverity(positive, negative),
          timestamp: new Date().toISOString()
        });
      }
    });

    return conflicts;
  }

  // Group input by sentiment
  groupBySentiment(taggedInput) {
    const groups = {};
    
    taggedInput.forEach(input => {
      if (!groups[input.sentiment]) {
        groups[input.sentiment] = [];
      }
      groups[input.sentiment].push(input);
    });

    return groups;
  }

  // Group input by preference
  groupByPreference(taggedInput) {
    const groups = {};
    
    taggedInput.forEach(input => {
      const preferences = this.extractPreferences(input.content);
      preferences.forEach(preference => {
        if (!groups[preference]) {
          groups[preference] = [];
        }
        groups[preference].push(input);
      });
    });

    return groups;
  }

  // Extract preferences from content
  extractPreferences(content) {
    const preferences = [];
    const contentLower = content.toLowerCase();

    // Interface preferences
    if (contentLower.includes('interface') || contentLower.includes('ui')) {
      preferences.push('interface');
    }
    if (contentLower.includes('chat') || contentLower.includes('messaging')) {
      preferences.push('chat_interface');
    }
    if (contentLower.includes('dashboard') || contentLower.includes('overview')) {
      preferences.push('dashboard');
    }

    // Communication preferences
    if (contentLower.includes('direct') || contentLower.includes('straightforward')) {
      preferences.push('direct_communication');
    }
    if (contentLower.includes('detailed') || contentLower.includes('comprehensive')) {
      preferences.push('detailed_communication');
    }

    // Workflow preferences
    if (contentLower.includes('automated') || contentLower.includes('automatic')) {
      preferences.push('automation');
    }
    if (contentLower.includes('manual') || contentLower.includes('control')) {
      preferences.push('manual_control');
    }

    return preferences;
  }

  // Calculate sentiment conflict
  calculateSentimentConflict(member1, sentiment1, member2, sentiment2) {
    const sentimentValues = {
      'positive': 1,
      'neutral': 0,
      'negative': -1
    };

    const diff = Math.abs(sentimentValues[sentiment1] - sentimentValues[sentiment2]);
    
    if (diff >= this.conflictThresholds.sentiment_difference) {
      return {
        type: 'sentiment_conflict',
        member1: member1,
        sentiment1: sentiment1,
        member2: member2,
        sentiment2: sentiment2,
        difference: diff,
        severity: this.calculateSentimentConflictSeverity(diff),
        timestamp: new Date().toISOString()
      };
    }

    return null;
  }

  // Find opposing members
  findOpposingMembers(preference, members) {
    const opposingMembers = [];
    
    // Look for members with opposite sentiment on the same preference
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        const member1 = members[i];
        const member2 = members[j];
        
        if (this.areOpposing(member1, member2, preference)) {
          opposingMembers.push({ member1, member2 });
        }
      }
    }

    return opposingMembers;
  }

  // Check if two members are opposing
  areOpposing(member1, member2, preference) {
    const sentiment1 = this.getSentimentForPreference(member1, preference);
    const sentiment2 = this.getSentimentForPreference(member2, preference);
    
    return (sentiment1 === 'positive' && sentiment2 === 'negative') ||
           (sentiment1 === 'negative' && sentiment2 === 'positive');
  }

  // Get sentiment for specific preference
  getSentimentForPreference(member, preference) {
    // This would analyze the member's feedback on the specific preference
    // For now, return a mock sentiment
    return member.sentiment || 'neutral';
  }

  // Calculate conflict severity
  calculateConflictSeverity(members, opposingMembers) {
    const totalMembers = members.length;
    const opposingCount = opposingMembers.length;
    const ratio = opposingCount / totalMembers;
    
    if (ratio >= 0.8) return 'high';
    if (ratio >= 0.5) return 'medium';
    return 'low';
  }

  // Calculate interface conflict severity
  calculateInterfaceConflictSeverity(positive, negative) {
    const total = positive.length + negative.length;
    const ratio = Math.min(positive.length, negative.length) / total;
    
    if (ratio >= 0.4) return 'high';
    if (ratio >= 0.2) return 'medium';
    return 'low';
  }

  // Calculate workflow conflict severity
  calculateWorkflowConflictSeverity(positive, negative) {
    const total = positive.length + negative.length;
    const ratio = Math.min(positive.length, negative.length) / total;
    
    if (ratio >= 0.4) return 'high';
    if (ratio >= 0.2) return 'medium';
    return 'low';
  }

  // Calculate sentiment conflict severity
  calculateSentimentConflictSeverity(difference) {
    if (difference >= 1.5) return 'high';
    if (difference >= 1.0) return 'medium';
    return 'low';
  }

  // Group by workflow aspect
  groupByWorkflowAspect(feedback) {
    const aspects = {};
    
    feedback.forEach(input => {
      const aspect = this.identifyWorkflowAspect(input.content);
      if (aspect) {
        if (!aspects[aspect]) {
          aspects[aspect] = [];
        }
        aspects[aspect].push(input);
      }
    });

    return aspects;
  }

  // Identify workflow aspect
  identifyWorkflowAspect(content) {
    const contentLower = content.toLowerCase();
    
    if (contentLower.includes('meeting') || contentLower.includes('call')) {
      return 'meetings';
    }
    if (contentLower.includes('email') || contentLower.includes('message')) {
      return 'communication';
    }
    if (contentLower.includes('task') || contentLower.includes('todo')) {
      return 'task_management';
    }
    if (contentLower.includes('approval') || contentLower.includes('review')) {
      return 'approval_process';
    }
    if (contentLower.includes('data') || contentLower.includes('sync')) {
      return 'data_management';
    }

    return null;
  }

  // Store conflict
  async storeConflict(conflict) {
    await this.db.run(`
      INSERT INTO conflicts (
        type, members, opposing_members, preference, severity, 
        positive_feedback, negative_feedback, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      conflict.type,
      JSON.stringify(conflict.members || []),
      JSON.stringify(conflict.opposing_members || []),
      conflict.preference || null,
      conflict.severity,
      JSON.stringify(conflict.positive_feedback || []),
      JSON.stringify(conflict.negative_feedback || []),
      conflict.timestamp
    ]);
  }

  // Get recent conflicts
  async getRecentConflicts(limit = 10) {
    return await this.db.all(`
      SELECT * FROM conflicts 
      ORDER BY created_at DESC 
      LIMIT ?
    `, [limit]);
  }

  // Generate conflict resolution suggestions
  async generateConflictResolutionSuggestions(conflict) {
    const suggestions = [];

    switch (conflict.type) {
      case 'interface_conflict':
        suggestions.push({
          type: 'interface_customization',
          description: 'Implement user-specific interface preferences',
          priority: 'high',
          implementation: 'Add user preference settings for interface elements'
        });
        break;

      case 'workflow_conflict':
        suggestions.push({
          type: 'workflow_flexibility',
          description: 'Provide multiple workflow options',
          priority: 'medium',
          implementation: 'Create workflow templates for different preferences'
        });
        break;

      case 'preference_conflict':
        suggestions.push({
          type: 'preference_balancing',
          description: 'Find middle ground between opposing preferences',
          priority: 'medium',
          implementation: 'Implement hybrid approaches that satisfy both sides'
        });
        break;
    }

    return suggestions;
  }

  // Initialize database tables
  async initializeTables() {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS conflicts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        members TEXT NOT NULL,
        opposing_members TEXT,
        preference TEXT,
        severity TEXT NOT NULL,
        positive_feedback TEXT,
        negative_feedback TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS conflict_resolutions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conflict_id INTEGER NOT NULL,
        suggestion_type TEXT NOT NULL,
        description TEXT NOT NULL,
        priority TEXT NOT NULL,
        implementation TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conflict_id) REFERENCES conflicts (id)
      );

      CREATE INDEX IF NOT EXISTS idx_conflicts_type ON conflicts (type, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_conflicts_severity ON conflicts (severity, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_conflict_resolutions_conflict ON conflict_resolutions (conflict_id);
    `);
  }
}

module.exports = ConflictDetector;
