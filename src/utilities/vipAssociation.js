// VIP Association System
// Automatically associates everyone from deal pipeline companies with deals and company records

class VIPAssociation {
  constructor(db) {
    this.db = db;
    this.vipThresholds = {
      dealValue: 100000, // $100K+ deals are VIP
      companySize: 1000, // 1000+ employees
      industry: ['CPG', 'Food & Beverage', 'Retail'] // High-value industries
    };
  }

  // Process new deal and associate all company contacts as VIP
  async processDealForVIPAssociation(dealData) {
    try {
      const deal = {
        hubspot_id: dealData.hubspot_id,
        name: dealData.name,
        amount: dealData.amount,
        stage: dealData.stage,
        company_domain: dealData.company_domain,
        close_date: dealData.close_date,
        created_at: new Date().toISOString()
      };

      // Check if deal qualifies for VIP treatment
      const isVIPDeal = this.isVIPDeal(deal);
      
      if (!isVIPDeal) {
        return {
          success: true,
          vip_qualified: false,
          reason: 'Deal does not meet VIP thresholds'
        };
      }

      // Find or create company record
      const company = await this.findOrCreateCompany(deal.company_domain);
      
      // Update deal with company association
      await this.updateDealWithCompany(deal, company.id);

      // Find all contacts from this company domain
      const companyContacts = await this.findCompanyContacts(deal.company_domain);

      // Associate all contacts with the deal
      const associationResults = await this.associateContactsWithDeal(
        companyContacts, 
        deal.hubspot_id, 
        company.id
      );

      // Mark all contacts as VIP
      await this.markContactsAsVIP(companyContacts);

      // Create aggregate signals
      await this.createAggregateSignals(company, deal, companyContacts);

      return {
        success: true,
        vip_qualified: true,
        deal_id: deal.hubspot_id,
        company_id: company.id,
        contacts_associated: associationResults.length,
        aggregate_signals_created: true
      };

    } catch (error) {
      console.error('VIP association failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Check if deal qualifies for VIP treatment
  isVIPDeal(deal) {
    return (
      deal.amount >= this.vipThresholds.dealValue ||
      deal.stage === 'negotiation' ||
      deal.stage === 'proposal' ||
      deal.stage === 'closed-won'
    );
  }

  // Find or create company record
  async findOrCreateCompany(domain) {
    if (!domain) {
      throw new Error('Company domain is required');
    }

    // Try to find existing company
    let company = await this.db.get(`
      SELECT * FROM companies WHERE domain = ?
    `, [domain]);

    if (!company) {
      // Create new company
      const companyId = `comp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      
      await this.db.run(`
        INSERT INTO companies (
          id, domain, name, industry, is_vip, created_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [
        companyId,
        domain,
        this.extractCompanyNameFromDomain(domain),
        'Unknown',
        true, // Mark as VIP since it has a deal
        new Date().toISOString()
      ]);

      company = await this.db.get(`
        SELECT * FROM companies WHERE id = ?
      `, [companyId]);
    } else {
      // Update existing company as VIP
      await this.db.run(`
        UPDATE companies SET is_vip = true, updated_at = ? WHERE id = ?
      `, [new Date().toISOString(), company.id]);
    }

    return company;
  }

  // Extract company name from domain
  extractCompanyNameFromDomain(domain) {
    const parts = domain.split('.');
    const name = parts[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  // Update deal with company association
  async updateDealWithCompany(deal, companyId) {
    await this.db.run(`
      INSERT OR REPLACE INTO deals (
        hubspot_id, name, amount, stage, company_id, close_date, is_vip, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      deal.hubspot_id,
      deal.name,
      deal.amount,
      deal.stage,
      companyId,
      deal.close_date,
      true, // Mark as VIP
      deal.created_at
    ]);
  }

  // Find all contacts from company domain
  async findCompanyContacts(domain) {
    return await this.db.all(`
      SELECT * FROM contacts 
      WHERE company_domain = ? OR email LIKE ?
    `, [domain, `%@${domain}`]);
  }

  // Associate contacts with deal
  async associateContactsWithDeal(contacts, dealId, companyId) {
    const associations = [];

    for (const contact of contacts) {
      // Create deal-contact association
      await this.db.run(`
        INSERT OR IGNORE INTO deal_contacts (
          deal_id, contact_id, company_id, associated_at
        ) VALUES (?, ?, ?, ?)
      `, [dealId, contact.id, companyId, new Date().toISOString()]);

      // Create company-contact association
      await this.db.run(`
        INSERT OR IGNORE INTO company_contacts (
          company_id, contact_id, associated_at
        ) VALUES (?, ?, ?)
      `, [companyId, contact.id, new Date().toISOString()]);

      associations.push({
        contact_id: contact.id,
        deal_id: dealId,
        company_id: companyId
      });
    }

    return associations;
  }

  // Mark contacts as VIP
  async markContactsAsVIP(contacts) {
    for (const contact of contacts) {
      await this.db.run(`
        UPDATE contacts SET is_vip = true, vip_updated_at = ? WHERE id = ?
      `, [new Date().toISOString(), contact.id]);
    }
  }

  // Create aggregate signals for company
  async createAggregateSignals(company, deal, contacts) {
    const signals = {
      company_id: company.id,
      deal_id: deal.hubspot_id,
      total_contacts: contacts.length,
      total_deal_value: deal.amount,
      average_contact_value: deal.amount / contacts.length,
      signal_strength: this.calculateSignalStrength(deal, contacts),
      created_at: new Date().toISOString()
    };

    await this.db.run(`
      INSERT INTO aggregate_signals (
        company_id, deal_id, total_contacts, total_deal_value,
        average_contact_value, signal_strength, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      signals.company_id,
      signals.deal_id,
      signals.total_contacts,
      signals.total_deal_value,
      signals.average_contact_value,
      signals.signal_strength,
      signals.created_at
    ]);

    return signals;
  }

  // Calculate signal strength based on deal and contacts
  calculateSignalStrength(deal, contacts) {
    let strength = 0;

    // Base strength from deal value
    strength += Math.min(deal.amount / 100000, 10); // Max 10 points for deal value

    // Bonus for number of contacts
    strength += Math.min(contacts.length * 0.5, 5); // Max 5 points for contacts

    // Bonus for deal stage
    const stageBonus = {
      'new': 1,
      'qualification': 2,
      'proposal': 3,
      'negotiation': 4,
      'closed-won': 5
    };
    strength += stageBonus[deal.stage] || 0;

    return Math.min(strength, 20); // Max 20 points
  }

  // Get VIP company overview
  async getVIPCompanyOverview(companyId) {
    const company = await this.db.get(`
      SELECT * FROM companies WHERE id = ?
    `, [companyId]);

    if (!company) {
      return null;
    }

    const deals = await this.db.all(`
      SELECT * FROM deals WHERE company_id = ? ORDER BY amount DESC
    `, [companyId]);

    const contacts = await this.db.all(`
      SELECT * FROM contacts WHERE company_domain = ? ORDER BY is_vip DESC, created_at DESC
    `, [company.domain]);

    const aggregateSignals = await this.db.all(`
      SELECT * FROM aggregate_signals WHERE company_id = ? ORDER BY created_at DESC
    `, [companyId]);

    return {
      company,
      deals,
      contacts,
      aggregate_signals: aggregateSignals,
      total_deal_value: deals.reduce((sum, deal) => sum + deal.amount, 0),
      vip_contact_count: contacts.filter(c => c.is_vip).length,
      signal_strength: aggregateSignals[0]?.signal_strength || 0
    };
  }

  // Get all VIP companies
  async getAllVIPCompanies() {
    return await this.db.all(`
      SELECT c.*, 
             COUNT(DISTINCT d.id) as deal_count,
             COUNT(DISTINCT ct.id) as contact_count,
             SUM(d.amount) as total_deal_value,
             AVG(ag.signal_strength) as avg_signal_strength
      FROM companies c
      LEFT JOIN deals d ON c.id = d.company_id
      LEFT JOIN contacts ct ON c.domain = ct.company_domain
      LEFT JOIN aggregate_signals ag ON c.id = ag.company_id
      WHERE c.is_vip = true
      GROUP BY c.id
      ORDER BY total_deal_value DESC
    `);
  }

  // Update VIP status based on new criteria
  async updateVIPStatus() {
    // Find deals that should trigger VIP status
    const qualifyingDeals = await this.db.all(`
      SELECT DISTINCT company_id, SUM(amount) as total_value
      FROM deals 
      WHERE amount >= ? OR stage IN ('negotiation', 'proposal', 'closed-won')
      GROUP BY company_id
      HAVING total_value >= ?
    `, [this.vipThresholds.dealValue, this.vipThresholds.dealValue]);

    for (const deal of qualifyingDeals) {
      const company = await this.db.get(`
        SELECT * FROM companies WHERE id = ?
      `, [deal.company_id]);

      if (company && !company.is_vip) {
        // Mark company as VIP
        await this.db.run(`
          UPDATE companies SET is_vip = true, updated_at = ? WHERE id = ?
        `, [new Date().toISOString(), company.id]);

        // Mark all company contacts as VIP
        await this.db.run(`
          UPDATE contacts SET is_vip = true, vip_updated_at = ? 
          WHERE company_domain = ?
        `, [new Date().toISOString(), company.domain]);

        console.log(`✅ Marked company ${company.name} as VIP (${deal.total_value} total deal value)`);
      }
    }
  }

  // Initialize database tables
  async initializeTables() {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS companies (
        id TEXT PRIMARY KEY,
        domain TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        industry TEXT,
        is_vip BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS deals (
        hubspot_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        amount REAL NOT NULL,
        stage TEXT NOT NULL,
        company_id TEXT,
        close_date DATETIME,
        is_vip BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies (id)
      );

      CREATE TABLE IF NOT EXISTS deal_contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        deal_id TEXT NOT NULL,
        contact_id TEXT NOT NULL,
        company_id TEXT NOT NULL,
        associated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (deal_id) REFERENCES deals (hubspot_id),
        FOREIGN KEY (contact_id) REFERENCES contacts (id),
        FOREIGN KEY (company_id) REFERENCES companies (id)
      );

      CREATE TABLE IF NOT EXISTS company_contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id TEXT NOT NULL,
        contact_id TEXT NOT NULL,
        associated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies (id),
        FOREIGN KEY (contact_id) REFERENCES contacts (id)
      );

      CREATE TABLE IF NOT EXISTS aggregate_signals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id TEXT NOT NULL,
        deal_id TEXT NOT NULL,
        total_contacts INTEGER NOT NULL,
        total_deal_value REAL NOT NULL,
        average_contact_value REAL NOT NULL,
        signal_strength REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies (id),
        FOREIGN KEY (deal_id) REFERENCES deals (hubspot_id)
      );

      CREATE INDEX IF NOT EXISTS idx_companies_vip ON companies (is_vip, domain);
      CREATE INDEX IF NOT EXISTS idx_deals_company ON deals (company_id, amount DESC);
      CREATE INDEX IF NOT EXISTS idx_deal_contacts_deal ON deal_contacts (deal_id);
      CREATE INDEX IF NOT EXISTS idx_company_contacts_company ON company_contacts (company_id);
      CREATE INDEX IF NOT EXISTS idx_aggregate_signals_company ON aggregate_signals (company_id, created_at DESC);
    `);
  }
}

module.exports = VIPAssociation;
