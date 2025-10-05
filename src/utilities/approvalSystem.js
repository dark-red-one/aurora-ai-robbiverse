import { db } from "./db.js";
import { randomUUID } from "crypto";

// Approval Queue System - Hardcoded safety stops
export class ApprovalSystem {
  constructor() {
    this.initializeTables();
    this.hardcodedStops = true; // Cannot be disabled
  }

  initializeTables() {
    // Approval queue table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS approval_queue (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        recipient TEXT NOT NULL,
        subject TEXT,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        approved_at DATETIME,
        sent_at DATETIME,
        user_confirmed BOOLEAN DEFAULT FALSE,
        ai_analysis TEXT,
        modifications TEXT,
        rejection_reason TEXT
      )
    `).run();

    // Audit trail table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS approval_audit (
        id TEXT PRIMARY KEY,
        approval_id TEXT,
        action TEXT NOT NULL,
        details TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        user_id TEXT DEFAULT 'allan'
      )
    `).run();
  }

  // HARDCODED STOP - Nothing can bypass this
  async queueOutbound(type, content, recipient, subject = null) {
    if (!this.hardcodedStops) {
      throw new Error('CRITICAL: Hardcoded stops disabled - this should never happen');
    }

    const item = {
      id: randomUUID(),
      type,           // 'email', 'linkedin', 'sms', etc.
      content,
      recipient,
      subject,
      status: 'pending',
      created_at: new Date().toISOString(),
      user_confirmed: false
    };

    // Add to approval queue
    db.prepare(`
      INSERT INTO approval_queue (id, type, content, recipient, subject, status, created_at, user_confirmed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(item.id, item.type, item.content, item.recipient, item.subject, item.status, item.created_at, item.user_confirmed);

    // Log audit trail
    this.logAudit(item.id, 'queued', `Outbound ${type} queued for approval`);

    // Analyze the item
    const analysis = await this.analyzeItem(item);
    
    // Update with analysis
    db.prepare(`
      UPDATE approval_queue SET ai_analysis = ? WHERE id = ?
    `).run(JSON.stringify(analysis), item.id);

    return { 
      status: 'queued', 
      id: item.id, 
      analysis,
      message: 'Item queued for approval - nothing sent until you approve'
    };
  }

  // AI Analysis of outbound items
  async analyzeItem(item) {
    const analysis = {
      confidence: 0.0,
      riskLevel: 'low',
      recommendations: [],
      context: {},
      alternatives: [],
      quality: {
        content: this.analyzeContentQuality(item.content),
        personalization: this.analyzePersonalization(item.content, item.recipient),
        tone: this.analyzeTone(item.content),
        clarity: this.analyzeClarity(item.content)
      },
      recipient: {
        relationship: await this.getRelationshipContext(item.recipient),
        history: await this.getInteractionHistory(item.recipient),
        risk: this.assessRecipientRisk(item.recipient)
      },
      timing: {
        appropriateness: this.assessTiming(item),
        urgency: this.assessUrgency(item)
      }
    };

    // Calculate overall confidence
    analysis.confidence = this.calculateConfidence(analysis);
    
    // Determine risk level
    analysis.riskLevel = this.determineRiskLevel(analysis);
    
    // Generate recommendations
    analysis.recommendations = this.generateRecommendations(analysis);
    
    // Suggest alternatives
    analysis.alternatives = this.generateAlternatives(item, analysis);

    return analysis;
  }

  // Content quality analysis
  analyzeContentQuality(content) {
    let score = 0.5; // Base score
    
    // Check for personalization
    if (content.includes('{{') && content.includes('}}')) {
      score += 0.2; // Template variables present
    }
    
    // Check for specific details
    if (content.includes('Aurora') && content.includes('December 1')) {
      score += 0.2; // Aurora-specific content
    }
    
    // Check for professional tone
    if (content.includes('Best regards') || content.includes('Sincerely')) {
      score += 0.1; // Professional closing
    }
    
    return Math.min(score, 1.0);
  }

  // Personalization analysis
  analyzePersonalization(content, recipient) {
    let score = 0.0;
    
    // Check for recipient-specific content
    if (content.toLowerCase().includes(recipient.toLowerCase().split('@')[0])) {
      score += 0.3;
    }
    
    // Check for company-specific content
    const domain = recipient.split('@')[1];
    if (content.toLowerCase().includes(domain.split('.')[0])) {
      score += 0.2;
    }
    
    return Math.min(score, 1.0);
  }

  // Tone analysis
  analyzeTone(content) {
    const positiveWords = ['excited', 'thrilled', 'delighted', 'grateful', 'appreciate'];
    const negativeWords = ['sorry', 'apologize', 'unfortunately', 'regret', 'disappointed'];
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    positiveWords.forEach(word => {
      if (content.toLowerCase().includes(word)) positiveCount++;
    });
    
    negativeWords.forEach(word => {
      if (content.toLowerCase().includes(word)) negativeCount++;
    });
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  // Clarity analysis
  analyzeClarity(content) {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgLength = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length;
    
    // Shorter sentences are generally clearer
    if (avgLength < 50) return 'high';
    if (avgLength < 100) return 'medium';
    return 'low';
  }

  // Get relationship context
  async getRelationshipContext(recipient) {
    // This would query your contact database
    // For now, return basic info
    return {
      type: 'unknown',
      lastContact: null,
      interactionCount: 0,
      relationshipStrength: 0.0
    };
  }

  // Get interaction history
  async getInteractionHistory(recipient) {
    // This would query your communication history
    return {
      totalInteractions: 0,
      lastInteraction: null,
      interactionTypes: []
    };
  }

  // Assess recipient risk
  assessRecipientRisk(recipient) {
    // Check if recipient is in safe list
    const safeDomains = ['aurora.com', 'family.com', 'test.com'];
    const domain = recipient.split('@')[1];
    
    if (safeDomains.includes(domain)) {
      return 'low';
    }
    
    return 'medium';
  }

  // Assess timing
  assessTiming(item) {
    const now = new Date();
    const hour = now.getHours();
    
    // Business hours are generally better
    if (hour >= 9 && hour <= 17) {
      return 'good';
    }
    
    return 'acceptable';
  }

  // Assess urgency
  assessUrgency(item) {
    const urgentKeywords = ['urgent', 'asap', 'immediately', 'deadline'];
    const content = item.content.toLowerCase();
    
    if (urgentKeywords.some(keyword => content.includes(keyword))) {
      return 'high';
    }
    
    return 'normal';
  }

  // Calculate overall confidence
  calculateConfidence(analysis) {
    const weights = {
      content: 0.3,
      personalization: 0.2,
      tone: 0.2,
      clarity: 0.1,
      recipient: 0.1,
      timing: 0.1
    };
    
    let score = 0;
    score += analysis.quality.content * weights.content;
    score += analysis.quality.personalization * weights.personalization;
    score += (analysis.quality.tone === 'positive' ? 1 : 0) * weights.tone;
    score += (analysis.quality.clarity === 'high' ? 1 : 0) * weights.clarity;
    score += (analysis.recipient.risk === 'low' ? 1 : 0) * weights.recipient;
    score += (analysis.timing.appropriateness === 'good' ? 1 : 0) * weights.timing;
    
    return Math.min(score, 1.0);
  }

  // Determine risk level
  determineRiskLevel(analysis) {
    if (analysis.confidence > 0.8 && analysis.recipient.risk === 'low') {
      return 'low';
    }
    if (analysis.confidence > 0.6 && analysis.recipient.risk === 'medium') {
      return 'medium';
    }
    return 'high';
  }

  // Generate recommendations
  generateRecommendations(analysis) {
    const recommendations = [];
    
    if (analysis.confidence < 0.7) {
      recommendations.push('Consider improving personalization');
    }
    
    if (analysis.quality.tone === 'negative') {
      recommendations.push('Consider adjusting tone to be more positive');
    }
    
    if (analysis.quality.clarity === 'low') {
      recommendations.push('Consider simplifying the message');
    }
    
    if (analysis.recipient.risk === 'high') {
      recommendations.push('High risk recipient - review carefully');
    }
    
    return recommendations;
  }

  // Generate alternatives
  generateAlternatives(item, analysis) {
    const alternatives = [];
    
    if (analysis.quality.personalization < 0.5) {
      alternatives.push({
        type: 'more_personal',
        description: 'Add more personal touches',
        content: this.addPersonalization(item.content, item.recipient)
      });
    }
    
    if (analysis.quality.tone === 'negative') {
      alternatives.push({
        type: 'positive_tone',
        description: 'Make tone more positive',
        content: this.makeTonePositive(item.content)
      });
    }
    
    return alternatives;
  }

  // Add personalization
  addPersonalization(content, recipient) {
    const name = recipient.split('@')[0];
    return content.replace(/Hi\s+[^,]+/, `Hi ${name}`);
  }

  // Make tone positive
  makeTonePositive(content) {
    return content
      .replace(/sorry/gi, 'thank you for your patience')
      .replace(/apologize/gi, 'appreciate your understanding')
      .replace(/unfortunately/gi, 'I\'m excited to share');
  }

  // Get approval queue
  async getApprovalQueue() {
    const items = db.prepare(`
      SELECT * FROM approval_queue 
      WHERE status = 'pending' 
      ORDER BY created_at DESC
    `).all();
    
    return items.map(item => ({
      ...item,
      ai_analysis: item.ai_analysis ? JSON.parse(item.ai_analysis) : null
    }));
  }

  // Approve an item
  async approveItem(id, modifications = null) {
    const item = db.prepare('SELECT * FROM approval_queue WHERE id = ?').get(id);
    
    if (!item) {
      throw new Error('Item not found');
    }
    
    // Update with modifications if provided
    if (modifications) {
      db.prepare(`
        UPDATE approval_queue 
        SET content = ?, modifications = ?, status = 'approved', approved_at = ?, user_confirmed = TRUE
        WHERE id = ?
      `).run(modifications.content || item.content, JSON.stringify(modifications), new Date().toISOString(), id);
    } else {
      db.prepare(`
        UPDATE approval_queue 
        SET status = 'approved', approved_at = ?, user_confirmed = TRUE
        WHERE id = ?
      `).run(new Date().toISOString(), id);
    }
    
    this.logAudit(id, 'approved', 'Item approved by user');
    
    return { status: 'approved', id };
  }

  // Reject an item
  async rejectItem(id, reason) {
    db.prepare(`
      UPDATE approval_queue 
      SET status = 'rejected', rejection_reason = ?
      WHERE id = ?
    `).run(reason, id);
    
    this.logAudit(id, 'rejected', `Item rejected: ${reason}`);
    
    return { status: 'rejected', id };
  }

  // Send approved items
  async sendApprovedItems() {
    const approvedItems = db.prepare(`
      SELECT * FROM approval_queue 
      WHERE status = 'approved' AND sent_at IS NULL
    `).all();
    
    const results = [];
    
    for (const item of approvedItems) {
      try {
        // This is where the actual sending would happen
        // For now, just mark as sent
        db.prepare(`
          UPDATE approval_queue 
          SET status = 'sent', sent_at = ?
          WHERE id = ?
        `).run(new Date().toISOString(), item.id);
        
        this.logAudit(item.id, 'sent', 'Item sent successfully');
        
        results.push({ id: item.id, status: 'sent' });
      } catch (error) {
        this.logAudit(item.id, 'send_failed', `Send failed: ${error.message}`);
        results.push({ id: item.id, status: 'failed', error: error.message });
      }
    }
    
    return results;
  }

  // Log audit trail
  logAudit(approvalId, action, details) {
    db.prepare(`
      INSERT INTO approval_audit (id, approval_id, action, details)
      VALUES (?, ?, ?, ?)
    `).run(randomUUID(), approvalId, action, details);
  }
}

export const approvalSystem = new ApprovalSystem();
