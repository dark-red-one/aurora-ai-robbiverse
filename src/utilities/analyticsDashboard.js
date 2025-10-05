import { db } from "./db.js";
import { usageTracker } from "./usageTracker.js";

export async function registerAnalyticsRoutes(app) {
  // Main analytics dashboard
  app.get('/analytics/dashboard', async (request, reply) => {
    const html = `<!doctype html>
<html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Usage Analytics Dashboard</title>
<style>
/* Cursor + Databox Hybrid Aesthetic */
:root {
  --bg-primary: #1e1e1e;
  --bg-secondary: #252526;
  --bg-tertiary: #2d2d30;
  --border: #3c3c3c;
  --border-light: #464647;
  --text-primary: #cccccc;
  --text-secondary: #969696;
  --text-accent: #4fc1ff;
  --accent: #007acc;
  --success: #4caf50;
  --warning: #ff9800;
  --error: #f44336;
  --font-mono: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  --font-ui: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

* { box-sizing: border-box; }
body { 
  font-family: var(--font-ui);
  background: var(--bg-primary);
  color: var(--text-primary);
  margin: 0;
  padding: 20px;
  line-height: 1.6;
}

.dashboard {
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border);
}

.header h1 {
  margin: 0;
  color: var(--text-accent);
  font-size: 28px;
}

.refresh-btn {
  background: var(--accent);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.refresh-btn:hover {
  background: #005a9e;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 20px;
  transition: border-color 0.2s;
}

.card:hover {
  border-color: var(--border-light);
}

.card h3 {
  margin: 0 0 15px 0;
  color: var(--text-accent);
  font-size: 18px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.metric {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
}

.metric:last-child {
  border-bottom: none;
}

.metric-label {
  color: var(--text-secondary);
  font-size: 14px;
}

.metric-value {
  color: var(--text-primary);
  font-weight: 600;
  font-family: var(--font-mono);
}

.metric-value.success { color: var(--success); }
.metric-value.warning { color: var(--warning); }
.metric-value.error { color: var(--error); }

.chart-container {
  height: 200px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  font-style: italic;
}

.table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
}

.table th,
.table td {
  text-align: left;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border);
}

.table th {
  background: var(--bg-tertiary);
  color: var(--text-accent);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.table td {
  font-family: var(--font-mono);
  font-size: 13px;
}

.table tr:hover {
  background: var(--bg-tertiary);
}

.status-indicator {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 8px;
}

.status-indicator.success { background: var(--success); }
.status-indicator.warning { background: var(--warning); }
.status-indicator.error { background: var(--error); }

.loading {
  text-align: center;
  color: var(--text-secondary);
  font-style: italic;
}

.error {
  color: var(--error);
  background: rgba(244, 67, 54, 0.1);
  padding: 10px;
  border-radius: 4px;
  border: 1px solid var(--error);
}
</style>
</head><body>
  <div class="dashboard">
    <div class="header">
      <h1>📊 Usage Analytics Dashboard</h1>
      <button class="refresh-btn" onclick="refreshDashboard()">🔄 Refresh</button>
    </div>

    <div class="grid">
      <!-- Usage Overview -->
      <div class="card">
        <h3>📈 Usage Overview (7 days)</h3>
        <div id="usage-overview" class="loading">Loading...</div>
      </div>

      <!-- Cost Analysis -->
      <div class="card">
        <h3>💰 Cost Analysis</h3>
        <div id="cost-analysis" class="loading">Loading...</div>
      </div>

      <!-- Model Performance -->
      <div class="card">
        <h3>🚀 Model Performance</h3>
        <div id="model-performance" class="loading">Loading...</div>
      </div>

      <!-- Recent Activity -->
      <div class="card">
        <h3>⚡ Recent Activity</h3>
        <div id="recent-activity" class="loading">Loading...</div>
      </div>
    </div>

    <!-- Cost Trends Chart -->
    <div class="card">
      <h3>📊 Cost Trends (30 days)</h3>
      <div class="chart-container">
        <div>Cost trends visualization would go here</div>
      </div>
    </div>

    <!-- Top Expensive Operations -->
    <div class="card">
      <h3>💸 Most Expensive Operations</h3>
      <div id="expensive-ops" class="loading">Loading...</div>
    </div>

    <!-- Cost Per Token Analysis -->
    <div class="card">
      <h3>🔍 Cost Per Token Analysis</h3>
      <div id="cost-per-token" class="loading">Loading...</div>
    </div>
  </div>

  <script>
    async function fetchData(url) {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(\`HTTP \${response.status}\`);
        return await response.json();
      } catch (error) {
        console.error('Fetch error:', error);
        return { error: error.message };
      }
    }

    function formatCurrency(amount) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 4
      }).format(amount);
    }

    function formatNumber(num) {
      return new Intl.NumberFormat('en-US').format(num);
    }

    function formatDuration(ms) {
      if (ms < 1000) return \`\${ms}ms\`;
      if (ms < 60000) return \`\${(ms / 1000).toFixed(1)}s\`;
      return \`\${(ms / 60000).toFixed(1)}m\`;
    }

    function renderUsageOverview(data) {
      if (data.error) {
        document.getElementById('usage-overview').innerHTML = \`<div class="error">Error: \${data.error}</div>\`;
        return;
      }

      const analytics = data.analytics || [];
      if (analytics.length === 0) {
        document.getElementById('usage-overview').innerHTML = '<div class="loading">No data available</div>';
        return;
      }

      const total = analytics.reduce((acc, service) => ({
        requests: acc.requests + service.total_requests,
        cost: acc.cost + service.total_cost,
        tokens: acc.tokens + service.total_tokens,
        latency: acc.latency + service.avg_latency
      }), { requests: 0, cost: 0, tokens: 0, latency: 0 });

      const html = \`
        <div class="metric">
          <span class="metric-label">Total Requests</span>
          <span class="metric-value">\${formatNumber(total.requests)}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Total Cost</span>
          <span class="metric-value success">\${formatCurrency(total.cost)}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Total Tokens</span>
          <span class="metric-value">\${formatNumber(total.tokens)}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Avg Latency</span>
          <span class="metric-value">\${formatDuration(total.latency / analytics.length)}</span>
        </div>
      \`;
      document.getElementById('usage-overview').innerHTML = html;
    }

    function renderCostAnalysis(data) {
      if (data.error) {
        document.getElementById('cost-analysis').innerHTML = \`<div class="error">Error: \${data.error}</div>\`;
        return;
      }

      const trends = data.trends || [];
      if (trends.length === 0) {
        document.getElementById('cost-analysis').innerHTML = '<div class="loading">No data available</div>';
        return;
      }

      const today = trends[0];
      const yesterday = trends[1];
      const costChange = yesterday ? ((today.total_cost_usd - yesterday.total_cost_usd) / yesterday.total_cost_usd * 100) : 0;

      const html = \`
        <div class="metric">
          <span class="metric-label">Today's Cost</span>
          <span class="metric-value success">\${formatCurrency(today.total_cost_usd)}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Cost Change</span>
          <span class="metric-value \${costChange >= 0 ? 'warning' : 'success'}">\${costChange >= 0 ? '+' : ''}\${costChange.toFixed(1)}%</span>
        </div>
        <div class="metric">
          <span class="metric-label">Today's Requests</span>
          <span class="metric-value">\${formatNumber(today.total_requests)}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Success Rate</span>
          <span class="metric-value \${today.success_rate > 95 ? 'success' : today.success_rate > 90 ? 'warning' : 'error'}">\${today.success_rate.toFixed(1)}%</span>
        </div>
      \`;
      document.getElementById('cost-analysis').innerHTML = html;
    }

    function renderModelPerformance(data) {
      if (data.error) {
        document.getElementById('model-performance').innerHTML = \`<div class="error">Error: \${data.error}</div>\`;
        return;
      }

      const performance = data.performance || [];
      if (performance.length === 0) {
        document.getElementById('model-performance').innerHTML = '<div class="loading">No data available</div>';
        return;
      }

      const html = performance.slice(0, 5).map(model => \`
        <div class="metric">
          <span class="metric-label">\${model.model}</span>
          <span class="metric-value">\${formatDuration(model.avg_latency)}</span>
        </div>
      \`).join('');
      document.getElementById('model-performance').innerHTML = html;
    }

    function renderRecentActivity(data) {
      if (data.error) {
        document.getElementById('recent-activity').innerHTML = \`<div class="error">Error: \${data.error}</div>\`;
        return;
      }

      const rows = data.rows || [];
      if (rows.length === 0) {
        document.getElementById('recent-activity').innerHTML = '<div class="loading">No recent activity</div>';
        return;
      }

      const html = \`
        <table class="table">
          <thead>
            <tr>
              <th>Model</th>
              <th>Tokens</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            \${rows.slice(0, 10).map(row => \`
              <tr>
                <td>\${row.model}</td>
                <td>\${formatNumber(row.total_tokens)}</td>
                <td>\${formatDuration(row.duration_ms)}</td>
                <td>
                  <span class="status-indicator \${row.success ? 'success' : 'error'}"></span>
                  \${row.success ? 'Success' : 'Failed'}
                </td>
                <td>\${new Date(row.created_at).toLocaleTimeString()}</td>
              </tr>
            \`).join('')}
          </tbody>
        </table>
      \`;
      document.getElementById('recent-activity').innerHTML = html;
    }

    function renderExpensiveOps(data) {
      if (data.error) {
        document.getElementById('expensive-ops').innerHTML = \`<div class="error">Error: \${data.error}</div>\`;
        return;
      }

      const expensive = data.expensive || [];
      if (expensive.length === 0) {
        document.getElementById('expensive-ops').innerHTML = '<div class="loading">No expensive operations</div>';
        return;
      }

      const html = \`
        <table class="table">
          <thead>
            <tr>
              <th>Service</th>
              <th>Endpoint</th>
              <th>Model</th>
              <th>Cost</th>
              <th>Duration</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            \${expensive.map(op => \`
              <tr>
                <td>\${op.service}</td>
                <td>\${op.endpoint}</td>
                <td>\${op.model || 'N/A'}</td>
                <td class="metric-value error">\${formatCurrency(op.cost_usd)}</td>
                <td>\${formatDuration(op.latency_ms)}</td>
                <td>\${new Date(op.created_at).toLocaleTimeString()}</td>
              </tr>
            \`).join('')}
          </tbody>
        </table>
      \`;
      document.getElementById('expensive-ops').innerHTML = html;
    }

    function renderCostPerToken(data) {
      if (data.error) {
        document.getElementById('cost-per-token').innerHTML = \`<div class="error">Error: \${data.error}</div>\`;
        return;
      }

      const costPerToken = data.costPerToken || [];
      if (costPerToken.length === 0) {
        document.getElementById('cost-per-token').innerHTML = '<div class="loading">No cost per token data</div>';
        return;
      }

      const html = \`
        <table class="table">
          <thead>
            <tr>
              <th>Service</th>
              <th>Model</th>
              <th>Cost/Token</th>
              <th>Total Cost</th>
              <th>Total Tokens</th>
            </tr>
          </thead>
          <tbody>
            \${costPerToken.map(item => \`
              <tr>
                <td>\${item.service}</td>
                <td>\${item.model || 'N/A'}</td>
                <td class="metric-value">\${formatCurrency(item.cost_per_token)}</td>
                <td class="metric-value success">\${formatCurrency(item.total_cost)}</td>
                <td>\${formatNumber(item.total_tokens)}</td>
              </tr>
            \`).join('')}
          </tbody>
        </table>
      \`;
      document.getElementById('cost-per-token').innerHTML = html;
    }

    async function refreshDashboard() {
      // Show loading states
      document.querySelectorAll('.loading').forEach(el => {
        el.textContent = 'Loading...';
      });

      try {
        const [usageData, costData, modelData, recentData, expensiveData, costPerTokenData] = await Promise.all([
          fetchData('/llm/analytics/usage'),
          fetchData('/llm/analytics/costs?days=7'),
          fetchData('/llm/analytics/models'),
          fetchData('/llm/usage/recent'),
          fetchData('/llm/analytics/expensive?limit=10'),
          fetchData('/llm/analytics/cost-per-token')
        ]);

        renderUsageOverview(usageData);
        renderCostAnalysis(costData);
        renderModelPerformance(modelData);
        renderRecentActivity(recentData);
        renderExpensiveOps(expensiveData);
        renderCostPerToken(costPerTokenData);
      } catch (error) {
        console.error('Dashboard refresh error:', error);
      }
    }

    // Initial load
    refreshDashboard();

    // Auto-refresh every 30 seconds
    setInterval(refreshDashboard, 30000);
  </script>
</body></html>`;

    reply.headers({ 'content-type': 'text/html; charset=utf-8' }).send(html);
  });
}
