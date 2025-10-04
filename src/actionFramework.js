// Robbie V3 Action Framework - Complete ecosystem behavior definition
// This defines ALL actions that can be taken in our system

export class ActionFramework {
  constructor() {
    this.actions = new Map();
    this.initializeActions();
  }

  // Initialize all possible actions in our ecosystem
  initializeActions() {
    // ===== COMMUNICATION ACTIONS =====
    this.actions.set('email_send', {
      id: 'email_send',
      name: 'Send Email',
      category: 'communication',
      risk: 'high',
      requiresApproval: true,
      description: 'Send email to external recipient',
      parameters: {
        recipient: { type: 'string', required: true },
        subject: { type: 'string', required: true },
        content: { type: 'string', required: true },
        cc: { type: 'array', required: false },
        bcc: { type: 'array', required: false },
        attachments: { type: 'array', required: false }
      },
      validation: (params) => {
        if (!params.recipient || !params.subject || !params.content) {
          return { valid: false, error: 'Missing required email parameters' };
        }
        if (!params.recipient.includes('@')) {
          return { valid: false, error: 'Invalid email address' };
        }
        return { valid: true };
      },
      execute: async (params) => {
        // Implementation will be in email service
        return { success: true, messageId: 'generated-id' };
      }
    });

    this.actions.set('email_draft', {
      id: 'email_draft',
      name: 'Draft Email',
      category: 'communication',
      risk: 'low',
      requiresApproval: false,
      description: 'Create email draft without sending',
      parameters: {
        recipient: { type: 'string', required: true },
        subject: { type: 'string', required: true },
        content: { type: 'string', required: true }
      },
      execute: async (params) => {
        return { success: true, draftId: 'draft-' + Date.now() };
      }
    });

    this.actions.set('linkedin_post', {
      id: 'linkedin_post',
      name: 'LinkedIn Post',
      category: 'social',
      risk: 'high',
      requiresApproval: true,
      description: 'Publish LinkedIn post',
      parameters: {
        content: { type: 'string', required: true },
        tags: { type: 'array', required: false },
        image: { type: 'string', required: false },
        schedule: { type: 'datetime', required: false }
      },
      execute: async (params) => {
        return { success: true, postId: 'linkedin-' + Date.now() };
      }
    });

    this.actions.set('linkedin_message', {
      id: 'linkedin_message',
      name: 'LinkedIn Message',
      category: 'social',
      risk: 'high',
      requiresApproval: true,
      description: 'Send LinkedIn direct message',
      parameters: {
        recipient: { type: 'string', required: true },
        message: { type: 'string', required: true }
      },
      execute: async (params) => {
        return { success: true, messageId: 'linkedin-msg-' + Date.now() };
      }
    });

    // ===== CRM ACTIONS =====
    this.actions.set('contact_create', {
      id: 'contact_create',
      name: 'Create Contact',
      category: 'crm',
      risk: 'low',
      requiresApproval: false,
      description: 'Add new contact to CRM',
      parameters: {
        name: { type: 'string', required: true },
        email: { type: 'string', required: false },
        phone: { type: 'string', required: false },
        company: { type: 'string', required: false },
        tags: { type: 'array', required: false }
      },
      execute: async (params) => {
        return { success: true, contactId: 'contact-' + Date.now() };
      }
    });

    this.actions.set('contact_update', {
      id: 'contact_update',
      name: 'Update Contact',
      category: 'crm',
      risk: 'low',
      requiresApproval: false,
      description: 'Update existing contact information',
      parameters: {
        contactId: { type: 'string', required: true },
        updates: { type: 'object', required: true }
      },
      execute: async (params) => {
        return { success: true, updated: true };
      }
    });

    this.actions.set('deal_create', {
      id: 'deal_create',
      name: 'Create Deal',
      category: 'crm',
      risk: 'medium',
      requiresApproval: true,
      description: 'Create new sales opportunity',
      parameters: {
        name: { type: 'string', required: true },
        value: { type: 'number', required: true },
        contactId: { type: 'string', required: true },
        stage: { type: 'string', required: true }
      },
      execute: async (params) => {
        return { success: true, dealId: 'deal-' + Date.now() };
      }
    });

    // ===== OUTREACH ACTIONS =====
    this.actions.set('sequence_start', {
      id: 'sequence_start',
      name: 'Start Outreach Sequence',
      category: 'outreach',
      risk: 'high',
      requiresApproval: true,
      description: 'Begin automated outreach sequence',
      parameters: {
        contactId: { type: 'string', required: true },
        sequenceId: { type: 'string', required: true },
        customizations: { type: 'object', required: false }
      },
      execute: async (params) => {
        return { success: true, sequenceId: 'seq-' + Date.now() };
      }
    });

    this.actions.set('follow_up_schedule', {
      id: 'follow_up_schedule',
      name: 'Schedule Follow-up',
      category: 'outreach',
      risk: 'medium',
      requiresApproval: true,
      description: 'Schedule follow-up action',
      parameters: {
        contactId: { type: 'string', required: true },
        action: { type: 'string', required: true },
        scheduledFor: { type: 'datetime', required: true },
        notes: { type: 'string', required: false }
      },
      execute: async (params) => {
        return { success: true, taskId: 'task-' + Date.now() };
      }
    });

    // ===== DATA ACTIONS =====
    this.actions.set('data_sync', {
      id: 'data_sync',
      name: 'Sync Data',
      category: 'data',
      risk: 'low',
      requiresApproval: false,
      description: 'Synchronize data between systems',
      parameters: {
        source: { type: 'string', required: true },
        target: { type: 'string', required: true },
        dataType: { type: 'string', required: true }
      },
      execute: async (params) => {
        return { success: true, synced: true };
      }
    });

    this.actions.set('data_export', {
      id: 'data_export',
      name: 'Export Data',
      category: 'data',
      risk: 'low',
      requiresApproval: false,
      description: 'Export data to file',
      parameters: {
        dataType: { type: 'string', required: true },
        format: { type: 'string', required: true },
        filters: { type: 'object', required: false }
      },
      execute: async (params) => {
        return { success: true, filePath: 'export-' + Date.now() + '.' + params.format };
      }
    });

    // ===== SYSTEM ACTIONS =====
    this.actions.set('gpu_inference', {
      id: 'gpu_inference',
      name: 'GPU Inference',
      category: 'system',
      risk: 'low',
      requiresApproval: false,
      description: 'Run AI inference on GPU',
      parameters: {
        model: { type: 'string', required: true },
        prompt: { type: 'string', required: true },
        temperature: { type: 'number', required: false },
        maxTokens: { type: 'number', required: false }
      },
      execute: async (params) => {
        return { success: true, response: 'AI generated response' };
      }
    });

    this.actions.set('system_restart', {
      id: 'system_restart',
      name: 'Restart System',
      category: 'system',
      risk: 'high',
      requiresApproval: true,
      description: 'Restart system component',
      parameters: {
        component: { type: 'string', required: true },
        reason: { type: 'string', required: true }
      },
      execute: async (params) => {
        return { success: true, restarted: true };
      }
    });

    // ===== REVENUE ACTIONS =====
    this.actions.set('invoice_create', {
      id: 'invoice_create',
      name: 'Create Invoice',
      category: 'revenue',
      risk: 'high',
      requiresApproval: true,
      description: 'Generate invoice for client',
      parameters: {
        clientId: { type: 'string', required: true },
        amount: { type: 'number', required: true },
        description: { type: 'string', required: true },
        dueDate: { type: 'date', required: true }
      },
      execute: async (params) => {
        return { success: true, invoiceId: 'inv-' + Date.now() };
      }
    });

    this.actions.set('payment_request', {
      id: 'payment_request',
      name: 'Request Payment',
      category: 'revenue',
      risk: 'high',
      requiresApproval: true,
      description: 'Send payment request to client',
      parameters: {
        invoiceId: { type: 'string', required: true },
        method: { type: 'string', required: true },
        urgency: { type: 'string', required: false }
      },
      execute: async (params) => {
        return { success: true, requestId: 'req-' + Date.now() };
      }
    });

    // ===== CONTENT ACTIONS =====
    this.actions.set('content_generate', {
      id: 'content_generate',
      name: 'Generate Content',
      category: 'content',
      risk: 'low',
      requiresApproval: false,
      description: 'Generate content using AI',
      parameters: {
        type: { type: 'string', required: true },
        topic: { type: 'string', required: true },
        tone: { type: 'string', required: false },
        length: { type: 'string', required: false }
      },
      execute: async (params) => {
        return { success: true, content: 'Generated content' };
      }
    });

    this.actions.set('content_schedule', {
      id: 'content_schedule',
      name: 'Schedule Content',
      category: 'content',
      risk: 'medium',
      requiresApproval: true,
      description: 'Schedule content for publication',
      parameters: {
        contentId: { type: 'string', required: true },
        platform: { type: 'string', required: true },
        scheduledFor: { type: 'datetime', required: true }
      },
      execute: async (params) => {
        return { success: true, scheduled: true };
      }
    });
  }

  // Get action by ID
  getAction(actionId) {
    return this.actions.get(actionId);
  }

  // Get all actions by category
  getActionsByCategory(category) {
    const result = [];
    for (const [id, action] of this.actions) {
      if (action.category === category) {
        result.push(action);
      }
    }
    return result;
  }

  // Get high-risk actions
  getHighRiskActions() {
    const result = [];
    for (const [id, action] of this.actions) {
      if (action.risk === 'high') {
        result.push(action);
      }
    }
    return result;
  }

  // Validate action parameters
  validateAction(actionId, parameters) {
    const action = this.getAction(actionId);
    if (!action) {
      return { valid: false, error: 'Action not found' };
    }

    if (action.validation) {
      return action.validation(parameters);
    }

    // Basic validation
    for (const [paramName, paramDef] of Object.entries(action.parameters)) {
      if (paramDef.required && !parameters[paramName]) {
        return { valid: false, error: `Missing required parameter: ${paramName}` };
      }
    }

    return { valid: true };
  }

  // Execute action with validation and approval
  async executeAction(actionId, parameters, context = {}) {
    const action = this.getAction(actionId);
    if (!action) {
      throw new Error(`Action not found: ${actionId}`);
    }

    // Validate parameters
    const validation = this.validateAction(actionId, parameters);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.error}`);
    }

    // Check if approval is required
    if (action.requiresApproval && !context.approved) {
      return {
        success: false,
        requiresApproval: true,
        actionId,
        parameters,
        message: 'Action requires approval before execution'
      };
    }

    // Execute the action
    try {
      const result = await action.execute(parameters);
      return {
        success: true,
        actionId,
        result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        actionId,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Get action summary for UI
  getActionSummary() {
    const summary = {
      total: this.actions.size,
      byCategory: {},
      byRisk: { low: 0, medium: 0, high: 0 },
      requiresApproval: 0
    };

    for (const [id, action] of this.actions) {
      // By category
      if (!summary.byCategory[action.category]) {
        summary.byCategory[action.category] = 0;
      }
      summary.byCategory[action.category]++;

      // By risk
      summary.byRisk[action.risk]++;

      // Requires approval
      if (action.requiresApproval) {
        summary.requiresApproval++;
      }
    }

    return summary;
  }
}

export const actionFramework = new ActionFramework();
