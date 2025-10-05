// Personality Isolation System
// Manages how personality sliders affect different communication contexts

class PersonalityIsolationSystem {
  constructor(db) {
    this.db = db;
    
    this.communicationContexts = {
      'outbound_communication': {
        description: 'Emails, messages, external communications',
        affected_by_sliders: false, // NEVER affected by personality
        tone_source: 'recipient_analysis',
        optimization: 'outcome_based',
        isolation_level: 'complete'
      },
      
      'allan_private': {
        description: 'Private communication with Allan only',
        affected_by_sliders: ['flirty_level', 'robbie_mood', 'character_filter'],
        tone_source: 'personality_sliders',
        optimization: 'allan_preference',
        isolation_level: 'none'
      },
      
      'allan_group': {
        description: 'Allan in group settings (huddle, team chats)',
        affected_by_sliders: ['robbie_mood', 'character_filter'], // NO flirty_level
        tone_source: 'professional_personality',
        optimization: 'group_appropriate',
        isolation_level: 'partial'
      },
      
      'team_communication': {
        description: 'Communication with team members',
        affected_by_sliders: ['robbie_mood', 'character_filter'],
        tone_source: 'team_member_profiles',
        optimization: 'role_based',
        isolation_level: 'partial'
      },
      
      'system_operations': {
        description: 'Internal system operations and logging',
        affected_by_sliders: ['automation_level', 'confidence_threshold'],
        tone_source: 'system_defaults',
        optimization: 'efficiency',
        isolation_level: 'operational'
      }
    };

    this.sliderIsolationRules = {
      'flirty_level': {
        affects: ['allan_private'], // ONLY affects private Allan communication
        never_affects: ['outbound_communication', 'team_communication', 'allan_group'],
        privacy_check_required: true,
        group_override: false // Cannot be overridden in group settings
      },
      
      'gandhi_genghis': {
        affects: ['allan_private', 'allan_group', 'team_communication'],
        never_affects: ['outbound_communication'], // Outbound always optimized for recipient
        context_aware: true
      },
      
      'robbie_mood': {
        affects: ['allan_private', 'allan_group', 'team_communication'],
        never_affects: ['outbound_communication'],
        context_aware: true
      },
      
      'character_filter': {
        affects: ['allan_private', 'allan_group', 'team_communication'],
        never_affects: ['outbound_communication'],
        quality_control: true
      },
      
      'turbo_level': {
        affects: ['system_operations'],
        never_affects: ['communication_tone'],
        performance_only: true
      },
      
      'automation_level': {
        affects: ['system_operations'],
        never_affects: ['communication_style'],
        behavioral_only: true
      },
      
      'killswitch': {
        affects: ['outbound_communication', 'system_operations'],
        never_affects: ['internal_communication'],
        safety_only: true
      },
      
      'privacy_level': {
        affects: ['data_sharing', 'team_communication'],
        never_affects: ['allan_private'], // Allan always gets full access
        data_control_only: true
      }
    };
  }

  // Get communication style for specific context
  getCommunicationStyle(context, userId, isPrivate = false) {
    const baseStyle = {
      tone: 'professional',
      energy: 'medium',
      formality: 'business',
      emoji_usage: 'minimal',
      personal_attention: 'standard'
    };

    // Determine communication context
    let communicationContext;
    if (context === 'outbound') {
      communicationContext = 'outbound_communication';
    } else if (userId === 'allan' && isPrivate) {
      communicationContext = 'allan_private';
    } else if (userId === 'allan' && !isPrivate) {
      communicationContext = 'allan_group';
    } else {
      communicationContext = 'team_communication';
    }

    const contextRules = this.communicationContexts[communicationContext];
    
    // Apply slider effects based on context
    if (contextRules.affected_by_sliders) {
      for (const sliderId of contextRules.affected_by_sliders) {
        this.applySliderToStyle(sliderId, baseStyle, communicationContext);
      }
    }

    return {
      ...baseStyle,
      context: communicationContext,
      isolation_level: contextRules.isolation_level,
      tone_source: contextRules.tone_source
    };
  }

  // Apply slider effects to communication style
  applySliderToStyle(sliderId, style, context) {
    const slider = this.integratedSliders?.sliders[sliderId];
    if (!slider) return;

    const value = slider.current;
    const isolationRules = this.sliderIsolationRules[sliderId];

    // Check if slider should affect this context
    if (isolationRules.never_affects.includes(context)) {
      return; // This slider never affects this context
    }

    switch (sliderId) {
      case 'flirty_level':
        // ONLY affects allan_private context
        if (context === 'allan_private') {
          this.applyFlirtyLevel(value, style);
        }
        break;
        
      case 'gandhi_genghis':
        // Affects internal communication style, NOT outbound
        if (context !== 'outbound_communication') {
          this.applyGandhiGenghisLevel(value, style);
        }
        break;
        
      case 'robbie_mood':
        // Affects all internal communication
        if (context !== 'outbound_communication') {
          this.applyMoodLevel(value, style);
        }
        break;
        
      case 'character_filter':
        // Affects response quality in all contexts except outbound
        if (context !== 'outbound_communication') {
          this.applyCharacterFilter(value, style);
        }
        break;
    }
  }

  // Apply flirty level (Allan private only)
  applyFlirtyLevel(level, style) {
    const flirtyStyles = {
      1: { tone: 'formal', emoji_usage: 'none', personal_attention: 'business' },
      2: { tone: 'warm_professional', emoji_usage: 'minimal', personal_attention: 'friendly' },
      3: { tone: 'friendly', emoji_usage: 'moderate', personal_attention: 'personal' },
      4: { tone: 'playful', emoji_usage: 'generous', personal_attention: 'attentive' },
      5: { tone: 'flirty', emoji_usage: 'flirty', personal_attention: 'focused' },
      6: { tone: 'very_flirty', emoji_usage: 'romantic', personal_attention: 'devoted' },
      7: { tone: 'sultry', emoji_usage: 'intimate', personal_attention: 'exclusive' }
    };

    Object.assign(style, flirtyStyles[level] || flirtyStyles[3]);
  }

  // Apply Gandhi-Genghis level (internal communication)
  applyGandhiGenghisLevel(level, style) {
    const communicationStyles = {
      1: { energy: 'very_low', formality: 'gentle', assertiveness: 'minimal' },
      2: { energy: 'low', formality: 'polite', assertiveness: 'soft' },
      3: { energy: 'medium', formality: 'professional', assertiveness: 'balanced' },
      4: { energy: 'medium_high', formality: 'direct', assertiveness: 'confident' },
      5: { energy: 'high', formality: 'assertive', assertiveness: 'strong' },
      6: { energy: 'very_high', formality: 'aggressive', assertiveness: 'dominant' }
    };

    Object.assign(style, communicationStyles[level] || communicationStyles[3]);
  }

  // Apply mood level
  applyMoodLevel(level, style) {
    const moodStyles = {
      1: { energy: 'sleepy', emoji_usage: 'minimal', enthusiasm: 'low' },
      2: { energy: 'calm', emoji_usage: 'gentle', enthusiasm: 'steady' },
      3: { energy: 'content', emoji_usage: 'warm', enthusiasm: 'positive' },
      4: { energy: 'professional', emoji_usage: 'business', enthusiasm: 'focused' },
      5: { energy: 'enthusiastic', emoji_usage: 'energetic', enthusiasm: 'high' },
      6: { energy: 'excited', emoji_usage: 'passionate', enthusiasm: 'very_high' },
      7: { energy: 'hyper', emoji_usage: 'intense', enthusiasm: 'maximum' }
    };

    Object.assign(style, moodStyles[level] || moodStyles[4]);
  }

  // Apply character filter
  applyCharacterFilter(level, style) {
    style.quality_threshold = level;
    style.back_to_kitchen_rate = Math.round((100 - level) * 0.8); // Higher filter = more rejections
  }

  // Validate communication before sending
  validateCommunication(message, context, userId, isPrivate = false) {
    const style = this.getCommunicationStyle(context, userId, isPrivate);
    
    // CRITICAL: Outbound communication is NEVER affected by personality
    if (context === 'outbound') {
      return {
        approved: true,
        style: {
          tone_source: 'recipient_analysis',
          optimization: 'outcome_based',
          personality_influence: 'none'
        },
        isolation_applied: true
      };
    }

    // Internal communication uses personality
    return {
      approved: true,
      style: style,
      isolation_applied: true,
      context_rules: this.communicationContexts[style.context]
    };
  }

  // Initialize database tables
  async initializeTables() {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS communication_contexts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        context_type TEXT NOT NULL,
        user_id TEXT NOT NULL,
        is_private BOOLEAN DEFAULT FALSE,
        style_applied TEXT NOT NULL,
        isolation_rules TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_communication_contexts_user ON communication_contexts (user_id, timestamp DESC);
    `);
  }
}

module.exports = PersonalityIsolationSystem;
