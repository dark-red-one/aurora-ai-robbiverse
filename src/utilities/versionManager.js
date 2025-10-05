// Version Manager - Stable and Testing Environment System
// Manages deployment between stable and testing versions

class VersionManager {
  constructor(db) {
    this.db = db;
    this.environments = {
      stable: {
        name: 'Stable',
        description: 'Production-ready features',
        port: 5055,
        path: '/stable',
        color: '#00C851', // Green
        icon: '✅'
      },
      testing: {
        name: 'Testing',
        description: 'New features under development',
        port: 5056,
        path: '/testing',
        color: '#FFB800', // Yellow
        icon: '🧪'
      }
    };
    
    this.currentEnvironment = 'testing'; // Default to testing for development
    this.featureFlags = new Map();
    this.deploymentHistory = [];
  }

  // Initialize version management
  async initializeVersions() {
    console.log('🚀 Initializing version management...');
    
    // Create version tracking tables
    await this.initializeTables();
    
    // Load feature flags
    await this.loadFeatureFlags();
    
    // Set up environment switcher
    this.setupEnvironmentSwitcher();
    
    console.log('✅ Version management initialized');
  }

  // Get current environment info
  getCurrentEnvironment() {
    return {
      current: this.currentEnvironment,
      environments: this.environments,
      features: this.getEnvironmentFeatures(this.currentEnvironment)
    };
  }

  // Switch environment
  async switchEnvironment(environment) {
    if (!this.environments[environment]) {
      throw new Error(`Invalid environment: ${environment}`);
    }

    const previousEnvironment = this.currentEnvironment;
    this.currentEnvironment = environment;

    // Log environment switch
    await this.logEnvironmentSwitch(previousEnvironment, environment);

    console.log(`🔄 Switched from ${previousEnvironment} to ${environment}`);
    
    return {
      success: true,
      previous: previousEnvironment,
      current: environment,
      features: this.getEnvironmentFeatures(environment)
    };
  }

  // Get features available in environment
  getEnvironmentFeatures(environment) {
    const allFeatures = [
      // Stable features (mature, tested)
      { name: 'chat_data_mining', status: 'stable', version: '1.0.0' },
      { name: 'team_polling_system', status: 'stable', version: '1.0.0' },
      { name: 'location_awareness', status: 'stable', version: '1.0.0' },
      { name: 'boundary_testing', status: 'stable', version: '1.0.0' },
      { name: 'team_member_profiles', status: 'stable', version: '1.0.0' },
      
      // Testing features (new, under development)
      { name: 'brain_tab', status: 'testing', version: '0.9.0' },
      { name: 'budget_management', status: 'testing', version: '0.8.0' },
      { name: 'screenshot_system', status: 'testing', version: '0.7.0' },
      { name: 'vip_association', status: 'testing', version: '0.6.0' },
      { name: 'behavioral_analysis', status: 'testing', version: '0.5.0' },
      { name: 'conflict_detection', status: 'testing', version: '0.4.0' },
      { name: 'natural_sql_system', status: 'testing', version: '0.3.0' },
      
      // Experimental features (very new, may be unstable)
      { name: 'meeting_mining', status: 'experimental', version: '0.1.0' },
      { name: 'token_management', status: 'experimental', version: '0.1.0' }
    ];

    // Return features based on environment
    if (environment === 'stable') {
      return allFeatures.filter(f => f.status === 'stable');
    } else if (environment === 'testing') {
      return allFeatures.filter(f => f.status === 'stable' || f.status === 'testing');
    } else {
      return allFeatures; // All features for development
    }
  }

  // Promote feature from testing to stable
  async promoteFeature(featureName, version) {
    console.log(`📈 Promoting ${featureName} v${version} to stable...`);

    // Check if feature exists and is ready
    const feature = await this.getFeature(featureName);
    if (!feature) {
      throw new Error(`Feature ${featureName} not found`);
    }

    if (feature.status !== 'testing') {
      throw new Error(`Feature ${featureName} is not in testing status`);
    }

    // Run promotion checks
    const promotionChecks = await this.runPromotionChecks(featureName);
    if (!promotionChecks.passed) {
      return {
        success: false,
        reason: 'Promotion checks failed',
        checks: promotionChecks
      };
    }

    // Promote feature
    await this.updateFeatureStatus(featureName, 'stable', version);

    // Log promotion
    await this.logFeaturePromotion(featureName, version);

    console.log(`✅ ${featureName} v${version} promoted to stable`);

    return {
      success: true,
      feature: featureName,
      version: version,
      promoted_at: new Date().toISOString()
    };
  }

  // Run promotion checks
  async runPromotionChecks(featureName) {
    const checks = {
      passed: true,
      results: []
    };

    // Check 1: Feature has been tested
    const testingDuration = await this.getFeatureTestingDuration(featureName);
    const minTestingDays = 2; // Minimum 2 days in testing

    if (testingDuration < minTestingDays) {
      checks.results.push({
        check: 'testing_duration',
        passed: false,
        message: `Feature needs ${minTestingDays - testingDuration} more days in testing`
      });
      checks.passed = false;
    } else {
      checks.results.push({
        check: 'testing_duration',
        passed: true,
        message: `Feature tested for ${testingDuration} days`
      });
    }

    // Check 2: No critical bugs reported
    const criticalBugs = await this.getCriticalBugs(featureName);
    if (criticalBugs.length > 0) {
      checks.results.push({
        check: 'critical_bugs',
        passed: false,
        message: `${criticalBugs.length} critical bugs need fixing`
      });
      checks.passed = false;
    } else {
      checks.results.push({
        check: 'critical_bugs',
        passed: true,
        message: 'No critical bugs reported'
      });
    }

    // Check 3: Allan approval
    const allanApproval = await this.getAllanApproval(featureName);
    if (!allanApproval) {
      checks.results.push({
        check: 'allan_approval',
        passed: false,
        message: 'Waiting for Allan approval'
      });
      checks.passed = false;
    } else {
      checks.results.push({
        check: 'allan_approval',
        passed: true,
        message: 'Allan approved for promotion'
      });
    }

    return checks;
  }

  // Generate environment switcher UI
  generateEnvironmentSwitcherHTML() {
    return `
      <div class="tp-environment-switcher">
        <div class="tp-env-header">
          <h3>🚀 Robbie V3 Environment</h3>
          <div class="tp-current-env" id="currentEnvironment">
            <span class="tp-env-icon">${this.environments[this.currentEnvironment].icon}</span>
            <span class="tp-env-name">${this.environments[this.currentEnvironment].name}</span>
          </div>
        </div>
        
        <div class="tp-env-buttons">
          <button class="tp-env-btn tp-env-stable" onclick="switchEnvironment('stable')">
            <span class="tp-env-icon">✅</span>
            <div class="tp-env-info">
              <div class="tp-env-title">Stable</div>
              <div class="tp-env-desc">Production Ready</div>
            </div>
          </button>
          
          <button class="tp-env-btn tp-env-testing" onclick="switchEnvironment('testing')">
            <span class="tp-env-icon">🧪</span>
            <div class="tp-env-info">
              <div class="tp-env-title">Testing</div>
              <div class="tp-env-desc">New Features</div>
            </div>
          </button>
        </div>
        
        <div class="tp-feature-list" id="featureList">
          <!-- Features will be populated here -->
        </div>
        
        <div class="tp-promotion-panel" id="promotionPanel">
          <h4>🎯 Ready for Promotion</h4>
          <div class="tp-promotion-candidates" id="promotionCandidates">
            <!-- Promotion candidates will be populated here -->
          </div>
        </div>
      </div>
    `;
  }

  // Generate environment switcher CSS
  generateEnvironmentSwitcherCSS() {
    return `
      .tp-environment-switcher {
        background: white;
        border-radius: 1rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        padding: 2rem;
        margin: 1rem 0;
        border: 1px solid #F5F5F5;
      }

      .tp-env-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 2px solid #E5E5E5;
      }

      .tp-env-header h3 {
        margin: 0;
        color: #1A1A1A;
        font-size: 1.5rem;
      }

      .tp-current-env {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        background: #E6F2FF;
        border-radius: 2rem;
        border: 2px solid #0066CC;
      }

      .tp-env-icon {
        font-size: 1.25rem;
      }

      .tp-env-name {
        font-weight: 600;
        color: #0066CC;
      }

      .tp-env-buttons {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        margin-bottom: 2rem;
      }

      .tp-env-btn {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1.5rem;
        border: 2px solid #E5E5E5;
        border-radius: 1rem;
        background: white;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .tp-env-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 15px -3px rgba(0, 0, 0, 0.1);
      }

      .tp-env-btn.tp-env-stable {
        border-color: #00C851;
      }

      .tp-env-btn.tp-env-stable:hover {
        background: #E6F7E6;
        border-color: #00C851;
      }

      .tp-env-btn.tp-env-testing {
        border-color: #FFB800;
      }

      .tp-env-btn.tp-env-testing:hover {
        background: #FFF8E6;
        border-color: #FFB800;
      }

      .tp-env-info {
        flex: 1;
      }

      .tp-env-title {
        font-weight: 600;
        font-size: 1.125rem;
        color: #1A1A1A;
        margin-bottom: 0.25rem;
      }

      .tp-env-desc {
        color: #4A4A4A;
        font-size: 0.875rem;
      }

      .tp-feature-list {
        background: #FAFAFA;
        border-radius: 0.75rem;
        padding: 1.5rem;
        margin-bottom: 2rem;
      }

      .tp-feature-list h4 {
        margin: 0 0 1rem 0;
        color: #1A1A1A;
        font-size: 1.125rem;
      }

      .tp-feature-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1rem;
      }

      .tp-feature-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.75rem 1rem;
        background: white;
        border-radius: 0.5rem;
        border: 1px solid #E5E5E5;
      }

      .tp-feature-name {
        font-weight: 500;
        color: #1A1A1A;
      }

      .tp-feature-version {
        font-size: 0.75rem;
        color: #4A4A4A;
        font-family: monospace;
      }

      .tp-feature-status {
        padding: 0.25rem 0.75rem;
        border-radius: 1rem;
        font-size: 0.75rem;
        font-weight: 500;
      }

      .tp-feature-status.stable {
        background: #E6F7E6;
        color: #00C851;
      }

      .tp-feature-status.testing {
        background: #FFF8E6;
        color: #FFB800;
      }

      .tp-feature-status.experimental {
        background: #FFE6E6;
        color: #FF4444;
      }

      .tp-promotion-panel {
        background: #E6F2FF;
        border-radius: 0.75rem;
        padding: 1.5rem;
        border: 1px solid #B3D9FF;
      }

      .tp-promotion-panel h4 {
        margin: 0 0 1rem 0;
        color: #0066CC;
        font-size: 1.125rem;
      }

      .tp-promotion-candidate {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem;
        background: white;
        border-radius: 0.5rem;
        border: 1px solid #B3D9FF;
        margin-bottom: 0.5rem;
      }

      .tp-promotion-info {
        flex: 1;
      }

      .tp-promotion-name {
        font-weight: 600;
        color: #1A1A1A;
        margin-bottom: 0.25rem;
      }

      .tp-promotion-checks {
        font-size: 0.875rem;
        color: #4A4A4A;
      }

      .tp-promote-btn {
        background: linear-gradient(135deg, #0066CC 0%, #004499 100%);
        color: white;
        border: none;
        border-radius: 0.5rem;
        padding: 0.5rem 1rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .tp-promote-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 6px -1px rgba(0, 102, 204, 0.3);
      }

      .tp-promote-btn:disabled {
        background: #E5E5E5;
        color: #8A8A8A;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
      }
    `;
  }

  // Setup environment switcher
  setupEnvironmentSwitcher() {
    // This would integrate with your web interface
    console.log('🔧 Environment switcher ready');
  }

  // Helper methods
  async getFeature(featureName) {
    return await this.db.get(`
      SELECT * FROM features WHERE name = ?
    `, [featureName]);
  }

  async updateFeatureStatus(featureName, status, version) {
    await this.db.run(`
      UPDATE features SET status = ?, version = ?, updated_at = ? WHERE name = ?
    `, [status, version, new Date().toISOString(), featureName]);
  }

  async getFeatureTestingDuration(featureName) {
    const feature = await this.getFeature(featureName);
    if (!feature) return 0;

    const testingStart = new Date(feature.testing_started_at || feature.created_at);
    const now = new Date();
    const diffTime = Math.abs(now - testingStart);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Days
  }

  async getCriticalBugs(featureName) {
    return await this.db.all(`
      SELECT * FROM bug_reports 
      WHERE feature = ? AND severity = 'critical' AND status = 'open'
    `, [featureName]);
  }

  async getAllanApproval(featureName) {
    const approval = await this.db.get(`
      SELECT * FROM feature_approvals 
      WHERE feature = ? AND approved_by = 'allan' AND status = 'approved'
    `, [featureName]);
    return !!approval;
  }

  async logEnvironmentSwitch(from, to) {
    await this.db.run(`
      INSERT INTO environment_switches (from_env, to_env, switched_at)
      VALUES (?, ?, ?)
    `, [from, to, new Date().toISOString()]);
  }

  async logFeaturePromotion(featureName, version) {
    await this.db.run(`
      INSERT INTO feature_promotions (feature, version, promoted_at)
      VALUES (?, ?, ?)
    `, [featureName, version, new Date().toISOString()]);
  }

  // Initialize database tables
  async initializeTables() {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS features (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        status TEXT NOT NULL,
        version TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        testing_started_at DATETIME
      );

      CREATE TABLE IF NOT EXISTS environment_switches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        from_env TEXT NOT NULL,
        to_env TEXT NOT NULL,
        switched_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS feature_promotions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        feature TEXT NOT NULL,
        version TEXT NOT NULL,
        promoted_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS feature_approvals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        feature TEXT NOT NULL,
        approved_by TEXT NOT NULL,
        status TEXT NOT NULL,
        approved_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS bug_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        feature TEXT NOT NULL,
        severity TEXT NOT NULL,
        status TEXT DEFAULT 'open',
        description TEXT NOT NULL,
        reported_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_features_status ON features (status);
      CREATE INDEX IF NOT EXISTS idx_environment_switches_time ON environment_switches (switched_at DESC);
      CREATE INDEX IF NOT EXISTS idx_feature_promotions_time ON feature_promotions (promoted_at DESC);
    `);
  }

  async loadFeatureFlags() {
    // Load existing features from database
    const features = await this.db.all(`SELECT * FROM features`);
    features.forEach(feature => {
      this.featureFlags.set(feature.name, {
        status: feature.status,
        version: feature.version,
        enabled: feature.status !== 'disabled'
      });
    });
  }
}

module.exports = VersionManager;
