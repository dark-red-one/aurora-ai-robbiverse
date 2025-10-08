const { Client } = require('pg');

"use strict";

class GenAISatisfactionTracker {
  constructor(options = {}) {
    this.dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'robbie_v3',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      ssl: process.env.DB_SSL_MODE !== 'disable' ? { rejectUnauthorized: false } : false
    };
    
    // GenAI product categories with Robbie's confidence levels
    this.productCategories = {
      'MSA': {
        name: 'MSA (Master Service Agreement)',
        riskLevel: 'high',
        requiresLegalReview: true,
        disclaimerTemplate: "I'm great at MSAs but don't forget to have your lawyer look at it! ⚖️",
        consentRequired: true,
        emojiPattern: '🟢⚠️' // Green start, warning end
      },
      'legal_documents': {
        name: 'Legal Documents',
        riskLevel: 'critical',
        requiresLegalReview: true,
        disclaimerTemplate: "Legal review strongly recommended. I'm working on it though! ⚖️",
        consentRequired: true,
        emojiPattern: '🔴⚠️' // Red start, warning end
      },
      'financial_reports': {
        name: 'Financial Reports',
        riskLevel: 'high',
        requiresLegalReview: true,
        disclaimerTemplate: "Financial accuracy is crucial. Please verify with your accountant! 📊",
        consentRequired: true,
        emojiPattern: '🟡⚠️' // Yellow start, warning end
      },
      'presentations': {
        name: 'Presentations',
        riskLevel: 'medium',
        requiresLegalReview: false,
        disclaimerTemplate: "I'm just OK with presentations... I'm working on it though! 📊",
        consentRequired: false,
        emojiPattern: '🟡' // Yellow
      },
      'images': {
        name: 'Images',
        riskLevel: 'low',
        requiresLegalReview: false,
        disclaimerTemplate: "I'm getting better at images! 🎨",
        consentRequired: false,
        emojiPattern: '🟡' // Yellow
      },
      'code': {
        name: 'Code',
        riskLevel: 'medium',
        requiresLegalReview: false,
        disclaimerTemplate: "Code review recommended. I'm working on it though! 💻",
        consentRequired: false,
        emojiPattern: '🟡' // Yellow
      },
      'emails': {
        name: 'Email Templates',
        riskLevel: 'low',
        requiresLegalReview: false,
        disclaimerTemplate: "I'm pretty good at emails! 📧",
        consentRequired: false,
        emojiPattern: '🟢' // Green
      },
      'analysis': {
        name: 'Analysis Reports',
        riskLevel: 'medium',
        requiresLegalReview: false,
        disclaimerTemplate: "I'm just OK with analysis... I'm working on it though! 📈",
        consentRequired: false,
        emojiPattern: '🟡' // Yellow
      },
      'proposals': {
        name: 'Proposals',
        riskLevel: 'medium',
        requiresLegalReview: false,
        disclaimerTemplate: "I'm working on proposals... I'm working on it though! 📋",
        consentRequired: false,
        emojiPattern: '🟡' // Yellow
      }
    };
  }

  /**
   * Get Robbie's status message for a specific product category
   */
  async getRobbieStatusMessage(categoryName) {
    try {
      const client = new Client(this.dbConfig);
      
      try {
        await client.connect();
        
        const query = `SELECT * FROM app.get_robbie_status_message($1)`;
        const result = await client.query(query, [categoryName]);
        
        if (result.rows.length === 0) {
          return {
            status_emoji: '⚪',
            status_message: "I'm working on it though!",
            disclaimer_template: "I'm working on it though!",
            requires_legal_review: false,
            consent_required: false
          };
        }
        
        return result.rows[0];
      } finally {
        await client.end();
      }
    } catch (error) {
      return {
        status_emoji: '⚪',
        status_message: "I'm working on it though!",
        disclaimer_template: "I'm working on it though!",
        requires_legal_review: false,
        consent_required: false
      };
    }
  }

  /**
   * Record user satisfaction with a GenAI deliverable
   */
  async recordSatisfaction(userId, orgId, categoryName, deliverableType, satisfactionRating, feedbackText = null, qualityMetrics = {}) {
    try {
      const client = new Client(this.dbConfig);
      
      try {
        await client.connect();
        
        const query = `
          SELECT * FROM app.record_genai_satisfaction($1, $2, $3, $4, $5, $6, $7)
        `;
        
        const result = await client.query(query, [
          userId,
          orgId,
          categoryName,
          deliverableType,
          satisfactionRating,
          feedbackText,
          JSON.stringify(qualityMetrics)
        ]);
        
        return result.rows[0];
      } finally {
        await client.end();
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Record legal consent for a GenAI deliverable
   */
  async recordLegalConsent(userId, orgId, categoryName, consentType, warningMessage, consentGiven, requestInfo = {}) {
    try {
      const client = new Client(this.dbConfig);
      
      try {
        await client.connect();
        
        const query = `
          SELECT * FROM app.record_legal_consent($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `;
        
        const result = await client.query(query, [
          userId,
          orgId,
          categoryName,
          consentType,
          warningMessage,
          consentGiven,
          requestInfo.ipAddress || null,
          requestInfo.userAgent || null,
          requestInfo.sessionId || null
        ]);
        
        return result.rows[0];
      } finally {
        await client.end();
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update Robbie's confidence level for a product category
   */
  async updateRobbieConfidence(categoryName, confidenceLevel, confidenceScore, statusMessage, improvementNotes = null) {
    try {
      const client = new Client(this.dbConfig);
      
      try {
        await client.connect();
        
        const query = `
          SELECT * FROM app.update_robbie_confidence($1, $2, $3, $4, $5)
        `;
        
        const result = await client.query(query, [
          categoryName,
          confidenceLevel,
          confidenceScore,
          statusMessage,
          improvementNotes
        ]);
        
        return result.rows[0];
      } finally {
        await client.end();
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get satisfaction summary for all categories
   */
  async getSatisfactionSummary() {
    try {
      const client = new Client(this.dbConfig);
      
      try {
        await client.connect();
        
        const query = `SELECT * FROM app.v_genai_satisfaction_summary`;
        const result = await client.query(query);
        
        return result.rows;
      } finally {
        await client.end();
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get legal consent summary
   */
  async getLegalConsentSummary() {
    try {
      const client = new Client(this.dbConfig);
      
      try {
        await client.connect();
        
        const query = `SELECT * FROM app.v_legal_consent_summary`;
        const result = await client.query(query);
        
        return result.rows;
      } finally {
        await client.end();
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get Robbie's confidence status for all categories
   */
  async getRobbieConfidenceStatus() {
    try {
      const client = new Client(this.dbConfig);
      
      try {
        await client.connect();
        
        const query = `SELECT * FROM app.v_robbie_confidence_status`;
        const result = await client.query(query);
        
        return result.rows;
      } finally {
        await client.end();
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generate Robbie's response message for a product category
   */
  generateRobbieResponse(categoryName, userSatisfaction = null) {
    const category = this.productCategories[categoryName];
    if (!category) {
      return {
        emoji: '⚪',
        message: "I'm working on it though!",
        requiresConsent: false,
        disclaimer: "I'm working on it though!"
      };
    }

    // Determine confidence level based on user satisfaction
    let confidenceLevel = 'yellow'; // Default
    let statusMessage = category.disclaimerTemplate;
    
    if (userSatisfaction !== null) {
      if (userSatisfaction >= 4) {
        confidenceLevel = 'green';
        statusMessage = statusMessage.replace("I'm just OK", "I'm great").replace("I'm working on it though!", "I'm getting better!");
      } else if (userSatisfaction <= 2) {
        confidenceLevel = 'red';
        statusMessage = statusMessage.replace("I'm just OK", "I need work").replace("I'm working on it though!", "I'm working on it though!");
      }
    }

    const emojiMap = {
      'green': '🟢',
      'yellow': '🟡',
      'red': '🔴'
    };

    return {
      emoji: emojiMap[confidenceLevel],
      message: statusMessage,
      requiresConsent: category.consentRequired,
      disclaimer: category.disclaimerTemplate,
      riskLevel: category.riskLevel,
      emojiPattern: category.emojiPattern
    };
  }

  /**
   * Check if user needs to give consent for a product category
   */
  async checkConsentRequired(userId, orgId, categoryName) {
    try {
      const client = new Client(this.dbConfig);
      
      try {
        await client.connect();
        
        // Check if user has already given consent recently (within 30 days)
        const query = `
          SELECT COUNT(*) as consent_count
          FROM app.genai_legal_consent_log gcl
          JOIN app.genai_product_categories gpc ON gcl.product_category_id = gpc.id
          WHERE gcl.user_id = $1 
            AND gcl.org_id = $2 
            AND gpc.category_name = $3
            AND gcl.consent_given = TRUE
            AND gcl.consent_timestamp >= NOW() - INTERVAL '30 days'
        `;
        
        const result = await client.query(query, [userId, orgId, categoryName]);
        const hasRecentConsent = parseInt(result.rows[0].consent_count) > 0;
        
        // Get category requirements
        const categoryQuery = `
          SELECT requires_legal_review, consent_required
          FROM app.genai_product_categories
          WHERE category_name = $1 AND is_active = TRUE
        `;
        
        const categoryResult = await client.query(categoryQuery, [categoryName]);
        
        if (categoryResult.rows.length === 0) {
          return { requiresConsent: false, hasRecentConsent: false };
        }
        
        const category = categoryResult.rows[0];
        
        return {
          requiresConsent: category.consent_required && !hasRecentConsent,
          hasRecentConsent,
          requiresLegalReview: category.requires_legal_review
        };
      } finally {
        await client.end();
      }
    } catch (error) {
      return { requiresConsent: false, hasRecentConsent: false };
    }
  }

  /**
   * Get user's consent history
   */
  async getUserConsentHistory(userId, orgId, limit = 50) {
    try {
      const client = new Client(this.dbConfig);
      
      try {
        await client.connect();
        
        const query = `
          SELECT 
            gcl.*,
            gpc.category_name,
            gpc.risk_level
          FROM app.genai_legal_consent_log gcl
          JOIN app.genai_product_categories gpc ON gcl.product_category_id = gpc.id
          WHERE gcl.user_id = $1 AND gcl.org_id = $2
          ORDER BY gcl.consent_timestamp DESC
          LIMIT $3
        `;
        
        const result = await client.query(query, [userId, orgId, limit]);
        return result.rows;
      } finally {
        await client.end();
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const client = new Client(this.dbConfig);
      
      try {
        await client.connect();
        const result = await client.query('SELECT COUNT(*) FROM app.genai_product_categories LIMIT 1');
        
        return {
          status: 'healthy',
          response: 'GenAI satisfaction tracking service accessible',
          database_accessible: true,
          timestamp: new Date().toISOString()
        };
      } finally {
        await client.end();
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = { GenAISatisfactionTracker };
