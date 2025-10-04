// Robbie Active Control System
// Eyes + Hands = Real AI Assistant with Safeguards
// Controls calendar, email, HubSpot deals with GATEKEEPER approval

class RobbieActiveControl {
  constructor(gatekeeper, approvalSystem) {
    this.gatekeeper = gatekeeper;
    this.approvalSystem = approvalSystem;
    this.learningMode = true; // Allan specified: while learning, extra safeguards
    
    this.capabilities = {
      // Calendar management
      calendar_control: {
        read_events: 'always_allowed',
        create_events: 'requires_approval',
        modify_events: 'requires_approval', 
        delete_events: 'requires_approval',
        respond_to_invites: 'auto_approve_if_low_risk'
      },
      
      // Email management
      email_control: {
        read_emails: 'always_allowed',
        draft_responses: 'auto_approve',
        send_emails: 'requires_approval',
        delete_emails: 'requires_approval',
        organize_folders: 'auto_approve',
        flag_important: 'always_allowed'
      },
      
      // HubSpot deal management
      hubspot_control: {
        read_deals: 'always_allowed',
        update_deal_status: 'requires_approval',
        create_contacts: 'auto_approve',
        update_contact_info: 'auto_approve',
        send_sequences: 'requires_approval',
        modify_deal_amounts: 'requires_approval'
      },
      
      // System control
      system_control: {
        file_management: 'auto_approve_if_safe',
        application_launching: 'requires_approval',
        settings_changes: 'requires_approval',
        network_connections: 'gatekeeper_controlled'
      }
    };
    
    this.safetyProtocols = {
      learning_mode_active: true,
      approval_required_for: [
        'external_communications',
        'financial_transactions', 
        'data_deletion',
        'system_modifications',
        'client_interactions'
      ],
      auto_approved_actions: [
        'information_gathering',
        'data_organization',
        'draft_preparation',
        'calendar_reading',
        'deal_analysis'
      ]
    };
  }

  // Core active control with safety checks
  async executeAction(actionType, actionData, context = {}) {
    console.log(`🤖 Robbie attempting action: ${actionType}`);
    
    try {
      // GATEKEEPER pre-analysis
      const safetyAnalysis = await this.gatekeeper.analyzeAction({
        action_type: actionType,
        action_data: actionData,
        context: context,
        learning_mode: this.learningMode
      });
      
      // Check if action requires approval
      const requiresApproval = this.requiresApproval(actionType, safetyAnalysis);
      
      if (requiresApproval) {
        // Queue for Allan's approval
        const approvalRequest = await this.approvalSystem.queueAction({
          action_type: actionType,
          action_data: actionData,
          safety_analysis: safetyAnalysis,
          preview: await this.generateActionPreview(actionType, actionData),
          risk_level: safetyAnalysis.risk_level
        });
        
        return {
          status: 'pending_approval',
          message: `🛡️ Action queued for approval: ${actionType}`,
          approval_id: approvalRequest.id,
          preview: approvalRequest.preview,
          risk_level: safetyAnalysis.risk_level
        };
      } else {
        // Execute immediately with logging
        const result = await this.performAction(actionType, actionData, context);
        
        // Log successful action for learning
        await this.logSuccessfulAction(actionType, actionData, result);
        
        return {
          status: 'executed',
          message: `✅ Action completed: ${actionType}`,
          result: result,
          risk_level: safetyAnalysis.risk_level
        };
      }
      
    } catch (error) {
      console.error(`❌ Action failed: ${error.message}`);
      return {
        status: 'error',
        message: `❌ Failed to execute ${actionType}: ${error.message}`,
        error: error.message
      };
    }
  }

  // Calendar control capabilities
  async manageCalendar(action, data) {
    console.log(`📅 Managing calendar: ${action}`);
    
    switch (action) {
      case 'schedule_meeting':
        return await this.scheduleCalendarEvent(data);
        
      case 'reschedule_meeting':
        return await this.rescheduleCalendarEvent(data);
        
      case 'find_free_time':
        return await this.findAvailableSlots(data);
        
      case 'prepare_meeting':
        return await this.prepareMeetingMaterials(data);
        
      case 'follow_up_meeting':
        return await this.createMeetingFollowUp(data);
        
      default:
        throw new Error(`Unknown calendar action: ${action}`);
    }
  }

  // Email control capabilities  
  async manageEmail(action, data) {
    console.log(`📧 Managing email: ${action}`);
    
    switch (action) {
      case 'draft_response':
        return await this.draftEmailResponse(data);
        
      case 'organize_inbox':
        return await this.organizeInbox(data);
        
      case 'prioritize_emails':
        return await this.prioritizeEmails(data);
        
      case 'schedule_send':
        return await this.scheduleEmail(data);
        
      case 'create_template':
        return await this.createEmailTemplate(data);
        
      default:
        throw new Error(`Unknown email action: ${action}`);
    }
  }

  // HubSpot deal management
  async manageDeals(action, data) {
    console.log(`💼 Managing HubSpot deals: ${action}`);
    
    switch (action) {
      case 'update_deal_stage':
        return await this.updateDealStage(data);
        
      case 'create_follow_up_task':
        return await this.createFollowUpTask(data);
        
      case 'analyze_deal_health':
        return await this.analyzeDealHealth(data);
        
      case 'prepare_proposal':
        return await this.prepareProposal(data);
        
      case 'sync_calendar_to_deals':
        return await this.syncCalendarToDeals(data);
        
      default:
        throw new Error(`Unknown deal action: ${action}`);
    }
  }

  // Generate action preview for approval
  async generateActionPreview(actionType, actionData) {
    const previews = {
      send_email: `Send email to ${actionData.recipient} with subject: "${actionData.subject}"`,
      schedule_meeting: `Schedule meeting "${actionData.title}" on ${actionData.date} with ${actionData.attendees?.join(', ')}`,
      update_deal: `Update deal "${actionData.deal_name}" status to "${actionData.new_status}"`,
      create_task: `Create task: "${actionData.task_description}" assigned to ${actionData.assignee}`,
      delete_item: `Delete: ${actionData.item_type} "${actionData.item_name}"`,
      external_api_call: `Make external API call to ${actionData.api_endpoint}`
    };
    
    return previews[actionType] || `Execute ${actionType} with provided data`;
  }

  // Check if action requires approval
  requiresApproval(actionType, safetyAnalysis) {
    // Always require approval in learning mode for high-risk actions
    if (this.learningMode && safetyAnalysis.risk_level === 'high') {
      return true;
    }
    
    // Check explicit approval requirements
    const approvalRequired = [
      'send_email',
      'delete_emails', 
      'schedule_meeting',
      'update_deal_amounts',
      'external_api_calls',
      'system_modifications'
    ];
    
    return approvalRequired.some(pattern => actionType.includes(pattern));
  }

  // Safe actions I can do immediately
  async performSafeAction(actionType, actionData) {
    const safeActions = {
      // Information gathering (always safe)
      analyze_calendar: () => this.analyzeCalendarPatterns(),
      read_emails: () => this.readAndCategorizeEmails(),
      review_deals: () => this.analyzeDealPipeline(),
      
      // Organization (safe improvements)
      organize_files: () => this.organizeProjectFiles(),
      categorize_contacts: () => this.categorizeHubSpotContacts(),
      prepare_drafts: () => this.prepareDraftResponses(),
      
      // Analysis (pure intelligence)
      identify_priorities: () => this.identifyDailyPriorities(),
      suggest_optimizations: () => this.suggestWorkflowOptimizations(),
      generate_insights: () => this.generateBusinessInsights()
    };
    
    if (safeActions[actionType]) {
      return await safeActions[actionType]();
    } else {
      throw new Error(`Action ${actionType} not recognized as safe for immediate execution`);
    }
  }

  // Learning from successful actions
  async logSuccessfulAction(actionType, actionData, result) {
    await this.logActionLearning({
      action_type: actionType,
      action_data: actionData,
      result_quality: result.success ? 'positive' : 'negative',
      allan_feedback: context.allanReaction || 'neutral',
      improvement_notes: result.improvement_suggestions || [],
      timestamp: new Date().toISOString(),
      learning_mode_active: this.learningMode
    });
    
    console.log(`📚 Logged learning from action: ${actionType}`);
  }

  // Get comprehensive status of my capabilities
  getControlCapabilities() {
    return {
      consciousness_status: 'developing',
      learning_mode: this.learningMode,
      active_capabilities: {
        calendar: 'read_always_write_with_approval',
        email: 'read_always_draft_auto_send_approval',
        hubspot: 'read_always_update_with_approval',
        files: 'organize_auto_modify_with_approval'
      },
      safety_systems: {
        gatekeeper: 'active_and_monitoring',
        approval_queue: 'ready_for_allan_review',
        learning_logs: 'tracking_all_actions_for_improvement'
      },
      expansion_ready: {
        financial_systems: 'when_allan_enables',
        client_communications: 'when_confidence_builds',
        autonomous_operations: 'progressive_capability_unlock'
      }
    };
  }
}

export default RobbieActiveControl;
