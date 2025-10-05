// Lisa Peretz Access Control System - Smart redaction and policy management
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class LisaAccessControl {
  constructor() {
    this.userProfiles = {
      allan: {
        pin: '2106',
        name: 'Allan Peretz',
        role: 'ceo',
        accessLevel: 'full',
        permissions: ['read', 'write', 'execute', 'admin']
      },
      lisa: {
        pin: '5555',
        name: 'Lisa Peretz',
        role: 'spouse',
        accessLevel: 'restricted',
        permissions: ['read', 'query']
      }
    };
    
    this.redactionPolicies = new Map();
    this.redactionLog = [];
    this.policyDecisions = new Map();
    this.sensitivePatterns = [
      // Financial information
      { pattern: /\$[\d,]+/g, category: 'financial', replacement: '[AMOUNT REDACTED]' },
      { pattern: /\b\d{4}-\d{4}-\d{4}-\d{4}\b/g, category: 'financial', replacement: '[CARD REDACTED]' },
      { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, category: 'financial', replacement: '[SSN REDACTED]' },
      
      // Business sensitive
      { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, category: 'email', replacement: '[EMAIL REDACTED]' },
      { pattern: /\b\d{3}-\d{3}-\d{4}\b/g, category: 'phone', replacement: '[PHONE REDACTED]' },
      
      // Project specific
      { pattern: /\bAurora\b/gi, category: 'project', replacement: '[PROJECT REDACTED]' },
      { pattern: /\bTestPilot\b/gi, category: 'project', replacement: '[COMPANY REDACTED]' },
      { pattern: /\bRobbie\b/gi, category: 'project', replacement: '[SYSTEM REDACTED]' },
      
      // Personal information
      { pattern: /\bAllan\b/gi, category: 'personal', replacement: '[PERSON REDACTED]' },
      { pattern: /\bLisa\b/gi, category: 'personal', replacement: '[PERSON REDACTED]' }
    ];
    
    this.llmRedactor = null;
    this.pendingDecisions = [];
  }

  // Initialize Lisa access control
  async initialize() {
    console.log('🔒 Robbie F: Initializing Lisa access control system...');
    
    try {
      // Load redaction policies
      await this.loadRedactionPolicies();
      
      // Initialize LLM redactor
      await this.initializeLLMRedactor();
      
      // Load policy decisions
      await this.loadPolicyDecisions();
      
      console.log('✅ Robbie F: Lisa access control ready!');
      return true;
    } catch (error) {
      console.error('❌ Robbie F: Lisa access control initialization failed:', error);
      return false;
    }
  }

  // Load redaction policies
  async loadRedactionPolicies() {
    try {
      const policiesPath = '/home/allan/vengeance/data/redaction_policies.json';
      const policies = await fs.readFile(policiesPath, 'utf8');
      const parsed = JSON.parse(policies);
      
      parsed.forEach(policy => {
        this.redactionPolicies.set(policy.category, policy);
      });
      
      console.log(`📋 Robbie F: Loaded ${this.redactionPolicies.size} redaction policies`);
    } catch (error) {
      console.log('⚠️  Redaction policies file not found, using defaults');
      
      // Default policies
      const defaultPolicies = [
        {
          category: 'financial',
          description: 'Financial information',
          redactionLevel: 'high',
          requiresApproval: true,
          replacement: '[FINANCIAL INFO REDACTED]'
        },
        {
          category: 'project',
          description: 'Project-specific information',
          redactionLevel: 'medium',
          requiresApproval: false,
          replacement: '[PROJECT INFO REDACTED]'
        },
        {
          category: 'personal',
          description: 'Personal information',
          redactionLevel: 'medium',
          requiresApproval: true,
          replacement: '[PERSONAL INFO REDACTED]'
        },
        {
          category: 'email',
          description: 'Email addresses',
          redactionLevel: 'low',
          requiresApproval: false,
          replacement: '[EMAIL REDACTED]'
        },
        {
          category: 'phone',
          description: 'Phone numbers',
          redactionLevel: 'low',
          requiresApproval: false,
          replacement: '[PHONE REDACTED]'
        }
      ];
      
      defaultPolicies.forEach(policy => {
        this.redactionPolicies.set(policy.category, policy);
      });
    }
  }

  // Initialize LLM redactor
  async initializeLLMRedactor() {
    this.llmRedactor = {
      model: 'llama3.1:8b',
      endpoint: 'http://localhost:11434/api/generate',
      redactContent: async (content, user) => {
        return await this.redactContentWithLLM(content, user);
      }
    };
  }

  // Load policy decisions
  async loadPolicyDecisions() {
    try {
      const decisionsPath = '/home/allan/vengeance/data/policy_decisions.json';
      const decisions = await fs.readFile(decisionsPath, 'utf8');
      const parsed = JSON.parse(decisions);
      
      parsed.forEach(decision => {
        this.policyDecisions.set(decision.key, decision);
      });
      
      console.log(`📋 Robbie F: Loaded ${this.policyDecisions.size} policy decisions`);
    } catch (error) {
      console.log('⚠️  Policy decisions file not found, using defaults');
    }
  }

  // Authenticate user
  async authenticateUser(pin) {
    const user = Object.values(this.userProfiles).find(profile => profile.pin === pin);
    
    if (user) {
      console.log(`🔐 Robbie F: User authenticated: ${user.name} (${user.role})`);
      return user;
    } else {
      console.log('❌ Robbie F: Authentication failed for PIN');
      return null;
    }
  }

  // Process query for Lisa
  async processLisaQuery(query, context = {}) {
    console.log(`👩 Robbie F: Processing query from Lisa: "${query}"`);
    
    try {
      // Check if query needs redaction
      const redactionNeeded = await this.analyzeRedactionNeeds(query, context);
      
      if (redactionNeeded.length > 0) {
        // Redact the query
        const redactedQuery = await this.redactContent(query, 'lisa', redactionNeeded);
        
        // Log redaction
        await this.logRedaction(query, redactedQuery, redactionNeeded, 'lisa');
        
        // Check if we need policy approval
        const needsApproval = redactionNeeded.some(redaction => 
          this.redactionPolicies.get(redaction.category)?.requiresApproval
        );
        
        if (needsApproval) {
          // Queue for Allan's approval
          await this.queuePolicyDecision(query, redactedQuery, redactionNeeded);
          
          return {
            success: false,
            message: 'This query requires approval from Allan. I\'ve queued it for review.',
            redactedQuery: redactedQuery,
            needsApproval: true
          };
        }
        
        // Process with redacted query
        return await this.processRedactedQuery(redactedQuery, context, redactionNeeded);
      } else {
        // No redaction needed, process normally
        return await this.processNormalQuery(query, context);
      }
    } catch (error) {
      console.error('❌ Robbie F: Error processing Lisa query:', error);
      return {
        success: false,
        message: 'I encountered an error processing your query. Please try again.',
        error: error.message
      };
    }
  }

  // Analyze what redaction is needed
  async analyzeRedactionNeeds(query, context) {
    const redactions = [];
    
    // Check against sensitive patterns
    this.sensitivePatterns.forEach(pattern => {
      const matches = query.match(pattern.pattern);
      if (matches && matches.length > 0) {
        redactions.push({
          category: pattern.category,
          matches: matches,
          pattern: pattern.pattern,
          replacement: pattern.replacement
        });
      }
    });
    
    // Use LLM to analyze context
    const llmAnalysis = await this.analyzeWithLLM(query, context);
    if (llmAnalysis.redactionNeeded) {
      redactions.push(...llmAnalysis.redactions);
    }
    
    return redactions;
  }

  // Analyze with LLM
  async analyzeWithLLM(query, context) {
    try {
      const prompt = `You are Robbie F, an AI assistant. I need you to analyze if a query from Lisa (Allan's wife) contains sensitive information that should be redacted.

QUERY: "${query}"
CONTEXT: ${JSON.stringify(context, null, 2)}

Consider:
- Financial information (amounts, account numbers, etc.)
- Business sensitive information (project details, client names, etc.)
- Personal information (locations, private details, etc.)
- Information Allan might not want shared with Lisa

Return a JSON response with:
- redactionNeeded: boolean
- redactions: array of objects with {category, reason, confidence}
- confidence: number (0-100)

Be conservative - if there's any doubt, recommend redaction.`;

      const response = await fetch(this.llmRedactor.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.llmRedactor.model,
          prompt: prompt,
          stream: false,
          format: 'json'
        })
      });

      const result = await response.json();
      return JSON.parse(result.response);
    } catch (error) {
      console.error('❌ Robbie F: LLM analysis failed:', error);
      return { redactionNeeded: false, redactions: [], confidence: 0 };
    }
  }

  // Redact content
  async redactContent(content, user, redactions) {
    let redactedContent = content;
    
    // Apply pattern-based redactions
    redactions.forEach(redaction => {
      redactedContent = redactedContent.replace(redaction.pattern, redaction.replacement);
    });
    
    // Use LLM for natural redaction
    if (this.llmRedactor) {
      redactedContent = await this.redactContentWithLLM(redactedContent, user);
    }
    
    return redactedContent;
  }

  // Redact content with LLM
  async redactContentWithLLM(content, user) {
    try {
      const prompt = `You are Robbie F, an AI assistant. I need you to redact sensitive information from content while making it still sound natural and helpful.

CONTENT: "${content}"
USER: ${user}

Redact:
- Financial information (replace with [AMOUNT REDACTED])
- Personal information (replace with [PERSONAL INFO REDACTED])
- Business sensitive information (replace with [BUSINESS INFO REDACTED])
- Specific names and details (replace with [DETAILS REDACTED])

Make the redacted version still sound natural and helpful. Return only the redacted content.`;

      const response = await fetch(this.llmRedactor.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.llmRedactor.model,
          prompt: prompt,
          stream: false
        })
      });

      const result = await response.json();
      return result.response.trim();
    } catch (error) {
      console.error('❌ Robbie F: LLM redaction failed:', error);
      return content; // Return original if redaction fails
    }
  }

  // Process redacted query
  async processRedactedQuery(query, context, redactions) {
    // This is where we'd process the query with the redacted content
    // For now, just return a helpful response
    return {
      success: true,
      message: `I'd be happy to help you with that! However, I've had to redact some sensitive information from your query. Here's what I can tell you: ${query}`,
      redactions: redactions,
      originalQuery: context.originalQuery || query
    };
  }

  // Process normal query
  async processNormalQuery(query, context) {
    // This is where we'd process queries that don't need redaction
    return {
      success: true,
      message: `I'd be happy to help you with that! ${query}`,
      redactions: [],
      originalQuery: query
    };
  }

  // Log redaction
  async logRedaction(originalQuery, redactedQuery, redactions, user) {
    const logEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      user: user,
      originalQuery: originalQuery,
      redactedQuery: redactedQuery,
      redactions: redactions,
      policyDecisions: []
    };
    
    this.redactionLog.push(logEntry);
    
    // Save to file
    await this.saveRedactionLog();
    
    console.log(`📝 Robbie F: Logged redaction for ${user}`);
  }

  // Queue policy decision
  async queuePolicyDecision(originalQuery, redactedQuery, redactions) {
    const decision = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      originalQuery: originalQuery,
      redactedQuery: redactedQuery,
      redactions: redactions,
      status: 'pending',
      allanDecision: null,
      allanReasoning: null
    };
    
    this.pendingDecisions.push(decision);
    
    // Save to file
    await this.savePendingDecisions();
    
    console.log(`⏳ Robbie F: Queued policy decision for Allan's review`);
  }

  // Get pending decisions
  getPendingDecisions() {
    return this.pendingDecisions.filter(decision => decision.status === 'pending');
  }

  // Make policy decision
  async makePolicyDecision(decisionId, allanDecision, reasoning = '') {
    const decision = this.pendingDecisions.find(d => d.id === decisionId);
    
    if (decision) {
      decision.status = 'decided';
      decision.allanDecision = allanDecision;
      decision.allanReasoning = reasoning;
      decision.decidedAt = new Date().toISOString();
      
      // Store in policy decisions
      this.policyDecisions.set(decisionId, decision);
      
      // Save to file
      await this.savePolicyDecisions();
      await this.savePendingDecisions();
      
      console.log(`✅ Robbie F: Policy decision made: ${allanDecision}`);
      return decision;
    } else {
      throw new Error('Policy decision not found');
    }
  }

  // Save redaction log
  async saveRedactionLog() {
    try {
      const logPath = '/home/allan/vengeance/data/redaction_log.json';
      await fs.writeFile(logPath, JSON.stringify(this.redactionLog, null, 2));
    } catch (error) {
      console.error('❌ Robbie F: Error saving redaction log:', error);
    }
  }

  // Save pending decisions
  async savePendingDecisions() {
    try {
      const decisionsPath = '/home/allan/vengeance/data/pending_decisions.json';
      await fs.writeFile(decisionsPath, JSON.stringify(this.pendingDecisions, null, 2));
    } catch (error) {
      console.error('❌ Robbie F: Error saving pending decisions:', error);
    }
  }

  // Save policy decisions
  async savePolicyDecisions() {
    try {
      const decisionsPath = '/home/allan/vengeance/data/policy_decisions.json';
      const decisions = Array.from(this.policyDecisions.values());
      await fs.writeFile(decisionsPath, JSON.stringify(decisions, null, 2));
    } catch (error) {
      console.error('❌ Robbie F: Error saving policy decisions:', error);
    }
  }

  // Get status
  getStatus() {
    return {
      userProfiles: Object.keys(this.userProfiles).length,
      redactionPolicies: this.redactionPolicies.size,
      redactionLog: this.redactionLog.length,
      pendingDecisions: this.pendingDecisions.length,
      policyDecisions: this.policyDecisions.size,
      lastActivity: new Date().toISOString()
    };
  }
}

export const lisaAccessControl = new LisaAccessControl();
