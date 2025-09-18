// Feature Packages System
// Groups and consolidates features into logical packages with streaming updates

class FeaturePackages {
  constructor(db, devTeamManager) {
    this.db = db;
    this.devTeamManager = devTeamManager;
    this.connectionHealth = new ConnectionHealthMonitor();
    
    this.featurePackages = {
      'core_intelligence': {
        id: 'core_intelligence',
        name: 'Core Intelligence System',
        description: 'Fundamental AI capabilities and data processing',
        version: '2.1.0',
        status: 'stable',
        priority: 1,
        features: [
          'chat_data_mining',
          'behavioral_analysis',
          'natural_sql_system',
          'conflict_detection'
        ],
        frontend_components: ['brain_tab', 'query_interface'],
        backend_services: ['data_miner', 'sql_processor', 'behavior_analyzer'],
        dependencies: ['database', 'llm_services'],
        estimated_completion: '95%'
      },
      
      'team_collaboration': {
        id: 'team_collaboration',
        name: 'Team Collaboration Suite',
        description: 'Tools for team communication and coordination',
        version: '1.8.0',
        status: 'stable',
        priority: 2,
        features: [
          'team_polling_system',
          'location_awareness',
          'team_member_profiles',
          'huddle_room'
        ],
        frontend_components: ['polling_ui', 'location_display', 'huddle_interface'],
        backend_services: ['poll_manager', 'location_tracker', 'profile_manager'],
        dependencies: ['websockets', 'authentication'],
        estimated_completion: '88%'
      },
      
      'business_intelligence': {
        id: 'business_intelligence',
        name: 'Business Intelligence & VIP Management',
        description: 'Revenue tracking, deal management, and VIP workflows',
        version: '1.5.0',
        status: 'testing',
        priority: 3,
        features: [
          'vip_association',
          'budget_management',
          'meeting_mining',
          'revenue_tracking'
        ],
        frontend_components: ['vip_dashboard', 'budget_controls', 'revenue_charts'],
        backend_services: ['vip_processor', 'budget_tracker', 'meeting_analyzer'],
        dependencies: ['hubspot_api', 'fireflies_api', 'financial_data'],
        estimated_completion: '72%'
      },
      
      'security_system': {
        id: 'security_system',
        name: 'Security & Access Control',
        description: 'Authentication, authorization, and data protection',
        version: '1.3.0',
        status: 'testing',
        priority: 4,
        features: [
          'boundary_testing',
          'redaction_system',
          'pin_security',
          'role_based_access'
        ],
        frontend_components: ['login_interface', 'security_controls'],
        backend_services: ['auth_manager', 'redactor', 'access_controller'],
        dependencies: ['encryption', 'session_management'],
        estimated_completion: '65%'
      },
      
      'documentation_system': {
        id: 'documentation_system',
        name: 'Documentation & Screenshot System',
        description: 'Capture, redact, and share system interactions',
        version: '1.1.0',
        status: 'testing',
        priority: 5,
        features: [
          'screenshot_system',
          'metadata_stripping',
          'social_sharing',
          'journey_documentation'
        ],
        frontend_components: ['screenshot_ui', 'sharing_controls'],
        backend_services: ['screenshot_processor', 'metadata_stripper', 'redactor'],
        dependencies: ['imagemagick', 'cloud_storage'],
        estimated_completion: '58%'
      },
      
      'personality_system_3_0': {
        id: 'personality_system_3_0',
        name: 'Personality System 3.0',
        description: 'Advanced AI personality and behavioral adaptation',
        version: '3.0.0',
        status: 'experimental',
        priority: 6,
        features: [
          'robbie_f_personality',
          'character_filter',
          'mood_system',
          'adaptive_responses'
        ],
        frontend_components: ['personality_interface', 'mood_display', 'character_settings'],
        backend_services: ['personality_engine', 'character_processor', 'mood_analyzer'],
        dependencies: ['llm_services', 'behavioral_data'],
        estimated_completion: '45%',
        needs_split: true // Flagged for frontend/backend split
      }
    };
    
    this.streamingConnections = new Map();
    this.updateQueue = [];
  }

  // Initialize feature packages system
  async initializePackages() {
    console.log('📦 Initializing Feature Packages system...');
    
    await this.initializeTables();
    await this.loadPackagesFromDB();
    await this.startStreamingUpdates();
    await this.connectionHealth.initialize();
    
    // Notify Dev Team Manager
    await this.devTeamManager.notifySystemInitialization(this.featurePackages);
    
    console.log('✅ Feature Packages system initialized');
  }

  // Process Allan's feedback
  async processFeedback(packageId, feedback) {
    console.log(`📝 Processing feedback for ${packageId}: ${feedback}`);
    
    const package_ = this.featurePackages[packageId];
    if (!package_) {
      throw new Error(`Package ${packageId} not found`);
    }

    // Parse feedback using natural language processing
    const parsedFeedback = this.parseFeedback(feedback, package_);
    
    // Apply changes based on feedback
    const changes = await this.applyFeedbackChanges(packageId, parsedFeedback);
    
    // Stream updates to UI
    await this.streamPackageUpdate(packageId, changes);
    
    // Notify Dev Team Manager
    await this.devTeamManager.processFeedback(packageId, feedback, changes);
    
    return {
      success: true,
      package_id: packageId,
      changes: changes,
      estimated_completion_change: changes.completion_change || 0
    };
  }

  // Parse Allan's feedback
  parseFeedback(feedback, package_) {
    const feedbackLower = feedback.toLowerCase();
    const parsed = {
      action: null,
      target: null,
      details: {},
      priority_change: null,
      status_change: null
    };

    // Split operations
    if (feedbackLower.includes('split') && feedbackLower.includes('front') && feedbackLower.includes('back')) {
      parsed.action = 'split_frontend_backend';
      parsed.target = package_.id;
      parsed.details = {
        reason: 'Allan requested frontend/backend separation',
        new_packages: [
          `${package_.id}_frontend`,
          `${package_.id}_backend`
        ]
      };
    }

    // Merge operations
    if (feedbackLower.includes('merge') || feedbackLower.includes('combine')) {
      parsed.action = 'merge_packages';
    }

    // Priority changes
    if (feedbackLower.includes('high priority') || feedbackLower.includes('urgent')) {
      parsed.priority_change = 'increase';
    } else if (feedbackLower.includes('low priority') || feedbackLower.includes('later')) {
      parsed.priority_change = 'decrease';
    }

    // Status changes
    if (feedbackLower.includes('promote') || feedbackLower.includes('stable')) {
      parsed.status_change = 'promote';
    } else if (feedbackLower.includes('demote') || feedbackLower.includes('testing')) {
      parsed.status_change = 'demote';
    }

    // Feature additions/removals
    if (feedbackLower.includes('add feature')) {
      parsed.action = 'add_feature';
    } else if (feedbackLower.includes('remove feature')) {
      parsed.action = 'remove_feature';
    }

    return parsed;
  }

  // Apply feedback changes
  async applyFeedbackChanges(packageId, parsedFeedback) {
    const changes = {
      type: parsedFeedback.action,
      timestamp: new Date().toISOString(),
      changes_made: []
    };

    switch (parsedFeedback.action) {
      case 'split_frontend_backend':
        changes.changes_made = await this.splitPackage(packageId);
        break;
        
      case 'merge_packages':
        changes.changes_made = await this.mergePackages(parsedFeedback.details);
        break;
        
      default:
        changes.changes_made = await this.applyGeneralChanges(packageId, parsedFeedback);
    }

    // Update package in database
    await this.updatePackageInDB(packageId, changes);

    return changes;
  }

  // Split package into frontend and backend
  async splitPackage(packageId) {
    const originalPackage = this.featurePackages[packageId];
    const changes = [];

    // Create frontend package
    const frontendPackage = {
      id: `${packageId}_frontend`,
      name: `${originalPackage.name} - Frontend`,
      description: `Frontend components for ${originalPackage.description}`,
      version: `${originalPackage.version}-fe`,
      status: originalPackage.status,
      priority: originalPackage.priority,
      features: originalPackage.frontend_components || [],
      frontend_components: originalPackage.frontend_components || [],
      backend_services: [],
      dependencies: ['api_client', 'ui_framework'],
      estimated_completion: Math.max(originalPackage.estimated_completion - 20, 0) + '%'
    };

    // Create backend package
    const backendPackage = {
      id: `${packageId}_backend`,
      name: `${originalPackage.name} - Backend`,
      description: `Backend services for ${originalPackage.description}`,
      version: `${originalPackage.version}-be`,
      status: originalPackage.status,
      priority: originalPackage.priority + 1, // Backend slightly lower priority
      features: originalPackage.backend_services || [],
      frontend_components: [],
      backend_services: originalPackage.backend_services || [],
      dependencies: originalPackage.dependencies || [],
      estimated_completion: Math.max(originalPackage.estimated_completion - 15, 0) + '%'
    };

    // Add new packages
    this.featurePackages[frontendPackage.id] = frontendPackage;
    this.featurePackages[backendPackage.id] = backendPackage;

    // Mark original as deprecated
    originalPackage.status = 'deprecated';
    originalPackage.split_into = [frontendPackage.id, backendPackage.id];

    changes.push({
      type: 'package_created',
      package: frontendPackage.id,
      description: 'Created frontend package'
    });

    changes.push({
      type: 'package_created',
      package: backendPackage.id,
      description: 'Created backend package'
    });

    changes.push({
      type: 'package_deprecated',
      package: packageId,
      description: 'Original package deprecated after split'
    });

    return changes;
  }

  // Generate Feature Packages UI
  generateFeaturePackagesHTML() {
    return `
      <div class="tp-feature-packages">
        <div class="tp-packages-header">
          <h2>📦 Feature Packages</h2>
          <div class="tp-connection-health" id="connectionHealth">
            ${this.connectionHealth.generateHealthIndicators()}
          </div>
        </div>

        <div class="tp-packages-grid" id="packagesGrid">
          ${Object.values(this.featurePackages)
            .filter(pkg => pkg.status !== 'deprecated')
            .map(pkg => this.generatePackageCard(pkg))
            .join('')}
        </div>

        <div class="tp-feedback-panel">
          <h3>💬 Package Feedback</h3>
          <div class="tp-feedback-form">
            <select id="feedbackPackage">
              <option value="">Select Package...</option>
              ${Object.values(this.featurePackages)
                .filter(pkg => pkg.status !== 'deprecated')
                .map(pkg => `<option value="${pkg.id}">${pkg.name}</option>`)
                .join('')}
            </select>
            <textarea id="feedbackText" placeholder="Enter your feedback... (e.g., 'Split personality system 3.0 into front and back ends')"></textarea>
            <button onclick="submitPackageFeedback()" class="tp-btn-primary">Submit Feedback</button>
          </div>
        </div>

        <div class="tp-dev-team-updates" id="devTeamUpdates">
          <h3>👨‍💻 Dev Team Updates</h3>
          <div class="tp-updates-stream" id="updatesStream">
            <!-- Updates will stream here -->
          </div>
        </div>
      </div>
    `;
  }

  // Generate individual package card
  generatePackageCard(package_) {
    const statusColor = {
      'stable': '#00C851',
      'testing': '#FFB800',
      'experimental': '#FF4444',
      'deprecated': '#8A8A8A'
    }[package_.status];

    return `
      <div class="tp-package-card" data-package="${package_.id}">
        <div class="tp-package-header">
          <div class="tp-package-title">
            <h3>${package_.name}</h3>
            <span class="tp-package-version">v${package_.version}</span>
          </div>
          <div class="tp-package-status" style="background: ${statusColor}">
            ${package_.status}
          </div>
        </div>

        <div class="tp-package-description">
          ${package_.description}
        </div>

        <div class="tp-package-progress">
          <div class="tp-progress-bar">
            <div class="tp-progress-fill" style="width: ${package_.estimated_completion}"></div>
          </div>
          <span class="tp-progress-text">${package_.estimated_completion} complete</span>
        </div>

        <div class="tp-package-features">
          <div class="tp-feature-count">
            ${package_.features.length} features
          </div>
          <div class="tp-component-breakdown">
            <span class="tp-frontend-count">${package_.frontend_components?.length || 0} FE</span>
            <span class="tp-backend-count">${package_.backend_services?.length || 0} BE</span>
          </div>
        </div>

        <div class="tp-package-actions">
          <button onclick="promotePackage('${package_.id}')" class="tp-btn-promote" ${package_.status === 'stable' ? 'disabled' : ''}>
            📈 Promote
          </button>
          <button onclick="demotePackage('${package_.id}')" class="tp-btn-demote" ${package_.status === 'experimental' ? 'disabled' : ''}>
            📉 Demote
          </button>
          <button onclick="viewPackageDetails('${package_.id}')" class="tp-btn-details">
            📋 Details
          </button>
        </div>
      </div>
    `;
  }

  // Stream package updates to UI
  async streamPackageUpdate(packageId, changes) {
    const updateData = {
      type: 'package_update',
      package_id: packageId,
      changes: changes,
      timestamp: new Date().toISOString()
    };

    // Add to update queue
    this.updateQueue.push(updateData);

    // Broadcast to all connected clients
    this.broadcastUpdate(updateData);

    console.log(`📡 Streamed update for package ${packageId}`);
  }

  // Start streaming updates
  async startStreamingUpdates() {
    // Set up WebSocket for real-time updates
    setInterval(() => {
      if (this.updateQueue.length > 0) {
        const updates = this.updateQueue.splice(0, 10); // Process up to 10 updates
        updates.forEach(update => this.broadcastUpdate(update));
      }
    }, 1000); // Stream updates every second

    console.log('🔄 Started streaming updates');
  }

  // Broadcast update to connected clients
  broadcastUpdate(updateData) {
    // This would integrate with your WebSocket system
    console.log('📡 Broadcasting update:', updateData.type);
  }

  // Initialize database tables
  async initializeTables() {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS feature_packages (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        version TEXT NOT NULL,
        status TEXT NOT NULL,
        priority INTEGER NOT NULL,
        features TEXT NOT NULL,
        frontend_components TEXT,
        backend_services TEXT,
        dependencies TEXT,
        estimated_completion TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS package_feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        package_id TEXT NOT NULL,
        feedback TEXT NOT NULL,
        parsed_feedback TEXT,
        changes_applied TEXT,
        submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (package_id) REFERENCES feature_packages (id)
      );

      CREATE TABLE IF NOT EXISTS package_changes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        package_id TEXT NOT NULL,
        change_type TEXT NOT NULL,
        changes_made TEXT NOT NULL,
        triggered_by TEXT,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (package_id) REFERENCES feature_packages (id)
      );

      CREATE INDEX IF NOT EXISTS idx_feature_packages_status ON feature_packages (status, priority);
      CREATE INDEX IF NOT EXISTS idx_package_feedback_package ON package_feedback (package_id, submitted_at DESC);
      CREATE INDEX IF NOT EXISTS idx_package_changes_package ON package_changes (package_id, applied_at DESC);
    `);
  }
}

// Connection Health Monitor
class ConnectionHealthMonitor {
  constructor() {
    this.metrics = {
      bandwidth_usage: 0,
      system_load: 0,
      connection_count: 0,
      latency: 0,
      error_rate: 0
    };
    
    this.thresholds = {
      bandwidth_warning: 80, // 80% of max
      system_load_warning: 75,
      latency_warning: 1000, // 1 second
      error_rate_warning: 5 // 5%
    };
  }

  async initialize() {
    // Start monitoring
    setInterval(() => this.updateMetrics(), 5000); // Update every 5 seconds
  }

  updateMetrics() {
    // Mock metrics - in production, these would be real measurements
    this.metrics = {
      bandwidth_usage: Math.random() * 100,
      system_load: Math.random() * 100,
      connection_count: Math.floor(Math.random() * 50) + 1,
      latency: Math.random() * 2000,
      error_rate: Math.random() * 10
    };
  }

  generateHealthIndicators() {
    return `
      <div class="tp-health-indicators">
        <div class="tp-health-item ${this.getHealthStatus('bandwidth')}">
          <span class="tp-health-icon">📊</span>
          <span class="tp-health-value">${Math.round(this.metrics.bandwidth_usage)}%</span>
        </div>
        <div class="tp-health-item ${this.getHealthStatus('system')}">
          <span class="tp-health-icon">💻</span>
          <span class="tp-health-value">${Math.round(this.metrics.system_load)}%</span>
        </div>
        <div class="tp-health-item ${this.getHealthStatus('latency')}">
          <span class="tp-health-icon">⚡</span>
          <span class="tp-health-value">${Math.round(this.metrics.latency)}ms</span>
        </div>
        <div class="tp-health-item">
          <span class="tp-health-icon">🔗</span>
          <span class="tp-health-value">${this.metrics.connection_count}</span>
        </div>
      </div>
    `;
  }

  getHealthStatus(metric) {
    switch (metric) {
      case 'bandwidth':
        return this.metrics.bandwidth_usage > this.thresholds.bandwidth_warning ? 'warning' : 'healthy';
      case 'system':
        return this.metrics.system_load > this.thresholds.system_load_warning ? 'warning' : 'healthy';
      case 'latency':
        return this.metrics.latency > this.thresholds.latency_warning ? 'warning' : 'healthy';
      default:
        return 'healthy';
    }
  }
}

module.exports = FeaturePackages;
