// Connection Fitness Dashboard
// Real-time API status, data transmission, and compute cost monitoring

class ConnectionFitnessDashboard {
  constructor(db) {
    this.db = db;
    
    this.apiConnections = {
      'hubspot': {
        name: 'HubSpot CRM',
        endpoint: 'https://api.hubapi.com',
        status: 'connected',
        last_sync: new Date().toISOString(),
        rate_limit: '1000/hour',
        current_usage: 45,
        bytes_transmitted_today: 0,
        tokens_used_today: 0,
        cost_per_request: 0, // Free tier
        emoji: '🏢'
      },
      
      'gmail': {
        name: 'Gmail API',
        endpoint: 'https://gmail.googleapis.com',
        status: 'connected',
        last_sync: new Date().toISOString(),
        rate_limit: '1000000000/day',
        current_usage: 127,
        bytes_transmitted_today: 0,
        tokens_used_today: 0,
        cost_per_request: 0, // Free tier
        emoji: '📧'
      },
      
      'fireflies': {
        name: 'Fireflies.ai',
        endpoint: 'https://api.fireflies.ai',
        status: 'connected',
        last_sync: new Date().toISOString(),
        rate_limit: '100/hour',
        current_usage: 8,
        bytes_transmitted_today: 0,
        tokens_used_today: 0,
        cost_per_request: 0, // Included in subscription
        emoji: '🎙️'
      },
      
      'clay': {
        name: 'Clay Enrichment',
        endpoint: 'https://api.clay.com',
        status: 'connected',
        last_sync: new Date().toISOString(),
        rate_limit: '1000/day',
        current_usage: 12,
        bytes_transmitted_today: 0,
        tokens_used_today: 0,
        cost_per_request: 2.00, // $2 per enrichment
        emoji: '💎'
      },
      
      'apollo': {
        name: 'Apollo.io',
        endpoint: 'https://api.apollo.io',
        status: 'connected',
        last_sync: new Date().toISOString(),
        rate_limit: '200/hour',
        current_usage: 3,
        bytes_transmitted_today: 0,
        tokens_used_today: 0,
        cost_per_request: 1.50, // $1.50 per enrichment
        emoji: '🚀'
      },
      
      'slack': {
        name: 'Slack API',
        endpoint: 'https://slack.com/api',
        status: 'connected',
        last_sync: new Date().toISOString(),
        rate_limit: 'tier_4',
        current_usage: 234,
        bytes_transmitted_today: 0,
        tokens_used_today: 0,
        cost_per_request: 0, // Free tier
        emoji: '💬'
      },
      
      'openai': {
        name: 'OpenAI GPT-4',
        endpoint: 'https://api.openai.com',
        status: 'connected',
        last_sync: new Date().toISOString(),
        rate_limit: '10000/minute',
        current_usage: 156,
        bytes_transmitted_today: 0,
        tokens_used_today: 15420,
        cost_per_request: 0.00003, // Per token
        emoji: '🤖'
      },
      
      'anthropic': {
        name: 'Claude API',
        endpoint: 'https://api.anthropic.com',
        status: 'connected',
        last_sync: new Date().toISOString(),
        rate_limit: '5000/minute',
        current_usage: 89,
        bytes_transmitted_today: 0,
        tokens_used_today: 12340,
        cost_per_request: 0.000015, // Per token
        emoji: '🧠'
      },
      
      'ollama_local': {
        name: 'Local LLM (Ollama)',
        endpoint: 'http://localhost:11434',
        status: 'connected',
        last_sync: new Date().toISOString(),
        rate_limit: 'unlimited',
        current_usage: 67,
        bytes_transmitted_today: 0,
        tokens_used_today: 8900,
        cost_per_request: 0, // Free local compute
        emoji: '🏠'
      }
    };

    this.computeCosts = {
      'local_compute': {
        cpu_usage: 0,
        memory_usage: 0,
        gpu_usage: 0,
        estimated_hourly_cost: 0.15, // $0.15/hour for local compute
        daily_cost: 0,
        monthly_projection: 0
      },
      
      'cloud_apis': {
        openai_cost_today: 0,
        anthropic_cost_today: 0,
        total_api_cost_today: 0,
        monthly_projection: 0
      },
      
      'opportunity_costs': {
        allan_time_spent: 0, // Hours spent on Robbie today
        allan_hourly_value: 250, // Allan's time value
        opportunity_cost_today: 0,
        productivity_gained: 0 // Time saved by Robbie
      }
    };

    this.statusColors = {
      'connected': '#00C851',    // Green
      'warning': '#FFB800',      // Yellow  
      'error': '#FF4444',        // Red
      'unknown': '#8A8A8A'       // Gray
    };
  }

  // Generate connection fitness dashboard HTML
  generateDashboardHTML() {
    return `
      <div class="tp-connection-dashboard">
        <div class="tp-dashboard-header">
          <h2>🔗 Connection Fitness Dashboard</h2>
          <div class="tp-overall-status">
            <span class="tp-status-indicator ${this.getOverallStatus()}">${this.getOverallStatusText()}</span>
            <span class="tp-total-cost">💰 ${this.getTotalDailyCost()}/day</span>
          </div>
        </div>

        <div class="tp-api-grid">
          ${Object.entries(this.apiConnections).map(([apiId, api]) => 
            this.generateAPICard(apiId, api)
          ).join('')}
        </div>

        <div class="tp-cost-breakdown">
          <div class="tp-cost-section">
            <h3>💻 Compute Costs</h3>
            <div class="tp-cost-grid">
              <div class="tp-cost-item">
                <span class="tp-cost-label">Local Compute:</span>
                <span class="tp-cost-value">$${this.computeCosts.local_compute.estimated_hourly_cost}/hour</span>
              </div>
              <div class="tp-cost-item">
                <span class="tp-cost-label">API Calls:</span>
                <span class="tp-cost-value">$${this.computeCosts.cloud_apis.total_api_cost_today.toFixed(2)}/day</span>
              </div>
              <div class="tp-cost-item">
                <span class="tp-cost-label">Allan's Time:</span>
                <span class="tp-cost-value">${this.computeCosts.opportunity_costs.allan_time_spent}h × $${this.computeCosts.opportunity_costs.allan_hourly_value}/h</span>
              </div>
              <div class="tp-cost-item">
                <span class="tp-cost-label">Opportunity Cost:</span>
                <span class="tp-cost-value">$${this.computeCosts.opportunity_costs.opportunity_cost_today}</span>
              </div>
            </div>
          </div>

          <div class="tp-productivity-section">
            <h3>⚡ Productivity Impact</h3>
            <div class="tp-productivity-metrics">
              <div class="tp-metric-item">
                <span class="tp-metric-label">Time Saved:</span>
                <span class="tp-metric-value">${this.computeCosts.opportunity_costs.productivity_gained}h</span>
              </div>
              <div class="tp-metric-item">
                <span class="tp-metric-label">Net Value:</span>
                <span class="tp-metric-value ${this.getNetValueClass()}">
                  ${this.calculateNetValue()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="tp-transmission-stats">
          <h3>📊 Data Transmission Today</h3>
          <div class="tp-transmission-grid">
            ${this.generateTransmissionStats()}
          </div>
        </div>
      </div>
    `;
  }

  // Generate individual API card
  generateAPICard(apiId, api) {
    const statusColor = this.statusColors[api.status] || this.statusColors.unknown;
    const usagePercentage = this.calculateUsagePercentage(api);
    
    return `
      <div class="tp-api-card" data-api="${apiId}">
        <div class="tp-api-header">
          <span class="tp-api-emoji">${api.emoji}</span>
          <div class="tp-api-info">
            <span class="tp-api-name">${api.name}</span>
            <span class="tp-api-endpoint">${api.endpoint}</span>
          </div>
          <div class="tp-api-status" style="background-color: ${statusColor}">
            ${api.status}
          </div>
        </div>

        <div class="tp-api-metrics">
          <div class="tp-metric-row">
            <span class="tp-metric-label">Usage:</span>
            <span class="tp-metric-value">${api.current_usage}/${api.rate_limit}</span>
            <div class="tp-usage-bar">
              <div class="tp-usage-fill" style="width: ${usagePercentage}%; background-color: ${this.getUsageColor(usagePercentage)}"></div>
            </div>
          </div>

          <div class="tp-metric-row">
            <span class="tp-metric-label">Bytes Today:</span>
            <span class="tp-metric-value">${this.formatBytes(api.bytes_transmitted_today)}</span>
          </div>

          <div class="tp-metric-row">
            <span class="tp-metric-label">Tokens Today:</span>
            <span class="tp-metric-value">${api.tokens_used_today.toLocaleString()}</span>
          </div>

          <div class="tp-metric-row">
            <span class="tp-metric-label">Cost Today:</span>
            <span class="tp-metric-value">$${this.calculateAPICost(api).toFixed(4)}</span>
          </div>
        </div>

        <div class="tp-api-last-sync">
          Last sync: ${this.formatLastSync(api.last_sync)}
        </div>
      </div>
    `;
  }

  // Calculate actual costs
  calculateAPICost(api) {
    if (api.cost_per_request === 0) return 0;
    
    // For token-based pricing
    if (api.tokens_used_today > 0) {
      return api.tokens_used_today * api.cost_per_request;
    }
    
    // For request-based pricing
    return api.current_usage * api.cost_per_request;
  }

  // Calculate total daily cost
  getTotalDailyCost() {
    const apiCosts = Object.values(this.apiConnections)
      .reduce((total, api) => total + this.calculateAPICost(api), 0);
    
    const computeCost = this.computeCosts.local_compute.estimated_hourly_cost * 24;
    const opportunityCost = this.computeCosts.opportunity_costs.opportunity_cost_today;
    
    const totalCost = apiCosts + computeCost + opportunityCost;
    return totalCost.toFixed(2);
  }

  // Calculate net value (productivity gained vs costs)
  calculateNetValue() {
    const totalCosts = parseFloat(this.getTotalDailyCost());
    const productivityValue = this.computeCosts.opportunity_costs.productivity_gained * 
                             this.computeCosts.opportunity_costs.allan_hourly_value;
    
    const netValue = productivityValue - totalCosts;
    return netValue >= 0 ? `+$${netValue.toFixed(2)}` : `-$${Math.abs(netValue).toFixed(2)}`;
  }

  // Get net value CSS class
  getNetValueClass() {
    const netValue = this.calculateNetValue();
    return netValue.startsWith('+') ? 'tp-positive' : 'tp-negative';
  }

  // Update real-time metrics
  async updateRealTimeMetrics() {
    // Update API usage
    for (const [apiId, api] of Object.entries(this.apiConnections)) {
      await this.updateAPIMetrics(apiId, api);
    }
    
    // Update compute costs
    await this.updateComputeCosts();
    
    // Update opportunity costs
    await this.updateOpportunityCosts();
    
    // Store metrics snapshot
    await this.storeMetricsSnapshot();
  }

  // Update API metrics
  async updateAPIMetrics(apiId, api) {
    try {
      // Mock API health check - in production would ping actual APIs
      const healthCheck = await this.performAPIHealthCheck(apiId);
      
      api.status = healthCheck.status;
      api.response_time = healthCheck.response_time;
      api.last_sync = new Date().toISOString();
      
      // Update usage from actual API if available
      if (healthCheck.current_usage !== undefined) {
        api.current_usage = healthCheck.current_usage;
      }
      
    } catch (error) {
      api.status = 'error';
      console.error(`❌ API health check failed for ${apiId}:`, error.message);
    }
  }

  // Perform API health check
  async performAPIHealthCheck(apiId) {
    // Mock health check - replace with actual API pings
    const mockHealthChecks = {
      'hubspot': { status: 'connected', response_time: 245, current_usage: 45 },
      'gmail': { status: 'connected', response_time: 180, current_usage: 127 },
      'fireflies': { status: 'warning', response_time: 890, current_usage: 8 },
      'clay': { status: 'connected', response_time: 320, current_usage: 12 },
      'apollo': { status: 'connected', response_time: 410, current_usage: 3 },
      'slack': { status: 'connected', response_time: 150, current_usage: 234 },
      'openai': { status: 'connected', response_time: 1200, current_usage: 156 },
      'anthropic': { status: 'connected', response_time: 980, current_usage: 89 },
      'ollama_local': { status: 'connected', response_time: 45, current_usage: 67 }
    };

    return mockHealthChecks[apiId] || { status: 'unknown', response_time: 999 };
  }

  // Update compute costs
  async updateComputeCosts() {
    // Get actual system metrics
    const systemMetrics = await this.getSystemMetrics();
    
    this.computeCosts.local_compute = {
      cpu_usage: systemMetrics.cpu_usage,
      memory_usage: systemMetrics.memory_usage,
      gpu_usage: systemMetrics.gpu_usage,
      estimated_hourly_cost: this.calculateComputeHourlyCost(systemMetrics),
      daily_cost: this.calculateComputeHourlyCost(systemMetrics) * 24,
      monthly_projection: this.calculateComputeHourlyCost(systemMetrics) * 24 * 30
    };
  }

  // Get system metrics
  async getSystemMetrics() {
    try {
      // Try to get real system metrics
      const { execAsync } = require('child_process');
      const { promisify } = require('util');
      const exec = promisify(execAsync);
      
      // Get CPU usage
      const cpuResult = await exec("top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | cut -d'%' -f1");
      const cpuUsage = parseFloat(cpuResult.stdout) || 0;
      
      // Get memory usage
      const memResult = await exec("free | grep Mem | awk '{printf \"%.1f\", $3/$2 * 100.0}'");
      const memUsage = parseFloat(memResult.stdout) || 0;
      
      // Get GPU usage (if available)
      let gpuUsage = 0;
      try {
        const gpuResult = await exec("nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader,nounits");
        gpuUsage = parseFloat(gpuResult.stdout) || 0;
      } catch (error) {
        // GPU not available or nvidia-smi not found
        gpuUsage = 0;
      }

      return {
        cpu_usage: cpuUsage,
        memory_usage: memUsage,
        gpu_usage: gpuUsage,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      // Fallback to mock metrics
      return {
        cpu_usage: Math.random() * 100,
        memory_usage: Math.random() * 100,
        gpu_usage: Math.random() * 100,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Calculate compute hourly cost
  calculateComputeHourlyCost(metrics) {
    // Base cost for running the system
    let hourlyCost = 0.05; // $0.05 base
    
    // Add CPU cost
    hourlyCost += (metrics.cpu_usage / 100) * 0.08; // $0.08/hour at 100% CPU
    
    // Add memory cost
    hourlyCost += (metrics.memory_usage / 100) * 0.04; // $0.04/hour at 100% memory
    
    // Add GPU cost (if using)
    if (metrics.gpu_usage > 0) {
      hourlyCost += (metrics.gpu_usage / 100) * 0.25; // $0.25/hour at 100% GPU
    }

    return hourlyCost;
  }

  // Generate transmission stats
  generateTransmissionStats() {
    const totalBytes = Object.values(this.apiConnections)
      .reduce((total, api) => total + api.bytes_transmitted_today, 0);
    
    const totalTokens = Object.values(this.apiConnections)
      .reduce((total, api) => total + api.tokens_used_today, 0);

    return `
      <div class="tp-transmission-item">
        <span class="tp-transmission-label">Total Bytes:</span>
        <span class="tp-transmission-value">${this.formatBytes(totalBytes)}</span>
      </div>
      <div class="tp-transmission-item">
        <span class="tp-transmission-label">Total Tokens:</span>
        <span class="tp-transmission-value">${totalTokens.toLocaleString()}</span>
      </div>
      <div class="tp-transmission-item">
        <span class="tp-transmission-label">API Calls:</span>
        <span class="tp-transmission-value">${this.getTotalAPICalls()}</span>
      </div>
      <div class="tp-transmission-item">
        <span class="tp-transmission-label">Sync Operations:</span>
        <span class="tp-transmission-value">${this.getTotalSyncOps()}</span>
      </div>
    `;
  }

  // Helper methods
  calculateUsagePercentage(api) {
    if (api.rate_limit === 'unlimited') return 0;
    
    const limit = this.parseRateLimit(api.rate_limit);
    return Math.min((api.current_usage / limit) * 100, 100);
  }

  parseRateLimit(rateLimitString) {
    const match = rateLimitString.match(/(\d+)/);
    return match ? parseInt(match[1]) : 1000;
  }

  getUsageColor(percentage) {
    if (percentage >= 90) return '#FF4444'; // Red
    if (percentage >= 70) return '#FFB800'; // Yellow
    return '#00C851'; // Green
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatLastSync(timestamp) {
    const now = new Date();
    const syncTime = new Date(timestamp);
    const diffMinutes = Math.floor((now - syncTime) / 60000);
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours}h ago`;
  }

  getOverallStatus() {
    const connectedCount = Object.values(this.apiConnections)
      .filter(api => api.status === 'connected').length;
    const totalCount = Object.keys(this.apiConnections).length;
    
    const percentage = (connectedCount / totalCount) * 100;
    
    if (percentage >= 90) return 'connected';
    if (percentage >= 70) return 'warning';
    return 'error';
  }

  getOverallStatusText() {
    const status = this.getOverallStatus();
    const statusTexts = {
      'connected': 'All Systems Operational',
      'warning': 'Some Issues Detected', 
      'error': 'Multiple Connection Issues'
    };
    return statusTexts[status];
  }

  getTotalAPICalls() {
    return Object.values(this.apiConnections)
      .reduce((total, api) => total + api.current_usage, 0);
  }

  getTotalSyncOps() {
    // Mock sync operations count
    return 47;
  }

  // Update opportunity costs
  async updateOpportunityCosts() {
    // Calculate Allan's time spent on Robbie today
    const allanInteractions = await this.db.all(`
      SELECT COUNT(*) as count, 
             SUM(LENGTH(content)) as total_chars
      FROM interactions 
      WHERE user_id = 'allan' 
        AND DATE(timestamp) = DATE('now')
    `);

    const interactionCount = allanInteractions[0]?.count || 0;
    const avgTimePerInteraction = 2; // 2 minutes average
    const allanTimeSpent = (interactionCount * avgTimePerInteraction) / 60; // Convert to hours

    this.computeCosts.opportunity_costs.allan_time_spent = allanTimeSpent;
    this.computeCosts.opportunity_costs.opportunity_cost_today = 
      allanTimeSpent * this.computeCosts.opportunity_costs.allan_hourly_value;
    
    // Estimate productivity gained (mock calculation)
    this.computeCosts.opportunity_costs.productivity_gained = allanTimeSpent * 1.5; // 1.5x multiplier
  }

  // Store metrics snapshot
  async storeMetricsSnapshot() {
    const snapshot = {
      api_connections: this.apiConnections,
      compute_costs: this.computeCosts,
      total_daily_cost: parseFloat(this.getTotalDailyCost()),
      net_value: this.calculateNetValue(),
      timestamp: new Date().toISOString()
    };

    await this.db.run(`
      INSERT INTO connection_metrics_snapshots (
        snapshot_data, total_cost, net_value, timestamp
      ) VALUES (?, ?, ?, ?)
    `, [
      JSON.stringify(snapshot),
      snapshot.total_daily_cost,
      snapshot.net_value,
      snapshot.timestamp
    ]);
  }

  // Initialize database tables
  async initializeTables() {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS connection_metrics_snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        snapshot_data TEXT NOT NULL,
        total_cost REAL NOT NULL,
        net_value TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_connection_metrics_timestamp ON connection_metrics_snapshots (timestamp DESC);
    `);
  }
}

module.exports = ConnectionFitnessDashboard;
