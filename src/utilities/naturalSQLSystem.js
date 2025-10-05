// Natural SQL Query System
// Allan can ask about anything in the database using natural language

class NaturalSQLSystem {
  constructor(db, redactor) {
    this.db = db;
    this.redactor = redactor;
    this.queryHistory = [];
    this.conversationContext = new Map();
    
    // Database schema knowledge for better query generation
    this.schemaKnowledge = {
      contacts: ['id', 'email', 'first_name', 'last_name', 'company_domain', 'is_vip', 'created_at'],
      companies: ['id', 'domain', 'name', 'industry', 'is_vip', 'created_at'],
      deals: ['hubspot_id', 'name', 'amount', 'stage', 'company_id', 'close_date', 'is_vip'],
      interactions: ['id', 'user_id', 'channel', 'type', 'content', 'timestamp'],
      meetings: ['fireflies_id', 'title', 'start_time', 'duration', 'transcript_text', 'participants'],
      budget_spend: ['id', 'service', 'amount', 'description', 'budget_type', 'spent_at'],
      team_polls: ['id', 'question', 'total_votes', 'results', 'created_at'],
      screenshot_events: ['id', 'filename', 'context', 'timestamp', 'user_id'],
      conflicts: ['id', 'type', 'members', 'severity', 'created_at']
    };
  }

  // Process natural language query
  async processNaturalQuery(question, userId = 'allan') {
    console.log(`🤔 Processing query: "${question}"`);
    
    // Generate SQL from natural language
    const sqlGeneration = await this.generateSQL(question, userId);
    
    if (!sqlGeneration.success) {
      return {
        success: false,
        error: sqlGeneration.error,
        suggestions: sqlGeneration.suggestions
      };
    }

    // Send to independent risk checker
    const riskAssessment = await this.assessQueryRisk(sqlGeneration.sql, question, userId);
    
    // Present query and risk assessment to Allan
    const queryPresentation = {
      original_question: question,
      generated_sql: sqlGeneration.sql,
      explanation: sqlGeneration.explanation,
      tables_accessed: sqlGeneration.tables_accessed,
      risk_assessment: riskAssessment,
      conversation_id: `query_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    };

    // Store conversation context
    this.conversationContext.set(queryPresentation.conversation_id, {
      question,
      sql: sqlGeneration.sql,
      risk_assessment: riskAssessment,
      status: 'pending_approval',
      timestamp: new Date()
    });

    return queryPresentation;
  }

  // Generate SQL from natural language
  async generateSQL(question, userId) {
    try {
      // Analyze the question to understand intent
      const intent = this.analyzeQueryIntent(question);
      
      // Generate SQL based on intent
      const sql = await this.constructSQL(intent, question);
      
      if (!sql) {
        return {
          success: false,
          error: "I couldn't understand what you're looking for",
          suggestions: this.generateQuerySuggestions(question)
        };
      }

      return {
        success: true,
        sql: sql.query,
        explanation: sql.explanation,
        tables_accessed: sql.tables,
        confidence: sql.confidence
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        suggestions: ["Try being more specific about what data you want to see"]
      };
    }
  }

  // Analyze query intent
  analyzeQueryIntent(question) {
    const questionLower = question.toLowerCase();
    
    const intent = {
      action: null,        // SELECT, COUNT, SUM, AVG, etc.
      entity: null,        // contacts, deals, companies, etc.
      filters: [],         // WHERE conditions
      timeframe: null,     // date range
      aggregation: null,   // GROUP BY, HAVING
      sorting: null,       // ORDER BY
      limit: null          // LIMIT
    };

    // Determine action
    if (questionLower.includes('how many') || questionLower.includes('count')) {
      intent.action = 'COUNT';
    } else if (questionLower.includes('total') || questionLower.includes('sum')) {
      intent.action = 'SUM';
    } else if (questionLower.includes('average') || questionLower.includes('avg')) {
      intent.action = 'AVG';
    } else if (questionLower.includes('show') || questionLower.includes('list') || questionLower.includes('get')) {
      intent.action = 'SELECT';
    }

    // Determine entity
    if (questionLower.includes('contact')) intent.entity = 'contacts';
    if (questionLower.includes('deal')) intent.entity = 'deals';
    if (questionLower.includes('company') || questionLower.includes('companies')) intent.entity = 'companies';
    if (questionLower.includes('meeting')) intent.entity = 'meetings';
    if (questionLower.includes('budget') || questionLower.includes('spend')) intent.entity = 'budget_spend';
    if (questionLower.includes('poll')) intent.entity = 'team_polls';
    if (questionLower.includes('screenshot')) intent.entity = 'screenshot_events';

    // Extract filters
    if (questionLower.includes('vip')) intent.filters.push('is_vip = true');
    if (questionLower.includes('today')) intent.timeframe = 'today';
    if (questionLower.includes('this week')) intent.timeframe = 'week';
    if (questionLower.includes('this month')) intent.timeframe = 'month';

    // Extract specific values
    const emailMatch = question.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) intent.filters.push(`email = '${emailMatch[1]}'`);

    const amountMatch = question.match(/\$([0-9,]+)/);
    if (amountMatch) {
      const amount = amountMatch[1].replace(',', '');
      intent.filters.push(`amount >= ${amount}`);
    }

    return intent;
  }

  // Construct SQL query
  async constructSQL(intent, originalQuestion) {
    if (!intent.entity) {
      return null;
    }

    const table = intent.entity;
    const columns = this.schemaKnowledge[table];
    
    if (!columns) {
      return null;
    }

    let query = '';
    let explanation = '';
    const tables = [table];

    // Build SELECT clause
    if (intent.action === 'COUNT') {
      query = `SELECT COUNT(*) as total_count FROM ${table}`;
      explanation = `Counting total records in ${table}`;
    } else if (intent.action === 'SUM' && table === 'deals') {
      query = `SELECT SUM(amount) as total_amount FROM ${table}`;
      explanation = `Summing total deal amounts`;
    } else if (intent.action === 'AVG' && table === 'deals') {
      query = `SELECT AVG(amount) as average_amount FROM ${table}`;
      explanation = `Calculating average deal amount`;
    } else {
      // Default SELECT
      const displayColumns = this.getDisplayColumns(table);
      query = `SELECT ${displayColumns.join(', ')} FROM ${table}`;
      explanation = `Selecting ${displayColumns.length} columns from ${table}`;
    }

    // Add WHERE clause
    const whereConditions = [];
    
    // Add filters
    whereConditions.push(...intent.filters);
    
    // Add timeframe filters
    if (intent.timeframe) {
      const timeColumn = this.getTimeColumn(table);
      if (timeColumn) {
        switch (intent.timeframe) {
          case 'today':
            whereConditions.push(`DATE(${timeColumn}) = DATE('now')`);
            break;
          case 'week':
            whereConditions.push(`${timeColumn} >= datetime('now', '-7 days')`);
            break;
          case 'month':
            whereConditions.push(`${timeColumn} >= datetime('now', '-30 days')`);
            break;
        }
      }
    }

    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(' AND ')}`;
      explanation += ` with filters: ${whereConditions.join(', ')}`;
    }

    // Add ORDER BY
    const timeColumn = this.getTimeColumn(table);
    if (timeColumn && intent.action === 'SELECT') {
      query += ` ORDER BY ${timeColumn} DESC`;
      explanation += ` ordered by most recent`;
    }

    // Add LIMIT for SELECT queries
    if (intent.action === 'SELECT') {
      query += ` LIMIT 50`;
      explanation += ` (limited to 50 records)`;
    }

    return {
      query: query,
      explanation: explanation,
      tables: tables,
      confidence: this.calculateQueryConfidence(intent, originalQuestion)
    };
  }

  // Get display columns for a table
  getDisplayColumns(table) {
    const columnSets = {
      contacts: ['id', 'email', 'first_name', 'last_name', 'company_domain', 'is_vip'],
      companies: ['id', 'name', 'domain', 'industry', 'is_vip'],
      deals: ['hubspot_id', 'name', 'amount', 'stage', 'close_date'],
      interactions: ['id', 'user_id', 'type', 'content', 'timestamp'],
      meetings: ['fireflies_id', 'title', 'start_time', 'duration'],
      budget_spend: ['id', 'service', 'amount', 'description', 'spent_at'],
      team_polls: ['id', 'question', 'total_votes', 'created_at'],
      screenshot_events: ['id', 'filename', 'context', 'timestamp']
    };

    return columnSets[table] || this.schemaKnowledge[table].slice(0, 6);
  }

  // Get time column for a table
  getTimeColumn(table) {
    const timeColumns = {
      contacts: 'created_at',
      companies: 'created_at',
      deals: 'created_at',
      interactions: 'timestamp',
      meetings: 'start_time',
      budget_spend: 'spent_at',
      team_polls: 'created_at',
      screenshot_events: 'timestamp'
    };

    return timeColumns[table];
  }

  // Calculate query confidence
  calculateQueryConfidence(intent, question) {
    let confidence = 0.5; // Base confidence

    if (intent.entity) confidence += 0.2;
    if (intent.action) confidence += 0.2;
    if (intent.filters.length > 0) confidence += 0.1;
    if (intent.timeframe) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }

  // Assess query risk
  async assessQueryRisk(sql, originalQuestion, userId) {
    const risks = [];
    const sqlLower = sql.toLowerCase();

    // Check for dangerous operations
    if (sqlLower.includes('delete') || sqlLower.includes('drop') || sqlLower.includes('truncate')) {
      risks.push({
        level: 'critical',
        type: 'destructive_operation',
        message: 'Query contains destructive operations (DELETE, DROP, TRUNCATE)',
        recommendation: 'Block this query - it could delete data'
      });
    }

    if (sqlLower.includes('update') || sqlLower.includes('insert')) {
      risks.push({
        level: 'high',
        type: 'data_modification',
        message: 'Query modifies data (UPDATE, INSERT)',
        recommendation: 'Review carefully - this changes data'
      });
    }

    // Check for performance risks
    if (!sqlLower.includes('limit') && sqlLower.includes('select')) {
      risks.push({
        level: 'medium',
        type: 'performance_risk',
        message: 'Query has no LIMIT clause - could return large result set',
        recommendation: 'Add LIMIT to prevent performance issues'
      });
    }

    // Check for sensitive data access
    if (sqlLower.includes('password') || sqlLower.includes('token') || sqlLower.includes('secret')) {
      risks.push({
        level: 'high',
        type: 'sensitive_data',
        message: 'Query accesses potentially sensitive data',
        recommendation: 'Review data access permissions'
      });
    }

    // Calculate overall risk level
    const maxRiskLevel = risks.reduce((max, risk) => {
      const levels = { low: 1, medium: 2, high: 3, critical: 4 };
      return Math.max(max, levels[risk.level] || 0);
    }, 0);

    const riskLevels = ['none', 'low', 'medium', 'high', 'critical'];

    return {
      overall_risk: riskLevels[maxRiskLevel],
      risks: risks,
      recommendation: this.generateRiskRecommendation(risks),
      safe_to_execute: maxRiskLevel <= 2 // Medium risk or lower
    };
  }

  // Generate risk recommendation
  generateRiskRecommendation(risks) {
    if (risks.length === 0) {
      return 'Query appears safe to execute';
    }

    const criticalRisks = risks.filter(r => r.level === 'critical');
    if (criticalRisks.length > 0) {
      return 'DO NOT EXECUTE - Critical risks detected';
    }

    const highRisks = risks.filter(r => r.level === 'high');
    if (highRisks.length > 0) {
      return 'Review carefully before executing - High risks detected';
    }

    return 'Proceed with caution - Some risks detected';
  }

  // Execute approved query
  async executeApprovedQuery(conversationId, approved) {
    const context = this.conversationContext.get(conversationId);
    if (!context) {
      return { success: false, error: 'Query context not found' };
    }

    if (!approved) {
      // Start natural discussion about adjusting the query
      return await this.startQueryDiscussion(context);
    }

    try {
      // Execute the query
      const results = await this.db.all(context.sql);
      
      // Store query execution
      await this.storeQueryExecution(context, results, 'executed');
      
      // Update conversation context
      context.status = 'executed';
      context.results = results;

      return {
        success: true,
        results: results,
        query: context.sql,
        execution_time: new Date(),
        row_count: results.length
      };

    } catch (error) {
      await this.storeQueryExecution(context, null, 'error', error.message);
      
      return {
        success: false,
        error: error.message,
        suggestions: ['Check the SQL syntax', 'Verify table and column names']
      };
    }
  }

  // Start natural discussion about query adjustment
  async startQueryDiscussion(context) {
    const risks = context.risk_assessment.risks;
    const questions = [];

    // Generate specific questions based on risks and intent
    if (risks.some(r => r.type === 'performance_risk')) {
      questions.push("I notice there's no limit on this query - how many records are you expecting to see?");
    }

    if (risks.some(r => r.type === 'sensitive_data')) {
      questions.push("This query accesses sensitive data - are you sure you need all these fields?");
    }

    if (context.sql.includes('*')) {
      questions.push("The query selects all columns - would you prefer specific fields instead?");
    }

    // Generate suggestions for improvement
    const suggestions = this.generateQuerySuggestions(context.question);

    return {
      success: false,
      discussion_started: true,
      questions: questions,
      suggestions: suggestions,
      conversation_id: context.conversation_id,
      current_query: context.sql
    };
  }

  // Generate query suggestions
  generateQuerySuggestions(question) {
    const suggestions = [];
    
    // Common query patterns
    suggestions.push("Show me all VIP contacts");
    suggestions.push("How many deals do we have in negotiation?");
    suggestions.push("What's our total budget spend this month?");
    suggestions.push("List recent meetings with transcripts");
    suggestions.push("Show me companies with deals over $100K");
    
    return suggestions;
  }

  // Store query execution
  async storeQueryExecution(context, results, status, error = null) {
    await this.db.run(`
      INSERT INTO query_executions (
        conversation_id, original_question, sql_query, status, 
        result_count, error_message, executed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      context.conversation_id,
      context.question,
      context.sql,
      status,
      results ? results.length : 0,
      error,
      new Date().toISOString()
    ]);
  }

  // Initialize database tables
  async initializeTables() {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS query_executions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id TEXT NOT NULL,
        original_question TEXT NOT NULL,
        sql_query TEXT NOT NULL,
        status TEXT NOT NULL,
        result_count INTEGER,
        error_message TEXT,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_query_executions_conversation ON query_executions (conversation_id);
      CREATE INDEX IF NOT EXISTS idx_query_executions_executed ON query_executions (executed_at DESC);
    `);
  }
}

module.exports = NaturalSQLSystem;
