// Daily Budget Management System
// Handles marketing and enrichment budgets with confirmation prompts

class BudgetManagement {
  constructor(db) {
    this.db = db;
    this.dailyBudgets = {
      marketing: 1000, // $1000 daily marketing budget
      enrichment: 500,  // $500 daily enrichment budget
      total: 1500       // Total daily budget
    };
    this.currentSpend = {
      marketing: 0,
      enrichment: 0,
      total: 0
    };
    this.budgetHistory = [];
  }

  // Initialize daily budgets
  async initializeDailyBudgets() {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if budgets already set for today
    const existingBudget = await this.db.get(`
      SELECT * FROM daily_budgets WHERE date = ?
    `, [today]);

    if (!existingBudget) {
      // Set default budgets for today
      await this.setDailyBudget('marketing', 1000, 'allan');
      await this.setDailyBudget('enrichment', 500, 'allan');
      
      console.log('💰 Daily budgets initialized: Marketing $1000, Enrichment $500');
    } else {
      // Load existing budgets
      this.dailyBudgets.marketing = existingBudget.marketing_budget;
      this.dailyBudgets.enrichment = existingBudget.enrichment_budget;
      this.dailyBudgets.total = this.dailyBudgets.marketing + this.dailyBudgets.enrichment;
    }

    // Load current spend for today
    await this.loadCurrentSpend(today);
  }

  // Set daily budget with confirmation
  async setDailyBudget(budgetType, amount, requestedBy) {
    const confirmation = await this.requestBudgetConfirmation(budgetType, amount, requestedBy);
    
    if (confirmation.approved) {
      const today = new Date().toISOString().split('T')[0];
      
      // Update budget
      await this.db.run(`
        INSERT OR REPLACE INTO daily_budgets (
          date, budget_type, amount, requested_by, approved_at
        ) VALUES (?, ?, ?, ?, ?)
      `, [today, budgetType, amount, requestedBy, new Date().toISOString()]);

      // Update local budget
      this.dailyBudgets[budgetType] = amount;
      this.dailyBudgets.total = this.dailyBudgets.marketing + this.dailyBudgets.enrichment;

      // Log budget change
      await this.logBudgetChange(budgetType, amount, requestedBy, 'approved');

      console.log(`✅ ${budgetType} budget set to $${amount} by ${requestedBy}`);
      return { success: true, amount, budgetType };
    } else {
      await this.logBudgetChange(budgetType, amount, requestedBy, 'rejected');
      return { success: false, reason: 'Budget not approved' };
    }
  }

  // Request budget confirmation
  async requestBudgetConfirmation(budgetType, amount, requestedBy) {
    const budgetName = budgetType === 'marketing' ? 'Marketing' : 'Enrichment';
    
    // Create confirmation prompt
    const confirmationPrompt = {
      type: 'budget_confirmation',
      budget_type: budgetType,
      amount: amount,
      requested_by: requestedBy,
      message: `Please confirm Allan - ${budgetName} Budget = $${amount} daily.`,
      options: [
        { id: 'yes', text: 'Yes', emoji: '✅' },
        { id: 'no', text: 'No', emoji: '❌' },
        { id: 'edit', text: 'Edit Amount', emoji: '✏️' }
      ],
      timestamp: new Date().toISOString()
    };

    // Store confirmation request
    await this.db.run(`
      INSERT INTO budget_confirmations (
        budget_type, amount, requested_by, status, created_at
      ) VALUES (?, ?, ?, ?, ?)
    `, [budgetType, amount, requestedBy, 'pending', new Date().toISOString()]);

    // For now, auto-approve if requested by Allan
    if (requestedBy === 'allan') {
      return { approved: true, amount: amount };
    }

    // In a real implementation, this would trigger a UI prompt
    return { approved: false, reason: 'Awaiting user confirmation' };
  }

  // Check if we can spend on a service
  async canSpend(service, amount) {
    const budgetType = this.getBudgetTypeForService(service);
    const currentSpend = this.currentSpend[budgetType];
    const budget = this.dailyBudgets[budgetType];

    return {
      canSpend: (currentSpend + amount) <= budget,
      remaining: budget - currentSpend,
      currentSpend: currentSpend,
      budget: budget,
      service: service
    };
  }

  // Record spend
  async recordSpend(service, amount, description) {
    const budgetType = this.getBudgetTypeForService(service);
    const spendCheck = await this.canSpend(service, amount);

    if (!spendCheck.canSpend) {
      return {
        success: false,
        reason: 'Insufficient budget',
        remaining: spendCheck.remaining,
        requested: amount
      };
    }

    // Record the spend
    await this.db.run(`
      INSERT INTO budget_spend (
        service, amount, description, budget_type, spent_at
      ) VALUES (?, ?, ?, ?, ?)
    `, [service, amount, description, budgetType, new Date().toISOString()]);

    // Update current spend
    this.currentSpend[budgetType] += amount;
    this.currentSpend.total += amount;

    // Check if we're approaching budget limit
    const remaining = spendCheck.remaining - amount;
    if (remaining < 100) {
      await this.sendBudgetAlert(budgetType, remaining);
    }

    return {
      success: true,
      amount: amount,
      remaining: remaining,
      budgetType: budgetType
    };
  }

  // Get budget type for service
  getBudgetTypeForService(service) {
    const enrichmentServices = ['clay', 'apollo', 'fireflies', 'enrichment'];
    const marketingServices = ['marketing', 'advertising', 'campaigns', 'social_media'];
    
    if (enrichmentServices.includes(service.toLowerCase())) {
      return 'enrichment';
    } else if (marketingServices.includes(service.toLowerCase())) {
      return 'marketing';
    } else {
      return 'marketing'; // Default to marketing
    }
  }

  // Load current spend for today
  async loadCurrentSpend(date) {
    const spend = await this.db.all(`
      SELECT budget_type, SUM(amount) as total_spend
      FROM budget_spend 
      WHERE DATE(spent_at) = ?
      GROUP BY budget_type
    `, [date]);

    // Reset current spend
    this.currentSpend = { marketing: 0, enrichment: 0, total: 0 };

    // Load actual spend
    spend.forEach(item => {
      this.currentSpend[item.budget_type] = item.total_spend;
    });

    this.currentSpend.total = this.currentSpend.marketing + this.currentSpend.enrichment;
  }

  // Send budget alert
  async sendBudgetAlert(budgetType, remaining) {
    const alert = {
      type: 'budget_alert',
      budget_type: budgetType,
      remaining: remaining,
      message: `⚠️ ${budgetType} budget running low: $${remaining} remaining`,
      timestamp: new Date().toISOString()
    };

    // Store alert
    await this.db.run(`
      INSERT INTO budget_alerts (
        budget_type, remaining, message, created_at
      ) VALUES (?, ?, ?, ?)
    `, [budgetType, remaining, alert.message, new Date().toISOString()]);

    console.log(`⚠️ Budget Alert: ${alert.message}`);
  }

  // Log budget change
  async logBudgetChange(budgetType, amount, requestedBy, status) {
    await this.db.run(`
      INSERT INTO budget_changes (
        budget_type, amount, requested_by, status, changed_at
      ) VALUES (?, ?, ?, ?, ?)
    `, [budgetType, amount, requestedBy, status, new Date().toISOString()]);
  }

  // Get budget status
  async getBudgetStatus() {
    const today = new Date().toISOString().split('T')[0];
    await this.loadCurrentSpend(today);

    return {
      date: today,
      budgets: this.dailyBudgets,
      currentSpend: this.currentSpend,
      remaining: {
        marketing: this.dailyBudgets.marketing - this.currentSpend.marketing,
        enrichment: this.dailyBudgets.enrichment - this.currentSpend.enrichment,
        total: this.dailyBudgets.total - this.currentSpend.total
      },
      utilization: {
        marketing: (this.currentSpend.marketing / this.dailyBudgets.marketing) * 100,
        enrichment: (this.currentSpend.enrichment / this.dailyBudgets.enrichment) * 100,
        total: (this.currentSpend.total / this.dailyBudgets.total) * 100
      }
    };
  }

  // Suggest budget adjustments
  async suggestBudgetAdjustments() {
    const status = await this.getBudgetStatus();
    const suggestions = [];

    // Check if we're consistently over/under budget
    const recentSpend = await this.db.all(`
      SELECT budget_type, AVG(amount) as avg_daily_spend
      FROM budget_spend 
      WHERE spent_at >= date('now', '-7 days')
      GROUP BY budget_type
    `);

    recentSpend.forEach(item => {
      const currentBudget = this.dailyBudgets[item.budget_type];
      const avgSpend = item.avg_daily_spend;
      const utilization = (avgSpend / currentBudget) * 100;

      if (utilization > 90) {
        suggestions.push({
          type: 'increase_budget',
          budget_type: item.budget_type,
          current: currentBudget,
          suggested: Math.ceil(avgSpend * 1.2),
          reason: 'Consistently using 90%+ of budget'
        });
      } else if (utilization < 50) {
        suggestions.push({
          type: 'decrease_budget',
          budget_type: item.budget_type,
          current: currentBudget,
          suggested: Math.ceil(avgSpend * 1.1),
          reason: 'Only using 50% of budget'
        });
      }
    });

    return suggestions;
  }

  // Initialize database tables
  async initializeTables() {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS daily_budgets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        budget_type TEXT NOT NULL,
        amount REAL NOT NULL,
        requested_by TEXT NOT NULL,
        approved_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS budget_spend (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        service TEXT NOT NULL,
        amount REAL NOT NULL,
        description TEXT,
        budget_type TEXT NOT NULL,
        spent_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS budget_confirmations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        budget_type TEXT NOT NULL,
        amount REAL NOT NULL,
        requested_by TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS budget_alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        budget_type TEXT NOT NULL,
        remaining REAL NOT NULL,
        message TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS budget_changes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        budget_type TEXT NOT NULL,
        amount REAL NOT NULL,
        requested_by TEXT NOT NULL,
        status TEXT NOT NULL,
        changed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_daily_budgets_date ON daily_budgets (date);
      CREATE INDEX IF NOT EXISTS idx_budget_spend_date ON budget_spend (spent_at);
      CREATE INDEX IF NOT EXISTS idx_budget_spend_service ON budget_spend (service, spent_at);
    `);
  }
}

module.exports = BudgetManagement;
